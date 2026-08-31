"use client";

import { useId } from "react";

/**
 * The 3D lesson pedestal from the logged-in course card.
 *
 * These are **inline SVG**, not Rive — verified by pulling the live
 * `svg.outerHTML`. Both variants are 64x62 on a `0 0 64 62` viewBox and are
 * reproduced verbatim, gradients and blur filter included.
 *
 * Active: a purple `#9D62FF` glow ellipse behind the disc, a `feGaussianBlur`
 * (stdDeviation 1.533) highlight, and the green `#29CC57` marker standing on
 * top — that marker is the "Koji on the pedestal" from the brief.
 *
 * Locked: the same disc geometry with no glow and no marker, plus a
 * `#000 / .4` ring and a white `.5` highlight.
 *
 * `useId()` namespaces the gradient/filter ids so several pedestals can render
 * on one page without their `url(#…)` references colliding — the original does
 * the same thing with React's `:r…:` ids.
 */

export interface PedestalProps {
  className?: string;
}

/**
 * The marker standing on the active pedestal.
 *
 * The reference draws it in Brilliant's `#29CC57`. That green is theirs, and in
 * this player green already means "correct" — so a permanent green gem on the
 * current lesson congratulates a learner for arriving. The product passes its
 * own violet, the same hue Nova wears on the gameboard.
 */
const REFERENCE_MARKER = "#29CC57";

export function PedestalActive({
  className,
  markerColor = REFERENCE_MARKER,
}: PedestalProps & { markerColor?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width="64" height="62" viewBox="0 0 64 62" fill="none" aria-hidden="true" className={className}>
      <path
        d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.527 0s-8.982-13.82 0-19.092c8.983-5.272 23.545-5.272 32.527 0s8.982 13.82 0 19.092"
        fill="#CCC"
      />
      <path
        d="M48.017 50.466c-8.982 5.272-23.545 5.272-32.527 0s-8.982-13.82 0-19.092c8.983-5.272 23.545-5.272 32.527 0s8.982 13.82 0 19.092"
        fill={`url(#${id}-a)`}
      />
      <path
        d="M18.669 45.698c7.224 4.296 18.938 4.296 26.162 0s7.225-11.26 0-15.556-18.938-4.296-26.162 0-7.225 11.26 0 15.556"
        fill={`url(#${id}-b)`}
      />
      <g filter={`url(#${id}-c)`}>
        <path
          d="M21.182 43.883c5.838 3.293 15.304 3.293 21.142 0 5.839-3.294 5.839-8.633 0-11.927-5.838-3.293-15.304-3.293-21.142 0s-5.838 8.634 0 11.927"
          fill="#fff"
        />
      </g>
      <path
        d="M21.182 43.883c5.838 3.293 15.304 3.293 21.142 0 5.839-3.294 5.839-8.633 0-11.927-5.838-3.293-15.304-3.293-21.142 0s-5.838 8.634 0 11.927"
        fill="#fff"
      />
      <path
        d="M54.628 27.755c-12.497-7.674-32.758-7.673-45.255 0s-12.497 20.115 0 27.788 32.758 7.673 45.255 0 12.496-20.115 0-27.788M12.15 29.598c10.962-6.468 28.736-6.468 39.698 0 10.962 6.467 10.962 16.953 0 23.42s-28.736 6.468-39.698 0c-10.961-6.467-10.961-16.953 0-23.42"
        fill={`url(#${id}-d)`}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M46.5 15.5c-.001-2.921-1.851-4.492-2.945-5.158-2.55-1.553-5.155-4.283-6.514-6.615C36.531 2.852 34.945 1 32 1s-4.531 1.853-5.041 2.726c-1.36 2.332-3.965 5.062-6.514 6.615-1.094.665-2.944 2.236-2.945 5.157v.003c.001 2.921 1.851 4.492 2.945 5.158 2.55 1.553 5.155 4.283 6.514 6.615C27.469 28.148 29.055 30 32 30s4.531-1.853 5.041-2.726c1.36-2.332 3.965-5.062 6.514-6.615 1.094-.666 2.944-2.237 2.945-5.158z"
        fill={markerColor}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M46.5 15.5c-.001-2.921-1.851-4.492-2.945-5.158-2.55-1.553-5.155-4.283-6.514-6.615C36.531 2.852 34.945 1 32 1s-4.531 1.853-5.041 2.726c-1.36 2.332-3.965 5.062-6.514 6.615-1.094.665-2.944 2.236-2.945 5.157v.003c.001 2.921 1.851 4.492 2.945 5.158 2.55 1.553 5.155 4.283 6.514 6.615C27.469 28.148 29.055 30 32 30s4.531-1.853 5.041-2.726c1.36-2.332 3.965-5.062 6.514-6.615 1.094-.666 2.944-2.237 2.945-5.158z"
        fill={`url(#${id}-e)`}
        fillOpacity=".6"
      />
      <path
        d="M38.063 13.163A4.25 4.25 0 0 0 33.81 8.91h-3.622a4.25 4.25 0 0 0-4.253 4.252v6.82h12.128z"
        fill="#fff"
      />
      <path d="M29.363 17.082h5.273v-5.273h-5.273z" fill="#000" />
      <defs>
        <linearGradient id={`${id}-a`} x1="31.754" y1="54.42" x2="31.754" y2="27.42" gradientUnits="userSpaceOnUse">
          <stop stopOpacity=".6" />
          <stop offset="1" stopOpacity=".025" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="31.75" y1="48.92" x2="31.75" y2="26.92" gradientUnits="userSpaceOnUse">
          <stop stopOpacity=".025" />
          <stop offset="1" stopOpacity=".5" />
        </linearGradient>
        <linearGradient id={`${id}-d`} x1="32" y1="61.298" x2="32" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9D62FF" />
          <stop offset="1" stopColor="#9D62FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-e`} x1="32" y1="15.5" x2="32" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <filter
          id={`${id}-c`}
          x="13.738"
          y="26.42"
          width="36.032"
          height="23"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="1.533" result="blur" />
        </filter>
      </defs>
    </svg>
  );
}

