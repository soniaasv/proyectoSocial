"""Build the schools and health services layer from INEGI's DENUE.

OpenStreetMap only maps ~30 of these places in Navojoa, while DENUE lists
every registered school and clinic with coordinates. A school with several
shifts appears once per shift, so places sharing a location are merged.
"""

import geopandas as gpd
import pandas as pd

from .build_territory import write_geojson
from .config import CVE_LOC, CVE_MUN, EXTRACT_DIR, PUBLIC_DATA_DIR, WEB_CRS

DENUE_CSV = EXTRACT_DIR / "conjunto_de_datos" / "denue_inegi_26_.csv"


def classify(row):
    code, activity = row.codigo_act, row.nombre_act.lower()
    if code.startswith(("6111", "6113")):
        return "escuela"
    if code.startswith(("622", "6214")):
        return "salud"
    if code.startswith("6211") and "sector público" in activity:
        return "salud"
    return None


def main():
    denue = pd.read_csv(DENUE_CSV, dtype=str, encoding="latin-1")
    denue = denue[(denue.cve_mun == CVE_MUN) & (denue.cve_loc == CVE_LOC)].copy()
    denue["tipo"] = denue.apply(classify, axis=1)
    denue = denue[denue.tipo.notna()]
    denue["lat"] = pd.to_numeric(denue.latitud).round(4)
    denue["lon"] = pd.to_numeric(denue.longitud).round(4)
    # One record per place: shifts of the same school share coordinates.
    places = (
        denue.sort_values("nom_estab")
        .groupby(["tipo", "lat", "lon"], as_index=False)
        .agg(nombre=("nom_estab", "first"), unidades=("id", "count"))
    )
    places["nombre"] = places.nombre.str.title()
    gdf = gpd.GeoDataFrame(
        places[["nombre", "tipo", "unidades"]],
        geometry=gpd.points_from_xy(places.lon, places.lat),
        crs=WEB_CRS,
    )
    write_geojson(gdf, PUBLIC_DATA_DIR / "servicios.geojson")
    print("  servicios:", gdf.tipo.value_counts().to_dict())


if __name__ == "__main__":
    main()
