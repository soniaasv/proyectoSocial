import type { Metadata } from "next";
import { TablaPanel } from "@/components/panel/tabla-panel";

export const metadata: Metadata = {
  title: "Panel de prioridades",
  description: "Lista de baches ordenada por el índice de prioridad, con filtros y exportación a CSV para planear el bacheo.",
};

export default function PanelPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-ink-3">Para el Ayuntamiento y las cuadrillas</p>
        <h1 className="text-4xl font-semibold tracking-tight">Panel de prioridades</h1>
        <p className="text-lg text-ink-2">
          Todos los baches abiertos, del más al menos prioritario, con la razón principal de su lugar en la lista. Se puede
          filtrar, buscar por calle o colonia y exportar a Excel para planear la semana.
        </p>
      </header>
      <TablaPanel />
    </div>
  );
}
