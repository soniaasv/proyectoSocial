"use client";

import modelo from "@/data/modelo.json";
import { decodificar, desletterbox, nms, type Caja } from "@/lib/yolo";

// Written by ml/calibrate.py: model file and the F1-optimal threshold on validation.
export const MODELO_URL = modelo.archivo;
const LADO = 640;

type Sesion = import("onnxruntime-web").InferenceSession;
let sesion: Promise<Sesion> | null = null;

/** Loads the model once, on first use, so the page itself stays light. */
function cargarSesion(): Promise<Sesion> {
  sesion ??= (async () => {
    const ort = await import("onnxruntime-web/wasm");
    // Runtime files are copied to public/vendor by scripts/copy-vendor.mjs.
    ort.env.wasm.wasmPaths = "/vendor/ort/";
    // Threads need cross-origin isolation, which the site does not enable.
    ort.env.wasm.numThreads = 1;
    return ort.InferenceSession.create(MODELO_URL, { executionProviders: ["wasm"] });
  })();
  sesion.catch(() => (sesion = null));
  return sesion;
}

export interface Deteccion {
  cajas: Caja[];
  /** Highest box confidence, or 0 when nothing was found. */
  confianza: number;
  milisegundos: number;
}

/** Runs the pothole detector on the user's device; the photo never leaves it. */
export async function detectarBaches(imagen: ImageBitmap): Promise<Deteccion> {
  const inicio = performance.now();
  const [ort, s] = await Promise.all([import("onnxruntime-web/wasm"), cargarSesion()]);

  // Letterbox: scale to fit 640x640 keeping proportions, pad with gray.
  const escala = Math.min(LADO / imagen.width, LADO / imagen.height);
  const w = Math.round(imagen.width * escala);
  const h = Math.round(imagen.height * escala);
  const offsetX = Math.floor((LADO - w) / 2);
  const offsetY = Math.floor((LADO - h) / 2);
  const canvas = new OffscreenCanvas(LADO, LADO);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(114,114,114)";
  ctx.fillRect(0, 0, LADO, LADO);
  ctx.drawImage(imagen, offsetX, offsetY, w, h);
  const { data } = ctx.getImageData(0, 0, LADO, LADO);

  // HWC uint8 RGBA -> CHW float32 RGB in [0, 1].
  const area = LADO * LADO;
  const tensor = new Float32Array(3 * area);
  for (let i = 0; i < area; i++) {
    tensor[i] = data[4 * i] / 255;
    tensor[area + i] = data[4 * i + 1] / 255;
    tensor[2 * area + i] = data[4 * i + 2] / 255;
  }

  const entrada = new ort.Tensor("float32", tensor, [1, 3, LADO, LADO]);
  const resultado = await s.run({ [s.inputNames[0]]: entrada });
  const salida = resultado[s.outputNames[0]];
  const candidatos = salida.dims[2];
  const cajas = desletterbox(nms(decodificar(salida.data as Float32Array, candidatos, modelo.umbral)), escala, offsetX, offsetY);
  return {
    cajas,
    confianza: cajas.reduce((max, c) => Math.max(max, c.confianza), 0),
    milisegundos: Math.round(performance.now() - inicio),
  };
}

/** Whether the model file is deployed (the report flow works without it). */
export async function modeloDisponible(): Promise<boolean> {
  try {
    const res = await fetch(MODELO_URL, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}
