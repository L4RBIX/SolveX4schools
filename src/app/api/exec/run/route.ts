import { getExecutionProvider, EXECUTION_LIMITS } from "@schools/exec";
import { MAX_REQUEST_BYTES, checkPayloadSize, requestTooLarge } from "@schools/exec/limits";
import { resolveIdentity } from "@schools/learning/identity";
import { takeToken } from "@schools/lib/rate-limit";

/**
 * RUN — the learner's own input, on their own terms.
 *
 * Produces NO evidence, by contract. `run_executed` carries browser trust in
 * the event taxonomy, and nothing here is signed. That is deliberate: RUN is
 * for finding out what your program does, and a learner who feels watched while
 * experimenting experiments less.
 *
 * SUBMIT is the trusted path, and it lives on `/api/learning/submit`.
 *
 * ## RUN IS NOT IDEMPOTENT AND MUST NOT BECOME SO
 *
 * `/api/learning/submit` now carries a `submissionId` and refuses to grade the
 * same submission twice. Nothing of the sort belongs here, and the temptation
 * to make the two routes symmetrical is worth naming so nobody acts on it.
 * Running the same program twice is the entire point of a Run button — change
 * the input, or just look at it again — and there is no ledger row for a second
 * run to corrupt, because this route writes nothing. Deduplicating it would
 * remove a feature and call it hardening.
 *
 * The size limits below apply to both routes, because those are about what this
 * service will hold in memory and hand to a subprocess, which is the same
 * question wherever the code came from.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  /* Before the body is read. `request.json()` buffers whatever arrives, so the
     cheapest possible refusal of a hundred-megabyte POST is one that happens
     before it is parsed. See `schools/exec/limits.ts`. */
  if (requestTooLarge(request)) {
    return Response.json(
      { error: "request too large", limitBytes: MAX_REQUEST_BYTES },
      { status: 413 },
    );
  }

  let body: { sourceCode?: string; stdin?: string };
  try {
    body = (await request.json()) as { sourceCode?: string; stdin?: string };
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const source = typeof body.sourceCode === "string" ? body.sourceCode : "";
  const stdin = typeof body.stdin === "string" ? body.stdin : "";
  if (!source.trim()) {
    return Response.json({ error: "sourceCode required" }, { status: 400 });
  }

  /*
   * Size, on both fields, in bytes.
   *
   * Two things were wrong here. The source check compared `source.length` —
   * UTF-16 code units — against a limit named in BYTES, so a program commented
   * in Kazakh or Russian was measured at roughly half the size it would occupy
   * when written to the judge. And `stdin` had no limit at all: whatever the
   * body contained went straight into a subprocess's pipe.
   *
   * Both now go through the same function the provider decorator uses, so the
   * route and the judge cannot hold different opinions about what is too big,
   * and the response names the ceiling and the actual size — a bare 413 tells a
   * learner nothing they can act on.
   */
  const rejection = checkPayloadSize({ sourceCode: source, stdin });
  if (rejection) {
    return Response.json(
      {
        error: "payload too large",
        reason: rejection.reason,
        limitBytes: rejection.limitBytes,
        actualBytes: rejection.actualBytes,
      },
      { status: 413 },
    );
  }

  const { subjectId } = await resolveIdentity();

  // Per learner, never per IP — a school is one NAT gateway and an IP bucket
  // would let one busy student throttle the whole class.
  const limit = await takeToken(`exec:${subjectId}`, { capacity: 30, refillPerMinute: 20 });
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  const provider = await getExecutionProvider();
  if (provider === null) {
    /*
     * No server judge — and for RUN, specifically, that is close to harmless.
     *
     * This route is the FALLBACK for browsers that cannot load Pyodide. The
     * primary Run path is the learner's own browser and does not touch this
     * code at all, so `EXEC_PROVIDER=none` costs a modern browser nothing. It
     * costs a learner on a machine without WASM their Run button, which is
     * worth saying plainly rather than returning an empty successful-looking
     * result with no output in it.
     *
     * 503, not 500: nothing is broken. Nothing is configured.
     */
    return Response.json(
      {
        status: "provider_error",
        error: "no_trusted_provider",
        stdout: "",
        stderr: "",
        infrastructureError: true,
      },
      { status: 503 },
    );
  }
  /*
   * A metered judge is not for Run.
   *
   * This route is the FALLBACK for a browser that cannot load Pyodide. The
   * primary Run path is the learner's own browser and never touches this code,
   * so refusing here costs a modern browser nothing at all.
   *
   * What it prevents is the failure that would take the whole class down. Run
   * is rate limited at 20/minute per learner; eighteen learners is **360
   * RapidAPI requests a minute** of untrusted, ungraded, typing-speed traffic,
   * before anybody presses Check. One press of Check is already ~5 Judge0
   * submissions (September's blocks declare a median of 5 cases, up to 9), so a
   * class doing one Check each is ~87 submissions. Run traffic at that rate
   * would exhaust any plausible plan in seconds and the first thing to break
   * would be SUBMIT — the trusted, graded path — because somebody was typing.
   *
   * So the trade is made explicitly and in the safe direction: a learner whose
   * browser cannot run WebAssembly loses a convenience, and the class keeps its
   * graded course. 503 with the same shape as the no-provider case, because it
   * is the same fact from the learner's side — nothing is broken, this simply
   * is not available to them here.
   */
  if (provider.metered) {
    return Response.json(
      {
        status: "provider_error",
        error: "run_not_available_on_metered_provider",
        stdout: "",
        stderr: "",
        infrastructureError: true,
      },
      { status: 503 },
    );
  }

  const result = await provider.run({
    language: "python3",
    sourceCode: source,
    stdin,
    timeLimitMs: EXECUTION_LIMITS.timeLimitMs,
    memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
  });

  return Response.json({
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    timeMs: result.timeMs,
    /* Surfaced so the UI can say "we could not run this" instead of implying
       the learner's program failed. */
    infrastructureError: result.infrastructureError,
  });
}
