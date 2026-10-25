import type { NivelMarginacion } from "@/lib/domain";
import type { Nivel } from "@/lib/priority";

// The basemap is always light (Positron), so map marks use the light-surface
// steps of the validated ramps (see globals.css).
export const PRIORIDAD_HEX: Record<Nivel, string> = {
  Baja: "#f0a08a",
  Media: "#e0674f",
  Alta: "#c23a2c",
  Urgente: "#8a1c17",
};

export const MARGINACION_HEX: Record<NivelMarginacion, string> = {
  Baja: "#86b6ef",
  Media: "#2a78d6",
  Alta: "#104281",
};

export const RADIO_NIVEL: Record<Nivel, number> = { Baja: 4, Media: 5, Alta: 6.5, Urgente: 8 };

export const ESTILO_MAPA = "https://tiles.openfreemap.org/styles/positron";
