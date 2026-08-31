/**
 * Icons lifted verbatim from brilliant.org's authenticated lesson player.
 *
 * Every `d` below was copied out of the live DOM (`svg.outerHTML`), not
 * redrawn by eye. The originals paint with `fill="currentColor"`, so colour is
 * always the caller's job — that is how the player recolours the constraint
 * row from grey to amber to green without swapping icons.
 *
 * The player draws its dock/toolbar glyphs on a 48x48 viewBox with the shape
 * inset around the middle 16-20px; keep the viewBox even when rendering small,
 * or the padding disappears.
 */

export interface IconProps {
  className?: string;
  size?: number;
}

/* ---- top bar ---------------------------------------------------------- */

/** Close (X). 16x16 viewBox. Sits in the 48x48 icon-button at the bar's left. */
export function CloseIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8.00006 6.58577L3.05027 1.63599L1.63606 3.0502L6.58585 7.99999L1.63605 12.9498L3.05026 14.364L8.00006 9.4142L12.9498 14.364L14.364 12.9498L9.41426 7.99999L14.364 3.0502L12.9498 1.63599L8.00006 6.58577Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Chevron-down, used by the "more below" affordance inside a lesson page. */
export function ChevronDownIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.89609 7.0524L0.474243 8.47424L8 16L15.5258 8.47424L14.1039 7.0524L8 13.1563L1.89609 7.0524Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ---- scheduler constraint states -------------------------------------- */

/**
 * Constraint: not yet checked. Note the odd 16x17 sibling below — the arrow is
 * 16x16 but the cross ships on a 17-tall box in the original. Preserved.
 */
export function ConstraintArrowIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.55239 4.39646L7.97424 2.97461L13.5 8.5004L7.97424 14.0262L6.55239 12.6043L9.65089 9.50584H2.5L2.5 7.49504H9.65098L6.55239 4.39646Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Constraint: unsatisfied. Ships on a 16x17 viewBox in the original. */
export function ConstraintCrossIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={(size * 17) / 16}
      viewBox="0 0 16 17"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 6.62069L4.37931 3L3 4.37931L6.62069 8L3 11.6207L4.37931 13L8 9.37931L11.6207 13L13 11.6207L9.37931 8L13 4.37931L11.6207 3L8 6.62069Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Constraint: satisfied. */
export function ConstraintCheckIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14 4.99965L12.5882 3.58789L6.58824 9.58789L3.41176 6.41141L2 7.82317L6.58827 12.4114L14 4.99965Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ---- tutor toolbar (left rail) ---------------------------------------- */

/** "Report a problem" flag. 48x48 viewBox, glyph inset to the middle ~14px. */
export function FlagIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M19.3574 15.1815C21.406 14.714 23.5632 15.1601 25.2373 16.3973C26.6313 17.4277 28.4458 17.7598 30.1309 17.2928C30.7151 17.1308 31.293 17.5702 31.293 18.1765V25.9229C31.293 26.2535 31.0725 26.5434 30.7539 26.6317L30.5391 26.6903C28.4032 27.2822 26.1039 26.8624 24.3369 25.5565C23.0161 24.5803 21.3136 24.2277 19.6973 24.5965C19.4836 24.6451 19.332 24.835 19.332 25.0541V32.4393C19.332 32.881 18.9739 33.2391 18.5322 33.2391C18.0905 33.2391 17.7324 32.881 17.7324 32.4393V26.0459C17.7324 26.0454 17.7319 26.0451 17.7314 26.0453C17.731 26.0455 17.7305 26.0452 17.7305 26.0447V16.1404C17.7305 15.7966 17.9685 15.4987 18.3037 15.4227L19.3574 15.1815Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Read-aloud speaker, with its two sound arcs as separate paths. */
export function SpeakerIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M27.8896 16.2002C28.3853 16.2002 28.7871 16.602 28.7871 17.0977V30.8809C28.7871 31.3883 28.3756 31.7998 27.8682 31.7998C26.4949 31.7997 25.2019 31.1533 24.3779 30.0547L22.6865 27.7998H19.9873C18.4409 27.7998 17.1875 26.5464 17.1875 25V23C17.1875 21.4536 18.4409 20.2002 19.9873 20.2002H22.6865L24.3652 17.9619C25.1973 16.8527 26.5031 16.2003 27.8896 16.2002Z"
        fill="currentColor"
      />
      <path
        d="M33.3203 18.7061C33.6596 18.4613 34.1339 18.52 34.373 18.8633C35.3878 20.3199 35.9843 22.0902 35.9844 24C35.9843 25.9098 35.3888 27.6811 34.374 29.1377C34.1347 29.4812 33.6598 29.539 33.3203 29.2939C32.9445 29.0225 32.8831 28.49 33.1406 28.1045C33.9256 26.93 34.3847 25.5185 34.3848 24C34.3847 22.4815 33.9256 21.0701 33.1406 19.8955C32.8831 19.5101 32.9444 18.9773 33.3203 18.7061ZM30.9062 20.4482C31.2335 20.2121 31.692 20.2601 31.9219 20.5918C32.592 21.5596 32.9853 22.7336 32.9854 24C32.9853 25.2662 32.5918 26.4395 31.9219 27.4072C31.6919 27.7394 31.2338 27.7873 30.9062 27.5508C30.5212 27.2726 30.4759 26.7199 30.7266 26.3164C31.1445 25.6438 31.3857 24.8502 31.3857 24C31.3857 23.1496 31.1445 22.3555 30.7266 21.6826C30.4761 21.2791 30.5212 20.7262 30.9062 20.4482Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ---- Koji dock -------------------------------------------------------- */

