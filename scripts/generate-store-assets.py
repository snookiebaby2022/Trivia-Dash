"""Generate Google Play store listing assets for Trivia Dash."""

from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store-assets"
ICON = ROOT / "assets" / "icon.png"

# Theme
BG = "#0B0B16"
BG_ELEV = "#16162A"
CARD = "#1E1E38"
CARD_BORDER = "#2C2C52"
PRIMARY = "#7C5CFF"
TEXT = "#FFFFFF"
TEXT_MUTED = "#A0A0C0"
SUCCESS = "#3DDC97"
ACCENT = "#FF5C8A"
GOLD = "#FFD24D"

WEDGES = [
    ("#06B6D4", "Geography"),
    ("#D946EF", "Entertainment"),
    ("#F59E0B", "History"),
    ("#10B981", "Science"),
    ("#F97316", "Sports"),
    ("#8B5CF6", "General"),
]


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates += [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
        ]
    else:
        candidates += [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
        ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def rounded_rect(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill,
    outline=None,
    width: int = 1,
):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_bg(img: Image.Image):
    draw = ImageDraw.Draw(img)
    w, h = img.size
    draw.rectangle((0, 0, w, h), fill=hex_rgb(BG))
    # subtle purple glow top-left
    for i in range(80, 0, -2):
        alpha = int(18 * (i / 80))
        color = (*hex_rgb(PRIMARY), alpha)
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.ellipse((-w * 0.2, -h * 0.15, w * 0.55, h * 0.45), fill=color)
        img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"))


def paste_icon(img: Image.Image, box: tuple[int, int, int, int]):
    if not ICON.exists():
        return
    icon = Image.open(ICON).convert("RGBA")
    x0, y0, x1, y1 = box
    icon.thumbnail((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
    ix = x0 + (x1 - x0 - icon.width) // 2
    iy = y0 + (y1 - y0 - icon.height) // 2
    img.paste(icon, (ix, iy), icon)


def draw_wheel(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int):
    n = len(WEDGES)
    for i, (color, _) in enumerate(WEDGES):
        start = -90 + i * (360 / n)
        end = start + 360 / n
        draw.pieslice(
            (cx - r, cy - r, cx + r, cy + r),
            start=start,
            end=end,
            fill=hex_rgb(color),
            outline=hex_rgb(BG),
            width=3,
        )
    draw.ellipse((cx - r * 0.35, cy - r * 0.35, cx + r * 0.35, cy + r * 0.35), fill=hex_rgb(BG_ELEV))


def draw_button(draw, box, label, font, fill=PRIMARY):
    rounded_rect(draw, box, 14, hex_rgb(fill))
    tw = draw.textlength(label, font=font)
    x0, y0, x1, y1 = box
    draw.text((x0 + (x1 - x0 - tw) / 2, y0 + (y1 - y0) / 2 - font.size / 2), label, fill=hex_rgb(TEXT), font=font)


def screen_home(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h))
    draw_bg(img)
    draw = ImageDraw.Draw(img)
    pad = int(w * 0.06)
    y = int(h * 0.06)

    title_font = load_font(int(w * 0.11), bold=True)
    sub_font = load_font(int(w * 0.034))
    body = load_font(int(w * 0.038))
    small = load_font(int(w * 0.03))

    draw.text((pad, y), "TRIVIA DASH", fill=hex_rgb(TEXT), font=title_font)
    y += int(title_font.size * 1.1)
    draw.text((pad, y), "Race the clock · collect wedges · beat the room", fill=hex_rgb(TEXT_MUTED), font=sub_font)
    y += int(h * 0.08)

    r = int(min(w, h) * 0.22)
    draw_wheel(draw, w // 2, y + r, r)
    y += r * 2 + int(h * 0.05)

    card_h = int(h * 0.11)
    rounded_rect(draw, (pad, y, w - pad, y + card_h), 18, hex_rgb(CARD), outline=hex_rgb(CARD_BORDER), width=2)
    draw.ellipse((pad + 20, y + 18, pad + 20 + card_h - 36, y + card_h - 18), fill=hex_rgb(PRIMARY))
    draw.text((pad + card_h, y + 22), "QuizMaster", fill=hex_rgb(TEXT), font=body)
    draw.text((pad + card_h, y + 22 + body.size), "Gold rank · 1240 ELO", fill=hex_rgb(GOLD), font=small)
    y += card_h + int(h * 0.03)

    stats_h = int(h * 0.08)
    gap = int(w * 0.02)
    stat_w = (w - pad * 2 - gap * 3) // 4
    for i, (label, val, color) in enumerate(
        [("Wins", "42", SUCCESS), ("Win rate", "68%", PRIMARY), ("Streak", "7", ACCENT), ("Daily", "12", GOLD)]
    ):
        x = pad + i * (stat_w + gap)
        rounded_rect(draw, (x, y, x + stat_w, y + stats_h), 12, hex_rgb(CARD), outline=hex_rgb(CARD_BORDER))
        draw.text((x + 12, y + 10), label, fill=hex_rgb(TEXT_MUTED), font=small)
        draw.text((x + 12, y + 10 + small.size), val, fill=hex_rgb(color), font=body)
    y += stats_h + int(h * 0.04)

    btn_h = int(h * 0.065)
    for label in ["Daily Challenge", "Quick Match", "Party Lobby"]:
        draw_button(draw, (pad, y, w - pad, y + btn_h), label, body)
        y += btn_h + int(h * 0.02)

    rounded_rect(draw, (pad, y, w - pad, y + int(h * 0.07)), 16, hex_rgb("#2A1F4A"), outline=hex_rgb(PRIMARY))
    draw.text((pad + 16, y + 18), "Trophy Case", fill=hex_rgb(TEXT), font=body)
    draw.text((pad + 16, y + 18 + body.size), "18 achievements unlocked", fill=hex_rgb(TEXT_MUTED), font=small)
    return img


def screen_game(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h))
    draw_bg(img)
    draw = ImageDraw.Draw(img)
    pad = int(w * 0.06)
    body = load_font(int(w * 0.038))
    small = load_font(int(w * 0.03))
    h2 = load_font(int(w * 0.05), bold=True)
    prompt_font = load_font(int(w * 0.048), bold=True)

    y = int(h * 0.05)
    draw.text((pad, y), "Round 3/7", fill=hex_rgb(TEXT_MUTED), font=small)
    y += small.size + 8
    draw.text((pad, y), "You 420", fill=hex_rgb(SUCCESS), font=body)
    draw.text((w - pad - draw.textlength("Rival 380", font=body), y), "Rival 380", fill=hex_rgb(ACCENT), font=body)
    y += int(h * 0.06)

    # wedge tracker
    wedge_w = (w - pad * 2 - 5 * 8) // 6
    for i, (color, label) in enumerate(WEDGES[:6]):
        x = pad + i * (wedge_w + 8)
        rounded_rect(draw, (x, y, x + wedge_w, y + 28), 8, hex_rgb(CARD), outline=hex_rgb(color), width=2)
        if i < 3:
            draw.rectangle((x + 4, y + 4, x + wedge_w - 4, y + 24), fill=hex_rgb(color))
    y += 48

    card_top = y
    card_h = int(h * 0.42)
    theme = WEDGES[2]
    rounded_rect(draw, (pad, card_top, w - pad, card_top + card_h), 22, hex_rgb(CARD), outline=hex_rgb(CARD_BORDER), width=2)
    draw.rectangle((pad, card_top, pad + 10, card_top + card_h), fill=hex_rgb(theme[0]))
    draw.text((pad + 28, card_top + 24), "History", fill=hex_rgb(theme[0]), font=body)
    draw.text((w - pad - 80, card_top + 24), "3/7", fill=hex_rgb(TEXT_MUTED), font=small)
    draw.text((pad + 28, card_top + 90), "Which empire built the Colosseum?", fill=hex_rgb(TEXT), font=prompt_font)
    y = card_top + card_h + int(h * 0.04)

    answers = ["Roman Empire", "Ottoman Empire", "Byzantine Empire", "Persian Empire"]
    btn_h = int(h * 0.075)
    for i, ans in enumerate(answers):
        fill = PRIMARY if i == 0 else CARD
        rounded_rect(draw, (pad, y, w - pad, y + btn_h), 16, hex_rgb(fill), outline=hex_rgb(CARD_BORDER))
        draw.text((pad + 20, y + (btn_h - body.size) / 2), ans, fill=hex_rgb(TEXT), font=body)
        y += btn_h + int(h * 0.018)

    # timer bar
    bar_y = h - int(h * 0.08)
    rounded_rect(draw, (pad, bar_y, w - pad, bar_y + 10), 5, hex_rgb(CARD_BORDER))
    draw.rectangle((pad, bar_y, pad + int((w - pad * 2) * 0.62), bar_y + 10), fill=hex_rgb(PRIMARY))
    draw.text((pad, bar_y - 28), "12.4s", fill=hex_rgb(TEXT_MUTED), font=small)
    return img


def screen_achievements(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h))
    draw_bg(img)
    draw = ImageDraw.Draw(img)
    pad = int(w * 0.06)
    title = load_font(int(w * 0.07), bold=True)
    body = load_font(int(w * 0.036))
    small = load_font(int(w * 0.028))
    y = int(h * 0.05)
    draw.text((pad, y), "Trophy Case", fill=hex_rgb(TEXT), font=title)
    y += title.size + 8
    draw.text((pad, y), "18/24 unlocked · cosmetics carry to your avatar", fill=hex_rgb(TEXT_MUTED), font=small)
    y += int(h * 0.05)

    rows = [
        ("Wedge Hunter", "Collect wedges in 5 categories", 1.0, "Unlocked!"),
        ("Speed Demon", "Answer 10 questions under 5s", 0.7, "7/10"),
        ("Party Host", "Win 3 pass-and-play matches", 0.45, "9/20"),
        ("Daily Grinder", "30-day daily streak", 0.4, "12/30"),
    ]
    card_h = int(h * 0.13)
    for label, desc, pct, prog in rows:
        rounded_rect(draw, (pad, y, w - pad, y + card_h), 16, hex_rgb(CARD), outline=hex_rgb(CARD_BORDER))
        draw.text((pad + 16, y + 16), label, fill=hex_rgb(TEXT), font=body)
        draw.text((pad + 16, y + 16 + body.size), desc, fill=hex_rgb(TEXT_MUTED), font=small)
        track_y = y + card_h - 34
        rounded_rect(draw, (pad + 16, track_y, w - pad - 16, track_y + 8), 4, hex_rgb(BG_ELEV))
        tw = int((w - pad * 2 - 32) * pct)
        if tw > 0:
            draw.rectangle((pad + 16, track_y, pad + 16 + tw, track_y + 8), fill=hex_rgb(PRIMARY if pct >= 1 else GOLD))
        draw.text((pad + 16, track_y - 22), prog, fill=hex_rgb(SUCCESS if pct >= 1 else TEXT_MUTED), font=small)
        y += card_h + int(h * 0.02)
    return img


def screen_party(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h))
    draw_bg(img)
    draw = ImageDraw.Draw(img)
    pad = int(w * 0.06)
    title = load_font(int(w * 0.065), bold=True)
    body = load_font(int(w * 0.038))
    small = load_font(int(w * 0.03))
    y = int(h * 0.05)
    draw.text((pad, y), "Pass & Play", fill=hex_rgb(TEXT), font=title)
    y += title.size + int(h * 0.04)

    players = ["Alex", "Jordan", "Sam", "Riley"]
    for i, name in enumerate(players):
        card_h = int(h * 0.1)
        rounded_rect(draw, (pad, y, w - pad, y + card_h), 16, hex_rgb(CARD), outline=hex_rgb(PRIMARY if i == 0 else CARD_BORDER), width=2)
        draw.ellipse((pad + 16, y + 14, pad + 16 + card_h - 28, y + card_h - 14), fill=hex_rgb(WEDGES[i][0]))
        draw.text((pad + card_h, y + 22), name, fill=hex_rgb(TEXT), font=body)
        draw.text((pad + card_h, y + 22 + body.size), "Ready" if i < 3 else "Your turn!", fill=hex_rgb(SUCCESS if i < 3 else GOLD), font=small)
        y += card_h + int(h * 0.02)

    y += int(h * 0.03)
    draw.text((pad, y), "Reaction bar", fill=hex_rgb(TEXT_MUTED), font=small)
    y += small.size + 10
    emojis = ["🔥", "😂", "👏", "💡", "😱", "🎉"]
    chip = int(w * 0.12)
    for i, e in enumerate(emojis):
        x = pad + i * (chip + 8)
        rounded_rect(draw, (x, y, x + chip, y + chip), 14, hex_rgb(BG_ELEV), outline=hex_rgb(CARD_BORDER))
        ef = load_font(int(chip * 0.45))
        draw.text((x + chip * 0.28, y + chip * 0.22), e, fill=hex_rgb(TEXT), font=ef)

    y += chip + int(h * 0.05)
    draw_button(draw, (pad, y, w - pad, y + int(h * 0.07)), "Start party match", body)
    return img


