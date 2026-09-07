/**
 * Diagnóstico del asistente. Dice si la IA está bien configurada sin revelar
 * la clave: sólo si existe, qué modelo se usa, si el modelo responde y cuáles
 * están disponibles para esa clave.
 */

import { NextResponse } from "next/server";
import { aiEnabled, aiModel, generateJson, listModels } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  const clave = process.env.GEMINI_API_KEY;
  const base = {
    claveConfigurada: Boolean(clave),
    longitudClave: clave ? clave.length : 0,
    iaActiva: aiEnabled(),
    modeloConfigurado: aiModel(),
  };

  if (!clave) {
    return NextResponse.json({
      ...base,
      estado: "sin_clave",
      mensaje: "No hay GEMINI_API_KEY. El asistente funciona con el motor propio.",
    });
  }

  const [prueba, modelos] = await Promise.all([
    generateJson<{ ok: boolean }>(
      'Devuelve exactamente {"ok": true}',
      { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
      { timeoutMs: 12000 },
    ),
    listModels(),
  ]);

  return NextResponse.json({
    ...base,
    estado: prueba.ok ? "operativo" : "error",
    latenciaMs: prueba.ms,
    error: prueba.error,
    modelosDisponibles: modelos.ok ? modelos.models?.slice(0, 25) : undefined,
    errorListado: modelos.error,
  });
}
