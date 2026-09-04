/**
 * Informe de analítica exportable (PDF vía print).
 *
 * El cliente va componiendo el informe a su gusto (añade las vistas que le
 * interesan) y lo exporta. Cada vista incluye su robustez de datos, para no
 * vender cifras sin contexto.
 */

import type { Aggregation } from "./aggregate";
import { DIMENSION_LABEL, ROBUSTNESS_META } from "./aggregate";

export interface ReportView {
  id: string;
  title: string;
  agg: Aggregation;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function filtersText(agg: Aggregation): string {
  const f: string[] = [];
  if (agg.filters.diagnosis) f.push(`Patología: ${agg.filters.diagnosis}`);
  if (agg.filters.treatment) f.push(`Tratamiento: ${agg.filters.treatment}`);
  return f.length ? f.join(" · ") : "Sin filtros";
}

export function analyticsReportHtml(views: ReportView[], totalCases: number): string {
  const date = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  const sections = views
    .map((v) => {
      const rob = ROBUSTNESS_META[v.agg.robustness];
      const rows = v.agg.buckets
        .map(
          (b) => `<tr><td>${esc(b.label)}</td><td class="num">${b.count}</td><td class="num">${b.pct}%</td>
            <td><div class="bar"><span style="width:${b.pct}%"></span></div></td></tr>`,
        )
        .join("");
      return `
        <section class="view">
          <div class="view-h">
            <h2>${esc(v.title)}</h2>
            <span class="rob">n=${v.agg.nCases} · ${esc(rob.label)}</span>
          </div>
          <p class="muted">Agrupado por ${esc(DIMENSION_LABEL[v.agg.dimension])} · ${esc(filtersText(v.agg))}</p>
          <table>
            <thead><tr><th>Valor</th><th class="num">Casos</th><th class="num">%</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    })
    .join("");

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Informe AtlasCases</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, "Segoe UI", sans-serif; color: #0f172a; margin: 0; }
  .header { border-bottom: 3px solid #6d28d9; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { font-size: 22px; margin: 0; }
  .sub { color: #64748b; font-size: 13px; margin-top: 4px; }
  .view { margin-bottom: 22px; break-inside: avoid; }
  .view-h { display: flex; align-items: baseline; justify-content: space-between; }
  .view h2 { font-size: 16px; margin: 0; }
  .rob { font-size: 12px; font-weight: 700; color: #6d28d9; }
  .muted { color: #64748b; font-size: 12px; margin: 2px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
  .num { text-align: right; width: 64px; }
  .bar { background: #ede9fe; border-radius: 999px; height: 8px; width: 120px; }
  .bar span { display: block; height: 8px; background: #8b5cf6; border-radius: 999px; }
  .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px; color: #94a3b8; }
</style></head><body>
  <div class="header">
    <h1>Informe de analítica · AtlasCases</h1>
    <p class="sub">${esc(date)} · ${views.length} vista(s) · ${totalCases} casos en la base</p>
  </div>
  ${sections || "<p class='muted'>Informe vacío.</p>"}
  <div class="footer">Datos agregados y desidentificados. La robustez indica el nº de casos que respaldan cada vista.</div>
</body></html>`;
}

export function printReport(views: ReportView[], totalCases: number) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(analyticsReportHtml(views, totalCases));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
}
