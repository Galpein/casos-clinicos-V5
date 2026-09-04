"use client";

import Link from "next/link";
import { useCasesStore } from "@/stores/cases.store";
import { CURRENT_HCP } from "@/mock/user";
import { CaseSummaryCard } from "@/components/CaseSummaryCard";
import { computeCaseStatus, STATUS_META } from "@/lib/case-status";
import type { CaseStatusColor } from "@/types/clinical-case";

export default function CasesPage() {
  const cases = useCasesStore((s) => s.cases);

  const counts: Record<CaseStatusColor, number> = { red: 0, orange: 0, green: 0 };
  for (const c of cases) counts[computeCaseStatus(c).color]++;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabecera */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Profesional Sanitario
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Mis casos clínicos</h1>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{cases.length}</span> casos redactados
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Identidad del HCP — el nº de colegiado vive aquí, no en cada tarjeta */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                {CURRENT_HCP.name.split(" ").slice(-2).map((w) => w[0]).join("")}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-800">{CURRENT_HCP.name}</p>
                <p className="text-[11px] text-slate-400">
                  {CURRENT_HCP.specialty} · Col. {CURRENT_HCP.colegiado}
                </p>
              </div>
            </div>

            <Link
              href="/create-case"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              + Nuevo caso
            </Link>
          </div>
        </div>

        {/* Leyenda de estados (semáforo de completitud) */}
        <div className="mt-5 flex flex-wrap gap-2">
          {(["green", "orange", "red"] as CaseStatusColor[]).map((color) => {
            const m = STATUS_META[color];
            return (
              <div
                key={color}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1"
              >
                <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                <span className="text-xs font-medium text-slate-600">{m.label}</span>
                <span className="text-xs font-bold text-slate-800">{counts[color]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid de casos */}
      <div className="p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cases.map((caso) => (
            <CaseSummaryCard key={caso.caseId} caso={caso} />
          ))}
        </div>
      </div>
    </div>
  );
}
