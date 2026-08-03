import { readFile } from "node:fs/promises";

const html = await readFile("dist/index.html", "utf8");
const assetUrls = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map(
  ([, url]) => url,
);

if (assetUrls.length === 0) {
  throw new Error("dist/index.html does not reference a generated asset");
}

const invalidUrls = assetUrls.filter((url) => !url.startsWith("/workbench/assets/"));
if (invalidUrls.length > 0) {
  throw new Error(
    `GitHub Pages asset URLs must start with /workbench/assets/: ${invalidUrls.join(", ")}`,
  );
}

console.log(`Verified ${assetUrls.length} GitHub Pages asset URL(s) in dist/index.html`);
