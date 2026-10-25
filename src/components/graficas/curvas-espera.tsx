"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { NivelMarginacion } from "@/lib/domain";
import { COLOR_NIVEL, ETIQUETA_NIVEL } from "./colores";

export interface CurvaNivel {
  nivel: NivelMarginacion;
  /** Share still pending (0-1) for each day 0..N. */
  pendientePorDia: number[];
  mediana: number | null;
}

const ANCHO = 640;
const ALTO = 300;
const M = { arriba: 16, derecha: 104, abajo: 36, izquierda: 44 };
const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Kaplan-Meier curves: share of potholes still unrepaired after N days, by level. */
export function CurvasEspera({ curvas }: { curvas: CurvaNivel[] }) {
  const svg = useRef<SVGSVGElement>(null);
  const [dia, setDia] = useState<number | null>(null);
  const dias = curvas[0]?.pendientePorDia.length ?? 1;
  const x = (d: number) => M.izquierda + (d / (dias - 1)) * (ANCHO - M.izquierda - M.derecha);
  const y = (v: number) => M.arriba + (1 - v) * (ALTO - M.arriba - M.abajo);
  const ticksX = [0, 30, 60, 90, 120, dias - 1].filter((d, i, a) => d < dias && a.indexOf(d) === i);

  function ruta(valores: number[]) {
    // Step function: Kaplan-Meier only changes on days with repairs.
    return valores.map((v, d) => (d === 0 ? `M${x(0)},${y(v)}` : `H${x(d)}V${y(v)}`)).join("");
  }

  function mover(e: PointerEvent<SVGSVGElement>) {
    const rect = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * ANCHO;
    const d = Math.round(((px - M.izquierda) / (ANCHO - M.izquierda - M.derecha)) * (dias - 1));
    setDia(Math.min(dias - 1, Math.max(0, d)));
  }

  // End labels sorted by their final value, nudged apart only if they would overlap.
  const finales = curvas
    .map((c) => ({ nivel: c.nivel, y: y(c.pendientePorDia.at(-1)!) }))
    .sort((a, b) => a.y - b.y)
    .map((f, i, arr) => ({ ...f, y: i > 0 ? Math.max(f.y, arr[i - 1].y + 14) : f.y }));

  return (
    <div className="relative">
      <svg
        ref={svg}
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full touch-none"
        role="img"
        aria-label="Porcentaje de baches que siguen sin reparar según los días transcurridos, por nivel de marginación. Los valores están en la tabla de abajo."
        onPointerMove={mover}
        onPointerLeave={() => setDia(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(v)} y2={y(v)} stroke="var(--grid)" strokeWidth="1" />
            <text x={M.izquierda - 8} y={y(v)} dy="0.32em" textAnchor="end" className="tabular fill-ink-3 text-[11px]">
              {pct(v)}
            </text>
          </g>
        ))}
        <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(0)} y2={y(0)} stroke="var(--axis)" strokeWidth="1" />
        {ticksX.map((d) => (
          <text key={d} x={x(d)} y={ALTO - M.abajo + 18} textAnchor="middle" className="tabular fill-ink-3 text-[11px]">
            {d}
          </text>
        ))}
        <text x={(M.izquierda + ANCHO - M.derecha) / 2} y={ALTO - 4} textAnchor="middle" className="fill-ink-3 text-[11px]">
          días desde el reporte
        </text>

        {curvas.map((c) => (
          <path
            key={c.nivel}
            d={ruta(c.pendientePorDia)}
            fill="none"
            stroke={COLOR_NIVEL[c.nivel]}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {finales.map((f) => (
          <text key={f.nivel} x={ANCHO - M.derecha + 8} y={f.y} dy="0.32em" className="fill-ink-2 text-[11px]">
            {ETIQUETA_NIVEL[f.nivel].replace("Marginación ", "")}
          </text>
        ))}

        {dia !== null && (
          <g>
            <line x1={x(dia)} x2={x(dia)} y1={M.arriba} y2={ALTO - M.abajo} stroke="var(--ink-3)" strokeWidth="1" />
            {curvas.map((c) => (
              <circle
                key={c.nivel}
                cx={x(dia)}
                cy={y(c.pendientePorDia[dia])}
                r="4"
                fill={COLOR_NIVEL[c.nivel]}
                stroke="var(--surface)"
                strokeWidth="2"
              />
            ))}
          </g>
        )}
      </svg>

      {dia !== null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-2 rounded-lg border border-line bg-card px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(x(dia) / ANCHO) * 100}%`, transform: dia > dias / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
        >
          <p className="mb-1 text-ink-3">A los {dia} días siguen sin reparar</p>
          {curvas.map((c) => (
            <p key={c.nivel} className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full" style={{ background: COLOR_NIVEL[c.nivel] }} />
              <span className="tabular font-semibold text-ink">{pct(c.pendientePorDia[dia])}</span>
              <span className="text-ink-2">{ETIQUETA_NIVEL[c.nivel].toLowerCase()}</span>
            </p>
          ))}
        </div>
      )}

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2" aria-label="Leyenda">
        {curvas.map((c) => (
          <li key={c.nivel} className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full" style={{ background: COLOR_NIVEL[c.nivel] }} aria-hidden="true" />
            {ETIQUETA_NIVEL[c.nivel]}
          </li>
        ))}
      </ul>
    </div>
  );
}
