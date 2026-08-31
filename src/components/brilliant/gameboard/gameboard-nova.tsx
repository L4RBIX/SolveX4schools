"use client";

import { useReducedMotion } from "motion/react";
import { NovaAvatar, type NovaState } from "@/components/nova/nova-avatar";

/**
 * Nova standing on a milestone, in the slot the reference gives its own mascot.
 *
 * ## What is preserved from the reference, and what is not
 *
 * The reference's active node is a Rive scene: a mascot descends a column of
 * light, lands on the lit pedestal, and idles there. We cannot ship that file —
 * it is Brilliant's, and the character in it is theirs — so what is reproduced
 * is the **composition and the beat**, not the artwork:
 *
 *   preserved   mascot centred on the disc, standing ON the top face rather
 *               than floating above it; roughly half the node's height; a
 *               contact shadow on the face; and the arrival BEAT, captured
 *               frame by frame off the reference's own artboard: a spray of
 *               particles rises first, a beam opens, and the mascot COALESCES
 *               out of the spray inside it rather than being dropped in
 *   replaced    the character. Nova is Strobi, in the product's purple. Koji is
 *               not recoloured and not imitated.
 *
 * ## The numbers, and where they come from
 *
 * The pedestal box is 128x134 and its artwork is drawn on a `0 0 186 195`
 * viewBox, so viewBox units map to px at 128/186 = 0.688:
 *
 *   disc top face, centre   y 126 → 86.6px
 *   disc top face, top edge y  93 → 63.9px
 *   disc top face, radius   x 54.5 → 37.5px
 *
 * Nova is 52px and her base sits at 76px. Both come from measuring the
 * reference's own mascot in a 3x crop: it is ~50px wide against a 92px disc,
 * and its visible base sits at ~72px in the box — ABOVE the plate's centre
 * line, with the glow spilling up over it. That is the trick. Earlier passes
 * put her at 46px (a speck floating above), then 68px and then 62px sitting
 * squarely on top of the light like a marble on a plate. She has to sink INTO
 * the well, not stand on its lid.
 */

/** Height of the pedestal box these numbers are expressed against. */
const BOX = 134;
/**
 * Where Nova's feet land, measured from the top of that box.
 *
 * The disc's top face spans y 64.5…109.1 in this box and its centre line is at
 * 86.8. Feet at 84 puts her just forward of that centre, so the near edge of
 * the dish crosses in front of her.
 */
const BASE = 76;
/**
 * Measured off the reference: its mascot is 63px against a 92px-wide disc, a
 * ratio of 0.68. Ours is 62 against the same 92px disc. The first pass used 68,
 * which is only 6px larger but reads as a ball that has swallowed the pedestal
 * — at this size the lit face has to stay visible around the mascot, because
 * the face is what says "this is your current milestone".
 */
const SIZE = 52;

/**
 * The arrival spray.
 *
 * Nine dots, sized and placed to match the reference's own scatter: a few large
 * ones near the beam's mouth and a tail of small ones further out, all rising
 * and fading before the mascot resolves. Fixed rather than random — the board
 * server-renders, and a random scatter would mismatch on hydration.
 */
const PARTICLES = [
  { x: 46, y: 44, size: 7, drift: -14, dur: 900, delay: 0 },
  { x: 58, y: 38, size: 5, drift: 12, dur: 980, delay: 60 },
  { x: 38, y: 34, size: 4, drift: -22, dur: 1040, delay: 110 },
  { x: 64, y: 46, size: 6, drift: 20, dur: 900, delay: 150 },
  { x: 50, y: 30, size: 8, drift: 4, dur: 1080, delay: 40 },
  { x: 31, y: 46, size: 3, drift: -28, dur: 960, delay: 200 },
  { x: 70, y: 34, size: 4, drift: 26, dur: 1010, delay: 240 },
  { x: 43, y: 26, size: 3, drift: -8, dur: 1120, delay: 300 },
  { x: 56, y: 22, size: 4, drift: 10, dur: 1150, delay: 340 },
] as const;

export interface GameboardNovaProps {
  /**
   * What Nova is doing here. Semantic, never an animation name — the mapping
   * to a clip lives in `NovaAvatar` and is test-checked against the definition.
   */
  state?: NovaState;
  /**
   * Replay the arrival. Change this when the learner's current milestone moves,
   * so Nova drops onto the new node rather than teleporting to it.
   */
  arrivalKey?: string | number;
}

export function GameboardNova({ state = "idle", arrivalKey }: GameboardNovaProps) {
  const reduce = useReducedMotion();

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]">
      {/*
        The column of light.

        Anchored to the disc's face and scaled from its base, so it grows down
        out of the sky rather than expanding from its own middle. It removes
        itself once played — a permanent beam would compete with the pulse for
        the learner's attention, and the reference's beam is not permanent
        either: it belongs to `Koji_Appear+Enter`, not to `koji_idle`.
      */}
      {!reduce && (
        <span
          key={`beam-${arrivalKey}`}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: 0,
            height: BASE,
            width: 58,
            transformOrigin: "50% 100%",
            background:
              "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--color-b-purple) 55%, transparent) 45%, color-mix(in oklab, #ffffff 78%, transparent) 100%)",
            clipPath: "polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)",
            filter: "blur(3px)",
            animation: "sx-nova-beam 900ms ease-out both",
          }}
        />
      )}

      {/*
        The arrival particles.

        Captured frame by frame off the reference's own artboard: firing
        `koji_appear` scatters a spray of dots in the mascot's colour above the
        pedestal, they rise and drift, and the mascot coalesces out of them
        inside the beam. Without them the entrance reads as an object being
        dropped in rather than assembled, which is what ours did.

        Ours are purple because Nova is purple. The offsets are a fixed table
        rather than random so the server and the client agree on the markup.
      */}
      {!reduce &&
        PARTICLES.map((p, i) => (
          <span
            key={`p-${arrivalKey}-${i}`}
            className="absolute rounded-full"
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: "var(--color-b-purple)",
                "--sx-px": `${p.drift}px`,
                animation: `sx-particle ${p.dur}ms ease-out ${p.delay}ms both`,
              } as React.CSSProperties
            }
          />
        ))}

      <span
        key={`nova-${arrivalKey}`}
        className="absolute left-1/2"
        style={{
          top: BASE - SIZE,
          transform: "translateX(-50%)",
          /* Delayed behind the particles: in the reference the spray rises
             for ~320ms before the mascot resolves inside the beam. */
          animation: reduce
            ? undefined
            : "sx-nova-arrive 620ms var(--ease-b-spring) 320ms both",
        }}
      >
        <NovaAvatar state={state} size={SIZE} />
      </span>

      {/*
        Where Nova meets the light.

        The reference's mascot tapers into the glow of its pedestal, so it reads
        as rising out of a well rather than balanced on a lid. Nova is a sphere
        with a hard edge, which cannot taper — so the join is made by washing
        light back up over her base instead. Without this she sits on the disc
        like a marble on a plate, which is exactly how the first pass looked.

        Painted OVER her (it follows her in the DOM), at low alpha.
      */}
      <span
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
        style={{
          top: BASE - 22,
          width: 78,
          height: 42,
          background:
            "radial-gradient(closest-side, rgba(255,255,255,0.55), rgba(255,255,255,0.14) 55%, transparent 78%)",
          filter: "blur(4px)",
          zIndex: 3,
        }}
      />

    </span>
  );
}

/** Exported so the pedestal can reserve exactly the space Nova occupies. */
export const NOVA_BOX = { box: BOX, base: BASE, size: SIZE };
