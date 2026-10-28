# Metodología

Versión 1.0 · octubre 2026 · Calle Justa

Este documento explica cómo se construyen los datos, el índice de prioridad y las medidas de equidad. Está escrito para que alguien más pueda **revisar, criticar y reproducir** el trabajo.

## 1. Pregunta de investigación

> ¿La atención de baches en Navojoa es equitativa entre zonas con distinto grado de marginación, y cómo cambiaría la prioridad si se usara un índice basado en el impacto social en vez del volumen de quejas?

| Hipótesis | Enunciado | Medida | Dónde se ve |
|---|---|---|---|
| H1 | Las zonas de mayor marginación reportan una menor proporción de sus baches | Tasa de reporte estimada con recorridos aleatorios | `/equidad` §1 |
| H2 | En esas zonas la reparación tarda más | Mediana de Kaplan-Meier del tiempo a reparación | `/equidad` §2 |
| H3 | Un índice de impacto social reasigna atención hacia esas zonas | Contrafactual de una semana de cuadrillas | `/equidad` §3 |

## 2. Datos

| Capa | Fuente | Año | Licencia | Uso |
|---|---|---|---|---|
| AGEB urbanas (polígonos) | INEGI, Marco Geoestadístico | 2020 | Libre uso INEGI | Unidad de análisis |
| Población por AGEB | INEGI, Censo de Población y Vivienda | 2020 | Libre uso INEGI | Denominadores |
| Grado de marginación por AGEB | CONAPO, Índice de marginación urbana | 2020 | Datos abiertos | Equidad, factor de rezago |
| Colonias | CONAPO, Índice de marginación por colonia | 2020 | Datos abiertos | Nombres para el público |
| Calles | OpenStreetMap (Overpass) | 2026 | ODbL 1.0 | Clase vial, superficie |
| Escuelas y salud | INEGI, DENUE | 2026 | Libre uso INEGI | Factor de servicios |
| Reportes de baches | **Escenario simulado** (ver §6) | — | CC BY 4.0 | Demostración del método |

El pipeline (`data/`) descarga cada fuente, verifica su SHA-256 y produce capas GeoJSON reproducibles con `uv run python -m pipeline`.

### Unidad de análisis: AGEB, no colonia

La capa de colonias de CONAPO no cubre toda la ciudad: alrededor del 30% de los puntos caía fuera de cualquier colonia. Las AGEB urbanas cubren toda la mancha urbana, y el 99.5% de la población vive en una AGEB con grado de marginación. Por eso **la equidad se mide por AGEB** y la colonia solo se usa para nombrar lugares.

Los cinco grados de CONAPO se agrupan en tres niveles:

| Nivel | Grados de CONAPO | AGEB | Habitantes |
|---|---|---|---|
| Baja | Muy bajo, Bajo | 56 | 98,272 |
| Media | Medio | 14 | 19,210 |
| Alta | Alto, Muy alto | 10 | 2,881 |

Solo el 2.4% de la ciudad vive en zonas de marginación alta. Separar cinco grupos dejaría muestras demasiado pequeñas.

> **Hallazgo lateral:** la marginación alta de Navojoa parece concentrarse fuera de la ciudad (localidades rurales y comunidades yoreme), algo que este estudio aún no cubre.

## 3. Índice de prioridad

Cada bache recibe un puntaje de 0 a 100. Es la suma de cinco factores normalizados entre 0 y 1, multiplicados por pesos fijos y públicos:

| Factor | Peso | Normalización |
|---|---|---|
| Severidad | 30 | leve = 1/3, moderado = 2/3, grave = 1 |
| Importancia de la vialidad | 25 | primaria = 1, secundaria = 0.75, terciaria = 0.5, local = 0.25 (OSM) |
| Escuelas y salud cerca | 15 | min(1, (escuelas + 2·unidades de salud) / 3) a menos de 300 m |
| Rezago de la zona | 15 | muy bajo = 0, bajo = 0.25, medio = 0.5, alto = 0.75, muy alto = 1 |
| Tiempo de espera | 15 | min(1, días / 60) |

Nivel: **Urgente** ≥ 70, **Alta** ≥ 50, **Media** ≥ 30 y **Baja** < 30.

**Decisiones de diseño:**

- **El número de quejas no entra en el índice.** Priorizar por quejas es precisamente la práctica cuya equidad se evalúa; incluirlo reproduciría el sesgo.
- **Cada factor produce una explicación en español** ("2 escuelas a menos de 300 m"), para que un operador entienda y pueda cuestionar el orden.
- **Los pesos son un punto de partida, no una verdad.** Se definieron por juicio experto y deben validarse con el Ayuntamiento y con vecinos. El análisis de sensibilidad de los pesos está en la hoja de ruta.

La implementación está en `src/lib/priority.ts` y tiene pruebas automatizadas.

## 4. Medición de equidad

### 4.1 Tasa de reporte (H1)

Las quejas por habitante **no** sirven para comparar zonas: mezclan cuánta voz tiene una zona con cuánto daño hay y cuánta calle le toca a cada persona. Por eso se usan **recorridos de campo en calles elegidas al azar**, donde se anota cada bache, lo haya reportado alguien o no. Entre los baches encontrados en recorridos:

