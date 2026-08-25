import "server-only";
import type { NovaCompletionRequest, NovaModelProvider } from "../provider";

/**
 * The offline provider, and the default.
 *
 * It exists so the product runs, and is testable, with no credentials and no
 * network. That matters more than it sounds: the pedagogy — the ladder, the
 * caps, the refusal to name a misconception without evidence — is all upstream
 * of the model, so every one of those rules can be exercised end to end
 * against this.
 *
 * It composes a reply from the instruction it was given rather than inventing
 * one, which makes it useful in development: if the reply says something the
 * directive did not permit, the bug is in the prompt, not the model.
 */
export class EchoProvider implements NovaModelProvider {
  readonly id = "echo";
  readonly model = "echo-local";

  async *stream(request: NovaCompletionRequest): AsyncIterable<string> {
    const last = [...request.messages].reverse().find((m) => m.role === "user");
    const system = request.messages.find((m) => m.role === "system")?.content ?? "";

    const openingMatch = system.match(/OPENING LINE:\s*(.+)/);
    const opening = openingMatch?.[1]?.trim();

    const parts = [
      opening ?? "Let's look at this together.",
      "",
      last?.content
        ? `You asked: ${last.content.slice(0, 200)}`
        : "Tell me what you tried.",
      "",
      "(Nova is running without a language model configured, so this reply is " +
        "assembled from the teaching instruction rather than generated. The " +
        "instruction itself — what level of help is allowed here and why — is " +
        "real.)",
    ];

    // Chunked by slicing rather than by regex: the dotAll flag needs a newer
    // target than tsconfig sets, and the point here is only to stream.
    const text = parts.join("\n");
    for (let i = 0; i < text.length; i += 24) {
      await new Promise((r) => setTimeout(r, 15));
      yield text.slice(i, i + 24);
    }
  }
}
