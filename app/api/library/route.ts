/**
 * Biblioteca: todos los casos que han alcanzado al menos "documentación
 * esencial". Los borradores no entran (regla de Enrique), y los casos que su
 * autor ha retirado de su pantalla siguen aquí.
 */

import { NextResponse } from "next/server";
import { casesRepo } from "@/lib/db/cases.repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await casesRepo.listLibrary();
    return NextResponse.json({
      cases: rows.map((r) => r.caso),
      index: rows.map((r) => r.index),
    });
  } catch (e) {
    console.error("[api/library] GET", e);
    return NextResponse.json({ error: "No se pudo leer la biblioteca" }, { status: 500 });
  }
}
