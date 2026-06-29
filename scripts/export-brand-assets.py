"""Export Trivia Dash icon + Facebook profile/cover at required sizes."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "brand-source"
OUT_FB = ROOT / "store-assets" / "facebook"
OUT_ASSETS = ROOT / "assets"

SIZES = {
    "icon": (1024, 1024),
    "adaptive-icon": (1024, 1024),
    "splash-icon": (1024, 1024),
    "feature-graphic": (1024, 500),
}


def sharpen_icon(img: Image.Image) -> Image.Image:
    from PIL import ImageFilter

    return img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=140, threshold=2))


def remove_background(img: Image.Image, tolerance: int = 30) -> Image.Image:
    """Remove solid background from icon for adaptive foreground layer.

    Samples the corner pixels to detect the dominant background colour, then
    makes all similar pixels transparent.  ``tolerance`` controls how close a
    pixel must be to the detected colour to be removed (0–255 per channel).
    """
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size

    # Sample all four corners and average them.
    corners = [pixels[0, 0], pixels[w - 1, 0], pixels[0, h - 1], pixels[w - 1, h - 1]]
    bg_r = sum(c[0] for c in corners) // 4
    bg_g = sum(c[1] for c in corners) // 4
    bg_b = sum(c[2] for c in corners) // 4

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if (
                abs(r - bg_r) <= tolerance
                and abs(g - bg_g) <= tolerance
                and abs(b - bg_b) <= tolerance
            ):
                pixels[x, y] = (r, g, b, 0)

    return img


def resize_cover(img: Image.Image, target: tuple[int, int]) -> Image.Image:
    tw, th = target
    sw, sh = img.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def main() -> None:
    icon_src = SRC / "icon-source.png"
    if not icon_src.exists():
        icon_src = SRC / "trivia-dash-icon-3d-glossy.png"
    if not icon_src.exists():
        icon_src = SRC / "trivia-dash-profile-v2.png"
    if not icon_src.exists():
        icon_src = SRC / "trivia-dash-icon-1024.png"
    profile_src = SRC / "icon-source.png"
    if not profile_src.exists():
        profile_src = SRC / "trivia-dash-icon-3d-glossy.png"
    if not profile_src.exists():
        profile_src = SRC / "trivia-dash-facebook-profile.png"
    cover_src = SRC / "trivia-dash-facebook-cover.png"

    for p in (icon_src, profile_src, cover_src):
        if not p.exists():
            raise SystemExit(f"Missing source image: {p}")

    icon = sharpen_icon(Image.open(icon_src).convert("RGBA"))
    profile = sharpen_icon(Image.open(profile_src).convert("RGBA"))
    cover = Image.open(cover_src).convert("RGB")

    OUT_FB.mkdir(parents=True, exist_ok=True)

    # App icons
    for name, size in SIZES.items():
        out = OUT_ASSETS / f"{name}.png"
        if name == "feature-graphic":
            img = resize_cover(icon, size).convert("RGBA")
        elif name == "adaptive-icon":
            # Adaptive icon foreground must have a transparent background so
            # the OS can composite its own background colour and mask shape.
            img = remove_background(icon.resize(size, Image.Resampling.LANCZOS))
        else:
            img = icon.resize(size, Image.Resampling.LANCZOS)
        img.save(out, optimize=True)
        print("wrote", out.relative_to(ROOT))

    # Facebook profile (square)
    for size in (400, 512, 1024):
        out = OUT_FB / f"profile-{size}.png"
        profile.resize((size, size), Image.Resampling.LANCZOS).save(out, optimize=True)
        print("wrote", out.relative_to(ROOT))

    # Facebook cover — 1640×859 recommended (safe zone center)
    cover_1640 = resize_cover(cover, (1640, 859))
    cover_1640.save(OUT_FB / "cover-1640x859.png", optimize=True)
    cover_1640.save(OUT_FB / "cover-1640x859.jpg", quality=92, optimize=True)
    print("wrote", OUT_FB / "cover-1640x859.png")

    # Play feature graphic copy
    fg = resize_cover(icon, (1024, 500))
    fg.save(ROOT / "store-assets" / "feature-graphic.png", optimize=True)
    print("wrote store-assets/feature-graphic.png")

    print("\nDone. Upload to Facebook:")
    print("  Profile: store-assets/facebook/profile-512.png (or profile-1024.png)")
    print("  Cover:   store-assets/facebook/cover-1640x859.jpg")


if __name__ == "__main__":
    main()
