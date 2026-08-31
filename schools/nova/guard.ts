import { validateOutput, type ValidationContext, type Violation } from "./validate";

/**
 * Validation that runs DURING the stream, not after it.
 *
 * The failure this exists to prevent is the one the spec names directly: the
 * system prompt says never give full code, the model gives full code, the UI
 * renders it, and a validator afterwards reports a violation to a log nobody is
 * reading while the learner copies the answer. Checking the finished response
 * is not a control. It is a metric.
 *
 * So nothing is released until the buffer containing it has passed, and a
 * trailing window is held back on top of that:
 *
 *   ┌──────────── buffer ────────────┐
 *   │ validated and released         │ held back │
 *   └────────────────────────────────┴───────────┘
 *
 * The hold-back is what makes split markers safe. `sk-abc` arriving in one
 * chunk and the rest of the key in the next would otherwise be released before
 * the pattern could match it, and half a credential is still a credential. The
 * window is sized to the longest thing the validator looks for, so no marker
 * can straddle the edge.
 *
 * ## The invariant
 *
 * Text is released only while the ENTIRE buffer is clean. So whatever a learner
 * has seen was, at the moment they saw it, within the code budget, free of
 * secrets, and free of an unsupported diagnosis. A later chunk can turn the
 * response into a violation — the third code line when two were allowed — but
 * it cannot retroactively make the released prefix illegal, because the prefix
 * was itself checked as a whole response.
 *
 * That is a weaker guarantee than "nothing bad is ever emitted", and it is the
 * strongest one available without abandoning streaming entirely. It is stated
 * here rather than in a claim that the output is verified.
 */

/** Big enough that no pattern the validator scans for can straddle the edge. */
const BASE_HOLD_BACK = 160;

export interface GuardOutcome {
  /** Everything the learner actually saw. */
  readonly released: string;
  /** Why the stream stopped early, if it did. Empty on a clean completion. */
  readonly violations: readonly Violation[];
  /** True when generation was cut short rather than finishing naturally. */
  readonly truncated: boolean;
}

function holdBackFor(ctx: ValidationContext): number {
  const longestLiteral = (ctx.forbiddenLiterals ?? []).reduce(
    (max, l) => Math.max(max, l.length),
    0,
  );
  return Math.max(BASE_HOLD_BACK, longestLiteral + 16);
}

/**
 * Prefer to break at a word boundary.
 *
 * Cosmetic, and worth the four lines: releasing mid-word makes the panel look
 * like it is malfunctioning, and a learner who thinks the tutor is broken stops
 * reading it. Falls back to the raw index when there is no boundary to find.
 */
function snap(text: string, limit: number): number {
  if (limit <= 0) return 0;
  const window = text.slice(0, limit);
  const cut = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(" "));
  return cut > limit - 80 ? cut + 1 : limit;
}

/**
 * Wrap a provider stream in the validator.
 *
 * Yields only text that has passed. On a violation it stops yielding, calls
 * `onViolation` so the caller can abort the upstream request rather than keep
 * paying for tokens nobody will see, and drains no further.
 */
export async function* guardedStream(
  source: AsyncIterable<string>,
  ctx: ValidationContext,
  onViolation?: (violations: readonly Violation[]) => void,
): AsyncGenerator<string, GuardOutcome, undefined> {
  const hold = holdBackFor(ctx);
  let buffer = "";
  let releasedTo = 0;
  let violations: readonly Violation[] = [];

  for await (const chunk of source) {
    buffer += chunk;

    const found = validateOutput(buffer, ctx);
    if (found.length > 0) {
      violations = found;
      onViolation?.(found);
      return { released: buffer.slice(0, releasedTo), violations, truncated: true };
    }

    const target = snap(buffer, buffer.length - hold);
    if (target > releasedTo) {
      yield buffer.slice(releasedTo, target);
      releasedTo = target;
    }
  }

  /* The tail. Held back until the response was complete, so this is the first
     moment the whole thing could be judged as a whole thing. */
  const finalCheck = validateOutput(buffer, ctx);
  if (finalCheck.length > 0) {
    onViolation?.(finalCheck);
    return { released: buffer.slice(0, releasedTo), violations: finalCheck, truncated: true };
  }

  if (buffer.length > releasedTo) {
    yield buffer.slice(releasedTo);
    releasedTo = buffer.length;
  }

  return { released: buffer, violations: [], truncated: false };
}
