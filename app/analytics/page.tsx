import { AnalyticsExplorer } from "@/components/analytics/AnalyticsExplorer";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabecera */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Cliente · Confidencial
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Analytics de la biblioteca</h1>
            <p className="mt-1 text-sm text-slate-500">
              Explora los casos agregados y desidentificados. Elige qué ver y compón tu informe.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-slate-700">Datos agregados</span>
          </div>
        </div>
      </div>

      <AnalyticsExplorer />
    </div>
  );
}
