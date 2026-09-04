"use client";

import { useEffect, useRef, useState } from "react";
import { useCreationStore } from "@/stores/creation.store";

function MiniMd({ text }: { text: string }) {
  // Soporta **negrita** y *cursiva* sencillos.
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function Thinking() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function AssistantChat() {
  const {
    messages,
    proposals,
    thinking,
    sendUserText,
    pickProposal,
    skipProposal,
    validateAll,
    applyExample,
    reset,
  } = useCreationStore();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, proposals, thinking]);

  const send = () => {
    if (!input.trim()) return;
    sendUserText(input);
    setInput("");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("text") || /\.(txt|md|csv)$/i.test(file.name)) {
      const content = await file.text();
      sendUserText(content.slice(0, 4000));
    } else {
      sendUserText(`He adjuntado "${file.name}". (En el MVP la extracción de PPT/PDF/imagen llega en backend; describe el caso y lo redacto.)`);
    }
    e.target.value = "";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Acciones rápidas */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-sm">
          ✨
        </span>
        <p className="text-sm font-semibold text-slate-800">Asistente de casos</p>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={applyExample}
            disabled={thinking}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Ver ejemplo
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            Reiniciar
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              <MiniMd text={m.text} />
              {m.applied && m.applied.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.applied.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600"
                    >
                      <span className="h-1 w-1 rounded-full bg-blue-400" />
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-white">
              <Thinking />
            </div>
          </div>
        )}

        {/* Propuestas top-3 */}
        {proposals && !thinking && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3">
            <p className="mb-2 text-xs font-semibold text-violet-700">
              {proposals.options.length > 1 ? "Mejores opciones" : "Sugerencia"}
            </p>
            <div className="space-y-1.5">
              {proposals.options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => pickProposal(o.id)}
                  className="flex w-full items-start justify-between gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-left transition-all hover:border-violet-400 hover:shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{o.label}</p>
                    {o.detail && <p className="text-[11px] text-slate-500">{o.detail}</p>}
                  </div>
                  {o.source && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                      {o.source}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {proposals.allowSkip && (
              <button
                onClick={skipProposal}
                className="mt-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-600"
              >
                Ninguna · marcar como “no documentado”
              </button>
            )}
          </div>
        )}
      </div>

      {/* Validar todo */}
      <div className="border-t border-slate-100 px-4 py-2">
        <button
          onClick={validateAll}
          disabled={thinking}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
        >
          ✓ Revisar y validar lo propuesto por IA
        </button>
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <button
            onClick={() => fileRef.current?.click()}
            title="Adjuntar caso / historia (txt)"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={onFile} accept=".txt,.md,.csv,text/*" />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Describe el caso… (p. ej. mujer 34 años con DA moderada)"
            className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm text-slate-700 outline-none"
          />

          <button
            title="Dictado por voz (próximamente)"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
            </svg>
          </button>

          <button
            onClick={send}
            disabled={!input.trim() || thinking}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-slate-400">
          Las propuestas salen de nuestra base (Atlas Dictionary). Tú validas; nada se publica sin tu confirmación.
        </p>
      </div>
    </div>
  );
}
