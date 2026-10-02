import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const fixture = path.join(root, "tests/fixtures/build-parity.json");
const hashedFiles = [
  "search.json",
  "rss.xml",
  "og-image/blog/develop/oneliner-avifenc.png",
];
const hash = (value) => createHash("sha256").update(value).digest("hex");

async function routes(dir = dist, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const relative = path.posix.join(prefix, entry.name);
      if (entry.isDirectory())
        return routes(path.join(dir, entry.name), relative);
      return entry.name.endsWith(".html") ? [relative] : [];
    }),
  );
  return paths.flat();
}

async function snapshot() {
  const pageRoutes = (await routes()).sort();
  for (const directory of ["projects", "og-image/projects"]) {
    assert.equal(
      await stat(path.join(dist, directory)).then(
        () => true,
        (error) => {
          if (error.code === "ENOENT") return false;
          throw error;
        },
      ),
      false,
      `Private projects leaked into dist/${directory}`,
    );
  }
  const publicFiles = [
    ...pageRoutes,
    "rss.xml",
    "search.json",
    "sitemap-0.xml",
  ];
  for (const file of publicFiles) {
    assert.doesNotMatch(
      await readFile(path.join(dist, file), "utf8"),
      /(?:href=["'][^"']*|<link>[^<]*|<loc>[^<]*|"url"\s*:\s*")[/]projects(?:[/"'<]|$)/,
      `Private project link in ${file}`,
    );
  }
  const files = Object.fromEntries(
    await Promise.all(
      hashedFiles.map(async (file) => [
        file,
        hash(await readFile(path.join(dist, file))),
      ]),
    ),
  );
  const articles = Object.fromEntries(
    await Promise.all(
      pageRoutes
        .filter(
          (file) => file.startsWith("blog/") && file.endsWith("index.html"),
        )
        .map(async (file) => {
          const html = await readFile(path.join(dist, file), "utf8");
          const article = html.match(
            /<article\b[^>]*>[\s\S]*?<\/article>/,
          )?.[0];
          assert.ok(article, `Missing article in ${file}`);
          return [
            file,
            hash(article.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")),
          ];
        }),
    ),
  );
  return { routes: pageRoutes, files, articles };
}

const current = await snapshot();
if (process.argv.includes("--record")) {
  await mkdir(path.dirname(fixture), { recursive: true });
  await writeFile(fixture, `${JSON.stringify(current, null, 2)}\n`);
  console.log(
    `Recorded ${current.routes.length} HTML routes, ${hashedFiles.length} files, and ${Object.keys(current.articles).length} articles.`,
  );
} else {
  const expected = JSON.parse(await readFile(fixture, "utf8"));
  assert.deepEqual(current, expected);
  console.log(
    `Parity check passed: ${current.routes.length} HTML routes, ${hashedFiles.length} files, and ${Object.keys(current.articles).length} articles.`,
  );
}
