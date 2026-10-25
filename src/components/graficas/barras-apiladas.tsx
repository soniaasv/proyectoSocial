"use client";

import { useState } from "react";
import { NIVELES_MARGINACION, type NivelMarginacion } from "@/lib/domain";
import { COLOR_NIVEL, ETIQUETA_NIVEL, TEXTO_EN_NIVEL } from "./colores";

export interface FilaApilada {
  etiqueta: string;
  conteos: Record<NivelMarginacion, number>;
}

/** 100% stacked bars comparing how two rules split the same capacity across levels. */
export function BarrasApiladas({ filas }: { filas: FilaApilada[] }) {
  const [activo, setActivo] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {filas.map((fila) => {
        const total = NIVELES_MARGINACION.reduce((s, n) => s + fila.conteos[n], 0) || 1;
        return (
          <div key={fila.etiqueta}>
            <p className="mb-1.5 text-sm font-medium">{fila.etiqueta}</p>
            <div className="relative flex h-8 gap-[2px]">
              {NIVELES_MARGINACION.filter((n) => fila.conteos[n] > 0).map((n) => {
                const share = fila.conteos[n] / total;
                const clave = `${fila.etiqueta}-${n}`;
                return (
                  <div
                    key={n}
                    tabIndex={0}
                    onPointerEnter={() => setActivo(clave)}
                    onPointerLeave={() => setActivo(null)}
                    onFocus={() => setActivo(clave)}
                    onBlur={() => setActivo(null)}
                    aria-label={`${fila.etiqueta}, ${ETIQUETA_NIVEL[n]}: ${fila.conteos[n]} baches (${Math.round(share * 100)}%)`}
                    className="relative flex items-center justify-center text-xs font-medium outline-none first:rounded-l-[4px] last:rounded-r-[4px]"
                    style={{
                      flexGrow: share,
                      flexBasis: 0,
                      background: COLOR_NIVEL[n],
                      color: TEXTO_EN_NIVEL[n],
                      opacity: activo && activo !== clave ? 0.55 : 1,
                    }}
                  >
                    {/* Inline label only when the segment is wide enough to hold it. */}
                    {share >= 0.12 && <span className="tabular">{Math.round(share * 100)}%</span>}
                    {activo === clave && (
                      <div role="tooltip" className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-card px-3 py-2 text-xs text-ink shadow-lg">
                        <p className="tabular font-semibold">
                          {fila.conteos[n]} baches · {Math.round(share * 100)}%
                        </p>
                        <p className="text-ink-2">{ETIQUETA_NIVEL[n]}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2" aria-label="Leyenda">
        {NIVELES_MARGINACION.map((n) => (
          <li key={n} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_NIVEL[n] }} aria-hidden="true" />
            {ETIQUETA_NIVEL[n]}
          </li>
        ))}
      </ul>
    </div>
  );
}
