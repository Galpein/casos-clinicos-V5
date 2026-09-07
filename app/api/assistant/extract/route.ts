/**
 * Extracción de entidades del relato del profesional.
 *
 * Si la IA está configurada y responde, se usa. Si no, se responde
 * `fuente: "reglas"` y el cliente sigue con el motor propio: el asistente
 * nunca deja de funcionar por un fallo de la IA.
 */

import { NextResponse } from "next/server";
import { aiEnabled } from "@/lib/ai/gemini";
import { extractWithAi } from "@/lib/ai/extractCase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let text = "";
  try {
    ({ text } = (await req.json()) as { text: string });
  } catch {
    return NextResponse.json({ error: "Cuerpo no válido" }, { status: 400 });
  }
  if (!text?.trim()) return NextResponse.json({ fuente: "reglas", entidades: null });

  if (!aiEnabled()) return NextResponse.json({ fuente: "reglas", entidades: null });

  const r = await extractWithAi(text);
  if (!r.ok) {
    console.warn("[assistant/extract] la IA falló, se usa el motor propio:", r.error);
    return NextResponse.json({ fuente: "reglas", entidades: null, error: r.error });
  }
  return NextResponse.json({ fuente: "ia", modelo: r.model, ms: r.ms, entidades: r.data });
}
