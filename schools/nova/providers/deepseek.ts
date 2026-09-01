import "server-only";
import { config } from "@schools/config";
import {
  NovaProviderError,
  type NovaCompletionRequest,
  type NovaFinishReason,
  type NovaModelProvider,
} from "../provider";

/**
 * The provider's word for why it stopped, mapped to ours.
 *
 * Only `stop` means the model finished. Everything else is a response that
 * ended for a reason the learner did not choose, and the two that matter here
 * are named rather than lumped together: `length` is our own ceiling and is
 * ours to fix, `content_filter` is the provider's and is not.
 *
 * An unrecognised string maps to `unknown` rather than to `stop`. A future
 * `tool_calls` or a renamed reason must not be able to certify a fragment as
 * complete by being new.
 */
function mapFinishReason(raw: string): NovaFinishReason {
  switch (raw) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "content_filter":
      return "content_filter";
    default:
      return "unknown";
  }
}

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

    /*
     * Why the stream ended, and whether the protocol ended with it.
     *
     * Both are tracked because they answer different questions and can
     * disagree. `finish` is the model's own account; `sawDone` is the
     * transport's. A socket that dies mid-answer produces neither, and that
     * silence is itself the finding — it is reported as `incomplete` rather
     * than left to look like a clean end, which is exactly what it looked like
     * before.
     */
    let finish: NovaFinishReason | null = null;
    let sawDone = false;

    try {
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
          if (data === "[DONE]") {
            /* Noted, not returned on. Returning here is what used to skip the
               reporting below entirely — and `[DONE]` is sent after a
               `max_tokens` cut-off exactly as it is after a natural ending, so
               the one frame that proves the transport was fine was also the
               one that threw away the reason. */
            sawDone = true;
            continue;
          }
          try {
            const parsed = JSON.parse(data) as {
              choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
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
            /* Measured against the live API: this arrives on a final frame
               whose `delta.content` is the empty string, so it has to be read
               on its own and not inside the text branch below — which is the
               shape of the original defect. `null` on every frame before it. */
            const reported = parsed.choices?.[0]?.finish_reason;
            if (typeof reported === "string" && reported) finish = mapFinishReason(reported);

            const text = parsed.choices?.[0]?.delta?.content;
            if (text) yield text;
          } catch {
            /* A partial frame; the next read completes it. */
          }
        }
      }
    } catch (err) {
      /*
       * An abort DURING the stream, which used to escape this module untyped.
       *
       * The try/catch above covers `fetch` only, and a timeout or a closed
       * panel fires far more often after the response headers than before
       * them: `reader.read()` then rejects with a `DOMException` named
       * `AbortError`, which is not a `NovaProviderError`, so the route's
       * `err instanceof NovaProviderError` test failed and the learner was
       * told `kind: "unknown"` — "причина неизвестна" — for the one failure the
       * panel has exact copy for. Mapped here to the same error the pre-headers
       * abort produces, so the two halves of one timeout are told as one thing.
       */
      if (err instanceof Error && err.name === "AbortError") {
        throw new NovaProviderError("cancelled", "timeout", false);
      }
      throw new NovaProviderError("provider stream failed mid-response", "upstream", true);
    }

    /*
     * The verdict, once, on every non-throwing path.
     *
     * A stream that ended without the model ever saying why is `incomplete` —
     * the body was cut off. A clean `[DONE]` with no reason attached is
     * `unknown`: the transport finished, the model did not say, and neither
     * completion nor truncation may be claimed on its behalf.
     */
    request.onFinish?.(finish ?? (sawDone ? "unknown" : "incomplete"));
  }
}
