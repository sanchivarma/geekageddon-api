Jokes API — Border animation options
===================================

This folder contains the jokes serverless endpoint and helpers. The joke SVG generator supports a few optional border styles that help your cards stand out.

Query parameters (use them on the endpoint `/api/jokes`):

- `borderAnimation` (string): one of `none`, `dash`, `gradient`, `neon`, `gif`. Default: `none`.
  - `dash` — moving dashed stroke.
  - `gradient` — animated gradient stroke sweep.
  - `neon` — glow effect using SVG filters.
  - `gif` — use `borderImage` to supply a transparent GIF/PNG overlay shown around the card.
- `borderImage` (string): URL to an animated GIF/PNG used when `borderAnimation=gif`.
- `reduceMotion` (boolean): set `true` to disable animations (also respects `prefers-reduced-motion`).

Examples:

- Static border (default):
  - /api/jokes
- Dashed moving border:
  - /api/jokes?borderAnimation=dash
- Gradient sweep:
  - /api/jokes?borderAnimation=gradient
- Neon glow:
  - /api/jokes?borderAnimation=neon
- GIF border overlay (hosted on same origin or CORS-enabled):
  - /api/jokes?borderAnimation=gif&borderImage=https://example.com/borders/retro.gif

Notes & caveats
---------------
- GIF/PNG overlay can have CORS issues when referenced from other origins. If you host GIFs externally, ensure CORS allows embedding.
- Animated filters (neon) and animated strokes can be heavier on CPU/GPU on low-end devices. Offer `reduceMotion=true` for accessibility and lower-power devices.

If you want me to add a preset gallery or example images to the repo, I can add a small `assets/borders/` set and example URLs.
