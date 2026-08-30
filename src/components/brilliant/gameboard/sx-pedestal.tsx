"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The milestone pedestal, rebuilt from measurements rather than copied.
 *
 * ## Why this is not the reference's SVG
 *
 * The reference's disc ships as a Figma export: twenty paths, six luminance
 * masks, two dead gradients and a `mix-blend-mode: color` group, most of it
 * fully overpainted. Those path strings are Brilliant's artwork, so shipping
 * them in a paid product is the same problem as shipping their Rive file.
 *
 * They are also unnecessary. Rasterised and histogrammed, that whole export
 * resolves to **four flat colours and four ellipses**. What follows is that
 * reduction, drawn from the fitted geometry — a description of the shape, not
 * a copy of the curves. It was checked against the original at 4x: 0.29% of
 * pixels differ by more than 12/255, all of it antialiasing on edges.
 *
 * ## The three things that make it read as a machined object
 *
 * 1. **The side wall is an offset pair.** The top face sits 8.83u above the rim
 *    and is 13.11u narrower. There is no drawn wall and no drop shadow — the
 *    offset alone is the entire 3D read. (The reference has no shadow either;
 *    the one black path in its export is completely overpainted.)
 * 2. **One triangle is the bevel.** A white@0.2 triangle, apex above the disc
 *    on its centre line and base below it, clipped to the rim ellipse. The two
 *    lower corners of the rim fall outside the triangle and stay dark, which
 *    reads as a two-facet chamfer.
 * 3. **The groove is broken, not a ring.** A 6.04u vertical strip is knocked
 *    out at 12 and 6 o'clock. That single detail is the difference between a
 *    machined platform and a coin, and it is the kind of thing that is only
 *    ever found by measuring.
 *
 * ## Colour
 *
 * `mix-blend-mode: color` over a grey stack is just a luminance map, so the
 * purple variant collapses to four more flats and needs no blend mode at all —
 * which also removes the failure where a `color` blend over a near-black page
 * paints a dark violet rectangle around the node.
 *
 *   silver   rim #999999   facet #ADADAD   face #E5E5E5   groove #CCCCCC
 *   purple   rim #7E43E0   facet #9D62FF   face #C19CFF   groove #FFFFFF
 *
 * Verified: the reference's `#666666` rim under a purple `color` blend resolves
 * to exactly #7E43E0.
 */

/* ---- geometry, in viewBox units (0 0 186 195) ------------------------- */

const SILVER = {
  rim: { cx: 92.89, cy: 135.17, rx: 67.04, ry: 39.75 },
  face: { cx: 92.89, cy: 126.34, rx: 53.93, ry: 32.39 },
  plate: { cx: 92.89, cy: 126.34, rx: 43.72, ry: 25.03 },
  inner: { cx: 92.72, cy: 126.37, rx: 33.73, ry: 19.14 },
  wedge: "92.894,88.058 162.851,182.286 22.937,182.286",
  gapX: 89.86,
};

/* The lit variant sits ~2u lower and is a hair flatter — kept, because moving
   it back would put the halo off-centre against the disc it belongs to. */
const LIT = {
  rim: { cx: 93.04, cy: 137.41, rx: 67.04, ry: 39.35 },
  face: { cx: 93.04, cy: 128.66, rx: 53.93, ry: 32.06 },
  plate: { cx: 93.04, cy: 128.66, rx: 43.72, ry: 24.78 },
  inner: { cx: 92.87, cy: 128.69, rx: 33.73, ry: 18.95 },
  wedge: "93.0423,90.7703 162.999,184.046 23.0852,184.046",
  gapX: 90.01,
};

