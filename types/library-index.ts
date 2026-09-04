/**
 * Library Index — versión ligera y estructurada del caso.
 *
 * NO sustituye al Clinical Case. Es lo que la biblioteca usa para buscar,
 * filtrar, listar, ordenar y alimentar la analítica agregada. Se genera
 * automáticamente desde el Clinical Case (ver lib/library-index.ts) y puede
 * ser revisado por el HCP.
 */

import type {
  AgeGroup,
  CaseStatus,
  CaseStatusColor,
  ConsentStatus,
  Sex,
  Visibility,
} from "./clinical-case";

/** Tratamiento "aplanado" para filtros y analítica. */
export interface IndexedTreatment {
  conceptId: string | null;
  label: string;
  type: string;
  brandOrProduct?: string;
  therapeuticClass?: string;
  lineOfTherapy?: string;
  validatedByHcp: boolean;
}

/** Resultado "aplanado" para filtros y analítica. */
export interface IndexedOutcome {
  globalOutcome: string;
  outcomeType?: string;
  adverseEvent: boolean;
  adverseEventSeverity?: string;
  validatedByHcp: boolean;
}

/** Diagnóstico/concepto aplanado. */
export interface IndexedConcept {
  conceptId: string | null;
  label: string;
  validatedByHcp: boolean;
}

export interface LibraryIndex {
  caseId: string;
  title: string;
  summary: string;

  caseStatusColor: CaseStatusColor;
  caseStatus: CaseStatus;

  language: string;
  createdAt: string;
  updatedAt: string;

  authorId: string;
  authorRole: string;
  organizationId?: string;

  specialty: IndexedConcept[];
  caseType: string[];

  patient: {
    ageGroup: AgeGroup;
    ageValue: number | null;
    sex: Sex;
  };

  primaryDiagnosis: IndexedConcept[];
  treatments: IndexedTreatment[];
  products: string[];
  outcomes: IndexedOutcome[];
  adverseEvents: string[];
  biomarkers: string[];
  searchTags: string[];

  access: {
    visibility: Visibility;
    consentStatus: ConsentStatus;
    deIdentified: boolean;
  };
}
