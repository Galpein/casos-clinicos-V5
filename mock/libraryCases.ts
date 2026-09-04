/**
 * Casos adicionales de la biblioteca de demostración.
 *
 * Los cinco casos redactados a mano (`clinicalCases.ts`) son los del profesional
 * que usa la demo. Estos son el resto del fondo de la biblioteca: hacen falta
 * para que las facetas con contadores, la ordenación y la paginación tengan
 * sentido — con cinco casos no se puede juzgar una biblioteca.
 *
 * Se generan de una tabla compacta y de forma determinista (sin aleatoriedad),
 * para que los contadores no cambien entre recargas. Todo es material de
 * demostración: ni pacientes ni cifras son reales.
 */

import type { AgeGroup, ClinicalCase, Treatment, Outcome } from "@/types/clinical-case";
import { manualField } from "@/types/field";
import { conceptRef, type ConceptRef } from "@/types/concepts";
import { getConcept, resolveConcept } from "@/lib/dictionary";
import { blankCase, withComputedStatus } from "@/lib/case-factory";

const mf = manualField;

function ref(text: string, type: Parameters<typeof resolveConcept>[1]): ConceptRef {
  const m = resolveConcept(text, type);
  const r = conceptRef(
    text,
    m ? { conceptId: m.conceptId, label: m.label, confidence: m.confidence } : null,
  );
  return { ...r, status: "validated", validatedByHcp: true };
}

function drug(name: string, line?: string): Treatment {
  const m = resolveConcept(name, "drug");
  return {
    type: "drug",
    name,
    therapeuticClass: m ? getConcept(m.conceptId)?.therapeuticClass : undefined,
    lineOfTherapy: line,
    status: "present",
    validatedByHcp: true,
    concept: m
      ? {
          ...conceptRef(name, { conceptId: m.conceptId, label: m.label, confidence: m.confidence }),
          status: "validated",
          validatedByHcp: true,
        }
      : null,
    codes: [],
  };
}

function outcome(kind: Outcome["globalOutcome"], magnitude: string, weeks: number): Outcome {
  return {
    globalOutcome: kind,
    outcomeType: "clinical",
    magnitude,
    timeToOutcome: `${weeks} semanas`,
    narrative: "",
    validatedByHcp: true,
  };
}

/** Una fila = un caso. El nivel decide hasta dónde se rellena. */
interface Row {
  id: string;
  title: string;
  dx: string;
  specialty: string;
  sex: "female" | "male";
  age: number;
  drugs: [string, string?][];
  result: [Outcome["globalOutcome"], string, number];
  tags: string[];
  caseType?: string;
  /** 3 = CARE completo · 2 = documentación esencial · 1 = borrador */
  level: 1 | 2 | 3;
  day: number;
}

