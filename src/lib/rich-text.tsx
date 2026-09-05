import type { ReactNode } from "react";

/**
 * The inline markup learner-facing prose is written in: `code`, **bold**, and
 * fenced sample blocks.
 *
 * ## Why this exists at all
 *
 * The curriculum is authored as plain strings, and those strings have always
 * carried marks. Backticks name a construct — `int main()`, `cout`,
 * `#include <iostream>`. A pair of asterisks marks the phrase a paragraph turns
 * on: «**Қате жауап.**», «**Кіріс.**», «**Базовый случай**». And every contest
 * statement in May shows its sample input the way a judge does, in a fenced
 * block.
 *
 * Only the first mark was ever rendered, and only in two containers. Everywhere
 * else the marks reached the screen as characters, so a fourteen-year-old read
 * `**Қате жауап.**` — asterisks and all — in the sentence that was supposed to
 * be the one that stood out, and met the May assessment's sample input under a
 * line of three backticks. That is the defect this module closes, and it closes
 * it in one place so the next container that shows prose cannot reopen it by
 * forgetting to parse.
 *
 * ## The grammar, and why it is this small
 *
 * Three productions, only one of which may cross a line:
 *
 *   fence  ```⏎…⏎```   a sample block; anything but a backtick inside
 *   code   `…`         one or more characters, no backtick, no newline
 *   bold   **…**       one or more characters, no asterisk, no newline
 *
 * It is deliberately not Markdown. The corpus this runs over contains ASCII
 * pictures made of asterisks — `m2.l7` asks for a triangle and prints
 * «*», «**», «***» inside the prompt — and it uses `*` as the multiplication
 * operator in running prose (`6 * 7`, `n * (n + 1) / 2`). A general emphasis
 * parser turns both of those into markup. Forbidding `*` inside a bold span and
 * forbidding a newline inside either inline span is what makes the triangle
 * survive: every asterisk in a run of asterisks is followed by an asterisk or a
 * newline, so no run can ever open a span.
 *
 * Single-asterisk italics are not supported for the same reason, and there is
 * no content that wants them: one Kazakh sentence used `*стек*` where its
 * Russian twin used none, and that was fixed in the content rather than paid
 * for with a parser that eats multiplication signs.
 *
 * ## Code binds tighter than bold
 *
 * A single left-to-right scan, fence first and code before bold, which is
 * CommonMark's precedence and the one the content depends on: `m3.l1.b6` says
 * the program must print the string `` `****` ``, and only code-wins keeps
 * those four asterisks as four asterisks. Bold may contain code — the September
 * frame walkthrough is written as **`#include <iostream>`** — so a bold span's
 * inner text is parsed again.
 */
const MARKUP = /```\n[^`]*\n```|`[^`\n]+`|\*\*[^*\n]+\*\*/g;

/** The pill a named construct is shown in. One definition, every container. */
function codeSpan(key: number, text: string) {
  return (
    <code
      key={key}
      className="rounded-[4px] bg-b-fg/10 px-1.5 py-0.5 font-b-mono text-[15px] text-b-green-2"
    >
      {text}
    </code>
  );
}

/**
 * A sample block: the input a contest statement hands the program, or the lines
 * it must print back.
 *
 * A `<span>` rather than a `<pre>` because half its callers are inside a `<p>`
 * — a prompt, a lesson paragraph — and a `<pre>` there is invalid markup that
 * browsers repair by splitting the paragraph. `display: block` gets the same
 * result from phrasing content, so one node works in every container.
 *
 * `whitespace-pre` and its own scroller: this is a grid of dots and hashes or a
 * row of numbers, and a wrapped line of it is a different picture.
 */
function fenceBlock(key: number, text: string) {
  return (
    <span
      key={key}
      className="my-1 block w-full overflow-x-auto rounded-[8px] border-2 border-b-fg/10 bg-b-fg/[0.04] px-3 py-2 font-b-mono text-[14px] leading-6 whitespace-pre text-b-fg/85"
    >
      {text}
    </span>
  );
}

/**
 * Parse prose into nodes.
 *
 * Returns an array so a caller can drop it straight into any element — a `<p>`,
 * a `<span>`, a list item — without this module having an opinion about the
 * container. Text with no marks comes back as a single `<span>`, which keeps
 * the output shape uniform.
 */
export function richText(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  /* A fence is authored with a blank line around it. It renders as its own
     block, so under `whitespace-pre-wrap` those newlines would be counted
     twice — once as the block break, once as empty lines. Exactly one is
     absorbed on each side. */
  let eatLeadingNewline = false;

  const push = (raw: string) => {
    const s = eatLeadingNewline ? raw.replace(/^\n/, "") : raw;
    eatLeadingNewline = false;
    if (s) out.push(<span key={key++}>{s}</span>);
  };

  /* A fresh regex per call: `MARKUP` is global, and a shared `lastIndex` across
     re-entrant calls (bold parses its own inner text) would skip matches. */
  const scan = new RegExp(MARKUP.source, "g");

  for (const match of text.matchAll(scan)) {
    const at = match.index;
    const token = match[0];

    if (at > cursor) push(token.startsWith("```") ? text.slice(cursor, at).replace(/\n$/, "") : text.slice(cursor, at));

    if (token.startsWith("```")) {
      out.push(fenceBlock(key++, token.slice(4, -4)));
      eatLeadingNewline = true;
    } else if (token.startsWith("`")) {
      out.push(codeSpan(key++, token.slice(1, -1)));
    } else {
      out.push(
        <strong key={key++} className="font-bold">
          {richText(token.slice(2, -2))}
        </strong>,
      );
    }
    cursor = at + token.length;
  }

  if (cursor < text.length) push(text.slice(cursor));
  return out;
}

/**
 * A multi-paragraph body, split so a fence survives the split.
 *
 * `ConceptView` renders a body by cutting it on every newline and giving each
 * line its own paragraph — which is right for prose and destroys a fence, whose
 * lines ARE the content and whose delimiters are lines of their own. This hands
 * back the fences whole and the prose between them, in source order, so the
 * caller can paragraph the prose and leave the fences alone.
 *
 * A fence segment's `text` is the fenced source, delimiters included, so it
 * goes through `richText` like everything else rather than growing a second
 * renderer.
 */
export function proseSegments(text: string): { fence: boolean; text: string }[] {
  const out: { fence: boolean; text: string }[] = [];
  const scan = /```\n[^`]*\n```/g;
  let cursor = 0;
  for (const match of text.matchAll(scan)) {
    if (match.index > cursor) out.push({ fence: false, text: text.slice(cursor, match.index) });
    out.push({ fence: true, text: match[0] });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) out.push({ fence: false, text: text.slice(cursor) });
  return out;
}
