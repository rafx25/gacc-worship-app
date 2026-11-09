# Changelog

All notable changes to GACC Worship. Dates are in Philippine time (GMT+8).

History before the first git commit (Nov 9, 2026) was rebuilt from build
output and work notes, so dates and early versions are approximate.

## [Unreleased]

### Added
- GitHub Actions: builds the Windows installer and portable app on every push,
  and publishes a GitHub Release when a `v*` tag is pushed.

### Fixed
- Per-song live background: picking a song in the playlist now opens that same
  song in the editor, so the background you set is the one that goes live.
- Projector no longer rebuilds its screen on every save, which dropped the
  background and made it reload and lag.
- Changing backgrounds now crossfades: the new video fades in only once it is
  playing, then the old one is removed. No black flash or stutter. Quick
  back-to-back changes keep the newest background.

### Changed
- `npm run sync` falls back to the committed `app/index.html` when
  `GACC Worship.html` is not next to the repo (fresh clone / CI).
- `.gitignore` now excludes `dist/` (installers, app data, caches).

## [1.3.5] - 2026-11-03

### Fixed
- Full-slide pictures now stretch to fill the screen in preview and on the
  projector instead of being cropped.

## [1.3.2] - 2026-11-02

### Added
- Section picker shows the opening lyrics of each section for faster jumping.

### Fixed
- Video backgrounds loop seamlessly with no stutter or freeze at the loop point.

## [1.3.0] - 2026-11-02

### Added
- **Insert** tab: add pictures, text boxes, and shapes to any slide.
- Slide objects can be dragged, resized, styled, and animated, and show on the
  projector.

## [1.2.0] - 2026-11-01

### Added
- PowerPoint-style ribbon:
  - **Design**: solid, gradient, moving, picture, and video backgrounds.
  - **Transitions**: Fade, Push, Wipe, Zoom, Through black, with duration.
  - **Animations**: Appear, Fade, Float in, Fly in, Zoom, Shrink, Wipe, Bounce,
    Blur in, Spin in; by object, line, word, or letter; on click or automatic.
- Text effects: shadow, glow, neon, outline.
- Custom slides with **+ Slides**; duplicate, reorder, and delete slide cards.
- Shortcuts: Ctrl+Enter / Ctrl+M for a new slide.

## [1.1.0] - 2026-10

### Added
- Rich-text lyrics editor: 23 fonts, sizes, bold/italic/underline, colors,
  highlight, alignment, line spacing, vertical position, case change,
  undo/redo, and keyboard shortcuts. Formatting shows on the projector.

## [1.0.0] - 2026-10-18

### Added
- First desktop release (Electron) for Windows: Setup installer and Portable app.
- Song library, lyrics editor, live preview, and full-screen projector window
  on a second display.
- Backgrounds (images, videos), logo, dark and light theme.
- Works offline; data saved locally. Portable mode keeps data next to the app.
