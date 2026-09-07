/**
 * Cliente de Google Gemini.
 *
 * Vive sólo en el servidor: la clave nunca sale de aquí. Si no hay clave, o si
 * la llamada falla, quien llama debe seguir funcionando con el motor propio —
 * la IA amplía el asistente, no lo sustituye.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) && process.env.AI_ENABLED !== "0";
}

export function aiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export interface AiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  model: string;
  ms: number;
}

/**
 * Pide una respuesta en JSON. `schema` es un esquema JSON que Gemini usa para
 * ceñir la salida; sin él, los modelos añaden explicaciones y rompen el parseo.
 */
export async function generateJson<T>(
  prompt: string,
  schema: Record<string, unknown>,
  { timeoutMs = 15000 }: { timeoutMs?: number } = {},
): Promise<AiResult<T>> {
  const model = aiModel();
  const started = Date.now();
  const key = process.env.GEMINI_API_KEY;

  if (!key) return { ok: false, error: "Falta GEMINI_API_KEY", model, ms: 0 };

  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), timeoutMs);

  try {
    const res = await fetch(`${ENDPOINT}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      signal: control.signal,
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    });

    const ms = Date.now() - started;

    if (!res.ok) {
      const detalle = await res.text().catch(() => "");
      return {
        ok: false,
        model,
        ms,
        // El mensaje de Google puede traer la clave en la URL; se recorta.
        error: `HTTP ${res.status}: ${detalle.slice(0, 300).replace(/key=[^&"\s]+/g, "key=***")}`,
      };
    }

    const json = await res.json();
    const texto = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) return { ok: false, model, ms, error: "Respuesta sin contenido" };

    return { ok: true, model, ms, data: JSON.parse(texto) as T };
  } catch (e) {
    const ms = Date.now() - started;
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, model, ms, error: msg === "The operation was aborted." ? "Tiempo de espera agotado" : msg };
  } finally {
    clearTimeout(timer);
  }
}

/** Modelos disponibles para esta clave. Se usa en el diagnóstico. */
export async function listModels(): Promise<{ ok: boolean; models?: string[]; error?: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "Falta GEMINI_API_KEY" };
  try {
    const res = await fetch(`${ENDPOINT}/models`, { headers: { "x-goog-api-key": key } });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${t.slice(0, 200)}` };
    }
    const json = await res.json();
    const models = (json?.models ?? [])
      .filter((m: { supportedGenerationMethods?: string[] }) =>
        m.supportedGenerationMethods?.includes("generateContent"),
      )
      .map((m: { name: string }) => m.name.replace("models/", ""));
    return { ok: true, models };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
