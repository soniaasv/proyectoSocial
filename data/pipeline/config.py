"""Shared paths and constants for the data pipeline."""

from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = DATA_DIR.parent
RAW_DIR = DATA_DIR / "raw"
EXTRACT_DIR = RAW_DIR / "extracted"
PUBLIC_DATA_DIR = REPO_DIR / "public" / "data"
APP_DATA_DIR = REPO_DIR / "src" / "data"

# INEGI keys for Navojoa, Sonora (city = locality 0001).
CVE_ENT = "26"
CVE_MUN = "042"
CVE_LOC = "0001"

# Output CRS for the web (WGS84) and a metric CRS for distances (UTM 12N).
WEB_CRS = "EPSG:4326"
METRIC_CRS = "EPSG:32612"

# Coordinates are rounded to ~1 m to keep the GeoJSON small.
COORD_PRECISION = 5
