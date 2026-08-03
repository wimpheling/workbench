import { readFile } from "node:fs/promises";

const workflows = {
  ci: await readFile(".github/workflows/ci.yml", "utf8"),
  pages: await readFile(".github/workflows/pages.yml", "utf8"),
};

const requireText = (name, text, pattern, description) => {
  if (!pattern.test(text)) {
    throw new Error(`${name}: missing ${description}`);
  }
};

for (const [name, text] of Object.entries(workflows)) {
  requireText(name, text, /node-version:\s*24\b/, "Node 24 setup");
  requireText(name, text, /run:\s*npm ci\b/, "npm ci");
  requireText(name, text, /run:\s*npm run check\b/, "check step");
  requireText(name, text, /run:\s*npm test\b/, "test step");
  requireText(
    name,
    text,
    /run:\s*(?:VITE_BASE_PATH=\/workbench\/\s+)?npm run build\b/,
    "build step",
  );
}

requireText("ci", workflows.ci, /contents:\s*read\b/, "read-only contents permission");
requireText(
  "ci",
  workflows.ci,
  /frame3dd-optional:[\s\S]*?continue-on-error:\s*true/,
  "non-blocking Frame3DD job",
);

requireText("pages", workflows.pages, /pages:\s*write\b/, "Pages write permission");
requireText("pages", workflows.pages, /id-token:\s*write\b/, "OIDC permission");
requireText(
  "pages",
  workflows.pages,
  /uses:\s*actions\/upload-pages-artifact@v3/,
  "Pages artifact upload",
);
requireText("pages", workflows.pages, /path:\s*dist\b/, "dist artifact path");
requireText("pages", workflows.pages, /uses:\s*actions\/deploy-pages@v4/, "Pages deployment");
requireText(
  "pages",
  workflows.pages,
  /run:\s*VITE_BASE_PATH=\/workbench\/ npm run build\b/,
  "Pages base path build setting",
);

console.log(
  "Workflow semantic checks passed (CI, Pages, Node 24, dist artifact, Frame3DD policy).",
);
