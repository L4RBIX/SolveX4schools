# Third-party assets on production routes

Status: **BLOCKING for a paid deployment.** Everything listed here renders on a
route a paying school would open. None of it is ours.

This file exists so the swap is a shopping list rather than an investigation.
It is written from `grep`, not from memory: every path below was read out of the
component that references it.

## What is shipping and where it came from

| Asset | Origin | Used by | Route |
| --- | --- | --- | --- |
| `videos/homepage/courses/cs-refresh.webm` + poster | brilliant.org marketing video | `hero.tsx`, `feature-row` instances in `public-landing.tsx` | `/` |
| `images/homepage/get-started/*` | brilliant.org | `get-started.tsx` | `/` |
| `ds055uzetaobb.cloudfront.net/brioche/chapter/*.png` (9 files) | Brilliant course art CDN | `schools/presentation/illustrations.ts` → `MONTH_ART` | `/home`, `/program`, `/course/[n]`, `/lesson/[id]` |
| `ds055uzetaobb.cloudfront.net/category-images/Computer_Science-JEbqeF.png` | same | `PROGRAMME_ART` | `/program` |
| `brioche/uploads/lessons/scene-setter-final-*.png` | same | `SCENE_SETTER` | `/lesson/[id]` |
| `images/loggedInHomepage/leagues-locked.svg` | brilliant.org | `home-rail.tsx` goal badge | `/home` |
| `rive/koji-gameboard.e2320c48.riv` | brilliant.org Rive scene | `gameboard-pedestal.tsx` | `/course/[n]` |

## Why this is a blocker and not a to-do

These are not stock images with a permissive licence that nobody got around to
attributing. They were downloaded from a competitor's CDN during the
reverse-engineering phase, which is a legitimate way to *measure* a design and
not a licence to *redistribute* the artwork. Serving them from a product a
school pays for is redistribution, and the Rive scene and the marketing video
are the two most identifiable pieces on the list.

The same reasoning already removed two other things, and it applies here
unchanged:

- CoFo Brilliant and CoFo Robert are commercially licensed by Contrast Foundry
  and are **no longer deployed at all**. They used to be declared in
  `src/app/layout.tsx`, which put their `@font-face` rules into every production
  page and pointed `--font-b-sans` — the family the entire product renders in —
  straight at them. They now live in `src/app/brilliant/layout.tsx` (which
  `notFound()`s in production) with the files under `reference/fonts/` rather
  than `public/`, so a production build emits neither the rule nor the file.
  Verified against the build output: the CSS chunks linked by `/`, `/home`,
  `/you` and `/program` contain `@font-face` for IBM Plex Sans, JetBrains Mono
  and Source Code Pro only.
- `@bible-strong/avatar-react` is AGPL-3.0-only, so the package is neither
  installed nor imported; Strobi is rendered from the definition file by our own
  code (`src/components/nova/strobi-avatar.tsx`), and reading a documented data
  format creates no obligation.

## What has already been done to make the swap cheap

- **One registry.** Every month, lesson, gameboard and deck image resolves
  through `schools/presentation/illustrations.ts`. Replacing the artwork is one
  file; no component holds a path.
- **Intent is recorded.** `MONTH_ART[n].intent` says what each slot is *for*
  ("halving a search space; converging boundaries"), so replacement art can be
  commissioned against a brief instead of guessed at.
- **Nova is already ours.** The mascot on every product screen is Strobi,
  rendered from a definition we hold, in the product's own violet — not Koji.
  `/you` no longer loads `koji-weekly-summary.svg`.

## What still has to happen before a paid deployment

1. Commission or licence nine month illustrations, one programme image, one
   lesson scene-setter, and a goal badge. Point `illustrations.ts` at them.
2. Replace the landing hero and feature-row clips, or drop the video and let the
   landing carry type and the product's own screenshots.
3. Replace `koji-gameboard.riv`. The pedestal already has a static fallback
   (`gameboard-pedestal.tsx`), so the fastest honest interim is to disable the
   Rive path and ship the static pedestal.
4. Re-run `grep -rn "assets/original" src/components schools` and confirm the
   only hits left are under `src/components/brilliant/about`,
   `src/components/brilliant/faq`, `src/components/brilliant/wiki`,
   `src/components/brilliant/subject*` and `src/components/elice` — the
   reference clones, which `src/app/brilliant/layout.tsx` already `notFound()`s
   in production.