/**
 * The selection ring, fitted to the Rive-rendered node rather than to the
 * static export's halo — they are not the same shape, and the live one is what
 * a learner sees.
 *
 * Measured by masking the purple pixels of a settled `select=true` capture and
 * scanning it (canvas 384x402 = 3px per css px):
 *
 *   band, horizontal   52.7 … 59.7 css from centre  → 76.6 … 86.8 viewBox
 *   centre             (64, 96.7) css              → (93, 140.7) viewBox
 *   colour             rgb(164,110,255)            → purple-500
 *
 * So: mid radius 81.7 x 49.9, stroke 10.2. The first pass put it at 87 x 52.6
 * with an 11 stroke — about 5px too far out and too heavy, which is what made
 * it read as a separate hoop floating around the node instead of a rim on it.
 *
 * `GAP_DEG` is one gap, not two. Across five rotation phases the purple covers
 * 67–74% of the ellipse in a SINGLE contiguous arc; a two-gap dash pattern
 * (which is what shipped first) reads as a completely different object.
 */
const RING = { cx: 93, cy: 140.7, rx: 81.7, ry: 49.9, width: 10.2 };
/** Ramanujan circumference of RING, for the dash pattern and the spin. */
const RING_C = 419;
const RING_DASH = `${Math.round(RING_C * 0.72)} ${Math.round(RING_C * 0.28)}`;

const GAP_W = 6.04;

export type PedestalState =
  /** Not authored yet. Dimmed, not padlocked — a padlock promises a key. */
  | "future"
  /** Reachable, not begun. */
  | "available"
  /** The learner's current milestone. Nova stands here. */
  | "active"
  /** Begun but not finished. */
  | "started"
  /** Finished. */
  | "complete";

/**
 * Which disc a state gets.
 *
 * This is the reference's own rule, not ours: its Rive `completed` input is
 * `isCompleted || isStarted`, and its static export ships the purple disc for
 * exactly that set. Purple means "you have been here", silver means "you have
 * not". Selection is a separate, additive ring — which is why a learner can
 * select a node they have never opened and still see it is untouched.
 */
const IS_LIT: Record<PedestalState, boolean> = {
  future: false,
  available: false,
  active: true,
  started: true,
  complete: true,
};

export interface SxPedestalProps {
  state: PedestalState;
  /** Draws the selection halo. Additive — it does not change the disc. */
  selected?: boolean;
  className?: string;
}

