"""Download raw sources listed in data/sources.json and record their SHA-256.

Raw files are not committed (they are large); the manifest is, so anyone can
check they are working with the same inputs.
"""

import hashlib
import json
import zipfile

import requests

from .config import DATA_DIR, EXTRACT_DIR, RAW_DIR

SOURCES_FILE = DATA_DIR / "sources.json"
MANIFEST_FILE = DATA_DIR / "raw-manifest.json"
USER_AGENT = "calle-justa-data/0.1 (+https://github.com/soniaasv/proyectoSocial)"


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(url, dest):
    with requests.get(url, stream=True, timeout=600, headers={"User-Agent": USER_AGENT}) as resp:
        resp.raise_for_status()
        with open(dest, "wb") as fh:
            for chunk in resp.iter_content(1 << 20):
                fh.write(chunk)


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    sources = json.loads(SOURCES_FILE.read_text())
    manifest = {}
    for key, source in sources.items():
        if not source["file"].endswith(".zip"):
            continue  # API sources are fetched by their own step
        dest = RAW_DIR / source["file"]
        if not dest.exists():
            print(f"Downloading {key}…")
            download(source["url"], dest)
        if not zipfile.is_zipfile(dest):
            raise RuntimeError(f"{dest.name} is not a zip; the server may have returned an error page")
        with zipfile.ZipFile(dest) as zf:
            zf.extractall(EXTRACT_DIR)
        manifest[key] = {"file": source["file"], "sha256": sha256(dest)}
        print(f"  {key}: ok")
    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
