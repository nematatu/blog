import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type Dimensions = { width: number; height: number };
type CacheEntry = Dimensions & { checkedAt: number };
const cachePath = path.resolve(".astro/gallery-image-dimensions.json");
const maxAge = 7 * 24 * 60 * 60 * 1000;

// Reserve each photo's real aspect ratio before lazy images load. Cache metadata
// only; a temporarily unavailable image can still recover in the browser.
export async function getGalleryImageDimensions(sources: string[]) {
  const cache: Record<string, CacheEntry> = await readFile(cachePath, "utf8")
    .then(JSON.parse)
    .catch(() => ({}));
  const dimensions = new Map<string, Dimensions>();
  const pending = [...new Set(sources)];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (cursor < pending.length) {
        const src = pending[cursor++];
        const cached = cache[src];
        if (cached && Date.now() - cached.checkedAt < maxAge) {
          dimensions.set(src, cached);
          continue;
        }
        try {
          let input: Buffer | string;
          if (/^https?:\/\//i.test(src)) {
            const response = await fetch(src, {
              signal: AbortSignal.timeout(10000),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            input = Buffer.from(await response.arrayBuffer());
          } else {
            const publicRoot = path.resolve("public");
            input = path.resolve(
              publicRoot,
              `.${new URL(src, "https://blog.amatatu.com").pathname}`,
            );
            if (!input.startsWith(`${publicRoot}${path.sep}`)) continue;
          }
          const metadata = await sharp(input).metadata();
          const { width, height } = metadata.autoOrient;
          if (width > 0 && height > 0) {
            dimensions.set(src, { width, height });
            cache[src] = { width, height, checkedAt: Date.now() };
          }
        } catch {
          if (cached) dimensions.set(src, cached);
        }
      }
    }),
  );
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify(cache)).catch(() => {});
  return dimensions;
}
