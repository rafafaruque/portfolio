"""Generate small browsing images; originals are read-only.

Run from the repository root with Python and Pillow after updating
data/photography-rolls.json. Each roll lists its cover first, then its photos.
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
destination = root / 'images/photography-thumbnails'
destination.mkdir(exist_ok=True)
rolls = json.loads((root / 'data/photography-rolls.json').read_text())
for roll in rolls:
    for photo in roll['photos']:
        source = root / photo['src']
        for width in (384, 768):
            output = destination / f'{source.stem}-{width}.webp'
            with Image.open(source) as original:
                image = ImageOps.exif_transpose(original).convert('RGB')
                image.thumbnail((width, round(width * image.height / image.width)))
                image.save(output, 'WEBP', quality=84, method=6)
