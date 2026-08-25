import { getExecutionProvider, EXECUTION_LIMITS } from "@schools/exec";
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
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { sourceCode?: string; stdin?: string };
  try {
    body = (await request.json()) as { sourceCode?: string; stdin?: string };
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const source = typeof body.sourceCode === "string" ? body.sourceCode : "";
  if (!source.trim()) {
    return Response.json({ error: "sourceCode required" }, { status: 400 });
  }
  if (source.length > EXECUTION_LIMITS.maxSourceBytes) {
    return Response.json({ error: "source too large" }, { status: 413 });
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
  const result = await provider.run({
    language: "python3",
    sourceCode: source,
    stdin: typeof body.stdin === "string" ? body.stdin : "",
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
