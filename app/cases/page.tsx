"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCasesStore } from "@/stores/cases.store";
import { CURRENT_HCP } from "@/mock/user";
import { CaseSummaryCard } from "@/components/CaseSummaryCard";
import { computeCaseStatus, STATUS_META } from "@/lib/case-status";
import type { CaseStatusColor, ClinicalCase } from "@/types/clinical-case";

export default function CasesPage() {
  const cases = useCasesStore((s) => s.cases);
  const loadMine = useCasesStore((s) => s.loadMine);
  const removeCase = useCasesStore((s) => s.removeCase);
  const loading = useCasesStore((s) => s.loading);
  const loaded = useCasesStore((s) => s.loaded);
  const [aBorrar, setABorrar] = useState<ClinicalCase | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  const confirmarBorrado = async () => {
    if (!aBorrar) return;
    const result = await removeCase(aBorrar.caseId);
    setABorrar(null);
    setAviso(
      result === "kept_in_library"
        ? "Retirado de tus casos. Como ya estaba en la biblioteca, la entrada sigue disponible allí."
        : result === "deleted"
          ? "Borrador eliminado."
          : "No se ha podido eliminar el caso.",
    );
    setTimeout(() => setAviso(null), 6000);
  };

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
                  {CURRENT_HCP.colegiado}
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
        {loading && !loaded && (
          <p className="text-sm text-slate-400">Cargando tus casos…</p>
        )}
        {loaded && cases.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">Todavía no tienes ningún caso.</p>
            <Link
              href="/create-case"
              className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Crear el primero
            </Link>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cases.map((caso) => (
            <CaseSummaryCard
              key={caso.caseId}
              caso={caso}
              actions={
                <>
                  <Link
                    href={`/create-case?id=${encodeURIComponent(caso.caseId)}`}
                    title="Seguir editando este caso"
                    className="rounded-lg border border-slate-200 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur transition-colors hover:border-blue-300 hover:text-blue-600"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => setABorrar(caso)}
                    title="Eliminar este caso"
                    className="rounded-lg border border-slate-200 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-500 shadow-sm backdrop-blur transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </>
              }
            />
          ))}
        </div>

        {aviso && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">
            {aviso}
          </div>
        )}

        {aBorrar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900">¿Eliminar este caso?</h2>
              <p className="mt-2 text-sm text-slate-600">{aBorrar.title || aBorrar.caseId}</p>
              <p className="mt-3 text-sm text-slate-500">
                {computeCaseStatus(aBorrar).color === "red"
                  ? "Es un borrador y no está en la biblioteca: se elimina definitivamente."
                  : "Este caso ya está en la biblioteca. Desaparecerá de tus casos, pero la entrada de biblioteca se conserva."}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setABorrar(null)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarBorrado}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
