import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  crearResolverContexto,
  type AgebsGeoJSON,
  type Capas,
  type CallesGeoJSON,
  type ColoniasGeoJSON,
  type ServiciosGeoJSON,
} from "@/lib/geo";

const DATA_DIR = path.join(process.cwd(), "public", "data");

function leer<T>(archivo: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, archivo), "utf8")) as T;
}

let capas: Capas | null = null;
let resolver: ReturnType<typeof crearResolverContexto> | null = null;

/** Context layers built by the data pipeline, loaded once per server instance. */
export function obtenerCapas(): Capas {
  capas ??= {
    colonias: leer<ColoniasGeoJSON>("colonias.geojson"),
    agebs: leer<AgebsGeoJSON>("agebs.geojson"),
    calles: leer<CallesGeoJSON>("calles.geojson"),
    servicios: leer<ServiciosGeoJSON>("servicios.geojson"),
  };
  return capas;
}

export function resolverContexto(lat: number, lng: number) {
  resolver ??= crearResolverContexto(obtenerCapas());
  return resolver(lat, lng);
}
