"""Pick the confidence threshold the app uses, on the validation split.

    uv run python calibrate.py

The threshold that maximizes F1 on validation photos is written, with the
test metrics, to src/data/modelo.json, which the web app reads. Calibrating
on validation (never on test) keeps the test metrics honest.
"""

import json
from pathlib import Path

import numpy as np
import torch
from ultralytics import YOLO

ML_DIR = Path(__file__).resolve().parent
REPO_DIR = ML_DIR.parent
DATA = ML_DIR / "datasets" / "merged" / "data.yaml"
WEIGHTS = ML_DIR / "runs" / "baches-v1" / "weights" / "best.pt"
OUT = REPO_DIR / "src" / "data" / "modelo.json"
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"


def main():
    model = YOLO(WEIGHTS)
    r = model.val(data=str(DATA), split="val", imgsz=640, conf=0.001, device=DEVICE, plots=False, verbose=False)
    f1 = np.asarray(r.box.f1_curve).mean(0)
    px = np.asarray(r.box.px)
    best = int(f1.argmax())
    umbral = round(float(px[best]), 3)

    metrics = json.loads((ML_DIR / "metrics.json").read_text())
    metrics["umbral"] = {"confianza": umbral, "f1_validacion": round(float(f1[best]), 3)}
    (ML_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2) + "\n")

    modelo = {
        "version": metrics["version"],
        "archivo": "/models/baches-yolo11n.onnx",
        "umbral": umbral,
        "prueba": metrics["test"],
        "imagenesEntrenamiento": metrics["dataset"]["train"],
    }
    OUT.write_text(json.dumps(modelo, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(modelo, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
