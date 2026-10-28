import { ArrowRight, Camera, ChartColumn, Scale } from "lucide-react";
import Link from "next/link";
import { SEVERIDAD_LABEL } from "@/lib/domain";
import { FACTOR_LABEL, PESOS, type Factor } from "@/lib/priority";
import { construirMapaEstatico } from "@/server/mapa-estatico";
import { CIFRAS, SITE } from "@/lib/site";

const PASOS = [
  {
    icono: Camera,
    titulo: "Reporta en 30 segundos",
    texto:
      "Una foto y tu ubicación. Un modelo de inteligencia artificial revisa la foto en tu propio celular, sin subirla a ningún servidor, para ayudarte a confirmar que es un bache.",
  },
  {
    icono: Scale,
    titulo: "Priorizamos con justicia",
    texto:
      "Cada bache recibe un puntaje de 0 a 100 según su gravedad, el tráfico de la calle, las escuelas y clínicas cercanas, el rezago de la zona y el tiempo que lleva esperando. Siempre explicamos por qué.",
  },
  {
    icono: ChartColumn,
    titulo: "Transparentamos",
    texto:
      "Medimos quién espera más para que reparen su calle y publicamos todo como datos abiertos, para que vecinos, prensa y Ayuntamiento tomen mejores decisiones.",
  },
];

