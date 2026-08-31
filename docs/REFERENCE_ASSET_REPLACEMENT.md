# Temporary reference assets

**Generated from `schools/assets/registry.ts`. Do not edit by hand —
run `npx tsx scripts/write-reference-asset-doc.ts`.**

Total registered: **21**

Every file below was downloaded from brilliant.org's CDN during the
reverse-engineering phase and is still referenced by this repository.
Downloading a competitor's assets to *measure* a design is legitimate;
serving them from a product a school pays for is redistribution. This phase
was scoped to finish the product's structure and defer the artwork swap, so
the swap is made cheap rather than pretended away: one module owns every
path, no component holds a raw asset URL, and each entry records what the
slot is *for* so replacement art can be commissioned against a brief.

## Already resolved — do not re-open

- **CoFo Brilliant / CoFo Robert** (Contrast Foundry, commercial) are declared
  only in `src/app/brilliant/layout.tsx`, which `notFound()`s in production,
  with the files under `reference/fonts/` rather than `public/`. A production
  build emits neither the `@font-face` rule nor the file.
- **`@bible-strong/avatar-react`** is AGPL-3.0-only. The package is neither
  installed nor imported; Strobi is rendered from the JSON definition by our
  own code in `src/components/nova/strobi-avatar.tsx`.

## Blocking a public launch — these render on marketing surfaces (6)

| id | routes | what the slot depicts | file |
| --- | --- | --- | --- |
| `landing-hero-clip` | `/` | 17s ambient loop behind the landing hero — someone writing and running short code | `/assets/original/brilliant/brilliant.org/videos/homepage/courses/cs-refresh.webm` |
| `landing-hero-poster` | `/` | Poster frame shown when the hero clip cannot autoplay | `/assets/original/brilliant/brilliant.org/videos/homepage/courses/posters/cs-refresh.png` |
| `get-started-art` | `/` | Closing call-to-action illustration on the landing page | `/assets/original/brilliant/brilliant.org/images/homepage/get-started` |
| `about-why` | `/about` | Reasoning made visible — a problem being taken apart into steps | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/logic-deduction-fHm1JW.png` |
| `about-approach` | `/about` | Short explanation followed immediately by hands-on practice | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/thinking-in-code-DolooX.png` |
| `about-nova` | `/about` | A tutor asking a question rather than handing over an answer | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/knowledge-and-uncertainty-TdnBt2.png` |

## Blocking a paid release — these render inside the product (13)

| id | routes | what the slot depicts | file |
| --- | --- | --- | --- |
| `programme-art` | `/program` | The programme as a whole, on the learning-path row | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/category-images/Computer_Science-JEbqeF.png` |
| `month-art-1` | `/home`, `/program`, `/course/1`, `/lesson/[id]` | Reading input, computing, choosing an answer with a condition | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/logical-languages-PaiPd6.png` |
| `month-art-2` | `/home`, `/program`, `/course/2` | Repetition — a loop running over a list of values | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/creative-coding-dsGE0e.png` |
| `month-art-3` | `/home`, `/program`, `/course/3` | Functions — a task broken into named, reusable parts | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/Programming_with_Functions-NL91vb.png` |
| `month-art-4` | `/home`, `/program`, `/course/4` | Speed — the same answer reached by a cheaper route | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/computer-science-algorithms-jF6RDo.png` |
| `month-art-5` | `/home`, `/program`, `/course/5` | Halving a search space; converging boundaries | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/search-fundamentals-G1nv3e.png` |
| `month-art-6` | `/home`, `/program`, `/course/6` | Recursion — a call tree unfolding and folding back | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/Recursion_in_Python_1-FEJb29.png` |
| `month-art-7` | `/home`, `/program`, `/course/7` | Grids and paths — a wave spreading, connected regions | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/skip-Clustering-9m6GmH.png` |
| `month-art-8` | `/home`, `/program`, `/course/8` | Greedy choice versus a table built from previous answers | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/chapter/Algorithmic_Thinking-ZSOEgi.png` |
| `month-art-9` | `/home`, `/program`, `/course/9` | Contests — timed rounds and a final tournament | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/math-competition-fundamentals-ifmZin.png` |
| `assessment-art` | `/course/[index]`, `/assessment/[month]` | The monthly check — deliberately distinct from a lesson | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/foundation-puzzles-long-set-gYC4xn.png` |
| `lesson-scene-setter` | `/lesson/[id]` | Full-bleed scene image on a lesson's opening page | `/assets/original/brilliant/brilliant.org/../ds055uzetaobb.cloudfront.net/brioche/uploads/lessons/scene-setter-final-FtktQS.png` |
| `lesson-art-m1` | `/lesson/m1.l1 … /lesson/m1.l9` | Per-lesson scene-setters for September, keyed by lesson id | `/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/*.png (9 files, one per September lesson)` |

## Not blocking — these never reach a production route (2)

| id | routes | what the slot depicts | file |
| --- | --- | --- | --- |
| `gameboard-rive` | `/brilliant/app/course` | The reference gameboard node animation. NOT rendered in the product — `ownMascot` takes the native branch, because this scene puts Koji on the learner's current node | `/assets/original/brilliant/brilliant.org/rive/koji-gameboard.e2320c48.riv` |
| `koji-rive` | `/brilliant`, `/brilliant/lesson` | The reference mascot. Never rendered on a product route. | `/assets/original/brilliant/brilliant.org/rive/meet_koji.0dced838.riv` |

## How to replace one

1. Put the new file under `public/` in a SolveX-owned directory.
2. Change its `assetPath` in `schools/assets/registry.ts`.
3. Drop `temporaryReferenceAsset` and `replacementNeeded` from that entry, or
   remove the entry entirely if nothing else points at it.
4. Re-run this script.

No component changes. That is the whole point of the registry.
