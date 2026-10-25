import { ArrowRight, Camera, ChartColumn, Scale } from "lucide-react";
import Link from "next/link";
import { FACTOR_LABEL, PESOS, type Factor } from "@/lib/priority";
import { CIFRAS } from "@/lib/site";

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
  { numero: 11, nombre: "Ciudades y comunidades sostenibles", color: "#FD9D24" },
  { numero: 10, nombre: "Reducción de las desigualdades", color: "#DD1367" },
  { numero: 9, nombre: "Industria, innovación e infraestructura", color: "#FD6925" },
  { numero: 16, nombre: "Paz, justicia e instituciones sólidas", color: "#00689D" },
  { numero: 3, nombre: "Salud y bienestar", color: "#4C9F38" },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-plane">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-ink-2">
              Navojoa, Sonora · Observatorio ciudadano
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              19,208 baches. <span className="text-brand">¿Quién espera más?</span>
            </h1>
            <p className="max-w-xl text-lg text-ink-2 text-pretty">
              Calle Justa mide si las calles de Navojoa se reparan donde más se necesita, y no solo donde más se queja
              la gente. Con datos públicos, un índice que cualquiera puede entender y un mapa abierto para todos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/mapa"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-medium text-brand-ink shadow-sm transition hover:opacity-90"
              >
                Explorar el mapa <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reportar"
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-card px-5 py-3 font-medium transition hover:bg-surface"
              >
                Reportar un bache
              </Link>
            </div>
          </div>
          <HeroIlustracion />
        </div>
      </section>

      <section aria-labelledby="cifras" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 id="cifras" className="text-sm font-medium uppercase tracking-wide text-ink-3">
          El tamaño del problema
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CIFRAS.map((c) => (
            <li key={c.valor} className="flex flex-col rounded-2xl border border-line bg-card p-5">
              <p className="text-3xl font-semibold tracking-tight">{c.valor}</p>
              <p className="mt-2 flex-1 text-sm text-ink-2">{c.etiqueta}</p>
              <a href={c.url} className="mt-4 text-xs text-ink-3 underline underline-offset-2 hover:text-ink">
                Fuente: {c.fuente}
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
          <blockquote className="flex flex-col justify-center rounded-2xl border border-line bg-card p-6">
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
            <li key={paso.titulo} className="rounded-2xl border border-line bg-card p-6">
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
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="text-sm font-medium">Peso de cada factor (de 100 puntos)</p>
            <ul className="mt-4 space-y-4">
              {(Object.keys(PESOS) as Factor[]).map((factor) => (
                <li key={factor}>
                  <div className="flex justify-between text-sm">
                    <span>{FACTOR_LABEL[factor]}</span>
                    <span className="tabular text-ink-2">{PESOS[factor]}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-plane" aria-hidden="true">
                    <div className="h-full rounded-full bg-prio-3" style={{ width: `${(PESOS[factor] / 30) * 100}%` }} />
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
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                style={{ background: ods.color }}
              >
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-card p-6">
              <p className="font-semibold">Sonia Soto Valenzuela</p>
              <p className="text-sm text-ink-3">Líder del proyecto · Ciencia de datos</p>
              <p className="mt-3 text-sm text-ink-2">
                Plantea la pregunta de investigación, diseña el análisis de equidad y coordina el trabajo con vecinos e
                instituciones.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-6">
              <p className="font-semibold">Chema</p>
              <p className="text-sm text-ink-3">Ingeniería de software e IA</p>
              <p className="mt-3 text-sm text-ink-2">
                Construye la plataforma, el pipeline de datos y el modelo de detección que corre en el celular.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Stylized street grid with potholes colored by priority. Decorative. */
function HeroIlustracion() {
  const baches = [
    { x: 92, y: 70, r: 9, c: "var(--prio-4)" },
    { x: 214, y: 150, r: 7, c: "var(--prio-3)" },
    { x: 150, y: 232, r: 6, c: "var(--prio-2)" },
    { x: 300, y: 92, r: 5, c: "var(--prio-1)" },
    { x: 262, y: 262, r: 8, c: "var(--prio-3)" },
    { x: 54, y: 196, r: 5, c: "var(--prio-2)" },
  ];
  return (
    <svg viewBox="0 0 360 320" className="w-full rounded-3xl border border-line bg-card" aria-hidden="true">
      <rect x="20" y="20" width="320" height="280" rx="18" fill="var(--plane)" />
      {[70, 150, 232].map((y) => (
        <rect key={`h${y}`} x="20" y={y - 9} width="320" height="18" fill="var(--card)" />
      ))}
      {[92, 214, 300].map((x) => (
        <rect key={`v${x}`} x={x - 9} y="20" width="18" height="280" fill="var(--card)" />
      ))}
      <path d="M20 262 L340 196" stroke="var(--card)" strokeWidth="22" />
      <path d="M20 262 L340 196" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="6 8" />
      {baches.map((b) => (
        <g key={`${b.x}-${b.y}`}>
          <circle cx={b.x} cy={b.y} r={b.r + 6} fill={b.c} opacity="0.18" />
          <circle cx={b.x} cy={b.y} r={b.r} fill={b.c} stroke="var(--card)" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}
