import { z } from "zod";

/** CONAPO marginalization grades, from least to most marginalized. */
export const GRADOS = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"] as const;
export type Grado = (typeof GRADOS)[number];

/** Grade as an adjective agreeing with "marginación": "marginación muy alta". */
export const GRADO_ADJETIVO: Record<Grado, string> = {
  "Muy bajo": "muy baja",
  Bajo: "baja",
  Medio: "media",
  Alto: "alta",
  "Muy alto": "muy alta",
};

/** Road hierarchy derived from OpenStreetMap, from busiest to quietest. */
export const CLASES_VIALES = ["primaria", "secundaria", "terciaria", "local"] as const;
export type ClaseVial = (typeof CLASES_VIALES)[number];

export const ESTADOS = ["pendiente", "en_proceso", "reparado"] as const;
export type Estado = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<Estado, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  reparado: "Reparado",
};

export type Fuente = "ciudadano" | "recorrido";

export const SEVERIDAD_LABEL = { 1: "Leve", 2: "Moderado", 3: "Grave" } as const;
export type Severidad = keyof typeof SEVERIDAD_LABEL;

export interface Reporte {
  id: string;
  lat: number;
  lng: number;
  severidad: Severidad;
  fuente: Fuente;
  /** Number of citizens who reported this pothole. */
  apoyos: number;
  creadoEn: string;
  estado: Estado;
  reparadoEn: string | null;
  /** The pothole was repaired and opened again (the patch did not last). */
  reabierto: boolean;
  simulado: boolean;
  descripcion?: string | null;
  /** Confidence of the on-device detector, when the photo was checked. */
  confianzaIA?: number | null;
}

export interface Contexto {
  colonia: { id: string; nombre: string; grado: Grado; poblacion: number } | null;
  calle: { nombre: string | null; clase: ClaseVial; superficie: string; distanciaM: number } | null;
  servicios: {
    escuelas: number;
    salud: number;
    masCercano: { nombre: string; tipo: "escuela" | "salud"; distanciaM: number } | null;
  };
}

/** Bounding box of Navojoa city (W, S, E, N), used to validate locations. */
export const NAVOJOA_BBOX = [-109.51, 26.99, -109.39, 27.12] as const;
export const NAVOJOA_CENTER = { lng: -109.443, lat: 27.072 } as const;

export const nuevoReporteSchema = z.object({
  lat: z.number().min(NAVOJOA_BBOX[1]).max(NAVOJOA_BBOX[3]),
  lng: z.number().min(NAVOJOA_BBOX[0]).max(NAVOJOA_BBOX[2]),
  severidad: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  descripcion: z.string().trim().max(280).optional().nullable(),
  confianzaIA: z.number().min(0).max(1).optional().nullable(),
});
export type NuevoReporte = z.infer<typeof nuevoReporteSchema>;

export const actualizarEstadoSchema = z.object({
  estado: z.enum(ESTADOS),
});

export function diasEntre(desde: string | Date, hasta: string | Date): number {
  const ms = new Date(hasta).getTime() - new Date(desde).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
