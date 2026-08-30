import "server-only";
import { bump, opsLog } from "@schools/ops/counters";
import {
  EXECUTION_LIMITS,
  type CodeExecutionProvider,
  type ExecutionRequest,
  type ExecutionResult,
} from "./provider";

/**
 * How big a thing the judge will look at.
 *
 * ## What was missing
 *
 * `EXECUTION_LIMITS` already carried `maxSourceBytes` and `maxOutputBytes`, and
 * exactly one of the three was enforced: the LOCAL provider truncates stdout.
 * Nothing enforced a source limit anywhere but `/api/exec/run`, which compared
 * `source.length` — UTF-16 code units — against a number called `Bytes`, so a
 * source of Cyrillic or Kazakh text passed a check that thought it was
 * measuring something else. And `stdin` had no limit at all: manual Run takes
 * whatever the request body contains and hands it straight to a subprocess.
 *
 * ## Why bytes, and why measured here
 *
 * The provider writes UTF-8 to a pipe or posts UTF-8 to Piston, so bytes is
 * what actually crosses the boundary. `"ә".length` is 1 and its UTF-8 length is
 * 2; a comment written in Kazakh is two bytes per character. Measuring the
 * thing that is actually sent is the only measurement that means anything, and
 * doing it in one place is what stops the two routes from disagreeing.
 *
 * ## Why this is not a verdict
 *
 * A learner who pasted a megabyte has not written a wrong program. They have
 * sent us something we refuse to run, and the refusal is ours. That is why
 * `payload_too_large` is a status that carries `infrastructureError: true` —
 * "this result says nothing about the learner" — and why the routes reject
 * before any learning event is written rather than recording an attempt and
 * calling it unmeasured. See `schools/exec/provider.ts` for the status and
 * `src/app/api/learning/submit/route.ts` for the refusal.
 */

/**
 * The JSON envelope ceiling, checked at the API boundary from `content-length`
 * before the body is read.
 *
 * It exists because `request.json()` buffers whatever arrives: a hundred
 * megabytes of JSON is a hundred megabytes of heap in a Node process serving a
 * class, spent before any of the field-level limits below get a chance to look
 * at anything. 256 KiB is four times the source limit plus room for the rest of
 * the body, which means it can only ever fire on a request that was going to be
 * refused on its merits anyway — its job is to refuse it CHEAPLY.
 */
export const MAX_REQUEST_BYTES = 256 * 1024;

export type PayloadRejectionReason = "source_too_large" | "stdin_too_large";

export interface PayloadRejection {
  reason: PayloadRejectionReason;
  limitBytes: number;
  actualBytes: number;
}

/** UTF-8 bytes, which is what reaches the judge. Not `String.length`. */
export function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

/**
 * Is this request small enough to run?
 *
 * Pure, and returns the numbers rather than a boolean, because every caller
 * wants to say WHICH limit and by how much — a 413 that does not name the
 * ceiling is a 413 nobody can act on.
 */
export function checkPayloadSize(input: {
  sourceCode: string;
  stdin?: string;
}): PayloadRejection | null {
  const source = byteLength(input.sourceCode);
  if (source > EXECUTION_LIMITS.maxSourceBytes) {
    return {
      reason: "source_too_large",
      limitBytes: EXECUTION_LIMITS.maxSourceBytes,
      actualBytes: source,
    };
  }

  const stdin = byteLength(input.stdin ?? "");
  if (stdin > EXECUTION_LIMITS.maxStdinBytes) {
    return {
      reason: "stdin_too_large",
      limitBytes: EXECUTION_LIMITS.maxStdinBytes,
      actualBytes: stdin,
    };
  }

  return null;
}

/**
 * `content-length` against the envelope ceiling.
 *
 * A missing or unparseable header is allowed through: chunked encoding is
 * legitimate and refusing it would break clients that are behaving. This is a
 * cheap first line, not the guarantee — the field-level checks above run on the
 * parsed body regardless, and they are the ones that cannot be dodged.
 */
export function requestTooLarge(request: Request, limit = MAX_REQUEST_BYTES): boolean {
  const header = request.headers.get("content-length");
  if (header === null) return false;
  const declared = Number(header);
  return Number.isFinite(declared) && declared > limit;
}

