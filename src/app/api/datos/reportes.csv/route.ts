import { connection } from "next/server";
import { obtenerReportes } from "@/server/reportes";

const COLUMNAS = [
  "id", "lat", "lng", "severidad", "fuente", "apoyos", "estado", "creado_en", "reparado_en", "reabierto",
  "colonia", "grado_marginacion", "calle", "clase_vial", "escuelas_300m", "salud_300m",
  "prioridad", "nivel", "simulado",
] as const;

function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

/** Open data: every report with its context and priority, as CSV. */
export async function GET() {
  await connection();
  const { reportes } = await obtenerReportes(new Date());
  const filas = reportes.map((r) =>
    [
      r.id, r.lat, r.lng, r.severidad, r.fuente, r.apoyos, r.estado, r.creadoEn, r.reparadoEn, r.reabierto,
      r.contexto.colonia?.nombre, r.contexto.colonia?.grado, r.contexto.calle?.nombre, r.contexto.calle?.clase,
      r.contexto.servicios.escuelas, r.contexto.servicios.salud, r.prioridad.puntaje, r.prioridad.nivel, r.simulado,
    ].map(celda).join(","),
  );
  // BOM so Excel opens accents correctly.
  const csv = "﻿" + [COLUMNAS.join(","), ...filas].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calle-justa-reportes.csv"',
      "Cache-Control": "public, s-maxage=300",
    },
  });
}
