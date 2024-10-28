/// <reference types="vitest" />
import { loadEnv, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { coverageConfigDefaults } from "vitest/config";

export default defineConfig(({ mode }) => {
  return {
    plugins: [tsconfigPaths()],
    test: {
      globals: true,
      env: loadEnv(mode, process.cwd(), ""),
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
  };
});
