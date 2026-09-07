/**
 * Motor del asistente de creación (scripteado, dirigido por el diccionario).
 *
 * No "piensa" libremente: extrae entidades, las normaliza contra el Atlas
 * Concept Dictionary y propone, para cada hueco, las MEJORES 3 opciones de
 * nuestra base — no 50. Es la demostración de la experiencia; la frontera
 * `AssistantTurn` permite cambiarlo por una llamada real a Claude.
 */

import type { ClinicalCase } from "@/types/clinical-case";
import { hasContent } from "@/types/field";
import { computeCaseStatus } from "@/lib/case-status";
import { conceptLabel } from "@/lib/dictionary";
import { sexLabel } from "@/lib/labels";
import {
  addOutcome,
  addSearchTags,
  addTreatment,
  aiTreatment,
  setCaseType,
  setDiagnosis,
  setDiagnosisFromText,
  setPatient,
  setPrivacy,
  setSpecialty,
  setText,
  setTimeline,
  setTitle,
} from "./apply";
import {
  extractAge,
  extractConcepts,
  extractSex,
  extractSymptoms,
} from "./extract";
import type { AssistantTurn, CasePatch, Proposal, ProposalSet } from "./types";

export const EXAMPLE_INPUT =
  "Mujer de 34 años con dermatitis atópica moderada en pliegues del codo. " +
  "Picor intenso, eritema y descamación de 3 semanas. Empezamos con hidrocortisona " +
  "pero respondió poco, así que cambiamos a tacrolimus tópico con buena evolución.";

// Para cada patología, las 3 mejores opciones de tratamiento de NUESTRA base.
const TX_SUGGESTIONS: Record<string, { name: string; line: string; reason: string }[]> = {
  atlas_disease_atopic_dermatitis: [
    { name: "Hidrocortisona", line: "1ª línea", reason: "Corticoide tópico de baja potencia" },
    { name: "Tacrolimus", line: "2ª línea", reason: "Inhibidor de calcineurina, ahorra corticoide" },
    { name: "Cetirizina", line: "Coadyuvante", reason: "Control del prurito" },
  ],
  atlas_disease_contact_eczema: [
    { name: "Betametasona", line: "1ª línea", reason: "Corticoide tópico potente" },
    { name: "Hidrocortisona", line: "Mantenimiento", reason: "Zonas de piel fina" },
    { name: "Evitación del alérgeno", line: "Pilar", reason: "Medida no farmacológica" },
  ],
  atlas_disease_psoriasis: [
    { name: "Calcipotriol", line: "1ª línea", reason: "Análogo de vitamina D" },
    { name: "Betametasona", line: "1ª línea", reason: "Combinable con calcipotriol" },
    { name: "Fototerapia", line: "2ª línea", reason: "Si fallo tópico" },
  ],
  atlas_disease_rosacea: [
    { name: "Metronidazol tópico", line: "1ª línea", reason: "Papulopustulosa leve-moderada" },
    { name: "Ácido azelaico", line: "1ª línea", reason: "Alternativa tópica" },
    { name: "Doxiciclina", line: "2ª línea", reason: "Si afectación moderada" },
  ],
  atlas_disease_chronic_urticaria: [
    { name: "Cetirizina", line: "1ª línea", reason: "Antihistamínico H1" },
    { name: "Omalizumab", line: "3ª línea", reason: "Anti-IgE si refractaria" },
    { name: "Corticoide oral", line: "Rescate", reason: "Ciclo corto en brotes" },
  ],
};

let idc = 0;
const pid = () => `p${idc++}`;

/**
 * Campos NARRATIVOS de texto libre. Cuando el asistente pregunta por uno de
 * ellos, la respuesta del usuario se captura directamente aquí (texto que
 * escribe el HCP → validado por él). Cada entrada sabe a qué bloque del
 * documento pertenece (para el resaltado) y cómo aplicarse.
 */
const FREE_TEXT: Record<
  string,
  { block: string; label: string; set: (c: ClinicalCase, text: string) => ClinicalCase }
