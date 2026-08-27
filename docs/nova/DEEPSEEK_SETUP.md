# DeepSeek setup

What to put where, and what happens if you get it wrong. Verified against
DeepSeek's own documentation on **2026-08-27**.

## Read this line first

**`deepseek-chat` no longer exists.** DeepSeek retired it and
`deepseek-reasoner` on **2026-07-24 at 15:59 UTC**. They do not fall back — they
return an error.

This repository's default was `deepseek-chat` until this phase. If you restore a
`.env` from a backup, or copy a snippet from an older document, you will have a
valid API key, a correct base URL, a running app, and **every single Nova
request failing upstream** — with the learner seeing a generic error and nothing
in the logs saying why, because the failure is a 400 from a provider that does
not explain retired model ids.

The current ids are:

| Model | Use |
|---|---|
| `deepseek-v4-flash` | **What this product uses.** What `deepseek-chat` was aliased to during the migration window |
| `deepseek-v4-pro` | Three times the price. A fourteen-year-old asking why their `if` does not fire does not need it |
| `deepseek-v4-flash-vision-exp` | Images. Nothing here sends images |

## The minimum

One value:

```bash
DEEPSEEK_API_KEY=<your key>
NOVA_PROVIDER=deepseek
```

Everything else has a working default in `schools/config.ts`. Set the key, set
the provider, restart. Nothing else is required.

## Where to put it

**Vercel:** Project → Settings → Environment Variables. Name
`DEEPSEEK_API_KEY`, value the key, scope Production (and Preview if previews
should have a live tutor — they will bill to the same account).

**Docker / a server:** the environment, or a secrets file the process reads.

**Never** in `.env.example`, in the repository, in a commit message, or in a
document. And never with a `NEXT_PUBLIC_` prefix: that inlines it into the
client bundle at build time and ships it to every browser permanently.
`scripts/check-client-bundle.mjs` fails the build if a secret reaches the
bundle, and `schools/nova/providers/deepseek.ts` carries `import "server-only"`
so importing it from a client component is a build error rather than a leak.

## What else you may want to set

None of these is required. All are documented in `.env.example`.

| Variable | Default | Why you might change it |
|---|---|---|
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | Only to move to `deepseek-v4-pro`. Never to a retired id |
| `DEEPSEEK_THINKING` | `false` | See below |
| `NOVA_ENABLED` | `true` | Turn the tutor off for a week of assessments without deleting the key |
| `NOVA_REQUEST_TIMEOUT_MS` | `30000` | A stalled provider holds the SSE stream open until this fires |
| `NOVA_MAX_OUTPUT_TOKENS` | `500` | The ceiling for level 4; lower rungs get a fraction of it |
| `NOVA_DAILY_REQUEST_LIMIT` | `60` | Per learner per day |
| `NOVA_MONTHLY_COST_LIMIT_USD` | `25` | Hard cap for the whole deployment |

### Thinking mode is off, deliberately

V4 enables thinking **by default**, at `high` effort, and **reasoning tokens
bill as output**. For a reply capped at six sentences whose shape the hint
ladder has already decided, that is most of the cost and most of the latency
spent on a chain of thought the learner never sees.

`schools/nova/providers/deepseek.ts` sends `{"thinking": {"type": "disabled"}}`
unless `DEEPSEEK_THINKING=true`. If you ever turn it on, re-check the cost
figures below — they roughly triple.

## What it costs

DeepSeek prices per 1M tokens, `deepseek-v4-flash`, cache miss:

| | Off-peak | Peak |
|---|---:|---:|
| Input | $0.22 | $0.44 |
| Output | $0.66 | $1.32 |

Peak is 01:00–04:00 and 06:00–10:00 UTC, Monday to Friday. **In Almaty that is
06:00–09:00 and 11:00–15:00 — the school day.** So peak is the normal case for
this product, and `schools/config.ts` budgets at the peak rate on purpose:
costing at off-peak would put the monthly cap at roughly twice the money it
claims to be.

### A worked estimate

One hint costs about **1 000 input tokens** (`tests/nova/privacy-context.test.ts`
asserts the September worst case stays under 8 000 characters, about 2 000
tokens; a typical block is well under half that) and **at most 500 output**,
scaled down at the lower rungs.

At peak: `(1000/1e6 × $0.44) + (500/1e6 × $1.32)` ≈ **$0.0011 per hint**, about a
tenth of a US cent.

| | Hints | Cost |
|---|---:|---:|
| One learner, one lesson (~5 hints) | 5 | $0.006 |
| One class of 18, one lesson | 90 | $0.10 |
| One class, one month (~16 lessons) | 1 440 | $1.60 |
| One class, the whole nine-month programme | ~13 000 | **~$14** |

The `$25` monthly default is therefore roughly fifteen times the expected
monthly spend. That headroom is intentional: the cap exists to stop a runaway
loop or a misconfiguration, not to ration ordinary teaching.

## Checking it works

**1 · Does the app think it is configured?**

```bash
curl -s -H "Authorization: Bearer $LEARNING_ADMIN_TOKEN" \
     https://<host>/api/health | jq '.checks.nova'
```

Reports configured / model / degraded. It does **not** call the provider, so a
revoked key still reads as configured — which is exactly why the next step
exists.

**2 · Does the provider actually answer?**

```bash
curl -s -H "Authorization: Bearer $LEARNING_ADMIN_TOKEN" \
     "https://<host>/api/health?probe=1" | jq '.checks.nova'
```

Admin-only and opt-in, because a monitor polling every thirty seconds would turn
the health check into a paid load source. Never returns the key, the provider's
headers, or the response body.

**3 · Does a learner see a real answer?**

Open `/dev/nova` (development only), pick a block, ask something. The `policy`
frame arrives before the first token and names the provider. If it says
`provider: "echo"`, the key is not being read — check the variable name and that
the process was restarted.

## Without a key

The product runs. This is a supported state, not a broken one:

- The app boots. Lessons work. Code execution works.
- The Learning Intelligence works completely — events, episodes, learner state,
  decisions, directives, the hint ladder, the assessment cap.
- The safety gate works, and needs no credential. **A deployment with no model
  still has fourteen-year-olds typing into it**, and "the safety net is offline
  because the model is offline" is not a sentence anyone should have to defend
  to a parent.
- Nova answers with the one thing it can do without a model: it asks what the
  learner tried and what they expected. It does **not** pretend to be connected —
  `EchoProvider.degraded` is true, and the panel shows a banner before the
  learner's first question rather than after it.

What is missing is the language, not the pedagogy.

## If it breaks

| Symptom | Cause |
|---|---|
| Every request errors, key is valid | `DEEPSEEK_MODEL` is a retired id. See the top of this file |
| `provider: "echo"` with a key set | `NOVA_PROVIDER` is not `deepseek`, or the process was not restarted |
| `auth` errors | Key revoked, or account out of credit |
| `rate_limit` errors | The provider's limit, not ours. Ours returns HTTP 429 with `retry-after` |
| Nova stops answering mid-month | A ceiling. Check `nova.budget.*` on the admin health view |
| Slow first token | `DEEPSEEK_THINKING=true`. Reasoning happens before the first content token |
