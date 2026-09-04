"use client";

import { useEffect, useMemo, useState } from "react";
import { useCasesStore } from "@/stores/cases.store";
import { deriveLibraryIndex } from "@/lib/library-index";
import type { LibraryIndex } from "@/types/library-index";
import {
  applyFilters,
  EMPTY_SELECTION,
  facetOptions,
  FACET_LABELS,
  sortItems,
  type FacetKey,
  type FacetOption,
  type Selection,
  type SortField,
} from "@/components/library/facets";
import {
  CaseSummaryPanel,
  FacetPanel,
  LibraryList,
  LibraryTable,
} from "@/components/library/LibraryViews";

/**
 * Biblioteca de casos.
 *
 * Deliberadamente distinta de "Mis casos": allí el médico ve tarjetas grandes
 * de lo suyo; aquí explora un fondo que crece hasta cientos de casos, así que
 * manda el filtrado y la densidad. Sólo entran los casos publicados: los
 * borradores no llegan a la biblioteca.
 */

const FACET_KEYS: FacetKey[] = ["specialty", "diagnosis", "treatment", "caseType", "level", "sex"];
const PER_PAGE = 10;

export default function BibliotecaPage() {
  const cases = useCasesStore((s) => s.library);
  const loadLibrary = useCasesStore((s) => s.loadLibrary);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [view, setView] = useState<"list" | "table">("list");
  const [sort, setSort] = useState<{ field: SortField; dir: 1 | -1 }>({ field: "updatedAt", dir: -1 });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const indexes: LibraryIndex[] = useMemo(() => cases.map(deriveLibraryIndex), [cases]);

  const options = useMemo(() => {
    const o = {} as Record<FacetKey, FacetOption[]>;
    for (const k of FACET_KEYS) o[k] = facetOptions(indexes, query, selection, k);
    return o;
  }, [indexes, query, selection]);

  const results = useMemo(
    () => sortItems(applyFilters(indexes, query, selection), sort.field, sort.dir),
    [indexes, query, selection, sort],
  );

  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const selected = results.find((r) => r.caseId === selectedId) ?? null;

  const activos = Object.values(selection).flat().length + (query.trim() ? 1 : 0);

  const toggle = (key: FacetKey, value: string) => {
    setPage(1);
    setSelection((s) => ({
      ...s,
      [key]: s[key].includes(value) ? s[key].filter((v) => v !== value) : [...s[key], value],
    }));
  };

  const clear = () => {
    setSelection(EMPTY_SELECTION);
    setQuery("");
    setPage(1);
  };

  const onSort = (field: SortField) =>
    setSort((s) => ({ field, dir: s.field === field ? ((s.dir * -1) as 1 | -1) : 1 }));

  // Explorar por especialidad: atajo a la faceta correspondiente.
  const especialidades = options.specialty.slice(0, 6);
  const retos = options.caseType.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
          Profesional Sanitario
        </p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Biblioteca de casos</h1>

        <div className="relative mt-4 max-w-3xl">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por patología, síntoma, tratamiento o palabra clave…"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Exploración rápida: lo que en los bocetos era "explorar por
            especialidad" y "por reto clínico". Son atajos a las facetas. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Explorar
          </span>
          {[...especialidades, ...retos].map((o) => {
            const key: FacetKey = especialidades.includes(o) ? "specialty" : "caseType";
            const active = selection[key].includes(o.value);
            return (
              <button
                key={`${key}-${o.value}`}
                onClick={() => toggle(key, o.value)}
                className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {o.value} <span className="text-slate-400">{o.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-8 p-8">
        <FacetPanel
          keys={FACET_KEYS}
          options={options}
          selection={selection}
          onToggle={toggle}
          onClear={clear}
          active={activos}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{results.length}</span>{" "}
              {results.length === 1 ? "caso" : "casos"}
              {activos > 0 && " con los filtros aplicados"}
            </p>

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
              {(["list", "table"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
                    view === v ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {v === "list" ? "Lista" : "Tabla"}
                </button>
              ))}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm text-slate-500">Ningún caso coincide con los filtros.</p>
              <button onClick={clear} className="mt-2 text-sm font-medium text-blue-600 hover:underline">
                Limpiar filtros
              </button>
            </div>
          ) : view === "list" ? (
            <div className="flex gap-6">
              <div className="min-w-0 flex-1">
                <LibraryList items={visible} selectedId={selectedId} onSelect={setSelectedId} />
              </div>
              {selected && (
                <div className="hidden w-80 shrink-0 xl:block">
                  <div className="sticky top-8">
                    <CaseSummaryPanel index={selected} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <LibraryTable
              items={visible}
              expandedId={selectedId}
              onExpand={(id) => setSelectedId(id === selectedId ? null : id)}
              sort={sort}
              onSort={onSort}
            />
          )}

          {pages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-[12px] text-slate-400">
                {(current - 1) * PER_PAGE + 1}–{Math.min(current * PER_PAGE, results.length)} de{" "}
                {results.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(current - 1)}
                  disabled={current === 1}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-600 disabled:opacity-40"
                >
                  ‹
                </button>
                {Array.from({ length: pages }, (_, n) => n + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`rounded-lg px-3 py-1 text-[13px] font-medium ${
                      n === current ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(current + 1)}
                  disabled={current === pages}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-600 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
