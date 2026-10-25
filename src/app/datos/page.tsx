import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Datos abiertos",
  description: "Descarga los reportes, las capas geográficas y la API de Calle Justa. Datos abiertos para vecinos, prensa, academia y gobierno.",
};

const DESCARGAS = [
  {
    archivo: "/api/datos/reportes.csv",
    nombre: "Reportes con contexto y prioridad",
    formato: "CSV",
    icono: FileSpreadsheet,
    descripcion: "Un renglón por bache: ubicación, estado, fechas, colonia, marginación, calle, servicios cercanos y puntaje.",
    licencia: "CC BY 4.0",
  },
  {
    archivo: "/data/agebs.geojson",
    nombre: "AGEB urbanas de Navojoa",
    formato: "GeoJSON",
    icono: FileJson,
    descripcion: "128 AGEB con población (Censo 2020) y grado de marginación (CONAPO 2020).",
    licencia: "INEGI / CONAPO, con atribución",
  },
  {
    archivo: "/data/colonias.geojson",
    nombre: "Colonias",
    formato: "GeoJSON",
    icono: FileJson,
    descripcion: "73 colonias con nombre, código postal, población y grado de marginación.",
    licencia: "CONAPO, con atribución",
  },
  {
    archivo: "/data/calles.geojson",
    nombre: "Red de calles",
    formato: "GeoJSON",
    icono: FileJson,
    descripcion: "2,181 segmentos dentro de la mancha urbana con clase vial y superficie.",
    licencia: "© OpenStreetMap, ODbL 1.0",
  },
  {
    archivo: "/data/servicios.geojson",
    nombre: "Escuelas y unidades de salud",
    formato: "GeoJSON",
    icono: FileJson,
    descripcion: "130 escuelas y 22 unidades de salud públicas del DENUE.",
    licencia: "INEGI, con atribución",
  },
];

const API = [
  ["GET", "/api/reportes", "Todos los reportes con contexto y prioridad (JSON)"],
  ["GET", "/api/contexto?lat=27.07&lng=-109.44", "Calle, colonia, AGEB y servicios cercanos a un punto"],
  ["POST", "/api/reportes", "Crear un reporte: { lat, lng, severidad: 1-3, descripcion? }"],
  ["GET", "/api/datos/reportes.csv", "Los reportes en CSV"],
];

export default function DatosPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 px-4 py-12">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-ink-3">Datos abiertos</p>
        <h1 className="text-4xl font-semibold tracking-tight">Úsalos, revísalos, mejóralos</h1>
        <p className="text-lg text-ink-2">
          Todo lo que muestra Calle Justa se puede descargar. Si encuentras un error o haces un análisis con estos datos,
          cuéntanos en{" "}
          <a href={SITE.repo} className="font-medium text-ink underline underline-offset-2">
            GitHub
          </a>
          .
        </p>
      </header>

      <section aria-labelledby="descargas" className="space-y-4">
        <h2 id="descargas" className="text-2xl font-semibold tracking-tight">
          Descargas
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {DESCARGAS.map((d) => (
            <li key={d.archivo} className="flex flex-col rounded-2xl border border-line bg-card p-5">
              <div className="flex items-start gap-3">
                <d.icono className="mt-0.5 h-5 w-5 shrink-0 text-ink-2" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{d.nombre}</p>
                  <p className="text-xs text-ink-3">
                    {d.formato} · {d.licencia}
                  </p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-ink-2">{d.descripcion}</p>
              <a
                href={d.archivo}
                download
                className="mt-4 inline-flex items-center gap-2 self-start rounded-full border border-line-strong px-4 py-2 text-sm font-medium hover:bg-plane"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Descargar
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-2">
          Mientras recibimos los datos oficiales, los reportes incluyen un escenario simulado: cada renglón trae la columna{" "}
          <code className="rounded bg-plane px-1">simulado</code> para distinguirlo.
        </p>
      </section>

      <section aria-labelledby="api" className="space-y-4">
        <h2 id="api" className="text-2xl font-semibold tracking-tight">
          API
        </h2>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {API.map(([metodo, ruta, descripcion]) => (
                <tr key={ruta}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{metodo}</td>
                  <td className="px-4 py-3 font-mono text-xs">{ruta}</td>
                  <td className="px-4 py-3 text-ink-2">{descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="reproducir" className="space-y-4">
        <h2 id="reproducir" className="text-2xl font-semibold tracking-tight">
          Reproducir todo desde cero
        </h2>
        <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-sm text-surface">
          <code>{`git clone ${SITE.repo}
cd proyectoSocial/data
uv sync
uv run python -m pipeline   # descarga fuentes y regenera las capas`}</code>
        </pre>
      </section>
    </div>
  );
}
