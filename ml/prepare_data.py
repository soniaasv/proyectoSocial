"""Merge open pothole datasets into one YOLO dataset without leakage.

    uv run python prepare_data.py

Sources (all Roboflow Universe exports, single "pothole" concept):
- Ryukijano/Pothole-detection-Yolov8   (YOLO, CC BY 4.0)  300 images
- manot/pothole-segmentation           (COCO, CC BY 4.0)  819 images
- manot/pothole-segmentation2          (COCO, CC BY 4.0)  665 images
- rupesh002/pothole-detection-dataset  (YOLO, MIT)        715 images

Pothole datasets on Roboflow often re-upload the same photos, so a photo in
one dataset's test split can sit in another's train split. Images are
grouped by perceptual hash (near-duplicates share a group) and whole groups
are assigned to a split. Groups containing one of the original Ryukijano
test images go to test, so results stay comparable with model v0.
"""

import hashlib
import json
import shutil
import zipfile
from collections import Counter
from pathlib import Path

from huggingface_hub import hf_hub_download, snapshot_download
from PIL import Image

ML_DIR = Path(__file__).resolve().parent
RAW = ML_DIR / "datasets" / "raw"
OUT = ML_DIR / "datasets" / "merged"
SEED = "20261024"
HAMMING_MAX = 6
DUP_BOX_IOU = 0.9


def download():
    snapshot_download("Ryukijano/Pothole-detection-Yolov8", repo_type="dataset",
                      local_dir=RAW / "ryukijano", allow_patterns=["train/*", "valid/*", "test/*"])
    for repo in ("manot/pothole-segmentation", "manot/pothole-segmentation2"):
        dest = RAW / repo.replace("/", "_")
        for split in ("train", "valid", "test"):
            if not (dest / split).exists():
                z = hf_hub_download(repo, f"data/{split}.zip", repo_type="dataset")
                zipfile.ZipFile(z).extractall(dest / split)
    if not (RAW / "rupesh").exists():
        z = hf_hub_download("rupesh002/pothole-detection-dataset", "pothole_dataset.zip", repo_type="dataset")
        zipfile.ZipFile(z).extractall(RAW / "rupesh")


def read_yolo(images_dir, source, split):
    items = []
    for img in sorted(images_dir.glob("*.jpg")):
        label = img.parent.parent / "labels" / (img.stem + ".txt")
        boxes = []
        if label.exists():
            for line in label.read_text().split("\n"):
                parts = line.split()
                if len(parts) == 5:
                    _, cx, cy, w, h = map(float, parts)
                    boxes.append((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2))
        items.append({"path": img, "boxes": boxes, "source": source, "split": split})
    return items


def read_coco(split_dir, source, split):
    data = json.loads((split_dir / "_annotations.coco.json").read_text())
    names = {c["id"]: c["name"] for c in data["categories"]}
    by_image = {im["id"]: (im, []) for im in data["images"]}
    for a in data["annotations"]:
        if "pothole" not in names[a["category_id"]]:
            continue
        im, boxes = by_image[a["image_id"]]
        x, y, w, h = a["bbox"]
        boxes.append((x / im["width"], y / im["height"], (x + w) / im["width"], (y + h) / im["height"]))
    return [{"path": split_dir / im["file_name"], "boxes": boxes, "source": source, "split": split}
            for im, boxes in by_image.values()]


def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union > 0 else 0


def dedupe_boxes(boxes):
    """Roboflow COCO exports repeat boxes under parent and child classes."""
    kept = []
    for box in boxes:
        box = tuple(min(1.0, max(0.0, v)) for v in box)
        if box[2] - box[0] > 0.002 and box[3] - box[1] > 0.002 and all(iou(box, k) < DUP_BOX_IOU for k in kept):
            kept.append(box)
    return kept


