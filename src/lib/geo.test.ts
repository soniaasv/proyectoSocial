import { describe, expect, it } from "vitest";
import { crearResolverContexto, type Capas } from "./geo";

// A tiny synthetic city around (27.07, -109.44): one square colonia, two streets, two services.
const capas: Capas = {
  colonias: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { id: "c1", nombre: "Centro", cp: "85800", tipo: "Colonia", poblacion: 1200, grado: "Alto", indice: 0.9, sinInternet: 30 },
        geometry: {
          type: "Polygon",
          coordinates: [[[-109.45, 27.06], [-109.43, 27.06], [-109.43, 27.08], [-109.45, 27.08], [-109.45, 27.06]]],
        },
      },
    ],
  },
  calles: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { osmId: 1, nombre: "Blvd. Centenario", clase: "primaria", superficie: "pavimentada" },
        geometry: { type: "LineString", coordinates: [[-109.45, 27.07], [-109.43, 27.07]] },
      },
      {
        type: "Feature",
        properties: { osmId: 2, nombre: null, clase: "local", superficie: "desconocida" },
        geometry: { type: "LineString", coordinates: [[-109.45, 27.075], [-109.43, 27.075]] },
      },
    ],
  },
  servicios: {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { nombre: "Primaria Juárez", tipo: "escuela", unidades: 2 }, geometry: { type: "Point", coordinates: [-109.44, 27.0705] } },
      { type: "Feature", properties: { nombre: "Hospital General", tipo: "salud", unidades: 1 }, geometry: { type: "Point", coordinates: [-109.44, 27.09] } },
    ],
  },
};

const resolver = crearResolverContexto(capas);

describe("crearResolverContexto", () => {
  it("matches a point to the nearest street and its colonia", () => {
    const ctx = resolver(27.0702, -109.44);
    expect(ctx.calle).toMatchObject({ nombre: "Blvd. Centenario", clase: "primaria" });
    expect(ctx.calle!.distanciaM).toBeLessThan(30);
    expect(ctx.colonia).toEqual({ id: "c1", nombre: "Centro", grado: "Alto", poblacion: 1200 });
  });

  it("picks the closer of two parallel streets", () => {
    expect(resolver(27.0745, -109.44).calle?.clase).toBe("local");
  });

  it("returns no street when the nearest one is too far", () => {
    expect(resolver(27.1, -109.44).calle).toBeNull();
  });

  it("returns no colonia outside every polygon", () => {
    expect(resolver(27.1, -109.44).colonia).toBeNull();
  });

  it("counts services within 300 m and names the closest", () => {
    const ctx = resolver(27.0702, -109.44);
    expect(ctx.servicios).toEqual({
      escuelas: 1,
      salud: 0,
      masCercano: { nombre: "Primaria Juárez", tipo: "escuela", distanciaM: expect.any(Number) },
    });
  });
});