> = {
  title: { block: "title", label: "el título", set: (c, t) => setTitle(c, t) },
  summary: { block: "summary", label: "el resumen", set: (c, t) => setText(c, "summary", t, 1, { sourceType: "chat" }, true) },
  mainReason: { block: "mainReason", label: "el motivo principal", set: (c, t) => setText(c, "mainReason", t, 1, { sourceType: "chat" }, true) },
  background: { block: "background", label: "los antecedentes", set: (c, t) => setText(c, "background", t, 1, { sourceType: "chat" }, true) },
  findings: { block: "keyFindings", label: "los hallazgos clínicos", set: (c, t) => setText(c, "keyFindings", t, 1, { sourceType: "chat" }, true) },
  context: { block: "patient", label: "el contexto del paciente", set: (c, t) => setText(c, "patient.clinicalContext", t, 1, { sourceType: "chat" }, true) },
  tests: { block: "assessment", label: "la evaluación diagnóstica", set: (c, t) => setText(c, "assessment.tests", t, 1, { sourceType: "chat" }, true) },
  reasoning: { block: "assessment", label: "el razonamiento diagnóstico", set: (c, t) => setText(c, "assessment.reasoning", t, 1, { sourceType: "chat" }, true) },
  learning: { block: "keyLearning", label: "el aprendizaje principal", set: (c, t) => setText(c, "keyLearning", t, 1, { sourceType: "chat" }, true) },
  diagnosis: { block: "diagnosis", label: "el diagnóstico", set: (c, t) => setDiagnosisFromText(c, t) },
  tags: { block: "", label: "las palabras clave", set: (c, t) => addSearchTags(c, t.split(/[,;]/).map((s) => s.trim()).filter(Boolean)) },
};

// ── Turno principal: el usuario escribe / pega un caso ───────────────────────

/**
 * Entidades que puede aportar la IA. Son sugerencias en bruto: los términos se
 * resuelven igualmente contra el diccionario, y lo que no encaje entra como
 * texto propuesto. El vocabulario lo pone la casa, no el modelo.
 */
export interface AiHints {
  age: number | null;
  sex: "female" | "male" | "other" | null;
  diagnosis: string | null;
  treatments: string[];
  background: string | null;
  findings: string | null;
  outcome: string | null;
  specialty: string | null;
  timeline: { when: string; event: string }[];
  tags: string[];
}

