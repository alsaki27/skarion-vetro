import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      include: ["src/lib/grading/**", "src/lib/geometry/**", "src/lib/types.ts"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    env: {
      JWT_SECRET: "test-secret-at-least-32-characters-long-for-vitest",
      DATABASE_URL: "postgres://test:test@localhost:5432/test_skarion",
      NEON_DATABASE_URL: "postgres://test:test@localhost:5432/test_skarion",
      R2_ACCOUNT_ID: "test-account",
      R2_ACCESS_KEY: "test-access-key",
      R2_SECRET_KEY: "test-secret-key",
      R2_BUCKET: "test-bucket",
    },
  },
});
