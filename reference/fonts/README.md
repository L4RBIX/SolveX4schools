# Reference fonts — NOT for deployment

CoFo Brilliant and CoFo Robert, extracted from brilliant.org during the
reverse-engineering phase. They are **commercially licensed by Contrast Foundry**
and this project holds no licence for them.

They are here, outside `public/`, for one reason: `src/app/brilliant/layout.tsx`
renders the measurement baseline in the real faces so visual regressions can be
compared against the original. That layout `notFound()`s when
`NODE_ENV === "production"`, so a production build emits no `@font-face` for
them and serves no file.

Do not move these back under `public/`. Anything in `public/` is served at its
own URL whether or not a page links it.

The product's own type is IBM Plex Sans + JetBrains Mono (both SIL OFL, both
carrying the Kazakh Cyrillic set), declared in `src/app/layout.tsx`.
See `docs/THIRD_PARTY_ASSETS.md`.
