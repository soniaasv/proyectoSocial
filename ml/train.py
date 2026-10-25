"""Train the on-device pothole detector and export it for the browser.

    uv run python prepare_data.py   # merge and deduplicate the open datasets
    uv run python train.py          # also runs calibrate.py at the end

1. Fine-tunes YOLO11n (COCO-pretrained) on the merged dataset, early-stops
   on its validation split.
2. Evaluates once on the held-out test split, and on the subset of the
   original 92 test photos used for model v0, and writes metrics.json.
3. Exports an ONNX model sized for phones to public/models/.

Everything is seeded so the run can be reproduced.
"""

import json
import shutil
from pathlib import Path

import torch
from ultralytics import YOLO

import calibrate

ML_DIR = Path(__file__).resolve().parent
REPO_DIR = ML_DIR.parent
DATA_DIR = ML_DIR / "datasets" / "merged"
RUNS_DIR = ML_DIR / "runs"
MODEL_OUT = REPO_DIR / "public" / "models" / "baches-yolo11n.onnx"
METRICS_OUT = ML_DIR / "metrics.json"

SEED = 20261024
IMG_SIZE = 640
EPOCHS = 50
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"


def evaluar(model, data, split, nombre):
    r = model.val(data=str(data), split=split, imgsz=IMG_SIZE, device=DEVICE, project=str(RUNS_DIR), name=nombre, exist_ok=True)
    return {
        "precision": round(float(r.box.mp), 3),
        "recall": round(float(r.box.mr), 3),
        "mAP50": round(float(r.box.map50), 3),
        "mAP50_95": round(float(r.box.map), 3),
    }


def main():
    if not (DATA_DIR / "data.yaml").exists():
        raise SystemExit("Run prepare_data.py first")
    model = YOLO("yolo11n.pt")
    model.train(
        data=str(DATA_DIR / "data.yaml"),
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=16,
        patience=15,
        device=DEVICE,
        seed=SEED,
        deterministic=True,
        # Harsh desert light and dusty roads: widen brightness/saturation jitter.
        hsv_s=0.8,
        hsv_v=0.5,
        degrees=5,
        cos_lr=True,
        close_mosaic=10,
        project=str(RUNS_DIR),
        name="baches-v1",
        exist_ok=True,
        plots=True,
        verbose=False,
    )
    best = YOLO(RUNS_DIR / "baches-v1" / "weights" / "best.pt")
    dataset = json.loads((ML_DIR / "dataset.json").read_text())
    metrics = {
        "version": "v1",
        "device": DEVICE,
        "seed": SEED,
        "imgsz": IMG_SIZE,
        "dataset": dataset,
        "test": evaluar(best, DATA_DIR / "data.yaml", "test", "test-v1"),
        # Same photos as model v0's test set (minus near-duplicates), for comparison.
        "test_v0": evaluar(best, DATA_DIR / "data_test_v0.yaml", "val", "test-v0-subset"),
    }
    METRICS_OUT.write_text(json.dumps(metrics, indent=2) + "\n")
    print(json.dumps(metrics, indent=2))

    exported = Path(best.export(format="onnx", imgsz=IMG_SIZE, simplify=True, opset=17, dynamic=False))
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(exported, MODEL_OUT)
    print(f"model -> {MODEL_OUT.relative_to(REPO_DIR)} ({MODEL_OUT.stat().st_size / 1e6:.1f} MB)")
    calibrate.main()


if __name__ == "__main__":
    main()
