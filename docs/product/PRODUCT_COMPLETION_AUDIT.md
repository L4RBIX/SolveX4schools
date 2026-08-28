# Product completion audit

Written before the completion phase, from `grep` and from reading the modules —
not from memory. Every classification below names the file it applies to.

## Legend

| Verdict | Meaning |
| --- | --- |
| KEEP | Correct as it stands. Do not touch. |
| ADAPT | 80–90% right. Extend by prop, do not rebuild. |
| BUILD | Genuinely absent. |
| REMOVE | Dead, duplicated, or dishonest. |
| REFERENCE_ONLY | Measurement baseline. Renders only under `/brilliant/*`, which `notFound()`s in production. |

## The single most important finding

**Real authentication already exists and is good.** `schools/auth/{session,password,
guard,policy,types}.ts`, migration `0012_school_identity.sql`, and the routes
`/api/auth/{login,logout,password}` are a complete school-shaped auth system:

- scrypt (N=2^15) with the cost encoded in the stored record, so it can be
  raised without invalidating credentials
- opaque random session token in an httpOnly cookie, **sha256 in the database** —
  a dump is not a set of working logins, and revocation is a row update
- `school_accounts`, `school_classes`, `class_teachers`, `class_enrolments`,
  `school_sessions`, all with RLS enabled
- `requireLearner()` resolves the subject **from the session**, so "student A
  cannot read student B" is true by construction — there is no parameter to
  tamper with
- `requireClassAccess()` reads authority from `class_teachers`, not from the
  role, and answers **404 rather than 403** for a class the teacher does not
  teach, so the endpoint is not an oracle for enumerating a school's classes

The brief says "if the repository already uses a real provider, USE IT. Do not
add a second auth architecture." That is exactly right, and this phase adds no
second architecture. What is missing around it is UI, not identity:
`/settings/account`, `/settings/preferences`, and a header that can log out.

## Routes

| Route | Verdict | Note |
| --- | --- | --- |
| `/` | KEEP | Public landing on the clone's nine-section runtime. |
| `/schools` | ADAPT | Needs the shared public chrome and a theme-aware surface. |
| `/home` `/program` `/course/[index]` `/lesson/[lessonId]` `/assessment/[month]` `/review` `/you` | KEEP | The learning runtime. Audited in the previous phase. |
| `/login` `/account/password` | ADAPT | Real, working. `/account/password` folds into `/settings/account`. |
| `/teacher` | ADAPT | Guarded by `requireClassAccess`; the page still gates on `config.environment` from before auth existed. |
| `/welcome` → `/` , `/paths` → `/program` | KEEP | 308s, asserted by test. |
| `/brilliant/*` | REFERENCE_ONLY | `notFound()` in production, `robots: noindex`. |
| `/dev/*` | REFERENCE_ONLY | Dev-only labs. |
| `/about` `/help` `/help/[article]` `/privacy` `/terms` | BUILD | Absent. |
| `/settings/account` `/settings/preferences` | BUILD | Absent. |
| `not-found` / `error` | BUILD | Absent — a raw Next.js error page today. |

## Components

| Component | Verdict | Why |
| --- | --- | --- |
| `brilliant/about/*` (hero, statement-band, split-section, our-method, what-we-teach, section-heading, container) | ADAPT | A complete, measured About composition. `/about` is these components with SolveX content. |
| `brilliant/legal/*` (legal-article, legal-toc, legal-runs, legal-header) | ADAPT | A measured legal renderer with a TOC and rich runs. `/privacy` and `/terms` are this renderer with our own text. |
| `brilliant/faq/*` (hero, faq-section, faq-data) | ADAPT | The Help Center's hero and grouped-question layout. |
| `brilliant/wiki/{prose,article,toc}` | ADAPT | Article body typography for `/help/[article]`. |
| `brilliant/nav.tsx` `footer.tsx` | ADAPT | Already prop-extracted. Need real menus and a language control. |
| `brilliant/app/app-header.tsx` | ADAPT | Has a working mobile dropdown. Needs an account menu and role-aware links. |
| `brilliant/gameboard/*` | ADAPT | Milestone motion is the weak spot — see below. |
| `brilliant/auth/{sign-in-form,change-password-form}` | KEEP | Real forms against real routes. |
| `nova/*` | KEEP | Do not reintroduce Koji. |
| `brilliant/{about,faq,wiki,subject}` **pages** and `elice/*` | REFERENCE_ONLY | — |
| `brilliant/app/you-dashboard.tsx`, `lesson/lesson-player.tsx`, `lesson/koji.tsx` | REFERENCE_ONLY | The originals the product versions were derived from. |

