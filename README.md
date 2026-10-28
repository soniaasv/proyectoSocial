# Calle Justa

**Observatorio ciudadano de baches de Navojoa, Sonora.**

> 19,208 baches. ¿Quién espera más?

Calle Justa mide si las calles de Navojoa se reparan donde más se necesita, y no solo donde más se queja la gente. Combina datos públicos (INEGI, CONAPO, OpenStreetMap), un **índice de prioridad explicable** y un **tablero de equidad**, con todos los datos abiertos.

## El problema

En junio de 2026, el 83.4% de las personas de 18 años o más en 91 ciudades de México señalaron los baches como uno de los principales problemas de su ciudad (INEGI, ENSU). En Navojoa, el Ayuntamiento contó 19,208 baches y tapó más de 10,500 en un año. Prioriza según las solicitudes ciudadanas, pero la investigación muestra que **no todas las zonas se quejan igual**: donde hay más rezago se reporta menos, y por eso se espera más.

Detectar baches ya está resuelto. Lo que falta es **priorizar con equidad y transparentar la atención**. Ver [docs/problema.md](docs/problema.md).

## Qué hace

| Sección | Para quién | Qué ofrece |
|---|---|---|
| **Mapa** | Vecinos | Baches por prioridad, capas de marginación, escuelas y salud, y la razón de cada prioridad |
| **Reportar** | Vecinos | Foto revisada por IA **en el celular** (no se sube), ubicación, gravedad y envío al WhatsApp oficial del Ayuntamiento |
| **Equidad** | Público, prensa, academia | Quién reporta, quién espera más (Kaplan-Meier) y qué cambiaría con el índice |
| **Panel** | Ayuntamiento | Lista de trabajo priorizada, filtros y exportación a CSV |
| **Datos** | Todos | Descargas CSV y GeoJSON, API y cómo reproducirlo todo |

> **Datos simulados:** los baches los reportarán los vecinos en la plataforma. Mientras se reúnen los primeros reportes reales, los reportes son un **escenario simulado** documentado en la [metodología](docs/metodologia.md). Las calles, escuelas, población y marginación sí son reales.

## Alineación con los ODS

11 Ciudades sostenibles · 10 Reducción de desigualdades · 9 Infraestructura · 16 Instituciones sólidas · 3 Salud

## Arquitectura

```
data/  (Python, uv)                 ml/  (Python, uv)
  INEGI · CONAPO · DENUE · OSM        YOLO11n → ONNX
        │ pipeline reproducible             │
        ▼                                   ▼
  public/data/*.geojson            public/models/*.onnx
        │                                   │
        ▼                                   ▼
Next.js 16 en Vercel ───────────────────────────────────────────
  Páginas estáticas · /api/* (contexto, reportes, CSV)
  Mapa MapLibre + OpenFreeMap (sin API key)
  IA en el navegador con onnxruntime-web (WASM)
  Postgres opcional (Neon o Supabase) vía DATABASE_URL
```

- **Lógica de dominio pura y probada** (`src/lib`): índice de prioridad, contexto geográfico, Kaplan-Meier, contrafactual y post-procesamiento YOLO.
- **Modo demostración:** sin base de datos, la app funciona completa y no finge guardar reportes; los guarda en el dispositivo y lo dice.
- **Costo inicial: $0** (Vercel Hobby + OpenFreeMap). Con base de datos y uso real: ~USD 25–45 al mes.

## Desarrollo

Requisitos: Node 22+, pnpm 10 y [uv](https://docs.astral.sh/uv/) (solo para datos y ML).

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm check          # lint + typecheck + pruebas
pnpm build
```

Regenerar los datos y el modelo:

```bash
cd data && uv run python -m pipeline     # capas geográficas y escenario simulado
cd ml && uv run python train.py          # entrena y exporta el detector
```

### Variables de entorno

Ver [.env.example](.env.example). Todas son opcionales.

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Postgres para guardar reportes reales (correr `db/migrations/001_reportes.sql`) |
| `ADMIN_TOKEN` | Token para que operadores cambien el estado de un reporte |
| `DATOS_SIMULADOS` | `false` para ocultar el escenario simulado |
| `NEXT_PUBLIC_SITE_URL` | URL pública, para metadatos y sitemap |

## Despliegue en Vercel

1. Importar el repositorio en Vercel (framework: Next.js, sin configuración extra).
2. (Opcional) Agregar Neon desde el Marketplace de Vercel; se inyecta `DATABASE_URL`. Correr la migración.
3. (Opcional) Definir `ADMIN_TOKEN`.

## Documentación

- [Definición del problema e hipótesis](docs/problema.md)
- [Investigación previa](docs/investigacion.md)
- [Metodología completa](docs/metodologia.md)
- [Decisiones de arquitectura (ADR)](docs/adr/)
- [Pipeline de datos](data/README.md)
- [Ficha del modelo de IA](ml/MODEL_CARD.md)

## Equipo

- **Sonia Soto Valenzuela**: líder del proyecto, ciencia de datos.
- **Chema**: ingeniería de software e IA.

## Licencias

- Código: [MIT](LICENSE).
- Modelo de detección: AGPL-3.0, porque deriva de pesos de Ultralytics (ver la ficha del modelo).
- Datos derivados: según su fuente (INEGI y CONAPO con atribución; calles bajo ODbL). Reportes: CC BY 4.0.
