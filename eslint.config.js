import globals from "globals";
// import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
// import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { files: ["src/**"] },
  { languageOptions: { globals: globals.browser } },
  // pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  eslintPluginPrettierRecommended,
  // eslintConfigPrettier
);
