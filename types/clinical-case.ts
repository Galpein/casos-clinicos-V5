/**
 * Clinical Case — el objeto rico, orientado a lectura/edición/exportación.
 *
 * Estructura basada en CARE pero SIMPLIFICADA: el HCP no rellena una checklist
 * académica. Son 13 bloques mínimos obligatorios + campos complementarios que
 * no bloquean la creación. Cada bloque narrativo es un `TextField` para
 * arrastrar su procedencia y estado de validación (relleno por IA / manual).
 */

import type { FieldValue, TextField } from "./field";
import type { ConceptRef, ExternalCode } from "./concepts";

// ── Estado y color del caso ──────────────────────────────────────────────────

/** Semáforo de completitud (no de gravedad). */
export type CaseStatusColor = "red" | "orange" | "green";

export type CaseStatus =
  | "draft_incomplete" // rojo
  | "internal_usable" // naranja — mínimos obligatorios listos
  | "care_ready"; // verde — completo para exportar/publicar

// ── Bloque 3: Paciente anonimizado ───────────────────────────────────────────

export type AgeGroup =
  | "pediatric"
  | "adolescent"
  | "adult"
  | "elderly"
  | "unknown";
export type Sex = "female" | "male" | "other" | "unknown";

export interface PatientBlock {
  ageGroup: AgeGroup;
  ageValue: FieldValue<number>;
  sex: Sex;
  /** Contexto clínico relevante, sin datos identificativos. */
  clinicalContext: TextField;
  /** La plataforma confirma que no hay datos que identifiquen al paciente. */
  deIdentified: boolean;
}

// ── Bloque 7: Timeline ───────────────────────────────────────────────────────

export interface TimelineEvent {
  /** Marca temporal relativa o absoluta: "Día 0", "Semana 3", "2025-01". */
  when: string;
  event: string;
  validatedByHcp: boolean;
}

// ── Bloque 8: Diagnóstico principal ──────────────────────────────────────────

export interface DiagnosisBlock {
  label: TextField;
  /** Concepto normalizado (clave para búsqueda/analítica). */
  concept: ConceptRef | null;
  /** ¿Es una sospecha en lugar de confirmado? */
  isSuspected: boolean;
  codes: ExternalCode[];
}

// ── Bloque 9: Evaluación diagnóstica ─────────────────────────────────────────

export interface DiagnosticAssessment {
  testsPerformed: TextField;
  reasoning: TextField;
  differentials: string[];
}

// ── Bloque 10: Tratamiento / intervención (estructurado) ─────────────────────

export type TreatmentType =
  | "drug"
  | "procedure"
  | "surgery"
  | "radiotherapy"
  | "device"
  | "lifestyle"
  | "diagnostic"
  | "other";

import type { DataStatus } from "./field";

export interface Treatment {
  type: TreatmentType;
  name: string;
  brandOrProduct?: string;
  therapeuticClass?: string;
  lineOfTherapy?: string;
  dose?: string;
  duration?: string;
  reasonForUse?: string;
  status: DataStatus;
  validatedByHcp: boolean;
  /** Concepto normalizado del fármaco/producto. */
  concept?: ConceptRef | null;
  codes: ExternalCode[];
}

// ── Bloque 11: Seguimiento y resultados (estructurado) ───────────────────────

export type GlobalOutcome =
  | "improved"
  | "stable"
  | "worsened"
  | "progressed"
  | "resolved"
  | "death"
  | "unknown"
  | "not_applicable";

export type OutcomeType =
  | "clinical"
  | "radiological"
  | "laboratory"
  | "functional"
  | "survival"
  | "quality_of_life"
  | "safety"
  | "other";

export interface Outcome {
  globalOutcome: GlobalOutcome;
  specificOutcome?: string;
  outcomeType?: OutcomeType;
  magnitude?: string;
  timeToOutcome?: string;
  narrative?: string;
  validatedByHcp: boolean;
}

export type AeSeverity =
  | "mild"
  | "moderate"
  | "severe"
  | "life_threatening"
  | "fatal"
  | "unknown"
  | "not_applicable";

export interface AdverseEvent {
  present: boolean;
  eventText?: string;
  concept?: ConceptRef | null;
  severity: AeSeverity;
  relationshipToTreatment?:
    | "related"
    | "possibly_related"
    | "unrelated"
    | "unknown";
  outcome?: "resolved" | "ongoing" | "worsened" | "unknown";
  validatedByHcp: boolean;
  codes: ExternalCode[];
}

// ── Bloque 13: Privacidad y consentimiento ───────────────────────────────────

export type Visibility = "private" | "internal" | "shared" | "public";
export type ConsentStatus =
  | "not_required"
  | "pending"
  | "obtained"
  | "rejected"
  | "unknown";

export interface PrivacyBlock {
  visibility: Visibility;
  consentStatus: ConsentStatus;
  /** ¿Confirmada la desidentificación del paciente? */
  deIdentified: boolean;
}

// ── Campos complementarios (no bloquean la creación) ─────────────────────────

export interface ComplementaryFields {
  keywords: string[];
  medicalIntroduction?: TextField;
  extendedDiscussion?: TextField;
  bibliography: string[];
  patientPerspective?: TextField;
  adverseEvents: AdverseEvent[];
  limitations?: TextField;
  /** Adjuntos/imágenes (referencias a SourceDocument). */
  attachmentIds: string[];
}

// ── Documentos fuente (FHIR DocumentReference, simplificado) ──────────────────

export interface SourceDocument {
  sourceDocumentId: string;
  type: "ppt" | "pdf" | "image" | "text" | "manual_chat" | "voice" | "other";
  filename?: string;
  mimeType?: string;
  uploadedAt: string;
  uploadedBy: string;
  extractionStatus: "pending" | "processed" | "failed";
}

// ── El caso completo ─────────────────────────────────────────────────────────

export interface ClinicalCase {
  caseId: string;

  // Metadatos documentales (inspirado en Dublin Core)
  title: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorRole: string;
  organizationId?: string;

  // Estado (derivable, pero persistido para listados rápidos)
  status: CaseStatus;
  statusColor: CaseStatusColor;

  // 13 bloques mínimos obligatorios (CARE simplificado)
  summary: TextField; // 2
  patient: PatientBlock; // 3
  mainReason: TextField; // 4
  background: TextField; // 5
  keyFindings: TextField; // 6
  timeline: TimelineEvent[]; // 7
  primaryDiagnosis: DiagnosisBlock; // 8
  diagnosticAssessment: DiagnosticAssessment; // 9
  management: Treatment[]; // 10
  followUp: Outcome[]; // 11
  keyLearning: TextField; // 12
  privacy: PrivacyBlock; // 13

  // Indexación clínica
  specialty: ConceptRef[];
  caseType: ConceptRef[];
  searchTags: string[];

  // Complementarios + procedencia
  complementary: ComplementaryFields;
  sourceDocuments: SourceDocument[];
}
