# Asset inventory

The playable prototype creates its graphics and sound at runtime. The full asset source is included in the repository; there is no separate missing art pack or soundtrack download.

| Asset | Source / file | How it is used |
| --- | --- | --- |
| Anatomy sprites, including faces, jaws, limbs, antlers, eyes and ribs | [`PixelWorld.part()`](../dist/pixel-world.js) | Shared by prey, remains and the player |
| Organism, tentacles, towers, colonies and offspring | [`pixel-world.js`](../dist/pixel-world.js) | Procedural pixel drawing and animation |
| Terrain, stains, pools, particles and weapon traces | [`pixel-world.js`](../dist/pixel-world.js) | Generated at runtime |
| Horror score, heartbeat, breathing and wet combat effects | [`audio.js`](../dist/audio.js) | Web Audio synthesis after user interaction |
| Game icon | [`organism-mark.svg`](organism-mark.svg) | Standalone copy of the original favicon artwork |
| Anatomy reference sheet | [`anatomy-atlas.png`](anatomy-atlas.png) | Exported visual reference; not loaded by gameplay |
| Atlas viewer / exporter | [`atlas.html`](atlas.html) | Reuses live content and rendering code to export the sheet |
| Interface glyphs and typography | [`index.html`](../dist/index.html), [`style.css`](../dist/style.css), [`content.js`](../dist/content.js) | Unicode glyphs and system monospace fonts; no bundled font files |

## Regenerate the atlas

Serve the repository root with `python3 -m http.server 4174`, visit **http://localhost:4174/assets/atlas.html**, and choose **Download PNG**. The export contains labeled reference cells on a dark background, not transparent runtime animation frames. Save the result as `assets/anatomy-atlas.png` when the renderer changes.

The exporter calls the existing renderer with fixed time and seeds for a repeatable reference pose. The runtime still animates those parts continuously. No external asset tooling or package installation is required for the interactive exporter.

## Provenance

The pixel drawing code, favicon geometry, score and synthesis were created for this prototype with Codex under aviadr1's direction. The named films and games are mood/design references only. No screenshots, models, sprites, samples, soundtrack recordings or fonts from those works are included.

See [art and audio direction](../docs/art-direction.md) for the material palette, animation language and sound goals. No distribution license has been selected yet; this inventory is not a license grant.
