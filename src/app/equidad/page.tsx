import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AvisoSimulado } from "@/components/aviso-simulado";
import { BarrasApiladas } from "@/components/graficas/barras-apiladas";
import { BarrasNivel } from "@/components/graficas/barras-nivel";
import { ETIQUETA_NIVEL } from "@/components/graficas/colores";
import { CurvasEspera } from "@/components/graficas/curvas-espera";
import { contrafactual, curvaPorDia, indicadoresPorNivel, type IndicadoresNivel } from "@/lib/equity";
import { decimal, numero } from "@/lib/format";
import { obtenerCapas } from "@/server/capas";
import { obtenerReportes } from "@/server/reportes";

export const metadata: Metadata = {
  title: "¿Quién espera más?",
  description: "Tablero de equidad: quién reporta, cuánto tarda la reparación y qué cambiaría con un índice de prioridad justo.",
};

/** Repairs a typical week of crews could do; used for the counterfactual. */
const CAPACIDAD_SEMANAL = 60;
const DIAS_CURVA = 151;

export default function EquidadPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 px-4 py-12">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-ink-3">Tablero de equidad</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance">¿Quién espera más a que reparen su calle?</h1>
        <p className="text-lg text-ink-2">
          Comparamos las zonas de Navojoa según su grado de marginación (CONAPO 2020) para responder tres preguntas:
          quién reporta, cuánto se tarda la reparación y qué cambiaría si se priorizara con un índice justo.
        </p>
      </header>
      <Suspense fallback={<p className="text-ink-2">Calculando indicadores…</p>}>
        <Tablero />
      </Suspense>
    </div>
  );
}

