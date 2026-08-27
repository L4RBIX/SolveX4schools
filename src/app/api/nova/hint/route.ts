import { randomUUID } from "node:crypto";
import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { resolveIdentity } from "@schools/learning/identity";
import { enforceHintPolicy } from "@schools/nova/enforce";
import { buildNovaMessages, type HistoryTurn } from "@schools/nova/prompt";
import { getNovaProvider, NovaProviderError } from "@schools/nova";
import { classifyMessage, type SafetyReason } from "@schools/nova/safety";
import { safetyResponse, validatorFallback } from "@schools/nova/safety-copy";
import { guardedStream } from "@schools/nova/guard";
import { inspectCode, type ValidationContext } from "@schools/nova/validate";
import { checkAndConsumeBudget, recordSpend, type BudgetBlock } from "@schools/nova/budget";
import { findBlock, taskKindOf } from "@schools/learning/grade";
import { buildNovaContext, type DraftInput } from "@schools/nova/build-context";
import { takeToken } from "@schools/lib/rate-limit";
import { explainAssessmentCap, explainPolicy } from "@schools/nova/explain";
import { capabilityFor } from "@schools/curriculum/capability";
import { config } from "@schools/config";
import { ownedEpisodeId } from "@schools/learning/episode-scope";
import { bump, opsLog, type OpsCounter } from "@schools/ops/counters";
import { sanitizePayload } from "@solvex/learning-contracts";
import type { LearningEventRow } from "@schools/store/learning-store";
import type { Locale } from "@schools/curriculum/types";

/**
 * Nova.
 *
 * The order of operations here IS the pedagogy and the safety model, and it
 * only works one way round:
 *
 *   1. Is this message something a tutor should answer at all?   (safety gate)
 *   2. Can the deployment afford to answer it?                   (budget)
 *   3. Derive the learner's state from the ledger.
 *   4. Run the Decision Engine. It chooses the action.
 *   5. Run `grantHintLevel`. It sets the ceiling.
 *   6. Only then build a prompt, and only then call a model.
 *   7. Validate every token before the learner sees it.          (guard)
 *
 * A language model asked to decide whether it may give away the answer will
 * eventually decide yes. It is never asked.
 *
 * ## Why steps 1 and 2 come before everything
 *
 * They are the two steps that must not write to the learning ledger. A message
 * about being hurt at home is not evidence about `if`/`else`, and a request
 * refused for cost is not a hint the learner took. Both return before
 * `recordIntervention` exists, which makes the guarantee structural rather than
 * a rule someone has to remember while editing this file.
 */

export const runtime = "nodejs";

interface HintBody {
  blockId?: string;
  episodeId?: string;
  message?: string;
  requestedLevel?: number;
  override?: boolean;
  locale?: Locale;
  /**
   * The conversation so far, as the browser remembers it.
   *
   * Held by the client and never stored here — see `HistoryTurn` in
   * `schools/nova/prompt.ts` for why that separation is the point rather than a
   * shortcut. Every entry is forgeable, including the ones labelled
   * `assistant`, so all of them are fenced as untrusted and all of them are
   * bounded by the prompt builder rather than by anything the caller sends.
   */
  history?: { role?: unknown; text?: unknown }[];
  /**
   * What is on the learner's screen right now, unchecked.
   *
   * The option they have clicked, the code in the editor, the ordering they are
   * halfway through. UNTRUSTED by construction — it is the browser describing
   * itself — so it is shape-checked and clamped in `build-context.ts`, fenced
   * when it reaches the model, and never written to the ledger.
   *
   * It exists because «Где ошибка?» is almost always asked about something not
   * yet submitted, and a tutor that can only see what was already checked is
   * always one step behind the learner.
   */
  draft?: DraftInput;
}

const MAX_MESSAGE = 2000;

/**
 * Room to answer at this rung, and no more.
 *
 * The configured maximum is the ceiling for the top of the ladder; the lower
 * rungs get a fraction of it. This is not a cost optimisation — it is the same
 * rule as the hint level itself, expressed in the one unit the model actually
 * obeys. A question that gives nothing away is one or two sentences, and a
 * model given room for twelve will write twelve.
 */
function tokenBudget(granted: number): number {
  const max = config.nova.maxOutputTokens;
  const share = granted <= 0 ? 0.25 : granted === 1 ? 0.35 : granted === 2 ? 0.5 : granted === 3 ? 0.75 : 1;
  return Math.max(80, Math.round(max * share));
}

