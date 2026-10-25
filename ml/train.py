"""Train the on-device pothole detector and export it for the browser.

    uv run python train.py

1. Downloads the CC BY 4.0 "Potholes Detection" dataset (Roboflow, YOLO
   format) from its Hugging Face mirror, pinned to a revision.
2. Fine-tunes YOLO11n (COCO-pretrained) on train, early-stops on valid.
3. Evaluates once on the held-out test split and writes metrics.json.
4. Exports an ONNX model sized for phones to public/models/.

Everything is seeded so the run can be reproduced.
"""

import json
import shutil
from pathlib import Path

from huggingface_hub import snapshot_download
from ultralytics import YOLO

ML_DIR = Path(__file__).resolve().parent
REPO_DIR = ML_DIR.parent
DATA_DIR = ML_DIR / "datasets" / "potholes"
RUNS_DIR = ML_DIR / "runs"
MODEL_OUT = REPO_DIR / "public" / "models" / "baches-yolo11n.onnx"
METRICS_OUT = ML_DIR / "metrics.json"

DATASET_REPO = "Ryukijano/Pothole-detection-Yolov8"
DATASET_REVISION = "main"
SEED = 20261024
IMG_SIZE = 640
EPOCHS = 80


def download_dataset():
    if not (DATA_DIR / "train").exists():
        snapshot_download(
            repo_id=DATASET_REPO,
            repo_type="dataset",
            revision=DATASET_REVISION,
            local_dir=DATA_DIR,
            allow_patterns=["train/*", "valid/*", "test/*"],
        )
    # Absolute paths so training works from any directory.
    (DATA_DIR / "data.yaml").write_text(
        f"path: {DATA_DIR}\ntrain: train/images\nval: valid/images\ntest: test/images\nnames:\n  0: bache\n"
    )
    return DATA_DIR / "data.yaml"


def main():
    data = download_dataset()
    model = YOLO("yolo11n.pt")
    model.train(
        data=str(data),
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=16,
        patience=20,
        seed=SEED,
        deterministic=True,
        project=str(RUNS_DIR),
        name="baches",
        exist_ok=True,
        plots=True,
        verbose=False,
    )
    best = YOLO(RUNS_DIR / "baches" / "weights" / "best.pt")
    test = best.val(data=str(data), split="test", imgsz=IMG_SIZE, project=str(RUNS_DIR), name="test", exist_ok=True)
    metrics = {
        "dataset": DATASET_REPO,
        "split": "test",
        "images": len(list((DATA_DIR / "test" / "images").glob("*.jpg"))),
        "precision": round(float(test.box.mp), 3),
        "recall": round(float(test.box.mr), 3),
        "mAP50": round(float(test.box.map50), 3),
        "mAP50_95": round(float(test.box.map), 3),
        "imgsz": IMG_SIZE,
        "seed": SEED,
    }
    METRICS_OUT.write_text(json.dumps(metrics, indent=2) + "\n")
    print(json.dumps(metrics, indent=2))

    exported = Path(best.export(format="onnx", imgsz=IMG_SIZE, simplify=True, opset=17, dynamic=False))
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(exported, MODEL_OUT)
    print(f"model -> {MODEL_OUT.relative_to(REPO_DIR)} ({MODEL_OUT.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
