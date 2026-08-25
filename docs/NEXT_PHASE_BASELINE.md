# Next-phase baseline

Frozen before any backend work. Everything below was measured, not recalled.

**Date:** 2026-08-26
**Branch:** `master`
**SHA:** `c2e120baa1617301325a33b3f810414f71a1acef`
**Working tree:** clean (0 modified files)
**Node:** v24.14.1 · **npm:** 11.11.0
**Disk:** 8.9 GiB free of 228 GiB (96% used — `.next` is ~700 MB and safe to clear;
a previous ENOSPC killed a build mid-run, so clear it between full builds)

---

## Gate results

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | exit 0, no output |
| Tests | `npx vitest run` | **240 passed** (13 files) |
| Lint | `npm run lint` | **0 errors**, 7 warnings (all pre-existing `<img>` in `/brilliant/about`) |
| Curriculum | `npm run curriculum:validate` | **0 errors**, 0 warnings |
| Build | `npm run build` | compiled successfully, 27 routes |

The 240 include the imported subsystem's own 209 and the school adapter's 31.
`tests/golden.test.ts` — 26 assertions over 10 synthetic learners — is inside
the 209. **If it goes red, the intelligence changed.** It is never fixed by
editing the expectation.

## Curriculum inventory at freeze

```
Month                          promised  built  validated  published
1. Қыркүйек                         36     36          0          0
2–9                                243      0          0          0
Total                              279     36          0          0
```

September is complete at 36/36. Months 2–9 carry full structure with `draft`
lesson bodies. **This phase must not change these numbers.**

## Student surfaces at freeze

Screenshots captured at 1456×824, Russian locale (to confirm the bilingual
chrome), against the dev server:

| Route | State |
|---|---|
| `/welcome` | Rebranded hero — split composition, animated product clip, `.b-press` CTAs |
| `/` | HomeRail + 3D CourseDeck + thumbnail rail |
| `/paths` | LearningPathsPage — path row, progress ring, month tile carousel |
| `/course/1` | CourseGameboard — sticky level headers, zig-zag path, Rive pedestals |
| `/lesson/m1.l1` | Lesson runtime — fixed inset card, verdict border, Rive Koji, Button3D |

**These must remain visually intact.** This phase is behaviour, data, AI,
execution and evidence — not visual redesign.

## What this phase may not weaken

- Learning Intelligence core behaviour (no fork, adapters only)
- The `unmeasured` fifth verdict state
- The rule that a wrong answer without an authored diagnostic mapping stays
  `unknown` and the engine answers `DIAGNOSE`
- Curriculum validator rules and September's 36/36
- The independence rules and the hint policy
- Any existing test — tests are not removed because integration is hard
