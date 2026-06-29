# Sound Effects Guide

Replace these placeholder MP3s in `assets/sounds/` with real sound effects:

| File | Used For | Suggested Sound |
|------|----------|-----------------|
| `correct.mp3` | Correct answer reveal | Bright "ding!" or chime (0.5-1s) |
| `wrong.mp3` | Wrong answer reveal | Classic "err-err!" buzzer (0.5-1s) |
| `tick.mp3` | Timer urgency (last 5s) | Clock tick-tock (0.2s, repeats) |
| `lock-in.mp3` | Answer selection | Soft "thunk" or click (0.3s) |
| `countdown.mp3` | 3-2-1 countdown | Dramatic beep per tick (0.3s) |
| `combo.mp3` | Combo multiplier increase | Rising "whoosh" or sparkly chime (0.5s) |
| `tension.mp3` | Last 3 seconds of timer | Rising tension bed, loops (3-5s) |
| `victory.mp3` | Match win celebration | Fanfare or applause (2-3s) |
| `milestone.mp3` | Achievement/wedge unlock | Triumphant sting (1-2s) |
| `menu-loop.mp3` | Category ambience (loop) | Soft background loop for Entertainment categories |

## Tips

- Keep SFX short (under 2 seconds) — they fire frequently
- `tick.mp3` and `tension.mp3` are the most impactful for game feel
- Use royalty-free sounds from freesound.org, Mixkit, or Zapsplat
- MP3 format, 44.1kHz, mono is fine for SFX
- Total bundle should stay under 2MB for all sounds

## Music Question Audio

Questions with an `audioUrl` field will stream audio from the URL.
Use royalty-free clips from:
- Pixabay Music (pixabay.com/music)
- Free Music Archive (freemusicarchive.org)
- Incompetech (incompetech.com)
