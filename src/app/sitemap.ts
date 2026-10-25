import type { MetadataRoute } from "next";
import { NAVEGACION, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/reportar", ...NAVEGACION.map((n) => n.href)].map((ruta) => ({ url: `${SITE.url}${ruta}` }));
}
