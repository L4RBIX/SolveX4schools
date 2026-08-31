import "server-only";
import { config } from "@schools/config";
import { bump, opsLog } from "@schools/ops/counters";
import type { NovaCompletionRequest, NovaModelProvider } from "./provider";
import { EchoProvider } from "./providers/echo";

/**
 * Provider selection.
 *
 * `echo` unless explicitly configured otherwise, so a missing credential is a
 * degraded assistant rather than a broken lesson. The DeepSeek module is
 * imported lazily so its `server-only` guard never runs in a context that does
 * not need it.
 */
export async function getNovaProvider(): Promise<NovaModelProvider> {
  if (config.nova.provider === "deepseek") {
    if (!config.nova.apiKey) {
      // Falling back rather than throwing: a fourteen-year-old asking for help
      // should not meet a stack trace because someone forgot an env var.
      console.error("[nova] NOVA_PROVIDER=deepseek but DEEPSEEK_API_KEY is unset; using echo");
      // Counted too. A deployment silently running on echo is exactly the state
      // somebody needs the request count for.
      return counted(new EchoProvider());
    }
    const { DeepSeekProvider } = await import("./providers/deepseek");
    return counted(new DeepSeekProvider(config.nova.apiKey));
  }
  return counted(new EchoProvider());
}

/**
 * The one place Nova calls are counted.
 *
 * Same reasoning as the execution decorator: wrapping the factory's return
 * value is the only edit a new call site cannot bypass, and a `bump()` inside
 * each provider would be forgotten by the third one.
 *
 * ## Why the count is here and not in the ledger
 *
 * The ledger already records `assistance_requested` and `assistance_delivered`,
 * and their difference is the durable answer to "how many hints produced
 * nothing" — `schools/ops/observability.ts` reports exactly that. What it
 * cannot tell you is WHY: a learner closing the panel and a provider throwing
 * look identical from the outside. `nova.failures` is the difference, it costs
 * one integer, and it resets on deploy, which is stated wherever it is read.
 *
 * A cancelled stream is not a failure. `AbortError` is what an aborted fetch
 * and a closed panel both produce, and charging the provider for a learner
 * changing their mind would make the number useless.
 */
function counted(provider: NovaModelProvider): NovaModelProvider {
  return {
    id: provider.id,
    model: provider.model,
    degraded: provider.degraded,
    async *stream(request: NovaCompletionRequest): AsyncIterable<string> {
      bump("nova.requests");
      try {
        yield* provider.stream(request);
      } catch (err) {
        const kind =
          err instanceof Error && err.name === "AbortError"
            ? "cancelled"
            : (err as { kind?: string }).kind ?? "unknown";
        if (kind !== "cancelled" && kind !== "timeout") {
          bump("nova.failures");
          // The failure KIND, never the prompt, the learner's words or the key.
          opsLog("nova.failure", { provider: provider.id, kind: String(kind) });
        }
        throw err;
      }
    },
  };
}

export type { NovaModelProvider, NovaMessage, NovaCompletionRequest } from "./provider";
export { NovaProviderError } from "./provider";