def dhash(img):
    px = list(img.convert("L").resize((9, 8), Image.Resampling.LANCZOS).tobytes())
    return sum(1 << i for i in range(64) if px[(i // 8) * 9 + i % 8] > px[(i // 8) * 9 + i % 8 + 1])


def hashes(path):
    """dHash of the image and of its mirror: Roboflow augments with horizontal flips."""
    img = Image.open(path)
    return dhash(img), dhash(img.transpose(Image.Transpose.FLIP_LEFT_RIGHT))


def group_near_duplicates(items):
    parent = list(range(len(items)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(len(items)):
        h = items[i]["hash"]
        for j in range(i + 1, len(items)):
            hj, hj_flip = items[j]["hash"], items[j]["hash_flip"]
            if min((h ^ hj).bit_count(), (h ^ hj_flip).bit_count()) <= HAMMING_MAX:
                parent[find(i)] = find(j)
    return [find(i) for i in range(len(items))]


def split_of_group(members):
    if any(m["source"] == "ryukijano" and m["split"] == "test" for m in members):
        return "test"
    key = int(hashlib.sha256((SEED + str(members[0]["path"].name)).encode()).hexdigest(), 16) % 10
    return "test" if key == 0 else "valid" if key == 1 else "train"


def main():
    download()
    items = []
    for split in ("train", "valid", "test"):
        items += read_yolo(RAW / "ryukijano" / split / "images", "ryukijano", split)
        items += read_coco(RAW / "manot_pothole-segmentation" / split, "manot-road-damage", split)
        items += read_coco(RAW / "manot_pothole-segmentation2" / split, "manot-pothole", split)
    rupesh = next((RAW / "rupesh").iterdir())
    for split in ("train", "valid"):
        items += read_yolo(rupesh / split / "images", "rupesh", split)

    for it in items:
        it["boxes"] = dedupe_boxes(it["boxes"])
        it["hash"], it["hash_flip"] = hashes(it["path"])
    print(f"images read: {len(items)}  by source: {dict(Counter(i['source'] for i in items))}")

    roots = group_near_duplicates(items)
    groups = {}
    for it, root in zip(items, roots):
        groups.setdefault(root, []).append(it)
    print(f"unique photos (groups): {len(groups)}  near-duplicates removed: {len(items) - len(groups)}")

    if OUT.exists():
        shutil.rmtree(OUT)
    stats = Counter()
    original_test = []
    for members in groups.values():
        split = split_of_group(members)
        # One representative per group; prefer the one with the most boxes.
        rep = max(members, key=lambda m: len(m["boxes"]))
        name = hashlib.sha1(str(rep["path"]).encode()).hexdigest()[:16]
        (OUT / split / "images").mkdir(parents=True, exist_ok=True)
        (OUT / split / "labels").mkdir(parents=True, exist_ok=True)
        shutil.copy(rep["path"], OUT / split / "images" / f"{name}.jpg")
        (OUT / split / "labels" / f"{name}.txt").write_text(
            "".join(f"0 {(a + c) / 2:.6f} {(b + d) / 2:.6f} {c - a:.6f} {d - b:.6f}\n" for a, b, c, d in rep["boxes"])
        )
        stats[split] += 1
        stats[f"{split}_boxes"] += len(rep["boxes"])
        if split == "test" and any(m["source"] == "ryukijano" and m["split"] == "test" for m in members):
            original_test.append(f"{name}.jpg")

    (OUT / "data.yaml").write_text(f"path: {OUT}\ntrain: train/images\nval: valid/images\ntest: test/images\nnames:\n  0: bache\n")
    # Subset with the 100 original test photos, to compare against model v0.
    sub = OUT / "test_v0"
    (sub / "images").mkdir(parents=True)
    (sub / "labels").mkdir(parents=True)
    for f in original_test:
        shutil.copy(OUT / "test" / "images" / f, sub / "images" / f)
        shutil.copy(OUT / "test" / "labels" / f.replace(".jpg", ".txt"), sub / "labels" / f.replace(".jpg", ".txt"))
    (OUT / "data_test_v0.yaml").write_text(f"path: {OUT}\ntrain: train/images\nval: test_v0/images\nnames:\n  0: bache\n")

    summary = {k: stats[k] for k in sorted(stats)} | {"test_v0": len(original_test), "near_duplicates_removed": len(items) - len(groups)}
    (ML_DIR / "dataset.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
