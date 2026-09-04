/**
 * Factoría de casos clínicos.
 *
 * `blankCase()` crea un Clinical Case bien formado y vacío (todos los bloques
 * presentes, en estado "rojo"). Lo usan tanto el seed de la biblioteca como el
 * asistente de IA de creación, que va rellenando bloques sobre esta base.
 *
 * `withComputedStatus()` recalcula color/estado tras cualquier edición — el
 * Library Index y la tarjeta leen siempre un estado coherente.
 */

import type { ClinicalCase } from "@/types/clinical-case";
import { emptyField } from "@/types/field";
import { computeCaseStatus } from "./case-status";

let counter = 124;
export function nextCaseId(): string {
  return `CASE-${String(counter++).padStart(6, "0")}`;
}

export function blankCase(
  authorId = "col-12345",
  authorRole = "profesional_sanitario",
): ClinicalCase {
  const now = new Date().toISOString();
  return {
    caseId: nextCaseId(),
    title: "",
    language: "es-ES",
    createdAt: now,
    updatedAt: now,
    authorId,
    authorRole,
    status: "draft_incomplete",
    statusColor: "red",

    summary: emptyField<string>(),
    patient: {
      ageGroup: "unknown",
      ageValue: emptyField<number>(),
      sex: "unknown",
      clinicalContext: emptyField<string>(),
      deIdentified: false,
    },
    mainReason: emptyField<string>(),
    background: emptyField<string>(),
    keyFindings: emptyField<string>(),
    timeline: [],
    primaryDiagnosis: {
      label: emptyField<string>(),
      concept: null,
      isSuspected: false,
      codes: [],
    },
    diagnosticAssessment: {
      testsPerformed: emptyField<string>(),
      reasoning: emptyField<string>(),
      differentials: [],
    },
    management: [],
    followUp: [],
    keyLearning: emptyField<string>(),
    privacy: {
      visibility: "internal",
      consentStatus: "unknown",
      deIdentified: false,
    },

    specialty: [],
    caseType: [],
    searchTags: [],

    complementary: {
      keywords: [],
      bibliography: [],
      adverseEvents: [],
      attachmentIds: [],
    },
    sourceDocuments: [],
  };
}

/** Recalcula y fija status/statusColor a partir del contenido actual. */
export function withComputedStatus(c: ClinicalCase): ClinicalCase {
  const { color, status } = computeCaseStatus(c);
  return { ...c, status, statusColor: color };
}

/**
 * Completa un caso parcial con la estructura de un caso en blanco.
 *
 * El autoguardado envía lo que hay en pantalla en cada momento, que puede ser
 * un caso al que le faltan bloques enteros. En vez de rechazarlo (y perder lo
 * que el médico acaba de escribir), se rellenan los huecos con los valores
 * vacíos del caso en blanco.
 */
export function hydrateCase(partial: Partial<ClinicalCase>): ClinicalCase {
  const base = blankCase(partial.authorId, partial.authorRole);
  return {
    ...base,
    ...partial,
    caseId: partial.caseId ?? base.caseId,
    patient: { ...base.patient, ...partial.patient },
    primaryDiagnosis: { ...base.primaryDiagnosis, ...partial.primaryDiagnosis },
    diagnosticAssessment: { ...base.diagnosticAssessment, ...partial.diagnosticAssessment },
    privacy: { ...base.privacy, ...partial.privacy },
    complementary: { ...base.complementary, ...partial.complementary },
    timeline: partial.timeline ?? base.timeline,
    management: partial.management ?? base.management,
    followUp: partial.followUp ?? base.followUp,
    specialty: partial.specialty ?? base.specialty,
    caseType: partial.caseType ?? base.caseType,
    searchTags: partial.searchTags ?? base.searchTags,
  };
}