const ROWS: Row[] = [
  // ── Dermatología ────────────────────────────────────────────────────────
  { id: "DA-041-F", title: "Dermatitis atópica severa en mujer joven con fracaso de tópicos", dx: "dermatitis atópica", specialty: "dermatología", sex: "female", age: 26, drugs: [["Tacrolimus", "1ª línea"], ["Hidrocortisona", "Mantenimiento"]], result: ["improved", "EASI 18 → 5", 12], tags: ["dermatitis atópica", "tacrolimus", "flexural"], level: 3, day: 2 },
  { id: "DA-052-M", title: "Dermatitis atópica del lactante con sobreinfección", dx: "dermatitis atópica", specialty: "pediatría", sex: "male", age: 1, drugs: [["Hidrocortisona", "1ª línea"]], result: ["improved", "Resolución de las lesiones", 4], tags: ["dermatitis atópica", "lactante"], caseType: "reto diagnóstico", level: 2, day: 4 },
  { id: "EC-063-F", title: "Eccema de contacto por níquel en profesional de peluquería", dx: "eccema de contacto", specialty: "dermatología", sex: "female", age: 29, drugs: [["Betametasona", "1ª línea"]], result: ["resolved", "Resolución completa", 6], tags: ["eccema de contacto", "níquel", "laboral"], level: 3, day: 6 },
  { id: "EC-071-M", title: "Eccema de contacto por látex en personal sanitario", dx: "eccema de contacto", specialty: "dermatología", sex: "male", age: 44, drugs: [["Hidrocortisona", "1ª línea"]], result: ["resolved", "Resolución tras evitación", 8], tags: ["eccema de contacto", "látex"], level: 2, day: 8 },
  { id: "PS-084-M", title: "Psoriasis en placas moderada con afectación ungueal", dx: "psoriasis", specialty: "dermatología", sex: "male", age: 47, drugs: [["Calcipotriol", "1ª línea"], ["Betametasona", "1ª línea"]], result: ["improved", "PASI 12 → 4", 16], tags: ["psoriasis", "calcipotriol", "PASI"], level: 3, day: 10 },
  { id: "PS-090-F", title: "Psoriasis invertida en mujer con obesidad", dx: "psoriasis", specialty: "dermatología", sex: "female", age: 53, drugs: [["Calcipotriol", "1ª línea"]], result: ["improved", "Mejoría parcial", 10], tags: ["psoriasis", "invertida"], caseType: "presentación atípica", level: 2, day: 12 },
  { id: "RO-101-F", title: "Rosácea papulopustulosa refractaria a tópicos", dx: "rosácea", specialty: "dermatología", sex: "female", age: 51, drugs: [["Metronidazol", "1ª línea"], ["Doxiciclina", "2ª línea"]], result: ["improved", "Reducción del 70% de las lesiones", 12], tags: ["rosácea", "doxiciclina"], level: 3, day: 14 },
  { id: "RO-108-M", title: "Rosácea ocular en varón de mediana edad", dx: "rosácea", specialty: "dermatología", sex: "male", age: 58, drugs: [["Doxiciclina", "1ª línea"]], result: ["improved", "Control de la sintomatología ocular", 8], tags: ["rosácea", "ocular"], caseType: "presentación atípica", level: 2, day: 16 },
  { id: "ME-115-F", title: "Melanoma acral en mujer con diagnóstico tardío", dx: "melanoma", specialty: "dermatología", sex: "female", age: 62, drugs: [], result: ["stable", "Estable tras cirugía", 24], tags: ["melanoma", "acral", "cirugía"], caseType: "caso raro", level: 2, day: 18 },
  { id: "UC-122-F", title: "Urticaria crónica espontánea refractaria a antihistamínicos", dx: "urticaria crónica", specialty: "alergología", sex: "female", age: 38, drugs: [["Cetirizina", "1ª línea"], ["Omalizumab", "3ª línea"]], result: ["improved", "UAS7 28 → 6", 16], tags: ["urticaria", "omalizumab"], level: 3, day: 20 },

  // ── Alergología ─────────────────────────────────────────────────────────
  { id: "AN-130-M", title: "Anafilaxia por AINE en paciente con asma", dx: "anafilaxia", specialty: "alergología", sex: "male", age: 34, drugs: [["Adrenalina", "Rescate"]], result: ["resolved", "Resolución sin secuelas", 1], tags: ["anafilaxia", "AINE", "adrenalina"], caseType: "reacción adversa", level: 3, day: 22 },
  { id: "AL-137-F", title: "Alergia alimentaria a frutos secos con debut en la adolescencia", dx: "alergia alimentaria", specialty: "alergología", sex: "female", age: 15, drugs: [["Adrenalina", "Rescate"]], result: ["stable", "Sin nuevas reacciones", 52], tags: ["alergia alimentaria", "frutos secos"], level: 2, day: 24 },
  { id: "RA-144-M", title: "Rinitis alérgica estacional mal controlada", dx: "rinitis alérgica", specialty: "alergología", sex: "male", age: 27, drugs: [["Cetirizina", "1ª línea"]], result: ["improved", "Control sintomático", 6], tags: ["rinitis alérgica", "polen"], level: 2, day: 26 },
  { id: "AS-151-F", title: "Asma de difícil control en mujer con obesidad", dx: "asma", specialty: "alergología", sex: "female", age: 41, drugs: [["Budesonida", "1ª línea"], ["Salbutamol", "Rescate"]], result: ["improved", "ACT 12 → 20", 12], tags: ["asma", "budesonida"], level: 3, day: 28 },

  // ── Pediatría ───────────────────────────────────────────────────────────
  { id: "BR-158-M", title: "Bronquiolitis aguda en lactante de 5 meses", dx: "bronquiolitis", specialty: "pediatría", sex: "male", age: 0, drugs: [["Salbutamol", "Prueba terapéutica"]], result: ["resolved", "Alta a los 4 días", 1], tags: ["bronquiolitis", "lactante"], level: 2, day: 30 },
  { id: "KA-165-M", title: "Enfermedad de Kawasaki con presentación incompleta", dx: "enfermedad de kawasaki", specialty: "pediatría", sex: "male", age: 3, drugs: [], result: ["resolved", "Sin afectación coronaria", 8], tags: ["kawasaki", "fiebre prolongada"], caseType: "caso raro", level: 3, day: 32 },
  { id: "AS-172-F", title: "Asma infantil con mal cumplimiento del inhalador", dx: "asma", specialty: "pediatría", sex: "female", age: 8, drugs: [["Budesonida", "1ª línea"], ["Salbutamol", "Rescate"]], result: ["improved", "Sin crisis en 6 meses", 24], tags: ["asma", "adherencia", "pediatría"], level: 2, day: 34 },
  { id: "AL-179-M", title: "Alergia a proteína de leche de vaca en lactante", dx: "alergia alimentaria", specialty: "pediatría", sex: "male", age: 0, drugs: [], result: ["resolved", "Tolerancia a los 2 años", 96], tags: ["alergia alimentaria", "APLV"], caseType: "seguimiento prolongado", level: 2, day: 36 },

  // ── Medicina interna / familia ──────────────────────────────────────────
  { id: "DM-186-M", title: "Diabetes tipo 2 de debut con mal control metabólico", dx: "diabetes tipo 2", specialty: "medicina interna", sex: "male", age: 56, drugs: [["Metformina", "1ª línea"], ["Empagliflozina", "2ª línea"]], result: ["improved", "HbA1c 9,4% → 6,8%", 24], tags: ["diabetes", "metformina", "HbA1c"], level: 3, day: 38 },
  { id: "DM-193-F", title: "Diabetes tipo 2 con intolerancia digestiva a metformina", dx: "diabetes tipo 2", specialty: "medicina de familia", sex: "female", age: 63, drugs: [["Empagliflozina", "1ª línea"]], result: ["improved", "HbA1c 8,1% → 7,0%", 20], tags: ["diabetes", "intolerancia"], caseType: "reacción adversa", level: 2, day: 40 },
  { id: "HT-200-M", title: "Hipertensión resistente en varón con apnea del sueño", dx: "hipertensión arterial", specialty: "medicina interna", sex: "male", age: 61, drugs: [["Enalapril", "1ª línea"], ["Amlodipino", "2ª línea"]], result: ["improved", "TA 168/98 → 134/82", 12], tags: ["hipertensión", "apnea"], level: 3, day: 42 },
  { id: "HT-207-F", title: "Hipertensión de bata blanca confirmada con MAPA", dx: "hipertensión arterial", specialty: "medicina de familia", sex: "female", age: 49, drugs: [], result: ["stable", "Sin tratamiento farmacológico", 12], tags: ["hipertensión", "MAPA"], caseType: "reto diagnóstico", level: 2, day: 44 },
  { id: "HT-214-M", title: "Hipertensión en paciente joven con estenosis de arteria renal", dx: "hipertensión arterial", specialty: "medicina interna", sex: "male", age: 32, drugs: [["Amlodipino", "1ª línea"]], result: ["improved", "Normalización tras revascularización", 16], tags: ["hipertensión", "secundaria"], caseType: "caso raro", level: 1, day: 46 },

  // ── Neurología ──────────────────────────────────────────────────────────
  { id: "MI-221-F", title: "Migraña crónica con abuso de analgésicos", dx: "migraña", specialty: "neurología", sex: "female", age: 37, drugs: [["Sumatriptán", "Rescate"], ["Ibuprofeno", "Retirada"]], result: ["improved", "De 18 a 5 días de cefalea al mes", 16], tags: ["migraña", "cefalea por abuso"], level: 3, day: 48 },
  { id: "MI-228-M", title: "Migraña con aura prolongada en varón joven", dx: "migraña", specialty: "neurología", sex: "male", age: 24, drugs: [["Sumatriptán", "Rescate"]], result: ["improved", "Episodios más breves", 12], tags: ["migraña", "aura"], caseType: "presentación atípica", level: 2, day: 50 },
  { id: "EM-235-F", title: "Esclerosis múltiple remitente-recurrente de diagnóstico reciente", dx: "esclerosis múltiple", specialty: "neurología", sex: "female", age: 31, drugs: [["Natalizumab", "1ª línea"]], result: ["stable", "Sin nuevos brotes", 52], tags: ["esclerosis múltiple", "natalizumab"], caseType: "seguimiento prolongado", level: 3, day: 52 },
  { id: "EM-242-M", title: "Esclerosis múltiple con debut como neuritis óptica", dx: "esclerosis múltiple", specialty: "neurología", sex: "male", age: 28, drugs: [], result: ["improved", "Recuperación visual completa", 8], tags: ["esclerosis múltiple", "neuritis óptica"], caseType: "reto diagnóstico", level: 1, day: 54 },

  // ── Oncología ───────────────────────────────────────────────────────────
  { id: "CM-249-F", title: "Cáncer de mama HER2 positivo en mujer premenopáusica", dx: "cáncer de mama", specialty: "oncología", sex: "female", age: 44, drugs: [["Trastuzumab", "1ª línea"]], result: ["improved", "Respuesta completa patológica", 24], tags: ["cáncer de mama", "HER2", "trastuzumab"], level: 3, day: 56 },
  { id: "CM-256-F", title: "Cardiotoxicidad por trastuzumab en seguimiento", dx: "cáncer de mama", specialty: "oncología", sex: "female", age: 57, drugs: [["Trastuzumab", "Suspendido"]], result: ["worsened", "Caída de la FEVI al 45%", 16], tags: ["cáncer de mama", "cardiotoxicidad"], caseType: "reacción adversa", level: 3, day: 58 },
  { id: "ME-263-M", title: "Melanoma metastásico con respuesta prolongada", dx: "melanoma", specialty: "oncología", sex: "male", age: 66, drugs: [["Cisplatino", "2ª línea"]], result: ["stable", "Enfermedad estable a los 18 meses", 72], tags: ["melanoma", "metastásico"], caseType: "seguimiento prolongado", level: 2, day: 60 },
  { id: "ME-270-M", title: "Toxicidad renal por cisplatino en paciente añoso", dx: "melanoma", specialty: "oncología", sex: "male", age: 74, drugs: [["Cisplatino", "Ajuste de dosis"]], result: ["worsened", "Creatinina 1,1 → 2,3 mg/dL", 6], tags: ["cisplatino", "nefrotoxicidad"], caseType: "reacción adversa", level: 2, day: 62 },
];

