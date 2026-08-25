/**
 * Nova policy: where a decision becomes a constraint on what the assistant may do.
 *
 * Depends on `@solvex/learning-intelligence-core` for the `NovaDirective` type
 * and on nothing else. In particular it does NOT depend on an LLM provider —
 * `grantHintLevel` is a pure function of (request, history, directive), and the
 * provider only ever receives its output.
 *
 * See `../../../NOVA_PROVIDER.md` for the provider seam and the reference
 * Python enforcement that must sit on the server side of it.
 */

export {
  grantHintLevel,
  hasAttemptSince,
  novaIndicator,
  NOVA_RUNTIME_VERSION,
  MIN_HINT_LEVEL,
  MAX_HINT_LEVEL,
} from "./novaRuntime";

export type {
  GrantInput,
  GrantDecision,
  GrantReason,
  NovaIndicator,
  IndicatorTone,
} from "./novaRuntime";
