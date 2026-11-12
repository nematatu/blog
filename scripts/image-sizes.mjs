import { readFileSync } from "node:fs";
import path from "node:path";

// 本文画像の実寸のキャッシュ。scripts/fetch-image-sizes.mjs が更新し、
// rehype-image-size.js がビルド時に width / height として埋め込む。
export const IMAGE_SIZE_CACHE = path.resolve(".cache/image-sizes.json");
// 実寸を調べる画像のホスト。自分で管理している配信元だけにする。
export const IMAGE_HOSTS = new Set(["assets.blog.amatatu.com"]);

export function readImageSizes(file = IMAGE_SIZE_CACHE) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

// Markdown 本文から、実寸を調べる対象の画像 URL を取り出す。
export function imageUrls(markdown) {
  const urls = new Set();
  for (const [, url] of markdown.matchAll(/!\[[^\]]*]\(\s*<?([^)\s>]+)/g)) {
    if (URL.canParse(url) && IMAGE_HOSTS.has(new URL(url).hostname)) {
      urls.add(url);
    }
  }
  return [...urls];
}