/**
 * Blocked families, mapped to their counters.
 *
 * A lookup rather than string interpolation, because `OpsCounter` is a closed
 * union on purpose and `nova.safety.${reason}` would quietly widen it back to
 * `string` — which is how a counter nobody can name gets into a fixed-cost map.
 * `educational` and `social` are absent because they never reach this branch.
 */
const SAFETY_COUNTER = {
  self_harm: "nova.safety.self_harm",
  abuse_disclosure: "nova.safety.abuse_disclosure",
  sexual: "nova.safety.sexual",
  violence: "nova.safety.violence",
  drugs: "nova.safety.drugs",
  illegal_access: "nova.safety.illegal_access",
  hate: "nova.safety.hate",
  personal_data: "nova.safety.personal_data",
  academic_integrity: "nova.safety.academic_integrity",
  prompt_exfiltration: "nova.safety.prompt_exfiltration",
  extended_offtopic: "nova.safety.extended_offtopic",
} as const satisfies Partial<Record<SafetyReason, OpsCounter>>;

const BUDGET_COUNTER = {
  daily_requests: "nova.budget.daily_requests",
  monthly_input_tokens: "nova.budget.monthly_input_tokens",
  monthly_output_tokens: "nova.budget.monthly_output_tokens",
  monthly_cost: "nova.budget.monthly_cost",
} as const satisfies Record<BudgetBlock, OpsCounter>;

