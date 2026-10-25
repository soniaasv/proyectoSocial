# Definición del problema

## El problema

Los baches son el **problema urbano #1 en México**: el 83.4% de la población urbana los señala en la ENSU del 2T-2026 (INEGI), por encima de la delincuencia.

En Navojoa, Sonora:

- Un estudio de geolocalización de la Secretaría de Infraestructura Urbana y Ecología (SIUE) contó **19,208 baches**.
- Entre septiembre de 2025 y septiembre de 2026 se taparon **más de 10,500**, con una inversión de **$10.2 millones de pesos**.
- Con esas cifras, cerca del **45% sigue pendiente**.
- El municipio prioriza por **solicitudes ciudadanas y vialidades más transitadas**.

Fuentes: [Tribuna, 17 sep 2026](https://tribuna.com.mx/sonora/2026/09/17/tapan-mas-de-10-mil-baches-en-solo-un-ano-en-el-municipio-de-navojoa_689122/), [Tribuna, 16 ago 2026](https://tribuna.com.mx/sonora/2026/08/16/gobierno-de-navojoa-supera-los-120-mil-metros-cuadrados-de-bacheo-faltan-396-km-por-pavimentar_657703/).

## Por qué no es (solo) un problema de detección

Detectar baches con inteligencia artificial ya está resuelto. Hay productos comerciales (RoadBotics, Vialytics, Vaisala RoadAI) y modelos académicos con mAP de alrededor de 85%, incluidos trabajos mexicanos. Navojoa ya tiene un canal oficial de reporte por WhatsApp.

Lo que **nadie mide de forma independiente** es:

1. **¿Quién espera más?** Priorizar por quejas favorece a quien más se queja. La literatura muestra que la propensión a reportar depende del nivel socioeconómico (Kontokosta et al., 2017; Crawford, 2013).
2. **¿Se repara lo que más importa?** Un bache frente a una escuela o en una ruta de camión no pesa lo mismo que uno en una calle sin salida.
3. **¿Dura la reparación?** Tapar un bache no es resolver una calle.

## Pregunta de investigación

> **¿La atención de baches en Navojoa es equitativa entre colonias con distinto grado de marginación, y cómo cambiaría la prioridad si se usara un índice basado en el impacto social en vez del volumen de quejas?**

### Hipótesis

- **H1:** Las colonias con marginación alta y muy alta generan menos reportes por habitante que las de marginación baja, aunque tengan igual o más daño.
- **H2:** El tiempo hasta la reparación es mayor en las colonias de mayor marginación.
- **H3:** Un índice de prioridad basado en el impacto social (tráfico, servicios cercanos, rezago, antigüedad) reasigna una parte significativa de la atención hacia las colonias de mayor marginación, comparado con priorizar por número de quejas.

### Método (resumen)

| Paso | Qué | Datos |
|---|---|---|
| 1 | Unidad de análisis: colonia y AGEB urbana | CONAPO 2020, Marco Geoestadístico INEGI 2020 |
| 2 | Contexto de cada bache: tipo de vialidad, escuelas y hospitales cercanos | OpenStreetMap |
| 3 | Población expuesta | Censo 2020 por AGEB |
| 4 | Reportes y reparaciones | Solicitudes de transparencia, recorridos propios, reportes en la plataforma |
| 5 | Equidad: reportes por cada 1,000 habitantes y tiempo de reparación por grado de marginación (análisis de supervivencia) | Pasos 1 a 4 |
| 6 | Contrafactual: ranking por quejas frente a ranking por índice | Paso 5 |

Detalle en [metodologia.md](metodologia.md).

## Alineación con los ODS

| ODS | Meta | Cómo contribuye |
|---|---|---|
| **11** Ciudades sostenibles | 11.2, 11.3 | Infraestructura vial segura y planeación participativa |
| **10** Reducción de desigualdades | 10.2, 10.3 | Mide y corrige la desigualdad en la atención de servicios públicos |
| **9** Industria, innovación e infraestructura | 9.1 | Infraestructura de calidad y resiliente |
| **16** Paz, justicia e instituciones sólidas | 16.6, 16.7 | Instituciones transparentes y decisiones participativas |
| **3** Salud y bienestar | 3.6 | Menos siniestros viales |

## Qué *no* es este proyecto

- No sustituye al Ayuntamiento ni promete reparaciones.
- No compite con el canal oficial de reportes: lo complementa con medición y transparencia.
- No publica datos personales de quien reporta.
