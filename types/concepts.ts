/**
 * Atlas Concept Dictionary y referencias normalizadas.
 *
 * Idea central del diseño de indexación: nunca buscar solo por texto literal.
 * Cada término detectado en un caso ("SCD", "drepanocitosis", "sickle cell
 * disease") se mapea a un concepto interno común (`atlas_disease_...`). La
 * biblioteca y la analítica trabajan sobre conceptos, no sobre texto libre.
 *
 * En el MVP el diccionario es pequeño y propio. La arquitectura deja sitio
 * para colgar códigos externos (SNOMED, ICD, ATC...) en fases posteriores.
 */

export type ConceptType =
  | "diagnosis"
  | "drug"
  | "product"
  | "procedure"
  | "outcome"
  | "adverse_event"
  | "biomarker"
  | "specialty"
  | "case_type"
  | "other";

export type CodeSystem =
  | "SNOMED_CT"
  | "ICD"
  | "MeSH"
  | "ATC"
  | "LOINC"
  | "MedDRA"
  | "CTCAE"
  | "EMDN"
  | "LOCAL";

/** Código externo asociado a un concepto. En MVP suele ir vacío. */
export interface ExternalCode {
  system: CodeSystem;
  code: string;
  display?: string;
  version?: string;
  source?: "manual" | "imported" | "ai_suggested";
  confidence?: number;
  validatedByHcp?: boolean;
}

/** Un término concreto que apunta a un concepto (sinónimo, sigla, marca...). */
export interface ConceptTerm {
  term: string;
  language: "es" | "en" | "pt";
  termType:
    | "preferred"
    | "synonym"
    | "abbreviation"
    | "brand"
    | "misspelling"
    | "lay_term";
  /** Siglas ambiguas (p.ej. "SCD") requieren contexto o validación humana. */
  ambiguous?: boolean;
}

/** Entrada del diccionario interno de AtlasCases. */
export interface AtlasConcept {
  conceptId: string; // p.ej. "atlas_disease_atopic_dermatitis"
  conceptType: ConceptType;
  preferredLabelEs: string;
  preferredLabelEn?: string;
  preferredLabelPt?: string;
  description?: string;
  /** Principio activo, para marcas de fármaco que apuntan a su molécula. */
  activeIngredientConceptId?: string;
  therapeuticClass?: string;
  terms: ConceptTerm[];
  externalCodes: ExternalCode[];
  status: "active" | "deprecated" | "draft";
}

/**
 * Referencia desde un caso a un concepto normalizado. Guarda SIEMPRE el texto
 * original (sección 15.1: no sobrescribir el texto original) + el concepto
 * propuesto + confianza + si lo validó un HCP.
 */
export interface ConceptRef {
  /** Texto tal cual aparece en el caso ("Hydrea", "SCD"). */
  textFound: string;
  /** Concepto Atlas al que se mapea, o null si aún no resuelto. */
  conceptId: string | null;
  /** Etiqueta legible del concepto resuelto, para pintar sin re-resolver. */
  normalizedLabel?: string;
  confidence?: number;
  status: "pending_review" | "validated" | "rejected" | "ambiguous";
  validatedByHcp: boolean;
}

/** Crea una referencia de concepto a partir de una resolución del diccionario. */
export function conceptRef(
  textFound: string,
  match: { conceptId: string; label: string; confidence: number } | null,
): ConceptRef {
  if (!match) {
    return {
      textFound,
      conceptId: null,
      status: "pending_review",
      validatedByHcp: false,
    };
  }
  return {
    textFound,
    conceptId: match.conceptId,
    normalizedLabel: match.label,
    confidence: match.confidence,
    status: match.confidence >= 0.85 ? "pending_review" : "ambiguous",
    validatedByHcp: false,
  };
}
