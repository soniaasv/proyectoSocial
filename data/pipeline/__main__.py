"""Run the whole pipeline: `uv run python -m pipeline`."""

from . import build_services, build_territory, download, fetch_osm, simulate_reports

STEPS = [download, build_territory, fetch_osm, build_services, simulate_reports]

for step in STEPS:
    print(f"== {step.__name__.split('.')[-1]}")
    step.main()
