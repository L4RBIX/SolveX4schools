import { ABOUT_IMG } from "./assets";
import { ScratchHighlight, type ScratchSpec } from "./scratch-highlight";

const EXCEL: ScratchSpec = {
  image: `${ABOUT_IMG}/excel-scratch.svg`,
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: "120%",
  height: "120%",
};

const LESS_TIME: ScratchSpec = {
  image: `${ABOUT_IMG}/less-time-scratch.svg`,
  top: "50%",
  transform: "translateX(-50%)",
  width: "110%",
  height: "120%",
};

const PURPOSE_AND_JOY: ScratchSpec = {
  image: `${ABOUT_IMG}/purpose-and-joy-scratch.svg`,
  top: "40%",
  transform: "translateX(-50%)",
  width: "110%",
  height: "120%",
};

/** The full-bleed mission statement, white fading to #f2f2f2. */
export function StatementBand() {
  return (
    <div
      data-slot="box"
      className="px-6 py-16 [background-image:linear-gradient(180deg,#fff_0%,#f2f2f2_100.02%)] min-[769px]:px-8 min-[769px]:py-24"
    >
      <div
        data-slot="box"
        className="mx-auto max-w-full min-[360px]:max-w-[432px] min-[769px]:max-w-[957px]"
      >
        <h2
          data-slot="heading"
          className="font-b-serif text-center text-[30px] leading-[120%] font-medium text-b-ink min-[481px]:leading-[110%] min-[769px]:text-[48px]"
        >
          We help people <ScratchHighlight spec={EXCEL}>excel</ScratchHighlight>{" "}
          in STEM, in{" "}
          <ScratchHighlight spec={LESS_TIME}>less time,</ScratchHighlight> with
          more{" "}
          <ScratchHighlight spec={PURPOSE_AND_JOY}>
            purpose and joy
          </ScratchHighlight>
        </h2>
      </div>
    </div>
  );
}
