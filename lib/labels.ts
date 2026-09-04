/** Etiquetas legibles en español para los enums del modelo. */

import type {
  AeSeverity,
  AgeGroup,
  ConsentStatus,
  GlobalOutcome,
  Sex,
  TreatmentType,
  Visibility,
} from "@/types/clinical-case";
import type { DataStatus } from "@/types/field";

export const sexLabel: Record<Sex, string> = {
  female: "Mujer",
  male: "Hombre",
  other: "Otro",
  unknown: "Sexo n/d",
};

export const ageGroupLabel: Record<AgeGroup, string> = {
  pediatric: "Pediátrico",
  adolescent: "Adolescente",
  adult: "Adulto",
  elderly: "Anciano",
  unknown: "Edad n/d",
};

export const consentLabel: Record<ConsentStatus, string> = {
  not_required: "No requerido",
  pending: "Pendiente de consentimiento",
  obtained: "Consentimiento obtenido",
  rejected: "Rechazado",
  unknown: "Sin definir",
};

export const visibilityLabel: Record<Visibility, string> = {
  private: "Privado",
  internal: "Uso interno",
  shared: "Compartible",
  public: "Público",
};

export const outcomeLabel: Record<GlobalOutcome, string> = {
  improved: "Mejoría",
  stable: "Estable",
  worsened: "Empeoramiento",
  progressed: "Progresión",
  resolved: "Resuelto",
  death: "Fallecimiento",
  unknown: "Desconocido",
  not_applicable: "No aplica",
};

export const treatmentTypeLabel: Record<TreatmentType, string> = {
  drug: "Fármaco",
  procedure: "Procedimiento",
  surgery: "Cirugía",
  radiotherapy: "Radioterapia",
  device: "Dispositivo",
  lifestyle: "Estilo de vida",
  diagnostic: "Diagnóstico",
  other: "Otro",
};

export const aeSeverityLabel: Record<AeSeverity, string> = {
  mild: "Leve",
  moderate: "Moderado",
  severe: "Grave",
  life_threatening: "Amenaza vital",
  fatal: "Mortal",
  unknown: "Desconocida",
  not_applicable: "No aplica",
};

export const dataStatusLabel: Record<DataStatus, string> = {
  present: "Presente",
  none: "No existe",
  not_applicable: "No aplica",
  not_documented: "No documentado",
  unknown: "Desconocido",
  pending_review: "Pendiente de revisión",
};

export function ageSummary(group: AgeGroup, value: number | null): string {
  if (value != null) return `${value} años`;
  return ageGroupLabel[group];
}
