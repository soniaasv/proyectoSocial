import { describe, expect, it } from "vitest";
import type { Contexto, Grado } from "./domain";
import { contrafactual, indicadoresPorNivel, kaplanMeier, type ReporteEnriquecido } from "./equity";

describe("kaplanMeier", () => {
  it("matches a hand-computed example with censoring", () => {
    // Repairs at days 2, 4, 4 and 8; potholes still pending after 3 and 6 days.
    const curva = kaplanMeier([
      { dias: 2, reparado: true },
      { dias: 3, reparado: false },
      { dias: 4, reparado: true },
      { dias: 4, reparado: true },
      { dias: 6, reparado: false },
      { dias: 8, reparado: true },
    ]);
    // S(2) = 5/6; S(4) = 5/6 * (1 - 2/4) = 5/12; S(8) = 0.
    expect(curva.puntos).toEqual([
      { dia: 0, pendiente: 1 },
      { dia: 2, pendiente: 5 / 6 },
      { dia: 4, pendiente: 5 / 12 },
      { dia: 8, pendiente: 0 },
    ]);
    expect(curva.mediana).toBe(4);
  });

  it("has no median when fewer than half get repaired", () => {
    const curva = kaplanMeier([
      { dias: 5, reparado: true },
      { dias: 10, reparado: false },
      { dias: 10, reparado: false },
    ]);
    expect(curva.mediana).toBeNull();
  });

  it("would understate waiting if censored potholes were dropped", () => {
    const obs = [
      { dias: 10, reparado: true },
      { dias: 60, reparado: false },
      { dias: 60, reparado: false },
      { dias: 20, reparado: true },
    ];
    // S(10) = 3/4, S(20) = 3/4 * (1 - 1/3) = 1/2: half are repaired by day 20...
    expect(kaplanMeier(obs).mediana).toBe(20);
    // ...but dropping the pending ones halves the apparent wait.
    expect(kaplanMeier(obs.filter((o) => o.reparado)).mediana).toBe(10);
  });
});

function reporte(id: string, grado: Grado, apoyos: number, puntaje: number): ReporteEnriquecido {
  const contexto: Contexto = {
    colonia: null,
    ageb: { id: grado, grado, poblacion: 100 },
    calle: null,
    servicios: { escuelas: 0, salud: 0, masCercano: null },
  };
  return {
    id,
    lat: 27.07,
    lng: -109.44,
    severidad: 2,
    fuente: apoyos > 0 ? "ciudadano" : "recorrido",
    apoyos,
    creadoEn: "2026-10-01T00:00:00Z",
    estado: "pendiente",
    reparadoEn: null,
    reabierto: false,
    simulado: true,
    contexto,
    prioridad: { puntaje, nivel: "Media", factores: [] },
  };
}

describe("contrafactual", () => {
  const reportes = [
    reporte("a", "Muy bajo", 5, 30),
    reporte("b", "Bajo", 4, 35),
    reporte("c", "Muy alto", 1, 80),
    reporte("d", "Alto", 0, 75),
  ];

  it("picks the most complained-about potholes under the complaints rule", () => {
    const r = contrafactual(reportes, 2);
    expect(r.porQuejas.seleccion.map((x) => x.id)).toEqual(["a", "b"]);
    expect(r.porQuejas.pctAltaMarginacion).toBe(0);
  });

  it("picks the highest index under the index rule", () => {
    const r = contrafactual(reportes, 2);
    expect(r.porIndice.seleccion.map((x) => x.id)).toEqual(["c", "d"]);
    expect(r.porIndice.pctAltaMarginacion).toBe(100);
    expect(r.porIndice.porNivel.Alta).toBe(2);
  });

  it("ignores potholes already repaired", () => {
    const reparado = { ...reporte("e", "Muy bajo", 9, 99), estado: "reparado" as const };
    expect(contrafactual([...reportes, reparado], 1).porQuejas.seleccion[0].id).toBe("a");
  });
});

describe("indicadoresPorNivel", () => {
  const agebs = {
    type: "FeatureCollection" as const,
    features: (
      [
        ["a", "Muy bajo", 6000],
        ["b", "Bajo", 4000],
        ["c", "Muy alto", 2000],
        ["d", null, 50],
      ] as const
    ).map(([id, grado, poblacion]) => ({
      type: "Feature" as const,
      properties: { id, grado, poblacion, viviendas: null, pctVehiculo: null, indice: null },
      geometry: { type: "Polygon" as const, coordinates: [] },
    })),
  };

  it("groups grades into levels and normalizes complaints by population", () => {
    const reportes = [reporte("1", "Muy bajo", 3, 40), reporte("2", "Bajo", 2, 40), reporte("3", "Muy alto", 1, 40), reporte("4", "Alto", 0, 40)];
    const [baja, media, alta] = indicadoresPorNivel(reportes, agebs, new Date("2026-10-24T00:00:00Z"));
    expect(baja).toMatchObject({ nivel: "Baja", poblacion: 10000, agebs: 2, baches: 2, quejasPorMil: 0.5 });
    expect(media).toMatchObject({ nivel: "Media", poblacion: 0, baches: 0, quejasPorMil: 0 });
    expect(alta).toMatchObject({ nivel: "Alta", poblacion: 2000, baches: 2, quejasPorMil: 0.5, pctSoloRecorrido: 50 });
  });
});