const ODS = [
  { numero: 11, nombre: "Ciudades y comunidades sostenibles" },
  { numero: 10, nombre: "Reducción de las desigualdades" },
  { numero: 9, nombre: "Industria, innovación e infraestructura" },
  { numero: 16, nombre: "Paz, justicia e instituciones sólidas" },
  { numero: 3, nombre: "Salud y bienestar" },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-plane">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1fr_1.1fr] md:items-center md:py-24">
          <div className="space-y-6">
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.1em] text-ink-3 sm:tracking-[0.14em]">
              <span className="hidden h-px w-8 bg-line-strong sm:block" aria-hidden="true" />
              Observatorio ciudadano · Navojoa, Sonora
            </p>
            <h1 className="text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.035em] text-balance md:text-7xl">
              19,208 baches. <span className="text-ink-3">¿Quién espera más?</span>
            </h1>
            <p className="max-w-xl text-lg text-ink-2 text-pretty">
              Calle Justa mide si las calles de Navojoa se reparan donde más se necesita, y no solo donde más se queja
              la gente. Con datos públicos, un índice que cualquiera puede entender y un mapa abierto para todos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/mapa"
                className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 text-sm font-medium text-brand-ink transition hover:opacity-85"
              >
                Explorar el mapa <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reportar"
                className="inline-flex items-center gap-2 rounded-md border border-line-strong bg-card px-5 py-3 text-sm font-medium transition hover:bg-plane"
              >
                Reportar un bache
              </Link>
            </div>
          </div>
          <MapaHero />
        </div>
      </section>

      <section aria-labelledby="cifras" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 id="cifras" className="text-sm font-medium uppercase tracking-wide text-ink-3">
          El tamaño del problema
        </h2>
        <ul className="mt-8 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {CIFRAS.map((c, i) => (
            <li
              key={c.valor}
              className={`flex flex-col border-b border-line py-6 sm:px-6 lg:border-b-0 ${i % 2 ? "sm:border-l" : "sm:pl-0"} ${i > 0 ? "lg:border-l lg:pl-6" : "lg:pl-0"}`}
            >
              <p className="whitespace-nowrap text-4xl font-semibold tracking-[-0.03em] lg:text-[2.6rem]">{c.valor}</p>
              <p className="mt-3 flex-1 text-sm text-ink-2">{c.etiqueta}</p>
              <a href={c.url} className="mt-4 text-xs text-ink-3 underline decoration-line-strong underline-offset-2 hover:text-ink">
                {c.fuente}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-plane">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Tapar baches por número de quejas no es justo
            </h2>
            <p className="text-ink-2">
              El Ayuntamiento prioriza según las solicitudes ciudadanas y las vialidades más transitadas. Suena razonable,
              pero la investigación con millones de reportes en otras ciudades muestra que{" "}
              <strong className="text-ink">no todas las colonias se quejan igual</strong>: donde hay menos internet, menos
              tiempo o menos confianza en el gobierno, hay menos reportes, aunque haya el mismo o más daño.
            </p>
            <p className="text-ink-2">
              El resultado es que las zonas con más rezago esperan más. Calle Justa existe para medirlo y para proponer
              una forma más justa de decidir qué se repara primero.
            </p>
          </div>
          <blockquote className="flex flex-col justify-center rounded-lg border border-line bg-card p-6">
            <p className="text-lg text-pretty">
              “Los barrios que reportan menos reciben menos reparaciones, aunque sus calles estén igual o peor.”
            </p>
            <footer className="mt-4 text-sm text-ink-3">
              Síntesis de Kontokosta et al. (2017) sobre los sistemas de quejas 311 de Nueva York y Kansas City
            </footer>
          </blockquote>
        </div>
      </section>

      <section aria-labelledby="como" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 id="como" className="text-3xl font-semibold tracking-tight">
          Cómo funciona
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className="rounded-lg border border-line bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <paso.icono className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm text-ink-3">Paso {i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{paso.titulo}</h3>
              <p className="mt-2 text-sm text-ink-2">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="indice" className="border-y border-line bg-plane">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div className="space-y-4">
            <h2 id="indice" className="text-3xl font-semibold tracking-tight">
              Un índice que se explica solo
            </h2>
            <p className="text-ink-2">
              Cinco factores, cada uno con un peso fijo y público. El número de quejas{" "}
              <strong className="text-ink">no</strong> entra en el cálculo: es justamente el sesgo que queremos corregir.
            </p>
            <Link href="/metodologia" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
              Ver la metodología completa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-lg border border-line bg-card p-6">
            <p className="text-sm font-medium">Peso de cada factor (de 100 puntos)</p>
            <ul className="mt-4 space-y-4">
              {(Object.keys(PESOS) as Factor[]).map((factor) => (
                <li key={factor}>
                  <div className="flex justify-between text-sm">
                    <span>{FACTOR_LABEL[factor]}</span>
                    <span className="tabular text-ink-2">{PESOS[factor]}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-plane" aria-hidden="true">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${(PESOS[factor] / 30) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="ods" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 id="ods" className="text-3xl font-semibold tracking-tight">
          Alineado con los Objetivos de Desarrollo Sostenible
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ODS.map((ods) => (
            <li key={ods.numero} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3">
              <span className="tabular flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink text-lg font-semibold text-surface">
                {ods.numero}
              </span>
              <span className="text-sm">{ods.nombre}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="equipo" className="border-t border-line bg-plane">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[1fr_2fr]">
          <h2 id="equipo" className="text-3xl font-semibold tracking-tight">
            Quiénes somos
          </h2>
          <div className="space-y-6">
            <ul className="grid gap-4 sm:grid-cols-2">
              {SITE.equipo.map((nombre) => (
                <li key={nombre} className="rounded-lg border border-line bg-card px-6 py-5 font-semibold">
                  {nombre}
                </li>
              ))}
            </ul>
            <p className="max-w-2xl text-ink-2">
              Somos dos hermanos de Navojoa construyendo juntos Calle Justa: desde la investigación del problema y el
              análisis de los datos hasta la plataforma y la inteligencia artificial que corre en el celular.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

/** Navojoa's real street network with every pending pothole, colored by severity. */
function MapaHero() {
  const { ancho, alto, calles, baches } = construirMapaEstatico();
  const color = { 1: "var(--prio-1)", 2: "var(--prio-2)", 3: "var(--prio-4)" } as const;
  const radio = { 1: 2.6, 2: 3.4, 3: 4.4 } as const;
  return (
    <figure className="space-y-3">
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="w-full overflow-hidden"
        role="img"
        aria-label={`Mapa de Navojoa con ${baches.length} baches pendientes del escenario de demostración`}
      >
        <path d={calles.locales} fill="none" stroke="var(--line-strong)" strokeWidth="0.7" strokeLinecap="round" />
        <path d={calles.principales} fill="none" stroke="var(--ink-3)" strokeWidth="1.6" strokeLinecap="round" />
        {baches.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={radio[b.severidad]} fill={color[b.severidad]} stroke="var(--plane)" strokeWidth="1" />
        ))}
      </svg>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
        <span>{baches.length} baches pendientes (escenario de demostración)</span>
        {([1, 2, 3] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="rounded-full" style={{ width: radio[s] * 2, height: radio[s] * 2, background: color[s] }} />
            {SEVERIDAD_LABEL[s]}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
