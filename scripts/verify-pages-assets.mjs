import { readFile } from "node:fs/promises";

const html = await readFile("dist/index.html", "utf8");
const expectedBasePath = process.env.VITE_BASE_PATH || "/";
const normalizedBasePath = expectedBasePath.endsWith("/")
  ? expectedBasePath
  : `${expectedBasePath}/`;
const assetUrls = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map(
  ([, url]) => url,
);

if (assetUrls.length === 0) {
  throw new Error("dist/index.html does not reference a generated asset");
}

const invalidUrls = assetUrls.filter((url) => !url.startsWith(`${normalizedBasePath}assets/`));
if (invalidUrls.length > 0) {
  throw new Error(
    `Asset URLs must start with ${normalizedBasePath}assets/: ${invalidUrls.join(", ")}`,
  );
}

console.log(
  `Verified ${assetUrls.length} asset URL(s) with base path ${normalizedBasePath} in dist/index.html`,
);