$$\text{tasa de reporte}_{nivel} = \frac{\text{baches de recorrido que algún vecino ya había reportado}}{\text{baches encontrados en recorridos}}$$

Como la muestra de calles es aleatoria, esta tasa estima sin sesgo qué proporción del daño real llega al gobierno en cada nivel.

### 4.2 Tiempo hasta la reparación (H2)

Se usa el **estimador de Kaplan-Meier**. Los baches que siguen pendientes son observaciones *censuradas*: sabemos que llevan al menos *t* días esperando. Ignorarlos haría parecer las reparaciones más rápidas de lo que son; en una prueba con datos sintéticos, la mediana pasa de 20 a 10 días si se descartan (`src/lib/equity.test.ts`). Se reporta la mediana por nivel; si menos de la mitad se reparó en la ventana observada, se reporta "más de N días".

### 4.3 Contrafactual (H3)

Sobre el mismo conjunto de baches pendientes se simula una semana de trabajo (60 reparaciones) bajo dos reglas:

1. **Por quejas:** más quejas primero y, en empate, el más antiguo. Imita la práctica descrita por el Ayuntamiento.
2. **Por índice:** mayor puntaje primero.

Se compara la proporción de reparaciones que van a zonas de marginación alta y el puntaje promedio de los baches atendidos.

## 5. Calidad y limitaciones

- **Tamaños de muestra:** el nivel de marginación alta tiene pocos baches. Las cifras se publican con su *n* y deben leerse como indicativas. La siguiente versión agrega intervalos de confianza (bootstrap y Greenwood).
- **Calles de OSM:** el 56% tiene tipo de superficie y casi ninguna su estado. La clase vial es un *proxy* del tráfico, no un aforo.
- **DENUE:** registra unidades económicas; una escuela con varios turnos se cuenta una sola vez.
- **Datos de 2020:** la marginación y la población son del Censo 2020. Colonias nuevas, como las del sector oriente que nacieron de invasiones, pueden no aparecer.

## 6. Escenario simulado

Los baches de la plataforma los reportan los vecinos, lo que da datos actuales y abiertos en lugar de depender de registros del gobierno que no son públicos y pueden estar desactualizados. Mientras se reúnen los primeros reportes reales, la plataforma usa un **escenario simulado** con semilla fija (20261024). Su único propósito es demostrar el método de punta a punta. **Sus resultados no describen a Navojoa.**

| Componente | Supuesto | Parámetro |
|---|---|---|
| Daño | Baches en calles pavimentadas o de superficie desconocida, proporcionales a la longitud | ~2,460 baches |
| Daño por tráfico | Más desgaste en vialidades importantes | primaria ×1.6, secundaria ×1.4, terciaria ×1.2 |
| Daño por zona | Infraestructura más vieja en zonas marginadas | muy bajo ×0.8 … muy alto ×1.5 |
| Reporte ciudadano | Probabilidad de reportar decreciente con la marginación (Kontokosta et al., 2017; Kontokosta y Hong, 2021) | 55% (muy bajo) … 18% (muy alto) |
| Recorridos | 12% de las calles elegidas al azar; detección del 90% | — |
| Reparación | Por quejas: tiempo exponencial, más rápido con más quejas y en vialidades importantes | media de 60 días para 1 queja en calle local |
| Parches | Probabilidad de que un parche falle | 12% |

Código: `data/pipeline/simulate_reports.py`. Con `DATOS_SIMULADOS=false` la plataforma deja de mostrarlos.

## 7. Detección de baches con IA

Ver la [ficha del modelo](../ml/MODEL_CARD.md). El detector solo ayuda a confirmar que la foto muestra un bache: **nunca bloquea un reporte** y no participa en el índice.

## 8. Ética y privacidad

- No se piden cuentas ni datos personales. Las fotos se analizan en el teléfono y **no se suben**.
- El proyecto **no sustituye** el canal oficial: cada reporte termina con un mensaje listo para el WhatsApp de Reporte Ciudadano del Ayuntamiento.
- El enfoque es de colaboración con el Ayuntamiento, no de denuncia.
- Los datos derivados se publican como datos abiertos para que cualquiera pueda verificar los resultados.

## 9. Referencias

- Kontokosta, C., Hong, B. y Korsberg, K. (2017). *Equity in 311 Reporting: Understanding Socio-Spatial Differentials in the Propensity to Complain*. arXiv:1710.02452.
- Kontokosta, C. y Hong, B. (2021). *Bias in smart city governance: How socio-spatial disparities in 311 complaint behavior impact the fairness of data-driven decisions*. Sustainable Cities and Society, 64, 102503.
- Sjoberg, F. M., Mellon, J. y Peixoto, T. (2017). The Effect of Bureaucratic Responsiveness on Citizen Participation. *Public Administration Review*, 77(3), 340–351.
- Crawford, K. (2013). The Hidden Biases in Big Data. *Harvard Business Review*.
- Arya, D. et al. (2022). RDD2022: A multi-national image dataset for automatic Road Damage Detection. arXiv:2209.08538.
- CONAPO (2021). *Índice de marginación urbana 2020*.
- INEGI (2021). *Censo de Población y Vivienda 2020*.
