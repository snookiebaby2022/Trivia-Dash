"""Generate Google Play Developer page assets (icon + header)."""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store-assets" / "developer-page"
ICON_SRC = ROOT / "assets" / "icon.png"

BG = (11, 11, 22)
PRIMARY = (124, 92, 255)
MUTED = (160, 160, 192)
ACCENT = (255, 92, 138)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    names = (
        ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
        if bold
        else ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
    )
    for path in names:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _flatten_icon(size: int = 512) -> Image.Image:
    src = Image.open(ICON_SRC).convert("RGBA")
    icon = src.resize((size, size), Image.Resampling.LANCZOS)
    rgb = Image.new("RGB", (size, size), BG)
    rgb.paste(icon, (0, 0), icon)
    return rgb


def make_developer_icon() -> None:
    """512x512 — Play requires JPEG or 24-bit RGB PNG (no alpha), max 1 MB."""
    icon = _flatten_icon(512)
    assert icon.size == (512, 512)
    assert icon.mode == "RGB"

    jpg = OUT / "developer-icon-512.jpg"
    icon.save(
        jpg,
        format="JPEG",
        quality=95,
        subsampling=0,
        optimize=True,
        progressive=False,
    )
    print(f"wrote {jpg} ({icon.size[0]}x{icon.size[1]} RGB, {jpg.stat().st_size} bytes)")

    png = OUT / "developer-icon-512.png"
    icon.save(png, format="PNG", optimize=True, compress_level=9)
    print(f"wrote {png} ({icon.size[0]}x{icon.size[1]} RGB, {png.stat().st_size} bytes)")


def _draw_header_canvas() -> Image.Image:
    w, h = 4096, 2304
    img = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)

    for i in range(120, 0, -3):
        r = int(900 * (i / 120))
        color = tuple(int(c * (i / 120) * 0.15) for c in PRIMARY)
        draw.ellipse((200 - r, 200 - r, 200 + r, 200 + r), fill=color)

    for i in range(120, 0, -3):
        r = int(700 * (i / 120))
        color = tuple(int(c * (i / 120) * 0.12) for c in ACCENT)
        draw.ellipse((w - 500 - r, h // 2 - r, w - 500 + r, h // 2 + r), fill=color)

    logo = Image.open(ICON_SRC).convert("RGBA").resize((520, 520), Image.Resampling.LANCZOS)
    lx, ly = 280, (h - 520) // 2
    rgb = Image.new("RGB", logo.size, BG)
    rgb.paste(logo, (0, 0), logo)
    img.paste(rgb, (lx, ly))

    font_title = load_font(200, bold=True)
    font_sub = load_font(72)
    tx = lx + 620
    draw.text((tx, h // 2 - 160), "Trivia Dash", fill=(255, 255, 255), font=font_title)
    draw.text((tx, h // 2 + 60), "Fast trivia. Party mode. Season pass.", fill=MUTED, font=font_sub)
    return img


def make_developer_header() -> None:
    """4096x2304 — JPG (preferred) and 24-bit RGB PNG (no alpha)."""
    img = _draw_header_canvas()
    assert img.size == (4096, 2304)
    assert img.mode == "RGB"

    jpg = OUT / "developer-header-4096x2304.jpg"
    img.save(
        jpg,
        format="JPEG",
        quality=92,
        subsampling=0,
        optimize=True,
        progressive=False,
    )
    print(f"wrote {jpg} ({img.size[0]}x{img.size[1]} RGB)")

    png = OUT / "developer-header-4096x2304.png"
    img.save(png, format="PNG", optimize=True, compress_level=6)
    print(f"wrote {png} ({img.size[0]}x{img.size[1]} RGB)")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_developer_icon()
    make_developer_header()
    print("\nUpload in Play Console -> Developer account -> Developer page")
    print("  Icon:   developer-icon-512.jpg  (JPEG, no transparency)")
    print("  Header: developer-header-4096x2304.jpg")
    print("  Fallback: matching .png files (24-bit RGB only)")


if __name__ == "__main__":
    main()