export function SxPedestal({ state, selected, className }: SxPedestalProps) {
  const uid = useId().replace(/:/g, "");
  const lit = IS_LIT[state];
  const g = lit ? LIT : SILVER;

  /*
   * Selecting does not merely add a ring — it swaps the whole grey set.
   *
   * Sampled straight off a settled `select=true` render of the reference's own
   * artboard, unquantised, along the disc's centre row:
   *
   *   plate / face  rgb(179,179,179)  #B3B3B3   (unselected: #E5E5E5)
   *   rim           rgb(102,102,102)  #666666   (unselected: #999999)
   *   groove        rgb(255,255,255)  #FFFFFF   (unselected: #CCCCCC)
   *
   * The disc gets DARKER and the groove goes pure white, so the node reads as
   * dimmed with a lit ring cut into it. Keeping the light set and adding a ring
   * — which is what shipped first — looks nothing like it.
   */
  const c = lit
    ? { rim: "#7E43E0", facet: "#9D62FF", face: "#C19CFF", groove: "#FFFFFF" }
    : selected
      ? { rim: "#666666", facet: "#858585", face: "#B3B3B3", groove: "#FFFFFF" }
      : { rim: "#999999", facet: "#ADADAD", face: "#E5E5E5", groove: "#CCCCCC" };

  const groove = c.groove;

  return (
    <svg
      width="128"
      height="134"
      viewBox="0 0 186 195"
      fill="none"
      aria-hidden="true"
      /* The reference's only hover affordance on a node is a 10% dim, and it
         snaps — there is no transition on it anywhere in its stylesheet. */
      className={cn(
        "shrink-0 group-hover:brightness-90",
        state === "future" && "opacity-35",
        className,
      )}
    >
      <defs>
        {/* the rim, for clipping the bevel triangle to it */}
        <clipPath id={`${uid}-rim`}>
          <ellipse cx={g.rim.cx} cy={g.rim.cy} rx={g.rim.rx} ry={g.rim.ry} />
        </clipPath>

        {/* the bloom spilling out of a lit node's plate */}
        {state === "active" && (
          <radialGradient
            id={`${uid}-well`}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform={`translate(${g.plate.cx} ${g.plate.cy}) rotate(90) scale(${g.plate.ry + 16} ${g.plate.rx + 22})`}
          >
            <stop stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        )}

        {/* plate minus inner minus the vertical gap = the broken groove */}
        <mask id={`${uid}-groove`} maskUnits="userSpaceOnUse" x="0" y="0" width="186" height="195">
          <ellipse cx={g.plate.cx} cy={g.plate.cy} rx={g.plate.rx} ry={g.plate.ry} fill="#fff" />
          <ellipse cx={g.inner.cx} cy={g.inner.cy} rx={g.inner.rx} ry={g.inner.ry} fill="#000" />
          <rect x={g.gapX} y="80" width={GAP_W} height="100" fill="#000" />
        </mask>

      </defs>

      {/*
        ---- the selection ring, behind the disc -------------------------

        Captured off the reference's own artboard frame by frame: selecting a
        node sweeps a purple arc around the disc, and the ring then TURNS
        CONTINUOUSLY, its gaps travelling around the ellipse on a 4087ms cycle.
        A static halo — which is what this was — misses the single most visible
        thing the reference does when you click a milestone.

        Drawn as a dashed ellipse stroke so the gaps move along the path; see
        the note on `sx-ring-spin` in globals.css for why this is not a rotate.
      */}
      {/*
        ---- the selection ring, behind the disc -------------------------

        Fitted to the live Rive node, not to the static export. Three things
        the first pass got wrong, all visible at a glance:

          - it sat ~5px too far out on a heavier stroke, so it read as a hoop
            floating around the node rather than a rim fastened to it;
          - it had TWO gaps; the reference has exactly one, ~100 degrees wide;
          - it was drawn over a near-black trench ellipse. There is no trench.
            Sampling between the disc's rim and the ring returns rgb(20,20,20)
            — that is just the page. The trench was invented.

        The ring TURNS: the gap travels the ellipse on a 4087ms cycle, measured
        from the frame at which the image returns to its start.
      */}
      {selected && (
        <ellipse
          cx={RING.cx}
          cy={RING.cy}
          rx={RING.rx}
          ry={RING.ry}
          fill="none"
          stroke="var(--color-b-purple)"
          strokeWidth={RING.width}
          strokeLinecap="round"
          style={{
            strokeDasharray: RING_DASH,
            animation:
              "sx-ring-in 260ms ease-out both, sx-ring-spin 4087ms linear infinite 260ms",
          }}
        />
      )}

      {/* ---- 0. the trench a lit node sits in ---------------------------
           The reference rings its current node with a near-black ellipse just
           outside the purple rim. It is what keeps a glowing node from bleeding
           into the page and gives the well a lip. */}
      {lit && (
        <ellipse
          cx={g.rim.cx}
          cy={g.rim.cy + 2}
          rx={g.rim.rx + 6}
          ry={g.rim.ry + 4}
          fill="none"
          stroke="#0C0912"
          strokeWidth="9"
          opacity="0.85"
        />
      )}

      {/* ---- 1. the rim ------------------------------------------------- */}
      <ellipse cx={g.rim.cx} cy={g.rim.cy} rx={g.rim.rx} ry={g.rim.ry} fill={c.rim} />

      {/* ---- 2. the bevel: one triangle, clipped to the rim ------------- */}
      <g clipPath={`url(#${uid}-rim)`}>
        <polygon points={g.wedge} fill={c.facet} />
      </g>

      {/* ---- 3. the top face -------------------------------------------- */}
      <ellipse cx={g.face.cx} cy={g.face.cy} rx={g.face.rx} ry={g.face.ry} fill={c.face} />

      {/* ---- 4. the broken groove --------------------------------------- */}
      <rect width="186" height="195" fill={groove} mask={`url(#${uid}-groove)`} />

      {/*
        ---- 5. the well, for the node the learner is standing on --------

        Only for `active`. Cropped from the live reference at 3x, its current
        node is not a flat purple disc with a white ring: the plate is blown
        out to white and blooms past its own edge, so the node reads as a well
        of light with the mascot rising out of it. That glow — plus the dark
        trench ringing the outside — is most of what makes the reference's
        current node look lit rather than merely coloured.

        `started` and `complete` keep the flat purple plate, which is what the
        reference's own static export ships for them.
      */}
      {state === "active" && (
        <>
          <ellipse
            cx={g.plate.cx}
            cy={g.plate.cy}
            rx={g.plate.rx + 1}
            ry={g.plate.ry + 1}
            fill="#FFFFFF"
          />
          <ellipse
            cx={g.plate.cx}
            cy={g.plate.cy}
            rx={g.plate.rx + 22}
            ry={g.plate.ry + 16}
            fill={`url(#${uid}-well)`}
          />
        </>
      )}
    </svg>
  );
}

