import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { proseSegments, richText } from "../../src/lib/rich-text";
import {
  BlockPrompt,
  LessonParagraph,
  OptionList,
  WorkedExampleStep,
} from "../../src/components/brilliant/lesson/blocks/primitives";
import { MONTHS } from "../../schools/curriculum/months";
import { readFileSync } from "node:fs";
import type { Locale } from "../../schools/curriculum/types";

/**
 * The marks in learner-facing prose must become formatting, in every container
 * that shows prose.
 *
 * This exists because they did not. `LessonParagraph` parsed backticks and
 * nothing else parsed anything, so a fourteen-year-old read
 * `` `cout << "Сәлем!";` `` with its backticks and «**Қате жауап.**» with its
 * asterisks — the emphasis mark showing up as punctuation in the one sentence
 * it was there to emphasise.
 *
 * The corpus is the other half of the test. It contains ASCII pictures built
 * from asterisks and uses `*` as the multiplication sign in running prose, and
 * a parser that eats either of those is worse than the bug it fixes.
 */

/** React elements are plain objects; no DOM is needed to see what was built. */
function shape(nodes: ReactNode[]) {
  return (nodes as ReactElement<{ children?: string }>[]).map((n) => ({
    tag: n.type as string,
    text: n.props.children ?? "",
  }));
}

/** Everything the parser decided was plain text, reassembled. */
function plain(nodes: ReactNode[]): string {
  return (nodes as ReactElement<{ children?: ReactNode }>[])
    .map((n) => {
      const kids = n.props.children;
      if (typeof kids === "string") return n.type === "span" ? kids : "";
      return plain((Array.isArray(kids) ? kids : [kids]) as ReactNode[]);
    })
    .join("");
}

/** Every character the reader ends up seeing, marks removed. */
function visible(nodes: ReactNode[]): string {
  return (nodes as ReactElement<{ children?: ReactNode }>[])
    .map((n) => {
      const kids = n.props.children;
      if (typeof kids === "string") return kids;
      return visible((Array.isArray(kids) ? kids : [kids]) as ReactNode[]);
    })
    .join("");
}

describe("richText", () => {
  it("promotes a backticked span to <code> and strips the backticks", () => {
    expect(shape(richText("Пишем `int main()` и всё"))).toEqual([
      { tag: "span", text: "Пишем " },
      { tag: "code", text: "int main()" },
      { tag: "span", text: " и всё" },
    ]);
  });

  it("promotes a **starred** span to <strong> and strips the stars", () => {
    const out = richText("1. **Қате жауап.** Бағдарлама істеді");
    expect(shape(out).map((n) => n.tag)).toEqual(["span", "strong", "span"]);
    expect(visible(out)).toBe("1. Қате жауап. Бағдарлама істеді");
    expect(renderToStaticMarkup(createElement("p", null, out))).toContain("<strong");
  });

  it("lets bold contain code, which is how the September frame is written", () => {
    /* «**`#include <iostream>`** — подключает…»: the whole construct is the
       emphasised phrase, and it is also a construct. */
    const out = richText("**`#include <iostream>`** — подключает");
    const html = renderToStaticMarkup(createElement("p", null, out));
    expect(html).toContain("<strong");
    expect(html).toContain("<code");
    expect(html).not.toContain("`");
    expect(html).not.toContain("**");
    expect(visible(out)).toBe("#include <iostream> — подключает");
  });

  it("keeps C++ operators intact, angle brackets and all", () => {
    /* `<<` and `<iostream>` are the two things September cannot say without,
       and both are exactly what a naive HTML path would eat. */
    for (const src of ["cout << 7 * 8;", "#include <iostream>", 'cout << "Сәлем!" << endl;']) {
      const [, code] = shape(richText(`Вот \`${src}\` вот`));
      expect(code).toEqual({ tag: "code", text: src });
    }
  });

  it("leaves text with no marks completely alone", () => {
    expect(shape(richText("обычное предложение"))).toEqual([
      { tag: "span", text: "обычное предложение" },
    ]);
  });

  it("renders a fenced sample as one block, delimiters gone", () => {
    const out = richText("Пример.\n\n```\n4\n3 4 5 10\n```\n\nОтвет: 2");
    expect(visible(out)).toBe("Пример.\n4\n3 4 5 10\nОтвет: 2");
    const html = renderToStaticMarkup(createElement("p", null, out));
    expect(html).not.toContain("`");
    expect(html).toContain("whitespace-pre");
  });

  it("keeps a fence's own lines and spacing exactly", () => {
    const grid = ".#..\n.#.#\n..##\n#.##";
    const [, block] = shape(richText(`Карта:\n\n\`\`\`\n${grid}\n\`\`\`\n\nДальше`));
    expect(block).toEqual({ tag: "span", text: grid });
  });

  it("does not treat an empty pair as code or as bold", () => {
    expect(shape(richText("a `` b")).every((n) => n.tag === "span")).toBe(true);
    expect(shape(richText("a **** b")).every((n) => n.tag === "span")).toBe(true);
  });
});

