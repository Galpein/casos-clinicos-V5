/**
 * Extracción de entidades clínicas de texto libre (chat, PPT, historia).
 *
 * Deliberadamente simple: escanea el texto contra los términos del Atlas
 * Concept Dictionary y unos pocos patrones (edad, sexo). Lo que importa es la
 * forma: todo lo extraído se mapea a conceptos normalizados, nunca a texto
 * suelto. Un motor real (Claude) devolvería esta misma estructura.
 */

import { ATLAS_CONCEPTS } from "@/mock/atlasDictionary";
import type { ConceptType } from "@/types/concepts";
import type { Sex } from "@/types/clinical-case";
import { normalizeText } from "@/lib/dictionary";

export interface ExtractedConcept {
  conceptId: string;
  label: string;
  conceptType: ConceptType;
  textFound: string;
  confidence: number;
}

/** Encuentra todos los conceptos de un tipo cuyos términos aparecen en el texto. */
export function extractConcepts(text: string, type: ConceptType): ExtractedConcept[] {
  const norm = ` ${normalizeText(text)} `;
  const found: ExtractedConcept[] = [];
  const seen = new Set<string>();

  for (const concept of ATLAS_CONCEPTS) {
    if (concept.conceptType !== type) continue;
    for (const t of concept.terms) {
      const term = normalizeText(t.term);
      if (term.length < 3) continue;
      if (norm.includes(` ${term} `) || norm.includes(`${term}`)) {
        if (seen.has(concept.conceptId)) continue;
        seen.add(concept.conceptId);
        found.push({
          conceptId: concept.conceptId,
          label: concept.preferredLabelEs,
          conceptType: type,
          textFound: t.term,
          confidence: t.ambiguous ? 0.78 : 0.92,
        });
        break;
      }
    }
  }
  return found;
}

export function extractAge(text: string): number | null {
  const m = text.match(/(\d{1,3})\s*(años?|a\b|yo\b)/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n > 0 && n < 120) return n;
  }
  return null;
}

export function extractSex(text: string): Sex | null {
  const n = normalizeText(text);
  if (/\b(mujer|femenina|female|chica|nina)\b/.test(n)) return "female";
  if (/\b(varon|hombre|male|chico|nino)\b/.test(n)) return "male";
  return null;
}

const SYMPTOM_LEXICON = [
  "picor", "prurito", "eritema", "descamacion", "placas", "vesiculas",
  "pustulas", "papulas", "habones", "angioedema", "ardor", "edema", "lesiones",
];

export function extractSymptoms(text: string): string[] {
  const n = normalizeText(text);
  return SYMPTOM_LEXICON.filter((s) => n.includes(s));
}
