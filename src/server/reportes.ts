import "server-only";

import simulados from "@/data/reportes-simulados.json";
import type { NuevoReporte, Reporte, Severidad } from "@/lib/domain";
import type { ReporteEnriquecido } from "@/lib/equity";
import { calcularPrioridad } from "@/lib/priority";
import { resolverContexto } from "./capas";
import { obtenerRepositorio } from "./repositorio";

const DIA_MS = 86_400_000;

interface ReporteSimulado {
  id: string;
  lat: number;
  lng: number;
  severidad: number;
  fuente: "ciudadano" | "recorrido";
  apoyos: number;
  creadoHaceDias: number;
  estado: Reporte["estado"];
  reparadoHaceDias: number | null;
  reabierto: boolean;
}

/** The simulated scenario stores ages, so it always ends "today". */
function reportesSimulados(ahora: Date): Reporte[] {
  const hace = (dias: number) => new Date(ahora.getTime() - dias * DIA_MS).toISOString();
  return (simulados.reportes as ReporteSimulado[]).map((r) => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    severidad: r.severidad as Severidad,
    fuente: r.fuente,
    apoyos: r.apoyos,
    creadoEn: hace(r.creadoHaceDias),
    estado: r.estado,
    reparadoEn: r.reparadoHaceDias === null ? null : hace(r.reparadoHaceDias),
    reabierto: r.reabierto,
    simulado: true,
  }));
}

/** Simulated data is shown until enough real data exists; set DATOS_SIMULADOS=false to hide it. */
export const incluirSimulados = () => process.env.DATOS_SIMULADOS !== "false";

export function enriquecer(reporte: Reporte, ahora: Date): ReporteEnriquecido {
  const contexto = resolverContexto(reporte.lat, reporte.lng);
  return { ...reporte, contexto, prioridad: calcularPrioridad(reporte, contexto, ahora) };
}

export async function obtenerReportes(ahora: Date) {
  const repositorio = obtenerRepositorio();
  const reales = await repositorio.listar();
  const todos = incluirSimulados() ? [...reales, ...reportesSimulados(ahora)] : reales;
  return {
    modo: repositorio.modo,
    incluyeSimulados: incluirSimulados(),
    reportes: todos.map((r) => enriquecer(r, ahora)),
  };
}

export async function crearReporte(nuevo: NuevoReporte, ahora: Date) {
  const repositorio = obtenerRepositorio();
  const guardado = await repositorio.crear(nuevo);
  // In demo mode the report is not stored, but the citizen still sees how it would rank.
  const reporte: Reporte = guardado ?? {
    id: `LOCAL-${ahora.getTime().toString(36).toUpperCase()}`,
    ...nuevo,
    fuente: "ciudadano",
    apoyos: 1,
    creadoEn: ahora.toISOString(),
    estado: "pendiente",
    reparadoEn: null,
    reabierto: false,
    simulado: false,
  };
  return { persistido: guardado !== null, reporte: enriquecer(reporte, ahora) };
}
