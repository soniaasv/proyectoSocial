import { FlaskConical } from "lucide-react";
import Link from "next/link";

/** Shown wherever simulated data appears, so nobody mistakes it for real Navojoa data. */
export function AvisoSimulado({ compacto = false }: { compacto?: boolean }) {
  if (compacto) {
    return (
      <p className="flex items-start gap-2 rounded-lg border border-line bg-plane px-3 py-2 text-xs text-ink-2">
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          <strong className="text-ink">Escenario simulado.</strong> Los reportes son de demostración hasta que los vecinos
          empiecen a reportar. <Link href="/metodologia#simulacion" className="underline underline-offset-2">Por qué</Link>
        </span>
      </p>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-plane p-4 text-sm text-ink-2">
      <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
      <p>
        <strong className="text-ink">Estos resultados vienen de un escenario simulado, no de datos reales de Navojoa.</strong>{" "}
        Las calles, escuelas, población y marginación sí son reales (INEGI, CONAPO, OpenStreetMap). Los reportes de baches
        son de demostración hasta que los vecinos de Navojoa empiecen a reportar en la plataforma. Sirven para mostrar
        cómo funciona el método.{" "}
        <Link href="/metodologia#simulacion" className="font-medium text-ink underline underline-offset-2">
          Cómo se simularon
        </Link>
      </p>
    </div>
  );
}
