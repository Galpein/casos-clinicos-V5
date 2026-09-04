import type {
  ClinicalCase,
  Treatment,
  TreatmentType,
} from "@/types/clinical-case";
import { manualField } from "@/types/field";
import { conceptRef, type ConceptRef } from "@/types/concepts";
import { getConcept, resolveConcept } from "@/lib/dictionary";
import { blankCase, withComputedStatus } from "@/lib/case-factory";

// ── Builders compactos ───────────────────────────────────────────────────────

const mf = manualField;

/** ConceptRef validado por HCP a partir del diccionario. */
function ref(text: string, type: Parameters<typeof resolveConcept>[1]): ConceptRef {
  const m = resolveConcept(text, type);
  const r = conceptRef(
    text,
    m ? { conceptId: m.conceptId, label: m.label, confidence: m.confidence } : null,
  );
  return { ...r, status: "validated", validatedByHcp: true };
}

function drug(
  name: string,
  opts: Partial<Treatment> & { validated?: boolean } = {},
): Treatment {
  const { validated = true, ...rest } = opts;
  const m = resolveConcept(name, "drug");
  return {
    type: (rest.type as TreatmentType) ?? "drug",
    name,
    therapeuticClass: m ? getConcept(m.conceptId)?.therapeuticClass : undefined,
    status: "present",
    validatedByHcp: validated,
    concept: m
      ? {
          ...conceptRef(name, {
            conceptId: m.conceptId,
            label: m.label,
            confidence: m.confidence,
          }),
          status: validated ? "validated" : "pending_review",
          validatedByHcp: validated,
        }
      : null,
    codes: [],
    ...rest,
  };
}

function seedCase(over: Partial<ClinicalCase>): ClinicalCase {
  return withComputedStatus({ ...blankCase(), ...over });
}

// ── 1. Dermatitis atópica — VERDE (care_ready) ───────────────────────────────

const c1 = seedCase({
  caseId: "DA-034-F",
  title: "Dermatitis atópica moderada en mujer de 34 años",
  createdAt: "2026-03-10T09:00:00Z",
  updatedAt: "2026-03-10T09:00:00Z",
  summary: mf(
    "Mujer de 34 años con dermatitis atópica moderada de localización flexural, " +
      "buena respuesta a inhibidor de la calcineurina tras fracaso de corticoide.",
  ),
  patient: {
    ageGroup: "adult",
    ageValue: mf(34),
    sex: "female",
    clinicalContext: mf(
      "Antecedente de rinitis alérgica. Brotes estacionales sin infección secundaria.",
    ),
    deIdentified: true,
  },
  mainReason: mf(
    "Mostrar el manejo escalonado de la DA moderada cuando falla el corticoide tópico.",
  ),
  background: mf("Rinitis alérgica. Alergia a níquel y perfumes. No atopia familiar conocida."),
  keyFindings: mf("Eccema en pliegues de codo bilateral, eritema y descamación. Picor intenso (EASI 12)."),
  timeline: [
    { when: "Semana 0", event: "Brote estacional, inicia corticoide tópico", validatedByHcp: true },
    { when: "Semana 2", event: "Respuesta parcial, persiste prurito", validatedByHcp: true },
    { when: "Semana 4", event: "Cambio a tacrolimus tópico", validatedByHcp: true },
    { when: "Semana 8", event: "Lesiones casi resueltas", validatedByHcp: true },
  ],
  primaryDiagnosis: {
    label: mf("Dermatitis atópica moderada"),
    concept: ref("dermatitis atópica", "diagnosis"),
    isSuspected: false,
    codes: [],
  },
  diagnosticAssessment: {
    testsPerformed: mf("IgE total (320 kU/L). Pruebas epicutáneas: positivo a níquel."),
    reasoning: mf("Distribución flexural + atopia + IgE elevada compatibles con DA."),
    differentials: ["Eccema de contacto", "Psoriasis invertida"],
  },
  management: [
    drug("Hidrocortisona", { lineOfTherapy: "1ª línea", dose: "1%", duration: "2 semanas" }),
    drug("Tacrolimus", { lineOfTherapy: "2ª línea", dose: "0.1%", duration: "4 semanas", reasonForUse: "Fracaso del corticoide" }),
  ],
  followUp: [
    {
      globalOutcome: "improved",
      outcomeType: "clinical",
      magnitude: "EASI 12 → 3",
      timeToOutcome: "8 semanas",
      narrative: "Mejoría marcada, control del prurito.",
      validatedByHcp: true,
    },
  ],
  keyLearning: mf(
    "En DA moderada flexural, el inhibidor de la calcineurina es buena 2ª línea " +
      "ahorradora de corticoide en zonas de piel fina.",
  ),
  privacy: { visibility: "shared", consentStatus: "obtained", deIdentified: true },
  specialty: [ref("dermatología", "specialty")],
  caseType: [ref("respuesta a tratamiento", "case_type")],
  searchTags: ["dermatitis atópica", "tacrolimus", "corticoide", "EASI"],
});

