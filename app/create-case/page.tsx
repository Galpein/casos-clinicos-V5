"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreationStore } from "@/stores/creation.store";
import { useCasesStore } from "@/stores/cases.store";
import { computeCaseStatus } from "@/lib/case-status";
import { DocumentPanel } from "@/components/create/DocumentPanel";
import { AssistantChat } from "@/components/create/AssistantChat";

/**
 * Redacción de un caso, nuevo o existente (`?id=`).
 *
 * Cambios pedidos en la revisión: el caso se autoguarda desde el primer campo
 * (nadie pierde un borrador por cerrar la pestaña), se puede guardar sin haber
 * completado los obligatorios, y si falta el título se pide en ese momento en
 * vez de bloquear el botón.
 */

const AUTOSAVE_MS = 1200;
/** Tope: aunque el caso siga cambiando, no se aplaza el guardado más de esto. */
const AUTOSAVE_MAX_MS = 5000;

function SaveBar() {
  const caso = useCreationStore((s) => s.caso);
  const reset = useCreationStore((s) => s.reset);
  const saveCase = useCasesStore((s) => s.saveCase);
  const router = useRouter();

  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [askTitle, setAskTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const status = computeCaseStatus(caso);
  const empezado = status.pct > 0 || caso.title.trim().length > 0;
  const firma = useRef<string>("");
  const ultimoGuardado = useRef<number>(0);

  const persist = useCallback(
    async (c = caso) => {
      setSaving(true);
      const ok = await saveCase(c);
      setSaving(false);
      if (ok) {
        setSavedAt(new Date());
        ultimoGuardado.current = Date.now();
      }
      return ok;
    },
    [caso, saveCase],
  );

  // Autoguardado: en cuanto hay contenido, y cada vez que deja de cambiar.
  useEffect(() => {
    if (!empezado) return;
    const huella = JSON.stringify(caso);
    if (huella === firma.current) return;

    // Mientras el asistente va rellenando campos, el caso cambia sin parar y
    // el temporizador se reiniciaría en cada cambio. El tope obliga a guardar.
    const esperando = Date.now() - ultimoGuardado.current;
    const retardo = ultimoGuardado.current && esperando > AUTOSAVE_MAX_MS ? 0 : AUTOSAVE_MS;

    const t = setTimeout(() => {
      firma.current = huella;
      void persist();
    }, retardo);
    return () => clearTimeout(t);
  }, [caso, empezado, persist]);

  const guardarYSalir = async () => {
    if (!caso.title.trim()) {
      setTitleDraft("");
      setAskTitle(true);
      return;
    }
    const id = caso.caseId;
    if (await persist()) {
      reset();
      router.push(`/cases/${id}`);
    }
  };

  const confirmarTitulo = async () => {
    const title = titleDraft.trim();
    if (!title) return;
    const conTitulo = { ...caso, title };
    setAskTitle(false);
    const id = conTitulo.caseId;
    if (await persist(conTitulo)) {
      reset();
      router.push(`/cases/${id}`);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-[11px] text-slate-400">
        {saving
          ? "Guardando…"
          : savedAt
            ? `Guardado a las ${savedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
            : empezado
              ? "Sin guardar todavía"
              : ""}
      </span>

      <button
        disabled={!empezado || saving}
        onClick={guardarYSalir}
        title={empezado ? "Guardar el caso y abrirlo" : "Escribe algo para poder guardar"}
        className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        Guardar caso
      </button>

      {askTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Ponle un título al caso</h2>
            <p className="mt-1 text-sm text-slate-500">
              Es lo único que falta para guardarlo. El resto puede quedar a medias.
            </p>
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarTitulo()}
              placeholder="p. ej. Dermatitis atópica moderada en mujer de 34 años"
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setAskTitle(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarTitulo}
                disabled={!titleDraft.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateCasePage() {
  const loadCase = useCreationStore((s) => s.loadCase);
  const [editando, setEditando] = useState<string | null>(null);
  const cargadoPara = useRef<string | null>(null);

  // ?id= → seguir editando un caso ya guardado. Se lee de window para no
  // obligar a envolver la página en un Suspense sólo por esto.
  //
  // Sin bandera de cancelación a propósito: en desarrollo React monta, limpia
  // y vuelve a montar, y una cancelación en la limpieza abortaría la carga
  // buena. El ref marca el caso ya pedido, que es lo que evita repetirla.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id || cargadoPara.current === id) return;
    cargadoPara.current = id;

    fetch(`/api/cases/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.caso) return;
        loadCase(d.caso);
        setEditando(d.caso.title || id);
      })
      .catch(() => {
        cargadoPara.current = null;
      });
  }, [loadCase]);

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600">
            Profesional Sanitario
          </p>
          <h1 className="text-lg font-bold text-slate-900">
            {editando ? "Editar caso clínico" : "Nuevo caso clínico con IA"}
          </h1>
        </div>
        <SaveBar />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <section className="hidden w-[56%] border-r border-slate-200 lg:flex lg:flex-col">
          <DocumentPanel />
        </section>
        <section className="flex flex-1 flex-col">
          <AssistantChat />
        </section>
      </div>
    </div>
  );
}
