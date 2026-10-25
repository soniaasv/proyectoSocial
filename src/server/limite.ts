import "server-only";

const VENTANA_MS = 10 * 60 * 1000;
const MAXIMO = 10;
const solicitudes = new Map<string, number[]>();

/**
 * Best-effort per-IP rate limit for report submissions (10 every 10 minutes).
 * It is per serverless instance, so it slows down abuse without being a
 * security boundary; a shared store would be needed for that.
 */
export function permitir(ip: string, ahora = Date.now()): boolean {
  const recientes = (solicitudes.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAXIMO) {
    solicitudes.set(ip, recientes);
    return false;
  }
  recientes.push(ahora);
  solicitudes.set(ip, recientes);
  return true;
}

export function ipDe(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "desconocida";
}
