import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** One-off tools that read the compiled catalogue (e.g. the review report). Not part of the test suite. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["tests/tools/**/*.ts"], environment: "node" },
});
