import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./post-frontmatter.mjs";

// 記事の URL パス (/blog/<id>/) → 公開日。サイトマップの lastmod に使う。
// id は Astro の glob ローダーと同じく、拡張子を除いた相対パスを小文字にしたもの。
// 下書きと archive/ 配下の記事は含めない。
export function readPostDates(root = path.resolve("src/content/blog")) {
  const dates = new Map();
  for (const file of readdirSync(root, { recursive: true })) {
    if (!/\.mdx?$/.test(file) || file.split(path.sep).includes("archive")) {
      continue;
    }
    const data = parseFrontmatter(readFileSync(path.join(root, file), "utf8"));
    const date = new Date(data.date);
    if (data.draft === "true" || Number.isNaN(date.valueOf())) continue;
    const id = file
      .replace(/\.mdx?$/, "")
      .split(path.sep)
      .join("/")
      .toLowerCase();
    dates.set(`/blog/${id}/`, date);
  }
  return dates;
}
