/**
 * Barra de completitud y badge de estado del caso (semáforo rojo/naranja/verde).
 *
 * Sustituye al antiguo "7/10 de severidad": ahora mide cuánto de completo está
 * el caso según campos obligatorios + complementarios. Compartido por la
 * tarjeta, el detalle y el asistente de IA.
 */

import type { CaseCompleteness } from "@/lib/case-status";
import { STATUS_META } from "@/lib/case-status";
import type { CaseStatusColor } from "@/types/clinical-case";

export function StatusBadge({
  color,
  size = "sm",
}: {
  color: CaseStatusColor;
  size?: "sm" | "md";
}) {
  const m = STATUS_META[color];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${m.soft} ${
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

/** Barra fina para la tarjeta. Color = estado; relleno = % global. */
export function CompletenessBar({ c }: { c: CaseCompleteness }) {
  const m = STATUS_META[c.color];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${m.bar}`}
          style={{ width: `${Math.max(c.pct, 6)}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-medium text-slate-400">{c.pct}%</span>
    </div>
  );
}

/** Versión detallada con desglose obligatorios / complementarios. */
export function CompletenessDetail({ c }: { c: CaseCompleteness }) {
  const m = STATUS_META[c.color];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
          <span className="text-sm font-semibold text-slate-800">{m.label}</span>
        </div>
        <span className="text-sm font-bold text-slate-700">{c.pct}%</span>
      </div>

      {/* Un único relleno con el color del estado y una marca en el umbral de
          los obligatorios: así el color significa siempre lo mismo (el semáforo)
          y la marca dice a partir de dónde el caso deja de ser un borrador. */}
      <div className="relative mb-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${m.bar}`}
          style={{ width: `${c.pct}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-slate-300"
          style={{ left: `${(c.requiredTotal / (c.requiredTotal + c.complementaryTotal)) * 100}%` }}
          title="A partir de aquí, los mínimos obligatorios están completos"
        />
      </div>
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>
          Obligatorios{" "}
          <span className="font-semibold text-slate-600">
            {c.requiredDone}/{c.requiredTotal}
          </span>
        </span>
        <span>
          Complementarios{" "}
          <span className="font-semibold text-slate-600">
            {c.complementaryDone}/{c.complementaryTotal}
          </span>
        </span>
      </div>
    </div>
  );
}
