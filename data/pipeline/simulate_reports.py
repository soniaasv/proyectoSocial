"""Generate a SIMULATED scenario of pothole reports for Navojoa.

There is no open pothole dataset for Navojoa yet (we requested the municipal
records through transparency requests). Until real data arrives, the app runs
on this scenario so the methodology can be demonstrated end to end. Every
record is flagged `simulado: true` and the UI labels it as such.

Generative model (assumptions documented in docs/metodologia.md):

1. True potholes appear on paved streets at a rate that grows with traffic
   (road class) and with the colonia's marginalization (older infrastructure).
2. Citizens report a pothole with a probability that falls as marginalization
   rises, following the reporting gap documented for complaint systems
   (Kontokosta et al. 2017; Sjoberg et al. 2017).
3. Field surveys ("recorridos") on a few routes find potholes regardless of
   whether anyone complained, which is how the bias can be measured.
4. The repair policy is complaint-driven, as the municipality describes it:
   more complaints and busier streets get repaired sooner.
"""

import json

import geopandas as gpd
import numpy as np

from .config import APP_DATA_DIR, METRIC_CRS, PUBLIC_DATA_DIR, WEB_CRS

SEED = 20261024
HORIZON_DAYS = 150
TARGET_TRUE_POTHOLES = 2400

CLASS_DAMAGE = {"primaria": 1.6, "secundaria": 1.4, "terciaria": 1.2, "local": 1.0}
GRADE_DAMAGE = {"Muy bajo": 0.8, "Bajo": 0.9, "Medio": 1.1, "Alto": 1.3, "Muy alto": 1.5}

REPORT_PROBABILITY = {"Muy bajo": 0.55, "Bajo": 0.45, "Medio": 0.35, "Alto": 0.25, "Muy alto": 0.18}
EXTRA_REPORTS_MEAN = {"Muy bajo": 1.2, "Bajo": 0.9, "Medio": 0.6, "Alto": 0.4, "Muy alto": 0.3}
CLASS_REPORT_BOOST = {"primaria": 1.3, "secundaria": 1.2, "terciaria": 1.1, "local": 1.0}

# Complaint-driven repair: mean days to repair for a single complaint on a local street.
BASE_REPAIR_DAYS = 60
CLASS_REPAIR_SPEED = {"primaria": 2.2, "secundaria": 1.7, "terciaria": 1.3, "local": 1.0}
UNREPORTED_REPAIR_SPEED = 0.25
PATCH_FAILURE_RATE = 0.12

SURVEY_SHARE = 0.12
SURVEY_DETECTION = 0.9


def load_streets():
    streets = gpd.read_file(PUBLIC_DATA_DIR / "calles.geojson")
    streets = streets[streets.superficie != "sin pavimentar"].to_crs(METRIC_CRS)
    colonias = gpd.read_file(PUBLIC_DATA_DIR / "colonias.geojson").to_crs(METRIC_CRS)
    midpoints = streets.copy()
    midpoints["geometry"] = streets.geometry.interpolate(0.5, normalized=True)
    joined = gpd.sjoin(midpoints, colonias[["grado", "geometry"]], how="left", predicate="within")
    joined = joined[~joined.index.duplicated()]
    streets["grado"] = joined.grado.fillna("Bajo")
    streets["largo"] = streets.length
    return streets


def sample_points(streets, rng):
    rate = streets.largo * streets.clase.map(CLASS_DAMAGE) * streets.grado.map(GRADE_DAMAGE)
    expected = rate / rate.sum() * TARGET_TRUE_POTHOLES
    counts = rng.poisson(expected)
    rows = []
    for (_, street), n in zip(streets.iterrows(), counts):
        for _ in range(n):
            point = street.geometry.interpolate(rng.uniform(0, 1), normalized=True)
            rows.append({"geometry": point, "clase": street.clase, "grado": street.grado, "osmId": street.osmId})
    return gpd.GeoDataFrame(rows, crs=METRIC_CRS)


def simulate(potholes, streets, rng):
    surveyed_streets = set(rng.choice(streets.osmId.unique(), int(SURVEY_SHARE * streets.osmId.nunique()), replace=False))
    records = []
    for _, p in potholes.iterrows():
        report_p = min(0.95, REPORT_PROBABILITY[p.grado] * CLASS_REPORT_BOOST[p.clase])
        reported = rng.random() < report_p
        surveyed = p.osmId in surveyed_streets and rng.random() < SURVEY_DETECTION
        if not (reported or surveyed):
            continue
        supports = 1 + rng.poisson(EXTRA_REPORTS_MEAN[p.grado]) if reported else 0

        age = int(rng.integers(0, HORIZON_DAYS))
        speed = CLASS_REPAIR_SPEED[p.clase] * (1 + 0.5 * max(supports - 1, 0)) if reported else UNREPORTED_REPAIR_SPEED
        days_to_repair = rng.exponential(BASE_REPAIR_DAYS / speed)

        if days_to_repair < age:
            status = "reparado"
            repaired_ago = int(age - days_to_repair)
            # A failed patch reopens the pothole; the repair date is kept.
            reopened = bool(rng.random() < PATCH_FAILURE_RATE)
            if reopened:
                status = "pendiente"
        else:
            status = "en_proceso" if rng.random() < 0.1 else "pendiente"
            repaired_ago, reopened = None, False

        severity = int(rng.choice([1, 2, 3], p=[0.35, 0.4, 0.25] if p.grado in ("Alto", "Muy alto") else [0.45, 0.38, 0.17]))
        records.append({
            "geometry": p.geometry,
            "severidad": severity,
            "fuente": "ciudadano" if reported else "recorrido",
            "apoyos": supports,
            "creadoHaceDias": age,
            "estado": status,
            "reparadoHaceDias": repaired_ago,
            "reabierto": reopened,
        })
    return gpd.GeoDataFrame(records, crs=METRIC_CRS)


def main():
    rng = np.random.default_rng(SEED)
    streets = load_streets()
    potholes = sample_points(streets, rng)
    reports = simulate(potholes, streets, rng).to_crs(WEB_CRS)
    reports = reports.sample(frac=1, random_state=SEED).reset_index(drop=True)

    out = []
    for i, r in reports.iterrows():
        out.append({
            "id": f"SIM-{i + 1:04d}",
            "lat": round(r.geometry.y, 6),
            "lng": round(r.geometry.x, 6),
            "severidad": r.severidad,
            "fuente": r.fuente,
            "apoyos": int(r.apoyos),
            "creadoHaceDias": int(r.creadoHaceDias),
            "estado": r.estado,
            "reparadoHaceDias": None if r.reparadoHaceDias is None or np.isnan(r.reparadoHaceDias) else int(r.reparadoHaceDias),
            "reabierto": bool(r.reabierto),
            "simulado": True,
        })
    APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = APP_DATA_DIR / "reportes-simulados.json"
    path.write_text(json.dumps({"semilla": SEED, "reportes": out}, ensure_ascii=False, separators=(",", ":")))
    print(f"  true potholes: {len(potholes)} | in platform: {len(out)}")
    print("  by source:", reports.fuente.value_counts().to_dict())
    print("  by status:", reports.estado.value_counts().to_dict())


if __name__ == "__main__":
    main()
