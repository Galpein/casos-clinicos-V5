/**
 * Contrato del asistente de creación.
 *
 * IMPORTANTE: este contrato es la frontera para sustituir el motor scripteado
 * por una llamada real a Claude. Un backend solo tiene que devolver un
 * `AssistantTurn`: un mensaje + parches sobre el caso + (opcionalmente) las 3
 * mejores propuestas para un hueco concreto. El resto de la app no cambia.
 */

import type { ClinicalCase } from "@/types/clinical-case";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Resumen legible de lo que la IA rellenó en este turno. */
  applied?: string[];
}

/** Un cambio concreto sobre el caso, con su resumen para el chat. */
export interface CasePatch {
  /** id del bloque (coincide con el `highlight` del documento). */
  field: string;
  summary: string;
  apply: (c: ClinicalCase) => ClinicalCase;
}

/** Una de las "3 mejores opciones" que el médico elige en vez de teclear. */
export interface Proposal {
  id: string;
  label: string;
  detail?: string;
  /** badge: de dónde sale (diccionario, contexto…). */
  source?: string;
  apply: (c: ClinicalCase) => ClinicalCase;
}

export interface ProposalSet {
  field: string;
  prompt: string;
  options: Proposal[];
  /** Permite "ninguna / no documentado". */
  allowSkip?: boolean;
}

export interface AssistantTurn {
  message: string;
  patches: CasePatch[];
  proposals?: ProposalSet;
  /** bloque a resaltar en el documento. */
  highlight?: string;
  /**
   * Si el turno hace una pregunta de TEXTO LIBRE (motivo, antecedentes,
   * aprendizaje…), aquí va el id del campo que espera. El siguiente mensaje
   * del usuario se captura directamente en ese campo en vez de re-preguntar.
   */
  expectsText?: string;
}
