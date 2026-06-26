# Play Console — FOREGROUND_SERVICE_MEDIA_PLAYBACK

## What Trivia Dash actually does

| Audio | When | Background? |
|-------|------|---------------|
| Menu loop music | Home, lobby, leaderboard screens | **No** — stops when app is minimized (`shouldPlayInBackground: false`) |
| Victory / milestone SFX | After winning a match | **No** |
| Voice (expo-speech) | Optional question read-aloud | **No** |

**Not used:** video playback, picture-in-picture, podcasts, music when app is in background.

## If Play Console asks you to declare MEDIA_PLAYBACK

### Tasks to select

- **Media playback** — optional menu music and short game sound effects while the user is actively in the app.

Do **not** select:

- Show picture in picture
- Other (unless Play forces a free-text — say “Not applicable”)

### Description text (paste in the form if there is a text box)

> Trivia Dash plays optional looping menu music on home and lobby screens while the app is open, and short sound effects when a player wins a round. Audio stops when the user leaves those screens or disables music in settings. The app does not play audio in the background, does not use picture-in-picture, and does not stream video.

### Video link (if required)

Record a **30–60 second** screen recording on Android:

1. Open Trivia Dash — menu music plays on Home.
2. Tap customize → toggle **Menu music** off, then on.
3. Start **Solo** → finish a round → victory sound on Results.
4. Press Home button — music stops (app not playing in background).

Upload **unlisted** to YouTube or Google Drive → paste the **public** link in Play Console.

## Reduce declarations (recommended)

Recent builds disable microphone / recording (`recordAudioAndroid: false`). Rebuild and upload a new AAB:

```powershell
npm run build:play
```

If the merged manifest no longer declares `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, Play may stop asking for this declaration entirely.

## Cannot bypass

If the permission is in your uploaded AAB, Google requires an accurate declaration and often a demo video. You cannot skip it with “no URL” style workarounds — you must either **declare honestly** or **ship a build without that permission**.
