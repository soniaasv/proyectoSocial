import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import type { FeatureCollection, LineString, MultiPolygon, Point, Polygon } from "geojson";
import { NAVOJOA_CENTER, type ClaseVial, type Contexto, type Grado } from "./domain";
import { RADIO_SERVICIOS_M } from "./priority";

export type ColoniasGeoJSON = FeatureCollection<
  Polygon | MultiPolygon,
  { id: string; nombre: string; cp: string; tipo: string; poblacion: number; grado: Grado; indice: number; sinInternet: number }
>;
export type CallesGeoJSON = FeatureCollection<
  LineString,
  { osmId: number; nombre: string | null; clase: ClaseVial; superficie: string }
>;
export type ServiciosGeoJSON = FeatureCollection<Point, { nombre: string; tipo: "escuela" | "salud"; unidades: number }>;

export interface Capas {
  colonias: ColoniasGeoJSON;
  calles: CallesGeoJSON;
  servicios: ServiciosGeoJSON;
}

/** Farthest a report can be from a street and still be matched to it. */
export const DISTANCIA_MAXIMA_CALLE_M = 150;
const CELDA_M = 250;

// Equirectangular projection around Navojoa: meters, accurate to <0.1% at city scale.
const M_POR_GRADO_LAT = 110_540;
const M_POR_GRADO_LNG = 111_320 * Math.cos((NAVOJOA_CENTER.lat * Math.PI) / 180);

type XY = [number, number];
const proyectar = (lng: number, lat: number): XY => [
  (lng - NAVOJOA_CENTER.lng) * M_POR_GRADO_LNG,
  (lat - NAVOJOA_CENTER.lat) * M_POR_GRADO_LAT,
];

function distanciaASegmento(p: XY, a: XY, b: XY): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const largo2 = dx * dx + dy * dy;
  const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / largo2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

const llaveCelda = (x: number, y: number) => `${Math.floor(x / CELDA_M)}:${Math.floor(y / CELDA_M)}`;

/** Builds a fast lookup from a location to its street, colonia and nearby services. */
export function crearResolverContexto({ colonias, calles, servicios }: Capas) {
  // Spatial grid: each cell lists the street segments that touch it.
  const segmentos: { a: XY; b: XY; calle: number }[] = [];
  const grid = new Map<string, number[]>();
  calles.features.forEach((feature, calle) => {
    const puntos = feature.geometry.coordinates.map(([lng, lat]) => proyectar(lng, lat));
    for (let i = 0; i < puntos.length - 1; i++) {
      const idx = segmentos.push({ a: puntos[i], b: puntos[i + 1], calle }) - 1;
      const [ax, ay] = puntos[i];
      const [bx, by] = puntos[i + 1];
      for (let cx = Math.floor(Math.min(ax, bx) / CELDA_M); cx <= Math.floor(Math.max(ax, bx) / CELDA_M); cx++) {
        for (let cy = Math.floor(Math.min(ay, by) / CELDA_M); cy <= Math.floor(Math.max(ay, by) / CELDA_M); cy++) {
          const key = `${cx}:${cy}`;
          const lista = grid.get(key);
          if (lista) lista.push(idx);
          else grid.set(key, [idx]);
        }
      }
    }
  });
  const serviciosXY = servicios.features.map((f) => ({
    xy: proyectar(f.geometry.coordinates[0], f.geometry.coordinates[1]),
    props: f.properties,
  }));

  function calleMasCercana(p: XY): Contexto["calle"] {
    let mejor = { distancia: Infinity, calle: -1 };
    const [cx, cy] = llaveCelda(p[0], p[1]).split(":").map(Number);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const idx of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
          const s = segmentos[idx];
          const d = distanciaASegmento(p, s.a, s.b);
          if (d < mejor.distancia) mejor = { distancia: d, calle: s.calle };
        }
      }
    }
    if (mejor.calle < 0 || mejor.distancia > DISTANCIA_MAXIMA_CALLE_M) return null;
    const { nombre, clase, superficie } = calles.features[mejor.calle].properties;
    return { nombre, clase, superficie, distanciaM: Math.round(mejor.distancia) };
  }

  function coloniaDe(lng: number, lat: number): Contexto["colonia"] {
    const feature = colonias.features.find((f) => booleanPointInPolygon([lng, lat], f));
    if (!feature) return null;
    const { id, nombre, grado, poblacion } = feature.properties;
    return { id, nombre, grado, poblacion };
  }

  function serviciosCercanos(p: XY): Contexto["servicios"] {
    let escuelas = 0;
    let salud = 0;
    let masCercano: Contexto["servicios"]["masCercano"] = null;
    for (const s of serviciosXY) {
      const d = Math.hypot(p[0] - s.xy[0], p[1] - s.xy[1]);
      if (d > RADIO_SERVICIOS_M) continue;
      if (s.props.tipo === "escuela") escuelas++;
      else salud++;
      if (!masCercano || d < masCercano.distanciaM) {
        masCercano = { nombre: s.props.nombre, tipo: s.props.tipo, distanciaM: Math.round(d) };
      }
    }
    return { escuelas, salud, masCercano };
  }

  return function resolver(lat: number, lng: number): Contexto {
    const p = proyectar(lng, lat);
    return { colonia: coloniaDe(lng, lat), calle: calleMasCercana(p), servicios: serviciosCercanos(p) };
  };
}
