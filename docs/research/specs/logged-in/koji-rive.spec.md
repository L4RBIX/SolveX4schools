# Koji — Rive asset, enumerated

**File:** `public/assets/original/brilliant/brilliant.org/rive/meet_koji.0dced838.riv`
**Size:** 936,330 bytes · **Magic:** `52 49 56 45` (`RIVE`)
**Runtime:** `@rive-app/react-canvas@^4.32.1`

**Status:** ✅ **Enumerated.** The structure below came from loading the file unconstrained
and reading `rive.contents` — not from guessing. An earlier `strings` pass over the binary
produced two wrong conclusions, both corrected here.

---

## Corrections to the earlier `strings`-based reading

A name existing in the binary says nothing about its *role*. Two assumptions failed against
the real runtime:

| Assumed | Actual |
|---|---|
| `NEST_Koji` is a state machine | It is an **artboard**. Its state machine is `test` (56 timelines). Passing it as `stateMachines` made `useRive` fail outright — *"State Machine with name NEST_Koji not found"*. |
| `NEST_DskTutor` is the player's animated Koji | It is a **theme shim**. Its complete timeline list is `darkMode`, `lightMode`. Nothing animates. |

Also: **no artboard in this file exposes any state-machine inputs.** Reactions are therefore
driven by playing a named timeline (`rive.play(name)`), not by firing a trigger input. Any
code written against `stateMachineInputs(...).fire()` will silently do nothing.

---

## Artboards (24) — name | state machine | timeline count

| Artboard | State machine | Timelines |
|---|---|---|
| `MAIN_KojiEntrance` | `KojiEntrance` | 62 |
| **`NEST_Koji`** | **`test`** | **56** |
| **`NEST_Koji_Built`** | **`BuiltToMakeYouThink`** | **79** |
| **`NEST_Koji_Adapts`** | `KojiAdapts` | 80 |
| **`NEST_Koji_Concepts`** | `Concepts` | 78 |
| `NEST_DskTutor` | `DskTutor` | 2 |
| `NEST_Streak-pillar_new` | `State Machine 1` | 1 |
| `NEST_solvables_1` … `_5` | `Adapts` | 8 each |
| `MAIN_Built` | `Built` | 15 |
| `MAIN_Adapts` | `Adapts` | 6 |
| `MAIN_Concepts` | `ConceptsThatClick` | 15 |
| `MAIN_Designed` | `Designed` | 8 |
| `Built_dsk_`, `Adapts_dsk_`, `Designed_dsk_` | `State Machine 1` | 2 each |
| `Concepts_Render` | `State Machine 1` | 2 |
| `Cursor` | `State Machine 1` | 4 |
| `Message` | `State Machine 1` | 2 |
| `OLD_Adapts` | `Adapts` | 6 |
| `OLD_ConceptsThatClick_Fractions` | `ConceptsThatClick` | 15 |

The file's default artboard is **not** Koji, so `artboard` must always be named explicitly.

---

## Which artboard to use

**For the lesson player → `NEST_Koji_Built` / `BuiltToMakeYouThink`.**

The answer-reaction set lives *only* on the three `NEST_Koji_*` artboards:

| Timeline | `_Built` | `_Adapts` | `_Concepts` |
|---|---|---|---|
| `incorrect` | ✅ | ✅ | ✅ |
| `correctAfterIncorrect` | ✅ | ✅ | ✅ |
| `success-small` / `success-medium` / `success-big-1` | ✅ | ✅ | ✅ |
| `yesAnd` | ✅ | ✅ | ✅ |
| `loading-thinking` | ✅ | ✅ | ✅ |
| `lookUp` (+ the 8-way gaze) | ✅ | ✅ | ✅ |
| `waveLeft` | ✅ | ✅ | ✅ |
| `isTalking_idle` | ✅ | ❌ | ✅ |

`_Built` is chosen because it carries `isTalking_idle` and has the fullest set.

**`NEST_Koji` (SM `test`) is a different, simpler character rig** — it does *not* contain
`incorrect` or `success-*`. Its 56 timelines are:

```
koji_IDLE-default   koji_IDLE-short   koji_IDLE-short OLD   koji_IDLE-long
koji_IDLE-rise      koji_IDLE-look-down   resting_blink
inspect   inspect_sad   inspect_loopable   inspect_resting_4s
nudge     nudge_resting_4s
koji_intro   intro_top   intro_left
lesson_finished          <- the success beat on this artboard
streak_loop   streak_everyday_A
Talking Loop
Toss L > R   Toss R > L   Toss R > L_blink   Toss R > L_flashy
Curling L    Curling L_flashy   Curling R
force_field   force_field_surprise spin   force_field_surprise flip
Eye Demo   Particle Appearance (WIP)   -- divider --   Timeline 1
```

plus rig-control channels that are **not playable reactions** — `Eye X/Y`, `Eye Size X/Y`,
`Eye Rotation`, `Upper Eyelid`, `Lower Eyelid`, `Pupil X/Y`, `Pupil Size X/Y`,
`Position X/Y`, `Scale X/Y`, `Tilt X/Y`, `Rotation`, `Glow Opacity`, `Glow Position X/Y`.

---

## Mounting (as shipped)

```ts
useRive({
  src: "/assets/original/brilliant/brilliant.org/rive/meet_koji.0dced838.riv",
  artboard: "NEST_Koji_Built",
  stateMachines: "BuiltToMakeYouThink",
  autoplay: true,
});
```

Verdict → timeline: `wrong → "incorrect"`, `right → "success-medium"`.

Measured placement in the player: canvas **128 × 168 CSS px**, backing store 256 × 336
(**DPR 2**), flush to the viewport's left edge, in a dock at `z-856` above the `z-93` card.

**Appearance:** a rounded four-lobed diamond, green→yellow vertical gradient, simple curved
smile. `kojiGradient` exists in the file. Confirmed against the live render — this is the
real animation, not a redraw.

---

## Reproducing this enumeration

The temporary inspector route used here has been removed. To redo it, mount the file with
**no** `artboard`/`stateMachines` constraint and dump `rive.contents`:

```tsx
const { RiveComponent, rive } = useRive({ src: KOJI_RIV, autoplay: false });
useEffect(() => { if (rive) console.log(JSON.stringify(rive.contents, null, 2)); }, [rive]);
```

Constraining it to a wrong name yields a null `rive`, so the constraint must be dropped
before the file will tell you anything.

## Still unmapped

- `NEST_Streak-pillar_new` (SM `State Machine 1`, 1 timeline) — the 3D pedestal for the
  course map and logged-in home. Not yet wired.
- `Cursor` / `Message` artboards — the speech-bubble rig. The player's bubble was rebuilt in
  CSS instead (measured); these remain unused.
