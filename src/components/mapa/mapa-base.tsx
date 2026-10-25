"use client";

import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource, Map as MapaLibre, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { GRADOS, nivelMarginacion, NAVOJOA_CENTER } from "@/lib/domain";
import { NIVELES } from "@/lib/priority";
import { ESTILO_MAPA, MARGINACION_HEX, PRIORIDAD_HEX, RADIO_NIVEL } from "./colores";

export interface PuntoReporte {
  id: string;
  nivel: (typeof NIVELES)[number]["nombre"];
  puntaje: number;
  reparado: boolean;
}

interface Props {
  puntos: FeatureCollection<Point, PuntoReporte>;
  seleccionado: string | null;
  onSeleccionar: (id: string | null) => void;
  mostrarMarginacion: boolean;
  mostrarServicios: boolean;
  /** Coordinates to fly to when the selection comes from the list. */
  enfocar: { lng: number; lat: number } | null;
}

const porNivel = <T,>(valores: Record<string, T>, fallback: T) => [
  "match",
  ["get", "nivel"],
  ...Object.entries(valores).flat(),
  fallback,
];

export function MapaBase({ puntos, seleccionado, onSeleccionar, mostrarMarginacion, mostrarServicios, enfocar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLibre | null>(null);
  const [listo, setListo] = useState(false);
  const alSeleccionar = useEffectEvent((id: string) => onSeleccionar(id));

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelado || !contenedor.current) return;
      // Copied to public/ by scripts/copy-maplibre-worker.mjs (see that file for why).
      maplibregl.setWorkerUrl(`/vendor/maplibre-gl-worker.mjs?v=${maplibregl.getVersion()}`);
      const m = new maplibregl.Map({
        container: contenedor.current,
        style: ESTILO_MAPA,
        center: [NAVOJOA_CENTER.lng, NAVOJOA_CENTER.lat],
        zoom: 13,
        minZoom: 11,
        maxBounds: [
          [-109.6, 26.93],
          [-109.3, 27.2],
        ],
        attributionControl: { compact: true },
      });
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      m.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), "top-right");
      mapa.current = m;

      m.on("load", () => {
        const gradoANivel = ["match", ["get", "grado"], ...GRADOS.flatMap((g) => [g, MARGINACION_HEX[nivelMarginacion(g)]]), "rgba(0,0,0,0)"];
        m.addSource("agebs", { type: "geojson", data: "/data/agebs.geojson" });
        m.addLayer({
          id: "agebs-relleno",
          type: "fill",
          source: "agebs",
          layout: { visibility: "none" },
          paint: { "fill-color": gradoANivel as never, "fill-opacity": 0.32 },
        });
        m.addLayer({
          id: "agebs-borde",
          type: "line",
          source: "agebs",
          layout: { visibility: "none" },
          paint: { "line-color": "#ffffff", "line-width": 0.8 },
        });

        m.addSource("servicios", { type: "geojson", data: "/data/servicios.geojson" });
        m.addLayer({
          id: "servicios",
          type: "circle",
          source: "servicios",
          layout: { visibility: "none" },
          paint: {
            "circle-radius": 4,
            "circle-color": ["match", ["get", "tipo"], "escuela", "#52514e", "#0b0b0b"],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
          },
        });

        m.addSource("reportes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({
          id: "reportes-reparados",
          type: "circle",
          source: "reportes",
          filter: ["==", ["get", "reparado"], true],
          paint: {
            "circle-radius": 3.5,
            "circle-color": "rgba(255,255,255,0.9)",
            "circle-stroke-color": "#52514e",
            "circle-stroke-width": 1.5,
          },
        });
        m.addLayer({
          id: "reportes-pendientes",
          type: "circle",
          source: "reportes",
          filter: ["==", ["get", "reparado"], false],
          paint: {
            "circle-radius": porNivel(RADIO_NIVEL, 4) as never,
            "circle-color": porNivel(PRIORIDAD_HEX, "#999") as never,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
          },
        });
        m.addLayer({
          id: "reportes-seleccion",
          type: "circle",
          source: "reportes",
          filter: ["==", ["get", "id"], ""],
          paint: {
            "circle-radius": 13,
            "circle-color": "rgba(0,0,0,0)",
            "circle-stroke-color": "#0b0b0b",
            "circle-stroke-width": 2.5,
          },
        });

        for (const capa of ["reportes-pendientes", "reportes-reparados"]) {
          m.on("click", capa, (e: MapLayerMouseEvent) => {
            const id = e.features?.[0]?.properties?.id;
            if (typeof id === "string") alSeleccionar(id);
          });
          m.on("mouseenter", capa, () => (m.getCanvas().style.cursor = "pointer"));
          m.on("mouseleave", capa, () => (m.getCanvas().style.cursor = ""));
        }
        setListo(true);
      });
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    if (!listo) return;
    (mapa.current?.getSource("reportes") as GeoJSONSource | undefined)?.setData(puntos);
  }, [listo, puntos]);

  useEffect(() => {
    if (!listo || !mapa.current) return;
    mapa.current.setFilter("reportes-seleccion", ["==", ["get", "id"], seleccionado ?? ""]);
  }, [listo, seleccionado]);

  useEffect(() => {
    if (!listo || !mapa.current) return;
    const vis = (v: boolean) => (v ? "visible" : "none");
    mapa.current.setLayoutProperty("agebs-relleno", "visibility", vis(mostrarMarginacion));
    mapa.current.setLayoutProperty("agebs-borde", "visibility", vis(mostrarMarginacion));
    mapa.current.setLayoutProperty("servicios", "visibility", vis(mostrarServicios));
  }, [listo, mostrarMarginacion, mostrarServicios]);

  useEffect(() => {
    if (!listo || !enfocar) return;
    mapa.current?.flyTo({ center: [enfocar.lng, enfocar.lat], zoom: Math.max(mapa.current.getZoom(), 15.5) });
  }, [listo, enfocar]);

  return (
    <div
      ref={contenedor}
      role="region"
      aria-label="Mapa de baches de Navojoa. La lista de prioridades ofrece la misma información en texto."
      className="h-full w-full"
    />
  );
}
