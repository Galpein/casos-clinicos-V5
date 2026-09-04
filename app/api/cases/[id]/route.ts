import { NextResponse } from "next/server";
import { casesRepo } from "@/lib/db/cases.repo";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const row = await casesRepo.get(id);
    if (!row) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    return NextResponse.json({ caso: row.caso, index: row.index, inLibrary: row.inLibrary });
  } catch (e) {
    console.error("[api/cases/:id] GET", e);
    return NextResponse.json({ error: "No se pudo leer el caso" }, { status: 500 });
  }
}

/**
 * Borrado desde la pantalla del autor. La respuesta dice qué ha pasado de
 * verdad: un caso que ya estaba en la biblioteca no se destruye, se retira de
 * la vista del autor.
 */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const result = await casesRepo.remove(id);
    if (result === "missing") {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ result });
  } catch (e) {
    console.error("[api/cases/:id] DELETE", e);
    return NextResponse.json({ error: "No se pudo eliminar el caso" }, { status: 500 });
  }
}