/**
 * The synthetic result for a request that was refused before it ran.
 *
 * Shaped like any other `ExecutionResult` so no caller needs a second code
 * path, and marked `infrastructureError: true` for the reason spelled out on
 * that field: it is the flag meaning "this result is not evidence about the
 * learner", and a refused request is not. `runCases` reads exactly that flag to
 * decide it measured nothing — the alternative, `false`, would have it compare
 * an empty stdout against the expected output and record the learner as WRONG
 * for a program nobody ran.
 */
export function rejectedResult(
  rejection: PayloadRejection,
  providerId: string,
): ExecutionResult {
  return {
    status: "payload_too_large",
    stdout: "",
    /* Names the ceiling and the size, and carries no fragment of what was sent.
       An error string is a place learner text leaks into a log. */
    stderr: `${rejection.reason}: ${rejection.actualBytes} bytes exceeds the ${rejection.limitBytes} byte limit`,
    exitCode: null,
    timeMs: 0,
    memoryKb: null,
    infrastructureError: true,
    providerId,
  };
}

/**
 * A provider that refuses oversized work instead of forwarding it.
 *
 * Wrapped around the provider rather than checked in each route, for the same
 * reason the counting decorator is: a route is a place to forget, and the next
 * caller of `getExecutionProvider` would arrive unguarded. The routes check too
 * — earlier, and with a 413 the learner can act on — so this is the backstop
 * that makes "a crafted request never reaches the judge" a property of the
 * system rather than a property of everyone remembering.
 *
 * It must sit OUTSIDE the counting decorator — `sizeGuarded(counted(p))`, not
 * the other way round — so a refusal never reaches the counters at all. Wrapped
 * the wrong way it would bump `exec.requests` for an execution that did not
 * happen and then `exec.infra_failures` for an outage that does not exist,
 * which is a pager going off because a learner pasted a large file. It gets its
 * own counter instead: `exec.payload_rejected` answers "is anybody hitting the
 * ceiling", which is the only question this event raises.
 */
export function sizeGuarded(provider: CodeExecutionProvider): CodeExecutionProvider {
  const guard = (request: ExecutionRequest): ExecutionResult | null => {
    const rejection = checkPayloadSize({
      sourceCode: request.sourceCode,
      stdin: request.stdin,
    });
    if (!rejection) return null;
    bump("exec.payload_rejected");
    opsLog("exec.payload_rejected", {
      reason: rejection.reason,
      bytes: rejection.actualBytes,
      limit: rejection.limitBytes,
      provider: provider.id,
    });
    return rejectedResult(rejection, provider.id);
  };

  const batch = provider.runBatch?.bind(provider);

  return {
    id: provider.id,
    describe: provider.describe,
    /* Forwarded, never re-decided. A decorator that dropped this would make a
       metered judge look free to the Run route. */
    metered: provider.metered,
    async run(request: ExecutionRequest): Promise<ExecutionResult> {
      return guard(request) ?? provider.run(request);
    },

    /* The batch path is guarded too, and it has to be — otherwise a provider
       that implements `runBatch` would have found the one route to the judge
       with no ceiling on it, and "a crafted request never reaches the judge"
       would go back to being a property of everyone remembering.
       Forwarded only when the wrapped provider has it, so a decorated Piston
       still honestly reports that it cannot batch.
       If ANY request in the batch is oversized the WHOLE batch is refused —
       every index gets the refusal, including the ones that would have fitted.
       Two reasons. A caller stops at the first refusal regardless (`runCases`
       reads `infrastructureError` and reports nothing measured), so running the
       rest spends a metered judge's requests on results nobody reads. And in
       practice the cases of one submission share a source: the limit that fires
       is the source limit, which fires for all of them or for none.
       The loop stops at the first offender rather than mapping over all of
       them, so one oversized submission is one `exec.payload_rejected`, exactly
       as it is on the sequential path. */
    ...(batch
      ? {
          async runBatch(requests: readonly ExecutionRequest[]): Promise<ExecutionResult[]> {
            for (const request of requests) {
              const refused = guard(request);
              if (refused) return requests.map(() => refused);
            }
            return batch(requests);
          },
        }
      : {}),
  };
}