async function Tablero() {
  await connection();
  const ahora = new Date();
  const { reportes, incluyeSimulados } = await obtenerReportes(ahora);
  const indicadores = indicadoresPorNivel(reportes, obtenerCapas().agebs, ahora);
  const cf = contrafactual(reportes, CAPACIDAD_SEMANAL);
  const porNivel = Object.fromEntries(indicadores.map((i) => [i.nivel, i])) as Record<IndicadoresNivel["nivel"], IndicadoresNivel>;
  const { Baja: baja, Alta: alta } = porNivel;
  const dias = (m: number | null) => (m === null ? "más de 150" : numero.format(m));
  const porcentaje = (v: number | null) => (v === null ? "s/d" : `${Math.round(v)}%`);

  return (
    <div className="space-y-12">
      {incluyeSimulados && <AvisoSimulado />}

      <section aria-labelledby="hallazgo" className="grid border-y border-line md:grid-cols-3">
        <h2 id="hallazgo" className="sr-only">
          Hallazgos principales
        </h2>
        <Hallazgo
          valor={`${dias(alta.supervivencia.mediana)} días`}
          texto={`tarda en repararse la mitad de los baches en zonas de marginación alta, contra ${dias(baja.supervivencia.mediana)} días en zonas de marginación baja.`}
        />
        <Hallazgo
          valor={`${porcentaje(baja.tasaReporte)} vs ${porcentaje(alta.tasaReporte)}`}
          texto="de los baches encontrados en recorridos ya los había reportado algún vecino, en zonas de marginación baja frente a alta."
        />
        <Hallazgo
          valor={`${Math.round(cf.porQuejas.pctAltaMarginacion)}% → ${Math.round(cf.porIndice.pctAltaMarginacion)}%`}
          texto={`de las reparaciones de una semana irían a zonas de marginación alta, si se pasara de priorizar por quejas a priorizar con el índice.`}
        />
      </section>

      <Seccion
        id="reporta"
        titulo="1. ¿Quién reporta?"
        descripcion="Recorremos calles elegidas al azar y anotamos todos los baches, los haya reportado alguien o no. Así sabemos qué parte del daño real llega a oídos del gobierno en cada zona, sin depender de cuánta gente vive ahí ni de cuánto daño hay."
      >
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-medium">De cada 100 baches encontrados en recorridos, cuántos había reportado algún vecino</h3>
            <BarrasNivel
              maximo={100}
              datos={indicadores.map((i) => ({
                nivel: i.nivel,
                valor: i.tasaReporte ?? 0,
                texto: porcentaje(i.tasaReporte),
                detalle: `${numero.format(i.verificados)} baches encontrados en recorridos`,
              }))}
            />
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium">Del total de baches conocidos, cuántos solo aparecieron en un recorrido</h3>
            <BarrasNivel
              maximo={100}
              datos={indicadores.map((i) => ({
                nivel: i.nivel,
                valor: i.pctSoloRecorrido,
                texto: `${Math.round(i.pctSoloRecorrido)}%`,
                detalle: `de ${numero.format(i.baches)} baches, solo los encontró un recorrido de campo`,
              }))}
            />
          </div>
        </div>
      </Seccion>

      <Seccion
        id="espera"
        titulo="2. ¿Quién espera más?"
        descripcion="Porcentaje de baches que siguen sin reparar según los días desde el reporte (estimador de Kaplan-Meier: cuenta también los que siguen pendientes, en vez de ignorarlos). Una curva más alta significa más espera."
      >
        <CurvasEspera
          curvas={indicadores.map((i) => ({
            nivel: i.nivel,
            pendientePorDia: curvaPorDia(i.supervivencia, DIAS_CURVA),
            mediana: i.supervivencia.mediana,
          }))}
        />
      </Seccion>

      <Seccion
        id="indice"
        titulo="3. ¿Qué cambiaría con el índice?"
        descripcion={`Si las cuadrillas reparan ${CAPACIDAD_SEMANAL} baches esta semana, ¿a qué zonas irían? Comparamos el criterio actual (más quejas primero) con el índice de prioridad de Calle Justa, sobre los mismos baches pendientes.`}
      >
        <BarrasApiladas
          filas={[
            { etiqueta: "Priorizando por número de quejas", conteos: cf.porQuejas.porNivel },
            { etiqueta: "Priorizando con el índice Calle Justa", conteos: cf.porIndice.porNivel },
          ]}
        />
        <p className="mt-4 text-sm text-ink-2">
          Puntaje promedio de los baches elegidos: {Math.round(cf.porQuejas.puntajePromedio)} con quejas y{" "}
          {Math.round(cf.porIndice.puntajePromedio)} con el índice. El índice no solo es más equitativo: también atiende
          baches más graves, en calles más transitadas y cerca de escuelas y clínicas.
        </p>
      </Seccion>

      <Seccion id="tabla" titulo="Todos los indicadores" descripcion="La misma información de las gráficas, en tabla.">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-plane text-left text-xs text-ink-3">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Nivel de marginación</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Habitantes</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Baches</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Tasa de reporte</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Quejas / 1,000 hab.</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Solo por recorrido</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Reparados</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Mediana de espera</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Parches que fallaron</th>
              </tr>
            </thead>
            <tbody className="tabular divide-y divide-line">
              {indicadores.map((i) => (
                <tr key={i.nivel}>
                  <th scope="row" className="px-4 py-3 text-left font-medium">{ETIQUETA_NIVEL[i.nivel]}</th>
                  <td className="px-4 py-3 text-right">{numero.format(i.poblacion)}</td>
                  <td className="px-4 py-3 text-right">{numero.format(i.baches)}</td>
                  <td className="px-4 py-3 text-right">
                    {porcentaje(i.tasaReporte)} <span className="text-ink-3">(n={i.verificados})</span>
                  </td>
                  <td className="px-4 py-3 text-right">{decimal.format(i.quejasPorMil)}</td>
                  <td className="px-4 py-3 text-right">{Math.round(i.pctSoloRecorrido)}%</td>
                  <td className="px-4 py-3 text-right">{Math.round(i.pctReparados)}%</td>
                  <td className="px-4 py-3 text-right">{dias(i.supervivencia.mediana)} días</td>
                  <td className="px-4 py-3 text-right">{Math.round(i.pctReabiertos)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-3">
          Población de las AGEB urbanas (Censo 2020); 2.4% de la ciudad vive en zonas de marginación alta, por lo que ese
          grupo tiene pocos baches y sus cifras son más inciertas. Las quejas por habitante se muestran solo como
          referencia: mezclan cuánta voz tiene una zona con cuánto daño y cuánta calle por persona tiene, por eso la
          tasa de reporte se mide con recorridos. Ver{" "}
          <Link href="/metodologia" className="underline underline-offset-2">metodología</Link>.
        </p>
      </Seccion>
    </div>
  );
}

function Hallazgo({ valor, texto }: { valor: string; texto: string }) {
  return (
    <div className="border-line py-6 not-first-of-type:border-t md:px-6 md:first-of-type:pl-0 md:last-of-type:pr-0 md:not-first-of-type:border-t-0 md:not-first-of-type:border-l">
      <p className="whitespace-nowrap text-4xl font-semibold tracking-[-0.03em]">{valor}</p>
      <p className="mt-3 text-sm text-ink-2">{texto}</p>
    </div>
  );
}

function Seccion({ id, titulo, descripcion, children }: { id: string; titulo: string; descripcion: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-6 border-t border-line pt-10">
      <div className="max-w-3xl space-y-2">
        <h2 id={id} className="text-2xl font-semibold tracking-tight">
          {titulo}
        </h2>
        <p className="text-ink-2">{descripcion}</p>
      </div>
      {children}
    </section>
  );
}
