import "server-only";

import postgres from "postgres";
import type { Estado, NuevoReporte, Reporte } from "@/lib/domain";

/**
 * Storage for citizen reports. Without a database the app runs in demo mode:
 * it serves the simulated scenario and does not pretend to save new reports
 * (each serverless instance has its own memory, so they would be lost).
 */
export interface Repositorio {
  modo: "demo" | "postgres";
  listar(): Promise<Reporte[]>;
  crear(nuevo: NuevoReporte): Promise<Reporte | null>;
  actualizarEstado(id: string, estado: Estado): Promise<Reporte | null>;
}

const demo: Repositorio = {
  modo: "demo",
  listar: async () => [],
  crear: async () => null,
  actualizarEstado: async () => null,
};

interface Fila {
  id: string;
  lat: number;
  lng: number;
  severidad: 1 | 2 | 3;
  descripcion: string | null;
  confianza_ia: number | null;
  apoyos: number;
  estado: Estado;
  creado_en: Date;
  reparado_en: Date | null;
  reabierto: boolean;
}

function aReporte(f: Fila): Reporte {
  return {
    id: f.id,
    lat: f.lat,
    lng: f.lng,
    severidad: f.severidad,
    fuente: "ciudadano",
    apoyos: f.apoyos,
    creadoEn: f.creado_en.toISOString(),
    estado: f.estado,
    reparadoEn: f.reparado_en?.toISOString() ?? null,
    reabierto: f.reabierto,
    simulado: false,
    descripcion: f.descripcion,
    confianzaIA: f.confianza_ia,
  };
}

function crearPostgres(url: string): Repositorio {
  const sql = postgres(url, { max: 1, ssl: url.includes("localhost") ? false : "require", transform: { undefined: null } });
  return {
    modo: "postgres",
    async listar() {
      const filas = await sql<Fila[]>`
        select id, lat, lng, severidad, descripcion, confianza_ia, apoyos, estado, creado_en, reparado_en, reabierto
        from reportes order by creado_en desc limit 5000`;
      return filas.map(aReporte);
    },
    async crear(nuevo) {
      const [fila] = await sql<Fila[]>`
        insert into reportes (lat, lng, severidad, descripcion, confianza_ia)
        values (${nuevo.lat}, ${nuevo.lng}, ${nuevo.severidad}, ${nuevo.descripcion ?? null}, ${nuevo.confianzaIA ?? null})
        returning *`;
      return aReporte(fila);
    },
    async actualizarEstado(id, estado) {
      const [fila] = await sql<Fila[]>`
        update reportes set
          estado = ${estado},
          reparado_en = case when ${estado} = 'reparado' then now() else reparado_en end,
          reabierto = reabierto or (estado = 'reparado' and ${estado} <> 'reparado')
        where id = ${id}
        returning *`;
      return fila ? aReporte(fila) : null;
    },
  };
}

let repositorio: Repositorio | null = null;

export function obtenerRepositorio(): Repositorio {
  // Vercel's Postgres integrations (Neon, Supabase) expose one of these.
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  repositorio ??= url ? crearPostgres(url) : demo;
  return repositorio;
}
