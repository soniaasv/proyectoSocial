import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.nombre} · ${SITE.lema}`,
    short_name: SITE.nombre,
    description: SITE.descripcion,
    lang: "es-MX",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfb",
    theme_color: "#c23a2c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    shortcuts: [{ name: "Reportar un bache", url: "/reportar" }],
  };
}
