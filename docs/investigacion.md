# Investigación previa (octubre 2026)

Resumen de lo investigado antes de escribir código. Cada afirmación lleva fuente. Lo marcado como **no verificado** queda pendiente.

## 1. Lo que ya existe

| Solución | Qué hace | Lección para nosotros |
|---|---|---|
| RoadBotics (Michelin) | Celular en el parabrisas + IA califica el pavimento. ~USD 50 por milla ([South Bend](https://docs.southbendin.gov/WebLink/0/doc/118446/Page7.aspx)) | La detección se vende, pero es cara para ciudades medianas |
| Vialytics | Suscripción por kilómetro, más de 500 municipios ([Techleap](https://finder.techleap.nl/news/feed/vialytics-secures-8m-for-ai-road-management)) | El modelo del celular en un vehículo funciona |
| Vaisala RoadAI | ~CAD 40,000 al año en Nanaimo ([NS News](https://www.nsnews.com/bc-news/island-cities-turn-to-ai-to-help-fix-roads-11135326)) | Fuera del presupuesto de Navojoa |
| FixMyStreet | Reporte ciudadano de código abierto, Open311 ([mySociety](https://www.mysociety.org/community/fixmystreet/)) | Estándar abierto que conviene seguir |
| Street Bump (Boston) | Acelerómetro del celular; detectaba más en zonas ricas ([Crawford 2013](https://socialmediacollective.org/2013/04/03/the-hidden-biases-in-big-data/)) | **El sesgo de quién reporta es el problema central** |
| Bachómetro (Hermosillo) | Consulta de folios y calendario por colonia ([El Imparcial](https://www.elimparcial.com/son/hermosillo/2026/01/30/programa-de-bacheo-intensivo-en-hermosillo-como-funciona-cuando-llegara-a-tu-calle-y-cuantas-calles-ya-fueron-reparadas/)) | Referente regional; sin priorización formal |
| Reporte Ciudadano Navojoa | WhatsApp 642 157 1356 desde 2023, ticket con 3 estatus ([navojoa.gob.mx](https://www.navojoa.gob.mx/activa-ayuntamiento-de-navojoa-reporte-ciudadano-en-whatsapp/)) | **Ya hay canal de reporte; no competir con él** |

## 2. Evidencia clave

- **Responder aumenta la participación.** En FixMyStreet (399,364 reportes), cuando se resuelve el primer reporte de alguien, sube mucho la probabilidad de que vuelva a reportar (Sjoberg, Mellon y Peixoto, 2017, *Public Administration Review*; [ORA](https://ora.ox.ac.uk/objects/uuid:2bd169fd-0b27-46e4-8b81-1ccfccf7c55a)).
- **Los sistemas de quejas tipo 311 tienen sesgo socioeconómico.** En Nueva York, la propensión a quejarse varía con el nivel socioeconómico y el acceso a internet (Kontokosta, Hong y Korsberg, 2017, [arXiv 1710.02452](https://arxiv.org/abs/1710.02452)). En Kansas City, los barrios de bajos ingresos reportan menos los problemas de sus calles aunque los necesitan más (Kontokosta y Hong, 2021, *Sustainable Cities and Society* 64, [NYU Marron](https://marroninstitute.nyu.edu/papers/bias-in-smart-city-governance-how-socio-spatial-disparities-in-311-complaint-behavior-impact-the-fairness-of-data-driven-decisions)).
- **El cuello de botella es el presupuesto, no la detección** ([NC Newsline 2026](https://ncnewsline.com/2026/05/21/repub/those-potholes-in-your-street-reveal-a-money-problem-for-cities-and-states/)). Por eso, priorizar bien vale más que detectar más.
- **No existe un dataset público de baches en México.** RDD2022 (47,420 imágenes) cubre Japón, India, República Checa, Noruega, EE. UU. y China ([arXiv](https://arxiv.org/abs/2209.08538v1)).
- **Los términos de Google Street View prohíben usarlo para entrenar modelos de ML** ([términos](https://cloud.google.com/terms/maps-platform/maps-analytics-service-terms)). Queda descartado.

## 3. Alternativas evaluadas

| Opción | Puntaje (de 40) | Decisión |
|---|---|---|
| Detección de baches con IA | 22 | Descartada como enfoque principal: ya está resuelta |
| **Baches con enfoque de equidad y transparencia** | 28 | **Elegida**: el problema más visible para el público y con una pregunta de investigación original |
| Equidad del servicio de agua | 31 | Siguiente módulo candidato (Oomapasn declaró que su problema es la red) |
| Calor y vulnerabilidad | 34 | Mejores datos abiertos; módulo futuro |

Elegimos baches porque es el problema que **cualquier persona entiende sin explicación**, y el enfoque de equidad le da profundidad académica. La arquitectura es modular para sumar agua y calor después ([ADR-0001](adr/0001-enfoque-baches-equidad.md)).

## 4. Pendiente de verificar

- Metodología del estudio de 19,208 baches de la SIUE (pedirla por transparencia).
- Si Navojoa está en la muestra de la ENSU.
- Cobertura de Mapillary en Navojoa.
- Licencia exacta de RDD2022.
