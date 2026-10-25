import { z } from "zod";
import { NAVOJOA_BBOX } from "@/lib/domain";
import { resolverContexto } from "@/server/capas";

const consulta = z.object({
  lat: z.coerce.number().min(NAVOJOA_BBOX[1]).max(NAVOJOA_BBOX[3]),
  lng: z.coerce.number().min(NAVOJOA_BBOX[0]).max(NAVOJOA_BBOX[2]),
});

/** Street, colonia and nearby services for a point, shown while a citizen places a report. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = consulta.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return Response.json({ error: "Ubicación fuera de Navojoa" }, { status: 400 });
  return Response.json(resolverContexto(parsed.data.lat, parsed.data.lng), {
    headers: { "Cache-Control": "public, s-maxage=86400" },
  });
}
