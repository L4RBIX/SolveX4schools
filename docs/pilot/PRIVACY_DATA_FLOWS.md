# Privacy — the data flows this code actually has

An audit of what SolveX4Schools collects, where it goes, who can read it, how
long it lives, and what crosses the Kazakh boundary. **Read from the source, not
from the design documents.** Where the code and a design document disagree, the
code is recorded here and the disagreement is named.

Scope: the September pilot — one private school, 18 students, one teacher.

The programme's two commitments, which everything below is measured against:

1. **Kazakh data residency** (PDF p.4).
2. **Name, class and progress only** — no other personal data.

---

## 0. Method, and what was read

| Concern | Files read |
|---|---|
| Identity, sessions | `schools/learning/identity.ts`, `schools/auth/session.ts`, `schools/auth/guard.ts`, `schools/auth/policy.ts`, `database/migrations/0012_school_identity.sql` |
| The event ledger | `packages/learning-contracts/src/events.ts`, `src/app/api/learning/events/route.ts`, `src/app/api/learning/submit/route.ts`, `database/migrations/0003_learning_events.sql` |
| Projections | `schools/reducer/sweep.ts`, `schools/store/learning-store.ts`, `database/migrations/0006_learner_state.sql` |
| Learner free text | `database/migrations/0011_error_dictionary.sql`, `0016_post_help_explanations.sql`, `src/app/api/learning/dictionary/route.ts`, `src/app/api/learning/explanation/route.ts` |
| Execution | `schools/exec/providers/piston.ts`, `schools/exec/providers/local.ts`, `schools/exec/index.ts`, `src/app/api/exec/run/route.ts` |
| Nova | `schools/nova/providers/deepseek.ts`, `schools/nova/providers/echo.ts`, `schools/nova/prompt.ts`, `src/app/api/nova/hint/route.ts` |
| Teacher surface | `src/app/api/teacher/class/[classId]/route.ts`, `schools/presentation/classroom.ts` |
| Admin surface | `src/app/api/health/route.ts`, `schools/ops/health.ts`, `schools/ops/admin-gate.ts` |
| Logs | every `console.*` in `src/` + `schools/` + `packages/`, `schools/ops/counters.ts` |
| Retention / erasure | `database/migrations/0003_learning_events.sql` §"Deletion, export, retention", every `on delete cascade` |

Every claim below names the file it came from. A claim with no file behind it is
marked **NOT VERIFIABLE FROM CODE** and belongs to whoever operates the host.

---

## 1. Summary

| # | Flow | Personal data | Leaves the app process | Leaves Kazakhstan |
|---|---|---|---|---|
| A | Student identity | Name, username, class, school, password hash | No | No |
| B | Session | Random token; the DB stores only its sha256 | No | No |
| C | Learning events | Pseudonymous `subject_id` + a 50-key scalar allowlist. **No free text.** | No | No |
| D | Projections | Derived from C. Adds named misconceptions. | No | No |
| E | Lesson completions | `subject_id`, lesson id, four counts | No | No |
| F | Learner free text | Their own words: ≤500 chars (dictionary), ≤1000 (explanation) | No | No |
| G | Execution — SUBMIT | **Source code + curriculum stdin.** No identifier of any kind. | **Yes → Piston** | **No, if Piston is self-hosted in KZ** |
| H | Nova | **The learner's typed question + a named misconception.** No identifier of any kind. | **Yes → model provider** | **`echo`: no. `deepseek`: YES.** |
| I | Teacher view | Name + everything in D for their own class | No | No |
| J | Admin health | No learner data at all | No | No |
| K | Logs | Episode ids on the sweep error path; nothing else | To the log collector | Wherever logs are shipped — **NOT VERIFIABLE FROM CODE** |
| L | Backups | — | — | **NONE EXIST IN THIS REPOSITORY** |

Two flows cross the process boundary: **G** and **H**. Everything else lives in
one Postgres and never leaves it. That is the shape a residency commitment
needs, and it is why sections 6 and 7 exist.

---

## 2. Flow by flow

### A. Student identity

