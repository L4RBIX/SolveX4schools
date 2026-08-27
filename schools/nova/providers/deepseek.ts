import "server-only";
import { config } from "@schools/config";
import {
  NovaProviderError,
  type NovaCompletionRequest,
  type NovaModelProvider,
} from "../provider";

/**
 * DeepSeek.
 *
 * SERVER ONLY, enforced three ways: `server-only` at the top of this file, the
 * key read exclusively through `schools/config` (which never uses a
 * `NEXT_PUBLIC_` name), and the fact that nothing in `src/components` imports
 * this module. A `NEXT_PUBLIC_` prefix added to "make it work" would inline the
 * key into every browser bundle permanently.
 */
export class DeepSeekProvider implements NovaModelProvider {
  readonly id = "deepseek";
  readonly model: string;
  readonly degraded = false;

  constructor(private apiKey: string, model = config.nova.model) {
    this.model = model;
  }

  async *stream(request: NovaCompletionRequest): AsyncIterable<string> {
    let res: Response;
    try {
      res = await fetch(`${config.nova.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages,
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          stream: true,
          /* Ask for the usage frame. Without this DeepSeek streams text and
             says nothing about cost, and the monthly ceiling in
             `schools/nova/budget.ts` has nothing to count. */
          stream_options: { include_usage: true },
          /* Thinking is ON by default on V4 at `high` effort, and reasoning
             tokens bill as output. For a reply capped at six sentences whose
             shape the hint ladder already decided, that is most of the cost
             and most of the latency spent on a chain of thought nobody reads.
             Overridable, because the pro tier may be worth it later. */
          ...(config.nova.thinking ? {} : { thinking: { type: "disabled" } }),
        }),
        signal: request.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new NovaProviderError("cancelled", "timeout", false);
      }
      throw new NovaProviderError("network failure reaching the provider", "upstream", true);
    }

    if (!res.ok) {
      // The status is mapped rather than echoed: an upstream body can contain
      // the key, the prompt, or another tenant's error text.
      if (res.status === 401 || res.status === 403) {
        throw new NovaProviderError("provider rejected the credential", "auth", false);
      }
      if (res.status === 429) {
        throw new NovaProviderError("provider rate limit", "rate_limit", true);
      }
      throw new NovaProviderError(`provider returned ${res.status}`, "upstream", res.status >= 500);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new NovaProviderError("provider returned no body", "upstream", true);

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line and may split mid-chunk.
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const line = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data) as {
            choices?: { delta?: { content?: string } }[];
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          };
          /* The usage frame arrives last and carries an empty `choices`, so it
             is read before the text branch rather than instead of it. */
          if (parsed.usage) {
            request.onUsage?.({
              inputTokens: parsed.usage.prompt_tokens ?? 0,
              outputTokens: parsed.usage.completion_tokens ?? 0,
            });
          }
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {
          /* A partial frame; the next read completes it. */
        }
      }
    }
  }
}