export function respond(
  caso: ClinicalCase,
  userText: string,
  pendingField?: string,
  ai?: AiHints | null,
): AssistantTurn {
  const patches: CasePatch[] = [];
  const understood: string[] = [];
  let highlight: string | undefined;

  // 0) Si el asistente estaba esperando un texto concreto, captúralo ahí.
  const ft = pendingField ? FREE_TEXT[pendingField] : undefined;
  if (ft) {
    const text = userText.trim();
    patches.push({
      field: ft.block,
      summary: capitalize(ft.label),
      apply: (c) => ft.set(c, text),
    });
    highlight = ft.block || undefined;
  }

  // 1) Paciente (edad / sexo). Lo que diga la IA manda sobre el patrón de
  // texto, porque entiende construcciones que la expresión regular no ve.
  const age = ai?.age ?? extractAge(userText);
  const sex = ai?.sex ?? extractSex(userText);
  if ((age != null && caso.patient.ageValue.value == null) || (sex && caso.patient.sex === "unknown")) {
    patches.push({
      field: "patient",
      summary: `Paciente: ${sex ? sexLabel[sex] : ""}${age ? `, ${age} años` : ""}`.trim(),
      apply: (c) => setPatient(c, { sex: sex ?? undefined, ageValue: age ?? undefined }),
    });
    understood.push(`paciente ${sex ? sexLabel[sex].toLowerCase() : ""}${age ? ` de ${age} años` : ""}`);
    highlight ??= "patient";
  }

  // 2) Diagnóstico. Se busca en el texto y, si la IA propuso uno, también
  // sobre su propuesta: así "meduloblastoma" entra aunque el diccionario no lo
  // conozca, en vez de perderse.
  const dxs =
    pendingField === "diagnosis"
      ? []
      : [
          ...extractConcepts(userText, "diagnosis"),
          ...(ai?.diagnosis ? extractConcepts(ai.diagnosis, "diagnosis") : []),
        ];
  if (dxs.length && !caso.primaryDiagnosis.concept) {
    const dx = dxs[0];
    patches.push({
      field: "diagnosis",
      summary: `Diagnóstico: ${dx.label}`,
      apply: (c) => setDiagnosis(c, dx.textFound, dx.conceptId, dx.label, dx.confidence),
    });
    if (dx.textFound.toLowerCase() !== dx.label.toLowerCase())
      understood.push(`normalicé "${dx.textFound}" → ${dx.label}`);
    else understood.push(`diagnóstico ${dx.label.toLowerCase()}`);
    highlight = "diagnosis";

    // Especialidad por defecto según patología dermatológica
    if (caso.specialty.length === 0) {
      patches.push({
        field: "specialty",
        summary: "Especialidad: Dermatología",
        apply: (c) => setSpecialty(c, "dermatología", "atlas_specialty_dermatology", "Dermatología"),
      });
    }
  }

  // 2 bis) La IA vio un diagnóstico que el diccionario no reconoce: se guarda
  // como texto propuesto en vez de descartarlo. Queda marcado para que el
  // médico lo valide y, si se repite, se añade al vocabulario.
  if (!dxs.length && ai?.diagnosis && !caso.primaryDiagnosis.concept && pendingField !== "diagnosis") {
    const libre = ai.diagnosis.trim();
    patches.push({
      field: "diagnosis",
      summary: `Diagnóstico: ${libre}`,
      apply: (c) => setDiagnosisFromText(c, libre),
    });
    understood.push(`diagnóstico ${libre.toLowerCase()} (fuera del diccionario, pendiente de validar)`);
    highlight = "diagnosis";
  }

  // 3) Tratamientos detectados
  const drugs = [
    ...extractConcepts(userText, "drug"),
    ...(ai?.treatments ?? []).flatMap((t) => extractConcepts(t, "drug")),
  ];
  for (const d of drugs) {
    if (caso.management.some((t) => t.concept?.conceptId === d.conceptId)) continue;
    patches.push({
      field: "management",
      summary: `Tratamiento: ${d.label}`,
      apply: (c) => addTreatment(c, aiTreatment(d.label)),
    });
    understood.push(`tratamiento ${d.label.toLowerCase()}`);
    highlight ??= "management";
  }

  // 3 bis) Tratamientos que la IA nombra y el diccionario no conoce.
  const yaPropuestos = new Set(drugs.map((d) => d.label.toLowerCase()));
  for (const libre of ai?.treatments ?? []) {
    const nombre = libre.trim();
    if (!nombre || yaPropuestos.has(nombre.toLowerCase())) continue;
    if (extractConcepts(nombre, "drug").length) continue;
    if (caso.management.some((t) => t.name.toLowerCase() === nombre.toLowerCase())) continue;
    patches.push({
      field: "management",
      summary: `Tratamiento: ${nombre}`,
      apply: (c) => addTreatment(c, aiTreatment(nombre)),
    });
    understood.push(`tratamiento ${nombre.toLowerCase()} (fuera del diccionario)`);
    highlight ??= "management";
  }

  // 4) Hallazgos clínicos (síntomas)
  const symptoms = extractSymptoms(userText);
  const hallazgosIa = ai?.findings?.trim();
  if (hallazgosIa && !symptoms.length && caso.keyFindings.status !== "present" && pendingField !== "findings") {
    patches.push({
      field: "keyFindings",
      summary: "Hallazgos clínicos",
      apply: (c) => setText(c, "keyFindings", hallazgosIa, 0.8, { sourceType: "chat", excerpt: userText.slice(0, 120) }),
    });
  }
  const antecedentesIa = ai?.background?.trim();
  if (antecedentesIa && caso.background.status !== "present" && pendingField !== "background") {
    patches.push({
      field: "background",
      summary: "Antecedentes",
      apply: (c) => setText(c, "background", antecedentesIa, 0.8, { sourceType: "chat" }),
    });
  }

  if (ai?.tags?.length) {
    patches.push({
      field: "searchTags",
      summary: "Etiquetas de búsqueda",
      apply: (c) => addSearchTags(c, ai.tags.slice(0, 6)),
    });
  }
  if (ai?.timeline?.length && caso.timeline.length === 0) {
    const hitos = ai.timeline.slice(0, 6);
    patches.push({
      field: "timeline",
      summary: "Secuencia temporal",
      apply: (c) => setTimeline(c, hitos.map((h) => ({ when: h.when, event: h.event, validatedByHcp: false }))),
    });
  }
  if (symptoms.length && caso.keyFindings.status !== "present" && pendingField !== "findings") {
    const text = capitalize(symptoms.join(", ")) + ".";
    patches.push({
      field: "keyFindings",
      summary: "Hallazgos clínicos",
      apply: (c) => setText(c, "keyFindings", text, 0.8, { sourceType: "chat", excerpt: userText.slice(0, 120) }),
    });
    patches.push({
      field: "searchTags",
      summary: "Etiquetas de búsqueda",
      apply: (c) => addSearchTags(c, symptoms),
    });
  }

  // 5) Título + resumen automáticos cuando hay diagnóstico + paciente
  const projected = compose(caso, patches);
  if (!projected.title && projected.primaryDiagnosis.concept) {
    const t = autoTitle(projected);
    patches.push({ field: "title", summary: "Título generado", apply: (c) => setTitle(c, t) });
  }
  if (!hasContent(projected.summary) && projected.primaryDiagnosis.concept) {
    const s = autoSummary(projected);
    patches.push({
      field: "summary",
      summary: "Resumen generado",
      apply: (c) => setText(c, "summary", s, 0.75, { sourceType: "chat" }),
    });
  }

  // 6) Mensaje + siguiente hueco
  const after = compose(caso, patches);
  const next = nextPrompt(after);

  let message: string;
  if (ft) {
    // Capturamos la respuesta de texto libre en el campo que se preguntaba.
    const extra = understood.length ? ` También he detectado: ${understood.join("; ")}.` : "";
    message = `Anotado en ${ft.label}.${extra} ${next.message}`;
  } else if (understood.length) {
    message = `He entendido: ${understood.join("; ")}. Lo he ido rellenando en el documento (queda como *propuesto por IA* hasta que lo valides). ${next.message}`;
  } else {
    message = `No he reconocido datos clínicos concretos en eso. ${next.message}`;
  }

  return {
    message,
    patches,
    proposals: next.proposals,
    highlight: highlight ?? next.highlight,
    expectsText: next.expectsText,
  };
}

