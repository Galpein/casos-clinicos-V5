import Link from "next/link";
import type { ClinicalCase } from "@/types/clinical-case";
import { computeCaseStatus } from "@/lib/case-status";
import { formatDate } from "@/lib/utils";
import { ageSummary, sexLabel } from "@/lib/labels";
import { conditionMeta } from "@/components/case/condition";
import { CompletenessBar, StatusBadge } from "@/components/case/CompletenessBar";

interface Props {
  caso: ClinicalCase;
  href?: string;
  /** Acciones sobre el caso (editar, eliminar). Se pintan fuera del enlace. */
  actions?: React.ReactNode;
}

export function CaseSummaryCard({ caso, href, actions }: Props) {
  const meta = conditionMeta(caso);
  const { Icon } = meta;
  const status = computeCaseStatus(caso);
  const tags = caso.searchTags.length
    ? caso.searchTags
    : caso.complementary.keywords;

  return (
    <div className="relative">
      {actions && (
        <div className="absolute right-3 top-3 z-10 flex gap-1">{actions}</div>
      )}
    <Link href={href ?? `/cases/${caso.caseId}`} className="group block">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        {/* Barra superior coloreada por patología */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${meta.gradient}`} />

        <div className="flex flex-1 flex-col p-5">
          {/* Header: icono + código (coloreado por patología) + estado */}
          <div className="mb-4 flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${meta.bg} ${meta.ring}`}>
              <Icon className={`h-5 w-5 ${meta.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                {/* Código del caso coloreado por código de patología */}
                <span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ring-1 ${meta.codeChip}`}>
                  {caso.caseId}
                </span>
                <StatusBadge color={status.color} />
              </div>
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-blue-700">
                {caso.title}
              </p>
            </div>
          </div>

          {/* Patología */}
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          </div>

          {/* Tags de búsqueda */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((s) => (
              <span key={s} className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
                {s}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500">
                +{tags.length - 3}
              </span>
            )}
          </div>

          {/* Perfil del paciente */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {[
              sexLabel[caso.patient.sex],
              ageSummary(caso.patient.ageGroup, caso.patient.ageValue.value),
              caso.specialty[0]?.normalizedLabel ?? caso.specialty[0]?.textFound,
            ]
              .filter(Boolean)
              .map((tag) => (
                <span key={tag as string} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                  {tag}
                </span>
              ))}
          </div>

          {/* Footer: barra de completitud (sustituye al 7/10) + fecha */}
          <div className="mt-auto border-t border-slate-100 pt-3">
            <CompletenessBar c={status} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {status.requiredDone}/{status.requiredTotal} obligatorios ·{" "}
                {status.complementaryDone}/{status.complementaryTotal} complementarios
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {formatDate(caso.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-blue-600 to-blue-500 py-2.5 text-center text-xs font-semibold text-white transition-transform duration-200 group-hover:translate-y-0">
          Ver caso completo →
        </div>
      </div>
    </Link>
    </div>
  );
}
