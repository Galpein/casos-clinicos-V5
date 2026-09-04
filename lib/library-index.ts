/**
 * Derivación del Library Index a partir de un Clinical Case.
 *
 * "Se genera automáticamente a partir del caso" — esta función es ese
 * generador. El índice resultante es lo que la biblioteca y la analítica
 * consumen; el caso rico no se toca.
 */

import type { ClinicalCase } from "@/types/clinical-case";
import type {
  IndexedConcept,
  IndexedOutcome,
  IndexedTreatment,
  LibraryIndex,
} from "@/types/library-index";
import type { ConceptRef } from "@/types/concepts";
import { computeCaseStatus } from "./case-status";

function toIndexedConcept(ref: ConceptRef): IndexedConcept {
  return {
    conceptId: ref.conceptId,
    label: ref.normalizedLabel ?? ref.textFound,
    validatedByHcp: ref.validatedByHcp,
  };
}

export function deriveLibraryIndex(c: ClinicalCase): LibraryIndex {
  const { color, status } = computeCaseStatus(c);

  const treatments: IndexedTreatment[] = c.management.map((t) => ({
    conceptId: t.concept?.conceptId ?? null,
    label: t.concept?.normalizedLabel ?? t.name,
    type: t.type,
    brandOrProduct: t.brandOrProduct,
    therapeuticClass: t.therapeuticClass,
    lineOfTherapy: t.lineOfTherapy,
    validatedByHcp: t.validatedByHcp,
  }));

  const products = Array.from(
    new Set(c.management.map((t) => t.brandOrProduct).filter(Boolean)),
  ) as string[];

  const outcomes: IndexedOutcome[] = c.followUp.map((o) => ({
    globalOutcome: o.globalOutcome,
    outcomeType: o.outcomeType,
    adverseEvent: false,
    validatedByHcp: o.validatedByHcp,
  }));

  const adverseEvents = c.complementary.adverseEvents
    .filter((ae) => ae.present)
    .map((ae) => ae.concept?.normalizedLabel ?? ae.eventText ?? "evento adverso");

  // Reflejar eventos adversos también como outcomes de seguridad para analítica.
  for (const ae of c.complementary.adverseEvents.filter((x) => x.present)) {
    outcomes.push({
      globalOutcome: "unknown",
      outcomeType: "safety",
      adverseEvent: true,
      adverseEventSeverity: ae.severity,
      validatedByHcp: ae.validatedByHcp,
    });
  }

  return {
    caseId: c.caseId,
    title: c.title,
    summary: c.summary.value ?? "",
    caseStatusColor: color,
    caseStatus: status,
    language: c.language,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    authorId: c.authorId,
    authorRole: c.authorRole,
    organizationId: c.organizationId,
    specialty: c.specialty.map(toIndexedConcept),
    caseType: c.caseType.map((r) => r.normalizedLabel ?? r.textFound),
    patient: {
      ageGroup: c.patient.ageGroup,
      ageValue: c.patient.ageValue.value,
      sex: c.patient.sex,
    },
    primaryDiagnosis: c.primaryDiagnosis.concept
      ? [toIndexedConcept(c.primaryDiagnosis.concept)]
      : c.primaryDiagnosis.label.value
        ? [
            {
              conceptId: null,
              label: c.primaryDiagnosis.label.value,
              validatedByHcp: c.primaryDiagnosis.label.validatedByHcp,
            },
          ]
        : [],
    treatments,
    products,
    outcomes,
    adverseEvents,
    biomarkers: [],
    searchTags: c.searchTags,
    access: {
      visibility: c.privacy.visibility,
      consentStatus: c.privacy.consentStatus,
      deIdentified: c.privacy.deIdentified,
    },
  };
}
