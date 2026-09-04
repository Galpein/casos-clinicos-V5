/**
 * Exportación de un caso clínico a documento imprimible (PDF vía print) y a
 * presentación HTML autocontenida (para sesiones clínicas).
 *
 * Genera HTML standalone con CSS inline → portable, sin dependencias. La idea
 * es que el médico, tras crear el caso con la IA, pueda sacarlo para presentar
 * en segundos.
 */

import type { ClinicalCase } from "@/types/clinical-case";
import { computeCaseStatus, STATUS_META } from "@/lib/case-status";
import {
  ageSummary,
  consentLabel,
  outcomeLabel,
  sexLabel,
  treatmentTypeLabel,
  visibilityLabel,
} from "@/lib/labels";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function val(field: { value: unknown }, fallback = "—"): string {
  const v = field?.value;
  return v === null || v === undefined || v === "" ? fallback : esc(v);
}

const STATUS_HEX: Record<string, string> = {
  red: "#ef4444",
  orange: "#f59e0b",
  green: "#10b981",
};

// ── Documento imprimible (A4) ────────────────────────────────────────────────

export function caseDocumentHtml(c: ClinicalCase): string {
  const status = computeCaseStatus(c);
  const meta = STATUS_META[status.color];
  const color = STATUS_HEX[status.color];
  const date = new Date(c.createdAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const block = (n: number, title: string, body: string) => `
    <section class="block">
      <h2><span class="num">${n}</span>${esc(title)}</h2>
      <div class="body">${body}</div>
    </section>`;

  const timeline = c.timeline.length
    ? `<ol class="timeline">${c.timeline
        .map((e) => `<li><b>${esc(e.when)}</b> — ${esc(e.event)}</li>`)
        .join("")}</ol>`
    : "<em>—</em>";

  const treatments = c.management.length
    ? `<ul class="list">${c.management
        .map(
          (t) =>
            `<li><b>${esc(t.name)}</b>${t.dose ? ` · ${esc(t.dose)}` : ""}${
              t.duration ? ` · ${esc(t.duration)}` : ""
            }<br><span class="muted">${esc(treatmentTypeLabel[t.type])}${
              t.therapeuticClass ? ` · ${esc(t.therapeuticClass)}` : ""
            }${t.lineOfTherapy ? ` · ${esc(t.lineOfTherapy)}` : ""}</span></li>`,
        )
        .join("")}</ul>`
    : "<em>—</em>";

  const outcomes = c.followUp.length
    ? `<ul class="list">${c.followUp
        .map(
          (o) =>
            `<li><b>${esc(outcomeLabel[o.globalOutcome])}</b>${
              o.magnitude ? ` · ${esc(o.magnitude)}` : ""
            }${o.timeToOutcome ? ` (${esc(o.timeToOutcome)})` : ""}${
              o.narrative ? `<br><span class="muted">${esc(o.narrative)}</span>` : ""
            }</li>`,
        )
        .join("")}</ul>`
    : "<em>—</em>";

  const dx = c.primaryDiagnosis;
  const dxBody = `<b>${val(dx.label, "Sin diagnóstico")}</b>${
    dx.concept ? ` <span class="tag">${esc(dx.concept.normalizedLabel ?? dx.concept.textFound)}</span>` : ""
  }`;

  const differentials = c.diagnosticAssessment.differentials.length
    ? `<p class="muted">DDx: ${c.diagnosticAssessment.differentials.map(esc).join(", ")}</p>`
    : "";

  const tags = c.searchTags.length
    ? `<div class="tags">${c.searchTags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`
    : "";

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(c.title || c.caseId)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, "Segoe UI", sans-serif; color: #0f172a; line-height: 1.5; margin: 0; }
  .header { border-bottom: 3px solid ${color}; padding-bottom: 14px; margin-bottom: 22px; }
  .code { font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; color: #64748b; }
  .status { display: inline-block; font-size: 11px; font-weight: 700; color: ${color}; border: 1px solid ${color}; border-radius: 999px; padding: 2px 10px; margin-left: 8px; }
  h1 { font-size: 22px; margin: 8px 0 4px; }
  .sub { color: #64748b; font-size: 13px; }
  .block { margin-bottom: 16px; break-inside: avoid; }
  .block h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
  .num { display: inline-flex; width: 18px; height: 18px; align-items: center; justify-content: center; background: #0f172a; color: #fff; border-radius: 5px; font-size: 10px; }
  .body { font-size: 14px; padding-left: 26px; }
  .muted { color: #64748b; font-size: 12px; }
  .tag { display: inline-block; background: #ede9fe; color: #6d28d9; border-radius: 999px; padding: 1px 8px; font-size: 11px; margin: 2px 3px 0 0; }
  .tags { margin-top: 6px; }
  .list { margin: 0; padding-left: 16px; }
  .list li { margin-bottom: 6px; }
  .timeline { margin: 0; padding-left: 16px; }
  .chips span { display: inline-block; background: #f1f5f9; border-radius: 6px; padding: 2px 8px; font-size: 12px; margin: 2px 4px 0 0; }
  .footer { margin-top: 26px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
</style></head><body>
  <div class="header">
    <span class="code">${esc(c.caseId)}</span>
    <span class="status">${esc(meta.label)} · ${status.pct}%</span>
    <h1>${esc(c.title || "Caso clínico")}</h1>
    <p class="sub">${val(c.summary)}</p>
  </div>

  ${block(3, "Paciente", `<div class="chips"><span>${esc(sexLabel[c.patient.sex])}</span><span>${esc(ageSummary(c.patient.ageGroup, c.patient.ageValue.value))}</span>${c.patient.deIdentified ? "<span>Desidentificado</span>" : ""}</div>${val(c.patient.clinicalContext, "")}`)}
  ${block(4, "Motivo principal", val(c.mainReason))}
  ${block(5, "Antecedentes", val(c.background))}
  ${block(6, "Hallazgos clínicos", val(c.keyFindings))}
  ${block(7, "Timeline", timeline)}
  ${block(8, "Diagnóstico principal", dxBody)}
  ${block(9, "Evaluación diagnóstica", `${val(c.diagnosticAssessment.testsPerformed)}<br>${val(c.diagnosticAssessment.reasoning, "")}${differentials}`)}
  ${block(10, "Manejo / tratamiento", treatments)}
  ${block(11, "Seguimiento y resultados", outcomes)}
  ${block(12, "Aprendizaje principal", val(c.keyLearning))}
  ${tags ? block(0, "Palabras clave", tags) : ""}
  ${block(13, "Privacidad y consentimiento", `<span class="muted">${esc(visibilityLabel[c.privacy.visibility])} · ${esc(consentLabel[c.privacy.consentStatus])}</span>`)}

  <div class="footer">
    <span>AtlasCases · ${esc(c.caseId)}</span>
    <span>${esc(date)} · Col. ${esc(c.authorId)}</span>
  </div>
</body></html>`;
}

// ── Presentación (slides) ────────────────────────────────────────────────────

export function casePresentationHtml(c: ClinicalCase): string {
  const status = computeCaseStatus(c);
  const color = STATUS_HEX[status.color];

  const slide = (kicker: string, title: string, body: string) => `
    <section class="slide">
      <div class="kicker">${esc(kicker)}</div>
      <h2>${esc(title)}</h2>
      <div class="content">${body}</div>
    </section>`;

  const slides: string[] = [];

  // Portada
  slides.push(`
    <section class="slide cover">
      <div class="code">${esc(c.caseId)}</div>
      <h1>${esc(c.title || "Caso clínico")}</h1>
      <p class="lead">${val(c.summary, "")}</p>
      <div class="meta">${esc(sexLabel[c.patient.sex])} · ${esc(ageSummary(c.patient.ageGroup, c.patient.ageValue.value))}${
        c.primaryDiagnosis.concept ? ` · ${esc(c.primaryDiagnosis.concept.normalizedLabel)}` : ""
      }</div>
    </section>`);

  if (c.mainReason.value || c.background.value)
    slides.push(
      slide(
        "Contexto",
        "Motivo y antecedentes",
        `<p><b>Motivo:</b> ${val(c.mainReason)}</p><p><b>Antecedentes:</b> ${val(c.background)}</p>`,
      ),
    );

  slides.push(
    slide(
      "Presentación",
      "Hallazgos clínicos",
      `<p>${val(c.keyFindings)}</p>${
        c.timeline.length
          ? `<ul>${c.timeline.map((e) => `<li><b>${esc(e.when)}:</b> ${esc(e.event)}</li>`).join("")}</ul>`
          : ""
      }`,
    ),
  );

  slides.push(
    slide(
      "Diagnóstico",
      val(c.primaryDiagnosis.label, "Diagnóstico"),
      `<p>${val(c.diagnosticAssessment.testsPerformed)}</p><p>${val(c.diagnosticAssessment.reasoning, "")}</p>`,
    ),
  );

  if (c.management.length)
    slides.push(
      slide(
        "Manejo",
        "Tratamiento",
        `<ul>${c.management
          .map((t) => `<li><b>${esc(t.name)}</b>${t.lineOfTherapy ? ` — ${esc(t.lineOfTherapy)}` : ""}${t.dose ? ` (${esc(t.dose)})` : ""}</li>`)
          .join("")}</ul>`,
      ),
    );

  if (c.followUp.length)
    slides.push(
      slide(
        "Evolución",
        "Resultados",
        `<ul>${c.followUp
          .map((o) => `<li><b>${esc(outcomeLabel[o.globalOutcome])}</b>${o.magnitude ? ` — ${esc(o.magnitude)}` : ""}${o.timeToOutcome ? ` (${esc(o.timeToOutcome)})` : ""}</li>`)
          .join("")}</ul>`,
      ),
    );

  slides.push(slide("Conclusión", "Aprendizaje principal", `<p class="big">${val(c.keyLearning)}</p>`));

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(c.title || c.caseId)} · Presentación</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; font-family: -apple-system, system-ui, "Segoe UI", sans-serif; color: #0f172a; background: #0f172a; }
  .deck { height: 100vh; overflow: hidden; position: relative; }
  .slide { position: absolute; inset: 0; padding: 8vh 10vw; background: #fff; display: none; flex-direction: column; justify-content: center; }
  .slide.active { display: flex; animation: fade .3s ease; }
  @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .cover { background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; }
  .cover .code { font-family: ui-monospace, monospace; color: ${color}; font-weight: 700; letter-spacing: .1em; }
  .cover h1 { font-size: 48px; margin: 16px 0; line-height: 1.1; }
  .cover .lead { font-size: 22px; color: #cbd5e1; max-width: 80%; }
  .cover .meta { margin-top: 28px; color: #94a3b8; font-size: 16px; }
  .kicker { text-transform: uppercase; letter-spacing: .12em; font-size: 14px; font-weight: 700; color: ${color}; margin-bottom: 10px; }
  .slide h2 { font-size: 40px; margin-bottom: 24px; }
  .content { font-size: 22px; line-height: 1.6; max-width: 90%; }
  .content ul { margin: 12px 0 0 24px; }
  .content li { margin-bottom: 10px; }
  .content .big { font-size: 30px; font-weight: 600; }
  .content p { margin-bottom: 12px; }
  .nav { position: fixed; bottom: 24px; right: 32px; color: #94a3b8; font-size: 13px; z-index: 10; }
  .bar { position: fixed; bottom: 0; left: 0; height: 4px; background: ${color}; transition: width .3s; z-index: 10; }
</style></head><body>
  <div class="deck">${slides.join("")}</div>
  <div class="bar"></div>
  <div class="nav">← → para navegar · <span id="ix">1</span>/${slides.length}</div>
  <script>
    const slides = [...document.querySelectorAll('.slide')];
    let i = 0;
    function show(n){ i = Math.max(0, Math.min(slides.length-1, n)); slides.forEach((s,k)=>s.classList.toggle('active', k===i)); document.getElementById('ix').textContent = i+1; document.querySelector('.bar').style.width = ((i+1)/slides.length*100)+'%'; }
    document.addEventListener('keydown', e => { if(e.key==='ArrowRight'||e.key===' ') show(i+1); if(e.key==='ArrowLeft') show(i-1); });
    document.addEventListener('click', () => show(i+1));
    show(0);
  </script>
</body></html>`;
}

// ── Triggers (cliente) ───────────────────────────────────────────────────────

export function printCase(c: ClinicalCase) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(caseDocumentHtml(c));
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
}

export function openPresentation(c: ClinicalCase) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(casePresentationHtml(c));
  w.document.close();
}
