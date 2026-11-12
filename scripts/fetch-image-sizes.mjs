// 記事で使っている画像の実寸を調べて .cache/image-sizes.json に記録する。
// 記録済みの画像は取得しないので、通常のビルドではネットワークを使わない。
// 取得に失敗してもビルドは止めない (その画像に寸法が付かないだけ)。
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { IMAGE_SIZE_CACHE, imageUrls, readImageSizes } from "./image-sizes.mjs";
import { listMarkdownFiles } from "./post-files.mjs";

const CONCURRENCY = 6;
const TIMEOUT_MS = 15_000;

const files = await listMarkdownFiles(path.resolve("src/content"));
const urls = new Set();
for (const file of files) {
  for (const url of imageUrls(await readFile(file, "utf8"))) urls.add(url);
}

const cached = readImageSizes();
const missing = [...urls].filter((url) => !cached[url]);
const failed = [];

async function measure(url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { width, height, orientation } = await sharp(
      Buffer.from(await response.arrayBuffer()),
    ).metadata();
    if (!width || !height) throw new Error("寸法を読み取れない");
    // EXIF で 90 度回転している画像は、表示上の縦横が入れ替わる。
    cached[url] = (orientation ?? 1) >= 5 ? [height, width] : [width, height];
  } catch (error) {
    failed.push(`${url}: ${error.message}`);
  }
}

const queue = [...missing];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await measure(queue.shift());
  }),
);

// 記事から消えた画像の記録は捨て、差分が読みやすいように並べる。
const next = Object.fromEntries(
  [...urls]
    .filter((url) => cached[url])
    .sort()
    .map((url) => [url, cached[url]]),
);
if (JSON.stringify(next) !== JSON.stringify(readImageSizes())) {
  await writeFile(IMAGE_SIZE_CACHE, `${JSON.stringify(next, null, "\t")}\n`);
}
console.log(
  `Image sizes: ${Object.keys(next).length} recorded, ${missing.length - failed.length} fetched, ${failed.length} failed.`,
);
for (const message of failed.slice(0, 5)) console.warn(`  skipped ${message}`);
if (failed.length > 5) console.warn(`  ...and ${failed.length - 5} more`);
