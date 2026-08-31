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
};

export default nextConfig;
