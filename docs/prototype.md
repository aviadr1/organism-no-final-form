# ORGANISM — No Final Form

An endless, browser-local pixel body-horror prototype. You assimilate recognizable body parts, grow a branching organism, discharge biomass through multiple organs, and plant a network of colonies. The public Site requires no sign-in. A run lives in browser memory; only the best kill count persists locally.

## Play

Run `npm start`, open http://localhost:4173, and choose **Become**. Desktop keyboard and mouse are recommended. Phones have a movement joystick and clickable commands.

| Input | Action |
| --- | --- |
| WASD / arrows | Move through the unbounded world. |
| Mouse / hold click or Space | Aim and fire manually. |
| F | Toggle automatic targeting (on initially). |
| 1–7 | Bile glands, ribshot, larval brood, tongue lash, blood lance, rupture cyst, choir of teeth. |
| Z / discharge buttons | Cycle Sip (one mouth), Feast (up to three), Rupture (up to eight). |
| Q | Bud an orbiting shield for 18g. |
| E | Spawn an independent hunter drone for 28g. |
| T / tower selector | Choose bile spire, rib harpoon, brood hive, or rooted maw. |
| R | Root the selected tower where you stand. |
| C | Plant a colony for 65g, at least 220m from other colonies. |
| X | Reabsorb living mobile offspring within 700m. Towers remain rooted. |
| Escape | Pause; losing focus also pauses. |
| Sound button | Separate score/effects sliders and master mute. |

Every weapon has a per-orifice cost. The discharge readout displays the maximum volley cost, including mutations. Auto-fire charges only mouths with a target, although the complete volley reserve must be affordable before firing. Firing and building preserve 12g; hostile damage can still kill the body below 6g. Switching weapons cannot bypass cooldown.

## Body and prey

The body is a graph of connected tissue nodes, with multiple branches from the core and secondary branching. It does not follow a snake trail. Human heads, arms and torsos; hound jaws and legs; stag skulls and antlers; and monstrous ribs, eyes, sacs, tendrils and mouths retain their visual identity after assimilation. Enemy, corpse and graft rendering reuse the same anatomy sprites.

Each kill drops biomass and one identifiable organ. Eating adds mass and nutrients; eating the organ grafts it onto the body. Sixteen stackable mutations alter offense, range, metabolism, anatomy, colony costs, regeneration, or hunting. Mobile offspring use separately allocated mass. Reabsorption refunds only the surviving fraction of their health.

For stable frame times, the active anatomy has at most 49 nodes. Additional organs fuse into existing tissue; source-species counts and biomass continue to accumulate. Body size also has a visual scale limit. This is a rendering/gameplay budget, not an endlessly expanding mesh.

## World and colonies

World coordinates have no arena boundary. Deterministic terrain tiles form quarantine woods, abandoned works and meat marshes. New chunks add local prey and remains. Infection stages increase every 45 seconds without a victory cap; every fourth stage brings a Congregation boss.

Colonies and towers retain their positions when you travel away. Colonies within 1,000m are active; more distant ones are dormant and safe until you return. Active colonies periodically give nearby players a little biomass and heal nearby offspring. Losing colonies does not end the run. Drones choose targets around their own position and pursue them independently; they return toward the player when prey runs out. Distant enemies and remains are discarded to bound active simulation cost, and enemy population is capped.

Terrain structures are visual scenery in this prototype, not impassable obstacles. The radar shows nearby enemies, offspring and colonies; edge beacons point toward up to five most recently planted colonies.

## Implementation

- `dist/content.js`: canonical species, part, weapon, discharge, tower, mutation and biome definitions.
- `dist/engine.js`: browser-independent simulation and biomass ownership. Injectable randomness supports reproducible checks.
- `dist/pixel-world.js`: low-resolution canvas renderer, integer raster lines, reusable anatomy sprites, procedural terrain, camera and effects. CSS scales it with nearest-neighbor pixels.
- `dist/game.js`: fixed-step ticking, controls, selection panels, HUD, radar and read-only diagnostics.
- `dist/audio.js`: original procedural score and wet effects, audio-clock scheduling, voice limits, complete music/effects gain routing.

`npm test` runs the real simulation through Node's built-in test runner. Coverage includes lineage-preserving grafts, branching topology, unlimited coordinates, multiple colonies, all tower types, independent drone pursuit, biomass accounting, discharge levels, all seven weapons, pause, death, reset, and endless stage progression. Browser checks cover controls, colony planting, audio, responsive layout and a crowded mature organism. `window.organism.snapshot()` exposes read-only state for browser QA.

This remains a single-player prototype. There is no cross-device save, permanent unlock tree, multiplayer, or gamepad support. Moving to a standalone engine requires a port; the separate simulation and its invariants are the reusable design basis.
