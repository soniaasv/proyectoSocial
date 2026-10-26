"use client";

import { Camera, CheckCircle2, CircleAlert, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { detectarBaches, modeloDisponible, type Deteccion } from "@/lib/client/detector";
import { evaluarCalidad, leerImagen, type CalidadFoto } from "@/lib/client/imagen";

type Analisis =
  | { estado: "inicial" }
  | { estado: "analizando" }
  | { estado: "listo"; deteccion: Deteccion | null; calidad: CalidadFoto }
  | { estado: "error"; mensaje: string };

/** Photo step: preview, on-device detection and quality check. Optional. */
export function PasoFoto({ onConfianza }: { onConfianza: (confianza: number | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [analisis, setAnalisis] = useState<Analisis>({ estado: "inicial" });
  const [hayModelo, setHayModelo] = useState<boolean | null>(null);
  // The check is kept as a promise so a photo picked before it resolves still waits for it.
  const verificacion = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    verificacion.current = modeloDisponible();
    verificacion.current.then(setHayModelo);
  }, []);

  async function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    setAnalisis({ estado: "analizando" });
    onConfianza(null);
    try {
      const imagen = await leerImagen(archivo);
      dibujar(imagen, []);
      const calidad = evaluarCalidad(imagen);
      const disponible = await (verificacion.current ?? modeloDisponible());
      const deteccion = disponible ? await detectarBaches(imagen) : null;
      if (deteccion) dibujar(imagen, deteccion.cajas);
      onConfianza(deteccion ? deteccion.confianza : null);
      setAnalisis({ estado: "listo", deteccion, calidad });
    } catch {
      setAnalisis({ estado: "error", mensaje: "No pudimos analizar la foto. Puedes continuar sin ella." });
    }
  }

  function dibujar(imagen: ImageBitmap, cajas: Deteccion["cajas"]) {
    const c = canvas.current;
    if (!c) return;
    const escala = Math.min(1, 960 / Math.max(imagen.width, imagen.height));
    c.width = Math.round(imagen.width * escala);
    c.height = Math.round(imagen.height * escala);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(imagen, 0, 0, c.width, c.height);
    ctx.lineWidth = Math.max(3, c.width / 200);
    ctx.font = `600 ${Math.max(14, c.width / 40)}px system-ui, sans-serif`;
    for (const caja of cajas) {
      const [x, y, w, h] = [caja.x * escala, caja.y * escala, caja.ancho * escala, caja.alto * escala];
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = "#dc2626";
      ctx.strokeRect(x + ctx.lineWidth, y + ctx.lineWidth, w - 2 * ctx.lineWidth, h - 2 * ctx.lineWidth);
      const etiqueta = `Bache ${Math.round(caja.confianza * 100)}%`;
      const ancho = ctx.measureText(etiqueta).width + 12;
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(x, Math.max(0, y - 28), ancho, 26);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(etiqueta, x + 6, Math.max(19, y - 9));
    }
  }

  const tieneFoto = analisis.estado !== "inicial";

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-strong bg-plane px-4 py-8 text-center transition hover:bg-card has-focus-visible:outline-2 has-focus-visible:outline-focus">
        <Camera className="h-8 w-8 text-ink-2" aria-hidden="true" />
        <span className="font-medium">{tieneFoto ? "Tomar otra foto" : "Tomar o elegir una foto"}</span>
        <span className="text-sm text-ink-2">Opcional, pero ayuda a confirmar que es un bache</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => alElegir(e.target.files?.[0])}
        />
      </label>

      <canvas ref={canvas} className={tieneFoto ? "w-full rounded-xl border border-line" : "hidden"} />

      <div aria-live="polite" className="space-y-2 text-sm">
        {analisis.estado === "analizando" && (
          <p className="flex items-center gap-2 text-ink-2">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Analizando la foto en tu celular…
          </p>
        )}
        {analisis.estado === "listo" && analisis.deteccion && (
          analisis.deteccion.cajas.length > 0 ? (
            <p className="flex items-start gap-2 rounded-lg bg-good-soft p-3 text-ink">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-good" aria-hidden="true" />
              La IA encontró {analisis.deteccion.cajas.length === 1 ? "un bache" : `${analisis.deteccion.cajas.length} baches`} (
              {Math.round(analisis.deteccion.confianza * 100)}% de confianza) en {analisis.deteccion.milisegundos} ms.
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-lg bg-plane p-3 text-ink-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              La IA no encontró un bache en esta foto. Si tú sí lo ves, puedes continuar: el modelo todavía está aprendiendo
              cómo son las calles de Navojoa.
            </p>
          )
        )}
        {analisis.estado === "listo" &&
          analisis.calidad.avisos.map((aviso) => (
            <p key={aviso} className="flex items-start gap-2 text-ink-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {aviso}
            </p>
          ))}
        {analisis.estado === "error" && <p role="alert" className="text-ink-2">{analisis.mensaje}</p>}
        <p className="flex items-start gap-2 text-xs text-ink-3">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Tu foto se analiza en tu celular y no se sube a ningún servidor.
          {hayModelo === false && " (El detector de IA no está disponible en este momento.)"}
        </p>
      </div>
    </div>
  );
}
