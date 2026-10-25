"use client";

export interface CalidadFoto {
  /** Variance of the Laplacian: low values mean a blurry photo. */
  nitidez: number;
  /** Mean luminance from 0 (black) to 255 (white). */
  brillo: number;
  avisos: string[];
}

const UMBRAL_BORROSA = 60;
const LADO_ANALISIS = 256;

/** Quick on-device quality check so citizens can retake a bad photo right away. */
export function evaluarCalidad(imagen: ImageBitmap): CalidadFoto {
  const escala = LADO_ANALISIS / Math.max(imagen.width, imagen.height);
  const w = Math.max(1, Math.round(imagen.width * escala));
  const h = Math.max(1, Math.round(imagen.height * escala));
  const ctx = new OffscreenCanvas(w, h).getContext("2d")!;
  ctx.drawImage(imagen, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gris = new Float32Array(w * h);
  let suma = 0;
  for (let i = 0; i < w * h; i++) {
    gris[i] = 0.299 * data[4 * i] + 0.587 * data[4 * i + 1] + 0.114 * data[4 * i + 2];
    suma += gris[i];
  }
  const brillo = suma / (w * h);

  let n = 0;
  let media = 0;
  let m2 = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = gris[i - 1] + gris[i + 1] + gris[i - w] + gris[i + w] - 4 * gris[i];
      // Welford's online variance.
      n++;
      const delta = lap - media;
      media += delta / n;
      m2 += delta * (lap - media);
    }
  }
  const nitidez = n > 1 ? m2 / (n - 1) : 0;

  const avisos: string[] = [];
  if (nitidez < UMBRAL_BORROSA) avisos.push("La foto parece borrosa. Si puedes, tómala otra vez con el celular quieto.");
  if (brillo < 40) avisos.push("La foto está muy oscura. Prueba con más luz o con flash.");
  if (brillo > 230) avisos.push("La foto está muy clara. Evita apuntar directo al sol.");
  return { nitidez, brillo, avisos };
}

export async function leerImagen(archivo: File): Promise<ImageBitmap> {
  return createImageBitmap(archivo, { imageOrientation: "from-image" });
}
