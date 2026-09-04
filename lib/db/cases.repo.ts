/**
 * Repositorio de casos. Única puerta de entrada a los datos.
 *
 * Dos implementaciones tras la misma interfaz: Postgres cuando hay
 * DATABASE_URL y memoria cuando no la hay. El resto de la aplicación no sabe
 * cuál está usando.
 *
 * Reglas de producto que viven aquí (revisión de Enrique):
 *  - Un caso entra en la biblioteca en cuanto deja de ser borrador, y ya no
 *    sale: si el autor lo borra después, desaparece de su pantalla pero la
 *    entrada de biblioteca permanece.
 *  - Un borrador que nunca llegó a la biblioteca sí se borra del todo.
 */

import type { ClinicalCase } from "@/types/clinical-case";
import { computeCaseStatus } from "@/lib/case-status";
import { hydrateCase } from "@/lib/case-factory";
import { deriveLibraryIndex } from "@/lib/library-index";
import type { LibraryIndex } from "@/types/library-index";
import { db } from "./client";
import { ensureSchema } from "./migrate";

export interface StoredCase {
  caso: ClinicalCase;
  index: LibraryIndex;
  inLibrary: boolean;
  deletedByAuthor: boolean;
}

function normalize(input: ClinicalCase): ClinicalCase {
  // Se completa antes de calcular nada: el autoguardado manda casos a medias.
  const c = hydrateCase(input);
  const status = computeCaseStatus(c);
  return { ...c, status: status.status, statusColor: status.color };
}

// ── Implementación en memoria (sin DATABASE_URL) ────────────────────────────

const memory = new Map<string, StoredCase>();

const mem = {
  async listByAuthor(authorId: string) {
    return [...memory.values()]
      .filter((r) => r.caso.authorId === authorId && !r.deletedByAuthor)
      .sort(byUpdatedDesc);
  },
  async listLibrary() {
    return [...memory.values()].filter((r) => r.inLibrary).sort(byUpdatedDesc);
  },
  async get(id: string) {
    return memory.get(id) ?? null;
  },
  async save(caso: ClinicalCase) {
    const c = normalize(caso);
    const prev = memory.get(c.caseId);
    const row: StoredCase = {
      caso: c,
      index: deriveLibraryIndex(c),
      inLibrary: (prev?.inLibrary ?? false) || c.statusColor !== "red",
      deletedByAuthor: prev?.deletedByAuthor ?? false,
    };
    memory.set(c.caseId, row);
    return row;
  },
  async remove(id: string) {
    const row = memory.get(id);
    if (!row) return "missing" as const;
    if (row.inLibrary) {
      memory.set(id, { ...row, deletedByAuthor: true });
      return "kept_in_library" as const;
    }
    memory.delete(id);
    return "deleted" as const;
  },
};

function byUpdatedDesc(a: StoredCase, b: StoredCase) {
  return (b.caso.updatedAt ?? "").localeCompare(a.caso.updatedAt ?? "");
}

// ── Implementación Postgres ─────────────────────────────────────────────────

interface Row {
  doc: ClinicalCase;
  index_doc: LibraryIndex | null;
  in_library: boolean;
  deleted_by_author: boolean;
}

function toStored(r: Row): StoredCase {
  return {
    caso: r.doc,
    index: r.index_doc ?? deriveLibraryIndex(r.doc),
    inLibrary: r.in_library,
    deletedByAuthor: r.deleted_by_author,
  };
}

export const casesRepo = {
  async listByAuthor(authorId: string): Promise<StoredCase[]> {
    const sql = db();
    if (!sql) return mem.listByAuthor(authorId);
    await ensureSchema();
    const rows = await sql<Row[]>`
      select doc, index_doc, in_library, deleted_by_author
      from cases
      where author_id = ${authorId} and deleted_by_author = false
      order by updated_at desc`;
    return rows.map(toStored);
  },

  async listLibrary(): Promise<StoredCase[]> {
    const sql = db();
    if (!sql) return mem.listLibrary();
    await ensureSchema();
    const rows = await sql<Row[]>`
      select doc, index_doc, in_library, deleted_by_author
      from cases
      where in_library = true
      order by updated_at desc`;
    return rows.map(toStored);
  },

  async get(id: string): Promise<StoredCase | null> {
    const sql = db();
    if (!sql) return mem.get(id);
    await ensureSchema();
    const rows = await sql<Row[]>`
      select doc, index_doc, in_library, deleted_by_author
      from cases where case_id = ${id} limit 1`;
    return rows[0] ? toStored(rows[0]) : null;
  },

  /** Alta o actualización. Es lo que usa el autoguardado. */
  async save(caso: ClinicalCase): Promise<StoredCase> {
    const sql = db();
    if (!sql) return mem.save(caso);
    await ensureSchema();

    const c = normalize(caso);
    const index = deriveLibraryIndex(c);
    const entersLibrary = c.statusColor !== "red";

    const rows = await sql<Row[]>`
      insert into cases (case_id, author_id, title, status, status_color,
                         in_library, created_at, updated_at, doc, index_doc)
      values (${c.caseId}, ${c.authorId}, ${c.title}, ${c.status}, ${c.statusColor},
              ${entersLibrary}, ${c.createdAt}, ${c.updatedAt},
              ${sql.json(c as never)}, ${sql.json(index as never)})
      on conflict (case_id) do update set
        title        = excluded.title,
        status       = excluded.status,
        status_color = excluded.status_color,
        -- una vez en la biblioteca, no sale
        in_library   = cases.in_library or excluded.in_library,
        updated_at   = excluded.updated_at,
        doc          = excluded.doc,
        index_doc    = excluded.index_doc
      returning doc, index_doc, in_library, deleted_by_author`;
    return toStored(rows[0]);
  },

  /**
   * Borrado desde la pantalla del autor. Devuelve qué ocurrió realmente para
   * poder decírselo al usuario sin mentirle.
   */
  async remove(id: string): Promise<"deleted" | "kept_in_library" | "missing"> {
    const sql = db();
    if (!sql) return mem.remove(id);
    await ensureSchema();

    const rows = await sql<{ in_library: boolean }[]>`
      select in_library from cases where case_id = ${id} limit 1`;
    if (!rows[0]) return "missing";

    if (rows[0].in_library) {
      await sql`update cases set deleted_by_author = true, updated_at = now() where case_id = ${id}`;
      return "kept_in_library";
    }
    await sql`delete from cases where case_id = ${id}`;
    return "deleted";
  },

  async count(): Promise<number> {
    const sql = db();
    if (!sql) return memory.size;
    await ensureSchema();
    const [{ count }] = await sql<{ count: string }[]>`select count(*)::text as count from cases`;
    return Number(count);
  },
};
