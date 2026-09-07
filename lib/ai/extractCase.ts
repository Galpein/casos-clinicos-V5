/**
 * Extracción de entidades clínicas con IA.
 *
 * La IA sólo **lee** el relato y devuelve entidades en bruto. No redacta el
 * caso ni decide nada: los términos que propone se resuelven después contra el
 * Atlas Concept Dictionary, y lo que no encaja se queda como texto marcado
 * como propuesto. Ese es el control de calidad: el vocabulario lo pone la casa,
 * no el modelo.
 */

import { generateJson } from "./gemini";

export interface AiEntities {
  age: number | null;
  sex: "female" | "male" | "other" | null;
  diagnosis: string | null;
  treatments: string[];
  findings: string | null;
  outcome: string | null;
  specialty: string | null;
  timeline: { when: string; event: string }[];
  tags: string[];
}

const SCHEMA = {
  type: "object",
  properties: {
    age: { type: "integer", nullable: true },
    sex: { type: "string", enum: ["female", "male", "other"], nullable: true },
    diagnosis: { type: "string", nullable: true },
    treatments: { type: "array", items: { type: "string" } },
    findings: { type: "string", nullable: true },
    outcome: { type: "string", nullable: true },
    specialty: { type: "string", nullable: true },
    timeline: {
      type: "array",
      items: {
        type: "object",
        properties: { when: { type: "string" }, event: { type: "string" } },
        required: ["when", "event"],
      },
    },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["treatments", "timeline", "tags"],
} as const;

const INSTRUCCIONES = `Eres un extractor de datos clínicos. Lees el relato de un caso
escrito por un profesional sanitario y devuelves únicamente los datos que el texto
dice, en JSON.

Reglas estrictas:
- No inventes nada. Si un dato no está en el texto, devuélvelo como null o lista vacía.
- No diagnostiques ni recomiendes: sólo extraes lo que el profesional ha escrito.
- "diagnosis" es la patología principal, en español y en singular.
- "treatments" son TODAS las actuaciones terapéuticas mencionadas, una por
  elemento: tanto fármacos (por su principio activo, sin dosis ni pauta) como
  intervenciones no farmacológicas (cirugía, radioterapia, fototerapia,
  evitación del alérgeno, fisioterapia...). Si el texto dice que se operó, la
  cirugía es un tratamiento y debe aparecer.
- "findings" resume en una frase los hallazgos de la exploración, si los hay.
- "outcome" describe en pocas palabras cómo evolucionó, si el texto lo dice.
- "specialty" es la especialidad médica principal, en su forma amplia y en
  español con tildes: "Oncología", "Dermatología", "Pediatría", "Neurología".
  No uses subespecialidades ("Oncología pediátrica" → "Oncología").
- "timeline" son hitos temporales explícitos del texto ("a las 6 semanas...").
- "tags" son 3-5 palabras clave para buscar el caso, en español y con tildes.

Relato del profesional:
"""
{TEXTO}
"""`;

export async function extractWithAi(text: string, model?: string) {
  return generateJson<AiEntities>(INSTRUCCIONES.replace("{TEXTO}", text.slice(0, 6000)), SCHEMA as never, {
    model,
  });
}
