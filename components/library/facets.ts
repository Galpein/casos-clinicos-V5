/**
 * Lógica de la búsqueda facetada de la biblioteca.
 *
 * Separada de la interfaz porque es donde está lo delicado: los contadores de
 * cada faceta se calculan aplicando TODOS los demás filtros menos el propio.
 * Si se contara sobre el resultado final, al marcar una opción el resto
 * caerían a cero y no se podría añadir un segundo valor a la misma faceta.
 */

import type { LibraryIndex } from "@/types/library-index";
import { STATUS_META } from "@/lib/case-status";
import { sexLabel } from "@/lib/labels";

export type FacetKey = "specialty" | "diagnosis" | "treatment" | "level" | "sex" | "caseType";

export type Selection = Record<FacetKey, string[]>;

export const EMPTY_SELECTION: Selection = {
  specialty: [],
  diagnosis: [],
  treatment: [],
  level: [],
  sex: [],
  caseType: [],
};

export const FACET_LABELS: Record<FacetKey, string> = {
  specialty: "Especialidad",
  diagnosis: "Patología",
  treatment: "Tratamiento",
  level: "Nivel documental",
  sex: "Sexo del paciente",
  caseType: "Reto clínico",
};

/** Valores de un caso para cada faceta. */
export function valuesOf(index: LibraryIndex, key: FacetKey): string[] {
  switch (key) {
    case "specialty":
      return index.specialty.map((s) => s.label);
    case "diagnosis":
      return index.primaryDiagnosis.map((d) => d.label);
    case "treatment":
      return index.treatments.map((t) => t.label);
    case "level":
      return [STATUS_META[index.caseStatusColor].label];
    case "sex":
      return [sexLabel[index.patient.sex]];
    case "caseType":
      return index.caseType;
  }
}

export function matchesText(index: LibraryIndex, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  // La búsqueda cae sobre los conceptos normalizados, no sólo sobre el texto
  // literal: buscar "corticoide" encuentra los casos de hidrocortisona.
  const haystack = [
    index.title,
    index.summary,
    ...index.searchTags,
    ...index.primaryDiagnosis.map((d) => d.label),
    ...index.treatments.map((t) => `${t.label} ${t.therapeuticClass ?? ""}`),
    ...index.specialty.map((s) => s.label),
    ...index.caseType,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesFacet(index: LibraryIndex, key: FacetKey, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const vals = valuesOf(index, key);
  return selected.some((s) => vals.includes(s));
}

/** Filtra aplicando todas las facetas salvo, opcionalmente, una. */
export function applyFilters(
  items: LibraryIndex[],
  query: string,
  sel: Selection,
  except?: FacetKey,
): LibraryIndex[] {
  const keys = (Object.keys(sel) as FacetKey[]).filter((k) => k !== except);
  return items.filter(
    (i) => matchesText(i, query) && keys.every((k) => matchesFacet(i, k, sel[k])),
  );
}

export interface FacetOption {
  value: string;
  count: number;
}

/** Opciones de una faceta con su contador, ya ordenadas. */
export function facetOptions(
  items: LibraryIndex[],
  query: string,
  sel: Selection,
  key: FacetKey,
): FacetOption[] {
  const base = applyFilters(items, query, sel, key);
  const counts = new Map<string, number>();
  for (const i of base) {
    for (const v of new Set(valuesOf(i, key))) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  // Las opciones ya marcadas se mantienen aunque su cuenta sea cero.
  for (const v of sel[key]) if (!counts.has(v)) counts.set(v, 0);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export type SortField = "updatedAt" | "title" | "diagnosis" | "level";

export function sortItems(items: LibraryIndex[], field: SortField, dir: 1 | -1): LibraryIndex[] {
  const order = { red: 0, orange: 1, green: 2 };
  return [...items].sort((a, b) => {
    let cmp = 0;
    if (field === "updatedAt") cmp = a.updatedAt.localeCompare(b.updatedAt);
    else if (field === "title") cmp = a.title.localeCompare(b.title, "es");
    else if (field === "diagnosis")
      cmp = (a.primaryDiagnosis[0]?.label ?? "").localeCompare(b.primaryDiagnosis[0]?.label ?? "", "es");
    else cmp = order[a.caseStatusColor] - order[b.caseStatusColor];
    return cmp * dir;
  });
}