// ── 2. Eccema de contacto — NARANJA (internal_usable) ────────────────────────

const c2 = seedCase({
  caseId: "EC-052-M",
  title: "Eccema de contacto ocupacional en varón de 52 años",
  createdAt: "2026-03-11T09:00:00Z",
  updatedAt: "2026-03-11T09:00:00Z",
  summary: mf("Varón de 52 años, sanitario, con eccema de contacto en dorso de manos por látex."),
  patient: {
    ageGroup: "adult",
    ageValue: mf(52),
    sex: "male",
    clinicalContext: mf("Trabajador sanitario con uso frecuente de guantes."),
    deIdentified: true,
  },
  mainReason: mf("Eccema de contacto ocupacional con identificación de alérgeno."),
  background: mf("Hipertensión y diabetes tipo 2. Alergia a látex."),
  keyFindings: mf("Vesículas, eritema y prurito en dorso de manos y muñecas."),
  timeline: [
    { when: "Día 0", event: "Aparición tras cambio de guantes", validatedByHcp: true },
    { when: "Día 10", event: "Patch test positivo a látex", validatedByHcp: true },
  ],
  primaryDiagnosis: {
    label: mf("Eccema de contacto alérgico"),
    concept: ref("eccema de contacto", "diagnosis"),
    isSuspected: false,
    codes: [],
  },
  diagnosticAssessment: {
    testsPerformed: mf("Patch test positivo a látex."),
    reasoning: mf(""),
    differentials: [],
  },
  management: [drug("Betametasona", { dose: "tópica", validated: false })],
  followUp: [
    { globalOutcome: "improved", outcomeType: "clinical", validatedByHcp: false },
  ],
  keyLearning: mf("La evitación del alérgeno es el pilar del manejo del eccema de contacto."),
  privacy: { visibility: "internal", consentStatus: "pending", deIdentified: true },
  specialty: [ref("dermatología", "specialty")],
  caseType: [],
  searchTags: ["eccema de contacto", "látex"],
});

// ── 3. Psoriasis en placas — VERDE (care_ready) ──────────────────────────────

const c3 = seedCase({
  caseId: "PS-028-F",
  title: "Psoriasis en placas leve en mujer de 28 años",
  createdAt: "2026-03-12T09:00:00Z",
  updatedAt: "2026-03-12T09:00:00Z",
  summary: mf("Mujer de 28 años con psoriasis en placas leve (PASI 4.2) con buena respuesta tópica."),
  patient: {
    ageGroup: "adult",
    ageValue: mf(28),
    sex: "female",
    clinicalContext: mf("Brote relacionado con estrés laboral. Sin artritis psoriásica."),
    deIdentified: true,
  },
  mainReason: mf("Manejo tópico de la psoriasis en placas leve."),
  background: mf("Psoriasis diagnosticada hace 2 años."),
  keyFindings: mf("Placas eritematosas con descamación plateada en codos, rodillas y cuero cabelludo."),
  timeline: [
    { when: "Mes 0", event: "Brote por estrés, PASI 4.2", validatedByHcp: true },
    { when: "Mes 2", event: "Mejoría con análogo de vitamina D + corticoide", validatedByHcp: true },
  ],
  primaryDiagnosis: {
    label: mf("Psoriasis en placas leve"),
    concept: ref("psoriasis", "diagnosis"),
    isSuspected: false,
    codes: [],
  },
  diagnosticAssessment: {
    testsPerformed: mf("Analítica normal. PASI 4.2."),
    reasoning: mf("Clínica y distribución típicas, sin necesidad de biopsia."),
    differentials: ["Dermatitis seborreica"],
  },
  management: [
    drug("Calcipotriol", { lineOfTherapy: "1ª línea" }),
    drug("Betametasona", { lineOfTherapy: "1ª línea" }),
  ],
  followUp: [
    {
      globalOutcome: "improved",
      outcomeType: "clinical",
      magnitude: "PASI 4.2 → 1.0",
      timeToOutcome: "2 meses",
      validatedByHcp: true,
    },
  ],
  keyLearning: mf("La combinación análogo de vitamina D + corticoide es eficaz en psoriasis leve."),
  privacy: { visibility: "shared", consentStatus: "obtained", deIdentified: true },
  specialty: [ref("dermatología", "specialty")],
  caseType: [ref("respuesta a tratamiento", "case_type")],
  searchTags: ["psoriasis", "calcipotriol", "PASI"],
});

