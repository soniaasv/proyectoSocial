import { connection } from "next/server";
import { nuevoReporteSchema } from "@/lib/domain";
import { ipDe, permitir } from "@/server/limite";
import { crearReporte, obtenerReportes } from "@/server/reportes";

export async function GET() {
  await connection();
  const datos = await obtenerReportes(new Date());
  return Response.json(
    { generadoEn: new Date().toISOString(), ...datos },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}

export async function POST(request: Request) {
  if (!permitir(ipDe(request))) {
    return Response.json({ error: "Demasiados reportes seguidos. Intenta de nuevo en unos minutos." }, { status: 429 });
  }
  const cuerpo = await request.json().catch(() => null);
  // Honeypot: real people never fill this hidden field.
  if (cuerpo?.sitioWeb) return Response.json({ error: "Solicitud inválida" }, { status: 400 });

  const parsed = nuevoReporteSchema.safeParse(cuerpo);
  if (!parsed.success) {
    return Response.json(
      { error: "Revisa los datos del reporte. La ubicación debe estar dentro de Navojoa.", detalles: parsed.error.issues },
      { status: 400 },
    );
  }
  const resultado = await crearReporte(parsed.data, new Date());
  return Response.json(resultado, { status: resultado.persistido ? 201 : 202 });
}
