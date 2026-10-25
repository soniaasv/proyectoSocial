import type { Metadata } from "next";
import { FormularioReporte } from "@/components/reporte/formulario-reporte";

export const metadata: Metadata = {
  title: "Reportar un bache",
  description: "Reporta un bache en Navojoa en 30 segundos: foto, ubicación y gravedad. La foto se analiza en tu celular.",
};

export default function ReportarPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Reportar un bache</h1>
        <p className="text-ink-2">
          Toma menos de un minuto. No necesitas cuenta y no pedimos datos personales.
        </p>
      </header>
      <FormularioReporte />
    </div>
  );
}
