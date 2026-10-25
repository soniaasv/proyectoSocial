import { diasEntre, GRADO_ADJETIVO, gradoDe, SEVERIDAD_LABEL, type ClaseVial, type Contexto, type Grado, type Reporte } from "./domain";

/**
 * Explainable priority index (0-100) for a pothole.
 *
 * Each factor is normalized to 0-1 and multiplied by its weight. The index
 * deliberately ignores how many people complained: ranking by complaints is
 * the practice whose equity we are measuring, so using it here would
 * reproduce the bias. See docs/metodologia.md.
 */
export const PESOS = {
  severidad: 30,
  vialidad: 25,
  servicios: 15,
  rezago: 15,
  espera: 15,
} as const;
export type Factor = keyof typeof PESOS;

export const FACTOR_LABEL: Record<Factor, string> = {
  severidad: "Severidad",
  vialidad: "Importancia de la vialidad",
  servicios: "Escuelas y salud cerca",
  rezago: "Rezago de la zona",
  espera: "Tiempo de espera",
};

const VIALIDAD: Record<ClaseVial, number> = { primaria: 1, secundaria: 0.75, terciaria: 0.5, local: 0.25 };
const REZAGO: Record<Grado, number> = { "Muy bajo": 0, Bajo: 0.25, Medio: 0.5, Alto: 0.75, "Muy alto": 1 };
/** Days after which waiting time counts fully. */
export const ESPERA_MAXIMA_DIAS = 60;
export const RADIO_SERVICIOS_M = 300;

export const NIVELES = [
  { nombre: "Urgente", min: 70 },
  { nombre: "Alta", min: 50 },
  { nombre: "Media", min: 30 },
  { nombre: "Baja", min: 0 },
] as const;
export type Nivel = (typeof NIVELES)[number]["nombre"];

export interface FactorDetalle {
  factor: Factor;
  puntos: number;
  maximo: number;
  explicacion: string;
}

export interface Prioridad {
  puntaje: number;
  nivel: Nivel;
  factores: FactorDetalle[];
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export function calcularPrioridad(
  reporte: Pick<Reporte, "severidad" | "creadoEn" | "estado" | "reparadoEn">,
  contexto: Contexto,
  ahora: Date,
): Prioridad {
  const clase = contexto.calle?.clase ?? "local";
  const grado = gradoDe(contexto);
  const { escuelas, salud } = contexto.servicios;
  const fin = reporte.estado === "reparado" && reporte.reparadoEn ? reporte.reparadoEn : ahora;
  const dias = diasEntre(reporte.creadoEn, fin);

  const valores: Record<Factor, { valor: number; explicacion: string }> = {
    severidad: {
      valor: reporte.severidad / 3,
      explicacion: SEVERIDAD_LABEL[reporte.severidad],
    },
    vialidad: {
      valor: VIALIDAD[clase],
      explicacion: contexto.calle
        ? `Vialidad ${clase}${contexto.calle.nombre ? ` (${contexto.calle.nombre})` : ""}`
        : "Calle sin clasificar",
    },
    servicios: {
      valor: Math.min(1, (escuelas + 2 * salud) / 3),
      explicacion:
        escuelas + salud === 0
          ? `Sin escuelas ni unidades de salud a menos de ${RADIO_SERVICIOS_M} m`
          : `${[escuelas && plural(escuelas, "escuela", "escuelas"), salud && plural(salud, "unidad de salud", "unidades de salud")]
              .filter(Boolean)
              .join(" y ")} a menos de ${RADIO_SERVICIOS_M} m`,
    },
    rezago: {
      valor: grado ? REZAGO[grado] : REZAGO.Bajo,
      explicacion: grado ? `Zona con marginación ${GRADO_ADJETIVO[grado]}` : "Zona sin dato de marginación",
    },
    espera: {
      valor: Math.min(1, dias / ESPERA_MAXIMA_DIAS),
      explicacion:
        reporte.estado === "reparado"
          ? `Se reparó en ${plural(dias, "día", "días")}`
          : dias === 0
            ? "Reportado hoy"
            : `Lleva ${plural(dias, "día", "días")} esperando`,
    },
  };

  const factores = (Object.keys(PESOS) as Factor[]).map((factor) => ({
    factor,
    puntos: Math.round(valores[factor].valor * PESOS[factor] * 10) / 10,
    maximo: PESOS[factor],
    explicacion: valores[factor].explicacion,
  }));
  const puntaje = Math.round(factores.reduce((sum, f) => sum + f.puntos, 0));
  const nivel = NIVELES.find((n) => puntaje >= n.min)!.nombre;
  return { puntaje, nivel, factores };
}
