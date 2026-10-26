# Pipeline de datos

Construye las capas que usa la aplicación a partir de fuentes públicas. Todo es reproducible con un solo comando.

```bash
cd data
uv sync
uv run python -m pipeline
```

## Pasos

| Paso | Qué hace | Salida |
|---|---|---|
| `download` | Descarga INEGI, CONAPO y DENUE, verifica que sean zip y registra su SHA-256 | `raw/` (no se versiona), `raw-manifest.json` |
| `build_territory` | Colonias (CONAPO 2020) y AGEB urbanas (INEGI 2020) de la ciudad de Navojoa, con población y grado de marginación | `public/data/colonias.geojson`, `public/data/agebs.geojson` |
| `fetch_osm` | Red de calles de OpenStreetMap con clase vial y superficie | `public/data/calles.geojson` |
| `build_services` | Escuelas y unidades de salud públicas del DENUE | `public/data/servicios.geojson` |
| `simulate_reports` | **Escenario simulado** de reportes para demostrar la metodología | `src/data/reportes-simulados.json` |

Las fuentes, quién las publica y sus licencias están en [`sources.json`](sources.json).

## Sobre los datos simulados

Los baches los reportan los vecinos en la plataforma. Mientras se reúnen los primeros reportes reales, la app usa un escenario **simulado** con semilla fija (`20261024`). Cada registro lleva `simulado: true` y la interfaz lo indica en todo momento.

El modelo generativo y sus supuestos están en el docstring de [`simulate_reports.py`](pipeline/simulate_reports.py) y en [`docs/metodologia.md`](../docs/metodologia.md). **Los resultados del escenario simulado no describen a Navojoa**: sirven para probar que el método funciona.

## Licencias de los datos derivados

- Capas de INEGI y CONAPO: Términos de Libre Uso de la Información del INEGI y datos abiertos del Gobierno de México, con atribución.
- Calles: © colaboradores de OpenStreetMap, ODbL 1.0. La capa derivada `calles.geojson` se distribuye bajo ODbL.
