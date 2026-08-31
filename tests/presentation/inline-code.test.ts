import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import {
  inlineCode,
  WorkedExampleStep,
} from "../../src/components/brilliant/lesson/blocks/primitives";
import { MONTHS } from "../../schools/curriculum/months";

/**
 * Backticks in prose must become code, in every container that shows prose.
 *
 * This exists because they did not. `LessonParagraph` parsed them and the
 * worked-example step renderer did not, so a step reading
 * `` `cout << "Сәлем!";` `` printed its own backticks at the learner. It was
 * invisible while the course was Python — steps said "print" and "input" as
 * plain words — and became visible on the first C++ lesson, where naming a
 * construct means naming `#include <iostream>` and `int main()`.
 */

/** React elements are plain objects; no DOM is needed to see what was built. */
function shape(nodes: ReturnType<typeof inlineCode>) {
  return (nodes as ReactElement<{ children?: string }>[]).map((n) => ({
    tag: n.type as string,
    text: n.props.children ?? "",
  }));
}

describe("inlineCode", () => {
  it("promotes a backticked span to <code> and strips the backticks", () => {
    expect(shape(inlineCode("Пишем `int main()` и всё"))).toEqual([
      { tag: "span", text: "Пишем " },
      { tag: "code", text: "int main()" },
      { tag: "span", text: " и всё" },
    ]);
  });

  it("keeps C++ operators intact, angle brackets and all", () => {
    /* `<<` and `<iostream>` are the two things September cannot say without,
       and both are exactly what a naive HTML path would eat. */
    for (const src of ["cout << 7 * 8;", "#include <iostream>", 'cout << "Сәлем!" << endl;']) {
      const [, code] = shape(inlineCode(`Вот \`${src}\` вот`));
      expect(code).toEqual({ tag: "code", text: src });
    }
  });

  it("leaves text with no backticks completely alone", () => {
    const out = shape(inlineCode("обычное предложение"));
    expect(out).toEqual([{ tag: "span", text: "обычное предложение" }]);
  });

  it("does not treat an empty pair as code", () => {
    expect(shape(inlineCode("a `` b")).every((n) => n.tag === "span")).toBe(true);
  });
});

describe("the curriculum's own steps", () => {
  it("has worked-example steps that need this, so the wiring is load-bearing", () => {
    /* If this ever finds none, either the content stopped using backticks or
       the block shape changed — both worth knowing before the renderer is
       "simplified" back to raw text. */
    const withCode: string[] = [];
    for (const month of MONTHS) {
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          for (const block of lesson.blocks) {
            if (block.type !== "worked_example") continue;
            for (const step of block.steps) {
              if (/`[^`\n]+`/.test(step.ru)) withCode.push(`${block.id}: ${step.ru}`);
            }
          }
        }
      }
    }
    expect(withCode.length, "no worked-example step uses inline code any more").toBeGreaterThan(0);
  });
});

describe("the step renderer actually uses it", () => {
  /* The unit tests above pass whether or not anything calls `inlineCode` — that
     was the whole shape of the original defect. `renderToStaticMarkup` needs no
     DOM, so the wiring can be asserted rather than assumed. */
  const render = (text: string) =>
    renderToStaticMarkup(createElement(WorkedExampleStep, { n: 1, text }));

  it("emits a <code> element for a backticked construct", () => {
    const html = render('Пишем `cout << "Сәлем!";` вот так');
    expect(html, "the step rendered its backticks as characters").not.toContain("`");
    expect(html).toContain("<code");
    expect(html).toContain("cout &lt;&lt; &quot;Сәлем!&quot;;");
  });

  it("still shows the step number and the surrounding prose", () => {
    const html = render("Пишем `int main()` и всё");
    expect(html).toContain(">1<");
    expect(html).toContain("Пишем ");
    expect(html).toContain("и всё");
  });
});
