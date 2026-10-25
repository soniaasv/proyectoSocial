import { diasEntre, GRADOS, type Contexto, type Grado, type Reporte } from "./domain";
import type { ColoniasGeoJSON } from "./geo";
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

export function observacionesReparacion(reportes: Reporte[], ahora: Date) {
  return reportes.map((r) => ({
    dias: diasEntre(r.creadoEn, r.reparadoEn ?? ahora),
    reparado: r.reparadoEn !== null,
  }));
}

export interface IndicadoresGrado {
  grado: Grado;
  poblacion: number;
  colonias: number;
  baches: number;
  reportesCiudadanos: number;
  /** Citizen reports (counting every supporter) per 1,000 inhabitants. */
  quejasPorMil: number;
  /** Share of potholes found only by field surveys: damage nobody reported. */
  pctSoloRecorrido: number;
  pctReparados: number;
  pctReabiertos: number;
  supervivencia: CurvaSupervivencia;
}

export function indicadoresPorGrado(
  reportes: ReporteEnriquecido[],
  colonias: ColoniasGeoJSON,
  ahora: Date,
): IndicadoresGrado[] {
  return GRADOS.map((grado) => {
    const coloniasGrado = colonias.features.filter((f) => f.properties.grado === grado);
    const poblacion = coloniasGrado.reduce((sum, f) => sum + f.properties.poblacion, 0);
    const delGrado = reportes.filter((r) => r.contexto.colonia?.grado === grado);
    const ciudadanos = delGrado.filter((r) => r.fuente === "ciudadano");
    const quejas = ciudadanos.reduce((sum, r) => sum + r.apoyos, 0);
    const reparadosAlgunaVez = delGrado.filter((r) => r.reparadoEn !== null);
    return {
      grado,
      poblacion,
      colonias: coloniasGrado.length,
      baches: delGrado.length,
      reportesCiudadanos: ciudadanos.length,
      quejasPorMil: poblacion > 0 ? (1000 * quejas) / poblacion : 0,
      pctSoloRecorrido: pct(delGrado.length - ciudadanos.length, delGrado.length),
      pctReparados: pct(delGrado.filter((r) => r.estado === "reparado").length, delGrado.length),
      pctReabiertos: pct(reparadosAlgunaVez.filter((r) => r.reabierto).length, reparadosAlgunaVez.length),
      supervivencia: kaplanMeier(observacionesReparacion(delGrado, ahora)),
    };
  });
}

const pct = (parte: number, total: number) => (total > 0 ? (100 * parte) / total : 0);

export const ALTA_MARGINACION: readonly Grado[] = ["Alto", "Muy alto"];

export interface ResultadoCriterio {
  seleccion: ReporteEnriquecido[];
  porGrado: Record<Grado, number>;
  pctAltaMarginacion: number;
  puntajePromedio: number;
}

export interface Contrafactual {
  capacidad: number;
  porQuejas: ResultadoCriterio;
  porIndice: ResultadoCriterio;
}

function resumir(seleccion: ReporteEnriquecido[]): ResultadoCriterio {
  const porGrado = Object.fromEntries(GRADOS.map((g) => [g, 0])) as Record<Grado, number>;
  for (const r of seleccion) if (r.contexto.colonia) porGrado[r.contexto.colonia.grado]++;
  const alta = seleccion.filter((r) => r.contexto.colonia && ALTA_MARGINACION.includes(r.contexto.colonia.grado)).length;
  return {
    seleccion,
    porGrado,
    pctAltaMarginacion: pct(alta, seleccion.length),
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
