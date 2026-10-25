import { describe, expect, it } from "vitest";
import type { Contexto } from "./domain";
import { calcularPrioridad, PESOS } from "./priority";

const ahora = new Date("2026-10-24T12:00:00Z");

const contexto = (overrides: Partial<Contexto> = {}): Contexto => ({
  colonia: { id: "c1", nombre: "Centro", grado: "Medio", poblacion: 1000 },
  calle: { nombre: "Blvd. Centenario", clase: "primaria", superficie: "pavimentada", distanciaM: 3 },
  servicios: { escuelas: 0, salud: 0, masCercano: null },
  ...overrides,
});

const reporte = (overrides = {}) => ({
  severidad: 2 as const,
  creadoEn: "2026-10-14T12:00:00Z",
  estado: "pendiente" as const,
  reparadoEn: null,
  ...overrides,
});

describe("calcularPrioridad", () => {
  it("weights add up to 100", () => {
    expect(Object.values(PESOS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("reaches the maximum when every factor is at its worst", () => {
    const p = calcularPrioridad(
      reporte({ severidad: 3, creadoEn: "2026-07-01T00:00:00Z" }),
      contexto({
        colonia: { id: "c", nombre: "X", grado: "Muy alto", poblacion: 1 },
        servicios: { escuelas: 1, salud: 1, masCercano: null },
      }),
      ahora,
    );
    expect(p.puntaje).toBe(100);
    expect(p.nivel).toBe("Urgente");
  });

  it("ranks a pothole in a marginalized colonia above an identical one in a wealthy colonia", () => {
    const pobre = calcularPrioridad(reporte(), contexto({ colonia: { id: "a", nombre: "A", grado: "Muy alto", poblacion: 1 } }), ahora);
    const rica = calcularPrioridad(reporte(), contexto({ colonia: { id: "b", nombre: "B", grado: "Muy bajo", poblacion: 1 } }), ahora);
    expect(pobre.puntaje - rica.puntaje).toBe(PESOS.rezago);
  });

  it("caps waiting time at 60 days", () => {
    const largo = calcularPrioridad(reporte({ creadoEn: "2025-01-01T00:00:00Z" }), contexto(), ahora);
    const espera = largo.factores.find((f) => f.factor === "espera")!;
    expect(espera.puntos).toBe(PESOS.espera);
  });

  it("measures waiting time until the repair date for repaired potholes", () => {
    const p = calcularPrioridad(
      reporte({ estado: "reparado", creadoEn: "2026-10-01T00:00:00Z", reparadoEn: "2026-10-11T00:00:00Z" }),
      contexto(),
      ahora,
    );
    expect(p.factores.find((f) => f.factor === "espera")!.explicacion).toBe("Se reparó en 10 días");
  });

  it("explains every factor in plain Spanish", () => {
    const p = calcularPrioridad(reporte(), contexto({ servicios: { escuelas: 2, salud: 1, masCercano: null } }), ahora);
    expect(p.factores.map((f) => f.explicacion)).toEqual([
      "Moderado",
      "Vialidad primaria (Blvd. Centenario)",
      "2 escuelas y 1 unidad de salud a menos de 300 m",
      "Colonia con marginación media",
      "Lleva 10 días esperando",
    ]);
  });

  it("treats a missing street or colonia conservatively", () => {
    const p = calcularPrioridad(reporte(), contexto({ calle: null, colonia: null }), ahora);
    expect(p.factores.find((f) => f.factor === "vialidad")!.explicacion).toBe("Calle sin clasificar");
    expect(p.factores.find((f) => f.factor === "rezago")!.explicacion).toBe("Colonia sin dato de marginación");
  });
});
