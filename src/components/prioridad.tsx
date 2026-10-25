import { FACTOR_LABEL, type Nivel, type Prioridad } from "@/lib/priority";

export const NIVEL_COLOR: Record<Nivel, string> = {
  Baja: "var(--prio-1)",
  Media: "var(--prio-2)",
  Alta: "var(--prio-3)",
  Urgente: "var(--prio-4)",
};

/** Priority level: a swatch beside the label, so the level never relies on color alone. */
export function NivelBadge({ nivel, puntaje }: { nivel: Nivel; puntaje?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-0.5 text-xs font-medium text-ink">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: NIVEL_COLOR[nivel] }} aria-hidden="true" />
      Prioridad {nivel.toLowerCase()}
      {puntaje !== undefined && <span className="tabular text-ink-3">· {puntaje}</span>}
    </span>
  );
}

/** Factor-by-factor breakdown of the index: what adds up to the score and why. */
export function DesglosePrioridad({ prioridad }: { prioridad: Prioridad }) {
  return (
    <dl className="space-y-3">
      {prioridad.factores.map((f) => (
        <div key={f.factor}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="font-medium">{FACTOR_LABEL[f.factor]}</dt>
            <dd className="tabular shrink-0 text-ink-2">
              {Math.round(f.puntos)} / {f.maximo}
            </dd>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-plane" aria-hidden="true">
            <div className="h-full rounded-full bg-prio-3" style={{ width: `${(100 * f.puntos) / f.maximo}%` }} />
          </div>
          <p className="mt-1 text-xs text-ink-2">{f.explicacion}</p>
        </div>
      ))}
    </dl>
  );
}
