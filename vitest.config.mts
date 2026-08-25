import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The three package aliases. In the destination repo these become real
// workspace packages (or plain relative paths); nothing in the source depends
// on which you choose.
export default defineConfig({
  resolve: {
    alias: {
      "@solvex/learning-contracts": r("./packages/learning-contracts/src/index.ts"),
      "@solvex/learning-intelligence-core": r("./packages/learning-intelligence-core/src/index.ts"),
      "@solvex/nova-core": r("./packages/nova-core/src/index.ts"),
      // School code. Mirrors the `@schools/*` path alias in tsconfig.json.
      "@schools": r("./schools"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
