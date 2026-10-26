import type { NivelMarginacion } from "@/lib/domain";
import type { Nivel } from "@/lib/priority";

// The basemap is always light (Positron), so map marks use the light-surface
// steps of the validated ramps (see globals.css).
export const PRIORIDAD_HEX: Record<Nivel, string> = {
  Baja: "#f87171",
  Media: "#dc2626",
  Alta: "#b91c1c",
  Urgente: "#7f1d1d",
};

export const MARGINACION_HEX: Record<NivelMarginacion, string> = {
  Baja: "#60a5fa",
  Media: "#2563eb",
  Alta: "#1e3a8a",
};

export const RADIO_NIVEL: Record<Nivel, number> = { Baja: 4, Media: 5, Alta: 6.5, Urgente: 8 };

export const ESTILO_MAPA = "https://tiles.openfreemap.org/styles/positron";
