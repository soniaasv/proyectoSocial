import type { Metadata } from "next";
import Link from "next/link";
import { FACTOR_LABEL, NIVELES, PESOS, type Factor } from "@/lib/priority";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Metodología",
  description: "Cómo se construyen los datos, el índice de prioridad y las medidas de equidad de Calle Justa.",
};

const NORMALIZACION: Record<Factor, string> = {
  severidad: "Leve = 1/3, moderado = 2/3, grave = 1",
  vialidad: "Primaria = 1, secundaria = 0.75, terciaria = 0.5, local = 0.25",
  servicios: "(escuelas + 2 × unidades de salud) / 3 a menos de 300 m, máximo 1",
  rezago: "Marginación muy baja = 0, baja = 0.25, media = 0.5, alta = 0.75, muy alta = 1",
  espera: "Días esperando / 60, máximo 1",
};

const FUENTES = [
  ["AGEB urbanas y población", "INEGI · Marco Geoestadístico y Censo 2020", "Unidad de análisis y denominadores"],
  ["Grado de marginación", "CONAPO · Índice de marginación urbana 2020", "Equidad y factor de rezago"],
  ["Colonias", "CONAPO · Marginación por colonia 2020", "Nombres de lugares para el público"],
  ["Calles", "OpenStreetMap (ODbL)", "Clase vial y superficie"],
  ["Escuelas y salud", "INEGI · DENUE", "Factor de servicios cercanos"],
  ["Reportes de baches", "Escenario simulado (por ahora)", "Demostración del método"],
];

const SUPUESTOS = [
  ["Daño", "Baches en calles pavimentadas, proporcionales a su longitud; más desgaste en vialidades importantes y en zonas con más rezago."],
  ["Reporte", "La probabilidad de que un vecino reporte un bache baja de 55% (marginación muy baja) a 18% (muy alta), como documenta la literatura sobre sistemas de quejas."],
  ["Recorridos", "12% de las calles, elegidas al azar, se recorren y se anota cada bache, lo haya reportado alguien o no."],
  ["Reparación", "Por quejas: más quejas y vialidades más transitadas se reparan antes. 12% de los parches falla."],
];

