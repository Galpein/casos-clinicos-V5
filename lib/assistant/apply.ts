/**
 * Aplicadores inmutables sobre el ClinicalCase usados por el asistente.
 * Todo lo que rellena la IA entra como `pending_review` (sin validar), salvo
 * cuando es el propio HCP quien elige una opción explícita.
 */

import type {
  ClinicalCase,
  Outcome,
  Treatment,
} from "@/types/clinical-case";
import { aiField, manualField, type FieldValue, type Provenance } from "@/types/field";
import { conceptRef } from "@/types/concepts";
import { getConcept, resolveConcept } from "@/lib/dictionary";
import { withComputedStatus } from "@/lib/case-factory";

export type TextFieldKey =
  | "summary"
  | "mainReason"
  | "background"
  | "keyFindings"
  | "keyLearning"
  | "patient.clinicalContext"
  | "assessment.tests"
  | "assessment.reasoning";

export function setText(
  c: ClinicalCase,
  key: TextFieldKey,
  value: string,
  confidence: number,
  source?: Provenance,
  manual = false,
): ClinicalCase {
  // manual = lo escribió el HCP → cuenta como validado por él.
  const f = manual ? manualField(value) : aiField(value, confidence, source);
  const next = { ...c };
  switch (key) {
    case "summary": next.summary = f; break;
    case "mainReason": next.mainReason = f; break;
    case "background": next.background = f; break;
    case "keyFindings": next.keyFindings = f; break;
    case "keyLearning": next.keyLearning = f; break;
    case "patient.clinicalContext":
      next.patient = { ...c.patient, clinicalContext: f };
      break;
    case "assessment.tests":
      next.diagnosticAssessment = { ...c.diagnosticAssessment, testsPerformed: f };
      break;
    case "assessment.reasoning":
      next.diagnosticAssessment = { ...c.diagnosticAssessment, reasoning: f };
      break;
  }
  return withComputedStatus(next);
}

export function setTitle(c: ClinicalCase, title: string): ClinicalCase {
  return withComputedStatus({ ...c, title });
}

export function setPatient(
  c: ClinicalCase,
  patch: Partial<Pick<ClinicalCase["patient"], "sex" | "ageGroup">> & { ageValue?: number },
): ClinicalCase {
  const ageGroup =
    patch.ageGroup ??
    (patch.ageValue != null ? ageGroupFor(patch.ageValue) : c.patient.ageGroup);
  return withComputedStatus({
    ...c,
    patient: {
      ...c.patient,
      sex: patch.sex ?? c.patient.sex,
      ageGroup,
      ageValue:
        patch.ageValue != null
          ? aiField(patch.ageValue, 0.9)
          : c.patient.ageValue,
      deIdentified: true,
    },
  });
}

function ageGroupFor(age: number): ClinicalCase["patient"]["ageGroup"] {
  if (age < 12) return "pediatric";
  if (age < 18) return "adolescent";
  if (age < 65) return "adult";
  return "elderly";
}

export function setDiagnosis(
  c: ClinicalCase,
  textFound: string,
  conceptId: string,
  label: string,
  confidence: number,
): ClinicalCase {
  const ref = conceptRef(textFound, { conceptId, label, confidence });
  return withComputedStatus({
    ...c,
    primaryDiagnosis: {
      ...c.primaryDiagnosis,
      label: aiField(label, confidence),
      concept: ref,
    },
  });
}

/**
 * Diagnóstico a partir de texto libre del HCP. Si el diccionario reconoce el
 * término, lo mapea a concepto (validado por el HCP); si no, guarda la etiqueta
 * tal cual para no perder la información.
 */
export function setDiagnosisFromText(c: ClinicalCase, text: string): ClinicalCase {
  const m = resolveConcept(text, "diagnosis");
  if (m) {
    const ref = conceptRef(text, { conceptId: m.conceptId, label: m.label, confidence: m.confidence });
    return withComputedStatus({
      ...c,
      primaryDiagnosis: {
        ...c.primaryDiagnosis,
        label: manualField(m.label),
        concept: { ...ref, status: "validated", validatedByHcp: true },
      },
    });
  }
  return withComputedStatus({
    ...c,
    primaryDiagnosis: { ...c.primaryDiagnosis, label: manualField(text), concept: null },
  });
}

