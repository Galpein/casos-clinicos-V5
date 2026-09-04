/**
 * Motor de normalización contra el Atlas Concept Dictionary.
 *
 * Compara un texto detectado (en el caso, en un PPT, en el chat) contra los
 * términos del diccionario y propone el concepto interno. Es deliberadamente
 * simple en el MVP (match exacto/substring sobre términos normalizados); la
 * arquitectura permite sustituirlo por algo más potente sin tocar a quien lo
 * llama. Las siglas ambiguas se marcan para requerir validación del HCP.
 */

import { ATLAS_CONCEPTS } from "@/mock/atlasDictionary";
import type { AtlasConcept, ConceptType } from "@/types/concepts";

/** minúsculas + sin acentos + espacios colapsados. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ConceptMatch {
  conceptId: string;
  label: string;
  conceptType: ConceptType;
  confidence: number;
  ambiguous: boolean;
}

export function getConcept(conceptId: string): AtlasConcept | undefined {
  return ATLAS_CONCEPTS.find((c) => c.conceptId === conceptId);
}

export function conceptLabel(conceptId: string | null): string | null {
  if (!conceptId) return null;
  return getConcept(conceptId)?.preferredLabelEs ?? null;
}

/**
 * Resuelve un texto al mejor concepto del diccionario.
 * @param text  texto detectado en el caso
 * @param type  si se conoce, restringe la búsqueda a un tipo (diagnosis, drug…)
 */
export function resolveConcept(
  text: string,
  type?: ConceptType,
): ConceptMatch | null {
  const q = normalizeText(text);
  if (!q) return null;

  let best: ConceptMatch | null = null;

  for (const concept of ATLAS_CONCEPTS) {
    if (type && concept.conceptType !== type) continue;

    for (const t of concept.terms) {
      const term = normalizeText(t.term);
      let confidence = 0;
      if (term === q) confidence = t.ambiguous ? 0.8 : 0.99;
      else if (q.includes(term) && term.length >= 4)
        confidence = t.ambiguous ? 0.7 : 0.9;
      else if (term.includes(q) && q.length >= 4) confidence = 0.75;

      if (confidence > 0 && (!best || confidence > best.confidence)) {
        best = {
          conceptId: concept.conceptId,
          label: concept.preferredLabelEs,
          conceptType: concept.conceptType,
          confidence,
          ambiguous: !!t.ambiguous,
        };
      }
    }
  }

  return best;
}

/** Búsqueda libre del diccionario (para autocompletar/validación en UI). */
export function searchConcepts(query: string, type?: ConceptType): AtlasConcept[] {
  const q = normalizeText(query);
  if (!q) return [];
  return ATLAS_CONCEPTS.filter((c) => {
    if (type && c.conceptType !== type) return false;
    return c.terms.some((t) => normalizeText(t.term).includes(q));
  });
}
