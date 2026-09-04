"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCasesStore } from "@/stores/cases.store";
import { deriveLibraryIndex } from "@/lib/library-index";
import {
  aggregate,
  DIMENSION_LABEL,
  Dimension,
  distinctValues,
  Filters,
  ROBUSTNESS_META,
  summaryKpis,
} from "@/lib/analytics/aggregate";
import { printReport, type ReportView } from "@/lib/analytics/report";

const BAR_COLORS = ["#8b5cf6", "#6366f1", "#a855f7", "#7c3aed", "#c084fc", "#818cf8", "#d8b4fe"];

const QUESTIONS: { q: string; dim: Dimension; filters: Filters }[] = [
  { q: "Tratamientos más usados", dim: "treatment", filters: {} },
  { q: "Distribución por patología", dim: "diagnosis", filters: {} },
  { q: "Resultados clínicos", dim: "outcome", filters: {} },
  { q: "Eventos adversos", dim: "adverseEvent", filters: {} },
  { q: "Resultados en Psoriasis", dim: "outcome", filters: { diagnosis: "Psoriasis" } },
];

function viewTitle(dim: Dimension, f: Filters): string {
  const parts: string[] = [];
  if (f.diagnosis) parts.push(f.diagnosis);
  if (f.treatment) parts.push(f.treatment);
  return parts.length ? `${DIMENSION_LABEL[dim]} · ${parts.join(" · ")}` : DIMENSION_LABEL[dim];
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
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
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
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

export function AnalyticsExplorer() {
  // La analítica se calcula sobre la biblioteca (casos publicados), no sobre
  // los borradores privados de cada profesional.
  const cases = useCasesStore((s) => s.library);
  const loadLibrary = useCasesStore((s) => s.loadLibrary);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);
  const indexes = useMemo(() => cases.map(deriveLibraryIndex), [cases]);
  const kpis = useMemo(() => summaryKpis(indexes), [indexes]);

  const [dimension, setDimension] = useState<Dimension>("treatment");
  const [filters, setFilters] = useState<Filters>({});
  const [report, setReport] = useState<ReportView[]>([]);

  const diagnosisOptions = useMemo(() => distinctValues(indexes, "diagnosis"), [indexes]);
  const treatmentOptions = useMemo(() => distinctValues(indexes, "treatment"), [indexes]);

  const agg = useMemo(() => aggregate(indexes, dimension, filters), [indexes, dimension, filters]);
  const rob = ROBUSTNESS_META[agg.robustness];
  const chartData = agg.buckets.map((b) => ({ name: b.label, casos: b.count }));

  const addToReport = () => {
    const view: ReportView = { id: `${Date.now()}`, title: viewTitle(dimension, filters), agg };
    setReport((r) => [...r, view]);
  };

  return (
    <div className="grid gap-6 p-8 lg:grid-cols-[1fr_320px]">
      {/* Columna principal */}
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Casos en la base" value={kpis.totalCases} />
          <Kpi label="Patologías" value={kpis.diagnoses} />
          <Kpi label="Tratamientos" value={kpis.treatments} />
          <Kpi label="Diagnóstico validado" value={`${kpis.validatedPct}%`} />
        </div>

        {/* Preguntas rápidas */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pregúntale a los datos
          </p>
          <div className="flex flex-wrap gap-2">
            {QUESTIONS.map((q) => {
              const active = dimension === q.dim && JSON.stringify(filters) === JSON.stringify(q.filters);
              return (
                <button
                  key={q.q}
                  onClick={() => {
                    setDimension(q.dim);
                    setFilters(q.filters);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {q.q}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Select
            label="Agrupar por"
            value={dimension}
            onChange={(v) => setDimension(v as Dimension)}
            options={(Object.keys(DIMENSION_LABEL) as Dimension[]).map((d) => ({ value: d, label: DIMENSION_LABEL[d] }))}
          />
          <Select
            label="Filtrar patología"
            value={filters.diagnosis ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, diagnosis: v || undefined }))}
            options={[{ value: "", label: "Todas" }, ...diagnosisOptions.map((d) => ({ value: d, label: d }))]}
          />
          <Select
            label="Filtrar tratamiento"
            value={filters.treatment ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, treatment: v || undefined }))}
            options={[{ value: "", label: "Todos" }, ...treatmentOptions.map((t) => ({ value: t, label: t }))]}
          />
          {(filters.diagnosis || filters.treatment) && (
            <button
              onClick={() => setFilters({})}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Gráfica + robustez */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{viewTitle(dimension, filters)}</h2>
              <p className="text-xs text-slate-400">Casos agrupados por {DIMENSION_LABEL[dimension].toLowerCase()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                title={rob.hint}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${rob.soft}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${rob.dot}`} />
                n={agg.nCases} · {rob.label}
              </span>
              <button
                onClick={addToReport}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
              >
                + Añadir al informe
              </button>
            </div>
          </div>

          {chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">Sin datos para esta combinación.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 48)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v) => `${v} casos`}
                />
                <Bar dataKey="casos" radius={[0, 6, 6, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {agg.robustness === "low" && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              ⚠ Base limitada ({agg.nCases} casos): interpreta estas cifras con cautela.
            </p>
          )}
        </div>
      </div>

      {/* Panel de informe */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tu informe</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {report.length}
            </span>
          </div>

          {report.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Añade vistas para componer un informe a medida y expórtalo a PDF.
            </p>
          ) : (
            <ul className="space-y-2">
              {report.map((v) => (
                <li key={v.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{v.title}</p>
                    <p className="text-[11px] text-slate-400">n={v.agg.nCases} · {ROBUSTNESS_META[v.agg.robustness].label}</p>
                  </div>
                  <button
                    onClick={() => setReport((r) => r.filter((x) => x.id !== v.id))}
                    className="text-slate-300 transition-colors hover:text-red-500"
                    title="Quitar"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-2">
            <button
              onClick={() => printReport(report, kpis.totalCases)}
              disabled={report.length === 0}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
            >
              Exportar informe PDF
            </button>
            {report.length > 0 && (
              <button
                onClick={() => setReport([])}
                className="w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
              >
                Vaciar informe
              </button>
            )}
          </div>
        </div>

        <p className="mt-3 px-1 text-[11px] text-slate-400">
          Datos agregados y desidentificados. La robustez indica cuántos casos respaldan cada cifra.
        </p>
      </aside>
    </div>
  );
}