export default function MetodologiaPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-14 px-4 py-12">
      <header className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-ink-3">Metodología · versión 1.0</p>
        <h1 className="text-4xl font-semibold tracking-tight">Cómo funciona Calle Justa</h1>
        <p className="text-lg text-ink-2">
          Todo lo que hacemos se puede revisar, criticar y reproducir. Aquí está la versión corta; el{" "}
          <a href={`${SITE.repo}/blob/main/docs/metodologia.md`} className="font-medium text-ink underline underline-offset-2">
            documento completo
          </a>{" "}
          y el código están en GitHub.
        </p>
      </header>

      <Bloque titulo="La pregunta">
        <blockquote className="border-l-4 border-brand pl-4 text-lg">
          ¿La atención de baches en Navojoa es equitativa entre zonas con distinto grado de marginación, y cómo cambiaría
          si se priorizara con un índice de impacto social en vez de por número de quejas?
        </blockquote>
        <ol className="list-decimal space-y-2 pl-5 text-ink-2">
          <li><strong className="text-ink">H1.</strong> Las zonas más marginadas reportan una parte menor de sus baches.</li>
          <li><strong className="text-ink">H2.</strong> En esas zonas la reparación tarda más.</li>
          <li><strong className="text-ink">H3.</strong> Un índice de impacto social reasigna atención hacia ellas.</li>
        </ol>
      </Bloque>

      <Bloque titulo="Los datos">
        <Tabla cabeceras={["Capa", "Fuente", "Uso"]} filas={FUENTES} />
        <p className="text-ink-2">
          La unidad de análisis es la <strong className="text-ink">AGEB urbana</strong>: cubre toda la ciudad y el 99.5% de
          la población tiene grado de marginación. Las colonias solo sirven para nombrar lugares. Los cinco grados de
          CONAPO se agrupan en tres niveles (baja, media y alta) porque solo el 2.4% de la ciudad vive en zonas de
          marginación alta.
        </p>
      </Bloque>

      <Bloque titulo="El índice de prioridad">
        <p className="text-ink-2">
          Cada bache recibe de 0 a 100 puntos: cinco factores normalizados entre 0 y 1, multiplicados por un peso fijo y
          público. <strong className="text-ink">El número de quejas no forma parte del índice</strong>: priorizar por
          quejas es justamente lo que estamos evaluando.
        </p>
        <Tabla
          cabeceras={["Factor", "Peso", "Cómo se mide"]}
          filas={(Object.keys(PESOS) as Factor[]).map((f) => [FACTOR_LABEL[f], String(PESOS[f]), NORMALIZACION[f]])}
        />
        <p className="text-sm text-ink-2">
          Niveles: {NIVELES.map((n) => `${n.nombre} ≥ ${n.min}`).join(" · ")}. Los pesos son un punto de partida definido
          por juicio experto; deben validarse con el Ayuntamiento y con los vecinos.
        </p>
      </Bloque>

      <Bloque titulo="Cómo medimos la equidad">
        <dl className="space-y-5">
          <div>
            <dt className="font-semibold">Tasa de reporte (H1)</dt>
            <dd className="mt-1 text-ink-2">
              Las quejas por habitante engañan: mezclan voz, daño y kilómetros de calle por persona. En cambio, en{" "}
              <strong className="text-ink">calles elegidas al azar</strong> anotamos todos los baches y medimos qué parte
              ya había reportado algún vecino. Como la muestra es aleatoria, esa proporción estima sin sesgo cuánto del
              daño real llega al gobierno en cada zona.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Tiempo hasta la reparación (H2)</dt>
            <dd className="mt-1 text-ink-2">
              Usamos el estimador de <strong className="text-ink">Kaplan-Meier</strong>, que cuenta los baches que siguen
              pendientes como “al menos N días esperando” en lugar de ignorarlos. Ignorarlos haría parecer que se repara
              más rápido de lo real.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Contrafactual (H3)</dt>
            <dd className="mt-1 text-ink-2">
              Sobre los mismos baches pendientes simulamos una semana de cuadrillas (60 reparaciones) con dos reglas,
              “más quejas primero” y “mayor índice primero”, y comparamos a qué zonas llega el trabajo.
            </dd>
          </div>
        </dl>
      </Bloque>

      <Bloque titulo="El escenario simulado" id="simulacion">
        <p className="text-ink-2">
          Navojoa todavía no publica datos abiertos de baches. Vamos a solicitar por transparencia la base de reportes
          ciudadanos, la bitácora de bacheo y el estudio de geolocalización de 19,208 baches. Mientras tanto, la
          plataforma funciona con un <strong className="text-ink">escenario simulado</strong>, con semilla fija y
          supuestos tomados de la literatura. Sirve para demostrar que el método funciona de punta a punta.{" "}
          <strong className="text-ink">Sus resultados no describen a Navojoa.</strong>
        </p>
        <Tabla cabeceras={["Componente", "Supuesto"]} filas={SUPUESTOS} />
      </Bloque>

      <Bloque titulo="Limitaciones">
        <ul className="list-disc space-y-2 pl-5 text-ink-2">
          <li>El nivel de marginación alta tiene pocos baches; sus cifras son indicativas y se publican con su tamaño de muestra.</li>
          <li>La clase vial de OpenStreetMap aproxima el tráfico, pero no es un aforo vehicular.</li>
          <li>La marginación y la población son del Censo 2020: colonias más nuevas pueden no aparecer.</li>
          <li>La marginación alta de Navojoa parece concentrarse fuera de la ciudad, en localidades que este estudio aún no cubre.</li>
        </ul>
      </Bloque>

      <Bloque titulo="Privacidad y ética">
        <ul className="list-disc space-y-2 pl-5 text-ink-2">
          <li>No pedimos cuentas ni datos personales. Las fotos se analizan en tu celular y no se suben.</li>
          <li>No sustituimos al Ayuntamiento: cada reporte termina con un mensaje listo para su WhatsApp oficial.</li>
          <li>
            Publicamos todos los datos derivados para que cualquiera pueda verificar los resultados.{" "}
            <Link href="/datos" className="underline underline-offset-2">Ver datos abiertos</Link>.
          </li>
        </ul>
      </Bloque>
    </article>
  );
}

function Bloque({ titulo, id, children }: { titulo: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id ?? titulo}-titulo`} className="scroll-mt-24 space-y-4">
      <h2 id={`${id ?? titulo}-titulo`} className="text-2xl font-semibold tracking-tight">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Tabla({ cabeceras, filas }: { cabeceras: string[]; filas: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-plane text-left text-xs text-ink-3">
          <tr>
            {cabeceras.map((c) => (
              <th key={c} scope="col" className="px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {filas.map((fila) => (
            <tr key={fila[0]} className="align-top">
              {fila.map((celda, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-4 py-3 text-left font-medium">
                    {celda}
                  </th>
                ) : (
                  <td key={i} className="px-4 py-3 text-ink-2">
                    {celda}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
