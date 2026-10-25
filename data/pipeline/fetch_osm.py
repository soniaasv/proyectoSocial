"""Fetch Navojoa's street network from OpenStreetMap.

Streets carry their hierarchy (how much traffic they likely carry) and their
surface, both used by the priority index. The raw Overpass response is kept in
data/raw so the processed layers can be rebuilt offline.
"""

import json

import geopandas as gpd
import requests
from shapely.geometry import LineString

from .build_territory import write_geojson
from .config import METRIC_CRS, PUBLIC_DATA_DIR, RAW_DIR, WEB_CRS

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
RAW_FILE = RAW_DIR / "osm_navojoa.json"
# Bounding box of Navojoa city's urban AGEBs, with a small margin (S, W, N, E).
BBOX = (26.99, -109.51, 27.12, -109.39)

# OSM highway tag -> road class used by the app (ordered by importance).
ROAD_CLASSES = {
    "trunk": "primaria",
    "primary": "primaria",
    "secondary": "secundaria",
    "tertiary": "terciaria",
    "unclassified": "local",
    "residential": "local",
    "living_street": "local",
}
PAVED = {"asphalt", "concrete", "paved", "paving_stones", "concrete:plates", "sett", "cobblestone"}
UNPAVED = {"unpaved", "dirt", "gravel", "ground", "sand", "compacted", "earth", "fine_gravel"}


def build_query():
    s, w, n, e = BBOX
    bbox = f"{s},{w},{n},{e}"
    highways = "|".join(ROAD_CLASSES)
    return f"""
    [out:json][timeout:120];
    way["highway"~"^({highways})$"]({bbox});
    out tags geom;
    """


def fetch():
    if RAW_FILE.exists():
        return json.loads(RAW_FILE.read_text())
    resp = requests.post(OVERPASS_URL, data={"data": build_query()}, timeout=180,
                         headers={"User-Agent": "calle-justa-data/0.1"})
    resp.raise_for_status()
    RAW_FILE.write_text(resp.text)
    return resp.json()


def surface_of(tags):
    surface = tags.get("surface")
    if surface in PAVED:
        return "pavimentada"
    if surface in UNPAVED:
        return "sin pavimentar"
    return "desconocida"


def main():
    data = fetch()
    print(f"  OSM snapshot: {data['osm3s']['timestamp_osm_base']}")
    streets = []
    for el in data["elements"]:
        tags = el.get("tags", {})
        highway = tags.get("highway")
        if el["type"] == "way" and highway in ROAD_CLASSES:
            coords = [(p["lon"], p["lat"]) for p in el["geometry"]]
            streets.append({
                "osmId": el["id"],
                "nombre": tags.get("name"),
                "clase": ROAD_CLASSES[highway],
                "superficie": surface_of(tags),
                "geometry": LineString(coords),
            })

    streets_gdf = gpd.GeoDataFrame(streets, crs=WEB_CRS)
    lengths = streets_gdf.to_crs(METRIC_CRS).length
    streets_gdf = streets_gdf[lengths > 5]

    write_geojson(streets_gdf, PUBLIC_DATA_DIR / "calles.geojson")
    print("  calles por clase:", streets_gdf.clase.value_counts().to_dict())
    print("  superficie:", streets_gdf.superficie.value_counts().to_dict())


if __name__ == "__main__":
    main()
