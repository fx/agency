import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/e2e/**/*.test.ts"],
    timeout: 30000, // 30s for API calls
    testTimeout: 30000,
    setupFiles: ["dotenv/config"],
  },
});