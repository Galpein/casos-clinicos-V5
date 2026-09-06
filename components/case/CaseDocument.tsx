/**
 * Documento del caso clínico (13 bloques CARE simplificado).
 *
 * Pieza central de la experiencia: es el "documento que se rellena en tiempo
 * real" mientras el HCP habla con la IA, y también la vista de lectura del
 * detalle. Cada campo muestra su estado (validado / propuesto por IA / sin
 * documentar) para que el médico vea de un vistazo qué falta y qué revisar.
 */

import type {
  ClinicalCase,
  DiagnosisBlock,
  Treatment,
  Outcome,
} from "@/types/clinical-case";
import { createContext, useContext } from "react";
import type { FieldValue } from "@/types/field";
import { Hint } from "@/components/ui/Hint";
import { hasContent, isPendingReview } from "@/types/field";
import {
  ageSummary,
  consentLabel,
  outcomeLabel,
  sexLabel,
  treatmentTypeLabel,
  visibilityLabel,
} from "@/lib/labels";

// ── Chips de estado de campo ─────────────────────────────────────────────────

/**
 * Acción de validar un campo suelto. La inyecta la pantalla de redacción; el
 * detalle del caso es de sólo lectura y no la pasa, así que allí los chips
 * son informativos.
 */
const ValidateContext = createContext<((path: string) => void) | null>(null);

export const PROPUESTO_HINT =
  "Lo ha rellenado el asistente a partir de lo que has contado. Queda como propuesta hasta que lo confirmes.";
export const VALIDADO_HINT =
  "Lo has confirmado tú. Los campos validados son los que cuentan para el nivel documental del caso.";

function FieldStateChip({ field, path }: { field: FieldValue<unknown>; path?: string }) {
  const validate = useContext(ValidateContext);

  if (isPendingReview(field)) {
    const chip = (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 ring-1 ring-amber-200">
        <SparkIcon /> Propuesto por IA
      </span>
    );
    if (!validate || !path) return <Hint text={PROPUESTO_HINT}>{chip}</Hint>;
    return (
      <span className="flex shrink-0 items-center gap-1.5">
        <Hint text={PROPUESTO_HINT}>{chip}</Hint>
        <button
          onClick={() => validate(path)}
          title="Dar por bueno este campo"
          className="rounded-full border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
        >
          Validar
        </button>
      </span>
    );
  }

  if (field.status === "present" && field.validatedByHcp) {
    return (
      <Hint text={VALIDADO_HINT}>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
          <CheckIcon /> Validado
        </span>
      </Hint>
    );
  }
  return null;
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Bloque ───────────────────────────────────────────────────────────────────

function Block({
  n,
  title,
  field,
  filled,
  highlighted,
  children,
}: {
  n: number;
  title: string;
  field: string;
  filled: boolean;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`block-${field}`}
      className={`scroll-mt-4 rounded-xl border p-4 transition-all duration-500 ${
        highlighted
          ? "border-blue-300 bg-blue-50/40 ring-2 ring-blue-200"
          : filled
            ? "border-slate-200 bg-white"
            : "border-dashed border-slate-200 bg-slate-50/50"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
            filled ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
          }`}
        >
          {n}
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      </div>
      <div className="pl-7 text-sm text-slate-700">{children}</div>
    </section>
  );
}

function Text({ field, placeholder, path }: { field: FieldValue<string>; placeholder: string; path?: string }) {
  const has = hasContent(field);
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <p className={has ? "text-slate-700" : "italic text-slate-400"}>
          {has ? field.value : placeholder}
        </p>
        <FieldStateChip field={field} path={path} />
      </div>
    </div>
  );
}

function isFilled(field: FieldValue<unknown>): boolean {
  return hasContent(field);
}

// ── Sub-render: diagnóstico, tratamientos, resultados ────────────────────────

function normalized(dx: DiagnosisBlock): string | undefined {
  return dx.concept?.normalizedLabel ?? dx.concept?.textFound;
}

