/**
 * Icons from brilliant.org's authenticated app shell.
 *
 * Every path below is copied verbatim out of the live DOM — no redraws, no
 * substitutions from an icon library. Note the inconsistent viewBoxes
 * (16, 17, 24, 19x25): the original ships them that way and normalising them
 * would shift the glyphs inside their 16px boxes, so they are preserved.
 */

export interface AppIconProps {
  className?: string;
  size?: number;
}

/** Brilliant wordmark. 114x27 viewBox, drawn at 114x24 in the header. */
export function BrilliantWordmark({ className }: { className?: string }) {
  return (
    <svg
      width="114"
      height="27"
      viewBox="0 0 114 27"
      fill="none"
      role="img"
      aria-label="Brilliant"
      className={className}
    >
      <path d="M39.6614 0H35.8083V3.84981H39.6614V0Z" fill="currentColor" />
      <path
        d="M26.2288 9.53622H25.84V7.52301H21.9869V26.4895H25.84V16.2822C25.84 12.9622 27.8548 10.843 31.0009 10.843H33.546V7.52301H30.8948C28.9153 7.52301 27.36 8.19408 26.2288 9.53622Z"
        fill="currentColor"
      />
      <path d="M39.6614 7.52301H35.8083V26.4895H39.6614V7.52301Z" fill="currentColor" />
      <path
        d="M16.6493 11.9168C18.018 10.7533 18.8056 8.9962 18.8056 6.99324C18.8056 3.03747 15.7302 0 11.9833 0H0V26.4895H15.7302L19.0177 23.2402V14.5516L16.6493 12.2873V11.9171V11.9168ZM3.85302 3.35534H11.347C13.4679 3.35534 15.1293 4.98003 15.1293 7.06388C15.1293 9.14772 13.4679 10.8077 11.347 10.8077H3.85302V3.35534ZM15.0233 23.1342H3.85302V14.1984H15.0233V23.1342Z"
        fill="currentColor"
      />
      <path
        d="M78.4744 9.39498H78.0856C76.2828 7.98221 74.3032 7.27582 72.1116 7.27582C66.5618 7.27582 62.1786 11.5495 62.1786 17.1299C62.1786 22.7104 66.3144 26.7368 71.9702 26.7368C74.3739 26.7368 76.3888 25.9951 78.0856 24.6176H78.4744V26.4896H82.3274V7.52305H78.4744V9.39498ZM72.1823 23.4168C68.6121 23.4168 65.7488 20.5912 65.7488 16.9887C65.7488 13.3861 68.6121 10.5958 72.1823 10.5958C75.7525 10.5958 78.5805 13.4214 78.5805 16.9887C78.5805 20.5559 75.7525 23.4168 72.1823 23.4168Z"
        fill="currentColor"
      />
      <path
        d="M85.1199 7.52301V26.4895H88.9729V10.8784H97.3152V26.4895H101.168V10.7018L97.9868 7.52301H85.1199Z"
        fill="currentColor"
      />
      <path d="M60.0576 0H56.2046V3.84981H60.0576V0Z" fill="currentColor" />
      <path d="M46.4838 0H42.5601V26.4895H46.4838V0Z" fill="currentColor" />
      <path
        d="M114 10.8431V7.52305H107.779V2.08386H103.926V22.4985C103.926 24.7589 105.622 26.4896 107.885 26.4896H114V23.1342H107.779V10.8431H114Z"
        fill="currentColor"
      />
      <path d="M60.0576 7.52301H56.2046V26.4895H60.0576V7.52301Z" fill="currentColor" />
      <path d="M53.306 0H49.3823V26.4895H53.306V0Z" fill="currentColor" />
    </svg>
  );
}

/** Nav: Home. */
export function NavHomeIcon({ className, size = 16 }: AppIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.86768 1.19904C8.36836 0.771054 7.63156 0.771055 7.13224 1.19904L1.13224 6.3419C0.83671 6.59521 0.666626 6.96501 0.666626 7.35424V14.6667C0.666626 15.403 1.26358 16 1.99996 16L6.33333 16H9.66667L14 16C14.7331 16 15.3333 15.4087 15.3333 14.6691V7.35298C15.3333 6.96239 15.1622 6.59432 14.8677 6.3419L8.86768 1.19904ZM10.6667 14.6667H14V7.35424L7.99996 2.21139L1.99996 7.35424V14.6667H5.33333V10.3333C5.33333 9.78105 5.78105 9.33333 6.33333 9.33333H9.66667C10.219 9.33333 10.6667 9.78105 10.6667 10.3333V14.6667ZM6.66667 14.6667H9.33333V10.6667H6.66667V14.6667Z"
        fill="currentcolor"
      />
    </svg>
  );
}

/** Nav: Courses. Ships on a 17x17 viewBox. */
export function NavCoursesIcon({ className, size = 16 }: AppIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 17" fill="currentcolor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.68251 2.87297C5.00079 1.40536 6.48945 0.508958 7.93546 0.914182L14.5221 2.75999C15.8941 3.14447 16.7215 4.5396 16.4008 5.9279L14.88 12.5116C14.7972 12.8703 14.4392 13.094 14.0804 13.0111C13.7217 12.9282 13.498 12.5702 13.5809 12.2115L15.1016 5.62782C15.262 4.93367 14.8483 4.2361 14.1623 4.04386L7.57568 2.19806C6.86883 1.99997 6.14114 2.43816 5.98555 3.15556C5.90752 3.51538 5.55256 3.74382 5.19273 3.66578C4.83291 3.58775 4.60447 3.23279 4.68251 2.87297Z"
        fill="currentcolor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 6.33337C0 5.2288 0.895431 4.33337 2 4.33337H10.6667C11.7712 4.33337 12.6667 5.2288 12.6667 6.33337V15C12.6667 16.1046 11.7712 17 10.6667 17H2C0.895431 17 0 16.1046 0 15V6.33337ZM2 5.66671C1.63181 5.66671 1.33333 5.96518 1.33333 6.33337V15C1.33333 15.3682 1.63181 15.6667 2 15.6667H10.6667C11.0349 15.6667 11.3333 15.3682 11.3333 15V6.33337C11.3333 5.96518 11.0349 5.66671 10.6667 5.66671H2Z"
        fill="currentcolor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.33326 13.2618L3.19519 11.1238L4.138 10.1809L5.33326 11.3762L8.19519 8.51428L9.138 9.45709L5.33326 13.2618Z"
        fill="currentcolor"
      />
    </svg>
  );
}

