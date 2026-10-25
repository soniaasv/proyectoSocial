import {
  diasEntre,
  gradoDe,
  nivelMarginacion,
  NIVELES_MARGINACION,
  type Contexto,
  type NivelMarginacion,
  type Reporte,
} from "./domain";
import type { AgebsGeoJSON } from "./geo";
import type { Prioridad } from "./priority";

export interface ReporteEnriquecido extends Reporte {
  contexto: Contexto;
  prioridad: Prioridad;
}

export interface PuntoCurva {
  dia: number;
  /** Share of potholes still unrepaired after `dia` days. */
  pendiente: number;
}

export interface CurvaSupervivencia {
  puntos: PuntoCurva[];
  /** Median days to repair, or null if fewer than half were repaired in the window. */
  mediana: number | null;
}

/**
 * Kaplan-Meier estimate of time to repair. Potholes still pending are
 * right-censored: we know they waited at least that long. Ignoring them would
 * make repairs look faster than they are.
 */
export function kaplanMeier(observaciones: { dias: number; reparado: boolean }[]): CurvaSupervivencia {
  const porDia = new Map<number, { eventos: number; censurados: number }>();
  for (const { dias, reparado } of observaciones) {
    const entry = porDia.get(dias) ?? { eventos: 0, censurados: 0 };
    if (reparado) entry.eventos++;
    else entry.censurados++;
    porDia.set(dias, entry);
  }
  let enRiesgo = observaciones.length;
  let supervivencia = 1;
  let mediana: number | null = null;
  const puntos: PuntoCurva[] = [{ dia: 0, pendiente: 1 }];
  for (const dia of [...porDia.keys()].sort((a, b) => a - b)) {
    const { eventos, censurados } = porDia.get(dia)!;
    if (eventos > 0 && enRiesgo > 0) {
      supervivencia *= 1 - eventos / enRiesgo;
      puntos.push({ dia, pendiente: supervivencia });
      if (mediana === null && supervivencia <= 0.5) mediana = dia;
    }
    enRiesgo -= eventos + censurados;
  }
  return { puntos, mediana };
}

/** Evaluates the step curve on every day 0..dias-1 (for charts). */
export function curvaPorDia(curva: CurvaSupervivencia, dias: number): number[] {
  const valores: number[] = [];
  let i = 0;
  let actual = 1;
  for (let dia = 0; dia < dias; dia++) {
    while (i < curva.puntos.length && curva.puntos[i].dia <= dia) actual = curva.puntos[i++].pendiente;
    valores.push(actual);
  }
  return valores;
}

export function observacionesReparacion(reportes: Reporte[], ahora: Date) {
  return reportes.map((r) => ({
    dias: diasEntre(r.creadoEn, r.reparadoEn ?? ahora),
    reparado: r.reparadoEn !== null,
  }));
}

export function nivelDe(reporte: ReporteEnriquecido): NivelMarginacion | null {
  const grado = gradoDe(reporte.contexto);
  return grado ? nivelMarginacion(grado) : null;
}

export interface IndicadoresNivel {
  nivel: NivelMarginacion;
  poblacion: number;
  agebs: number;
  baches: number;
  reportesCiudadanos: number;
  /** Citizen reports (counting every supporter) per 1,000 inhabitants. */
  quejasPorMil: number;
  /** Share of potholes found only by field surveys: damage nobody reported. */
  pctSoloRecorrido: number;
  /** Potholes found by field surveys on randomly sampled streets. */
  verificados: number;
  /**
   * Of the surveyed potholes, the share citizens had already reported. Surveys
   * are a random sample, so this estimates the reporting rate free of
   * population size and of how much damage each zone has.
   */
  tasaReporte: number | null;
  pctReparados: number;
  pctReabiertos: number;
  supervivencia: CurvaSupervivencia;
}

/** Indicators by marginalization level, using AGEB population as denominator. */
export function indicadoresPorNivel(
  reportes: ReporteEnriquecido[],
  agebs: AgebsGeoJSON,
  ahora: Date,
): IndicadoresNivel[] {
  return NIVELES_MARGINACION.map((nivel) => {
    const agebsNivel = agebs.features.filter((f) => f.properties.grado && nivelMarginacion(f.properties.grado) === nivel);
    const poblacion = agebsNivel.reduce((sum, f) => sum + f.properties.poblacion, 0);
    const delGrado = reportes.filter((r) => nivelDe(r) === nivel);
    const ciudadanos = delGrado.filter((r) => r.fuente === "ciudadano");
    const quejas = ciudadanos.reduce((sum, r) => sum + r.apoyos, 0);
    const reparadosAlgunaVez = delGrado.filter((r) => r.reparadoEn !== null);
    const verificados = delGrado.filter((r) => r.verificado);
    return {
      nivel,
      poblacion,
      agebs: agebsNivel.length,
      baches: delGrado.length,
      reportesCiudadanos: ciudadanos.length,
      quejasPorMil: poblacion > 0 ? (1000 * quejas) / poblacion : 0,
      pctSoloRecorrido: pct(delGrado.length - ciudadanos.length, delGrado.length),
      verificados: verificados.length,
      tasaReporte: verificados.length ? pct(verificados.filter((r) => r.fuente === "ciudadano").length, verificados.length) : null,
      pctReparados: pct(delGrado.filter((r) => r.estado === "reparado").length, delGrado.length),
      pctReabiertos: pct(reparadosAlgunaVez.filter((r) => r.reabierto).length, reparadosAlgunaVez.length),
      supervivencia: kaplanMeier(observacionesReparacion(delGrado, ahora)),
    };
  });
}

const pct = (parte: number, total: number) => (total > 0 ? (100 * parte) / total : 0);

export interface ResultadoCriterio {
  seleccion: ReporteEnriquecido[];
  porNivel: Record<NivelMarginacion, number>;
  pctAltaMarginacion: number;
  puntajePromedio: number;
}

export interface Contrafactual {
  capacidad: number;
  porQuejas: ResultadoCriterio;
  porIndice: ResultadoCriterio;
}

function resumir(seleccion: ReporteEnriquecido[]): ResultadoCriterio {
  const porNivel = Object.fromEntries(NIVELES_MARGINACION.map((n) => [n, 0])) as Record<NivelMarginacion, number>;
  for (const r of seleccion) {
    const nivel = nivelDe(r);
    if (nivel) porNivel[nivel]++;
  }
  return {
    seleccion,
    porNivel,
    pctAltaMarginacion: pct(porNivel.Alta, seleccion.length),
    puntajePromedio: seleccion.length ? seleccion.reduce((s, r) => s + r.prioridad.puntaje, 0) / seleccion.length : 0,
  };
}

/**
 * What would a week of repair crews fix under each rule? "Por quejas" mimics
 * the current practice (most complaints first, then oldest); "por índice"
 * uses the priority index. Both pick from the same pending potholes.
 */
export function contrafactual(reportes: ReporteEnriquecido[], capacidad: number): Contrafactual {
  const pendientes = reportes.filter((r) => r.estado !== "reparado");
  const porQuejas = [...pendientes]
    .sort((a, b) => b.apoyos - a.apoyos || a.creadoEn.localeCompare(b.creadoEn))
    .slice(0, capacidad);
  const porIndice = [...pendientes].sort((a, b) => b.prioridad.puntaje - a.prioridad.puntaje).slice(0, capacidad);
  return { capacidad, porQuejas: resumir(porQuejas), porIndice: resumir(porIndice) };
}
