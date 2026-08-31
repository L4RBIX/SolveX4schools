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
  readonly degraded = true;

  async *stream(request: NovaCompletionRequest): AsyncIterable<string> {
    const last = [...request.messages].reverse().find((m) => m.role === "user");
    const system = request.messages.find((m) => m.role === "system")?.content ?? "";

    /* The directive's opening line is English — it comes from the core, which
       is not ours to fork. A real model is instructed to answer in the
       learner's language and does; the echo provider has no model, so rather
       than leak that English into a Kazakh classroom it says, in the right
       language, that it is not a model.

       Language is read from the prompt the route already built, so this stays
       a single source of truth.

       It reads the FALLBACK language rather than the learner's, and that is the
       best this provider can do: a real model is now told to answer in whatever
       language the learner wrote in, and detecting that is exactly the thing a
       string generator with no model cannot do. So the offline sentence comes
       out in the language the school configured, which is right far more often
       than a coin flip. */
    const kk = /use Kazakh \(қазақша\)/.test(system);

    /* One sentence, and it is a question the learner can act on.
       This text is read by a fourteen-year-old, not by whoever forgot the
       credential: the earlier version echoed their own question back and then
       explained which subsystem was missing, which reads as a broken product.
       The panel says the assistant is offline in its own banner; here Nova just
       does the one thing it can still do without a model — ask. */
    const parts = kk
      ? [
          last?.content
            ? "Осы тапсырманы бірге қарайық. Не жасап көрдің және не күткен едің?"
            : "Не жасап көрдің және не күткен едің?",
        ]
      : [
          last?.content
            ? "Давай разберём вместе. Что ты уже попробовал и какого результата ждал?"
            : "Что ты уже попробовал и какого результата ждал?",
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
