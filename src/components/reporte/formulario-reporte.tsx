"use client";

import { ArrowRight, Check, LoaderCircle, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { DesglosePrioridad, NivelBadge } from "@/components/prioridad";
import { guardarReporteLocal } from "@/lib/client/use-reportes";
import { GRADO_ADJETIVO, gradoDe, SEVERIDAD_LABEL, type Contexto, type Severidad } from "@/lib/domain";
import type { ReporteEnriquecido } from "@/lib/equity";
import { enlaceWhatsApp, lugar } from "@/lib/format";
import { PasoFoto } from "./paso-foto";
import { SelectorUbicacion, type Ubicacion } from "./selector-ubicacion";

const SEVERIDADES: { valor: Severidad; descripcion: string }[] = [
  { valor: 1, descripcion: "Se puede esquivar sin problema" },
  { valor: 2, descripcion: "Obliga a frenar o a cambiar de carril" },
  { valor: 3, descripcion: "Daña llantas, es hondo o es peligroso para motos y bicis" },
];

type Envio =
  | { estado: "editando" }
  | { estado: "enviando" }
  | { estado: "enviado"; persistido: boolean; reporte: ReporteEnriquecido }
  | { estado: "error"; mensaje: string };

export function FormularioReporte() {
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [contexto, setContexto] = useState<Contexto | null>(null);
  const [severidad, setSeveridad] = useState<Severidad | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [confianzaIA, setConfianzaIA] = useState<number | null>(null);
  const [envio, setEnvio] = useState<Envio>({ estado: "editando" });

  useEffect(() => {
    if (!ubicacion) return;
    const controller = new AbortController();
    fetch(`/api/contexto?lat=${ubicacion.lat}&lng=${ubicacion.lng}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then(setContexto)
      .catch(() => {});
    return () => controller.abort();
  }, [ubicacion]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ubicacion || !severidad) return;
    setEnvio({ estado: "enviando" });
    const sitioWeb = new FormData(e.currentTarget).get("sitioWeb");
    try {
      const res = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ubicacion, severidad, descripcion: descripcion || null, confianzaIA, sitioWeb }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? "No pudimos enviar el reporte.");
      if (!datos.persistido) guardarReporteLocal(datos.reporte);
      setEnvio({ estado: "enviado", persistido: datos.persistido, reporte: datos.reporte });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setEnvio({ estado: "error", mensaje: error instanceof Error ? error.message : "No pudimos enviar el reporte." });
    }
  }

  if (envio.estado === "enviado") return <Resultado {...envio} />;

  const grado = contexto ? gradoDe(contexto) : null;
  const cercanos = contexto ? contexto.servicios.escuelas + contexto.servicios.salud : 0;

  return (
    <form onSubmit={enviar} className="space-y-10">
      <Paso numero={1} titulo="Foto del bache">
        <PasoFoto onConfianza={setConfianzaIA} />
      </Paso>

      <Paso numero={2} titulo="¿Dónde está?">
        <SelectorUbicacion valor={ubicacion} onCambio={setUbicacion} />
        {ubicacion && (
          <div aria-live="polite" className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-card p-3 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            {contexto ? (
              <div>
                <p className="font-medium">{lugar(contexto)}</p>
                <p className="text-ink-2">
                  {grado ? `Zona de marginación ${GRADO_ADJETIVO[grado]}` : "Zona sin dato de marginación"}
                  {cercanos > 0 &&
                    ` · ${cercanos} ${cercanos === 1 ? "escuela o unidad de salud" : "escuelas o unidades de salud"} a menos de 300 m`}
                </p>
              </div>
            ) : (
              <p className="text-ink-2">Buscando la calle…</p>
            )}
          </div>
        )}
      </Paso>

      <Paso numero={3} titulo="¿Qué tan grave es?">
        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="sr-only">Severidad del bache</legend>
          {SEVERIDADES.map((s) => (
            <label
              key={s.valor}
              className="cursor-pointer rounded-lg border-2 border-line bg-card p-4 transition has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:outline-2 has-focus-visible:outline-focus"
            >
              <input
                type="radio"
                name="severidad"
                value={s.valor}
                checked={severidad === s.valor}
                onChange={() => setSeveridad(s.valor)}
                className="sr-only"
                required
              />
              <span className="flex items-center gap-2 font-semibold">
                <span className="flex gap-0.5" aria-hidden="true">
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={`h-3 w-1.5 rounded-full ${n <= s.valor ? "bg-brand" : "bg-line-strong"}`} />
                  ))}
                </span>
                {SEVERIDAD_LABEL[s.valor]}
              </span>
              <span className="mt-1 block text-sm text-ink-2">{s.descripcion}</span>
            </label>
          ))}
        </fieldset>
      </Paso>

      <Paso numero={4} titulo="¿Algo más? (opcional)">
        <label htmlFor="descripcion" className="sr-only">
          Comentario
        </label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value.slice(0, 280))}
          rows={3}
          placeholder="Por ejemplo: está frente a la escuela, se llena de agua cuando llueve…"
          className="w-full rounded-xl border border-line-strong bg-card p-3 text-base placeholder:text-ink-3"
        />
        <p className="mt-1 text-right text-xs text-ink-3">{descripcion.length}/280 · No escribas datos personales</p>
        {/* Honeypot: hidden from people, filled by bots. */}
        <input type="text" name="sitioWeb" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      </Paso>

      {envio.estado === "error" && (
        <p role="alert" className="rounded-xl border border-line bg-brand-soft p-3 text-sm">
          {envio.mensaje}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface/95 px-4 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={!ubicacion || !severidad || envio.estado === "enviando"}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-3.5 text-base font-semibold text-brand-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {envio.estado === "enviando" && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Enviar reporte
        </button>
        {(!ubicacion || !severidad) && (
          <p className="mt-2 text-center text-xs text-ink-3">
            Falta: {[!ubicacion && "la ubicación", !severidad && "la severidad"].filter(Boolean).join(" y ")}
          </p>
        )}
      </div>
    </form>
  );
}

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`paso-${numero}`} className="space-y-4">
      <h2 id={`paso-${numero}`} className="flex items-center gap-3 text-lg font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-surface">{numero}</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Resultado({ persistido, reporte }: { persistido: boolean; reporte: ReporteEnriquecido }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-good-soft">
          <Check className="h-7 w-7 text-good" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-semibold tracking-tight">¡Gracias! Tu reporte cuenta</h2>
        <p className="text-ink-2">{lugar(reporte.contexto)}</p>
        <NivelBadge nivel={reporte.prioridad.nivel} puntaje={reporte.prioridad.puntaje} />
      </div>

      {!persistido && (
        <p className="rounded-xl border border-line bg-plane p-4 text-sm text-ink-2">
          <strong className="text-ink">Modo demostración:</strong> por ahora tu reporte se guarda solo en este dispositivo y
          aparecerá en tu mapa. Cuando la plataforma esté conectada a su base de datos, los reportes serán públicos.
        </p>
      )}

      <section className="rounded-lg border border-line bg-card p-5">
        <h3 className="mb-4 font-semibold">Así se calculó su prioridad</h3>
        <DesglosePrioridad prioridad={reporte.prioridad} />
      </section>

      <section className="space-y-3 rounded-lg border-2 border-brand bg-brand-soft p-5">
        <h3 className="font-semibold">Para que lo reparen, envíalo también al Ayuntamiento</h3>
        <p className="text-sm text-ink-2">
          Calle Justa no sustituye el canal oficial. Preparamos el mensaje con la ubicación exacta para el WhatsApp de
          Reporte Ciudadano (642 157 1356); solo tienes que enviarlo.
        </p>
        <a
          href={enlaceWhatsApp(reporte)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 font-semibold text-brand-ink hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Enviar por WhatsApp
        </a>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/mapa" className="flex flex-1 items-center justify-center gap-2 rounded-md border border-line-strong bg-card px-5 py-3 font-medium">
          Ver el mapa <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <a href="/reportar" className="flex flex-1 items-center justify-center rounded-md border border-line-strong bg-card px-5 py-3 font-medium">
          Reportar otro bache
        </a>
      </div>
    </div>
  );
}
