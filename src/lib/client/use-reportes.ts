"use client";

import { useEffect, useState } from "react";
import type { ReporteEnriquecido } from "@/lib/equity";

export interface ReportesRespuesta {
  generadoEn: string;
  modo: "demo" | "postgres";
  incluyeSimulados: boolean;
  reportes: ReporteEnriquecido[];
}

type Estado =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; datos: ReportesRespuesta };

const LOCALES_KEY = "calle-justa:mis-reportes";

/** Reports created on this device while the site runs without a database. */
export function leerReportesLocales(): ReporteEnriquecido[] {
  try {
    return JSON.parse(localStorage.getItem(LOCALES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function guardarReporteLocal(reporte: ReporteEnriquecido) {
  try {
    localStorage.setItem(LOCALES_KEY, JSON.stringify([reporte, ...leerReportesLocales()].slice(0, 50)));
  } catch {
    // Storage can be unavailable (private mode); the report was still shown to the user.
  }
}

export function useReportes(): Estado {
  const [estado, setEstado] = useState<Estado>({ estado: "cargando" });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/reportes", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ReportesRespuesta>;
      })
      .then((datos) => {
        const locales = datos.modo === "demo" ? leerReportesLocales() : [];
        setEstado({ estado: "listo", datos: { ...datos, reportes: [...locales, ...datos.reportes] } });
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setEstado({ estado: "error", mensaje: "No pudimos cargar los reportes. Revisa tu conexión e intenta de nuevo." });
        }
      });
    return () => controller.abort();
  }, []);
  return estado;
}
