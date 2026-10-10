# Art and audio direction

## Visual thesis

An organism made of recognizable stolen anatomy, held together by wet connective tissue. The shape should feel unstable and alive: fleshy chains, asymmetrical forks, independent eyes, crooked teeth, exposed ribs and limbs that no longer belong to one animal. Preserve the identity of what was eaten.

Creative references guide the mood of infestation and transformation. Do not substitute recognizable movie creatures or copied game sprites for this game's own anatomy.

## Pixel language

The runtime renders to a reduced-resolution canvas and scales with nearest-neighbor pixels. Primitives use integer coordinates; flesh shading uses stepped clusters rather than smooth gradients. Desktop normally uses a three-screen-pixel presentation per canvas pixel; small viewports use two. Scale and camera zoom can change the effective size of a sprite.

Use a dark outline, a broad meat midtone, a restrained lit plane and a few sharply placed wet highlights. Bone gets angular ivory strokes; teeth are readable light-dark repetitions. A glistening surface needs only a handful of bright pixels. Avoid adding detail that disappears at play scale.

The current 2.5D treatment comes from ground shadows, small vertical offsets, upright human figures and vertical sorting. It does not use meshes, normals, real lights or a 3D camera.

## Palette

These are the renderer's principal material colors, not a restriction against every other accent:

| Material | Color | Use |
| --- | --- | --- |
| Deep tissue | `#190f1c` | Outlines and cavities |
| Dark blood | `#612536` | Creases and wounds |
| Meat | `#9b4358` | Main flesh planes |
| Lit meat | `#d1747e` | Raised flesh |
| Fat / wet highlight | `#d8ad96` | Highlights and exposed tissue |
| Bone | `#ded0ac` | Teeth, ribs and antlers |
| Acid | `#c0ce76` | Bile and chemical activity |
| Interface ground | `#13161e` | Quiet background for anatomy and effects |

World colors stay darker and less saturated than interactive flesh. Woods use dirty greens, works use industrial grays, and marshes use bruised purples. UI text uses warm off-white and muted rose. Weapon markers differentiate families, while shape and labels provide additional information.

## Anatomy and silhouettes

- **Core / flesh:** irregular lobes, cavities, off-center mouths and small wet highlights.
- **Humans:** heads, bent fingers, torsos and rib structure must remain readable after grafting.
- **Animals:** elongated jaws, different leg proportions and forked antlers break the humanoid silhouette.
- **Monstrosities:** amplify an anatomical idea—too many ribs, enlarged bile sacs, clustered eyes or an oversized mouth—rather than merely enlarging a circle.
- **Whole body:** mostly trailing chains with occasional substantial forks. Connectors should visibly join parts while fine tendrils add movement around the silhouette.
- **Infrastructure:** rooted towers spread short tendrils into the ground. Drones have a small jaw and trailing tail. Shields combine hardened tissue and antlers.

`PixelWorld.part()` is the shared renderer for identifiable anatomy in enemies, remains and grafts. The [atlas](../assets/anatomy-atlas.png) is exported from this same code; it is not an independently authored sprite sheet that the game loads.

## Motion and effects

Breathing lobes, oscillating tendrils, small eye/teeth contrasts and brief orifice flashes make the organism feel active. Movement should communicate a heavy center pulling elastic tissue. Forks need visible divergence rather than permanently overlapping arms.

Bile should glob and pool; ribs should streak as hard fragments; larvae should bend in pursuit; tongues should extend and retract; blood lances should read as narrow jets; cysts should burst into an area hazard; screams should radiate outward. Avoid making every weapon a differently colored bullet.

The current system has procedural particles, stains, trails and shake. Future severing, reattachment, transformation anticipation and authored animation states remain art tasks. They are not present as sprite-sheet animations today.

## UI direction

A restrained specimen-workbench interface: monospace labels, thin borders, muted panels and clear numeric costs. The body workshop is a paused surgical inventory. Put the selected part's identity, weapon, level and upgrade cost together; equipped counts should convey that other weapons remain active.

Dense presentation must not obscure the living field. Desktop is the main target; phone layouts expose touch controls and a compact workshop. Larger text settings, remappable input, a reduced-motion setting and configurable gore are future work, not current accessibility guarantees.

## Audio direction

`dist/audio.js` synthesizes the current soundtrack and effects with Web Audio. There are no hidden sample libraries or missing WAV/MP3 dependencies.

The score uses a slow minor ostinato, low detuned sustained tones, filtered breathing noise and a two-part heartbeat. Stage and colony threat affect pacing. Pause and workshop states reduce the musical level. Gameplay adds wet pitch slides, filtered bursts, snaps, impacts and low damage tones. Bone, parasite and tongue attacks have distinct branches; the remaining weapon families currently share a generic wet-shot treatment.

The mix prioritizes discrete combat events over endless overlapping peaks. Voice limits and short event rate limits bound buildup; panning follows event position relative to the player. Separate music/effects controls and master mute are implemented. Audio begins after a user gesture, as required by browsers.

Future audio work: distinct signatures for blood, spore and scream; more deliberate intensity layers; softer sustained listening fatigue; authored creature vocalizations; and exportable production tracks if a future engine needs offline audio assets.
