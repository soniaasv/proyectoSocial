import { diasEntre, SEVERIDAD_LABEL, type Contexto, type Severidad } from "./domain";
import { SITE } from "./site";

export const numero = new Intl.NumberFormat("es-MX");
export const decimal = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const fechaCorta = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" });

export function fecha(iso: string): string {
  return fechaCorta.format(new Date(iso));
}

export function hace(iso: string, ahora = new Date()): string {
  const dias = diasEntre(iso, ahora);
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

/** Short, human description of where a pothole is. */
export function lugar(contexto: Contexto): string {
  const calle = contexto.calle?.nombre ?? "Calle sin nombre";
  return contexto.colonia ? `${calle}, col. ${contexto.colonia.nombre}` : calle;
}

/** Pre-filled message for the municipality's official WhatsApp channel. */
export function enlaceWhatsApp(
  reporte: { lat: number; lng: number; severidad: Severidad; contexto: Contexto },
  telefono: string = SITE.whatsappAyuntamiento,
): string {
  const texto = [
    `Reporte de bache (${SEVERIDAD_LABEL[reporte.severidad].toLowerCase()}) en ${lugar(reporte.contexto)}, Navojoa.`,
    `Ubicación: https://maps.google.com/?q=${reporte.lat.toFixed(6)},${reporte.lng.toFixed(6)}`,
    "Enviado con Calle Justa.",
  ].join("\n");
  return `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`;
}
