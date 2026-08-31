import { randomUUID } from "node:crypto";
import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { resolveIdentity } from "@schools/learning/identity";
import { enforceHintPolicy } from "@schools/nova/enforce";
import { buildNovaMessages, type HistoryTurn } from "@schools/nova/prompt";
import { executionContextFor } from "@schools/nova/execution-context";
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
import { L } from "@schools/presentation/labels";
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
  /**
   * The learner's most recent LOCAL run, as the browser reports it.
   *
   * Typed `unknown` on purpose. Everything about it is re-derived by
   * `parseReportedRun` — the status against the union, the streams against
   * `string`, the length against a prompt budget — and the one field that
   * matters, `trust`, is not read at all. A body claiming `server_verified` is
   * claiming a field nothing in this process looks for.
   *
   * Sibling to `draft` and untrusted for the same reason: both describe a
   * screen this server did not render. `draft` is what the learner typed or
   * clicked; this is what their program printed when they pressed Run.
   */
  lastRun?: unknown;
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

/**
 * The ledger will not answer, and the learner is owed a sentence anyway.
 *
 * Every store touch above the model call used to sit outside any try/catch. A
 * PGlite data directory that had become unreadable therefore produced an
 * unhandled rejection and a bare 500 with an EMPTY BODY — before a single byte
 * of SSE framing existed. The panel's entire error protocol is frames, so with
 * nothing to read it fell through to «Жауап алынбады. Қайта көріңіз.» beside a
 * Retry button with no cap on it: a fourteen-year-old pressing retry against a
 * database that will not come back this lesson, and not one sentence anywhere
 * telling them or their teacher what had happened — while `/api/health` knew
 * exactly, in both languages, the whole time.
 *
 * So the failure is answered the way the safety gate and the budget ceiling
 * already answer: a normal 200 SSE stream, a policy frame, and text streamed in
 * chunks so the panel's states behave as they do for any other reply. The frame
 * carries `storeDown` so the panel can drop the hint chrome rather than infer
 * anything from the prose.
 *
 * No model is called here and nothing is written, and both are structural
 * rather than cautious. The hint ceiling is DERIVED from the ledger — the rung
 * last granted, the effort since, the assessment cap — so a Nova that answered
 * on this path would answer with no idea what the learner has already been
 * given, which is the single thing the ladder exists to prevent. An unbounded
 * hint is worse for the learner than no hint plus the truth.
 */
function storeDown(
  locale: Locale,
  phase: "identity" | "rate_limit" | "ladder",
  err: unknown,
): Response {
  bump("nova.store_unavailable");
  /* The phase, because "the directory is gone" and "one query failed" are two
     different Tuesdays and the counter alone cannot tell them apart. The
     message is trimmed and nothing else is logged: a driver error can carry a
     connection string, and no learner is identified in an ops line. */
  opsLog("nova.store_unavailable", {
    phase,
    message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
  });
  return sse((c) =>
    deterministic(c, L.novaStoreDown[locale], {
      granted: 0,
      requested: 0,
      capped: false,
      reason: "granted_as_requested",
      /* Null for the same reason the safety and budget frames send null: the
         whole explanation IS the streamed sentence, and a policy notice pinned
         above it would say the same thing twice in two registers. */
      explanation: null,
      action: null,
      provider: "policy",
      /* Deliberately NOT degraded. `degraded` means "there is no model behind
         Nova", and the panel raises a banner telling the class exactly that.
         The model is fine here; the database is not. Telling eighteen children
         the tutor is offline when it is answering normally would be a second
         wrong sentence stacked on top of the outage. */
      degraded: false,
      /* The one flag that is true, and the one the panel keys on. */
      storeDown: true,
    }),
  );
}