// ── Siguiente hueco: pregunta o top-3 propuestas ─────────────────────────────

export function nextPrompt(caso: ClinicalCase): AssistantTurn {
  const status = computeCaseStatus(caso);
  const missing = status.missingRequired[0] ?? status.missingComplementary[0];

  if (!missing) {
    return {
      message:
        status.color === "green"
          ? "El caso está **completo (verde)**. Puedes exportarlo o generar la presentación."
          : "Los campos mínimos están listos: el caso es **utilizable (naranja)**. ¿Lo validas o seguimos completando para dejarlo en verde?",
      patches: [],
    };
  }

  const ps = buildProposals(caso, missing.id);
  if (ps) {
    return {
      message: questionFor(missing.id),
      patches: [],
      proposals: ps,
      highlight: ps.field,
    };
  }

  // Hueco de texto libre: preguntamos y quedamos a la espera de la respuesta.
  const ft = FREE_TEXT[missing.id];
  if (ft) {
    return {
      message: questionFor(missing.id),
      patches: [],
      highlight: ft.block || undefined,
      expectsText: missing.id,
    };
  }

  // Huecos de validación (dx/tx/outcome): el texto no los resuelve → guiar al botón.
  if (missing.id.endsWith("_validated")) {
    return {
      message:
        "Solo falta confirmar lo propuesto. Pulsa **«Revisar y validar lo propuesto por IA»** para dejarlo validado por ti.",
      patches: [],
    };
  }

  return { message: questionFor(missing.id), patches: [], highlight: missing.id };
}

