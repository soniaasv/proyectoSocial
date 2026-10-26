"use client";

import type { Map as MapaLibre, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, LoaderCircle } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ESTILO_MAPA } from "@/components/mapa/colores";
import { NAVOJOA_BBOX, NAVOJOA_CENTER } from "@/lib/domain";

export interface Ubicacion {
  lat: number;
  lng: number;
}

const dentro = ({ lat, lng }: Ubicacion) =>
  lng >= NAVOJOA_BBOX[0] && lng <= NAVOJOA_BBOX[2] && lat >= NAVOJOA_BBOX[1] && lat <= NAVOJOA_BBOX[3];

/** Pick a location by GPS, by tapping the map or by dragging the pin. */
export function SelectorUbicacion({ valor, onCambio }: { valor: Ubicacion | null; onCambio: (u: Ubicacion) => void }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLibre | null>(null);
  const marcador = useRef<Marker | null>(null);
  const [gps, setGps] = useState<"inactivo" | "buscando" | "denegado" | "error" | "fuera">("inactivo");
  const alCambiar = useEffectEvent((u: Ubicacion) => onCambio(u));

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelado || !contenedor.current) return;
      maplibregl.setWorkerUrl(`/vendor/maplibre-gl-worker.mjs?v=${maplibregl.getVersion()}`);
      const m = new maplibregl.Map({
        container: contenedor.current,
        style: ESTILO_MAPA,
        center: [NAVOJOA_CENTER.lng, NAVOJOA_CENTER.lat],
        zoom: 13,
        attributionControl: { compact: true },
      });
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      const pin = new maplibregl.Marker({ color: "#dc2626", draggable: true });
      pin.on("dragend", () => {
        const { lat, lng } = pin.getLngLat();
        alCambiar({ lat, lng });
      });
      m.on("click", (e) => alCambiar({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
      mapa.current = m;
      marcador.current = pin;
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    const m = mapa.current;
    const pin = marcador.current;
    if (!m || !pin || !valor) return;
    pin.setLngLat([valor.lng, valor.lat]).addTo(m);
    if (!m.getBounds().contains([valor.lng, valor.lat]) || m.getZoom() < 15) {
      m.easeTo({ center: [valor.lng, valor.lat], zoom: 16 });
    }
  }, [valor]);

  function usarGps() {
    if (!navigator.geolocation) return setGps("error");
    setGps("buscando");
    const exito = ({ coords }: GeolocationPosition) => {
      const u = { lat: coords.latitude, lng: coords.longitude };
      if (!dentro(u)) return setGps("fuera");
      setGps("inactivo");
      onCambio(u);
    };
    const fallo = (e: GeolocationPositionError) => setGps(e.code === e.PERMISSION_DENIED ? "denegado" : "error");
    // GPS first; laptops and indoor phones often have no fix, so fall back to
    // the network-based position (Wi-Fi, cell), which is usually good enough.
    navigator.geolocation.getCurrentPosition(
      exito,
      (e) => {
        if (e.code === e.PERMISSION_DENIED) return fallo(e);
        navigator.geolocation.getCurrentPosition(exito, fallo, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={usarGps}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-medium text-surface transition hover:opacity-85"
      >
        {gps === "buscando" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LocateFixed className="h-4 w-4" aria-hidden="true" />}
        Usar mi ubicación actual
      </button>
      {gps === "denegado" && (
        <p role="alert" className="text-sm text-ink-2">
          Tu navegador tiene bloqueada la ubicación para este sitio. Permítela desde el ícono junto a la dirección de la
          página (o en los ajustes de ubicación de tu teléfono) y vuelve a intentarlo, o toca el mapa para marcar el bache.
        </p>
      )}
      {gps === "error" && (
        <p role="alert" className="text-sm text-ink-2">
          No pudimos encontrar tu ubicación; pasa a veces en computadoras o bajo techo. Toca el mapa para marcar el bache.
        </p>
      )}
      {gps === "fuera" && <p role="alert" className="text-sm text-ink-2">Parece que no estás en Navojoa. Toca el mapa para marcar el bache.</p>}
      <p className="text-center text-xs text-ink-3">o toca el mapa donde está el bache (puedes arrastrar el marcador)</p>
      <div ref={contenedor} className="h-72 overflow-hidden rounded-xl border border-line" aria-label="Mapa para marcar la ubicación del bache" />
    </div>
  );
}
