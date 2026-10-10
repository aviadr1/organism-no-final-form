# Architecture, development and publishing

## Module ownership

| File | Owns |
| --- | --- |
| `dist/content.js` | Weapon, anatomy, enemy, tower, mutation and biome definitions |
| `dist/engine.js` | Game state, body graph, combat, mass spending, upgrades, enemies and colonies |
| `dist/pixel-world.js` | Original pixel drawing, anatomy shapes, terrain, camera and visual effects |
| `dist/audio.js` | Original Web Audio synthesis, score scheduling, effects and volume routing |
| `dist/game.js` | Input, fixed-step updates, DOM panels, HUD and renderer/audio integration |
| `dist/index.html`, `dist/style.css` | Page structure, interface and responsive presentation |
| `tests/` | Node tests running the real simulation with repeatable fixtures |
| `assets/atlas.html` | Visual catalog and PNG exporter reusing the anatomy renderer |
| `scripts/export-catalog.mjs` | Generated design tables sourced from the gameplay definitions |

The `dist` directory is authored source, not disposable build output. No bundler, engine package or dependency install is required. The engine imports definitions but does not depend on browser APIs; this enables fast simulation tests. Rendering and sound consume engine state and events. `window.organism.snapshot()` exposes read-only browser diagnostics.

## Local workflow

Use Node.js 22+ and Python 3. `npm start` serves `dist/` at port 4173. `npm test` runs the simulation suite. `npm run docs:catalog` rebuilds the abilities reference after changes to content definitions. The GitHub check runs tests and checks that the generated catalog is current.

For the asset atlas, serve the repository root separately:

```sh
python3 -m http.server 4174
```

Visit http://localhost:4174/assets/atlas.html. The page imports the live renderer and offers a PNG download. It is a developer asset tool and is not part of the public game's `dist/` payload.

## Persistence and performance

A run is browser memory only; best kill count is stored in local storage. There is no server authority, login, database, telemetry collector, save/resume or synchronized multiplayer.

Body nodes, active enemies, hazards, mobile offspring and cosmetic effects have budgets. Distant colonies become dormant, and distant enemies and remains are removed. Coordinates are unbounded in the game design; this is not a promise of unlimited memory or physically infinite precision. The set of explored sectors grows with exploration.

The engine uses a fixed-step browser loop and clamps individual tick duration. Tests inject randomness. That does not make the whole game a multiplayer-ready deterministic lockstep simulation: browser input timing, floating-point behavior and cosmetic randomness still require a network design.

## Verification

Simulation tests exercise assimilation, topology and link constraints; simultaneous mixed weapons and local cooldowns; mass reserves and upgrades; individual weapon effects; colony separation; stationary towers; independent hunting and recall; pauses, death, reset and endless infection progression.

Manual browser verification should cover starting and unlocking audio, moving/feeding, equipping and upgrading an individual part, resuming the workshop, simultaneous fire, discharge selection, tower/colony/drone commands, mute, and narrow-screen layouts. Use a mature anatomy as well as a fresh run when checking readability and frame time.

Performance observations depend on the device. No universal frame-rate target is validated by the existing automated tests.

## Publishing

The current game is publicly hosted at https://organism-the-hungry-garden.cocoachord9.chatgpt.site/ through Sites. `.openai/hosting.json` binds this checkout to that existing project and declares `dist` as the static directory. It contains a project identifier, not credentials.

The GitHub repository is the public source and design home. GitHub pushes alone do not redeploy the Sites game. Publishing a runtime change to Sites requires its supported source synchronization, archive, saved-version and deployment workflow, with the current project's access configuration preserved. Source credentials must remain ephemeral and never be committed.

Any ordinary static host can serve `dist/` over HTTP(S); no environment variables or server functions are required by the game. Forks must remove or replace the original Sites identity before creating their own deployment. This repository does not automatically configure GitHub Pages or create a second public game URL.

## Porting boundaries

The content definitions and simulation contracts are useful design references for a future port. The renderer, browser interface and Web Audio implementation would need adaptation to another engine. A Roblox version, desktop edition or multiplayer service should have an explicit product and architecture decision before implementation.