function questionFor(id: string): string {
  const q: Record<string, string> = {
    patient: "¿Qué edad y sexo tiene el paciente?",
    diagnosis: "¿Cuál es el diagnóstico principal o tu sospecha?",
    specialty: "¿En qué especialidad encuadrarías el caso?",
    treatment: "¿Qué tratamiento o intervención se usó? Te propongo las opciones más frecuentes:",
    outcome: "¿Cuál fue el resultado clínico?",
    timeline: "¿Cómo fue la secuencia temporal? Puedo generarte un timeline básico:",
    learning: "¿Cuál es el aprendizaje principal? Puedo proponerte uno:",
    privacy: "¿Cuál es el estado de privacidad y consentimiento?",
    summary: "Cuéntame el caso en una o dos frases y redacto el resumen.",
    title: "¿Cómo titularías el caso?",
    mainReason: "¿Por qué es relevante este caso?",
    background: "¿Qué antecedentes relevantes tiene el paciente?",
    findings: "¿Qué hallazgos clínicos clave hubo en la exploración?",
    context: "¿Algún contexto clínico relevante del paciente?",
    tests: "¿Qué pruebas diagnósticas se realizaron?",
    reasoning: "¿Cuál fue el razonamiento diagnóstico?",
    tags: "Añado palabras clave para la biblioteca.",
  };
  return q[id] ?? "Sigamos completando el caso.";
}

function buildProposals(caso: ClinicalCase, id: string): ProposalSet | null {
  switch (id) {
    case "treatment": {
      const dxId = caso.primaryDiagnosis.concept?.conceptId ?? "";
      const sug = TX_SUGGESTIONS[dxId] ?? [];
      if (!sug.length) return null;
      return {
        field: "management",
        prompt: questionFor("treatment"),
        allowSkip: true,
        options: sug.map((s) => ({
          id: pid(),
          label: s.name,
          detail: `${s.line} · ${s.reason}`,
          source: "Atlas Dictionary",
          apply: (c) => addTreatment(c, aiTreatment(s.name, { lineOfTherapy: s.line, reasonForUse: s.reason, validatedByHcp: true, status: "present" })),
        })),
      };
    }
    case "outcome":
      return {
        field: "followUp",
        prompt: questionFor("outcome"),
        allowSkip: true,
        options: [
          outcomeProposal("improved", "Mejoría", "El cuadro mejoró"),
          outcomeProposal("stable", "Estable", "Sin cambios significativos"),
          outcomeProposal("worsened", "Empeoramiento", "El cuadro empeoró"),
        ],
      };
    case "specialty":
      return {
        field: "specialty",
        prompt: questionFor("specialty"),
        options: [
          specialtyProposal("Dermatología", "atlas_specialty_dermatology"),
          specialtyProposal("Alergología", "atlas_specialty_allergology"),
        ],
      };
    case "privacy":
      return {
        field: "privacy",
        prompt: questionFor("privacy"),
        options: [
          consentProposal("Consentimiento obtenido", "obtained", "shared"),
          consentProposal("Pendiente de consentimiento", "pending", "internal"),
          consentProposal("No requerido (uso interno)", "not_required", "internal"),
        ],
      };
    case "timeline":
      return {
        field: "timeline",
        prompt: questionFor("timeline"),
        allowSkip: true,
        options: [
          {
            id: pid(),
            label: "Generar timeline básico",
            detail: "A partir de los datos del caso",
            source: "IA",
            apply: (c) => setTimeline(c, basicTimeline(c)),
          },
        ],
      };
    case "learning":
      return {
        field: "keyLearning",
        prompt: questionFor("learning"),
        allowSkip: true,
        options: [
          {
            id: pid(),
            label: "Proponer aprendizaje",
            detail: draftLearning(caso),
            source: "IA",
            apply: (c) => setText(c, "keyLearning", draftLearning(c), 0.7, { sourceType: "chat" }),
          },
        ],
      };
    case "diagnosis":
      return {
        field: "diagnosis",
        prompt: questionFor("diagnosis"),
        options: [
          dxProposal("atlas_disease_atopic_dermatitis"),
          dxProposal("atlas_disease_psoriasis"),
          dxProposal("atlas_disease_chronic_urticaria"),
        ],
      };
    default:
      return null;
  }
}

