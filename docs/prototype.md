# ORGANISM — No Final Form

An endless, browser-local pixel body-horror prototype. You assimilate recognizable body parts, grow a branching organism, discharge biomass through multiple organs, and plant a network of colonies. The public Site requires no sign-in. A run lives in browser memory; only the best kill count persists locally.

## Play

Run `npm start`, open http://localhost:4173, and choose **Become**. Desktop keyboard and mouse are recommended. Phones have a movement joystick and clickable commands.

| Input | Action |
| --- | --- |
| WASD / arrows | Move through the unbounded world. |
| Mouse / hold click or Space | Aim and fire manually. |
| F | Toggle automatic targeting (on initially). |
| B / Body workshop | Pause to select, equip and upgrade individual body parts. |
| [ / ] or inspector arrows | Select the previous / next body part. |
| 1–7 | Equip the selected part with bile, bone, larvae, tongue, blood, spore or scream. Other parts retain their weapons. |
| U / Upgrade | Spend biomass to upgrade the selected part, up to level five. |
| Z / discharge buttons | Cycle Sip, Feast and Rupture. All organs participate; the mode changes damage, shot cost and cadence. |
| Q | Bud an orbiting shield for 18g. |
| E | Spawn an independent hunter drone for 28g. |
| T / tower selector | Choose bile spire, rib harpoon, brood hive, or rooted maw. |
| R | Root the selected tower where you stand. |
| C | Plant a colony for 65g, at least 220m from other colonies. |
| X | Reabsorb living mobile offspring within 700m. Towers remain rooted. |
| Escape | Pause; losing focus also pauses. |
| Sound button | Separate score/effects sliders and master mute. |

Every part owns a weapon, upgrade level, aim and cooldown. Holding fire triggers all ready parts together; auto-fire lets each organ choose a reachable enemy independently. The selected part is only the editing target, never the sole active weapon. Each part pays its own shot cost and preserves a 12g reserve. Unaffordable or out-of-range organs skip firing without blocking other organs. Rotating processing priority distributes low-biomass opportunities. Weapon changes and upgrades preserve cooldown, so they cannot create instant extra shots.

Parts have five levels. Upgrades cost 12/24/36/48g and affect only that organ: each additional level adds 35% of base damage, 8% of base range and shot cost, and 12% base firing speed. Global mutations stack with these local upgrades. The HUD shows the cost of a complete mixed volley; actual automatic volleys vary with target availability and cooldowns. The workshop suspends simulation, and closing it restores the prior playing/paused state. Restart clears loadouts and upgrades.

## Body and prey

The body grows as trailing chains with sparse binary forks, at most two children per joint. Forks split behind the growing tip to leave two substantial arms. Links maintain bounded lengths through turns; fork joints maintain lateral tension so the arms separate. The starter body demonstrates several weapon families immediately. New grafts inherit a weapon from their anatomical kind (for example ribs/antlers fire bone, jaws/tendrils lash tongues, and bile sacs spit acid). Human heads, arms and torsos; hound jaws and legs; stag skulls and antlers; and monstrous ribs, eyes, sacs, tendrils and mouths retain their visual identity after assimilation. Enemy, corpse and graft rendering reuse the same anatomy sprites.

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

`npm test` runs the real simulation through Node's built-in test runner. Coverage includes lineage-preserving grafts, branching topology, unlimited coordinates, multiple colonies, all tower types, independent drone pursuit, biomass accounting, discharge levels, all seven weapons, simultaneous mixed volleys, per-part upgrades and cooldown ownership, pause, death, reset, and endless stage progression. Browser checks cover controls, colony planting, audio, responsive layout and a crowded mature organism. `window.organism.snapshot()` exposes read-only state for browser QA.

This remains a single-player prototype. There is no cross-device save, permanent unlock tree, multiplayer, or gamepad support. Moving to a standalone engine requires a port; the separate simulation and its invariants are the reusable design basis.