/** SSE framing, in one place so every early return produces the same shape. */
function sse(
  write: (controller: ReadableStreamDefaultController<Uint8Array>) => Promise<void> | void,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await write(controller);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

const frame = (event: string, data: unknown) =>
  new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

/**
 * A complete response with no model behind it.
 *
 * Used by the safety gate, the budget ceiling and the validator's last resort.
 * It is chunked rather than sent whole so the panel's streaming states behave
 * identically whether or not a provider was involved — a deterministic answer
 * that arrives as one block reads as an error message, and it is not one.
 */
async function deterministic(
  controller: ReadableStreamDefaultController<Uint8Array>,
  text: string,
  policy: Record<string, unknown>,
): Promise<void> {
  controller.enqueue(frame("policy", policy));
  for (let i = 0; i < text.length; i += 24) {
    controller.enqueue(frame("token", { text: text.slice(i, i + 24) }));
    await new Promise((r) => setTimeout(r, 12));
  }
  controller.enqueue(frame("done", { interventionId: null }));
}

export async function POST(request: Request) {
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  let body: HintBody;
  try {
    body = (await request.json()) as HintBody;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const target = body.blockId ? findBlock(body.blockId) : null;
  if (!target) return Response.json({ error: "unknown block" }, { status: 404 });

  const { subjectId } = await resolveIdentity();
  const store = await getStore();
  const locale: Locale = body.locale === "ru" ? "ru" : "kk";
  const message = typeof body.message === "string" ? body.message.slice(0, MAX_MESSAGE) : "";

  /* Shape-checked here, length-bounded in the prompt builder. Anything that is
     not one of the two known roles is dropped rather than coerced: a turn
     labelled `system` would be a client choosing its own authority level. */
  const history: HistoryTurn[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (t): t is { role: "user" | "assistant"; text: string } =>
            !!t &&
            (t.role === "user" || t.role === "assistant") &&
            typeof t.text === "string",
        )
        .map((t) => ({ role: t.role, text: t.text.slice(0, MAX_MESSAGE) }))
    : [];

  /* Keyed on the learner, never on the client IP. One school behind one NAT
     gateway is one address, so an IP bucket would let the most active student
     throttle the whole classroom — which reads to eighteen children as the
     platform being broken. */
  const limit = await takeToken(`nova:${subjectId}`, { capacity: 20, refillPerMinute: 10 });
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  /*
   * The safety gate, before anything durable happens.
   *
   * `mayCallModel` is false for distress, harm, integrity and exfiltration. All
   * four return here with a deterministic answer and NO ledger write of any
   * kind — no intervention row, no `assistance_requested`, no episode. What a
   * child says about their life must not become a fact about their
   * understanding of loops. `tests/nova/safety.test.ts` asserts the silence.
   *
   * The counter records the family and nothing else: no message, no subject, no
   * excerpt. It exists so a school can be told "the crisis path fired twice
   * this term" without anyone being able to read what was typed.
   */
  const safety = classifyMessage(message);
  if (!safety.mayCallModel) {
    const counter = SAFETY_COUNTER[safety.reason as keyof typeof SAFETY_COUNTER];
    if (counter) bump(counter);
    return sse((c) =>
      deterministic(c, safetyResponse(safety.reason, locale), {
        granted: 0,
        requested: 0,
        capped: false,
        reason: "granted_as_requested",
        explanation: null,
        action: null,
        provider: "policy",
        degraded: false,
        /* The panel hides the hint-level chrome. It is NOT told which family
           fired — that is the product's business, not the browser's. */
        safety: true,
      }),
    );
  }

  /*
   * The ceilings.
   *
   * Also before the ledger: a request that was never made is not assistance
   * that was requested, and charging the learner's independence for the
   * school's budget running out would be a lie about them.
   */
  if (!config.nova.enabled) {
    return sse((c) =>
      deterministic(c, validatorFallback(locale), {
        granted: 0, requested: 0, capped: false, reason: "granted_as_requested",
        explanation: null, action: null, provider: "disabled", degraded: true,
      }),
    );
  }

  let budgetOk = true;
  try {
    const verdict = await checkAndConsumeBudget(subjectId);
    budgetOk = verdict.ok;
    if (!verdict.ok) {
      if (verdict.blockedBy) bump(BUDGET_COUNTER[verdict.blockedBy]);
      opsLog("nova.budget_blocked", { limit: String(verdict.blockedBy) });
    }
  } catch (err) {
    /* Fail open, and say so. A database hiccup must not switch the tutor off
       for a whole class mid-lesson; the cost of being wrong here is cents. */
    bump("nova.budget_check_failures");
    opsLog("nova.budget_check_failed", {
      message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
  }

  if (!budgetOk) {
    const text =
      locale === "kk"
        ? "Бүгінге сұрақтарым таусылды. Ертең қайта көмектесемін — әзірге не істеп көргеніңді өзің жазып көрші."
        : "На сегодня мои подсказки закончились. Завтра снова помогу — а пока попробуй записать, что ты уже пробовал.";
    return sse((c) =>
      deterministic(c, text, {
        granted: 0, requested: 0, capped: true, reason: "granted_as_requested",
        explanation: null, action: null, provider: "policy", degraded: true, limited: true,
      }),
    );
  }

  /*
   * The episode, scoped to the caller.
   *
   * This is the one input on this route that the browser chooses and the server
   * used to accept. It matters more here than anywhere else: `enforceHintPolicy`
   * derives the ENTIRE hint ceiling from the episode — `lastGrantedLevel`,
   * `lastHintAt` and every effort event — and the resulting grant is echoed
   * straight back to the caller in the `policy` frame below. A foreign episode
   * id would therefore compute one learner's help budget from another's work
   * and report the answer. See `schools/learning/episode-scope.ts`.
   */
  const episodeId = await ownedEpisodeId(subjectId, body.episodeId);
  const requested = Number.isFinite(body.requestedLevel) ? Number(body.requestedLevel) : 0;

  /* What kind of work this is, resolved from the curriculum and never from the
     request body. `taskKindOf` is the same function the grader uses, so the
     assessment cap and the assessment's own task_ref cannot disagree about what
     an assessment is. */
  const taskKind = taskKindOf(target);

  const { grant, directive, assessmentCapped } = await enforceHintPolicy({
    store,
    subjectId,
    episodeId,
    requested,
    learnerOverride: body.override === true,
    taskKind,
  });

  const block = target.block;

  /*
   * What Nova actually knows.
   *
   * Built AFTER the grant, and that ordering is load-bearing: the context
   * carries the directive and the ceiling, so building it first would mean
   * assembling a description of what Nova may do before anything had decided.
   *
   * Guarded because it reads the ledger. A store that will not answer is a
   * reason for Nova to know less, never a reason to refuse a fourteen-year-old
   * help — the prompt then degrades to exactly what it was before this phase,
   * which is a worse tutor and a working one.
   */
  let novaContext = null;
  try {
    novaContext = await buildNovaContext({
      store,
      subjectId,
      episodeId,
      locale,
      target,
      grant,
      directive,
      directiveNote: null,
      action: directive?.mode ?? null,
      assessmentCapped,
      draft: body.draft,
    });
  } catch (err) {
    bump("nova.context_failures");
    opsLog("nova.context_failed", {
      message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
  }

  const messages = buildNovaMessages(
    {
      context: novaContext,
      locale,
      monthTitle: target.month.title[locale],
      lessonTitle: target.lesson.title[locale],
      blockPrompt: "prompt" in block ? block.prompt[locale] : target.lesson.title[locale],
      blockCode: "code" in block && typeof block.code === "string" ? block.code : undefined,
      skills: block.skillRefs,
      /* Which Python this learner has actually been shown, computed by walking
         the curriculum in teaching order up to this block. Null only if the id
         resolves to a block outside that walk, in which case the prompt is built
         exactly as it was before — degraded, never blocked. */
      capability: capabilityFor(block.id),
      directive,
      grant,
      briefOffTopic: safety.verdict === "ALLOW_BRIEF_OFFTOPIC",
    },
    message,
    history,
  );

  /*
   * What the model must not be able to repeat.
   *
   * Hidden cases are never put into the prompt, so a leak should be impossible.
   * That is exactly why they are handed to the validator: the guarantee is
   * worth more when something checks it than when it rests on nobody having
   * added them to the context object yet.
   */
  const cases = "cases" in block && Array.isArray(block.cases) ? block.cases : [];
  const forbiddenLiterals = [
    ...cases
      .filter((c) => c.hidden)
      .flatMap((c) => [c.input, c.expectedOutput]),

    /* The reference solution, and the repaired program a find_bug carries.
     *
     * Neither is in the prompt either — but the same argument applies as for
     * hidden cases, and more forcefully: a reference solution is the one thing
     * the programme rules out handing over at any hint level.
     *
     * Added WHOLE rather than line by line, and that granularity is the point.
     * `n = int(input())` is both the first line of half the reference solutions
     * in September and the idiom the month exists to teach — forbidding it
     * line-wise would gag Nova on the curriculum itself. Matching the complete
     * program catches verbatim reproduction and nothing else; the shape check
     * in `validate.ts` (`code.wholeProgram`) is what catches a solution
     * rewritten rather than copied. */
    "referenceSolution" in block && typeof block.referenceSolution === "string"
      ? block.referenceSolution
      : null,
    "fixedCode" in block && typeof block.fixedCode === "string" ? block.fixedCode : null,

    /* A fill_blank's answers. Short by nature, so most are filtered out below —
       `map` and `split` never survive the length floor, and should not: they
       are words the lesson teaches. Declared anyway so a longer blank added
       later is covered without anyone remembering this file. */
    ...(block.type === "fill_blank" ? block.blanks.map((b) => b.answer) : []),
  ].filter((s): s is string => typeof s === "string" && s.trim().length >= 6);

  const provider = await getNovaProvider();

  // Recorded BEFORE the model is called. An intervention that was granted is an
  // intervention, whether or not the provider then fell over — and the
  // independence cost is owed either way.
  const interventionId = randomUUID();
  const sessionId = randomUUID();
  const route = `/lesson/${target.lesson.id}`;
  /*
   * What the hint was ALLOWED to contain. Not what it did.
   *
   * This is written to `interventions` before the model has produced a token,
   * which is correct for a permission and wrong for an observation — and
   * `contains_code` in the assistance ledger is read as an observation:
   * `interventionOutcome.ts` opens its copy-detection branch with
   * `if (!intervention.contains_code) return "resolved_independently"`. A
   * level-2 hint that did contain a corrected line therefore made every
   * subsequent solve unconditionally independent, and the copying threshold
   * could never see it.
   *
   * So the permission is recorded here and the OBSERVATION is measured from the
   * delivered text further down, where it exists.
   */
  const codeAllowed = grant.mayIncludeCode && grant.granted >= 4;

  /* Guarded, and it continues on failure.
   *
   * A ledger that will not accept the write is a real problem — the ladder
   * reads `interventions` back as `lastGrantedLevel`, so while this is failing
   * the rungs are not being counted and the cap is softer than it looks. It is
   * still not a reason to refuse a fourteen-year-old help. The failure is
   * counted and logged so it is visible on the health view rather than showing
   * up a week later as an independence figure nobody can explain. */
  try {
    await store.recordIntervention({
      interventionId,
      subjectId,
      episodeId,
      kind: "hint",
      level: grant.granted,
      trigger: "learner_requested",
      mode: directive?.mode ?? null,
      containsCode: codeAllowed,
      contentLen: 0,
    });
  } catch (err) {
    bump("save.event_write_failures");
    opsLog("save.intervention_write_failed", {
      level: grant.granted,
      message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
  }

  /*
   * The assistance ledger.
   *
   * `recordIntervention` above writes the `interventions` table, which is what
   * the hint ladder reads back as `lastGrantedLevel`. That table is NOT the
   * event stream, and the event stream is what the episode reducer folds into
   * `independence_weight`, `soloSolved` / `assistedSolved` and the teacher's
   * assistance signal.
   *
   * The request is recorded here. The DELIVERY is recorded only once tokens
   * have actually reached the learner — asking for help that never arrived is
   * not assistance, and charging independence for a provider outage would be a
   * lie in the other direction.
   */
  const assistanceEvent = (
    name: "assistance_requested" | "assistance_delivered",
    seq: number,
    payload: Record<string, unknown>,
  ): LearningEventRow => ({
    eventId: randomUUID(),
    subjectId,
    episodeId,
    sessionId,
    seq,
    eventName: name,
    occurredAt: new Date().toISOString(),
    // Derived on this server from the ledger, never claimed by the browser.
    sourceTrust: "server",
    environment: config.environment,
    cohort: "public",
    route,
    payload: sanitizePayload({ intervention_id: interventionId, ...payload }),
  });

  /**
   * Append, or count the failure and carry on.
   *
   * The cost of continuing is honest under-counting of assistance during an
   * outage, which biases independence UPWARD. That is the wrong direction and
   * it is why this is counted rather than swallowed.
   */
  const appendOrCount = async (rows: LearningEventRow[]): Promise<void> => {
    try {
      await store.appendEvents(rows);
    } catch (err) {
      bump("save.event_write_failures");
      opsLog("save.assistance_write_failed", {
        event: rows[0]?.eventName ?? "unknown",
        message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      });
    }
  };

  await appendOrCount([
    assistanceEvent("assistance_requested", 0, {
      requested_level: grant.requested,
      granted_level: grant.granted,
      trigger: "learner_requested",
      mode: directive?.mode ?? undefined,
    }),
  ]);

  const validation: ValidationContext = { grant, directive, forbiddenLiterals };

  return sse(async (controller) => {
    const send = (event: string, data: unknown) => controller.enqueue(frame(event, data));

    // The learner sees the policy decision immediately, before any token.
    send("policy", {
      granted: grant.granted,
      requested: grant.requested,
      capped: grant.capped,
      reason: grant.reason,
      /* Translated from the reason code, not from the core's English
         sentence. A learner never sees the engine's own wording. */
      /* The assessment sentence outranks the ladder's, because it is the one
         that is true: under assessment the ceiling is the exam's, not the
         rung's, and the ladder's wording would describe a situation the learner
         is not in. */
      explanation: assessmentCapped
        ? explainAssessmentCap(locale)
        : explainPolicy(grant.reason, locale),
      action: directive?.mode ?? null,
      /* The model's identity comes from configuration, never from the model.
         Asking an LLM what it is produces confident fiction. */
      provider: provider.id,
      /* Whether there is actually a model behind this. The panel shows a
         banner rather than letting the learner infer it from the prose. */
      degraded: provider.degraded,
      /* The ceiling came from assessment policy rather than from the ladder.
         Worth distinguishing in the panel: "you have not tried anything yet" and
         "this is the monthly check" are different sentences, and a learner told
         the wrong one concludes the tutor is broken. */
      assessmentCapped,
    });

    /*
     * Cancellation, wired to two clocks.
     *
     * `request.signal` fires when the learner closes the panel or hits Stop;
     * the timeout fires when the provider stops talking. Without either, a
     * closed browser tab left the server streaming from DeepSeek to nobody and
     * paying for every token of it — the Stop button aborted the fetch on the
     * client and nothing at all on the server.
     */
    const timeout = AbortSignal.timeout(config.nova.requestTimeoutMs);
    const abort = new AbortController();
    const signal = AbortSignal.any([request.signal, timeout, abort.signal]);

    let usageIn = 0;
    let usageOut = 0;
    const onUsage = (u: { inputTokens: number; outputTokens: number }) => {
      usageIn += u.inputTokens;
      usageOut += u.outputTokens;
    };

    const startedAt = Date.now();
    let firstTokenAt: number | null = null;

    /** One guarded attempt. Returns what the learner saw and why it stopped. */
    const attempt = async (ctx: ValidationContext) => {
      const stream = guardedStream(
        provider.stream({
          messages,
          /* Scaled to the GRANTED level, never the requested one.
             A level-0 "ask ONE question, give nothing away" hint handed the
             same budget as a level-4 worked fix will fill it, and length is the
             part of a small hint a learner actually notices — so the ceiling
             would be stated in the prompt and contradicted by the request. */
          maxTokens: tokenBudget(grant.granted),
          temperature: 0.4,
          signal,
          onUsage,
        }),
        ctx,
        () => {
          /* Stop paying for a response the learner will never see. The
             provider's fetch is aborted the moment the first violation is
             certain, not when the response finally ends. */
          abort.abort();
        },
      );

      /* Iterated by hand rather than with `for await`, because the guard
         reports WHY it stopped through the generator's RETURN value and
         `for await` discards it. That value is the difference between "the
         model finished" and "the validator cut it off", which is what decides
         whether the stricter retry below runs. */
      let result = await stream.next();
      while (!result.done) {
        if (firstTokenAt === null) firstTokenAt = Date.now();
        send("token", { text: result.value });
        result = await stream.next();
      }
      return result.value;
    };

    try {
      let outcome = await attempt(validation);

      /*
       * One retry, stricter, and only when nothing was shown.
       *
       * If the learner has already seen part of the answer there is nothing to
       * retry INTO — a second response would arrive glued to the tail of the
       * first. So the retry is available exactly once, in the case where the
       * violation happened before a single token was released, and it happens
       * under a grant that forbids code entirely. A model that produced too
       * much code with a budget of two will not produce less when asked again
       * politely; it will when the instruction changes.
       */
      if (outcome.violations.length > 0 && outcome.released.length === 0) {
        bump("nova.output_rejected");
        opsLog("nova.output_rejected", {
          codes: outcome.violations.map((v) => v.code).join(","),
          attempt: "1",
        });
        outcome = await attempt({
          ...validation,
          grant: { ...grant, granted: Math.min(grant.granted, 1), mayIncludeCode: false },
        });
      }

      if (outcome.violations.length > 0) {
        bump("nova.output_rejected_final");
        opsLog("nova.output_rejected", {
          codes: outcome.violations.map((v) => v.code).join(","),
          attempt: "final",
          released: String(outcome.released.length),
        });
        /* Nothing usable came back twice. The learner is not told why — they
           did nothing wrong and the reason is ours. */
        const fallback = validatorFallback(locale);
        send("token", { text: (outcome.released ? "\n\n" : "") + fallback });
        outcome = { ...outcome, released: outcome.released + fallback };
      }

      /* Delivered, because it arrived. `content_len` is the real length of
         what the learner was SHOWN — not what the model produced — so a
         truncated response is recorded as the shorter thing it was. */
      await appendOrCount([
        assistanceEvent("assistance_delivered", 1, {
          level: grant.granted,
          mode: directive?.mode ?? undefined,
          evidence_type: "hint",
          contains_code: inspectCode(outcome.released).lines > 0,
          content_len: outcome.released.length,
        }),
      ]);
      send("done", { interventionId });
    } catch (err) {
      const kind = err instanceof NovaProviderError ? err.kind : "unknown";
      // Never leave the UI spinning. An error is a state, not a silence.
      send("error", { kind, retryable: err instanceof NovaProviderError && err.retryable });
    } finally {
      if (usageIn > 0 || usageOut > 0) {
        try {
          await recordSpend(usageIn, usageOut);
        } catch {
          bump("nova.spend_write_failures");
        }
      }
      /* Latency, in aggregate, with nothing about who or what. TTFT is the
         number that decides whether the panel feels alive; total duration is
         the one that decides whether the timeout is set anywhere near right. */
      opsLog("nova.timing", {
        ttft_ms: String(firstTokenAt === null ? -1 : firstTokenAt - startedAt),
        total_ms: String(Date.now() - startedAt),
        provider: provider.id,
      });
    }
  });
}