/** Nav: You. Ships on a 24x24 viewBox. */
export function NavYouIcon({ className, size = 16 }: AppIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentcolor" aria-hidden="true" className={className}>
      <path
        d="M4.12073 23.5901C2.04024 23.5901 1 22.9108 1 21.5521C1 20.7199 1.25475 19.8325 1.76426 18.8899C2.27377 17.9474 3.0083 17.06 3.96787 16.2278C4.93594 15.3871 6.10355 14.7035 7.47073 14.177C8.8464 13.6505 10.4004 13.3873 12.1327 13.3873C13.8565 13.3873 15.402 13.6505 16.7692 14.177C18.1449 14.7035 19.3125 15.3871 20.2721 16.2278C21.2401 17.06 21.9789 17.9474 22.4884 18.8899C22.9979 19.8325 23.2527 20.7199 23.2527 21.5521C23.2527 22.9108 22.2124 23.5901 20.132 23.5901H4.12073ZM3.52206 21.6668H20.7434C20.9047 21.6668 21.0194 21.6413 21.0873 21.5903C21.1637 21.5394 21.2019 21.446 21.2019 21.3101C21.2019 20.7836 21.0024 20.1807 20.6033 19.5014C20.2126 18.822 19.6309 18.1639 18.8582 17.527C18.0854 16.8901 17.1344 16.3636 16.005 15.9475C14.884 15.523 13.5933 15.3107 12.1327 15.3107C10.6721 15.3107 9.37713 15.523 8.24773 15.9475C7.11832 16.3636 6.16724 16.8901 5.39449 17.527C4.62174 18.1639 4.03581 18.822 3.6367 19.5014C3.24607 20.1807 3.05076 20.7836 3.05076 21.3101C3.05076 21.446 3.08473 21.5394 3.15266 21.5903C3.22909 21.6413 3.35222 21.6668 3.52206 21.6668ZM12.1327 11.7951C11.1222 11.7951 10.2008 11.5276 9.36864 10.9926C8.53645 10.4576 7.86984 9.74006 7.36883 8.83993C6.87631 7.93131 6.63005 6.93353 6.63005 5.84658C6.63005 4.76813 6.87631 3.78733 7.36883 2.90419C7.86984 2.02104 8.53645 1.31622 9.36864 0.789734C10.2008 0.263244 11.1222 0 12.1327 0C13.1517 0 14.0773 0.258999 14.9095 0.776997C15.7417 1.295 16.4041 1.99557 16.8966 2.87871C17.3891 3.75336 17.6354 4.73416 17.6354 5.82111C17.6354 6.91655 17.3849 7.91858 16.8839 8.8272C16.3913 9.72732 15.729 10.4491 14.8968 10.9926C14.0646 11.5276 13.1432 11.7951 12.1327 11.7951ZM12.1327 9.87169C12.7611 9.87169 13.3343 9.69336 13.8523 9.3367C14.3788 8.97156 14.7991 8.48328 15.1133 7.87187C15.4275 7.25197 15.5846 6.56839 15.5846 5.82111C15.5846 5.08233 15.4275 4.41997 15.1133 3.83404C14.8076 3.23961 14.3915 2.77256 13.865 2.43289C13.347 2.09322 12.7696 1.92339 12.1327 1.92339C11.5043 1.92339 10.9269 2.09747 10.4004 2.44563C9.88239 2.7853 9.4663 3.25235 9.1521 3.84677C8.83791 4.4412 8.68081 5.1078 8.68081 5.84658C8.68081 6.59386 8.83791 7.2732 9.1521 7.88461C9.47479 8.49602 9.89513 8.98005 10.4131 9.3367C10.9396 9.69336 11.5128 9.87169 12.1327 9.87169Z"
        fill="currentcolor"
      />
    </svg>
  );
}

/** Header hamburger. Three 2px bars on a 16x16 box. */
export function MenuIcon({ className, size = 16 }: AppIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M16 4H0V2H16V4Z" fill="currentColor" />
      <path d="M16 9H0V7H16V9Z" fill="currentColor" />
      <path d="M0 14H16V12H0V14Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Streak bolt, app-shell variant. 19x25 viewBox. The original drives fill and
 * stroke from three custom properties keyed off `data-completed`:
 *
 *   false -> fill bg.primary,  stroke border.primary, stroke-width 2
 *   true  -> fill pear.500,    stroke none,           stroke-width 0
 *
 * It also transitions `stroke, stroke-width, stroke-opacity, fill` at `lg`.
 */
export function StreakBolt({
  className,
  size = 24,
  completed = false,
}: AppIconProps & { completed?: boolean }) {
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
        fill={completed ? "currentColor" : "var(--color-b-bg)"}
        stroke={completed ? "none" : "currentColor"}
        strokeWidth={completed ? 0 : 2}
      />
    </svg>
  );
}
