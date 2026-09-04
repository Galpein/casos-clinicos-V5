/**
 * Agregación de analítica sobre el Library Index.
 *
 * El cliente elige QUÉ ver (dimensión) y opcionalmente filtra. Cada vista lleva
 * su "robustez de datos" (cuántos casos la respaldan): vender datos agregados
 * exige decir honestamente si una cifra sale de 3 casos o de 100.
 */

import type { LibraryIndex } from "@/types/library-index";
import { STATUS_META } from "@/lib/case-status";
import { ageGroupLabel, outcomeLabel, sexLabel } from "@/lib/labels";

export type Dimension =
  | "diagnosis"
  | "treatment"
  | "outcome"
  | "specialty"
  | "sex"
  | "ageGroup"
  | "status"
  | "adverseEvent";

export const DIMENSION_LABEL: Record<Dimension, string> = {
  diagnosis: "Patología",
  treatment: "Tratamiento",
  outcome: "Resultado clínico",
  specialty: "Especialidad",
  sex: "Sexo",
  ageGroup: "Grupo de edad",
  status: "Estado del caso",
  adverseEvent: "Eventos adversos",
};

export interface Filters {
  diagnosis?: string;
  treatment?: string;
}

export interface Bucket {
  label: string;
  count: number;
  /** % sobre el nº de casos de la vista. */
  pct: number;
}

export type Robustness = "high" | "medium" | "low";

export interface Aggregation {
  dimension: Dimension;
  buckets: Bucket[];
  /** nº de casos que respaldan la vista (tras filtros). */
  nCases: number;
  robustness: Robustness;
  filters: Filters;
}

export const ROBUSTNESS_META: Record<
  Robustness,
  { label: string; hint: string; soft: string; dot: string }
> = {
  high: { label: "Robusto", hint: "Base amplia", soft: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  medium: { label: "Moderado", hint: "Base media", soft: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  low: { label: "Limitado", hint: "Pocos casos — interpretar con cautela", soft: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

function robustnessOf(n: number): Robustness {
  if (n >= 10) return "high";
  if (n >= 5) return "medium";
  return "low";
}

function matchesFilters(idx: LibraryIndex, f: Filters): boolean {
  if (f.diagnosis && !idx.primaryDiagnosis.some((d) => d.label === f.diagnosis)) return false;
  if (f.treatment && !idx.treatments.some((t) => t.label === f.treatment)) return false;
  return true;
}

/** Valores que aporta un caso a una dimensión (puede ser multivaluado). */
function valuesFor(idx: LibraryIndex, dim: Dimension): string[] {
  switch (dim) {
    case "diagnosis":
      return idx.primaryDiagnosis.map((d) => d.label);
    case "treatment":
      return idx.treatments.map((t) => t.label);
    case "outcome":
      return idx.outcomes
        .filter((o) => !o.adverseEvent)
        .map((o) => outcomeLabel[o.globalOutcome as keyof typeof outcomeLabel] ?? o.globalOutcome);
    case "specialty":
      return idx.specialty.map((s) => s.label);
    case "sex":
      return [sexLabel[idx.patient.sex]];
    case "ageGroup":
      return [ageGroupLabel[idx.patient.ageGroup]];
    case "status":
      return [STATUS_META[idx.caseStatusColor].label];
    case "adverseEvent":
      return idx.adverseEvents.length ? idx.adverseEvents : ["Sin eventos adversos"];
  }
}

export function aggregate(
  indexes: LibraryIndex[],
  dimension: Dimension,
  filters: Filters = {},
): Aggregation {
  const filtered = indexes.filter((idx) => matchesFilters(idx, filters));
  const nCases = filtered.length;

  const counts = new Map<string, number>();
  for (const idx of filtered) {
    const seen = new Set<string>();
    for (const v of valuesFor(idx, dimension)) {
      if (!v || seen.has(v)) continue; // un caso cuenta una vez por bucket
      seen.add(v);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }

  const buckets: Bucket[] = [...counts.entries()]
    .map(([label, count]) => ({ label, count, pct: nCases ? Math.round((count / nCases) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);

  return { dimension, buckets, nCases, robustness: robustnessOf(nCases), filters };
}

/** KPIs de cabecera para el dashboard del cliente. */
export function summaryKpis(indexes: LibraryIndex[]) {
  const diagnoses = new Set<string>();
  const treatments = new Set<string>();
  let validated = 0;
  let withAe = 0;
  for (const idx of indexes) {
    idx.primaryDiagnosis.forEach((d) => diagnoses.add(d.label));
    idx.treatments.forEach((t) => treatments.add(t.label));
    if (idx.primaryDiagnosis.some((d) => d.validatedByHcp)) validated++;
    if (idx.adverseEvents.length) withAe++;
  }
  return {
    totalCases: indexes.length,
    diagnoses: diagnoses.size,
    treatments: treatments.size,
    validatedPct: indexes.length ? Math.round((validated / indexes.length) * 100) : 0,
    withAdverseEvents: withAe,
  };
}

export function distinctValues(indexes: LibraryIndex[], dim: "diagnosis" | "treatment"): string[] {
  const set = new Set<string>();
  for (const idx of indexes) {
    const vals = dim === "diagnosis" ? idx.primaryDiagnosis.map((d) => d.label) : idx.treatments.map((t) => t.label);
    vals.forEach((v) => v && set.add(v));
  }
  return [...set].sort();
}
