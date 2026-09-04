"use client";

import { useEffect, useRef } from "react";
import { useCreationStore } from "@/stores/creation.store";
import { computeCaseStatus } from "@/lib/case-status";
import { CaseDocument } from "@/components/case/CaseDocument";
import { CompletenessDetail, StatusBadge } from "@/components/case/CompletenessBar";

export function DocumentPanel() {
  const { caso, highlight } = useCreationStore();
  const status = computeCaseStatus(caso);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al bloque que la IA acaba de rellenar.
  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(`block-${highlight}`);
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight, caso]);

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera del documento */}
      <div className="border-b border-slate-100 px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Documento del caso · {caso.caseId}
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {caso.title || "Nuevo caso clínico"}
            </p>
          </div>
          <StatusBadge color={status.color} size="md" />
        </div>
        <div className="mt-3">
          <CompletenessDetail c={status} />
        </div>
      </div>

      {/* Documento en vivo */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50/60 p-5">
        <CaseDocument caso={caso} highlight={highlight} />
        <div className="h-24" />
      </div>
    </div>
  );
}