/** Chat bubble with two rules — opens the tutor conversation. */
export function ChatIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M29 16C31.7614 16 34 18.2386 34 21V26.6064C33.9998 29.3677 31.7613 31.6064 29 31.6064H27.043C27.0158 31.6064 26.9895 31.6172 26.9707 31.6367L24.9414 33.7422C24.5444 34.1541 23.8835 34.1496 23.4922 33.7324L21.5293 31.6377C21.5105 31.6177 21.4845 31.6065 21.457 31.6064H19C16.2387 31.6064 14.0002 29.3677 14 26.6064V21C14 18.2386 16.2386 16 19 16H29ZM18.75 25C18.3358 25 18 25.3358 18 25.75C18 26.1642 18.3358 26.5 18.75 26.5H23.25C23.6642 26.5 24 26.1642 24 25.75C24 25.3358 23.6642 25 23.25 25H18.75ZM18.75 21C18.3358 21 18 21.3358 18 21.75C18 22.1642 18.3358 22.5 18.75 22.5H29.25C29.6642 22.5 30 22.1642 30 21.75C30 21.3358 29.6642 21 29.25 21H18.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Microphone — the voice-answer affordance ("v" key). */
export function MicIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M29.999 22.6021C30.4409 22.6021 30.7988 22.96 30.7988 23.4019C30.7988 26.8545 28.1662 29.6913 24.7988 30.0161V32.4019H25.3994C26.2828 32.4021 26.9988 33.1181 26.999 34.0015H20.999C20.9992 33.1181 21.7153 32.4021 22.5986 32.4019H23.1992V30.0161C19.8318 29.6913 17.1992 26.8545 17.1992 23.4019C17.1992 22.96 17.5572 22.6021 17.999 22.6021C18.4409 22.6021 18.7988 22.96 18.7988 23.4019C18.7988 26.1886 21.058 28.4475 23.8447 28.4478H24.1533C26.94 28.4475 29.1992 26.1886 29.1992 23.4019C29.1992 22.96 29.5572 22.6021 29.999 22.6021ZM23.999 15.6021C26.0977 15.6021 27.7988 17.3032 27.7988 19.4019V23.4019C27.7988 25.5005 26.0977 27.2017 23.999 27.2017C21.9003 27.2017 20.1992 25.5005 20.1992 23.4019V19.4019C20.1992 17.3032 21.9003 15.6021 23.999 15.6021Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ---- progress / xp ---------------------------------------------------- */

/**
 * The player's single directional arrow. The original ships one up-pointing
 * path and rotates it: 270deg for "previous", 90deg for "next". Both nav
 * buttons sit at opacity 0 until navigation is actually possible.
 */
