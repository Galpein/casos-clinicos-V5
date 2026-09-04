"use client";

import { useEffect, useMemo, useState } from "react";
import { useCasesStore } from "@/stores/cases.store";
import { deriveLibraryIndex } from "@/lib/library-index";
import { CaseSummaryCard } from "@/components/CaseSummaryCard";
import { STATUS_META } from "@/lib/case-status";
import { sexLabel } from "@/lib/labels";
import type { CaseStatusColor, Sex } from "@/types/clinical-case";

function distinct(values: (string | undefined | null)[]): string[] {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function BibliotecaPage() {
  const cases = useCasesStore((s) => s.library);
  const loadLibrary = useCasesStore((s) => s.loadLibrary);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);
  const [query, setQuery] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [treatment, setTreatment] = useState("");
  const [sex, setSex] = useState("");
  const [statusColor, setStatusColor] = useState("");

  const INDEXED = useMemo(
    () => cases.map((c) => ({ caso: c, index: deriveLibraryIndex(c) })),
    [cases],
  );
  const DIAGNOSES = useMemo(
    () => distinct(INDEXED.flatMap((x) => x.index.primaryDiagnosis.map((d) => d.label))),
    [INDEXED],
  );
  const SPECIALTIES = useMemo(
    () => distinct(INDEXED.flatMap((x) => x.index.specialty.map((s) => s.label))),
    [INDEXED],
  );
  const TREATMENTS = useMemo(
    () => distinct(INDEXED.flatMap((x) => x.index.treatments.map((t) => t.label))),
    [INDEXED],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INDEXED.filter(({ index }) => {
      if (q) {
        const haystack = [
          index.title,
          index.summary,
          ...index.searchTags,
          ...index.primaryDiagnosis.map((d) => d.label),
          ...index.treatments.map((t) => t.label),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (diagnosis && !index.primaryDiagnosis.some((d) => d.label === diagnosis)) return false;
      if (specialty && !index.specialty.some((s) => s.label === specialty)) return false;
      if (treatment && !index.treatments.some((t) => t.label === treatment)) return false;
      if (sex && index.patient.sex !== (sex as Sex)) return false;
      if (statusColor && index.caseStatusColor !== (statusColor as CaseStatusColor)) return false;
      return true;
    });
  }, [INDEXED, query, diagnosis, specialty, treatment, sex, statusColor]);

  const activeFilters =
    [diagnosis, specialty, treatment, sex, statusColor].filter(Boolean).length +
    (query.trim() ? 1 : 0);

  const reset = () => {
    setQuery("");
    setDiagnosis("");
    setSpecialty("");
    setTreatment("");
    setSex("");
    setStatusColor("");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabecera */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">Profesional Sanitario</p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Biblioteca de casos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Busca y filtra por criterios clínicos. La búsqueda usa conceptos normalizados, no solo texto literal.
        </p>

        {/* Buscador */}
        <div className="mt-4">
          <div className="relative max-w-xl">
            <svg viewBox="0 0 24 24" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por patología, tratamiento, palabra clave…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Filtros simples */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Select
            label="Patología"
            value={diagnosis}
            onChange={setDiagnosis}
            options={[{ value: "", label: "Todas" }, ...DIAGNOSES.map((d) => ({ value: d, label: d }))]}
          />
          <Select
            label="Especialidad"
            value={specialty}
            onChange={setSpecialty}
            options={[{ value: "", label: "Todas" }, ...SPECIALTIES.map((d) => ({ value: d, label: d }))]}
          />
          <Select
            label="Tratamiento"
            value={treatment}
            onChange={setTreatment}
            options={[{ value: "", label: "Todos" }, ...TREATMENTS.map((d) => ({ value: d, label: d }))]}
          />
          <Select
            label="Sexo"
            value={sex}
            onChange={setSex}
            options={[
              { value: "", label: "Todos" },
              { value: "female", label: sexLabel.female },
              { value: "male", label: sexLabel.male },
            ]}
          />
          <Select
            label="Estado"
            value={statusColor}
            onChange={setStatusColor}
            options={[
              { value: "", label: "Todos" },
              { value: "green", label: STATUS_META.green.label },
              { value: "orange", label: STATUS_META.orange.label },
              { value: "red", label: STATUS_META.red.label },
            ]}
          />
          {activeFilters > 0 && (
            <button
              onClick={reset}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
            >
              Limpiar ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div className="p-8">
        <p className="mb-4 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{filtered.length}</span> de {INDEXED.length} casos
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-400">No hay casos que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(({ caso }) => (
              <CaseSummaryCard key={caso.caseId} caso={caso} href={`/biblioteca/${caso.caseId}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
