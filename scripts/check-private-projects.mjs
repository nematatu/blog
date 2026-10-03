import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const dist = path.resolve(import.meta.dirname, "../dist");
const files = await readdir(dist, { recursive: true });
assert.ok(
  files.every((file) => !/^(?:og-image\/)?projects(?:\/|$)/.test(file)),
  "Private project pages or OG images leaked into dist",
);
for (const file of files.filter((file) => /\.(?:html|xml|json)$/.test(file))) {
  assert.doesNotMatch(
    await readFile(path.join(dist, file), "utf8"),
    /(?:href=["'][^"']*|<link>[^<]*|<loc>[^<]*|"url"\s*:\s*")[/]projects(?:[/?#"'<]|$)/,
    `Private project link in ${file}`,
  );
}
console.log(
  "Projects privacy check passed: no public pages, OG images or links.",
);
