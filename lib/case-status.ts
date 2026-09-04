/**
 * Regla de producto: cálculo del estado de un caso (rojo / naranja / verde).
 *
 * Es la pieza transversal del producto. El mismo cálculo alimenta:
 *  - la barra de completitud de la tarjeta de caso,
 *  - el panel del asistente de IA (qué falta por rellenar),
 *  - el `caseStatusColor` del Library Index,
 *  - la regla de "publicable" (solo en naranja o superior).
 *
 * Rojo  (draft_incomplete): faltan campos mínimos obligatorios.
 * Naranja (internal_usable): mínimos obligatorios completos → usable en
 *          biblioteca interna/docente.
 * Verde (care_ready): además completa los campos CARE para exportar/publicar.
 */

import type {
  CaseStatus,
  CaseStatusColor,
  ClinicalCase,
} from "@/types/clinical-case";
import { hasContent, hasValue } from "@/types/field";

export interface CompletenessCheck {
  id: string;
  label: string;
  ok: boolean;
  group: "required" | "complementary";
}

export interface CaseCompleteness {
  color: CaseStatusColor;
  status: CaseStatus;
  checks: CompletenessCheck[];
  requiredTotal: number;
  requiredDone: number;
  complementaryTotal: number;
  complementaryDone: number;
  /** Fracción global 0..100 (obligatorios + complementarios). */
  pct: number;
  missingRequired: CompletenessCheck[];
  missingComplementary: CompletenessCheck[];
}

/**
 * Mínimos obligatorios para pasar de ROJO a NARANJA.
 * Espejo literal de la "regla de producto" del documento de diseño:
 * tratamiento y resultado cuentan aunque sean "no aplica"/"no documentado".
 */
function requiredChecks(c: ClinicalCase): CompletenessCheck[] {
  return [
    req("title", "Título", c.title.trim().length > 0),
    req("summary", "Resumen breve", hasContent(c.summary)),
    req(
      "diagnosis",
      "Diagnóstico principal",
      hasValue(c.primaryDiagnosis.label) || !!c.primaryDiagnosis.concept,
    ),
    req("specialty", "Especialidad", c.specialty.length > 0),
    req(
      "patient",
      "Paciente desidentificado",
      c.patient.deIdentified && c.patient.sex !== "unknown",
    ),
    // Tratamiento/intervención: basta con que exista una entrada con estado
    // explícito (incluido "no aplica"/"no documentado").
    req(
      "treatment",
      "Tratamiento / intervención principal",
      c.management.length > 0,
    ),
    // Resultado clínico: ídem, basta una entrada (aunque sea "no documentado").
    req("outcome", "Resultado clínico principal", c.followUp.length > 0),
    req("timeline", "Timeline básico", c.timeline.length > 0),
    req("learning", "Aprendizaje principal", hasContent(c.keyLearning)),
    req(
      "privacy",
      "Privacidad / consentimiento",
      c.privacy.consentStatus !== "unknown",
    ),
  ];
}

/**
 * Campos CARE adicionales para pasar de NARANJA a VERDE (care_ready).
 * Aquí sí exigimos contenido real y validación humana de los conceptos clave.
 */
function complementaryChecks(c: ClinicalCase): CompletenessCheck[] {
  return [
    comp("mainReason", "Motivo principal del caso", hasContent(c.mainReason)),
    comp("background", "Antecedentes relevantes", hasContent(c.background)),
    comp("findings", "Hallazgos clínicos clave", hasContent(c.keyFindings)),
    comp(
      "context",
      "Contexto clínico del paciente",
      hasContent(c.patient.clinicalContext),
    ),
    comp(
      "tests",
      "Evaluación diagnóstica",
      hasContent(c.diagnosticAssessment.testsPerformed),
    ),
    comp(
      "reasoning",
      "Razonamiento diagnóstico",
      hasContent(c.diagnosticAssessment.reasoning),
    ),
    comp(
      "dx_validated",
      "Diagnóstico validado por HCP",
      !!c.primaryDiagnosis.concept?.validatedByHcp,
    ),
    comp(
      "tx_validated",
      "Tratamiento validado por HCP",
      c.management.some((t) => t.validatedByHcp),
    ),
    comp(
      "outcome_validated",
      "Resultado validado por HCP",
      c.followUp.some((o) => o.validatedByHcp),
    ),
    comp("tags", "Palabras clave", c.searchTags.length > 0),
    comp(
      "consent_ok",
      "Consentimiento resuelto",
      c.privacy.consentStatus === "obtained" ||
        c.privacy.consentStatus === "not_required",
    ),
  ];
}

function req(id: string, label: string, ok: boolean): CompletenessCheck {
  return { id, label, ok, group: "required" };
}
function comp(id: string, label: string, ok: boolean): CompletenessCheck {
  return { id, label, ok, group: "complementary" };
}

export function computeCaseStatus(c: ClinicalCase): CaseCompleteness {
  const required = requiredChecks(c);
  const complementary = complementaryChecks(c);
  const checks = [...required, ...complementary];

  const requiredDone = required.filter((x) => x.ok).length;
  const complementaryDone = complementary.filter((x) => x.ok).length;
  const requiredTotal = required.length;
  const complementaryTotal = complementary.length;

  const allRequired = requiredDone === requiredTotal;
  const allComplementary = complementaryDone === complementaryTotal;

  let color: CaseStatusColor = "red";
  let status: CaseStatus = "draft_incomplete";
  if (allRequired && allComplementary) {
    color = "green";
    status = "care_ready";
  } else if (allRequired) {
    color = "orange";
    status = "internal_usable";
  }

  const total = requiredTotal + complementaryTotal;
  const pct = Math.round(((requiredDone + complementaryDone) / total) * 100);

  return {
    color,
    status,
    checks,
    requiredTotal,
    requiredDone,
    complementaryTotal,
    complementaryDone,
    pct,
    missingRequired: required.filter((x) => !x.ok),
    missingComplementary: complementary.filter((x) => !x.ok),
  };
}

// ── Presentación ─────────────────────────────────────────────────────────────

export const STATUS_META: Record<
  CaseStatusColor,
  { label: string; sub: string; bar: string; dot: string; text: string; soft: string }
> = {
  red: {
    label: "Borrador incompleto",
    sub: "Faltan campos obligatorios",
    bar: "bg-red-500",
    dot: "bg-red-500",
    text: "text-red-600",
    soft: "bg-red-50 text-red-600",
  },
  orange: {
    label: "Utilizable (interno)",
    sub: "Mínimos completos",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    text: "text-amber-600",
    soft: "bg-amber-50 text-amber-600",
  },
  green: {
    label: "Completo (CARE-ready)",
    sub: "Listo para exportar",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    soft: "bg-emerald-50 text-emerald-600",
  },
};

/** ¿Se puede publicar/compartir el caso? Solo de naranja en adelante. */
export function isPublishable(c: ClinicalCase): boolean {
  return computeCaseStatus(c).color !== "red";
}
