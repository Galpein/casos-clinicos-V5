"use client";

import { create } from "zustand";
import type { ClinicalCase } from "@/types/clinical-case";
import { CLINICAL_CASES } from "@/mock/clinicalCases";
import { withComputedStatus } from "@/lib/case-factory";

/**
 * Fuente única de verdad de los casos en el cliente: semilla de la biblioteca
 * + los casos que el HCP va creando con el asistente. En memoria (sin backend);
 * se reinicia en recarga dura, coherente con la naturaleza demo.
 */
interface CasesState {
  cases: ClinicalCase[];
  addCase: (c: ClinicalCase) => void;
  getCase: (id: string) => ClinicalCase | undefined;
}

export const useCasesStore = create<CasesState>((set, get) => ({
  cases: CLINICAL_CASES,

  addCase: (c) => {
    const saved = withComputedStatus({ ...c, updatedAt: new Date().toISOString() });
    set((s) => {
      const exists = s.cases.some((x) => x.caseId === saved.caseId);
      return {
        cases: exists
          ? s.cases.map((x) => (x.caseId === saved.caseId ? saved : x))
          : [saved, ...s.cases],
      };
    });
  },

  getCase: (id) => get().cases.find((c) => c.caseId === id),
}));
