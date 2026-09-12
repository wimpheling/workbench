import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
export default defineConfig({
  plugins: [solid()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  server: { proxy: { "/api": "http://127.0.0.1:8000" } },
  build: { chunkSizeWarningLimit: 900 },
});
