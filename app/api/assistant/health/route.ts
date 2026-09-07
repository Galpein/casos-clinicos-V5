/**
 * Diagnóstico del asistente. Dice si la IA está bien configurada sin revelar
 * la clave: sólo si existe, qué modelo se usa, si el modelo responde y cuáles
 * están disponibles para esa clave.
 */

import { NextResponse } from "next/server";
import { aiEnabled, aiModel, generateJson, listModels } from "@/lib/ai/gemini";
import { extractWithAi } from "@/lib/ai/extractCase";

export const dynamic = "force-dynamic";

/**
 * Caso de prueba a propósito FUERA de dermatología, que es donde el motor
 * propio se queda corto. Es el ejemplo con el que Enrique detectó el límite.
 */
const CASO_PRUEBA =
  "Niño de 7 años con un meduloblastoma. Sin antecedentes de tumores. Sano. " +
  "Peso 30 kg. Sin más patologías. Se opera el tumor. Comienza ciclo de " +
  "cisplatino durante 6 semanas, con buena tolerancia salvo náuseas leves.";

export async function GET(req: Request) {
  const comparar = new URL(req.url).searchParams.get("comparar");

  // ?comparar=modelo1,modelo2 → pasa el mismo caso por cada modelo y devuelve
  // lo que extrae cada uno y cuánto tarda. Sirve para elegir con datos.
  if (comparar) {
    const modelos = comparar.split(",").map((m) => m.trim()).filter(Boolean).slice(0, 5);
    const resultados = await Promise.all(
      modelos.map(async (m) => {
        const r = await extractWithAi(CASO_PRUEBA, m);
        return {
          modelo: m,
          ok: r.ok,
          ms: r.ms,
          error: r.error,
          extraido: r.data,
        };
      }),
    );
    return NextResponse.json({ casoDePrueba: CASO_PRUEBA, resultados });
  }

  return diagnostico();
}

async function diagnostico() {
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