/**
 * The parser runs over prose that is FULL of asterisks meaning something else.
 * These are the two shapes it must never touch.
 */
describe("asterisks that are not markup", () => {
  it("leaves an ASCII triangle exactly as authored", () => {
    for (const art of [
      "*\n**\n***",
      "  *\n ***\n*****",
      "*\n**\n***\n****\n*****\n******",
      "    *\n   ***\n  *****\n *******\n*********",
    ]) {
      const out = richText(`n = 3 болғанда былай шығады:\n${art}`);
      expect(shape(out).every((n) => n.tag === "span"), art).toBe(true);
      expect(visible(out)).toBe(`n = 3 болғанда былай шығады:\n${art}`);
    }
  });

  it("leaves the multiplication sign alone, twice in one line", () => {
    const src = "Формула — n * (n + 1) / 2, ал ауданы a * b.";
    expect(shape(richText(src))).toEqual([{ tag: "span", text: src }]);
  });

  it("lets code win over bold, so a backticked run of stars survives", () => {
    /* `m3.l1.b6`: "Программа должна вывести строку `****` ровно два раза." */
    const out = richText("вывести строку `****` ровно два раза");
    expect(shape(out)).toEqual([
      { tag: "span", text: "вывести строку " },
      { tag: "code", text: "****" },
      { tag: "span", text: " ровно два раза" },
    ]);
  });

  it("never opens a span across a line break", () => {
    expect(shape(richText("**\nтекст\n**")).every((n) => n.tag === "span")).toBe(true);
    expect(shape(richText("`\nтекст\n`")).every((n) => n.tag === "span")).toBe(true);
  });
});

describe("proseSegments", () => {
  it("hands back the fences whole and the prose between them", () => {
    expect(proseSegments("A\n\n```\nx\ny\n```\n\nB")).toEqual([
      { fence: false, text: "A\n\n" },
      { fence: true, text: "```\nx\ny\n```" },
      { fence: false, text: "\n\nB" },
    ]);
  });

  it("returns unfenced prose as one segment", () => {
    expect(proseSegments("одна строка\nвторая")).toEqual([
      { fence: false, text: "одна строка\nвторая" },
    ]);
  });

  it("is what stops a concept body cutting a fence into paragraphs", () => {
    /* `m2.l5.b1` — the body that shows integer division next to the cast.
       Splitting on "\n" first gave four paragraphs of C++ under a paragraph
       that was three backticks. */
    const body = "Так:\n\n```\nint s = 13;\ncout << s / n;\n```\n\nВот.";
    const segs = proseSegments(body);
    expect(segs.filter((s) => s.fence)).toHaveLength(1);
    expect(segs.find((s) => s.fence)!.text.split("\n")).toHaveLength(4);
  });
});

/* -------------------------------------------------------------------------- */
/* The corpus                                                                 */
/* -------------------------------------------------------------------------- */

