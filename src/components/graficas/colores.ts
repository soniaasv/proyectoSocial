import type { NivelMarginacion } from "@/lib/domain";

/** Marginalization levels use the validated ordinal blue ramp (see globals.css). */
export const COLOR_NIVEL: Record<NivelMarginacion, string> = {
  Baja: "var(--marg-1)",
  Media: "var(--marg-2)",
  Alta: "var(--marg-3)",
};

/** Text color for labels set inside a fill of each level (switches with the theme). */
export const TEXTO_EN_NIVEL: Record<NivelMarginacion, string> = {
  Baja: "var(--marg-1-ink)",
  Media: "var(--marg-2-ink)",
  Alta: "var(--marg-3-ink)",
};

export const ETIQUETA_NIVEL: Record<NivelMarginacion, string> = {
  Baja: "Marginación baja",
  Media: "Marginación media",
  Alta: "Marginación alta",
};
