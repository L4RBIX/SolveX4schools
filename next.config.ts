import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Standalone everywhere EXCEPT Vercel.
   *
   * `standalone` exists for the Docker path: it emits a self-contained Node
   * server, which is what an on-disk PGlite database and an in-process reducer
   * interval both need, and what data residency forces. See the comment on
   * `serverExternalPackages` below — the two are halves of one decision.
   *
   * Vercel does not want it. It builds its own serverless output and its
   * post-build step reads `.next/next-server.js.nft.json`, a trace manifest
   * that a standalone build does not emit. The deployment therefore compiled
   * 161/161 pages and then died with `ENOENT` on that file, which reads as a
   * missing artefact rather than as two build modes disagreeing.
   *
   * `VERCEL` is set by the platform in every build and at runtime, so this is
   * off exactly where it must be and on everywhere else. Nothing the app does
   * at runtime depends on it: `LEARNING_SWEEP_IN_PROCESS=false` is what makes
   * the sweep request-driven on serverless, and PGlite is unused wherever
   * `DATABASE_URL` is set.
   */
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),

  /**
   * PGlite must not be bundled.
   *
   * It ships Postgres as WebAssembly plus a node filesystem shim that resolves
   * its own assets from `import.meta.url`. Bundled, those resolutions arrive as
   * URL objects where a path string is expected, and the failure surfaces as
   * `ERR_INVALID_ARG_TYPE` from deep inside the package with no frame naming
   * either our code or the data directory — it reads as a bundler bug rather
   * than a configuration one.
   *
   * `output: "standalone"` above is the other half of the same decision: the
   * app runs as a long-running Node process, which is what an on-disk database
   * and an in-process reducer interval both need.
   */
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    root: __dirname,
  },

  /**
   * Headers, and the two different jobs they do here.
   *
   * ## The toolchain, cached forever
   *
   * `public/cpp17/*` is 57 MB of pinned compiler, and it was served with
   * `public, max-age=0, must-revalidate` — the Next default for `public/`. So
   * every cache eviction, every new day on a school laptop that clears
   * aggressively, meant downloading 57 MB again to run one `cout`.
   *
   * `immutable` is only honest if the URL changes when the bytes do, and it
   * does: the worker appends `?v=<pinned commit>` — see
   * `src/lib/cpp17/assets.ts`. The filenames never move; the commit does, and
   * re-pinning the toolchain invalidates every cache in the pilot without a
   * directory rename.
   *
   * ## Security headers, which were entirely absent
   *
   * No CSP, no `frame-ancestors`, no `nosniff`, no referrer policy — measured
   * live on production, where the only header present was HSTS. Each below is
   * one specific thing a school-facing product should not be missing:
   *
   *   - `frame-ancestors 'none'` — nobody may put a class of children's
   *     dashboards inside their own page.
   *   - `X-Content-Type-Options: nosniff` — a `.wasm` served with the wrong
   *     type must fail rather than be guessed at, and a learner's uploaded text
   *     must never be sniffed into HTML.
   *   - `Referrer-Policy: strict-origin-when-cross-origin` — a lesson URL
   *     names a child's position in the course; it does not travel to the font
   *     host.
   *   - `Permissions-Policy` — this product needs no camera, microphone or
   *     geolocation, and saying so is free.
   *
   * The CSP is deliberately NOT `script-src 'self'` alone: Next's App Router
   * injects inline bootstrap scripts, and a policy that breaks the app is a
   * policy somebody removes. `'unsafe-inline'` for scripts is what the
   * framework needs today; everything else is closed, and `connect-src` is
   * `'self'` because the browser must never talk to the judge or to DeepSeek
   * — both are server-side, and this is the line that says so out loud.
   */
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "form-action 'self'",
          /* Next injects inline bootstrap and flight-data scripts. `wasm-unsafe-eval`
             is what lets the browser compile the C++ toolchain at all. */
          "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
          /* Tailwind's generated styles and Next's inlined critical CSS. */
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "media-src 'self'",
          /* Same origin only. The judge and the model are reached from the
             server; a browser that could talk to either would be a finding. */
          "connect-src 'self'",
          "worker-src 'self' blob:",
          "manifest-src 'self'",
        ].join("; "),
      },
    ];

    return [
      { source: "/:path*", headers: security },
      {
        source: "/cpp17/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ...security,
        ],
      },
    ];
  },
};

export default nextConfig;