/** Every localized string a learner reads inside a lesson block, by field. */
function proseOfCorpus(): { id: string; field: string; locale: Locale; text: string }[] {
  const out: { id: string; field: string; locale: Locale; text: string }[] = [];
  const add = (id: string, field: string, l?: { kk: string; ru: string }) => {
    if (!l) return;
    out.push({ id, field, locale: "kk", text: l.kk }, { id, field, locale: "ru", text: l.ru });
  };
  const eat = (block: (typeof MONTHS)[number]["units"][number]["lessons"][number]["blocks"][number]) => {
    const any = block as unknown as Record<string, unknown>;
    add(block.id, "prompt", any.prompt as { kk: string; ru: string } | undefined);
    add(block.id, "body", any.body as { kk: string; ru: string } | undefined);
    add(block.id, "problem", any.problem as { kk: string; ru: string } | undefined);
    if (block.type === "worked_example") add(block.id, "result", block.result);
    for (const s of (any.steps ?? []) as { kk?: string; ru?: string }[])
      if (typeof s.kk === "string") add(block.id, "step", s as { kk: string; ru: string });
    for (const p of (any.expectedPoints ?? []) as { kk: string; ru: string }[])
      add(block.id, "point", p);
    if (block.type === "multiple_choice")
      for (const o of block.options) add(block.id, "option", o.label);
  };
  for (const month of MONTHS) {
    for (const unit of month.units) for (const lesson of unit.lessons) lesson.blocks.forEach(eat);
    /* The monthly assessment runs on the same block renderer, so its prose is
       the same prose. It lives beside `units`, not inside one, and a sweep that
       walks only the lessons believes a whole surface is clean. */
    month.assessment?.blocks.forEach(eat);
  }
  return out;
}

