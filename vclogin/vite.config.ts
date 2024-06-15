/// <reference types="vitest" />
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    setupFiles: ["./__tests__/unit/testSetupFile.ts"],
    include: ["**/__tests__/**/*.test.ts"],
  },
});
