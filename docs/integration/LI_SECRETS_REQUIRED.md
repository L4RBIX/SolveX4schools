# Secrets required

Placeholder names only. **This archive contains no real credential of any kind**
— see `SECURITY_SCAN_REPORT.md` for the evidence.

Names below are the actual variable names used in SolveX. You may rename them
in your product; the two marked **must match** have to hold the same *value* on
both sides of a boundary, whatever they are called.

---

## Summary

| Variable | Required? | Produced by | Consumed by | Shared value? |
|---|---|---|---|---|
| `SUPABASE_URL` | **Yes** | Supabase project | Server routes | — |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase project | Server routes only | — |
| `LEARNING_ATTESTATION_SECRET` | Yes, if you attribute failures | You (`openssl rand -hex 32`) | Signer **and** verifier | **Must match** |
| `LEARNING_CRON_SECRET` | Yes, in practice | You | Reducer route + scheduler | **Must match** |
| `SOLVEX_ADMIN_USER_IDS` | Yes, in practice | Your identity provider | State route, admin tools | — |
| `DEEPSEEK_API_KEY` | Only if Nova calls a model | Provider | Server-side LLM call | — |
| `DEEPSEEK_BASE_URL` | Only if Nova calls a model | Provider | Server-side LLM call | — |
| `DEEPSEEK_MODEL` | Only if Nova calls a model | You | Server-side LLM call | — |

Nothing here is a `NEXT_PUBLIC_*` variable. **No secret in this system is
supposed to reach a browser bundle.** If you find yourself prefixing one to make
something work, the call is on the wrong side of the boundary.

---

## `SUPABASE_SERVICE_ROLE_KEY`

**Purpose.** The only credential that can read or write learning tables.

**Why the service role and not the anon key.** Every learning table is created
with RLS enabled and *zero policies*. A browser holding a perfectly valid user
JWT gets zero rows — that is the design, not a gap. The service role bypasses
RLS, which is why it lives exclusively in server-side handlers and why the
learner's own state is served through an API route rather than a direct query.

**Failure mode if absent.** `getAnalyticsDb()` returns null and every route
degrades to "nothing to say" with HTTP 200. The product keeps working with no
personalisation. This is deliberate — see `README_SOLVEX4SCHOOLS_INTEGRATION.md`
§7 — but it is silent, so assert on it at boot in production.

**Schools note.** This key reads every child's failure history in the system.
Treat it like a database root password: server-only, rotated on staff change,
never in a client bundle, never in a log line, never in a support screenshot.

---

## `LEARNING_ATTESTATION_SECRET` — must match

**Purpose.** HMAC-SHA256 key for the signed statement that lets an untrusted
browser *relay* a verdict or an attribution without being trusted to *state* it.

**The problem it solves.** The verifier runs on the backend. The learning ledger
is written by the frontend's ingest route. They are different services with
different identity namespaces, and the only path between them at the moment of
a submission is the learner's own browser. So the backend signs
`{verdict, attribution, skill_id, …}`, the browser carries the opaque blob, and
ingest verifies the signature before taking any fact from it.

**The rule.** Facts are read **from the signed body**, never from the client's
payload. A client that omits the attestation gets a browser-trusted verdict; a
client that forges one gets nothing. `failure_attributed` events are dropped
outright without a valid signature rather than downgraded — an unsigned
attribution is not a weaker claim, it is not a claim.

**Both sides.**

| Side | Variable | Role |
|---|---|---|
| Backend (FastAPI) | `LEARNING_ATTESTATION_SECRET` | signs |
| Frontend (route handler) | `LEARNING_ATTESTATION_SECRET` | verifies |

A mismatch is silent in the worst way: every signature fails, no event earns
`judge` or `verifier` trust, attribution coverage falls to zero, and every
learner gets `DIAGNOSE` forever. The system will look like it is working and
will simply have stopped learning anything. **Alert on
`learning_attribution_coverage` reading zero.**

**Generate.** `openssl rand -hex 32`

**Rotate.** Accept both old and new on the verifying side for one deploy, cut
the signer over, then drop the old.

**Implementation guard worth keeping.** `attestationSecret()` refuses to read
the key when `window` is defined. That is a tripwire against the module being
pulled into a client bundle; under a jsdom test environment it fires and
verification returns null — fail-closed, in the wrong place. This is why the
route tests carry `// @vitest-environment node`.

---

## `LEARNING_CRON_SECRET` — must match

**Purpose.** Lets a scheduler call the reducer sweep without an admin bearer
token. Sent as the `x-learning-cron-secret` header.

**Why it exists at all.** Reduction is the step that decides what evidence
*means*. If any learner could trigger it, a learner could recompute their own
projection — and a read path that quietly rebuilds is a second writer racing
the sweep. So the write path is admin-or-cron and the read path never writes.

**Failure mode if absent.** The sweep is admin-only. If nothing ever runs it, no
projection is ever built: every learner reads `empty`, the directive is always
null, and Nova falls back to the escalation guard. Safe, and completely inert.

**Schools note.** A scheduled sweep is not optional in a classroom product. A
teacher looking at a dashboard mid-lesson is looking at whatever the last sweep
produced.

---

## `SOLVEX_ADMIN_USER_IDS`

**Purpose.** Comma-separated ids permitted to read *any* subject's projection
via `/api/learning/state/[subjectId]`. Fails closed when empty: nobody gets in.

**Why it is not optional in practice.** This system makes claims about people.
A claim nobody can audit is indistinguishable from a claim that was made up. The
admin path is what lets someone open the specific episodes behind "this is the
third time boundary cases have cost you a submission" and check them.

**Schools note — read this one.** The obvious move is to put teachers in here.
Think first about what it grants: full evidence access to *every* subject in the
database, not just the ones in that teacher's class. SolveX had no notion of a
class, so it needed no scoping. You do. Expect to replace `isAdminUser()` with
a roster check, and treat the flat allowlist as a placeholder rather than a
design you inherited.

---

## `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL`

**Purpose.** The LLM Nova speaks through.

**SolveX already uses DeepSeek**, through an OpenAI-compatible
`POST {base_url}/v1/chat/completions`. If SolveX4Schools uses DeepSeek too,
there is no provider migration to do — see `NOVA_PROVIDER.md`.

**What is NOT in these variables.** The hint policy. `grantHintLevel` is a pure
function of (request, history, directive) and never sees a key, a model name or
a network. The provider receives only its output. That is why swapping models
cannot change what Nova is permitted to say.

**Failure mode if absent.** The route raises `copilot_not_configured` (503).
The learning pipeline is unaffected — events still ingest, projections still
build, decisions are still made. Only the conversation stops.

---

## What is deliberately absent

No JWT signing secret, no session secret, no encryption key, no third-party
analytics token, no email/SMS credential, no object-storage key.

The core needs none of them. It authenticates nobody — it receives an already
resolved opaque `subject_id` — and it stores no personal data. If your
integration ends up adding one of these *to the core*, something has crossed a
boundary that was intentionally closed. See
`README_SOLVEX4SCHOOLS_INTEGRATION.md` §"Privacy and minors".