// ── 4. Rosácea papulopustulosa — NARANJA (internal_usable) ───────────────────

const c4 = seedCase({
  caseId: "RO-045-M",
  title: "Rosácea papulopustulosa en varón de 45 años",
  createdAt: "2026-03-13T09:00:00Z",
  updatedAt: "2026-03-13T09:00:00Z",
  summary: mf("Varón de 45 años con rosácea papulopustulosa centrofacial."),
  patient: {
    ageGroup: "adult",
    ageValue: mf(45),
    sex: "male",
    clinicalContext: mf("Empeora con sol y bebidas calientes."),
    deIdentified: true,
  },
  mainReason: mf("Rosácea con desencadenantes identificables."),
  background: mf("Rosácea de 5 años de evolución. Alergia a penicilina."),
  keyFindings: mf("Pápulas, pústulas y eritema centrofacial con sensación de ardor."),
  timeline: [{ when: "Semana 0", event: "Consulta por brote", validatedByHcp: true }],
  primaryDiagnosis: {
    label: mf("Rosácea papulopustulosa"),
    concept: ref("rosácea", "diagnosis"),
    isSuspected: false,
    codes: [],
  },
  diagnosticAssessment: {
    testsPerformed: mf("Test de Demodex positivo (PCR). Sin afectación ocular."),
    reasoning: mf(""),
    differentials: [],
  },
  management: [drug("Metronidazol tópico", { validated: false })],
  followUp: [{ globalOutcome: "stable", validatedByHcp: false }],
  keyLearning: mf("La evitación de desencadenantes complementa el tratamiento tópico de la rosácea."),
  privacy: { visibility: "internal", consentStatus: "pending", deIdentified: true },
  specialty: [ref("dermatología", "specialty")],
  caseType: [],
  searchTags: ["rosácea", "metronidazol"],
});

// ── 5. Urticaria crónica — ROJO (draft_incomplete) ───────────────────────────

const c5 = seedCase({
  caseId: "UC-061-F",
  title: "Urticaria crónica espontánea en mujer de 61 años",
  createdAt: "2026-03-14T09:00:00Z",
  updatedAt: "2026-03-14T09:00:00Z",
  summary: mf("Mujer de 61 años con urticaria crónica espontánea (UAS7 = 28)."),
  patient: {
    ageGroup: "elderly",
    ageValue: mf(61),
    sex: "female",
    clinicalContext: mf("Hipotiroidismo e HTA en tratamiento."),
    deIdentified: true,
  },
  mainReason: mf("Urticaria crónica refractaria a antihistamínicos."),
  background: mf("Hipotiroidismo, HTA. Alergia a AINEs."),
  keyFindings: mf("Habones recurrentes, angioedema perioral y prurito generalizado."),
  // Sin timeline, sin tratamiento estructurado, sin resultado, consentimiento sin resolver
  // → faltan obligatorios → ROJO.
  timeline: [],
  primaryDiagnosis: {
    label: mf("Urticaria crónica espontánea"),
    concept: ref("urticaria crónica", "diagnosis"),
    isSuspected: false,
    codes: [],
  },
  diagnosticAssessment: {
    testsPerformed: mf("TSH normal bajo tratamiento. Autoanticuerpos negativos."),
    reasoning: mf(""),
    differentials: [],
  },
  management: [],
  followUp: [],
  keyLearning: { value: null, status: "not_documented", validatedByHcp: false },
  privacy: { visibility: "private", consentStatus: "unknown", deIdentified: true },
  specialty: [ref("alergología", "specialty")],
  caseType: [],
  searchTags: ["urticaria", "angioedema"],
});

export const CLINICAL_CASES: ClinicalCase[] = [c1, c2, c3, c4, c5];

export function getClinicalCase(id: string): ClinicalCase | undefined {
  return CLINICAL_CASES.find((c) => c.caseId === id);
}
