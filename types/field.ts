/**
 * Field-level data model — transversal a todo el caso clínico.
 *
 * Regla del documento de diseño: "Cada campo generado por IA debe guardar:
 * valor propuesto, estado del dato, fuente y si ha sido validado por el usuario".
 *
 * Por eso casi ningún dato del caso es un `string` pelado: va envuelto en
 * `FieldValue<T>`, que transporta el valor + su procedencia + su estado de
 * validación. Esto es lo que permite pintar los chips de "propuesto por IA /
 * pendiente de revisión / validado" y calcular el progreso del caso.
 */

/**
 * Estado de un dato. Diferenciarlos es importante (sección 15.2 del diseño):
 * no es lo mismo "no aplica" que "se desconoce" que "el documento no lo dice".
 */
export type DataStatus =
  | "present" // hay un valor afirmado
  | "none" // explícitamente no existe (p.ej. "sin alergias")
  | "not_applicable" // no aplica a este tipo de caso
  | "not_documented" // el caso/documento no lo incluye
  | "unknown" // se desconoce
  | "pending_review"; // la IA lo propone, falta validación del HCP

/** De dónde salió el dato. Inspirado en FHIR DocumentReference. */
export type SourceType =
  | "ppt"
  | "pdf"
  | "image"
  | "text"
  | "chat"
  | "voice"
  | "manual";

export interface Provenance {
  sourceType: SourceType;
  /** id del documento fuente, si procede de un adjunto */
  sourceDocumentId?: string;
  /** ubicación dentro de la fuente: "diapositiva 4", "p. 2", "min 1:32" */
  location?: string;
  /** fragmento textual exacto de donde se extrajo */
  excerpt?: string;
}

/**
 * Valor de un campo con su trazabilidad y estado de validación.
 * `confidence` solo se rellena cuando la propuesta viene de la IA (0..1).
 */
export interface FieldValue<T> {
  value: T | null;
  status: DataStatus;
  source?: Provenance;
  validatedByHcp: boolean;
  confidence?: number;
}

/** Azúcar: el caso de uso más frecuente es un campo de texto. */
export type TextField = FieldValue<string>;

// ── Helpers de construcción ──────────────────────────────────────────────────

/** Campo vacío (estado inicial de un bloque sin rellenar). */
export function emptyField<T>(): FieldValue<T> {
  return { value: null, status: "not_documented", validatedByHcp: false };
}

/** Campo afirmado y validado por una persona (entrada manual del HCP). */
export function manualField<T>(value: T): FieldValue<T> {
  return {
    value,
    status: "present",
    validatedByHcp: true,
    source: { sourceType: "manual" },
  };
}

/** Campo propuesto por la IA, pendiente de validación humana. */
export function aiField<T>(
  value: T,
  confidence: number,
  source?: Provenance,
): FieldValue<T> {
  return {
    value,
    status: "pending_review",
    validatedByHcp: false,
    confidence,
    source,
  };
}

// ── Predicados de estado ─────────────────────────────────────────────────────

/**
 * ¿El campo cuenta como "respondido"? Un dato cuenta cuando alguien (HCP o IA)
 * se ha pronunciado sobre él con un valor o un estado explícito — incluido
 * "no aplica" o "no documentado", que para la regla de producto SÍ cuentan en
 * tratamiento y resultado. Lo que NO cuenta es: vacío, desconocido o pendiente.
 */
export function isAnswered<T>(field: FieldValue<T> | undefined): boolean {
  if (!field) return false;
  if (field.status === "unknown" || field.status === "pending_review")
    return false;
  if (field.status === "present")
    return field.value !== null && field.value !== "";
  // none / not_applicable / not_documented son afirmaciones explícitas
  return true;
}

/** ¿Hay un valor afirmado de verdad (no solo "no aplica")? */
export function hasValue<T>(field: FieldValue<T> | undefined): boolean {
  return (
    !!field &&
    field.status === "present" &&
    field.value !== null &&
    field.value !== ""
  );
}

/**
 * ¿El bloque TIENE contenido, aunque aún no esté validado?
 * Incluye lo propuesto por IA (`pending_review`). Lo usa el semáforo de
 * completitud: el contenido (de IA o manual) basta para "naranja"; la
 * validación humana es lo que abre el "verde".
 */
export function hasContent<T>(field: FieldValue<T> | undefined): boolean {
  return (
    !!field &&
    (field.status === "present" || field.status === "pending_review") &&
    field.value !== null &&
    field.value !== ""
  );
}

/** ¿Está propuesto por IA y aún sin validar? (para el chip ámbar) */
export function isPendingReview<T>(field: FieldValue<T> | undefined): boolean {
  return !!field && field.status === "pending_review" && !field.validatedByHcp;
}
