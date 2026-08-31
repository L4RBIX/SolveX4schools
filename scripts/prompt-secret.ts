import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { stdin, stdout } from "node:process";

/**
 * Ask for a credential without putting it on the screen.
 *
 * ## Why this file exists
 *
 * `publish-curriculum.ts` reads the reviewer's password from the terminal
 * rather than from a flag, and says why in its own header: "a credential in
 * `--password` is a credential in the shell history and in `ps`". That is
 * right, and it was then handed to `readline.question()`, which echoes — so the
 * password went into the terminal scrollback instead. The threat model was
 * correct and the implementation delivered the same class of leak by a
 * different route.
 *
 * ## How the muting works, and why it looks like this
 *
 * Node's readline writes every keystroke back to the terminal through the
 * internal `_writeToOutput` hook. There is no public API for a password prompt,
 * and this hook is the way it has always been done. The prompt itself is
 * written directly to stdout first, so the operator can still see what is being
 * asked; everything after that is swallowed.
 *
 * `terminal: false` would also stop the echo, but it stops line editing too —
 * no backspace — which for a typed credential is worse than useless.
 *
 * When stdin is not a TTY (a pipe, CI, a test) there is nothing to echo and
 * nothing to mute; the same code path works and simply has no keystrokes to
 * swallow.
 */
export async function promptSecret(question: string): Promise<string> {
  stdout.write(question);

  /*
   * readline writes to `output`, so the surest way to keep a credential off the
   * screen is to hand it an output that goes nowhere.
   *
   * Overriding the internal `_writeToOutput` hook — the usual recipe — was
   * tried first and does NOT hold here: with `terminal: true` readline also
   * redraws the line through cursor escapes, and the password came back
   * anyway, wrapped in `\x1b[1G\x1b[0J`. Discarding the stream is the only
   * version that is true for every write readline decides to make, including
   * the ones added by a future Node.
   *
   * The cost is no visual line editing — no cursor movement on screen — which
   * for a field that must render nothing is not a cost.
   */
  const discard = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });

  const rl = createInterface({ input: stdin, output: discard, terminal: true });
  try {
    return await rl.question("");
  } finally {
    rl.close();
    /* The newline the suppressed echo would have produced, so whatever prints
       next does not land on the prompt line. */
    stdout.write("\n");
  }
}