export function ArrowUpIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.89614 8.94751L0.474304 7.52568L8 -1.55877e-05L15.5257 7.52568L14.1039 8.94751L9.00541 3.84905L9.00541 16L6.99464 16L6.99463 3.84902L1.89614 8.94751Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * XP sparkle — a four-point star with a smaller companion. 32x32 viewBox.
 * The original is `text.disabled` at zero XP and switches to
 * `border.green.bold` once `data-filled` is set, so colour is left to the
 * caller via `currentColor`.
 */
export function SparkleIcon({ className, size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.8683 5.65558C15.1907 4.78561 16.4209 4.78559 16.7433 5.65558L19.0929 12.0052C19.1436 12.1419 19.2521 12.2495 19.3888 12.3001L25.7374 14.6507C26.6076 14.973 26.6078 16.2035 25.7374 16.5257L19.3888 18.8753C19.252 18.926 19.1436 19.0344 19.0929 19.1712L16.7433 25.5198C16.4211 26.3901 15.1907 26.39 14.8683 25.5198L12.5177 19.1712C12.4671 19.0345 12.3595 18.926 12.2228 18.8753L5.87319 16.5257C5.00319 16.2033 5.00322 14.9731 5.87319 14.6507L12.2228 12.3001C12.3594 12.2495 12.4671 12.1418 12.5177 12.0052L14.8683 5.65558ZM23.8595 4.33234C24.0206 3.89703 24.6369 3.89703 24.798 4.33234L25.3292 5.76886C25.3799 5.90562 25.4874 6.01407 25.6242 6.06476L27.0617 6.59601C27.4967 6.7572 27.4968 7.37337 27.0617 7.53449L25.6242 8.06574C25.4876 8.11639 25.3799 8.22412 25.3292 8.36066L24.798 9.79816C24.6369 10.2333 24.0207 10.2332 23.8595 9.79816L23.3283 8.36066C23.2776 8.22394 23.1691 8.11635 23.0324 8.06574L21.5958 7.53449C21.1605 7.37341 21.1605 6.75709 21.5958 6.59601L23.0324 6.06476C23.1692 6.01412 23.2776 5.90572 23.3283 5.76886L23.8595 4.33234Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Streak bolt. The original draws on a 19x25 viewBox at 26.24px and drives
 * fill/stroke from three custom properties toggled by `data-completed`:
 *
 *   false -> fill bg.primary,        stroke text.disabled, stroke-width 2
 *   true  -> fill border.pear.bold,  stroke none,          stroke-width 0
 *
 * That contract is preserved here so a filled day is a data change, not a
 * different icon.
 */
export function StreakBoltIcon({
  className,
  size = 26.24,
  completed = false,
}: IconProps & { completed?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 19 25"
      fill="none"
      aria-hidden="true"
      data-completed={completed}
      className={className}
    >
      <path
        d="M1.27498 12.516L10.1761 1.31828C10.7098 0.646883 11.7966 1.11739 11.6606 1.96094L10.3758 9.92921H15.8888C16.9368 9.92921 17.5236 11.1248 16.8757 11.94L7.97457 23.1377C7.44087 23.8091 6.35401 23.3386 6.49003 22.495L7.7748 14.5268H2.26186C1.21381 14.5268 0.62701 13.3312 1.27498 12.516Z"
        fill={completed ? "currentColor" : "var(--color-b-dark)"}
        stroke={completed ? "none" : "currentColor"}
        strokeWidth={completed ? 0 : 2}
      />
    </svg>
  );
}

/* ---- misc ------------------------------------------------------------- */

/**
 * Rotate-counterclockwise, used by "Start over".
 *
 * ⚠️ NOT EXTRACTED. Every other glyph in this file is a verbatim copy of the
 * original path data; this one is hand-drawn, because the live "Start over"
 * control was never captured. Replace it with the real path when the player is
 * next opened. It is called out here so it is not mistaken for a measurement.
 */
export function ResetIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8 2.5a5.5 5.5 0 1 1-5.19 3.67"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M2.2 2.2v3.6h3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