function buildCase(r: Row): ClinicalCase {
  const base = blankCase();
  const created = new Date(2026, 0, 5 + r.day).toISOString();
  const ageGroup: AgeGroup =
    r.age < 12 ? "pediatric" : r.age < 18 ? "adolescent" : r.age < 65 ? "adult" : "elderly";

  const c: ClinicalCase = {
    ...base,
    caseId: r.id,
    title: r.title,
    createdAt: created,
    updatedAt: created,
    summary: mf(
      `${r.sex === "female" ? "Mujer" : "Varón"} de ${r.age} años con ${r.dx}. ` +
        (r.drugs.length ? `Manejo con ${r.drugs.map((d) => d[0]).join(" y ")}.` : "Manejo no farmacológico."),
    ),
    patient: {
      ageGroup,
      ageValue: mf(r.age),
      sex: r.sex,
      clinicalContext: r.level >= 2 ? mf("Sin comorbilidades relevantes documentadas.") : base.patient.clinicalContext,
      deIdentified: true,
    },
    primaryDiagnosis: {
      label: mf(r.dx.charAt(0).toUpperCase() + r.dx.slice(1)),
      concept: ref(r.dx, "diagnosis"),
      isSuspected: false,
      codes: [],
    },
    management: r.drugs.map(([name, line]) => drug(name, line)),
    followUp: [outcome(r.result[0], r.result[1], r.result[2])],
    timeline: [
      { when: "Inicio", event: "Presentación del cuadro", validatedByHcp: true },
      { when: `Semana ${r.result[2]}`, event: r.result[1], validatedByHcp: true },
    ],
    specialty: [ref(r.specialty, "specialty")],
    caseType: r.caseType ? [ref(r.caseType, "case_type")] : [],
    searchTags: r.tags,
    privacy: {
      visibility: "shared",
      consentStatus: r.level >= 2 ? "obtained" : "unknown",
      deIdentified: true,
    },
    keyLearning:
      r.level >= 2
        ? mf(`Puntos clave del manejo de ${r.dx} en este perfil de paciente.`)
        : base.keyLearning,
  };

  if (r.level >= 2) {
    c.mainReason = mf(`Ilustrar el manejo de ${r.dx} en la práctica habitual.`);
  }
  if (r.level === 3) {
    c.background = mf("Antecedentes personales sin hallazgos que condicionen el manejo.");
    c.keyFindings = mf("Exploración compatible con el diagnóstico principal.");
    c.diagnosticAssessment = {
      testsPerformed: mf("Pruebas complementarias acordes al proceso diagnóstico."),
      reasoning: mf("Diagnóstico establecido por clínica y pruebas dirigidas."),
      differentials: [],
    };
  }

  return withComputedStatus(c);
}

export const LIBRARY_CASES: ClinicalCase[] = ROWS.map(buildCase);
