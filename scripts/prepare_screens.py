"""Build the 16 screen backgrounds from the designer's 2816x1536 JPG exports.

The designer's "QUAY SỐ" and "CÔNG BỐ" exports contain sample text (code "Y10",
"ÔNG TRẦN VĂN SƠN", "NPP SƠN NGUYỆT ..."). This script removes it by fitting a
smooth gradient to the surrounding background, so the app can draw real values.

Requires Pillow and numpy:  pip install pillow numpy
Usage:  python scripts/prepare_screens.py "/path/to/LUCKY DRAW"
The folder is the Drive folder as downloaded: "1. GIẢI ĐẶC BIỆT/stand by.jpg", ...
"""
import shutil
import sys
import unicodedata
from pathlib import Path

import numpy as np
from PIL import Image

PRIZES = {"giải đặc biệt": "special", "giải nhất": "first", "giải nhì": "second", "giải ba": "third"}
SCREENS = {"stand by": "standby", "quay số": "spin", "công bố": "announce", "trao giải": "award"}
SIZE = (2816, 1536)

# (fit box, holes, polynomial degree); boxes are (x0, y0, x1, y1) in design pixels.
CLEANUP = {
    "spin": [
        ((1215, 850, 1568, 1232), [(1300, 885, 1472, 1190)], 4),  # first digit cell
        ((1617, 850, 2021, 1232), [(1672, 885, 1948, 1190)], 4),  # second digit cell
    ],
    "announce": [
        ((1310, 712, 1776, 949), [(1343, 750, 1655, 940)], 4),  # code digits
        ((700, 1040, 2110, 1340), [(860, 1062, 1950, 1200), (840, 1212, 1970, 1304)], 2),  # name + NPP
    ],
}
FEATHER = 8
STRIP = 4


def key(text):
    return unicodedata.normalize("NFC", text).strip().lower()


def smooth(values, width=9):
    padded = np.pad(values, width // 2, mode="edge")
    return np.convolve(padded, np.ones(width) / width, mode="valid")


def coons(residual, a, b, c, d):
    """Blend the residual seen just outside a rectangle across its inside, matching all four edges."""
    top = smooth(residual[b - STRIP:b, a:c].mean(axis=0))
    bottom = smooth(residual[d:d + STRIP, a:c].mean(axis=0))
    left = smooth(residual[b:d, a - STRIP:a].mean(axis=1))
    right = smooth(residual[b:d, c:c + STRIP].mean(axis=1))
    u, v = np.meshgrid((np.arange(c - a) + 0.5) / (c - a), (np.arange(d - b) + 0.5) / (d - b))
    corners = ((1 - u) * (1 - v) * (top[0] + left[0]) + u * (1 - v) * (top[-1] + right[0])
               + (1 - u) * v * (bottom[0] + left[-1]) + u * v * (bottom[-1] + right[-1])) / 2
    return (1 - v) * top + v * bottom + (1 - u) * left[:, None] + u * right[:, None] - corners


def fill(pixels, box, holes, degree):
    """Replace each hole with a polynomial fit of the box background plus an edge-matching correction."""
    x0, y0, x1, y1 = box
    region = pixels[y0:y1, x0:x1]
    h, w = region.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    u, v = xx / (w - 1) * 2 - 1, yy / (h - 1) * 2 - 1
    holes = [(a - x0, b - y0, c - x0, d - y0) for a, b, c, d in holes]
    inside = np.zeros((h, w))
    for a, b, c, d in holes:
        depth = np.minimum.reduce([xx - a, c - 1 - xx, yy - b, d - 1 - yy]).astype(float)
        inside = np.maximum(inside, np.where(depth >= 0, depth + 1, 0))
    known = inside == 0
    terms = [u ** i * v ** j for i in range(degree + 1) for j in range(degree + 1 - i)]
    design = np.stack([t[known] for t in terms], axis=1)
    alpha = np.clip(inside / FEATHER, 0, 1)[..., None]
    model = np.empty_like(region)
    worst = 0.0
    for channel in range(3):
        coef, *_ = np.linalg.lstsq(design, region[..., channel][known], rcond=None)
        model[..., channel] = sum(c * t for c, t in zip(coef, terms))
        residual = region[..., channel] - model[..., channel]
        worst = max(worst, float(np.sqrt(np.mean(residual[known] ** 2))))
        for a, b, c, d in holes:
            model[b:d, a:c, channel] += coons(residual, a, b, c, d)
    pixels[y0:y1, x0:x1] = alpha * model + (1 - alpha) * region
    return worst


def main(source, target):
    found = {}
    for path in Path(source).rglob("*.jpg"):
        prize = next((v for k, v in PRIZES.items() if key(path.parent.name).endswith(k)), None)
        screen = SCREENS.get(key(path.stem))
        if prize and screen:
            found[(prize, screen)] = path
    missing = [f"{p}/{s}" for p in PRIZES.values() for s in SCREENS.values() if (p, s) not in found]
    if missing:
        sys.exit(f"Thiếu ảnh: {', '.join(missing)}")
    target.mkdir(parents=True, exist_ok=True)
    for (prize, screen), path in sorted(found.items()):
        out = target / f"{prize}-{screen}.jpg"
        image = Image.open(path).convert("RGB")
        if image.size != SIZE:
            sys.exit(f"{path} phải có kích thước {SIZE[0]}x{SIZE[1]}")
        if screen not in CLEANUP:
            shutil.copyfile(path, out)
            continue
        pixels = np.asarray(image, dtype=np.float64).copy()
        errors = [fill(pixels, box, holes, degree) for box, holes, degree in CLEANUP[screen]]
        Image.fromarray(np.clip(pixels + 0.5, 0, 255).astype(np.uint8)).save(out, quality=92, subsampling=0)
        print(f"{out.name}: background fit RMS {', '.join(f'{e:.1f}' for e in errors)}")
    print(f"Đã ghi {len(found)} ảnh vào {target}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1], Path(__file__).resolve().parents[1] / "assets" / "screens")
