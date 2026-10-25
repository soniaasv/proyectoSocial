/**
 * Pure post-processing for a single-class YOLO11 detector exported to ONNX.
 * The raw output has shape [1, 5, N]: for each of N candidate boxes, the
 * center x, center y, width, height (in input pixels) and the class score.
 */

export interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  confianza: number;
}

export const UMBRAL_CONFIANZA = 0.35;
export const UMBRAL_IOU = 0.45;

export function decodificar(salida: Float32Array, candidatos: number, umbral = UMBRAL_CONFIANZA): Caja[] {
  const cajas: Caja[] = [];
  for (let i = 0; i < candidatos; i++) {
    const confianza = salida[4 * candidatos + i];
    if (confianza < umbral) continue;
    const cx = salida[i];
    const cy = salida[candidatos + i];
    const ancho = salida[2 * candidatos + i];
    const alto = salida[3 * candidatos + i];
    cajas.push({ x: cx - ancho / 2, y: cy - alto / 2, ancho, alto, confianza });
  }
  return cajas;
}

export function iou(a: Caja, b: Caja): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.ancho, b.x + b.ancho);
  const y2 = Math.min(a.y + a.alto, b.y + b.alto);
  const interseccion = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.ancho * a.alto + b.ancho * b.alto - interseccion;
  return union > 0 ? interseccion / union : 0;
}

/** Non-maximum suppression: keep the most confident box among overlapping ones. */
export function nms(cajas: Caja[], umbral = UMBRAL_IOU): Caja[] {
  const ordenadas = [...cajas].sort((a, b) => b.confianza - a.confianza);
  const elegidas: Caja[] = [];
  for (const caja of ordenadas) {
    if (elegidas.every((e) => iou(e, caja) < umbral)) elegidas.push(caja);
  }
  return elegidas;
}

/** Maps boxes from the letterboxed square input back to the original image. */
export function desletterbox(cajas: Caja[], escala: number, offsetX: number, offsetY: number): Caja[] {
  return cajas.map((c) => ({
    x: (c.x - offsetX) / escala,
    y: (c.y - offsetY) / escala,
    ancho: c.ancho / escala,
    alto: c.alto / escala,
    confianza: c.confianza,
  }));
}
