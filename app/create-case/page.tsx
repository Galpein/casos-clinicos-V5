"use client";

import { useRouter } from "next/navigation";
import { useCreationStore } from "@/stores/creation.store";
import { useCasesStore } from "@/stores/cases.store";
import { computeCaseStatus } from "@/lib/case-status";
import { DocumentPanel } from "@/components/create/DocumentPanel";
import { AssistantChat } from "@/components/create/AssistantChat";

function SaveBar() {
  const caso = useCreationStore((s) => s.caso);
  const reset = useCreationStore((s) => s.reset);
  const addCase = useCasesStore((s) => s.addCase);
  const router = useRouter();
  const status = computeCaseStatus(caso);
  const canSave = status.color !== "red";

  const save = () => {
    addCase(caso);
    const id = caso.caseId;
    reset();
    router.push(`/cases/${id}`);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={!canSave}
        onClick={save}
        title={canSave ? "Guardar en biblioteca" : "Completa los campos mínimos (naranja) para guardar"}
        className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        Guardar caso
      </button>
    </div>
  );
}

export default function CreateCasePage() {
  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Cabecera */}
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600">
            Profesional Sanitario
          </p>
          <h1 className="text-lg font-bold text-slate-900">Crear caso clínico con IA</h1>
        </div>
        <SaveBar />
      </header>

      {/* Split: documento (izq) + asistente (der) */}
      <div className="flex flex-1 overflow-hidden">
        <section className="hidden w-[56%] border-r border-slate-200 lg:flex lg:flex-col">
          <DocumentPanel />
        </section>
        <section className="flex flex-1 flex-col">
          <AssistantChat />
        </section>
      </div>
    </div>
  );
}
