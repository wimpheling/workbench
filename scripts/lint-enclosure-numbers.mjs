import { readFile } from "node:fs/promises";

// Oxc runs the general TypeScript lint suite. Its current configuration format
// does not load repository-local JavaScript rules, so this small source guard is
// deliberately run as part of `npm run lint`. It protects the active
// EnclosureV2 evaluator while leaving mathematical identities (0 and 1) clear.
const sourcePath = new URL("../src/domain/enclosureV2.ts", import.meta.url);
const sourceText = await readFile(sourcePath, "utf8");
const allowed = new Set(["0", "1"]);
const violations = [];
const executable = sourceText
  .replace(/\/\*[\s\S]*?\*\//g, (value) => value.replace(/[^\n]/g, " "))
  .replace(/\/\/[^\n]*/g, (value) => " ".repeat(value.length))
  .replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, (value) => " ".repeat(value.length));

for (const match of executable.matchAll(/(?<![\w.])\d+(?:\.\d+)?/g)) {
  if (allowed.has(match[0])) continue;
  const prefix = executable.slice(0, match.index);
  const line = prefix.split("\n").length;
  const character = prefix.length - prefix.lastIndexOf("\n");
  violations.push(`${sourcePath.pathname}:${line}:${character}: ${match[0]}`);
}

if (violations.length) {
  console.error(
    "EnclosureV2 evaluator contains unnamed numeric literals:\n" + violations.join("\n"),
  );
  console.error(
    "Move engineering values to enclosureV2Standards.ts or stakeholder values to EnclosureV2Variables.",
  );
  process.exitCode = 1;
}
