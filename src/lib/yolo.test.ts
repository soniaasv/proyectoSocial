import { describe, expect, it } from "vitest";
import { decodificar, desletterbox, iou, nms } from "./yolo";

describe("decodificar", () => {
  it("reads the [5, N] layout and drops low-confidence candidates", () => {
    // Three candidates: cx, cy, w, h, score rows.
    const salida = new Float32Array([
      100, 300, 500, // cx
      100, 300, 500, // cy
      20, 40, 60, // w
      10, 40, 60, // h
      0.9, 0.1, 0.5, // score
    ]);
    expect(decodificar(salida, 3)).toEqual([
      { x: 90, y: 95, ancho: 20, alto: 10, confianza: expect.closeTo(0.9) },
      { x: 470, y: 470, ancho: 60, alto: 60, confianza: 0.5 },
    ]);
  });
});

describe("iou and nms", () => {
  const a = { x: 0, y: 0, ancho: 10, alto: 10, confianza: 0.9 };
  const b = { x: 5, y: 0, ancho: 10, alto: 10, confianza: 0.8 };
  const lejos = { x: 100, y: 100, ancho: 10, alto: 10, confianza: 0.7 };

  it("computes intersection over union", () => {
    expect(iou(a, a)).toBe(1);
    expect(iou(a, b)).toBeCloseTo(50 / 150);
    expect(iou(a, lejos)).toBe(0);
  });

  it("keeps the most confident of overlapping boxes", () => {
    const casi = { ...a, x: 1, confianza: 0.6 };
    expect(nms([casi, lejos, a])).toEqual([a, lejos]);
  });

  it("keeps boxes that overlap less than the threshold", () => {
    expect(nms([a, b], 0.45)).toHaveLength(2);
  });
});

describe("desletterbox", () => {
  it("undoes scaling and padding", () => {
    const [c] = desletterbox([{ x: 20, y: 140, ancho: 50, alto: 50, confianza: 1 }], 0.5, 0, 120);
    expect(c).toEqual({ x: 40, y: 40, ancho: 100, alto: 100, confianza: 1 });
  });
});
