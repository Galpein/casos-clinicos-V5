"use client";

import { create } from "zustand";
import type { ClinicalCase } from "@/types/clinical-case";
import { withComputedStatus } from "@/lib/case-factory";

/**
 * Casos del profesional y fondo de la biblioteca.
 *
 * Antes vivían en memoria y se perdían al recargar. Ahora la fuente de verdad
 * es el servidor (`/api/cases`, `/api/library`) y este store es una caché de
 * cliente: escribe de forma optimista para que la interfaz responda al
 * instante y revierte si el servidor rechaza el cambio.
 */
interface CasesState {
  cases: ClinicalCase[];
  library: ClinicalCase[];
  loaded: boolean;
  loading: boolean;
  error: string | null;

  loadMine: () => Promise<void>;
  loadLibrary: () => Promise<void>;
  saveCase: (c: ClinicalCase) => Promise<ClinicalCase | null>;
  removeCase: (id: string) => Promise<"deleted" | "kept_in_library" | "error">;
  getCase: (id: string) => ClinicalCase | undefined;
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json() as Promise<T>;
}

export const useCasesStore = create<CasesState>((set, get) => ({
  cases: [],
  library: [],
  loaded: false,
  loading: false,
  error: null,

  loadMine: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const { cases } = await json<{ cases: ClinicalCase[] }>("/api/cases");
      set({ cases, loaded: true, loading: false });
    } catch (e) {
      set({ loading: false, loaded: true, error: (e as Error).message });
    }
  },

  loadLibrary: async () => {
    try {
      const { cases } = await json<{ cases: ClinicalCase[] }>("/api/library");
      set({ library: cases });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  /** Alta o actualización. Lo usan tanto el botón de guardar como el autoguardado. */
  saveCase: async (c) => {
    const saved = withComputedStatus({ ...c, updatedAt: new Date().toISOString() });

    // Optimista: la lista se actualiza antes de que conteste el servidor.
    const previous = get().cases;
    set((s) => ({
      cases: s.cases.some((x) => x.caseId === saved.caseId)
        ? s.cases.map((x) => (x.caseId === saved.caseId ? saved : x))
        : [saved, ...s.cases],
    }));

    try {
      const { caso } = await json<{ caso: ClinicalCase }>("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(saved),
      });
      set((s) => ({ cases: s.cases.map((x) => (x.caseId === caso.caseId ? caso : x)) }));
      return caso;
    } catch (e) {
      set({ cases: previous, error: (e as Error).message });
      return null;
    }
  },

  removeCase: async (id) => {
    const previous = get().cases;
    set((s) => ({ cases: s.cases.filter((c) => c.caseId !== id) }));
    try {
      const { result } = await json<{ result: "deleted" | "kept_in_library" }>(
        `/api/cases/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      return result;
    } catch (e) {
      set({ cases: previous, error: (e as Error).message });
      return "error";
    }
  },

  getCase: (id) => get().cases.find((c) => c.caseId === id) ?? get().library.find((c) => c.caseId === id),
}));
