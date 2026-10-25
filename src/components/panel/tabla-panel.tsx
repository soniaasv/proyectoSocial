"use client";

import { Download, LoaderCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AvisoSimulado } from "@/components/aviso-simulado";
import { NivelBadge } from "@/components/prioridad";
import { useReportes } from "@/lib/client/use-reportes";
import { diasEntre, ESTADO_LABEL, ESTADOS, GRADO_ADJETIVO, gradoDe, SEVERIDAD_LABEL, type Estado } from "@/lib/domain";
import type { ReporteEnriquecido } from "@/lib/equity";
import { numero } from "@/lib/format";
import { NIVELES, type Nivel } from "@/lib/priority";

const POR_PAGINA = 50;
const TOKEN_KEY = "calle-justa:token-operador";

export function TablaPanel() {
  const resultado = useReportes();
  const [estado, setEstado] = useState<Estado | "abiertos">("abiertos");
  const [nivel, setNivel] = useState<Nivel | "todos">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [cambios, setCambios] = useState<Record<string, Estado>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  const datos = resultado.estado === "listo" ? resultado.datos : null;
  const filas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (datos?.reportes ?? [])
      .map((r) => (cambios[r.id] ? { ...r, estado: cambios[r.id] } : r))
      .filter((r) => (estado === "abiertos" ? r.estado !== "reparado" : r.estado === estado))
      .filter((r) => nivel === "todos" || r.prioridad.nivel === nivel)
      .filter(
        (r) =>
          !texto ||
          r.contexto.calle?.nombre?.toLowerCase().includes(texto) ||
          r.contexto.colonia?.nombre.toLowerCase().includes(texto) ||
          r.id.toLowerCase().includes(texto),
      )
      .sort((a, b) => b.prioridad.puntaje - a.prioridad.puntaje);
  }, [datos, cambios, estado, nivel, busqueda]);
  const visibles = filas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));

  async function cambiarEstado(r: ReporteEnriquecido, nuevo: Estado) {
    setMensaje(null);
    if (datos?.modo !== "postgres" || r.simulado) {
      setMensaje("Los cambios de estado se guardan solo cuando la plataforma está conectada a su base de datos y el reporte es real.");
      return;
    }
    let token = sessionStorage.getItem(TOKEN_KEY);
    token ??= window.prompt("Token de operador del Ayuntamiento");
    if (!token) return;
    const res = await fetch(`/api/reportes/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado: nuevo }),
    });
    if (res.ok) {
      sessionStorage.setItem(TOKEN_KEY, token);
      setCambios((c) => ({ ...c, [r.id]: nuevo }));
    } else {
      if (res.status === 401) sessionStorage.removeItem(TOKEN_KEY);
      setMensaje((await res.json().catch(() => null))?.error ?? "No se pudo actualizar el reporte.");
    }
  }

  return (
    <div className="space-y-6">
      {datos?.incluyeSimulados && <AvisoSimulado compacto />}

      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block text-xs text-ink-3">Estado</span>
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as Estado | "abiertos");
              setPagina(0);
            }}
            className="rounded-lg border border-line-strong bg-card px-3 py-2"
          >
            <option value="abiertos">Abiertos (pendientes y en proceso)</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {ESTADO_LABEL[e]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block text-xs text-ink-3">Prioridad</span>
          <select
            value={nivel}
            onChange={(e) => {
              setNivel(e.target.value as Nivel | "todos");
              setPagina(0);
            }}
            className="rounded-lg border border-line-strong bg-card px-3 py-2"
          >
            <option value="todos">Todas</option>
            {NIVELES.map((n) => (
              <option key={n.nombre} value={n.nombre}>
                {n.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-56 flex-1 space-y-1 text-sm">
          <span className="block text-xs text-ink-3">Buscar calle, colonia o folio</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(0);
              }}
              className="w-full rounded-lg border border-line-strong bg-card py-2 pl-9 pr-3"
            />
          </span>
        </label>
        <a
          href="/api/datos/reportes.csv"
          className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-card px-3 py-2 text-sm font-medium hover:bg-plane"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
        </a>
      </div>

      {mensaje && (
        <p role="status" className="rounded-lg border border-line bg-plane p-3 text-sm text-ink-2">
          {mensaje}
        </p>
      )}

      {resultado.estado === "cargando" && (
        <p className="flex items-center gap-2 text-ink-2">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando reportes…
        </p>
      )}
      {resultado.estado === "error" && <p role="alert">{resultado.mensaje}</p>}

      {datos && (
        <>
          <p className="text-sm text-ink-2" aria-live="polite">
            {numero.format(filas.length)} reportes, ordenados de mayor a menor prioridad
          </p>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-plane text-left text-xs text-ink-3">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">#</th>
                  <th scope="col" className="px-3 py-3 font-medium">Prioridad</th>
                  <th scope="col" className="px-3 py-3 font-medium">Ubicación</th>
                  <th scope="col" className="px-3 py-3 font-medium">Por qué</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Días</th>
                  <th scope="col" className="px-3 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibles.map((r, i) => {
                  const grado = gradoDe(r.contexto);
                  const principales = r.prioridad.factores
                    .filter((f) => f.factor !== "severidad")
                    .sort((a, b) => b.puntos / b.maximo - a.puntos / a.maximo)
                    .slice(0, 2);
                  return (
                    <tr key={r.id} className="align-top">
                      <td className="tabular px-3 py-3 text-ink-3">{pagina * POR_PAGINA + i + 1}</td>
                      <td className="px-3 py-3">
                        <NivelBadge nivel={r.prioridad.nivel} puntaje={r.prioridad.puntaje} />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{r.contexto.calle?.nombre ?? "Calle sin nombre"}</p>
                        <p className="text-xs text-ink-2">
                          {r.contexto.colonia ? `Col. ${r.contexto.colonia.nombre}` : grado ? `Marginación ${GRADO_ADJETIVO[grado]}` : "—"} ·{" "}
                          <a
                            href={`https://maps.google.com/?q=${r.lat},${r.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2"
                          >
                            {r.id}
                          </a>
                          {r.simulado && " · simulado"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-ink-2">
                        {SEVERIDAD_LABEL[r.severidad]}. {principales.map((f) => f.explicacion).join(". ")}.
                      </td>
                      <td className="tabular px-3 py-3 text-right">{diasEntre(r.creadoEn, r.reparadoEn ?? new Date())}</td>
                      <td className="px-3 py-3">
                        <select
                          aria-label={`Estado de ${r.id}`}
                          value={r.estado}
                          onChange={(e) => cambiarEstado(r, e.target.value as Estado)}
                          className="rounded-md border border-line-strong bg-card px-2 py-1"
                        >
                          {ESTADOS.map((e) => (
                            <option key={e} value={e}>
                              {ESTADO_LABEL[e]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav aria-label="Páginas" className="flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={pagina === 0}
              onClick={() => setPagina((p) => p - 1)}
              className="rounded-lg border border-line-strong px-3 py-1.5 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="tabular text-ink-2">
              Página {pagina + 1} de {paginas}
            </span>
            <button
              type="button"
              disabled={pagina + 1 >= paginas}
              onClick={() => setPagina((p) => p + 1)}
              className="rounded-lg border border-line-strong px-3 py-1.5 disabled:opacity-40"
            >
              Siguiente
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