SCREENS = [
    ("01-home", screen_home),
    ("02-gameplay", screen_game),
    ("03-achievements", screen_achievements),
    ("04-party", screen_party),
]


def fit_cover(src: Image.Image, tw: int, th: int) -> Image.Image:
    sw, sh = src.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def fit_contain(src: Image.Image, tw: int, th: int, bg=BG) -> Image.Image:
    sw, sh = src.size
    scale = min(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (tw, th), hex_rgb(bg))
    canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


def save_rgb_png(img: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode != "RGB":
        img = img.convert("RGB")
    img.save(path, "PNG", optimize=True)


def make_pc_feature_graphic() -> Image.Image:
    """16:9 cover art — no text per Google Play Games on PC rules."""
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, w, h), fill=hex_rgb(BG))
    # dramatic gradient blobs
    for cx, cy, r, color in [
        (w * 0.35, h * 0.45, 420, PRIMARY),
        (w * 0.7, h * 0.55, 360, ACCENT),
        (w * 0.55, h * 0.25, 280, GOLD),
    ]:
        for i in range(r, 0, -4):
            alpha = int(30 * (i / r))
            overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            od = ImageDraw.Draw(overlay)
            od.ellipse((cx - i, cy - i, cx + i, cy + i), fill=(*hex_rgb(color), alpha))
            img.paste(Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB"))
    draw_wheel(ImageDraw.Draw(img), int(w * 0.38), int(h * 0.52), 220)
    paste_icon(img, (int(w * 0.72), int(h * 0.18), int(w * 0.92), int(h * 0.62)))
    return img


def make_pc_logo() -> Image.Image:
    """600x400 PNG with transparency — game title overlay."""
    w, h = 600, 400
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    title = load_font(54, bold=True)
    sub = load_font(22)
    text = "TRIVIA"
    text2 = "DASH"
    tw1 = draw.textlength(text, font=title)
    tw2 = draw.textlength(text2, font=title)
    x1 = (w - tw1) / 2
    x2 = (w - tw2) / 2
    # soft glow behind text
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            draw.text((x1 + dx, 118 + dy), text, fill=(124, 92, 255, 80), font=title)
            draw.text((x2 + dx, 178 + dy), text2, fill=(124, 92, 255, 80), font=title)
    draw.text((x1, 118), text, fill=(255, 255, 255, 255), font=title)
    draw.text((x2, 178), text2, fill=(255, 255, 255, 255), font=title)
    tag = "trivia party game"
    tw = draw.textlength(tag, font=sub)
    draw.text(((w - tw) / 2, 268), tag, fill=(160, 160, 192, 230), font=sub)
    return img


def make_phone_feature_graphic() -> Image.Image:
    path = ROOT / "assets" / "feature-graphic.png"
    if path.exists():
        return Image.open(path).convert("RGB").resize((1024, 500), Image.Resampling.LANCZOS)
    return fit_cover(make_pc_feature_graphic(), 1024, 500)


def write_readme():
    text = """# Trivia Dash — Google Play store assets

Generated by `python scripts/generate-store-assets.py`.

## Upload map (Play Console → Grow → Store presence → Main store listing)

| Folder | Play Console section | Count | Size |
|--------|---------------------|-------|------|
| `phone/` | Phone screenshots | 4 | 1080×1920 portrait |
| `tablet-7/` | 7-inch tablet screenshots | 4 | 1200×1920 portrait |
| `tablet-10/` | 10-inch tablet screenshots | 4 | 1600×2560 portrait |
| `chromebook/` | Chromebook screenshots | 4 | 1920×1080 landscape |
| `play-games-pc/screenshots/` | Google Play Games on PC screenshots | 4 | 1920×1080 landscape |
| `play-games-pc/` | Google Play Games on PC feature graphic | 1 | 1920×1080 (16:9, no text) |
| `play-games-pc/` | Google Play Games on PC logo | 1 | 600×400 PNG (transparent) |
| `android-xr/` | Android XR screenshots | 4 | 1920×1200 (8:5) |
| `feature-graphic.png` | Feature graphic (all listings) | 1 | 1024×500 |

## Notes

- **Games** need at least **3** phone screenshots (portrait or landscape). This set uses portrait phone + landscape for large screens.
- **Tablet / Chromebook**: minimum **4** screenshots each if you target large screens.
- **Android XR**: minimum **4** screenshots at **8:5** (1920×1200).
- **Play Games on PC logo + feature graphic** must be uploaded **together** or Play Console errors.
- PC feature graphic must **not contain text**; the 600×400 logo overlays on top.
- Replace with real in-app screenshots from a device/emulator when you can — these are UI-accurate mockups for launch.

## Re-capture real screenshots (recommended later)

```powershell
# Android emulator or device
adb exec-out screencap -p > store-assets/phone/01-home-real.png
```

Resize with the same script after editing `SCREENS` or swap files in each folder.
"""
    (OUT / "README.md").write_text(text, encoding="utf-8")


def main():
    if OUT.exists():
        import shutil
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    # Base portrait canvas for scaling
    base_w, base_h = 1080, 1920
    base_screens = {name: fn(base_w, base_h) for name, fn in SCREENS}

    exports = {
        "phone": (1080, 1920, "portrait"),
        "tablet-7": (1200, 1920, "portrait"),
        "tablet-10": (1600, 2560, "portrait"),
        "chromebook": (1920, 1080, "landscape"),
        "play-games-pc/screenshots": (1920, 1080, "landscape"),
        "android-xr": (1920, 1200, "xr"),
    }

    for folder, (tw, th, mode) in exports.items():
        for name, base in base_screens.items():
            if mode == "portrait":
                out = fit_contain(base, tw, th)
            elif mode == "landscape":
                # rotate composition: use game/home as landscape-friendly
                src = base.transpose(Image.Transpose.ROTATE_90) if base.height > base.width else base
                if name in ("01-home", "03-achievements"):
                    src = screen_game(tw, th) if mode == "landscape" else base
                if name == "02-gameplay":
                    src = screen_game(tw, th)
                elif name == "04-party":
                    src = screen_party(tw, th)
                elif name == "01-home":
                    src = screen_home(tw, th)
                elif name == "03-achievements":
                    src = screen_achievements(tw, th)
                out = src if src.size == (tw, th) else fit_cover(src, tw, th)
            else:  # xr 8:5
                out = fit_cover(base, tw, th)
            save_rgb_png(out, OUT / folder / f"{name}.png")

    # PC-specific assets
    pc_fg = make_pc_feature_graphic()
    save_rgb_png(pc_fg, OUT / "play-games-pc" / "feature-graphic.png")
    pc_logo = make_pc_logo()
    pc_logo.save(OUT / "play-games-pc" / "logo.png", "PNG", optimize=True)

    save_rgb_png(make_phone_feature_graphic(), OUT / "feature-graphic.png")

    write_readme()
    print(f"Wrote store assets to {OUT}")


if __name__ == "__main__":
    main()