function Diagnosis({ dx }: { dx: DiagnosisBlock }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-slate-800">
          {dx.label.value ?? <span className="italic text-slate-400">Sin diagnóstico</span>}
          {dx.isSuspected && <span className="ml-1 text-xs text-amber-600">(sospecha)</span>}
        </p>
        <FieldStateChip field={dx.label} path="diagnosis" />
      </div>
      {/* El término normalizado sólo se muestra si difiere de lo escrito por el
          médico: si coincide es ruido. El identificador interno del diccionario
          no se enseña (es de indexación, no de lectura clínica). */}
      {dx.concept &&
        normalized(dx) &&
        normalized(dx)!.toLowerCase() !== (dx.label.value ?? "").trim().toLowerCase() && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
              Indexado como: {normalized(dx)}
            </span>
          </div>
        )}
    </div>
  );
}

function TreatmentItem({ t, path }: { t: Treatment; path?: string }) {
  const validate = useContext(ValidateContext);
  return (
    <li className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <div>
        <p className="font-medium text-slate-800">
          {t.name}
          {t.dose && <span className="ml-1 font-normal text-slate-500">· {t.dose}</span>}
          {t.duration && <span className="ml-1 font-normal text-slate-500">· {t.duration}</span>}
        </p>
        <p className="text-[11px] text-slate-400">
          {treatmentTypeLabel[t.type]}
          {t.therapeuticClass && ` · ${t.therapeuticClass}`}
          {t.lineOfTherapy && ` · ${t.lineOfTherapy}`}
        </p>
      </div>
      {t.validatedByHcp ? (
        <Hint text={VALIDADO_HINT}>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
            <CheckIcon /> Validado
          </span>
        </Hint>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5">
          <Hint text={PROPUESTO_HINT}>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 ring-1 ring-amber-200">
              <SparkIcon /> Propuesto por IA
            </span>
          </Hint>
          {validate && path && (
            <button
              onClick={() => validate(path)}
              className="rounded-full border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              Validar
            </button>
          )}
        </span>
      )}
    </li>
  );
}

function OutcomeItem({ o }: { o: Outcome }) {
  return (
    <li className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="font-medium text-slate-800">
        {outcomeLabel[o.globalOutcome]}
        {o.magnitude && <span className="ml-1 font-normal text-slate-500">· {o.magnitude}</span>}
        {o.timeToOutcome && <span className="ml-1 font-normal text-slate-400">({o.timeToOutcome})</span>}
      </p>
      {o.narrative && <p className="text-[11px] text-slate-500">{o.narrative}</p>}
    </li>
  );
}

// ── Documento completo ───────────────────────────────────────────────────────

export { ValidateContext };

