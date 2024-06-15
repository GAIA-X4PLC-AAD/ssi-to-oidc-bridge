/// <reference types="vitest" />
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    setupFiles: ["./__tests__/unit/testSetupFile.ts"],
    include: ["**/__tests__/**/*.test.ts"],
    coverage: {
      exclude: [
        "*.config.?(c|m)[jt]s",
        "pages/*.tsx",
        "pages/common/*.tsx",
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
