"use client";

import { useState } from "react";

import { P } from "./prose";
import { Tex } from "./tex";

/**
 * `div.problem-modal-container.anchor#problem-logarithms-in-ap > .wiki-problem`
 * — the page's single embedded problem.
 *
 *   .wiki-problem            width 100%; padding 16px; margin-bottom 24px;
 *                            background #fff; overflow auto; border-radius 10px;
 *                            border 1px solid #d4d4d4; box-shadow 0 0 0 1px #f3f3f3
 *   .wiki-problem:before     'Try It Yourself' — 9px / 500 / 1.2em, #919191,
 *                            uppercase, letter-spacing .5px, margin-bottom 10px
 *   .problem-container       float left; width 100%; position relative
 *   .answer-container        float right; width 276px  (224px at 700–1200px)
 *   .question-container      margin-right 276px; padding-right 24px; overflow hidden
 *                            (224px / 16px at 700–1200px)
 *   .btn                     grey default: #f0f0f0 on #333, r54, 2px transparent
 *                            border, padding 3px 16px, all .3s
 *
 * Interaction (`app/wiki:wikiShowProblemAnswer`): clicking the button adds
 * `answer-revealed`, which hides the button and shows the solution. One-way —
 * the original never toggles back, so neither does this.
 *
 * The answer column precedes the question in the source order; that order is
 * kept because the float layout depends on it.
 */
export function TryItYourself() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      id="problem-logarithms-in-ap"
      className="clear-both before:invisible before:-mt-[61px] before:block before:h-[61px] before:content-['']"
    >
      <div className="mx-auto mb-6 w-full overflow-auto rounded-[10px] border border-[#d4d4d4] bg-b-white p-4 shadow-[0_0_0_1px_#f3f3f3]">
        <span className="mb-[10px] block text-[9px] leading-[1.2em] font-medium tracking-[0.5px] text-[#919191] uppercase">
          Try It Yourself
        </span>

        <div className="relative float-left w-full">
          <div className="relative float-right w-[276px] [@media(min-width:700px)_and_(max-width:1200px)]:w-[224px]">
            {revealed ? null : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                aria-controls="problem-logarithms-in-ap-solution"
                className="w-full cursor-pointer rounded-[54px] border-2 border-transparent bg-[#f0f0f0] px-4 py-[3px] text-center font-b-sans text-[15px] leading-normal font-medium text-[#333] transition-all duration-300 hover:text-[#0277bd] hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)] focus:text-[#0277bd] focus:shadow-[0_1px_3px_rgba(0,0,0,0.3)] focus-visible:outline-none"
              >
                Reveal the answer
              </button>
            )}
          </div>

          <div className="mr-[276px] overflow-hidden pr-6 [@media(min-width:700px)_and_(max-width:1200px)]:mr-[224px] [@media(min-width:700px)_and_(max-width:1200px)]:pr-4">
            <P>The following logarithms are in an arithmetic progression:</P>
            <P>
              <Tex
                src={String.raw`\[\log_{2}4 + \log_{2}{16} + \log_{2}{64} + \cdots + x = 42.\]`}
              />
            </P>
            <P>
              If <Tex src={String.raw`\(x\)`} /> can be expressed as{" "}
              <Tex src={String.raw`\(\log_{2}a,\)`} /> find the value of{" "}
              <Tex src={String.raw`\(a.\)`} />
            </P>
          </div>

          <div
            id="problem-logarithms-in-ap-solution"
            className={revealed ? "block" : "hidden"}
          >
            <br />
            <br />
            The correct answer is: <strong className="font-semibold">4096</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
