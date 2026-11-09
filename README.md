# GACC Worship — desktop app

Electron wrapper that turns `../GACC Worship.html` into an installable desktop app.
The HTML file is the only copy of the app: edit it, then rebuild. `npm run sync` copies it into `app/index.html`, and every start and build runs that step first.

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