export function CaseDocument({
  caso,
  highlight,
}: {
  caso: ClinicalCase;
  highlight?: string;
}) {
  return (
    <div className="space-y-3">
      <Block n={1} title="Título" field="title" filled={!!caso.title} highlighted={highlight === "title"}>
        <p className={caso.title ? "font-semibold text-slate-900" : "italic text-slate-400"}>
          {caso.title || "Sin título"}
        </p>
      </Block>

      <Block n={2} title="Resumen breve" field="summary" filled={isFilled(caso.summary)} highlighted={highlight === "summary"}>
        <Text field={caso.summary} placeholder="Resumen del caso en 1-2 frases" path="summary" />
      </Block>

      <Block
        n={3}
        title="Paciente anonimizado"
        field="patient"
        filled={caso.patient.sex !== "unknown"}
        highlighted={highlight === "patient"}
      >
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {sexLabel[caso.patient.sex]}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {ageSummary(caso.patient.ageGroup, caso.patient.ageValue.value)}
          </span>
        </div>
        {isFilled(caso.patient.clinicalContext) && (
          <p className="mt-1.5 text-slate-600">{caso.patient.clinicalContext.value}</p>
        )}
      </Block>

      <Block n={4} title="Motivo principal" field="mainReason" filled={isFilled(caso.mainReason)} highlighted={highlight === "mainReason"}>
        <Text field={caso.mainReason} placeholder="Por qué este caso es relevante" path="mainReason" />
      </Block>

      <Block n={5} title="Antecedentes" field="background" filled={isFilled(caso.background)} highlighted={highlight === "background"}>
        <Text field={caso.background} placeholder="Antecedentes relevantes" path="background" />
      </Block>

      <Block n={6} title="Hallazgos clínicos" field="keyFindings" filled={isFilled(caso.keyFindings)} highlighted={highlight === "keyFindings"}>
        <Text field={caso.keyFindings} placeholder="Hallazgos clave de la exploración" path="keyFindings" />
      </Block>

      <Block n={7} title="Timeline" field="timeline" filled={caso.timeline.length > 0} highlighted={highlight === "timeline"}>
        {caso.timeline.length === 0 ? (
          <p className="italic text-slate-400">Secuencia temporal de eventos</p>
        ) : (
          <ol className="space-y-1.5">
            {caso.timeline.map((ev, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-20 shrink-0 font-mono text-[11px] font-semibold text-slate-400">{ev.when}</span>
                <span className="text-slate-700">{ev.event}</span>
              </li>
            ))}
          </ol>
        )}
      </Block>

      <Block n={8} title="Diagnóstico principal" field="diagnosis" filled={!!caso.primaryDiagnosis.label.value} highlighted={highlight === "diagnosis"}>
        <Diagnosis dx={caso.primaryDiagnosis} />
      </Block>

      <Block
        n={9}
        title="Evaluación diagnóstica"
        field="assessment"
        filled={isFilled(caso.diagnosticAssessment.testsPerformed)}
        highlighted={highlight === "assessment"}
      >
        <Text field={caso.diagnosticAssessment.testsPerformed} placeholder="Pruebas realizadas" path="assessment.tests" />
        {isFilled(caso.diagnosticAssessment.reasoning) && (
          <p className="mt-1.5 text-slate-600">{caso.diagnosticAssessment.reasoning.value}</p>
        )}
        {caso.diagnosticAssessment.differentials.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {caso.diagnosticAssessment.differentials.map((d) => (
              <span key={d} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                DDx: {d}
              </span>
            ))}
          </div>
        )}
      </Block>

      <Block n={10} title="Manejo / tratamiento" field="management" filled={caso.management.length > 0} highlighted={highlight === "management"}>
        {caso.management.length === 0 ? (
          <p className="italic text-slate-400">Tratamientos e intervenciones</p>
        ) : (
          <ul className="space-y-1.5">
            {caso.management.map((t, i) => (
              <TreatmentItem key={i} t={t} path={`management.${i}`} />
            ))}
          </ul>
        )}
      </Block>

      <Block n={11} title="Seguimiento y resultados" field="followUp" filled={caso.followUp.length > 0} highlighted={highlight === "followUp"}>
        {caso.followUp.length === 0 ? (
          <p className="italic text-slate-400">Evolución y resultados</p>
        ) : (
          <ul className="space-y-1.5">
            {caso.followUp.map((o, i) => (
              <OutcomeItem key={i} o={o} />
            ))}
          </ul>
        )}
      </Block>

      <Block n={12} title="Aprendizaje principal" field="keyLearning" filled={isFilled(caso.keyLearning)} highlighted={highlight === "keyLearning"}>
        <Text field={caso.keyLearning} placeholder="La lección clave del caso" path="keyLearning" />
      </Block>

      <Block n={13} title="Privacidad y consentimiento" field="privacy" filled={caso.privacy.consentStatus !== "unknown"} highlighted={highlight === "privacy"}>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              caso.privacy.consentStatus === "obtained" || caso.privacy.consentStatus === "not_required"
                ? "bg-emerald-50 text-emerald-600"
                : caso.privacy.consentStatus === "unknown"
                  ? "bg-slate-100 text-slate-500"
                  : "bg-amber-50 text-amber-600"
            }`}
          >
            {consentLabel[caso.privacy.consentStatus]}
          </span>
        </div>
      </Block>
    </div>
  );
}
