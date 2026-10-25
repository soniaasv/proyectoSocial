# ADR-0001: Enfoque en baches con equidad y transparencia

- **Estado:** aceptada
- **Fecha:** 2026-10-24

## Contexto

Queremos un proyecto de ciencia de datos con impacto social real en Navojoa, entendible para el público general, defendible académicamente y escalable a otras ciudades. La idea inicial era detectar baches con IA. La investigación ([investigacion.md](../investigacion.md)) mostró que:

- La detección ya está resuelta, tanto comercial como académicamente.
- Navojoa ya tiene un canal oficial de reporte (WhatsApp).
- El cuello de botella real es **priorizar con equidad** y **transparentar** la atención.

## Opciones

| Opción | Pros | Contras |
|---|---|---|
| Detector de baches | Fácil de demostrar | Sin novedad; compite con cientos de proyectos iguales |
| **Baches con equidad** | Problema #1 percibido; pregunta de investigación original; fácil de comunicar | Pocos datos abiertos; depende de transparencia y recolección propia |
| Agua / calor | Más datos (calor) o más impacto (agua) | Menos inmediato para el público; agua depende de Oomapasn |

## Decisión

Construir **Calle Justa**, un observatorio ciudadano de baches con tres pilares:

1. Un **índice de prioridad explicable**.
2. **Medición de equidad** por colonia.
3. **Transparencia** de los tiempos de atención.

La detección con IA se incluye como herramienta de apoyo al reporte (en el dispositivo), no como el producto.

## Consecuencias

- Mientras lleguen las respuestas de transparencia y los datos de los recorridos, la v1 usa **datos reales de contexto** (calles, escuelas, marginación, población) y **reportes simulados, siempre etiquetados como tales**.
- La arquitectura es modular, para sumar agua y calor como capas futuras.
- Hay que cuidar la relación con el Ayuntamiento: el tono es de colaboración, no de denuncia.
