/**
 * Casos del profesional que ha iniciado sesión.
 *
 * GET  → sus casos (sin los que él haya borrado)
 * POST → alta o actualización. Es el punto que usa el autoguardado, así que
 *        acepta casos incompletos: guardar no exige tener nada relleno.
 */

import { NextResponse } from "next/server";
import { casesRepo } from "@/lib/db/cases.repo";
import { CURRENT_HCP } from "@/mock/user";
import type { ClinicalCase } from "@/types/clinical-case";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authorId = new URL(req.url).searchParams.get("author") ?? CURRENT_HCP.id;
  try {
    const rows = await casesRepo.listByAuthor(authorId);
    return NextResponse.json({ cases: rows.map((r) => r.caso) });
  } catch (e) {
    console.error("[api/cases] GET", e);
    return NextResponse.json({ error: "No se pudieron leer los casos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: ClinicalCase;
  try {
    body = (await req.json()) as ClinicalCase;
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición no válido" }, { status: 400 });
  }
  if (!body?.caseId) {
    return NextResponse.json({ error: "Falta el identificador del caso" }, { status: 400 });
  }

  try {
    const row = await casesRepo.save({ ...body, updatedAt: new Date().toISOString() });
    return NextResponse.json({ caso: row.caso, inLibrary: row.inLibrary });
  } catch (e) {
    console.error("[api/cases] POST", e);
    return NextResponse.json({ error: "No se pudo guardar el caso" }, { status: 500 });
  }
}
