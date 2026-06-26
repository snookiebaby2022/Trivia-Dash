# Facebook page assets — Trivia Dash

| File | Use |
|------|-----|
| `profile-512.png` | **Profile picture** (upload this or `profile-1024.png`) |
| `cover-1640x859.jpg` | **Cover photo** (recommended size 1640×859) |
| `cover-1640x859.png` | Same cover, PNG version |

## Upload steps

1. Open your Facebook Page → **Edit** profile or cover image.
2. **Profile:** upload `profile-512.png`.
3. **Cover:** upload `cover-1640x859.jpg`.
4. Drag to position — keep the logo/text in the **center** (mobile crops the sides).

## Regenerate from source art

Source PNGs live in `assets/brand-source/`. Re-run:

```powershell
python scripts/export-brand-assets.py
```

This also refreshes `assets/icon.png`, adaptive icon, splash, and Play feature graphic.
