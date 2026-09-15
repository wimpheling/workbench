import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["engineering/**/*.test.ts"] },
});
