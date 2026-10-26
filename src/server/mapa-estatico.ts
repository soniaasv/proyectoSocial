import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import simulados from "@/data/reportes-simulados.json";
import type { CallesGeoJSON } from "@/lib/geo";

export interface MapaEstatico {
  ancho: number;
  alto: number;
  /** One SVG path per road class, so main roads can be drawn heavier. */
  calles: { principales: string; locales: string };
  baches: { x: number; y: number; severidad: 1 | 2 | 3 }[];
}

const ANCHO = 600;
/** Share of street vertices left outside the frame on each side. */
const RECORTE = 0.015;

function percentiles(valores: number[], p: number): [number, number] {
  const orden = [...valores].sort((a, b) => a - b);
  return [orden[Math.floor(p * (orden.length - 1))], orden[Math.ceil((1 - p) * (orden.length - 1))]];
}

/**
 * Projects Navojoa's real streets and pending potholes to a small SVG for the
 * home page. Runs at build time; coordinates are rounded to whole pixels so
 * the markup stays light.
 */
export function construirMapaEstatico(): MapaEstatico {
  const calles = JSON.parse(
    readFileSync(path.join(process.cwd(), "public", "data", "calles.geojson"), "utf8"),
  ) as CallesGeoJSON;

  // Frame the dense urban core: a few long roads reach far beyond it.
  const lngs: number[] = [];
  const lats: number[] = [];
  for (const f of calles.features) {
    for (const [lng, lat] of f.geometry.coordinates) {
      lngs.push(lng);
      lats.push(lat);
    }
  }
  const [oeste, este] = percentiles(lngs, RECORTE);
  const [sur, norte] = percentiles(lats, RECORTE);
  // Equirectangular projection corrected for latitude, fine at city scale.
  const kx = Math.cos(((sur + norte) / 2) * (Math.PI / 180));
  const escala = ANCHO / ((este - oeste) * kx);
  const alto = Math.round((norte - sur) * escala);
  const proyectar = (lng: number, lat: number) =>
    [Math.round((lng - oeste) * kx * escala), Math.round((norte - lat) * escala)] as const;

  const trazos = { principales: [] as string[], locales: [] as string[] };
  for (const f of calles.features) {
    const puntos: string[] = [];
    const fuera: boolean[] = [];
    let anterior = "";
    for (const [lng, lat] of f.geometry.coordinates) {
      const [x, y] = proyectar(lng, lat);
      fuera.push(x < -20 || x > ANCHO + 20 || y < -20 || y > alto + 20);
      const p = `${x} ${y}`;
      if (p !== anterior) puntos.push(p);
      anterior = p;
    }
    if (puntos.length < 2 || fuera.every(Boolean)) continue;
    const d = `M${puntos.join("L")}`;
    (f.properties.clase === "local" ? trazos.locales : trazos.principales).push(d);
  }

  const baches = simulados.reportes
    .filter((r) => r.estado !== "reparado")
    .map((r) => {
      const [x, y] = proyectar(r.lng, r.lat);
      return { x, y, severidad: r.severidad as 1 | 2 | 3 };
    })
    .filter((b) => b.x >= 0 && b.x <= ANCHO && b.y >= 0 && b.y <= alto)
    // Draw severe potholes last so they sit on top.
    .sort((a, b) => a.severidad - b.severidad);

  return {
    ancho: ANCHO,
    alto,
    calles: { principales: trazos.principales.join(""), locales: trazos.locales.join("") },
    baches,
  };
}
