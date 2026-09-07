"use client";

import Link from "next/link";
import type { LibraryIndex } from "@/types/library-index";
import { STATUS_META } from "@/lib/case-status";
import { formatDate } from "@/lib/utils";
import { ageSummary, outcomeLabel, sexLabel } from "@/lib/labels";
import { useState } from "react";
import { FACET_LABELS, type FacetKey, type SortField } from "./facets";

// ── Piezas compartidas ──────────────────────────────────────────────────────

export function LevelChip({ index }: { index: LibraryIndex }) {
  const m = STATUS_META[index.caseStatusColor];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.soft}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{children}</span>
  );
}

// ── Panel de facetas ────────────────────────────────────────────────────────

const VISIBLES = 6;
/** Por debajo de esto no compensa un "mostrar más": se enseñan todas. */
const MINIMO_PARA_PLEGAR = 3;

/**
 * Panel de filtros.
 *
 * El catálogo de opciones es fijo (no depende de los filtros puestos) y lo
 * único que se mueve son los contadores. Las opciones que se quedan a cero se
 * atenúan pero siguen ahí: si desaparecieran, la lista cambiaría de alto en
 * cada clic y la página daría saltos.
 */
export function FacetPanel({
  keys,
  catalog,
  counts,
  selection,
  onToggle,
  onClear,
  active,
}: {
  keys: FacetKey[];
  catalog: Record<FacetKey, string[]>;
  counts: Record<FacetKey, Map<string, number>>;
  selection: Record<FacetKey, string[]>;
  onToggle: (key: FacetKey, value: string) => void;
  onClear: () => void;
  active: number;
}) {
  const [expandidas, setExpandidas] = useState<FacetKey[]>([]);

  return (
    <aside className="w-56 shrink-0">
      <div className="sticky top-6">
        <div className="mb-4 flex h-6 items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Filtros</h2>
          {active > 0 && (
            <button onClick={onClear} className="text-[11px] font-medium text-blue-600 hover:underline">
              Limpiar ({active})
            </button>
          )}
        </div>

        <div className="max-h-[calc(100vh-8rem)] space-y-5 overflow-y-auto pr-1">
          {keys.map((key) => {
            const todas = catalog[key];
            if (todas.length === 0) return null;
            const abierta = expandidas.includes(key);
            const ocultas = todas.length - VISIBLES;
            const plegable = ocultas >= MINIMO_PARA_PLEGAR;
            const visibles = !plegable || abierta ? todas : todas.slice(0, VISIBLES);
            return (
              <div key={key}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {FACET_LABELS[key]}
                </p>
                <div className="space-y-0.5">
                  {visibles.map((value) => {
                    const checked = selection[key].includes(value);
                    const count = counts[key].get(value) ?? 0;
                    const vacia = count === 0 && !checked;
                    return (
                      <label
                        key={value}
                        className={`flex items-center gap-2 rounded-md px-1 py-1 ${
                          vacia ? "cursor-default opacity-40" : "cursor-pointer hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={vacia}
                          onChange={() => onToggle(key, value)}
                          className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                        />
                        <span
                          title={value}
                          className={`flex-1 truncate text-[13px] ${checked ? "font-medium text-slate-900" : "text-slate-600"}`}
                        >
                          {value}
                        </span>
                        <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-slate-400">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {plegable && (
                  <button
                    onClick={() =>
                      setExpandidas((e) => (abierta ? e.filter((k) => k !== key) : [...e, key]))
                    }
                    className="mt-1 px-1 text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    {abierta ? "Mostrar menos" : `Mostrar ${ocultas} más`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ── Vista de lista ──────────────────────────────────────────────────────────

export function LibraryList({
  items,
  selectedId,
  onSelect,
}: {
  items: LibraryIndex[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {items.map((i) => {
        const selected = i.caseId === selectedId;
        return (
          <li key={i.caseId}>
            <button
              onClick={() => onSelect(i.caseId)}
              className={`flex w-full gap-4 px-4 py-3 text-left transition-colors ${
                selected ? "bg-blue-50/60" : "hover:bg-slate-50"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="line-clamp-2 flex-1 text-sm font-semibold text-slate-800">{i.title}</p>
                  <LevelChip index={i} />
                </div>
                <p className="mt-0.5 truncate text-[13px] text-slate-500">{i.summary}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {i.primaryDiagnosis[0] && <Tag>{i.primaryDiagnosis[0].label}</Tag>}
                  {i.treatments[0] && <Tag>{i.treatments[0].label}</Tag>}
                  {i.caseType[0] && <Tag>{i.caseType[0]}</Tag>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-slate-400">{formatDate(i.updatedAt)}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {sexLabel[i.patient.sex]} · {ageSummary(i.patient.ageGroup, i.patient.ageValue)}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ── Vista de tabla ──────────────────────────────────────────────────────────

const COLUMNS: { field: SortField | null; label: string; className?: string }[] = [
  { field: "title", label: "Caso" },
  { field: "diagnosis", label: "Patología" },
  { field: null, label: "Paciente" },
  { field: null, label: "Tratamiento" },
  { field: "level", label: "Nivel documental" },
  { field: "updatedAt", label: "Fecha", className: "text-right" },
];

export function LibraryTable({
  items,
  expandedId,
  onExpand,
  sort,
  onSort,
}: {
  items: LibraryIndex[];
  expandedId: string | null;
  onExpand: (id: string) => void;
  sort: { field: SortField; dir: 1 | -1 };
  onSort: (field: SortField) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[840px] text-left">
        <thead>
          <tr className="border-b border-slate-200">
            {COLUMNS.map((c) => (
              <th
                key={c.label}
                className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ${c.className ?? ""}`}
              >
                {c.field ? (
                  <button
                    onClick={() => onSort(c.field as SortField)}
                    className="inline-flex items-center gap-1 transition-colors hover:text-slate-700"
                  >
                    {c.label}
                    <span className="text-[9px]">
                      {sort.field === c.field ? (sort.dir === 1 ? "▲" : "▼") : "⇅"}
                    </span>
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((i) => (
            <FilaTabla
              key={i.caseId}
              index={i}
              expanded={expandedId === i.caseId}
              onExpand={() => onExpand(i.caseId)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilaTabla({
  index,
  expanded,
  onExpand,
}: {
  index: LibraryIndex;
  expanded: boolean;
  onExpand: () => void;
}) {
  return (
    <>
      <tr onClick={onExpand} className={`cursor-pointer transition-colors ${expanded ? "bg-blue-50/60" : "hover:bg-slate-50"}`}>
        <td className="max-w-xs px-4 py-3">
          <p className="truncate text-[13px] font-medium text-slate-800">{index.title}</p>
        </td>
        <td className="px-4 py-3 text-[13px] text-slate-600">
          {index.primaryDiagnosis[0]?.label ?? "—"}
        </td>
        <td className="px-4 py-3 text-[13px] text-slate-600">
          {sexLabel[index.patient.sex]}, {ageSummary(index.patient.ageGroup, index.patient.ageValue)}
        </td>
        <td className="max-w-[200px] truncate px-4 py-3 text-[13px] text-slate-600">
          {index.treatments.map((t) => t.label).join(", ") || "—"}
        </td>
        <td className="px-4 py-3">
          <LevelChip index={index} />
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right text-[12px] text-slate-400">
          {formatDate(index.updatedAt)}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50/30">
          <td colSpan={6} className="px-4 pb-4 pt-1">
            <CaseSummaryPanel index={index} compact />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Resumen de un caso (panel lateral y fila expandida) ─────────────────────

export function CaseSummaryPanel({ index, compact }: { index: LibraryIndex; compact?: boolean }) {
  const bloques = [
    { t: "Resumen", v: index.summary },
    { t: "Diagnóstico", v: index.primaryDiagnosis.map((d) => d.label).join(", ") },
    { t: "Tratamiento", v: index.treatments.map((t) => t.label).join(", ") },
    {
      t: "Resultado",
      // El índice guarda el valor interno ("improved"); aquí se enseña el
      // término en castellano, que es lo que lee el médico.
      v: index.outcomes
        .map((o) => outcomeLabel[o.globalOutcome as keyof typeof outcomeLabel] ?? o.globalOutcome)
        .join(", "),
    },
    { t: "Especialidad", v: index.specialty.map((s) => s.label).join(", ") },
  ].filter((b) => b.v);

  return (
    <div className={compact ? "" : "rounded-xl border border-slate-200 bg-white p-5"}>
      {!compact && (
        <>
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">{index.title}</h3>
            <LevelChip index={index} />
          </div>
          <p className="mb-4 font-mono text-[11px] text-slate-400">{index.caseId}</p>
        </>
      )}

      <dl className={compact ? "grid gap-4 sm:grid-cols-3 lg:grid-cols-5" : "space-y-3"}>
        {bloques.map((b) => (
          <div key={b.t}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{b.t}</dt>
            <dd className="mt-0.5 text-[13px] leading-snug text-slate-700">{b.v}</dd>
          </div>
        ))}
      </dl>

      {index.searchTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {index.searchTags.slice(0, 6).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      <Link
        href={`/cases/${index.caseId}`}
        className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:underline"
      >
        Ver caso completo →
      </Link>
    </div>
  );
}
