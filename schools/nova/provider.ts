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

export interface NovaCompletionRequest {
  messages: NovaMessage[];
  /** Hard ceiling. A runaway response costs money and blocks the UI. */
  maxTokens: number;
  temperature: number;
  signal?: AbortSignal;
}

export interface NovaModelProvider {
  readonly id: string;
  /** What the provider actually is. Never a guess, never a marketing name. */
  readonly model: string;
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
