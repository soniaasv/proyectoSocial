"use client";

import type { FeatureCollection, Point } from "geojson";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { AvisoSimulado } from "@/components/aviso-simulado";
import { NivelBadge } from "@/components/prioridad";
import { useReportes } from "@/lib/client/use-reportes";
import { diasEntre, GRADO_ADJETIVO, gradoDe, NIVELES_MARGINACION } from "@/lib/domain";
import type { ReporteEnriquecido } from "@/lib/equity";
import { numero } from "@/lib/format";
import { NIVELES } from "@/lib/priority";
import { MARGINACION_HEX, PRIORIDAD_HEX, RADIO_NIVEL } from "./colores";
import { FichaReporte } from "./ficha-reporte";
import { MapaBase, type PuntoReporte } from "./mapa-base";

type FiltroEstado = "pendientes" | "reparados" | "todos";
const TOP = 15;

export function ExploradorMapa() {
  const resultado = useReportes();
  const [filtro, setFiltro] = useState<FiltroEstado>("pendientes");
  const [marginacion, setMarginacion] = useState(false);
  const [servicios, setServicios] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [enfocar, setEnfocar] = useState<{ lng: number; lat: number } | null>(null);

  const reportes = useMemo(() => (resultado.estado === "listo" ? resultado.datos.reportes : []), [resultado]);
  const visibles = useMemo(
    () =>
      reportes.filter((r) =>
        filtro === "todos" ? true : filtro === "reparados" ? r.estado === "reparado" : r.estado !== "reparado",
      ),
    [reportes, filtro],
  );
  const puntos = useMemo<FeatureCollection<Point, PuntoReporte>>(
    () => ({
      type: "FeatureCollection",
      features: visibles.map((r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [r.lng, r.lat] },
        properties: { id: r.id, nivel: r.prioridad.nivel, puntaje: r.prioridad.puntaje, reparado: r.estado === "reparado" },
      })),
    }),
    [visibles],
  );
  const pendientes = reportes.filter((r) => r.estado !== "reparado");
  const top = useMemo(
    () => [...pendientes].sort((a, b) => b.prioridad.puntaje - a.prioridad.puntaje).slice(0, TOP),
    [pendientes],
  );
  const actual = reportes.find((r) => r.id === seleccionado) ?? null;

  function seleccionar(r: ReporteEnriquecido) {
    setSeleccionado(r.id);
    setEnfocar({ lng: r.lng, lat: r.lat });
  }

  return (
    <div className="flex flex-1 flex-col md:h-[calc(100dvh-4rem)] md:flex-none md:flex-row md:overflow-hidden">
      <div className="relative h-[55dvh] md:order-2 md:h-full md:flex-1">
        <MapaBase
          puntos={puntos}
          seleccionado={seleccionado}
          onSeleccionar={setSeleccionado}
          mostrarMarginacion={marginacion}
          mostrarServicios={servicios}
          enfocar={enfocar}
        />
        <Leyenda marginacion={marginacion} reparados={filtro !== "pendientes"} servicios={servicios} />
        {resultado.estado === "cargando" && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
            <LoaderCircle className="h-8 w-8 animate-spin text-ink-2" aria-label="Cargando reportes" />
          </div>
        )}
      </div>

      <aside className="w-full border-line bg-surface md:order-1 md:h-full md:min-h-0 md:w-[400px] md:shrink-0 md:overflow-y-auto md:border-r">
        <div className="space-y-5 p-4 md:p-5">
          {actual ? (
            <FichaReporte reporte={actual} onCerrar={() => setSeleccionado(null)} />
          ) : (
            <>
              <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Mapa de baches</h1>
                {resultado.estado === "listo" && (
                  <p className="text-sm text-ink-2">
                    <span className="tabular">{numero.format(pendientes.length)}</span> pendientes ·{" "}
                    <span className="tabular">{numero.format(reportes.length - pendientes.length)}</span> reparados
                  </p>
                )}
              </header>

              {resultado.estado === "listo" && resultado.datos.incluyeSimulados && <AvisoSimulado compacto />}
              {resultado.estado === "error" && (
                <p role="alert" className="rounded-lg border border-line bg-brand-soft p-3 text-sm">
                  {resultado.mensaje}
                </p>
              )}

              <fieldset className="space-y-2">
                <legend className="text-xs font-medium uppercase tracking-wide text-ink-3">Mostrar</legend>
                <div className="grid grid-cols-3 rounded-lg border border-line bg-plane p-1 text-sm">
                  {(["pendientes", "reparados", "todos"] as const).map((f) => (
                    <label
                      key={f}
                      className="cursor-pointer rounded-md px-2 py-1.5 text-center capitalize has-[:checked]:bg-card has-[:checked]:font-medium has-[:checked]:shadow-sm"
                    >
                      <input type="radio" name="filtro" value={f} checked={filtro === f} onChange={() => setFiltro(f)} className="sr-only" />
                      {f}
                    </label>
                  ))}
                </div>
                <Interruptor checked={marginacion} onChange={setMarginacion} label="Marginación por zona (CONAPO)" />
                <Interruptor checked={servicios} onChange={setServicios} label="Escuelas y unidades de salud (DENUE)" />
              </fieldset>

              <section aria-labelledby="top-titulo" className="space-y-2">
                <h2 id="top-titulo" className="text-xs font-medium uppercase tracking-wide text-ink-3">
                  Prioridad esta semana
                </h2>
                <ol className="divide-y divide-line rounded-xl border border-line bg-card">
                  {top.map((r, i) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => seleccionar(r)}
                        className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-plane"
                      >
                        <span className="tabular mt-0.5 w-5 shrink-0 text-sm text-ink-3">{i + 1}</span>
                        <span className="min-w-0 flex-1 space-y-1.5">
                          <span className="block truncate text-sm font-medium">{r.contexto.calle?.nombre ?? "Calle sin nombre"}</span>
                          <span className="block truncate text-xs text-ink-2">
                            {zona(r)} · {diasEntre(r.creadoEn, new Date())} días esperando
                          </span>
                          <NivelBadge nivel={r.prioridad.nivel} puntaje={r.prioridad.puntaje} />
                        </span>
                      </button>
                    </li>
                  ))}
                  {resultado.estado === "listo" && top.length === 0 && (
                    <li className="px-3 py-6 text-center text-sm text-ink-2">No hay baches pendientes.</li>
                  )}
                </ol>
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