/**
 * The node that closes a unit.
 *
 * The reference swaps the disc for a cog-edged medal on a different viewBox
 * entirely (`0 0 120 117`), so this cannot be a recolour — it is a different
 * object. Its face is an 8-point star; a perfectly regular star matches the
 * hand-tuned original to 0.6% of pixels, so that is what is drawn here rather
 * than a traced copy: 16 vertices, radius alternating 41.3 / 35.0, flattened
 * to the same 0.5914 horizon as everything else on the board.
 */
export function SxReviewPedestal({
  state,
  selected,
  className,
}: {
  state: PedestalState;
  selected?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const lit = IS_LIT[state];
  const c = lit
    ? { base: "#7E43E0", facet: "#9D62FF", face: "#C19CFF", groove: "#FFFFFF" }
    : { base: "#999999", facet: "#ADADAD", face: "#E5E5E5", groove: "#CCCCCC" };

  /** 8-point star, flattened about its centre. */
  const star = (cx: number, cy: number, outer: number, inner: number, k = 0.5914) =>
    Array.from({ length: 16 }, (_, i) => {
      const a = (-90 + 22.5 * i) * (Math.PI / 180);
      const r = i % 2 === 0 ? outer : inner;
      return `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r * k).toFixed(2)}`;
    }).join(" ");

  return (
    <svg
      width="128"
      height="134"
      viewBox="0 0 120 117"
      fill="none"
      aria-hidden="true"
      className={cn(
        "shrink-0 group-hover:brightness-90",
        state === "future" && "opacity-35",
        className,
      )}
    >
      <defs>
        <mask id={`${uid}-g`} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="117">
          <ellipse cx="60" cy="74" rx="30" ry="17" fill="#fff" />
          <ellipse cx="60" cy="74" rx="23" ry="13" fill="#000" />
          <rect x="58" y="50" width="4" height="48" fill="#000" />
        </mask>
      </defs>

      {selected && (
        <ellipse cx="60" cy="80" rx="59" ry="35" fill="var(--color-b-purple)" opacity="0.9" />
      )}
      {selected && <ellipse cx="60" cy="78" rx="50" ry="28" fill="#141414" />}

      {/* the cog base: the same star, wider and dropped below the face */}
      <polygon points={star(60, 81.9, 45.64, 38.7)} fill={c.base} />
      {/* the face */}
      <polygon points={star(60, 74, 41.3, 35.0)} fill={c.face} />
      {/* the broken groove */}
      <rect width="120" height="117" fill={c.groove} mask={`url(#${uid}-g)`} />
    </svg>
  );
}
