"use client";

import { useState } from "react";
import type { NivelMarginacion } from "@/lib/domain";
import { COLOR_NIVEL, ETIQUETA_NIVEL } from "./colores";

export interface BarraNivel {
  nivel: NivelMarginacion;
  valor: number;
  /** The value already formatted for display (server components cannot pass formatters). */
  texto: string;
  /** Extra line shown on hover and focus, e.g. the sample size. */
  detalle: string;
}

/** Horizontal bars, one per marginalization level, value at the tip. */
export function BarrasNivel({ datos, maximo }: { datos: BarraNivel[]; maximo?: number }) {
  const [activo, setActivo] = useState<NivelMarginacion | null>(null);
  const tope = maximo ?? Math.max(...datos.map((d) => d.valor), 1);

  return (
    <ul className="space-y-4">
      {datos.map((d) => (
        <li
          key={d.nivel}
          tabIndex={0}
          onPointerEnter={() => setActivo(d.nivel)}
          onPointerLeave={() => setActivo(null)}
          onFocus={() => setActivo(d.nivel)}
          onBlur={() => setActivo(null)}
          className="group relative rounded-md outline-none"
          aria-label={`${ETIQUETA_NIVEL[d.nivel]}: ${d.texto}. ${d.detalle}`}
        >
          <div className="mb-1 flex items-center gap-2 text-sm text-ink-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_NIVEL[d.nivel] }} aria-hidden="true" />
            {ETIQUETA_NIVEL[d.nivel]}
          </div>
          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-6 flex-1">
              <div
                className="h-full rounded-r-[4px] transition-opacity"
                style={{
                  width: `${Math.max(0.5, (100 * d.valor) / tope)}%`,
                  background: COLOR_NIVEL[d.nivel],
                  opacity: activo && activo !== d.nivel ? 0.45 : 1,
                }}
              />
            </div>
            <span className="tabular w-16 shrink-0 text-right text-sm font-medium text-ink">{d.texto}</span>
          </div>
          {activo === d.nivel && (
            <div role="tooltip" className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-line bg-card px-3 py-2 text-xs shadow-lg">
              <p className="font-semibold text-ink">{d.texto}</p>
              <p className="text-ink-2">{d.detalle}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