**Collected** — `school_accounts` (migration 0012): `user_id`, `school_id`,
`role`, `username`, `display_name`, `password_hash`, `password_salt`,
`must_change_password`, `created_at`, `last_login_at`, `disabled_at`.

There is **no column for an email address, a date of birth, a phone number, a
parent, an address or a photograph.** That is not a policy note — the table has
nowhere to put one, which is what makes "name, class and progress only"
enforceable rather than promised.

`school_classes` and `class_enrolments` hold the class. `learning_subjects`
(migration 0003) holds the pseudonymous `subject_id` that every piece of
learning data is keyed on, joined to the account through
`learning_subject_aliases`.

`learning_subjects.cf_handle` exists as an inherited column from the imported
subsystem. **Nothing writes it** — `grep cf_handle schools src` returns only the
migration. It is dead schema, not a collected field.

**Where it goes** — the application's Postgres. Nowhere else. No identifier from
this section reaches Piston, DeepSeek, or any log line.

**Who can see it** — the learner (their own), the teacher of their class through
`requireClassAccess`, an admin of their own school. There is deliberately no
cross-school read path anywhere in the product (migration 0007's own note).

**Retention** — until erasure. Withdrawal from a class sets `withdrawn_at`;
disabling an account sets `disabled_at`. Neither deletes, deliberately: work done
while enrolled stays attributable to the class it was done in, which is what a
school report is.

**Boundary** — never leaves.

### B. Sessions and cookies

Two cookies, both `httpOnly`, both `sameSite: lax`, both `secure` in production:

| Cookie | Value | Set by |
|---|---|---|
| `sx_session` | Opaque 32 random bytes, base64url. The DB stores **only its sha256** (`schools/auth/session.ts`). | Login |
| `sx_anon` | A v4 UUID identifying a device, for the pre-auth development path. | `schools/learning/identity.ts` |

`httpOnly` is load-bearing, not hygiene: a subject or session id readable by page
script is one a student can copy off a classmate's screen, and the entire
evidence model rests on events being attributable to one person.

Storing the hash rather than the token means a database dump is not a set of
working logins.

**`sx_anon` in production:** `schools/auth/policy.ts` refuses anonymous learning
outside development, so an anonymous subject cannot accumulate evidence in a
deployed school. Session TTL is 8 hours — a school day plus an evening — so a
session forgotten on a shared classroom machine is dead by morning.

**Retention** — `school_sessions` rows are kept after logout (`revoked_at` set
rather than deleted) so "was this session used after the learner said they logged
out" is answerable. They cascade away with the account.

### C. Learning events — the ledger

`learning_events` is the source of truth; everything else is a recomputable
cache.

**Collected per row:** `event_id`, `subject_id`, `episode_id`, `session_id`,
`seq`, `event_name` (one of 13 in a closed taxonomy), `occurred_at` (client
clock, forgeable), `received_at` (ours), `source_trust`, `environment`, `cohort`,
`route`, `payload`.

**The payload is the privacy guarantee.** `ALLOWED_PAYLOAD_KEYS` in
`packages/learning-contracts/src/events.ts` is a single global allowlist of
scalar keys. Anything not on it is dropped, on the client *and* again on the
server, so a forged request cannot bypass the client copy. Values are scalars
only — an object or array could smuggle a payload past review — strings are
truncated to 96 characters and at most 24 keys survive.

**What is structurally impossible to store here:** source code, stdout, stderr,
custom test input, a learner's typed answer, chat prose, an email, an auth token,
a raw query string. The file names each of those as deliberately absent, and
`tests/school/payload-privacy.test.ts` asserts it.

The consequence is worth stating plainly because it shapes several sections
below: **the ledger contains no free text.** Numbers, enum values and curriculum
ids only.

`sourceTrust`, `environment` and `cohort` are stamped server-side. A browser
claiming `judge` is recorded as `browser`; a preview deploy cannot claim to be
production.

**Retention** — `learning_events_purge(interval default '180 days')` exists as a
plpgsql function. **Nothing calls it.** See §7.

### D. Projections

`attempt_episodes`, `learner_state`, `learner_skill_state`, `interventions`,
`intervention_outcomes`, `review_schedule`. All are recomputable by replaying C,
which is what makes deleting them safe and what makes a reducer version bump
safe.

These carry the one genuinely sensitive derived value in the product: a **named
misconception** (`failure_class`, e.g. `remainder_vs_quotient_swap`), with the
episodes that support it.

Two rules constrain it, both enforced in code rather than by convention:

- The learner is **never** told the name. `/api/learning/state/me` returns the
  decided *action* and not the misconception; `/api/learning/dictionary` returns
  the curriculum author's explanation of the wrong answer and the learner's own
  words, never the label the system filed it under.
- A class is only named where the curriculum author declared **this exact wrong
  answer** diagnostically unambiguous. Everything else is recorded as
  `unattributed_failure` with `confidence: 0` — "we graded this and could not
  tell why it was wrong", which is a fact about the pipeline, not a claim about a
  child.

**Where it goes** — the same database. It reaches a teacher (§I) and, in one
narrow form, a model provider (§H, and that is question 1's real answer).

### E. Lesson completions

`lesson_completions`: `subject_id`, `lesson_id`, four counts, `completed_at`,
`policy_id`. Written once — finishing the same lesson twice records the first
time. The counts are the player's own tally and are explicitly not evidence
(migration 0010's header); nothing may build a level or a percentage from them.

### F. Learner-authored free text

The only free text in the product, and there are exactly two places for it:

| Table | Column | Cap | Written by |
|---|---|---|---|
| `learner_error_dictionary` | `note` | 500 chars | Only the learner's own request body |
| `post_help_explanations` | `response` | 1000 chars | Only the learner's own request body |

Both migrations are explicit that **there is no column for text the system
produced**. «Forgot `int()` after `input`» is a thing that happened; «you
struggle with types» is a claim about a fourteen-year-old's mind, and the absent
column is what makes the second unwriteable rather than merely discouraged.
`post_help_explanations` additionally has no column for a grade or a score, and
`explanationVerdict()` has no branch that returns anything but `unknown`.

Neither is sent to any model provider. Neither appears in the ledger — the
payload allowlist is why.

Both cascade from `learning_subjects` and are therefore covered by erasure.

### G. Execution payloads

Two paths, and only one is live in the pilot.

**SUBMIT — `schools/exec/providers/piston.ts`.** The exact HTTP body:

```json
{ "language": "python", "version": "3.*",
  "files": [{ "name": "main.py", "content": "<the learner's source code>" }],
  "stdin": "<a test input from the curriculum>",
  "run_timeout": 5000, "run_memory_limit": 268435456 }
```

That is the whole request. `content-type` is the only header. **No
`subject_id`, no `user_id`, no name, no class, no school, no cookie, no
`Authorization`, no episode id, no block id, no `User-Agent` we set.** The judge
receives a Python program and some input and has no way to know whose it is or
which task it belongs to.

Piston runs each submission in a disposable container with cgroup limits and no
network. It is to be **self-hosted on a Kazakh VPS**
(`docs/CODE_EXECUTION_DECISION.md`), which is how the residency commitment is met
for the one part of the system that necessarily receives a student's own writing.
Whether the host is actually in Kazakhstan is **NOT VERIFIABLE FROM CODE** — it
is one environment variable and one rented box, and
`docs/deployment/PRODUCTION_ENVIRONMENT.md` carries it as a checklist item.

The judge's response — stdout and stderr — is capped at 64 KB by `cap()` and is
returned to the learner. It is **never** written to the ledger; the payload
allowlist has no key for it.

**`local`** (`schools/exec/providers/local.ts`) is a subprocess, not a sandbox.
It scrubs the environment so a learner's program cannot read
`DEEPSEEK_API_KEY` or `LEARNING_ATTESTATION_SECRET`, and it refuses to run in
production. `assertProductionConfig` turns a misconfiguration into a boot
failure.

**RUN — `/api/exec/run`.** Posts source and the learner's own stdin to the same
provider, produces no evidence by contract, and is **currently called from
exactly one place: the developer lab at `/dev/execution`.** No lesson surface
calls it. The Pyodide-in-the-browser design in
`docs/CODE_EXECUTION_DECISION.md` is not implemented (`grep -ri pyodide src
schools` finds only that document's own reference). For the pilot as built,
learner code leaves the browser only on SUBMIT.

### H. Nova requests

Two providers.

**`echo` — the default** (`NOVA_PROVIDER` unset, `schools/config.ts`). No
network, no credential, nothing leaves the process. It reports
`degraded: true`, which travels to the panel so the learner is told plainly that
there is no model rather than being left to infer it from the prose.

**`deepseek`.** The exact HTTP body (`schools/nova/providers/deepseek.ts`):

```json
{ "model": "deepseek-chat",
  "messages": [ { "role": "system", "content": "<the assembled prompt>" },
                { "role": "user",   "content": "<the learner's typed message>" } ],
  "max_tokens": 500, "temperature": 0.4, "stream": true }
```

Headers: `content-type` and `authorization: Bearer <key>`. **No identifier of any
kind is transmitted** — no subject id, no name, no class, no school, no session,
no cookie, no episode id.

The system prompt is assembled by `buildSystemPrompt`
(`schools/nova/prompt.ts`) from exactly these, and its `PromptContext` type has
fields for nothing else:

| Field | Origin | Personal? |
|---|---|---|
| `locale`, `monthTitle`, `lessonTitle`, `blockPrompt`, `blockCode`, `skills`, `capability` | The curriculum | No |
| `grant` | `grantHintLevel`, from the caller's own ledger | A number, 0–4 |
| `learnerAnswer` | **The caller's own typed message**, truncated to 2000 chars | **Yes** |
| `directive.namedMisconception` | The caller's own learner state | **Yes** — a derived claim about them |

So two things about the learner cross the boundary when DeepSeek is enabled:
**their own words**, and, where the evidence supports naming one, **one
misconception label**. Note that `blockCode` is the *curriculum's* code, not the
learner's editor content — the learner's code is not sent. A learner who pastes
their code into the chat sends it themselves, which is the ordinary property of a
chat box and is bounded at 2000 characters.

`api.deepseek.com` is **outside Kazakhstan**. See §6.

The provider maps upstream statuses rather than echoing bodies, because an
upstream error body can contain the key, the prompt or another tenant's text.

### I. Teacher-visible data

`GET /api/teacher/class/[classId]`, gated by `requireClassAccess` — authority
comes from `class_teachers`, not from the role, so "teacher" is not a key to
every class in the school. A teacher asking about a class they do not teach gets
**404, not 403**, because 403 confirms the class exists and turns the endpoint
into a way to enumerate a school's classes.

Per learner, from `buildLearnerRow` (`schools/presentation/classroom.ts`):
display name, `subject_id`, episode count, solo/assisted solves, unexplained
failure count, intervention count, last-active timestamp, per-skill evidence
state, and up to five **signals** — each of which names a checkable cause,
including the misconception's `failure_class` where one is actionable.

The file's own rule is the relevant privacy property: every signal has a named,
checkable cause and there is no "needs attention" flag computed from a mood. A
teacher told a child needs help can see why in one line and disagree with it.
Naming a failure class **to a teacher** is a different act from naming it to a
child, and only the first is done.

The class list is not sorted by score, because there is no score.

### J. Admin-visible data (health)

`GET /api/health` — added for the pilot. The ungated response is the **teacher
view**: five capabilities in Kazakh and Russian, each naming a consequence, and
no infrastructure detail whatsoever. The **admin view** — behind the `admin` role
or a bearer token — adds providers, endpoints, the curriculum hash, reducer lag,
counters and ledger-derived activity.

**No learner data appears in either view.** The ledger figures are counts
(`activeToday`, `verdictsToday`, `hintsRequested`); there is no per-learner row,
no identifier and no free text. Endpoints are reduced to a host by `redactUrl`,
which drops userinfo, path, query and fragment — because a URL is a string a
human wrote, and humans put credentials in URLs. Secret **presence** is
reportable (`attestationConfigured: true`); secret **values** never are.
`tests/school/ops-health.test.ts` asserts both.

### K. Logs

Every log line in the product, exhaustively:

| Site | Content | Personal? |
|---|---|---|
| `src/instrumentation.ts` | Config problems at boot — variable names, never values | No |
| `schools/nova/index.ts` | "DEEPSEEK_API_KEY is unset; using echo" | No |
| `schools/reducer/trigger.ts` | Sweep failures, and `result.errors` — **which contains `episodeId`** | **Pseudonymously, yes** |
| `schools/ops/counters.ts` (`opsLog`) | `{ts, scope, event, ...}` — block/lesson ids, counts, truncated messages | No |
| `schools/curriculum/validate.ts` | Validator output, CLI only | No |

`opsLog`'s contract is explicit and is the reason it exists in this shape: no
subject id, no session id, no username, no display name, no learner prose, no
source code, no answer, no environment variable, no URL with credentials.
Provider error messages are truncated to 200 characters, and the two routes that
log a store failure strip URLs first.

**Logs are the one store with no schema, no retention function and no erasure
path.** `learning_forget_user` cannot reach a log line. That is why the rule is
"nothing identifying, ever" rather than "identifying but purged" — see §7 for the
one line that currently breaks it.

Where logs are shipped, and for how long they are kept, is
**NOT VERIFIABLE FROM CODE.**

### L. Backups

**There is no backup mechanism in this repository.** No script, no cron, no
`pg_dump`, no volume snapshot, nothing in `Dockerfile` or `docker-compose.yml`.

Worse, and it belongs in a privacy audit because it is a data-loss risk rather
than a disclosure one: `schools/store/index.ts` **throws** when `DATABASE_URL`
is set —

> "DATABASE_URL is set but the Postgres driver is not wired yet."

— so today the only working store is PGlite writing to a local directory
(`LEARNING_DATA_DIR`, default `.data/learning`). `assertProductionConfig`
already refuses to boot on a relative data directory with no `DATABASE_URL`,
which is correct and which means **a production deployment cannot currently
start at all.** The admin health view reports both conditions (`database.driver`,
`database.durable`, and the throw itself as a `down` check).

Whoever operates the host owns: where the volume lives, whether it is snapshotted,
whether snapshots stay in Kazakhstan, and who can restore one. None of that is
in this repository and none of it should be asserted from it.

---

## 3. Question 1 — do we send more student information to external providers than required?

**No identifiers. Yes, content — and only to Nova, and only when DeepSeek is
switched on.**

**Piston (`schools/exec/providers/piston.ts`):** the request is
`{language, version, files:[{name, content}], stdin, run_timeout,
run_memory_limit}` and nothing else. The judge cannot know whose code it is,
which task it is, or which school sent it. This is the minimum a judge can be
given and still judge. **Nothing to remove.**

**DeepSeek (`schools/nova/providers/deepseek.ts`):** the request is
`{model, messages:[system, user], max_tokens, temperature, stream}`. No subject
id, no name, no class, no school, no cookie, no episode id. Of the system
prompt's fields, exactly two are about the learner:

1. their own typed message (≤2000 chars), which is the point of a chat box; and
2. one `namedMisconception`, and only where the Decision Engine judged the
   evidence sufficient — otherwise the prompt says, in as many words, "the
   evidence does NOT support naming any specific misunderstanding; ASK them what
   they were thinking instead".

Could Nova work without (2)? Yes — worse, and it is the difference between a
hint that addresses the actual confusion and one that guesses. It is a
defensible inclusion. **It is not gratuitous, and it is not identifying.**

So the field list is already minimal on both flows. The exposure that matters is
not *how much* is sent but *where it goes* — see §6.

## 4. Question 2 — can another student's context leak into a Nova request?

### Into the prompt: **no, and it is structural.**

`buildSystemPrompt` is a pure function of `PromptContext`, and that type has no
field for another learner, a class, a roster, a subject id or a database handle.
It performs no I/O. The model cannot leak what it was never given, which is a
cheaper guarantee than asking it not to. Asserted in
`tests/school/ops-health.test.ts` ("the Nova prompt cannot carry another learner's
context").

Every value the route puts into that context comes from one of two places:

- **the curriculum**, looked up by `blockId` — public content, identical for
  every learner; or
- **the caller**, via `subjectId` from an `httpOnly` cookie that page script
  cannot read and a request body cannot override.

The prompt additionally instructs the model to refuse if asked — "Never discuss,
reveal or compare another student" — but that is belt beside braces, not the
mechanism.

### Into the request's *policy decision*: **yes, it could, and it has been fixed.**

`episodeId` arrives **in the request body**, and until this audit nothing checked
whose episode it was. `enforceHintPolicy` derives the entire hint ceiling from
it:

```
store.lastGrantedLevel(episodeId)   -- keyed on episode alone
store.lastHintAt(episodeId)         -- keyed on episode alone
store.eventsForEpisode(episodeId)   -- keyed on episode alone
```

None of those filters by subject. Two consequences ran in opposite directions:

1. **Read.** Posting a classmate's episode id computed the grant from *their*
   history, and the grant is echoed straight back to the caller in the `policy`
   SSE frame. Small, but it is a read of another learner's work.
2. **Write.** The route then wrote `interventions` and `learning_events` under
   the *caller's* `subject_id` and the *supplied* `episode_id`. The reducer folds
   an episode by `eventsForEpisode` and attributes the result to whichever single
   `subject_id` `staleEpisodes` returns — so a foreign episode id mixes two
   children's events into one episode and charges one learner's assistance
   against the other's independence weight. That is fabricated evidence about a
   child, which is the one defect class this product treats as unacceptable.

The same body-supplied `episodeId` drives `priorFailures` on
`/api/learning/submit`, which decides whether an answer is revealed.

**Exploitability was low.** Episode ids are v4 UUIDs minted in the browser and
never shown to another learner; reaching one means guessing 122 bits. The
realistic path was never an attacker — it was a bug: a shared device, a copied
request in a debugging session, or a future feature that puts an episode id in a
URL.

**The surgical fix** — `schools/learning/episode-scope.ts`, called by both
routes:

```ts
const episodeId = await ownedEpisodeId(subjectId, body.episodeId);
```

One indexed lookup across `learning_events` and `interventions`. An episode that
already carries another subject's rows is refused and a fresh id is minted, so
the foreign episode is neither read nor written and the caller's work lands in an
episode of their own. It substitutes rather than returning 403 so that a learner
with a stale id still gets their answer graded; the id actually used is already
in both responses.

Verified by `tests/school/ops-health.test.ts` — "an episode belongs to one
learner": Alice keeps her own episode, Bob does not get it.

---

## 5. Does anything else cross a learner boundary?

Every read path that returns learner data was checked for a caller-supplied
subject parameter:

| Route | Scoping |
|---|---|
| `/api/learning/state/me` | No `subjectId` parameter exists. Scoped by construction. |
| `/api/learning/activity` | Same. |
| `/api/learning/dictionary` | Same — and entries are named by an opaque `ref` that only resolves for the caller's own attributed mistakes, so "you may only save a mistake you actually made" is the addressing scheme rather than a validation someone could drop. |
| `/api/learning/explanation` | Same; the assistance level is read from `interventions` server-side, never from the body. |
| `/api/learning/complete` | Subject from the cookie; lesson id validated against the curriculum; counts bounded by the lesson's block count. |
| `/api/teacher/class/[classId]` | `requireClassAccess`; authority from `class_teachers`; 404 rather than 403 on a class not taught. |
| `/api/health`, `/api/health/learning` | No learner data in any response. |

Rate limiting is keyed on the learner (`nova:<subject_id>`,
`exec:<subject_id>`) and never on client IP, because a school is one NAT gateway
and an IP bucket lets the most active student throttle the class. See §7 for the
erasure consequence of that key.

---

## 6. The residency ledger

| Flow | Destination | In Kazakhstan? |
|---|---|---|
| Everything in §A–F, I, J | The app's own Postgres | Yes, if the host is — **operational, not verifiable from code** |
| SUBMIT source code | Self-hosted Piston, `PISTON_URL` | Yes, **if** that URL points at a Kazakh box. One env var. |
| Nova, `NOVA_PROVIDER=echo` (default) | Nowhere | Yes, trivially |
| **Nova, `NOVA_PROVIDER=deepseek`** | `api.deepseek.com` | **No.** |
| Logs | The host's collector | **NOT VERIFIABLE FROM CODE** |
| Backups | — | None exist |

**The one honest conflict.** Enabling DeepSeek sends a learner's own words, and
sometimes a derived claim about their understanding, to a provider outside
Kazakhstan. No identifier travels with it, so it is not a disclosure of *who* —
but the residency commitment in the approved programme is about *where the data
is processed*, not about whether it is labelled with a name. **Enabling
`NOVA_PROVIDER=deepseek` breaks the residency commitment for that flow.**

This is a decision for the school, not a bug to fix in code, and it has exactly
three resolutions:

1. **Stay on `echo`** for the pilot. Nova asks questions and cannot write
   explanations; the ladder, the caps and the refusal to name a misconception
   without evidence all still run, because they are upstream of the model. The
   panel says so in both languages.
2. **Self-host a model in Kazakhstan** and point `DEEPSEEK_BASE_URL` at it. The
   provider is an OpenAI-compatible client, so this is configuration.
3. **Amend the commitment** with informed consent from parents, naming the
   provider and the country.

The admin health view reports `nova.leavesProviderBoundary` so this is a visible
state of the deployment rather than a thing someone has to remember.

---

## 7. Findings

Nothing below can mark a learner wrong or fabricate evidence about a child. They
are recorded because a pilot should start with them written down.

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | `episodeId` was accepted from the request body and drove hint policy and ledger writes across subjects | Medium | **FIXED** — `schools/learning/episode-scope.ts` |
| 2 | `/api/health/learning` published provider names, the environment and configuration-problem strings to any unauthenticated caller | Medium | **FIXED** — gated; ungated callers get the teacher view |
| 3 | `NOVA_PROVIDER=deepseek` sends learner text outside Kazakhstan | High **if enabled** | **REPORTED** — §6. Default is `echo`; nothing leaves today |
| 4 | `learning_events_purge(180 days)` and `code_blobs_drop_content(90 days)` exist and **nothing calls them** | Medium | **OPEN** — retention is documented, not enforced. Needs one scheduled call |
| 5 | `learning_forget_user` / `solvex_forget_user` exist and **no route or script calls them** | Medium | **OPEN** — erasure is a manual `select solvex_forget_user('<uuid>')` |
| 6 | `rate_limit_bucket.bucket_key` embeds `subject_id` and is **not** in the erasure function's delete list, nor does it cascade | Low | **OPEN** — an erased learner leaves `nova:<subject_id>` rows behind. Needs a migration (out of scope here — reported rather than written) |
| 7 | `schools/reducer/trigger.ts` logs `result.errors`, which carries `episodeId`, into a store with no retention and no erasure path | Low | **OPEN** — the only line that puts a learner-linked key into logs |
| 8 | No Postgres driver: `DATABASE_URL` throws, so production cannot start; the only working store is a local PGlite directory | High (availability, and data loss on redeploy) | **OPEN** — outside this audit's remit; reported. Surfaced by the admin health view |
| 9 | No backup procedure exists in the repository | High | **OPEN** — operational |
| 10 | `learning_subjects.cf_handle` is dead schema from the imported subsystem | Informational | Nothing writes it; delete it when a migration is being written anyway |

Findings 6 and 8 would each need a database migration, which this audit was
scoped not to write. They are reported here for whoever holds that scope.

---

## 8. What is already right, and worth not breaking

- **The payload allowlist.** A ledger that cannot hold free text cannot leak free
  text, and no future call site can change that without editing a list that is
  reviewed as a list.
- **Free text has exactly two homes**, both learner-authored, both capped, both
  in tables with no column for anything a system said about a child.
- **Names are held once**, in a table with nowhere to put a birthday or an
  address.
- **Every learner read path is scoped by construction**, not by a check somebody
  has to remember to write. There is no parameter to tamper with.
- **Trust is stamped server-side.** A browser cannot claim `judge`; a preview
  deploy cannot claim to be production.
- **The judge learns nothing about who wrote the code it runs.**
- **Sessions are stored as hashes**, so a database dump is not a set of working
  logins.
