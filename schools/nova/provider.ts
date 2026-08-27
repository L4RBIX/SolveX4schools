import "server-only";

/**
 * The model provider port.
 *
 * Nova's pedagogy is provider-independent by construction. Everything that
 * decides *what Nova may do* — the action, whether a misconception may be
 * named, the hint ceiling, whether code is allowed — is computed by the
 * Decision Engine and `grantHintLevel` before a provider is ever called. A
 * provider receives a finished instruction and produces language.
 *
 * That ordering is the whole design. An LLM asked to decide whether it is
 * allowed to give away the answer will, eventually, decide yes.
 */

export interface NovaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** What the call actually consumed, when the provider says. */
export interface NovaUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface NovaCompletionRequest {
  messages: NovaMessage[];
  /** Hard ceiling. A runaway response costs money and blocks the UI. */
  maxTokens: number;
  temperature: number;
  signal?: AbortSignal;
  /**
   * Reported once, at the end, if the provider reports at all.
   *
   * A callback rather than the generator's return value because the stream is
   * consumed through `guardedStream`, and `for await` discards a generator's
   * return. Threading it through the iteration protocol would mean every layer
   * between here and the route learning about token accounting to pass it
   * along; a callback keeps that knowledge at the two ends that need it.
   *
   * Never called when the provider is silent about usage. The month row then
   * under-counts honestly rather than accumulating an estimate that looks like
   * a measurement.
   */
  onUsage?: (usage: NovaUsage) => void;
}

export interface NovaModelProvider {
  readonly id: string;
  /** What the provider actually is. Never a guess, never a marketing name. */
  readonly model: string;
  /**
   * True when this provider cannot actually produce an explanation.
   *
   * It travels to the client so the panel can SAY so, rather than leaving a
   * learner to work out from the prose that the assistant is not really there.
   * The pedagogy above the provider — the ladder, the caps, the decision — is
   * unaffected and still runs; only the language is missing.
   */
  readonly degraded: boolean;
  /** Streams text chunks. The route turns them into SSE. */
  stream(request: NovaCompletionRequest): AsyncIterable<string>;
}

export class NovaProviderError extends Error {
  constructor(
    message: string,
    readonly kind: "auth" | "rate_limit" | "timeout" | "upstream" | "unknown",
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "NovaProviderError";
  }
}
