/**
 * Nova policy: where a decision becomes a constraint on what the assistant may do.
 *
 * Depends on `@solvex/learning-intelligence-core` for the `NovaDirective` type
 * and on nothing else. In particular it does NOT depend on an LLM provider —
 * `grantHintLevel` is a pure function of (request, history, directive), and the
 * provider only ever receives its output.
 *
 * See `../../../NOVA_PROVIDER.md` for the provider seam and, in `../python/`,
 * the reference enforcement that must sit on the server side of it. That file
 * is written in Python and is about the DIRECTIVE, not about any language a
 * learner is taught — it survived the move to C++17 untouched because there
 * was nothing in it to move.
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
