import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";

export default defineConfig({
  // Keep local development at the origin root; Pages supplies its subpath in CI.
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [solid()],
  resolve: {
    conditions: ["module", "browser", "development"],
  },
  lint: {
    ignorePatterns: ["legacy/**"],
  },
  fmt: {
    ignorePatterns: ["CAD_ROADMAP.md", "legacy/**"],
  },
});
