import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
      exclude: ["tests/e2e/**", "**/node_modules/**"],
    },
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
  },
});