export function PedestalLocked({ className }: PedestalProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width="64" height="62" viewBox="0 0 64 62" fill="none" aria-hidden="true" className={className}>
      <path
        d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3"
        fill="#CCC"
      />
      <path
        d="M48.017 50.753c-8.982 5.33-23.545 5.33-32.527 0-8.982-5.329-8.982-13.97 0-19.299 8.983-5.33 23.545-5.33 32.527 0s8.982 13.97 0 19.3"
        fill={`url(#${id}-a)`}
      />
      <path
        d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725"
        fill={`url(#${id}-b)`}
      />
      <path
        d="M32.61 31.443q.022 0 .042.002l.199.011.378.027.098.009a20 20 0 0 1 1.617.207l.334.06.154.03q.169.035.336.073a17 17 0 0 1 .65.155l.114.032q.201.055.398.112l.06.019q.189.057.373.118l.215.073a15 15 0 0 1 .695.264q.1.039.198.081.125.054.248.11l.177.08.053.025.343.169.04.021.155.084q.117.062.232.127l.2.12q.141.084.278.171c3.99 2.567 3.832 6.494-.478 8.952a12 12 0 0 1-1.08.54l-.132.059-.288.119-.158.062-.292.11-.117.043q-.178.063-.36.121l-.048.016q-.194.063-.393.12-.03.01-.063.018a17.7 17.7 0 0 1-3.198.605l-.029.003q-.222.022-.445.04-.028 0-.055.004-.225.016-.45.028v2.013c3.487-.133 6.909-.958 9.574-2.481 5.839-3.338 5.839-8.75 0-12.087-2.665-1.524-6.087-2.35-9.574-2.482zm-1.993-2.017c-3.487.132-6.909.958-9.574 2.482-5.838 3.337-5.838 8.75 0 12.087 2.665 1.523 6.087 2.348 9.574 2.48v-2.012c-2.593-.128-5.124-.757-7.108-1.888-4.476-2.552-4.476-6.691 0-9.243 1.984-1.132 4.515-1.761 7.108-1.89z"
        fill="#000"
        fillOpacity=".4"
      />
      <path
        opacity=".5"
        d="M18.669 45.933c7.224 4.343 18.938 4.343 26.162 0 7.225-4.342 7.225-11.382 0-15.725-7.224-4.342-18.938-4.342-26.162 0-7.225 4.343-7.225 11.383 0 15.725"
        fill={`url(#${id}-c)`}
      />
      <defs>
        <linearGradient id={`${id}-a`} x1="31.754" y1="54.751" x2="31.754" y2="27.457" gradientUnits="userSpaceOnUse">
          <stop stopOpacity=".6" />
          <stop offset="1" stopOpacity=".025" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse">
          <stop stopOpacity=".025" />
          <stop offset="1" stopOpacity=".5" />
        </linearGradient>
        <linearGradient id={`${id}-c`} x1="31.75" y1="49.19" x2="31.75" y2="26.951" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff" stopOpacity=".026" />
        </linearGradient>
      </defs>
    </svg>
  );
}
