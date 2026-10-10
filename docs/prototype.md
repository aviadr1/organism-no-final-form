# ORGANISM — The Hungry Garden

A browser-local single-player prototype combining snake movement, biomass management, mutations, and tower defense. No backend or account data is used by the game. Sites hosts the game publicly; no sign-in is required.

## Play

Run `npm start`, open http://localhost:4173, and choose **Emerge**. Desktop keyboard and mouse are recommended; a touch joystick and action buttons are available on phones.

- WASD / arrow keys: move. Mouse: aim. Hold mouse / Space: fire manually.
- F: toggle automatic targeting and firing (enabled initially).
- 1–4: morph between the bile gland (acid pools), rib repeater (bone spread), brood cyst (homing parasites), and feeding tongue (wide melee lash). All four are available immediately.
- The sound button opens independent music/effects sliders and a master mute. Sound starts with the Emerge gesture.
- Q: spend 18g to grow an attached orbiting shield.
- E: detach an attached shield for free; otherwise spend 24g to bud a hunting drone.
- R: spend 28g to root a tower at the current location.
- X: absorb all surviving offspring, recovering biomass proportional to remaining health.
- Escape: pause. The game also pauses when the browser loses focus.

Defend the mother nest through six waves, including the broodmother. Eating remains adds biomass and mutation nutrients. Shooting spends biomass. Splitting and shooting preserve a 12g reserve; enemy damage can still kill the body. Offspring are capped at ten. Every cleared wave repairs eight nest integrity and allows seven seconds to feed. There are nine stackable mutation types. Run adaptations reset on death; only the best kill count persists in local storage.

## Structure

`dist/engine.js` owns world state, spawning, damage, biomass accounting, projectiles, mutations, and wave progression. It has no DOM dependencies and accepts an injectable random function. `dist/game.js` owns input, fixed-step ticking, canvas composition, and UI. `dist/flesh.js` renders shared living tissue, mouths, eyes, tapering tentacles, weapon organs, viscous trails, and remains. `dist/audio.js` owns the original procedural horror score and layered wet sound effects; it schedules against the Web Audio clock, limits simultaneous voices, and routes reverb through the music volume control. `dist/style.css` and `dist/index.html` provide the interface. The soundtrack combines a minor-key ostinato, detuned choir, heartbeat, and breathing textures; threat increases its tempo.

The game uses oblique 2D canvas drawing for its 2.5D presentation, with no third-party runtime JavaScript. Fonts have system fallbacks.

`npm test` exercises the real simulation with Node's built-in test runner. Browser checks should cover movement, every offspring transition, pause, mutations, end states, and touch input. Read-only `window.organism.snapshot()` exposes current state for browser checks and tuning.

## Prototype limits

The body is visually flexible; only its head takes collision damage. It is not a full soft-body simulation. No multiplayer, cross-device saves, permanent unlock tree, or gamepad support is included. Mobile uses a full-arena view and needs a follow camera before becoming a primary target. Biomass and difficulty tuning are provisional.

Moving to a standalone engine requires porting the simulation; keeping rendering separate preserves the rules and test cases, not automatic engine compatibility.
