# GACC Worship — desktop app

Electron wrapper that turns `../GACC Worship.html` into an installable desktop app.
The HTML file is the only copy of the app: edit it, then rebuild. `npm run sync` copies it into `app/index.html`, and every start and build runs that step first.

## Tech stack

The app itself is one HTML file with plain HTML, CSS and JavaScript: no framework, no bundler, no CDN. It runs fully offline.

| Part | What it uses | Version |
|------|--------------|---------|
| App UI | Vanilla HTML / CSS / JavaScript (single file `GACC Worship.html`) | n/a |
| Desktop shell | [Electron](https://www.electronjs.org/) (`main.js`) | 44.7.2 |
| Browser engine inside the app | Chromium (bundled with Electron) | 152.0.7977.149 |
| JavaScript runtime inside the app | Node.js (bundled with Electron) | 24.21.0 |
| Installer / portable builder | [electron-builder](https://www.electron.build/) (NSIS + portable) | 26.15.3 |
| Build machine | Node.js / npm | 20+ required (built with 26.13.0 / 11.20.0) |

Browser features the app relies on (all built into Chromium, nothing to install):

- **IndexedDB**: the song library, uploaded backgrounds, videos, sound and logo, stored on the device.
- **localStorage**: settings and the playlist.
- **BroadcastChannel**: keeps the operator window and the projector window in sync.
- **DecompressionStream**: reads pictures out of `.pptx` files when you upload a PowerPoint background.
- **HTML5 video / canvas**: live backgrounds, seamless crossfade loops, and the background thumbnails.

### Live background generator (`../live-bg-studio`, optional)

Only used to make the looping MP4s in `../live-bg`. Not needed to run the app.

| Tool | Version |
|------|---------|
| [three.js](https://threejs.org/) (3D scenes) | 0.170.0 |
| [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) (MP4 export) | 5.1.3 |
| ffmpeg-static (checking the exported files) | 5.2.0 |

The bundled backgrounds are H.264 (High), 1920×1080, 30 fps, about 6.8 Mbps, about 21 s per loop.

## Minimum device requirements

These are estimates from the Electron/Chromium requirements and the 1080p video backgrounds. They were not measured on low-end hardware, so test a new PC once before using it in a service.

| | Minimum | Recommended (smooth 1080p video backgrounds) |
|---|---|---|
| OS | Windows 10 64-bit (Windows 7/8 not supported) | Windows 10/11 64-bit |
| CPU | Dual-core 64-bit, 2015 or newer (e.g. Intel Core i3 6th gen / AMD Ryzen 3) | Quad-core (Intel Core i5 8th gen / Ryzen 5 or better) |
| RAM | 4 GB | 8 GB |
| Graphics | Any GPU with hardware H.264 decoding (Intel HD 520 or newer) | Intel UHD 620 / Iris Xe, or any dedicated GPU |
| Storage | ~400 MB for the app + room for your media (each bundled background is ~18 MB) | SSD, 2 GB+ free |
| Display | 1280×720 operator screen | Second display / projector over HDMI for Present mode |

Notes:

- The portable `.exe` unpacks itself (~370 MB) to a temp folder on every launch, so it opens slower on an HDD or a slow USB drive.
- Without hardware video decoding, 1080p backgrounds may stutter. Use a picture background on those PCs, or a lower-resolution video.
- macOS builds need macOS 12 Monterey or newer (Chromium 152 requirement).

## Build the Windows installer

Requires Node.js 20+.

```bash
npm install
npm run dist
```

Output in `dist/`:

- `GACC-Worship-Setup-<version>.exe`: the installer. Copy it to any Windows 10/11 PC and run it.
- `GACC-Worship-Portable-<version>.exe`: runs without installing. It keeps its data in a `GACC Worship Data` folder next to the .exe, so it can run from a USB drive. It opens slower because it unpacks itself on every launch.

Bump `version` in `package.json` before building an update. Installing a newer version over an older one keeps the library.

## Run without installing (for development)

```bash
npm start
```

## Other platforms

- macOS: run `npm run dist:mac` **on a Mac** to produce a `.dmg`.
- Linux: `npm run dist:linux` produces an `.AppImage`.

## What the desktop shell adds (main.js)

- Serves the app from a fixed `gacc://app` origin, so localStorage, IndexedDB media, and the projector BroadcastChannel stay stable wherever it's installed.
- Present opens the projector fullscreen on the second display automatically, and follows the projector when cables are plugged in or out. Projector > Move Projector to Next Screen (Ctrl+Shift+P) moves it by hand.
- Media autoplays with sound on the projector, with no "Start media" click needed.
- Asks before closing while the projector is open, and allows only one running copy.
- Spellcheck is off (Tagalog lyrics), and the app can't navigate away from its own content.

## Code signing

The installer is unsigned, so Windows SmartScreen warns on first run (More info > Run anyway).
To remove the warning, buy a code-signing certificate and set `CSC_LINK` / `CSC_KEY_PASSWORD` before `npm run dist`.
