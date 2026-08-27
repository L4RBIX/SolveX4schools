# What leaves the server

Written for the school, the parents and whoever signs the data-processing
agreement. It answers one question exactly: when a fourteen-year-old asks Nova
for help, what is sent to DeepSeek, and what is not.

Everything below was read out of the code, not out of an intention.
`schools/nova/prompt.ts` builds the payload and
`src/app/api/nova/hint/route.ts` sends it; those two files are the whole
surface, and `tests/nova/privacy-context.test.ts` asserts the negatives.

## The short version

Two things leave: **the curriculum text the learner is already looking at**, and
**what the learner typed**. Nothing identifies them.

## The payload, field by field

A request to `https://api.deepseek.com/chat/completions` carries a system
message, up to six earlier turns, and the current message.

### System message

| Included | Why it is safe |
|---|---|
| Fixed policy text | Identical for every learner in the programme |
| Month and lesson **titles** | Curriculum, published, in the product |
| The task prompt, in KK or RU | The text on the learner's own screen |
| The starter code, if the block has one | Authored by us, in the repository |
| Skill ids for the block, e.g. `cond.if_elif_else` | Curriculum taxonomy. Not about a person |
| Which Python constructs have been taught by this point | Derived from curriculum ordering |
| The granted hint level, 0–4 | A number the server computed |
| The directive mode, and one named misconception **only when the evidence supports it** | See below |

### User and assistant messages

The learner's message, and up to three earlier exchanges, each wrapped in a
per-request random fence. Trimmed to 600 characters per earlier turn.

**Chat is never stored.** History lives in the browser tab and travels with the
request. Closing the panel ends it. There is no chat table, no retention window
to enforce, and no path by which something typed into Nova becomes part of a
learner's record.

## What is NOT sent — and cannot be

The strongest guarantees here are structural: the prompt builder has no
parameter for them, so there is nothing to leak.

- **Any other learner.** `PromptContext` has no field for a class, a roster or a
  second subject. Nova has never been given anyone else's data to reveal.
- **The learner's name, school, class, email or account id.** None is a field.
- **The subject id.** The pseudonymous key the ledger uses does not travel.
- **Hidden test cases, hidden expected outputs, reference solutions.** Never in
  the prompt — and additionally passed to the output validator as forbidden
  literals, so a response containing one verbatim is discarded rather than
  shown. That check exists because "nobody has added them to the context object
  yet" is a weaker promise than something that fails when they do.
- **Teacher notes, teacher-only context, administrative data.**
- **Database rows, connection strings, environment variables, the API key.**
- **The learner's stored history, skill states or misconception confidences.**
  At most one misconception NAME reaches the model, and only when the decision
  engine has judged the evidence sufficient to say it out loud. No number, no
  history, no other skill.
- **Safety classifications.** A message that trips the safety gate is answered
  by the server from a fixed string. **DeepSeek never sees it.** A disclosure of
  self-harm or abuse does not leave this server at all.

## Where the key lives

`DEEPSEEK_API_KEY` is read in `schools/config.ts` and nowhere else, under a name
with no `NEXT_PUBLIC_` prefix — which is the mechanism, not a convention: a
`NEXT_PUBLIC_` variable is inlined into the client bundle at build time and
would ship the key to every browser permanently. `schools/nova/providers/deepseek.ts`
carries `import "server-only"`, so importing it from a client component fails
the build, and `scripts/check-client-bundle.mjs` scans the built bundle on every
`npm run check`.

## Volume

One request per hint. Roughly 900–1400 input tokens for a typical September
task, and at most `NOVA_MAX_OUTPUT_TOKENS` out, scaled down at the lower rungs.
Eighteen learners, capped at 60 requests each per day, with a monthly USD cap
that refuses the call before the provider is reached.

## Residual risks, stated plainly

1. **DeepSeek is outside Kazakhstan.** Task text and learner messages are
   processed abroad. Nothing identifying accompanies them, but a learner who
   types their own name into the chat box has sent their own name. Nova is
   instructed never to ask for personal data, and the safety gate answers a
   message containing an offered password or card number with a warning instead
   of a model call — but it cannot un-send what was typed.
2. **Free text is free text.** A learner can paste anything. The 2 000-character
   cap bounds the volume, not the content.
3. **We do not control provider retention.** What DeepSeek keeps is governed by
   their terms, not ours. That is a procurement question and belongs in the
   data-processing agreement, not in this file.
