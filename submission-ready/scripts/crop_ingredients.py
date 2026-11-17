"""Crop the transparent ingredient sheet into reusable watercolor icons.

Run from the project root with:
    python scripts/crop_ingredients.py

The boxes are deliberately hand-tuned for the supplied 1122 x 1402 source so
closely packed illustrations do not bleed into one another. Each crop is then
trimmed to its alpha bounds and padded with transparent pixels.
"""

from pathlib import Path
from collections import deque
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "ingredients-sheet.png"
OUTPUT = ROOT / "assets" / "icons"


# id: (left, top, right, bottom), in source-image pixels.
CROPS = {
    "milk": (20, 38, 205, 304),
    "orange-juice": (205, 42, 360, 307),
    "blueberry-yogurt": (360, 115, 525, 300),
    "strawberry-yogurt": (525, 135, 650, 305),
    "cheese": (670, 130, 875, 300),
    "butter": (870, 105, 1115, 305),
    "eggs": (5, 315, 245, 515),
    "tofu": (245, 335, 435, 520),
    "leftover-curry": (455, 320, 685, 520),
    "fresh-meat": (705, 335, 955, 520),
    "jam": (955, 315, 1120, 520),
    "bread": (5, 500, 240, 745),
    "apples": (240, 535, 490, 735),
    "strawberries": (495, 520, 695, 740),
    "grapes": (700, 525, 935, 745),
    "dessert-cup": (930, 520, 1120, 745),
    "lettuce": (0, 735, 200, 965),
    "spinach": (205, 735, 385, 975),
    "zucchini": (400, 760, 565, 955),
    "broccoli": (565, 735, 755, 975),
    "tomatoes": (770, 745, 920, 960),
    "carrots": (930, 725, 1120, 970),
    "mushrooms": (5, 955, 215, 1160),
    "corn": (225, 945, 400, 1165),
    "purple-sweet-potatoes": (405, 960, 595, 1160),
    "frozen-dumplings": (610, 965, 825, 1155),
    "frozen-salmon": (840, 965, 1120, 1155),
    "ice-cream": (0, 1165, 180, 1395),
    "frozen-berries": (180, 1160, 345, 1398),
    "popsicles": (345, 1160, 515, 1402),
    "frozen-meat": (515, 1165, 700, 1395),
    "frozen-vegetables": (720, 1160, 910, 1395),
    "frozen-lasagna": (910, 1165, 1122, 1395),
}


def crop_icon(sheet: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    icon = sheet.crop(box)
    # Closely packed rows mean a rectangular box can catch a sliver of the
    # neighboring illustration. Those slivers are disconnected and touch the
    # crop boundary, so remove only edge-touching alpha components while
    # preserving the main watercolor shape, its shadows, and interior flecks.
    alpha = icon.getchannel("A")
    pixels = alpha.load()
    width, height = icon.size
    visited = bytearray(width * height)
    components: list[tuple[list[tuple[int, int]], bool]] = []
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if visited[index] or pixels[x, y] <= 8:
                continue
            visited[index] = 1
            queue = deque([(x, y)])
            points: list[tuple[int, int]] = []
            touches_edge = False
            while queue:
                px, py = queue.popleft()
                points.append((px, py))
                touches_edge = touches_edge or px <= 1 or py <= 1 or px >= width - 2 or py >= height - 2
                for ny in range(max(0, py - 1), min(height, py + 2)):
                    for nx in range(max(0, px - 1), min(width, px + 2)):
                        neighbor = ny * width + nx
                        if not visited[neighbor] and pixels[nx, ny] > 8:
                            visited[neighbor] = 1
                            queue.append((nx, ny))
            components.append((points, touches_edge))

    if components:
        largest = max(range(len(components)), key=lambda i: len(components[i][0]))
        cleaned = alpha.copy()
        cleaned_pixels = cleaned.load()
        for index, (points, touches_edge) in enumerate(components):
            if index != largest and touches_edge:
                for x, y in points:
                    cleaned_pixels[x, y] = 0
        icon.putalpha(cleaned)
    alpha_box = icon.getchannel("A").getbbox()
    if not alpha_box:
        raise ValueError(f"No visible pixels in crop {box}")
    icon = icon.crop(alpha_box)
    padded = Image.new("RGBA", (icon.width + 24, icon.height + 24), (0, 0, 0, 0))
    padded.alpha_composite(icon, (12, 12))
    return padded


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE).convert("RGBA")
    if sheet.size != (1122, 1402):
        raise ValueError(f"Expected 1122 x 1402 source, got {sheet.size}")
    for ingredient_id, box in CROPS.items():
        crop_icon(sheet, box).save(OUTPUT / f"{ingredient_id}.png", optimize=True)
    print(f"Created {len(CROPS)} icons in {OUTPUT}")


if __name__ == "__main__":
    main()
