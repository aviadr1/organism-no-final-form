# Roadmap and open design questions

This is a proposed sequence, not a dated delivery commitment. The public browser prototype is the completed baseline; future platform choices remain open.

## Baseline — playable now

Unbounded scrolling world; pixel-art humans, animals and monstrosities; visible corpse grafts; mostly linear trailing body with forks; per-part loadouts and five-level upgrades; seven concurrently active weapon families; three discharge settings; sixteen mutations; colonies, four towers, orbiting shields and independent hunters; procedural music and sound; keyboard/mouse and touch controls; automated simulation checks.

## Next — make the body excellent

- Playtest steering and turning with small and large anatomies; tune overlap and camera framing.
- Improve part selection in crowded bodies and make weapon ownership instantly readable.
- Tune mass income, shot expenditure, upgrade cost and late-run snowballing.
- Clarify incoming attacks, hit feedback and why a run ends.
- Add control remapping, gamepad support, scalable text and optional reduced motion.
- Give the remaining weapon families their own audio signatures.

**Exit evidence:** players can explain why they died, identify what their selected part does, and deliberately choose a build. Favor observed sessions over only longer automated survival runs.

## Then — deepen the ecosystem

- Consider choosing fork locations, stronger anatomical weapon identities and organ-specific health.
- Prototype severing and reattachment without making accidental loss tedious.
- Give prey more distinct behavior, including escape or group tactics where appropriate.
- Add colony objectives, meaningful routes, defensible spaces and reasons to return.
- Explore different hunter orders and more explicit shield roles.
- Add save/resume before expanding expected session length.

**Exit evidence:** exploration and construction create strategic choices beyond simply increasing damage. A mature body stays readable and performant on target hardware.

## Later — choose a product and platform

### Desktop / Steam direction

Select engine or browser packaging based on measured performance, controller requirements, tools and content scale. Decide whether the full game has endless survival, missions, extraction or a campaign. Add robust saves, menus, accessibility, production assets and release testing. Steam is a possible storefront, not the chosen game engine.

### Multiplayer direction

First choose co-op, competition, or both. Define ownership of colonies, prey and recovered mass; player death and reconnection; simulation authority; bandwidth budgets for branching bodies and many projectiles; and how pauses/workshops work in a shared world. The current paused workshop cannot carry over unchanged to live multiplayer.

### Roblox direction

Treat this as an adaptation with its own input, performance, presentation and publishing requirements. The current JavaScript project is not a Roblox place. Review platform requirements when choosing that route rather than assuming this prototype can be uploaded unchanged.

## Decisions still open

- Should any organ equip any weapon, or should anatomy constrain compatibility?
- Does spending mass visibly shrink or shed individual parts?
- Can a player plan branching, or only adapt to consumed anatomy?
- What is the ideal full-run duration and endpoint?
- Are colonies support stations, objectives to defend, or an economy with production?
- Is progression entirely within runs, or are there lasting unlocks?
- What are the minimum device and frame-time targets?
- What distribution license should apply to code and assets?