export function setSpecialty(
  c: ClinicalCase,
  textFound: string,
  conceptId: string,
  label: string,
): ClinicalCase {
  const ref = conceptRef(textFound, { conceptId, label, confidence: 0.9 });
  return withComputedStatus({ ...c, specialty: [ref] });
}

export function setCaseType(
  c: ClinicalCase,
  textFound: string,
  conceptId: string,
  label: string,
): ClinicalCase {
  const ref = conceptRef(textFound, { conceptId, label, confidence: 0.85 });
  return withComputedStatus({ ...c, caseType: [ref] });
}

/** Crea un Treatment propuesto por IA a partir de un nombre de fármaco. */
export function aiTreatment(name: string, extra: Partial<Treatment> = {}): Treatment {
  const m = resolveConcept(name, "drug");
  return {
    type: "drug",
    name,
    therapeuticClass: m ? getConcept(m.conceptId)?.therapeuticClass : undefined,
    status: "present",
    validatedByHcp: false,
    concept: m
      ? conceptRef(name, { conceptId: m.conceptId, label: m.label, confidence: m.confidence })
      : conceptRef(name, null),
    codes: [],
    ...extra,
  };
}

export function addTreatment(c: ClinicalCase, t: Treatment): ClinicalCase {
  if (c.management.some((x) => x.name.toLowerCase() === t.name.toLowerCase())) return c;
  return withComputedStatus({ ...c, management: [...c.management, t] });
}

export function addOutcome(c: ClinicalCase, o: Outcome): ClinicalCase {
  return withComputedStatus({ ...c, followUp: [...c.followUp, o] });
}

export function setTimeline(
  c: ClinicalCase,
  events: { when: string; event: string }[],
): ClinicalCase {
  return withComputedStatus({
    ...c,
    timeline: events.map((e) => ({ ...e, validatedByHcp: false })),
  });
}

export function setPrivacy(
  c: ClinicalCase,
  patch: Partial<ClinicalCase["privacy"]>,
): ClinicalCase {
  return withComputedStatus({ ...c, privacy: { ...c.privacy, ...patch } });
}

export function addSearchTags(c: ClinicalCase, tags: string[]): ClinicalCase {
  const merged = Array.from(new Set([...c.searchTags, ...tags]));
  return withComputedStatus({ ...c, searchTags: merged });
}

/** Marca como validado por el HCP todo lo que la IA dejó pendiente. */
export function validateAll(c: ClinicalCase): ClinicalCase {
  const v = <T,>(f: FieldValue<T>): FieldValue<T> =>
    f.status === "pending_review"
      ? { ...f, status: "present", validatedByHcp: true }
      : f;
  return withComputedStatus({
    ...c,
    summary: v(c.summary),
    mainReason: v(c.mainReason),
    background: v(c.background),
    keyFindings: v(c.keyFindings),
    keyLearning: v(c.keyLearning),
    patient: {
      ...c.patient,
      clinicalContext: v(c.patient.clinicalContext),
      ageValue: v(c.patient.ageValue),
    },
    diagnosticAssessment: {
      ...c.diagnosticAssessment,
      testsPerformed: v(c.diagnosticAssessment.testsPerformed),
      reasoning: v(c.diagnosticAssessment.reasoning),
    },
    primaryDiagnosis: {
      ...c.primaryDiagnosis,
      label: v(c.primaryDiagnosis.label),
      concept: c.primaryDiagnosis.concept
        ? { ...c.primaryDiagnosis.concept, status: "validated", validatedByHcp: true }
        : null,
    },
    specialty: c.specialty.map((s) => ({ ...s, status: "validated" as const, validatedByHcp: true })),
    caseType: c.caseType.map((s) => ({ ...s, status: "validated" as const, validatedByHcp: true })),
    management: c.management.map((t) => ({
      ...t,
      validatedByHcp: true,
      concept: t.concept ? { ...t.concept, status: "validated", validatedByHcp: true } : t.concept,
    })),
    followUp: c.followUp.map((o) => ({ ...o, validatedByHcp: true })),
    timeline: c.timeline.map((e) => ({ ...e, validatedByHcp: true })),
  });
}