/** Colonia name when known, otherwise the zone's marginalization. */
function zona(r: ReporteEnriquecido): string {
  if (r.contexto.colonia) return `Col. ${r.contexto.colonia.nombre}`;
  const grado = gradoDe(r.contexto);
  return grado ? `Zona de marginación ${GRADO_ADJETIVO[grado]}` : "Zona sin colonia registrada";
}

function Interruptor({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm">
      {label}
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-line-strong transition before:block before:h-4 before:w-4 before:translate-x-0.5 before:rounded-full before:bg-white before:shadow before:transition checked:bg-brand checked:before:translate-x-[18px]"
      />
    </label>
  );
}

function Leyenda({ marginacion, reparados, servicios }: { marginacion: boolean; reparados: boolean; servicios: boolean }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-4.5rem)] space-y-2 rounded-xl border border-black/10 bg-white/95 p-3 text-xs text-[#0b0b0b] shadow-sm md:bottom-3 md:top-auto">
      <p className="font-medium">Prioridad</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {NIVELES.toReversed().map(({ nombre }) => (
          <li key={nombre} className="flex items-center gap-1.5">
            <span
              className="rounded-full border border-white"
              style={{ background: PRIORIDAD_HEX[nombre], width: RADIO_NIVEL[nombre] * 2, height: RADIO_NIVEL[nombre] * 2 }}
            />
            {nombre}
          </li>
        ))}
        {reparados && (
          <li className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border-[1.5px] border-[#52514e] bg-white" /> Reparado
          </li>
        )}
      </ul>
      {servicios && (
        <p className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#52514e]" /> Escuela
          <span className="ml-2 h-2 w-2 rounded-full bg-[#0b0b0b]" /> Salud
        </p>
      )}
      {marginacion && (
        <>
          <p className="font-medium">Marginación</p>
          <ul className="flex gap-3">
            {NIVELES_MARGINACION.map((n) => (
              <li key={n} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: MARGINACION_HEX[n] }} />
                {n}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