export async function POST(request: Request) {
  /*
   * The body first, ahead of the session check, and the reason is the locale.
   *
   * Everything below this line can now fail with a sentence instead of an empty
   * 500, and a sentence has to be in a language the reader actually has. The
   * locale arrives in the body and nowhere else — there is no session yet, and
   * a store that will not open cannot be asked for a preference — so an access
   * check that ran first would leave the store-down path guessing, and guessing
   * means Kazakh copy on the screen of a child being taught in Russian.
   *
   * Nothing is given away by the move: parsing JSON reads no session, opens no
   * database and writes nothing. The only thing an unauthenticated caller gains
   * is being told its own body was malformed before being told it is not signed
   * in.
   */
  let body: HintBody;
  try {
    body = (await request.json()) as HintBody;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const locale: Locale = body.locale === "ru" ? "ru" : "kk";

  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence.

     Guarded, because it reads the session table: with a cookie in hand and a
     dead store this was the very first thing that threw, ~80 lines before the
     route produced a byte. `access.ok === false` keeps its own 401 — "we do not
     know who you are" and "we cannot reach the database" are different answers
     and collapsing them would let an outage read as a sign-in problem. */
  let access: Awaited<ReturnType<typeof checkLearningAccess>>;
  try {
    access = await checkLearningAccess();
  } catch (err) {
    return storeDown(locale, "identity", err);
  }
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  const target = body.blockId ? findBlock(body.blockId) : null;
  if (!target) return Response.json({ error: "unknown block" }, { status: 404 });

  /*
   * The identity and the store, under one guard.
   *
   * `resolveIdentity` opens the store to resolve the subject and `getStore`
   * opens it outright, so on a broken data directory both reject — and neither
   * had a catch, which is the incident this route was found in.
   *
   * Note what the guard unblocks further down. `checkAndConsumeBudget` is
   * documented to fail OPEN precisely so that a database hiccup does not switch
   * the tutor off for a whole class mid-lesson, and it is implemented that way,
   * with a try/catch, a counter and a log line. None of that code could ever
   * run: the store had already been opened here, unguarded, and the request was
   * dead long before the budget had an opinion.
   */
  let subjectId: string;
  let store: Awaited<ReturnType<typeof getStore>>;
  try {
    ({ subjectId } = await resolveIdentity());
    store = await getStore();
  } catch (err) {
    return storeDown(locale, "identity", err);
  }

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
  let limit: Awaited<ReturnType<typeof takeToken>>;
  try {
    limit = await takeToken(`nova:${subjectId}`, { capacity: 20, refillPerMinute: 10 });
  } catch (err) {
    /* The bucket is a row in the same database, and this is the first QUERY the
       route runs — a store that opened and then refuses to answer fails here
       rather than at the open above. It is the same outage with the same
       consequence, so it gets the same sentence rather than being carried
       another thirty lines into an await that has no catch either. */
    return storeDown(locale, "rate_limit", err);
  }
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

  const requested = Number.isFinite(body.requestedLevel) ? Number(body.requestedLevel) : 0;

  /* What kind of work this is, resolved from the curriculum and never from the
     request body. `taskKindOf` is the same function the grader uses, so the
     assessment cap and the assessment's own task_ref cannot disagree about what
     an assessment is. */
  const taskKind = taskKindOf(target);

  /*
   * The episode, scoped to the caller — and the ladder derived from it.
   *
   * The episode is the one input on this route that the browser chooses and the
   * server used to accept. It matters more here than anywhere else:
   * `enforceHintPolicy` derives the ENTIRE hint ceiling from it —
   * `lastGrantedLevel`, `lastHintAt` and every effort event — and the resulting
   * grant is echoed straight back to the caller in the `policy` frame below. A
   * foreign episode id would therefore compute one learner's help budget from
   * another's work and report the answer. See
   * `schools/learning/episode-scope.ts`.
   *
   * Both are guarded, and guarded together, because they are the same read from
   * the same ledger and neither has an answer that is safe to invent. A grant
   * computed without `lastGrantedLevel` is a ceiling computed from nothing,
   * which for a learner mid-assessment is the difference between a question and
   * the answer — so a ledger that will not answer ends the request with the
   * honest sentence rather than a guessed ceiling.
   *
   * The catch also swallows a plain bug in the ladder, and that is a real cost:
   * the learner would be told their work is not being saved on an afternoon
   * when the database is fine. `phase` in the ops line is what separates the
   * two for whoever is reading them, and the alternative — letting it escape —
   * is the empty 500 this whole file exists to stop.
   */
  let episodeId: string;
  let policy: Awaited<ReturnType<typeof enforceHintPolicy>>;
  try {
    episodeId = await ownedEpisodeId(subjectId, body.episodeId);
    policy = await enforceHintPolicy({
      store,
      subjectId,
      episodeId,
      requested,
      learnerOverride: body.override === true,
      taskKind,
    });
  } catch (err) {
    return storeDown(locale, "ladder", err);
  }

  const { grant, directive, assessmentCapped } = policy;

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

  /*
   * Where the code the learner is staring at actually ran.
   *
   * Only for blocks that HAVE a Run button. `body.lastRun` is taken on the
   * browser's word rather than re-derived — trust, the hint ceiling, episode
   * ownership and the verdict are all recomputed server-side. Unguarded, a
   * `lastRun` posted alongside a multiple-choice block made the system prompt
   * assert that their C++ was compiled and executed in their own browser about
   * a quiz question, and a reported `runtime_unavailable` had Nova apologise
   * for a toolchain that block never loads.
   *
   * The condition is the same one `RunPanel` is mounted on: a block with
   * `code` in it is a block with an editor.
   *
   * This is the second half of "Nova can see the screen". `draft` carries what
   * the learner TYPED; this carries what the COMPILER said about it — and in
   * C++ that is usually the whole conversation. The diagnostic in `stderr` is
   * the answer to «Почему ошибка?», it is in English, and the learner cannot
   * read it; without it the tutor is reduced to asking which error they got.
   */
  const runnable = "code" in block || "cases" in block;
  const execution = executionContextFor({
    reported: runnable ? body.lastRun : undefined,
    events: policy.events,
    blockId: block.id,
  });

  const messages = buildNovaMessages(
    {
      context: novaContext,
      execution,
      locale,
      monthTitle: target.month.title[locale],
      lessonTitle: target.lesson.title[locale],
      blockPrompt: "prompt" in block ? block.prompt[locale] : target.lesson.title[locale],
      blockCode: "code" in block && typeof block.code === "string" ? block.code : undefined,
      skills: block.skillRefs,
      /* Which constructs this learner has actually been shown, computed by
         walking the curriculum in teaching order up to this block. Null only if
         the id resolves to a block outside that walk, in which case the prompt
         is built exactly as it was before — degraded, never blocked. */
      capability: capabilityFor(block.id),
      /* Where in the nine months they are, for the C++17 sequence gate in
         `@schools/nova/cpp17`. The id, not a derived position: the prompt
         builder owns that derivation, so the dev lab and the tests get the same
         answer as production without restating the parsing. */
      blockId: block.id,
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
     * `cin >> n;` is both the first body line of half the reference solutions
     * in September and the idiom the month exists to teach — forbidding it
     * line-wise would gag Nova on the curriculum itself, and on the frame the
     * course hands the learner already written. Matching the complete
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

    /*
     * The policy sentence, when there is one worth showing.
     *
     * Assessment first, because under it the ceiling is the exam's rather than
     * the ladder's and the rung's wording would describe a situation the
     * learner is not in. Then the two reasons that CLOSE help until the learner
     * does something — those are the only ladder states they can act on. Then
     * the override, which is not a refusal but a consequence: a solve taken
     * this way does not count as their own, and they are entitled to know that
     * before they read the answer.
     *
     * Everything else is the ladder describing itself, and is dropped.
     */
    const ACTIONABLE = new Set(["attempt_required", "no_attempt_since_last_hint", "learner_override"]);
    const policyNotice = assessmentCapped
      ? explainAssessmentCap(locale)
      : ACTIONABLE.has(grant.reason)
        ? explainPolicy(grant.reason, locale)
        : null;

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
      /*
       * ...and it is sent ONLY when it says something the learner has to act on
       * or accept.
       *
       * Every rung used to send one, and the panel pinned each above the
       * answer, so a lesson read:
       *
       *   [notice] Начнём с вопроса. Как думаешь, что здесь происходит?
       *   [Nova]   Посмотри внимательно на строку...
       *
       * Two openings, two registers, one turn — the state machine narrating
       * itself over the tutor's shoulder. `opening_rung`, `one_rung_at_a_time`
       * and `capped_by_directive` describe the LADDER's position, which is our
       * bookkeeping and not news to a fourteen-year-old, so they are dropped
       * here rather than hidden in the panel: a field that is never rendered
       * should not be on the wire.
       *
       * What survives is what changes what the learner does next — help is
       * closed until they try again, this is the monthly check, or this answer
       * will not count as their own. Those are conditions, not conversation,
       * and `explanationStyle` says so.
       */
      explanation: policyNotice,
      /* `status` — a quiet line by the composer, outside the transcript and
         outside the model's memory. Null when there is nothing to say. */
      explanationStyle: policyNotice === null ? null : "status",
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
     * Cancellation, wired to three clocks — and two of them are built PER
     * ATTEMPT, which is the whole point of this block.
     *
     * `request.signal` fires when the learner closes the panel or hits Stop;
     * the per-attempt timeout fires when the provider stops talking; the
     * per-attempt `abort` is how the output validator stops paying for a
     * response the learner will never see. Without any of them, a closed
     * browser tab left the server streaming from DeepSeek to nobody and paying
     * for every token of it — the Stop button aborted the fetch on the client
     * and nothing at all on the server.
     *
     * ## Why the timeout and the controller moved inside `attempt`
     *
     * They used to be constructed HERE, once, and composed once into a single
     * `signal` that both attempts shared. That made the stricter retry below
     * dead on arrival, in the most direct way possible: the validator stops a
     * bad first attempt by calling `abort.abort()`, `AbortSignal.any` is
     * aborted forever the moment any input is, and the retry was then handed a
     * signal that had ALREADY fired. It could not emit a token. The learner saw
     * an empty reply and an `error` frame reading `kind: "timeout"` — about a
     * second after asking, nowhere near the 30 s timeout that name implies.
     *
     * Measured before the fix, against the real provider: 1 of 9 Kazakh
     * requests took that path and returned nothing at all. That is the
     * validator-rejection rate, and every single rejection was unrecoverable
     * even though a retry existed specifically to recover it.
     *
     * So each attempt now gets its own timeout and its own controller, and a
     * violation in attempt 1 cancels attempt 1 and nothing else.
     *
     * ## And why there is still one shared clock
     *
     * `overall` is the total hard cap. Per-attempt budgets alone would let two
     * attempts run to twice the configured timeout, which is a learner watching
     * a spinner for a minute because the number they were promised was
     * per-attempt and nobody said so. It counts from here, spans every attempt,
     * and is deliberately not generous: one whole extra attempt's worth.
     */
    const NOVA_MAX_ATTEMPTS = 2;
    const overall = AbortSignal.timeout(config.nova.requestTimeoutMs * NOVA_MAX_ATTEMPTS);

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
      /* Fresh per attempt. See the long note above `overall`: sharing these was
         what made the retry unable to emit a single token. */
      const timeout = AbortSignal.timeout(config.nova.requestTimeoutMs);
      const abort = new AbortController();
      const signal = AbortSignal.any([request.signal, overall, timeout, abort.signal]);

      const stream = guardedStream(
        provider.stream({
          messages,
          /* Scaled to the GRANTED level, never the requested one.
             A level-0 "ask ONE question, give nothing away" hint handed the
             same budget as a level-4 worked fix will fill it, and length is the
             part of a small hint a learner actually notices — so the ceiling
             would be stated in the prompt and contradicted by the request. */
          maxTokens: tokenBudget(grant.granted),
          /*
           * Measured, and kept.
           *
           * `scripts/live/nova-voice-benchmark.ts` put ten representative
           * contexts through the real provider at 0.4 / 0.7 / 0.9 / 1.1 / 1.3
           * with the production prompt:
           *
           *   temp  grounded  leaked  voiceClean  localePure  sentences
           *   0.4      7/10       0        9/10       10/10        2.5
           *   0.7      6/10       1        6/10       10/10        2.8
           *   0.9      6/10       0        8/10       10/10        3.0
           *   1.1      9/10       0        6/10       10/10        2.9
           *   1.3      6/10       0        7/10        9/10        2.6
           *
           * 0.7 produced text a hint level forbade, which settles it on its own
           * — voice is subordinate to policy and a configuration that leaks is
           * not a candidate however well it reads. 1.1 grounds best and writes
           * the least natural prose of the five; 1.3 lost a Kazakh reply to
           * Russian. 0.4 is the only setting that is simultaneously leak-free,
           * cleanest on the voice linter, fully locale-pure and shortest.
           *
           * So this number did not change, and that is the finding rather than
           * an absence of one. n=10 per temperature: single-count differences
           * here are noise, and the two that are not — the leak and the locale
           * drift — are the ones being acted on.
           */
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
      /*
       * Never leave the UI spinning. An error is a state, not a silence.
       *
       * Both fields are read, and by design: `kind` chooses which sentence the
       * panel shows, and `retryable` decides whether a Retry button appears at
       * all. A refusal that will refuse again — a timeout the deployment cannot
       * beat, a provider that is off — must not be offered a button, because a
       * learner given one presses it until the lesson is over. Anything that is
       * not a `NovaProviderError` is an unknown that has NOT been reasoned
       * about, so it is not retryable either.
       */
      const providerError = err instanceof NovaProviderError ? err : null;
      send("error", {
        kind: providerError?.kind ?? "unknown",
        retryable: providerError?.retryable ?? false,
      });
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
