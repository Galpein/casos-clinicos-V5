"use client";

import { useState } from "react";
import type { ClinicalCase } from "@/types/clinical-case";
import { deriveLibraryIndex } from "@/lib/library-index";

/**
 * Visor de datos: muestra "la base de datos" real de un caso — el Clinical Case
 * completo y el Library Index derivado — para verificar que cada campo generado
 * por IA guarda { value, status, source, validatedByHcp }. Herramienta interna
 * de inspección/QA, no pensada para el HCP final.
 */
export function DataInspector({ caso }: { caso: ClinicalCase }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"case" | "index">("case");

  const data = tab === "case" ? caso : deriveLibraryIndex(caso);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">Ver datos (JSON)</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            inspección / QA
          </span>
        </div>
        <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs">
              <button
                onClick={() => setTab("case")}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  tab === "case" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Clinical Case
              </button>
              <button
                onClick={() => setTab("index")}
                className={`rounded-md px-3 py-1 font-medium transition-colors ${
                  tab === "index" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Library Index
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {tab === "case"
                ? "Objeto rico. Cada campo lleva value · status · source · validatedByHcp."
                : "Objeto ligero derivado automáticamente para búsqueda y analítica."}
            </p>
          </div>

          <pre className="max-h-[420px] overflow-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-100">
            {JSON.stringify(data, null, 2)}
          </pre>

          {tab === "case" && (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-500">
                <b className="text-slate-700">status</b>: present · pending_review · unknown · not_applicable · not_documented · none
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-500">
                <b className="text-slate-700">source</b>: chat · pdf · ppt · image · voice · manual
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-500">
                <b className="text-slate-700">validatedByHcp</b>: true / false
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
