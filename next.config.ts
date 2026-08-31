import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

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
