/**
 * Migraciones. Sin herramienta externa: el esquema es pequeño y se aplica
 * entero de forma idempotente (todo es CREATE ... IF NOT EXISTS).
 *
 * Se ejecuta una sola vez por proceso, la primera vez que alguien toca la
 * base de datos, y siembra los casos de demostración si la tabla está vacía.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "./client";

let ready = false;
let inflight: Promise<void> | null = null;

async function run(): Promise<void> {
  const sql = db();
  if (!sql) {
    ready = true;
    return;
  }

  if (process.env.RUN_MIGRATIONS === "0") {
    console.warn("[db] RUN_MIGRATIONS=0: no se aplica el esquema.");
    ready = true;
    return;
  }

  const schema = await readFile(join(process.cwd(), "lib/db/schema.sql"), "utf8");
  await sql.unsafe(schema);

  // El esquema ya está: se marca listo ANTES de sembrar, porque la siembra
  // escribe a través del repositorio y el repositorio vuelve a pedir esquema.
  // Sin esto, el proceso se espera a sí mismo.
  ready = true;

  const [{ count }] = await sql<{ count: string }[]>`select count(*)::text as count from cases`;
  if (Number(count) === 0) {
    const { seedDemoCases } = await import("./seed");
    await seedDemoCases();
  }
}

export function ensureSchema(): Promise<void> {
  if (ready) return Promise.resolve();
  inflight ??= run().catch((e) => {
    inflight = null;
    throw e;
  });
  return inflight;
}
