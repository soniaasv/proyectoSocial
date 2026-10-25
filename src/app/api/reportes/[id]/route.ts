import { timingSafeEqual } from "node:crypto";
import { actualizarEstadoSchema } from "@/lib/domain";
import { obtenerRepositorio } from "@/server/repositorio";
import { enriquecer } from "@/server/reportes";

function autorizado(request: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  const recibido = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!token || recibido.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(recibido), Buffer.from(token));
}

/** Operators update a report's status. Requires ADMIN_TOKEN and a database. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/reportes/[id]">) {
  if (!autorizado(request)) return Response.json({ error: "No autorizado" }, { status: 401 });

  const repositorio = obtenerRepositorio();
  if (repositorio.modo === "demo") {
    return Response.json({ error: "El modo demostración no guarda cambios. Configura DATABASE_URL." }, { status: 409 });
  }
  const parsed = actualizarEstadoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Estado inválido" }, { status: 400 });

  const { id } = await ctx.params;
  const reporte = await repositorio.actualizarEstado(id, parsed.data.estado);
  if (!reporte) return Response.json({ error: "Reporte no encontrado" }, { status: 404 });
  return Response.json({ reporte: enriquecer(reporte, new Date()) });
}
