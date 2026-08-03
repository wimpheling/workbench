import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";

export default defineConfig({
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
