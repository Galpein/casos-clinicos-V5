import type { AtlasConcept } from "@/types/concepts";

/**
 * Diccionario interno de AtlasCases (semilla MVP).
 *
 * Pequeño y propio. Cubre la vertical de dermatología del demo: patologías,
 * fármacos frecuentes, especialidad y tipos de caso. Cada concepto lleva sus
 * sinónimos/siglas/marcas para que la búsqueda y la normalización funcionen
 * sin texto literal. Los `externalCodes` van vacíos: la arquitectura los
 * admite, pero el MVP no los carga (se rellenarán en fase 2).
 */
export const ATLAS_CONCEPTS: AtlasConcept[] = [
  // ── Patologías ──────────────────────────────────────────────────────────
  {
    conceptId: "atlas_disease_atopic_dermatitis",
    conceptType: "diagnosis",
    preferredLabelEs: "Dermatitis atópica",
    preferredLabelEn: "Atopic dermatitis",
    terms: [
      { term: "dermatitis atópica", language: "es", termType: "preferred" },
      { term: "eccema atópico", language: "es", termType: "synonym" },
      { term: "DA", language: "es", termType: "abbreviation", ambiguous: true },
      { term: "atopic dermatitis", language: "en", termType: "synonym" },
      { term: "atopic eczema", language: "en", termType: "synonym" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_disease_contact_eczema",
    conceptType: "diagnosis",
    preferredLabelEs: "Eccema de contacto",
    preferredLabelEn: "Contact dermatitis",
    terms: [
      { term: "eccema de contacto", language: "es", termType: "preferred" },
      { term: "dermatitis de contacto", language: "es", termType: "synonym" },
      { term: "contact dermatitis", language: "en", termType: "synonym" },
      { term: "contact eczema", language: "en", termType: "synonym" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_disease_psoriasis",
    conceptType: "diagnosis",
    preferredLabelEs: "Psoriasis",
    preferredLabelEn: "Psoriasis",
    terms: [
      { term: "psoriasis", language: "es", termType: "preferred" },
      { term: "psoriasis en placas", language: "es", termType: "synonym" },
      { term: "plaque psoriasis", language: "en", termType: "synonym" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_disease_rosacea",
    conceptType: "diagnosis",
    preferredLabelEs: "Rosácea",
    preferredLabelEn: "Rosacea",
    terms: [
      { term: "rosácea", language: "es", termType: "preferred" },
      { term: "rosacea", language: "es", termType: "misspelling" },
      { term: "rosacea", language: "en", termType: "synonym" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_disease_chronic_urticaria",
    conceptType: "diagnosis",
    preferredLabelEs: "Urticaria crónica espontánea",
    preferredLabelEn: "Chronic spontaneous urticaria",
    terms: [
      { term: "urticaria crónica", language: "es", termType: "preferred" },
      { term: "urticaria crónica espontánea", language: "es", termType: "synonym" },
      { term: "UCE", language: "es", termType: "abbreviation" },
      { term: "chronic urticaria", language: "en", termType: "synonym" },
      { term: "CSU", language: "en", termType: "abbreviation", ambiguous: true },
    ],
    externalCodes: [],
    status: "active",
  },

  // ── Fármacos / principios activos ───────────────────────────────────────
  {
    conceptId: "atlas_drug_tacrolimus",
    conceptType: "drug",
    preferredLabelEs: "Tacrolimus tópico",
    preferredLabelEn: "Tacrolimus",
    therapeuticClass: "Inhibidor de la calcineurina",
    terms: [
      { term: "tacrolimus", language: "es", termType: "preferred" },
      { term: "Protopic", language: "es", termType: "brand" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_drug_hydrocortisone",
    conceptType: "drug",
    preferredLabelEs: "Hidrocortisona tópica",
    preferredLabelEn: "Hydrocortisone",
    therapeuticClass: "Corticoide tópico de baja potencia",
    terms: [
      { term: "hidrocortisona", language: "es", termType: "preferred" },
      { term: "hydrocortisone", language: "en", termType: "synonym" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_drug_betamethasone",
    conceptType: "drug",
    preferredLabelEs: "Betametasona tópica",
    preferredLabelEn: "Betamethasone",
    therapeuticClass: "Corticoide tópico de alta potencia",
    terms: [
      { term: "betametasona", language: "es", termType: "preferred" },
      { term: "betamethasone", language: "en", termType: "synonym" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_drug_calcipotriol",
    conceptType: "drug",
    preferredLabelEs: "Calcipotriol",
    preferredLabelEn: "Calcipotriol",
    therapeuticClass: "Análogo de vitamina D",
    terms: [
      { term: "calcipotriol", language: "es", termType: "preferred" },
      { term: "Daivonex", language: "es", termType: "brand" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_drug_cetirizine",
    conceptType: "drug",
    preferredLabelEs: "Cetirizina",
    preferredLabelEn: "Cetirizine",
    therapeuticClass: "Antihistamínico H1",
    terms: [
      { term: "cetirizina", language: "es", termType: "preferred" },
      { term: "cetirizine", language: "en", termType: "synonym" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_drug_omalizumab",
    conceptType: "drug",
    preferredLabelEs: "Omalizumab",
    preferredLabelEn: "Omalizumab",
    therapeuticClass: "Anti-IgE (biológico)",
    terms: [
      { term: "omalizumab", language: "es", termType: "preferred" },
      { term: "Xolair", language: "es", termType: "brand" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_drug_metronidazole_topical",
    conceptType: "drug",
    preferredLabelEs: "Metronidazol tópico",
    preferredLabelEn: "Topical metronidazole",
    therapeuticClass: "Antibiótico/antiinflamatorio tópico",
    terms: [
      { term: "metronidazol", language: "es", termType: "preferred" },
      { term: "metronidazol tópico", language: "es", termType: "synonym" },
    ],
    externalCodes: [],
    status: "active",
  },

  // ── Especialidad ────────────────────────────────────────────────────────
  {
    conceptId: "atlas_specialty_dermatology",
    conceptType: "specialty",
    preferredLabelEs: "Dermatología",
    preferredLabelEn: "Dermatology",
    terms: [
      { term: "dermatología", language: "es", termType: "preferred" },
      { term: "dermatology", language: "en", termType: "synonym" },
    ],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_specialty_allergology",
    conceptType: "specialty",
    preferredLabelEs: "Alergología",
    preferredLabelEn: "Allergology",
    terms: [
      { term: "alergología", language: "es", termType: "preferred" },
      { term: "alergia", language: "es", termType: "lay_term" },
    ],
    externalCodes: [],
    status: "active",
  },

  // ── Tipo de caso ────────────────────────────────────────────────────────
  {
    conceptId: "atlas_casetype_diagnostic_challenge",
    conceptType: "case_type",
    preferredLabelEs: "Reto diagnóstico",
    preferredLabelEn: "Diagnostic challenge",
    terms: [{ term: "reto diagnóstico", language: "es", termType: "preferred" }],
    externalCodes: [],
    status: "active",
  },
  {
    conceptId: "atlas_casetype_treatment_response",
    conceptType: "case_type",
    preferredLabelEs: "Respuesta a tratamiento",
    preferredLabelEn: "Treatment response",
    terms: [
      { term: "respuesta a tratamiento", language: "es", termType: "preferred" },
    ],
    externalCodes: [],
    status: "active",
  },
];
