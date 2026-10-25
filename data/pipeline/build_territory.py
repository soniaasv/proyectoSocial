"""Build the territorial units for Navojoa city: colonias and urban AGEBs.

- Colonias (CONAPO 2020): name, population and marginalization grade. This is
  the unit people recognize, so the app uses it for the public view.
- AGEBs (INEGI 2020): census population and housing indicators joined with
  CONAPO's AGEB marginalization index. Used for the statistical analysis.
"""

import json
import re

import geopandas as gpd
import pandas as pd

from .config import (
    COORD_PRECISION,
    CVE_ENT,
    CVE_LOC,
    CVE_MUN,
    EXTRACT_DIR,
    METRIC_CRS,
    PUBLIC_DATA_DIR,
    WEB_CRS,
)

# CONAPO grades, ordered from least to most marginalized.
GRADES = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"]
SIMPLIFY_METERS = 3


def normalize_grade(value):
    value = (value or "").strip().capitalize()
    return value if value in GRADES else None


def clean_name(name):
    """CONAPO title-cases names, which breaks roman numerals ("Ii" -> "II")."""
    return re.sub(r"\b([IVX][ivx]+)\b", lambda m: m.group(1).upper(), name.strip())


def to_web(gdf):
    gdf = gdf.to_crs(METRIC_CRS)
    gdf["geometry"] = gdf.geometry.simplify(SIMPLIFY_METERS, preserve_topology=True)
    return gdf.to_crs(WEB_CRS)


def write_geojson(gdf, path):
    """Write compact GeoJSON with rounded coordinates."""
    data = json.loads(gdf.to_json(drop_id=True))

    def round_coords(coords):
        if isinstance(coords[0], (int, float)):
            return [round(c, COORD_PRECISION) for c in coords]
        return [round_coords(c) for c in coords]

    for feature in data["features"]:
        feature["geometry"]["coordinates"] = round_coords(feature["geometry"]["coordinates"])
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    print(f"  wrote {path.relative_to(path.parents[2])} ({path.stat().st_size / 1024:.0f} KB, {len(gdf)} features)")


def build_colonias():
    gdf = gpd.read_file(EXTRACT_DIR / "colonias_imc2020.shp")
    gdf = gdf[(gdf.CVE_MUN == CVE_ENT + CVE_MUN) & (gdf.CVE_LOC == CVE_ENT + CVE_MUN + CVE_LOC)].copy()
    gdf["grado"] = gdf.GM_2020.map(normalize_grade)
    gdf = gdf[gdf.grado.notna()]
    out = gpd.GeoDataFrame(
        {
            "id": gdf.CVE_COL,
            "nombre": gdf.COLONIA.map(clean_name),
            "cp": gdf.CP,
            "tipo": gdf.CLASIF.str.strip(),
            "poblacion": gdf.POBTOT.round().astype(int),
            "grado": gdf.grado,
            "indice": gdf.IMN_2020.round(4),
            "sinInternet": gdf.OVSINT.round(1),
        },
        geometry=gdf.geometry,
        crs=gdf.crs,
    )
    return to_web(out).sort_values("nombre")


def build_agebs():
    shapes = gpd.read_file(EXTRACT_DIR / "conjunto_de_datos" / "26a.shp")
    shapes = shapes[(shapes.CVE_MUN == CVE_MUN) & (shapes.CVE_LOC == CVE_LOC)]

    census = pd.read_csv(
        EXTRACT_DIR / "ageb_mza_urbana_26_cpv2020" / "conjunto_de_datos" / "conjunto_de_datos_ageb_urbana_26_cpv2020.csv",
        dtype=str,
    )
    # AGEB totals are the rows with MZA == "000" and a real AGEB key.
    census = census[(census.MUN == CVE_MUN) & (census.LOC == CVE_LOC) & (census.MZA == "000") & (census.AGEB != "0000")]
    census = census.assign(
        CVEGEO=CVE_ENT + CVE_MUN + CVE_LOC + census.AGEB,
        poblacion=pd.to_numeric(census.POBTOT, errors="coerce"),
        viviendas=pd.to_numeric(census.VIVPAR_HAB, errors="coerce"),
        vehiculo=pd.to_numeric(census.VPH_AUTOM, errors="coerce"),
    )[["CVEGEO", "poblacion", "viviendas", "vehiculo"]]

    imu = pd.read_excel(EXTRACT_DIR / "IMU_2020.xls", header=5, dtype=str, engine="calamine")
    imu = imu[(imu.ENT == CVE_ENT) & (imu.MUN == CVE_MUN) & (imu.LOC == CVE_LOC)]
    imu = imu.assign(grado=imu.GM_2020.map(normalize_grade), indice=pd.to_numeric(imu.IMN_2020))
    imu = imu.rename(columns={"CVE_AGEB": "CVEGEO"})[["CVEGEO", "grado", "indice"]]

    gdf = shapes.merge(census, on="CVEGEO", how="left").merge(imu, on="CVEGEO", how="left")
    gdf["pctVehiculo"] = (100 * gdf.vehiculo / gdf.viviendas).round(1)
    gdf = gdf.rename(columns={"CVEGEO": "id"})[
        ["id", "poblacion", "viviendas", "pctVehiculo", "grado", "indice", "geometry"]
    ]
    gdf["indice"] = gdf.indice.round(4)
    return to_web(gdf)


def main():
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    colonias = build_colonias()
    write_geojson(colonias, PUBLIC_DATA_DIR / "colonias.geojson")
    agebs = build_agebs()
    write_geojson(agebs, PUBLIC_DATA_DIR / "agebs.geojson")
    print("  colonias por grado:", colonias.grado.value_counts().to_dict())
    print("  población en colonias:", int(colonias.poblacion.sum()), "| en AGEBs:", int(agebs.poblacion.sum()))


if __name__ == "__main__":
    main()