describe("the curriculum's own prose", () => {
  const corpus = proseOfCorpus();

  it("is big enough that the sweeps below mean something", () => {
    expect(corpus.length).toBeGreaterThan(2000);
  });

  it("still uses both marks, so the wiring stays load-bearing", () => {
    const count = (re: RegExp) =>
      corpus.reduce((n, e) => n + (e.text.match(re) ?? []).length, 0);
    const bold = corpus.filter((e) => /\*\*[^*\n]+\*\*/.test(e.text));
    expect(count(/\*\*[^*\n]+\*\*/g), "no lesson prose uses **bold** any more").toBeGreaterThan(100);
    expect(count(/`[^`\n]+`/g), "no lesson prose uses `code` any more").toBeGreaterThan(1000);
    expect(count(/```\n[^`]*\n```/g), "no lesson prose shows a fenced sample any more").toBeGreaterThan(50);
    /* The complaint that started this: the block whose body names the three
       ways a program can be wrong. */
    expect(bold.some((e) => e.id === "m1.l0.b3")).toBe(true);
  });

  it("shows no learner a literal mark, in either language", () => {
    const leaked: string[] = [];
    for (const entry of corpus) {
      const seen = visible(richText(entry.text));
      if (/\*\*[^*\n]+\*\*/.test(seen) || /`[^`\n]+`/.test(seen) || seen.includes("```"))
        leaked.push(`${entry.id}.${entry.field}.${entry.locale}`);
    }
    expect(leaked, "these render their own markup as characters").toEqual([]);
  });

  it("loses not one character of prose, only the marks", () => {
    for (const entry of corpus) {
      const stripped = entry.text
        .replace(/\n?```\n([^`]*)\n```\n?/g, "$1")
        .replace(/`([^`\n]+)`/g, "$1")
        .replace(/\*\*([^*\n]+)\*\*/g, "$1");
      /* Same again, because bold may wrap code and the two-pass strip above has
         to agree with the parser's nesting. */
      const twice = stripped.replace(/`([^`\n]+)`/g, "$1");
      const seen = visible(richText(entry.text));
      expect([stripped, twice], `${entry.id}.${entry.field}.${entry.locale}`).toContain(seen);
    }
  });

  it("uses no emphasis mark the parser does not read", () => {
    /* `*слово*` is the one shape an author reaches for that this deliberately
       does not support, because supporting it would swallow `6 * 7` and the
       asterisk triangles in `m2.l7`. One Kazakh sentence had it — `*стек*`,
       where its Russian twin had no mark at all — and it printed its own
       asterisks. The convention in this corpus is «guillemets»; this is what
       says so to the next author. */
    const offenders: string[] = [];
    for (const entry of corpus) {
      /* Code spans first: `*` and `****` inside backticks are literal. */
      const outsideCode = entry.text.replace(/`[^`\n]*`/g, (m) => " ".repeat(m.length));
      for (const m of outsideCode.matchAll(/(?<![*\w])\*(?!\s)([^*\n]{1,60}?)(?<!\s)\*(?![*\w])/g))
        offenders.push(`${entry.id}.${entry.field}.${entry.locale}: *${m[1]}*`);
    }
    expect(offenders, "use «guillemets» or **bold**, not *single asterisks*").toEqual([]);
  });

  it("keeps every asterisk that was not a mark", () => {
    for (const entry of corpus) {
      const authored = (entry.text.match(/\*/g) ?? []).length;
      const marks = (entry.text.match(/\*\*[^*\n]+\*\*/g) ?? []).length * 4;
      const shown = (visible(richText(entry.text)).match(/\*/g) ?? []).length;
      expect(shown, `${entry.id}.${entry.field}.${entry.locale}`).toBe(authored - marks);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* The containers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The unit tests above pass whether or not anything CALLS the parser — that was
 * the whole shape of the original defect, twice. `renderToStaticMarkup` needs no
 * DOM, so each container's wiring is asserted rather than assumed.
 */
describe("every prose container parses what it is given", () => {
  const sample = 'Пишем `cout << "Сәлем!";` — это **важно**';

  const containers: [string, () => string][] = [
    ["LessonParagraph", () => renderToStaticMarkup(createElement(LessonParagraph, { text: sample }))],
    ["WorkedExampleStep", () => renderToStaticMarkup(createElement(WorkedExampleStep, { n: 1, text: sample }))],
    ["BlockPrompt", () => renderToStaticMarkup(createElement(BlockPrompt, { text: sample }))],
    [
      "OptionList",
      () =>
        renderToStaticMarkup(
          createElement(OptionList, {
            options: [{ id: "a", label: sample }],
            selected: null,
            verdict: "unchecked" as const,
            onSelect: () => {},
          }),
        ),
    ],
  ];

  for (const [name, render] of containers) {
    it(`${name} emits <code> and <strong>, not punctuation`, () => {
      const html = render();
      expect(html, `${name} printed its backticks`).not.toContain("`");
      expect(html, `${name} printed its asterisks`).not.toContain("**");
      expect(html).toContain("<code");
      expect(html).toContain("<strong");
      expect(html).toContain("cout &lt;&lt; &quot;Сәлем!&quot;;");
    });
  }

  it("still shows a worked-example step's number and surrounding prose", () => {
    const html = renderToStaticMarkup(
      createElement(WorkedExampleStep, { n: 1, text: "Пишем `int main()` и всё" }),
    );
    expect(html).toContain(">1<");
    expect(html).toContain("Пишем ");
    expect(html).toContain("и всё");
  });

  it("leaves a mono option — code or program output — completely literal", () => {
    /* A prediction's options ARE the program's output. A backtick in one is a
       backtick the program prints. */
    const html = renderToStaticMarkup(
      createElement(OptionList, {
        options: [{ id: "a", label: "*\n**\n***", mono: true }],
        selected: null,
        verdict: "unchecked" as const,
        onSelect: () => {},
      }),
    );
    expect(html).toContain("*\n**\n***");
    expect(html).not.toContain("<code");
  });
});

/**
 * The one route a prompt may take to the screen.
 *
 * `BlockPrompt` used to take `children`, so a view could hand it a raw string
 * and did — thirteen times. The prop is `text` now and the element parses what
 * it is given, which makes the mistake untypeable; this pins the other half,
 * that nothing renders `block.prompt` beside it.
 */
describe("the block renderer routes every prompt through BlockPrompt", () => {
  const src = readFileSync(
    new URL("../../src/components/brilliant/lesson/blocks/index.tsx", import.meta.url),
    "utf8",
  );

  it("has no other reader of block.prompt", () => {
    const uses = [...src.matchAll(/block\.prompt/g)].map((m) => m.index);
    expect(uses.length, "no view renders a prompt any more").toBeGreaterThan(10);
    for (const at of uses) {
      const line = src.slice(src.lastIndexOf("\n", at) + 1, src.indexOf("\n", at));
      expect(line.trim(), "a prompt reached the DOM without being parsed").toMatch(
        /^<BlockPrompt text=\{t\(block\.prompt, (locale|props\.locale)\)\} \/>$/,
      );
    }
  });
});
