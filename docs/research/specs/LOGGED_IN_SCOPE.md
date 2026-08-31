# Brilliant logged-in app — scope, blocked on browser access

Status: **not cloned.** Recorded 2026-08-25 from five user-supplied screenshots.
All four surfaces sit behind authentication. The existing `/brilliant/lesson`
route is the honest stub ("Original component unavailable").

## Surfaces observed

| # | Surface | Key elements |
|---|---|---|
| 1 | **Lesson player** | dark ground; segmented progress bar + XP counter; framed problem card w/ amber border; flag + audio icons; "Construct a valid schedule."; constraint checklist (✓/✗); interactive drag-grid "Client Meetings (hours)" 9am–5pm w/ amber (placed) + grey (rejected) blocks; "Start over"; Koji avatar bottom-left w/ amber speech bubble; "Get help" / "Try again" |
| 2 | **Course level map** | "Algorithmic Thinking" course card (22 Lessons, 220 Exercises); LEVEL 1 outlined card; 3D glowing purple pedestal nodes; Koji standing on the active pedestal; locked grey pedestal; "Start" CTA |
| 3–4 | **"You" dashboard** | week paginator; Week/Month/Year segmented control; green "This Week's Summary" card w/ Koji; activity snapshot tiles; "Problems solved" bar chart (7 days); "Your learning progress"; strengths cards (Resilience, Initiative) |
| 5 | **Logged-in Home** | "Welcome, <name>"; ask-bar; streak card w/ 5 day pills; "UNLOCK LEAGUES" 0/175 XP; "Jump back in" stacked course cards; level rail; course thumbnail switcher |

## Already extracted — no re-download needed

`public/assets/original/brilliant/brilliant.org/rive/meet_koji.0dced838.riv`
(936,330 bytes) already contains the logged-in animation set:

- `NEST_Koji_Built` / `NEST_Koji_Adapts` / `NEST_Koji_Concepts` —
  `incorrect`, `correctAfterIncorrect`, `success-big-1`, `success-big-2`,
  `success-medium`, `success-small`, `loading-thinking`, `loading-looking`,
  `yesAnd`, `waveLeft`, `waveRight`, `lookUp/Down/Left/Right`,
  `isTalking_idle`, `isTalking_scale`, `Bracket morph_enter/exit`,
  `Hover_koji_v01/v02`  → the tutor's answer reactions in surface 1
- `NEST_Streak-pillar_new` → `Extrude`  → the 3D pedestal in surfaces 2 and 5
- `Cursor` / `Message` → `Got it!`, `Huh?` → the speech-bubble states

## BLOCKED — needs browser automation, must not be eyeballed

Per the project rule (measure, never estimate — three token errors and one
invented illustration this session all came from eyeballing), none of the
following may be written from screenshots:

- every computed CSS value (dark palette, type ramp, radii, borders, shadows)
- the drag-and-drop interaction model of the schedule grid
- answer-validation states and their transitions
- progress-bar segment logic and XP rules
- chart library, axis config, bar geometry
- responsive behaviour at 768 / 390

## Personal data

Surfaces 3–5 render the account holder's real name, streak, accuracy and
question counts. Clone the layout; wire to mock data unless told otherwise.
