import "server-only";
import { config } from "@schools/config";
import type { NovaModelProvider } from "./provider";
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
      return new EchoProvider();
    }
    const { DeepSeekProvider } = await import("./providers/deepseek");
    return new DeepSeekProvider(config.nova.apiKey);
  }
  return new EchoProvider();
}

export type { NovaModelProvider, NovaMessage, NovaCompletionRequest } from "./provider";
export { NovaProviderError } from "./provider";
