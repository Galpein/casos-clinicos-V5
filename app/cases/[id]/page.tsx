"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCasesStore } from "@/stores/cases.store";
import { computeCaseStatus } from "@/lib/case-status";
import { deriveLibraryIndex } from "@/lib/library-index";
import { formatDate } from "@/lib/utils";
import { openPresentation, printCase } from "@/lib/export/caseExport";
import { conditionMeta } from "@/components/case/condition";
import { CaseDocument } from "@/components/case/CaseDocument";
import { CompletenessDetail, StatusBadge } from "@/components/case/CompletenessBar";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  );
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const caso = useCasesStore((s) => s.cases.find((c) => c.caseId === id));

  if (!caso) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="text-sm text-slate-500">Caso no encontrado en esta sesión.</p>
        <Link href="/cases" className="text-sm font-medium text-blue-600 hover:underline">
          ← Volver a casos clínicos
        </Link>
      </div>
    );
  }

  const status = computeCaseStatus(caso);
  const index = deriveLibraryIndex(caso);
  const meta = conditionMeta(caso);
  const { Icon } = meta;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <Link href="/cases" className="mb-3 inline-block text-sm text-slate-400 transition-colors hover:text-slate-600">
          ← Casos clínicos
        </Link>
        <div className="flex items-start gap-5">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ${meta.bg} ${meta.ring}`}>
            <Icon className={`h-7 w-7 ${meta.color}`} />
          </div>
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ring-1 ${meta.codeChip}`}>
                {caso.caseId}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
              <StatusBadge color={status.color} size="md" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">{caso.title}</h1>
            <p className="mt-1 text-sm text-slate-500">Creado el {formatDate(caso.createdAt)}</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => printCase(caso)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Exportar PDF
            </button>
            <button
              onClick={() => openPresentation(caso)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Presentación
            </button>
          </div>
        </div>
      </div>

      {/* Cuerpo: documento + panel lateral */}
      <div className="grid gap-6 p-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <CaseDocument caso={caso} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <CompletenessDetail c={status} />

          {/* Qué falta */}
          {status.missingRequired.length + status.missingComplementary.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Para subir de nivel
              </p>
              <ul className="space-y-1.5 text-sm">
                {status.missingRequired.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {m.label}
                  </li>
                ))}
                {status.missingRequired.length === 0 &&
                  status.missingComplementary.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {m.label}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Library Index derivado */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Índice de biblioteca
            </p>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-[11px] text-slate-400">Diagnóstico</p>
                <div className="flex flex-wrap gap-1">
                  {index.primaryDiagnosis.map((d) => (
                    <Pill key={d.label}>{d.label}</Pill>
                  ))}
                </div>
              </div>
              {index.treatments.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] text-slate-400">Tratamientos</p>
                  <div className="flex flex-wrap gap-1">
                    {index.treatments.map((t, i) => (
                      <Pill key={i}>{t.label}</Pill>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-1 text-[11px] text-slate-400">Especialidad</p>
                <div className="flex flex-wrap gap-1">
                  {index.specialty.map((s) => (
                    <Pill key={s.label}>{s.label}</Pill>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
