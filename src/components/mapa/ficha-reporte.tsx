"use client";

import { ArrowLeft, MessageCircle } from "lucide-react";
import { DesglosePrioridad, NivelBadge } from "@/components/prioridad";
import { ESTADO_LABEL, GRADO_ADJETIVO, gradoDe, SEVERIDAD_LABEL } from "@/lib/domain";
import type { ReporteEnriquecido } from "@/lib/equity";
import { enlaceWhatsApp, fecha, hace } from "@/lib/format";

export function FichaReporte({ reporte, onCerrar }: { reporte: ReporteEnriquecido; onCerrar: () => void }) {
  const { contexto } = reporte;
  const grado = gradoDe(contexto);
  const reparado = reporte.estado === "reparado";

  return (
    <article className="space-y-5" aria-labelledby="ficha-titulo">
      <button type="button" onClick={onCerrar} className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a la lista
      </button>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {reparado ? (
            <span className="rounded-full bg-good-soft px-2.5 py-0.5 text-xs font-medium text-good">✓ Reparado</span>
          ) : (
            <NivelBadge nivel={reporte.prioridad.nivel} puntaje={reporte.prioridad.puntaje} />
          )}
          {reporte.simulado && <span className="rounded-full bg-plane px-2.5 py-0.5 text-xs text-ink-3">Simulado</span>}
          {reporte.reabierto && (
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">Reabierto</span>
          )}
        </div>
        <h2 id="ficha-titulo" className="text-xl font-semibold tracking-tight">
          {contexto.calle?.nombre ?? "Calle sin nombre"}
        </h2>
        <p className="text-sm text-ink-2">
          {contexto.colonia ? `Colonia ${contexto.colonia.nombre}` : "Fuera de las colonias de CONAPO"}
          {grado && ` · marginación ${GRADO_ADJETIVO[grado]}`}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Dato termino="Estado" valor={ESTADO_LABEL[reporte.estado]} />
        <Dato termino="Severidad" valor={SEVERIDAD_LABEL[reporte.severidad]} />
        <Dato termino="Reportado" valor={`${fecha(reporte.creadoEn)} (${hace(reporte.creadoEn)})`} />
        <Dato
          termino="Quién lo encontró"
          valor={reporte.fuente === "recorrido" ? "Recorrido de campo (nadie lo había reportado)" : `${reporte.apoyos} ${reporte.apoyos === 1 ? "vecino" : "vecinos"}`}
        />
        {reporte.reparadoEn && <Dato termino="Reparado" valor={fecha(reporte.reparadoEn)} />}
        {contexto.servicios.masCercano && (
          <Dato
            termino="Cerca de"
            valor={`${contexto.servicios.masCercano.nombre} (${contexto.servicios.masCercano.distanciaM} m)`}
          />
        )}
      </dl>

      <section className="rounded-xl border border-line bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">¿Por qué esta prioridad?</h3>
        <DesglosePrioridad prioridad={reporte.prioridad} />
      </section>

      {!reparado && (
        <a
          href={enlaceWhatsApp(reporte)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-card px-4 py-2.5 text-sm font-medium hover:bg-plane"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Enviar al WhatsApp del Ayuntamiento
        </a>
      )}
    </article>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{termino}</dt>
      <dd className="mt-0.5">{valor}</dd>
    </div>
  );
}