// ── Builders de propuestas ───────────────────────────────────────────────────

function outcomeProposal(go: "improved" | "stable" | "worsened", label: string, detail: string): Proposal {
  return {
    id: pid(),
    label,
    detail,
    apply: (c) => addOutcome(c, { globalOutcome: go, outcomeType: "clinical", validatedByHcp: true }),
  };
}
function specialtyProposal(label: string, conceptId: string): Proposal {
  return { id: pid(), label, source: "Atlas Dictionary", apply: (c) => setSpecialty(c, label, conceptId, label) };
}
function consentProposal(
  label: string,
  consent: ClinicalCase["privacy"]["consentStatus"],
  visibility: ClinicalCase["privacy"]["visibility"],
): Proposal {
  return { id: pid(), label, apply: (c) => setPrivacy(c, { consentStatus: consent, visibility, deIdentified: true }) };
}
function dxProposal(conceptId: string): Proposal {
  const label = conceptLabel(conceptId) ?? conceptId;
  return { id: pid(), label, source: "Atlas Dictionary", apply: (c) => setDiagnosis(c, label, conceptId, label, 0.9) };
}

// ── Helpers de redacción ─────────────────────────────────────────────────────

function compose(caso: ClinicalCase, patches: CasePatch[]): ClinicalCase {
  return patches.reduce((acc, p) => p.apply(acc), caso);
}

function sexNoun(c: ClinicalCase): string {
  return c.patient.sex === "female" ? "mujer" : c.patient.sex === "male" ? "varón" : "paciente";
}

function autoTitle(c: ClinicalCase): string {
  const dx = c.primaryDiagnosis.concept?.normalizedLabel ?? c.primaryDiagnosis.label.value ?? "Caso";
  const age = c.patient.ageValue.value;
  return `${dx} en ${sexNoun(c)}${age ? ` de ${age} años` : ""}`;
}

function autoSummary(c: ClinicalCase): string {
  const dx = c.primaryDiagnosis.concept?.normalizedLabel ?? "el cuadro";
  const age = c.patient.ageValue.value;
  const tx = c.management.map((t) => t.name).slice(0, 2).join(" y ");
  return `${capitalize(sexNoun(c))}${age ? ` de ${age} años` : ""} con ${dx.toLowerCase()}${tx ? `, manejado con ${tx}` : ""}.`;
}

function draftLearning(c: ClinicalCase): string {
  const dx = c.primaryDiagnosis.concept?.normalizedLabel ?? "este cuadro";
  const tx = c.management.find((t) => t.lineOfTherapy?.includes("2"))?.name ?? c.management[0]?.name;
  return tx
    ? `En ${dx.toLowerCase()}, ${tx} fue una opción eficaz tras la valoración inicial.`
    : `El manejo escalonado fue clave en la evolución de ${dx.toLowerCase()}.`;
}

function basicTimeline(c: ClinicalCase): { when: string; event: string }[] {
  const events = [{ when: "Inicio", event: "Presentación del cuadro" }];
  if (c.management[0]) events.push({ when: "Tratamiento", event: `Inicio de ${c.management[0].name}` });
  if (c.management[1]) events.push({ when: "Ajuste", event: `Cambio a ${c.management[1].name}` });
  if (c.followUp[0]) events.push({ when: "Seguimiento", event: "Evaluación de respuesta" });
  return events;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function setCaseTypeFromContext(c: ClinicalCase): ClinicalCase {
  if (c.caseType.length) return c;
  if (c.management.length && c.followUp.length)
    return setCaseType(c, "respuesta a tratamiento", "atlas_casetype_treatment_response", "Respuesta a tratamiento");
  return c;
}
