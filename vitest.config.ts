import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "tests/e2e/**"],
    setupFiles: ["tests/setup.ts"],
    env: {
      JWT_SECRET: "test-secret-at-least-32-characters-long-for-vitest",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@test": path.resolve(__dirname, "tests"),
    },
  },
});