## Theme — the largest structural gap

There is **no theme system at all**. `src/app/globals.css` defines one dark
palette plus a handful of light-surface tokens used by the public landing.
Nothing reads `prefers-color-scheme`; nothing stamps `data-theme`.

Two obstacles, both measured:

1. **Hardcoded white.** 206 `text-white/N`, 88 `border-white/N`, 46 `bg-white/N`
   and 323 bare `text-white` across the product. On a light surface every one of
   them is invisible. The fix is mechanical, not a rewrite: a `--color-b-fg`
   token, and `*-white/N` → `*-b-fg/N`.
2. **`b-white` and `b-paper` are surface names, not colours.** They are the
   public pages' page and band surfaces, so in dark mode they must stop being
   white. Redefining them per theme is right; the names stay because 100+ call
   sites use them, and semantic aliases carry the new vocabulary.

`[data-site="brilliant"]` pins the reference subtree to dark so the baseline
stays byte-identical while the product gains a light theme.

## Milestone motion

`gameboard/gameboard-pedestal.tsx` renders the reference's Rive scene
(`koji-gameboard.riv`, state machine `node_all`, artboard `Gameboard Node`,
inputs `select / padlock / dark-mode / start_idle`, trigger `koji_appear`) for
the animated case and a static SVG otherwise. The product takes the static
branch via `ownMascot` — correctly, because the Rive scene puts **Koji** on the
learner's current node.

So the product currently has: a static disc, a CSS blur ellipse, and no press
physics. That is the "visually weaker than the reference" the brief names. The
mechanism to restore is documented in the reference component itself and is
reproduced natively in this phase rather than by shipping Brilliant's Rive file.

## Not touched by this phase

Codeforces verification, oracle generation, mutation testing, Originals, trust
thresholds, the judge pipeline, and the September curriculum. Separate workflows
own those.

---

# Outcome of the phase

Written after implementation, against what actually shipped.

## Built

| Surface | Built from |
| --- | --- |
| `/about` | `about/{container,section-heading}` + a new `Split` and statement band |
| `/help`, `/help/[article]` | New, on the reference help layout; content is data in `schools/help/content.ts` |
| `/privacy`, `/terms` | The measured legal typography, with our own localised content model |
| `/settings/account`, `/settings/preferences` | New shell on `AppHeader`; the password form is the existing one, embedded |
| `/login`, `/account/password` | Existing forms, now wearing `AuthShell` |
| `not-found`, `error` | New `StatusPage`, localised, with a retry on the error variant |

## Theme

`light-dark()` on 56 tokens, `color-scheme` as the only switch, and a
synchronous boot script so there is no flash. 402 hardcoded `white` utilities
across 43 product files became `b-fg`. `b-on-fill` is the one sanctioned
exception — ink for a surface that is dark in both arms.

## Preferences

`schools/preferences/types.ts` is the single definition, validated on both
sides. Migration 0017 persists a bag per account; `localStorage` is the
pre-login fallback and paints the first frame.

## Milestone motion

The reference's spring curve (`--ease-b-spring`, already sampled verbatim from
the live player) drives the release; press compresses over 90ms; the glow is
light from below — a pool, a core, and a `mix-blend-mode: color` tint clipped to
the stone's ellipse — rather than a ring.

## Deliberately not built

- **`/join`.** Invites are not in the schema, and self-service enrolment
  contradicts `0012_school_identity.sql`, which refuses self-registration
  because a school roster is not self-serve. A `/join` page would be a form
  posting to nothing.
- **Account deletion.** No deletion job exists. See
  `docs/legal/PRIVACY_LEGAL_REVIEW.md` §3.
- **Editable name/email.** Name comes from the roster; there is no email column.
