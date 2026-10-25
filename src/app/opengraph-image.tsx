import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.nombre} · ${SITE.lema}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BACHES = [
  { x: 820, y: 170, r: 26, c: "#8a1c17" },
  { x: 990, y: 300, r: 20, c: "#c23a2c" },
  { x: 880, y: 430, r: 16, c: "#e0674f" },
  { x: 1070, y: 470, r: 13, c: "#f0a08a" },
  { x: 760, y: 340, r: 14, c: "#e0674f" },
];

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f5f1", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", width: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700, color: "#0b0b0b" }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "#c23a2c" }} />
            {SITE.nombre}
          </div>
          <div style={{ marginTop: 40, fontSize: 64, fontWeight: 700, lineHeight: 1.05, color: "#0b0b0b" }}>19,208 baches.</div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, color: "#c23a2c" }}>¿Quién espera más?</div>
          <div style={{ marginTop: 28, fontSize: 28, color: "#52514e", lineHeight: 1.3 }}>
            Observatorio ciudadano de baches de Navojoa, Sonora
          </div>
        </div>
        <div style={{ display: "flex", position: "relative", flex: 1 }}>
          {[150, 300, 450].map((y) => (
            <div key={y} style={{ position: "absolute", left: 0, top: y - 14, width: 520, height: 28, background: "#ffffff" }} />
          ))}
          {[80, 230, 380].map((x) => (
            <div key={x} style={{ position: "absolute", left: x - 14, top: 0, width: 28, height: 630, background: "#ffffff" }} />
          ))}
          {BACHES.map((b) => (
            <div
              key={b.x}
              style={{
                position: "absolute",
                left: b.x - 680 - b.r,
                top: b.y - b.r,
                width: b.r * 2,
                height: b.r * 2,
                borderRadius: b.r,
                background: b.c,
                border: "4px solid #ffffff",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
