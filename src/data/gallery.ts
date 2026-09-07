import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export type GalleryPhoto = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  articleDate: string;
  articleHref: string;
  articleTitle: string;
};

const BLOG_ROOT = path.join(process.cwd(), "src", "content", "blog");
const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^\s)]+)(?:\s+[^)]*)?\)/g;
const HTML_IMAGE_PATTERN = /<img\b[^>]*?src=["']([^"']+)["'][^>]*>/gi;
const SUPPORTED_FILE = /\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/i;

function contentFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? contentFiles(entryPath)
      : /\.(?:md|mdx)$/.test(entry.name)
        ? [entryPath]
        : [];
  });
}

function frontmatterValue(source: string, key: string) {
  return source
    .match(new RegExp(`^${key}:\\s*["']?([^\\n"']+)`, "m"))?.[1]
    ?.trim();
}

function imageTitle(url: string, alt: string, index: number) {
  if (alt.trim()) return alt.trim();
  const filename = decodeURIComponent(url.split(/[/?]/).pop() ?? "");
  const name = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return name || `Image ${index + 1}`;
}

function articleHref(filePath: string) {
  const relative = path.relative(BLOG_ROOT, filePath).replace(/\\/g, "/");
  return `/blog/${relative.replace(/\.(?:md|mdx)$/, "")}`;
}

function sourceImages(source: string) {
  const images: { alt: string; url: string }[] = [];
  for (const match of source.matchAll(IMAGE_PATTERN)) {
    images.push({ alt: match[1], url: match[2] });
  }
  for (const match of source.matchAll(HTML_IMAGE_PATTERN)) {
    images.push({ alt: "", url: match[1] });
  }
  return images;
}

function isRenderableImageUrl(url: string) {
  return (
    SUPPORTED_FILE.test(url) &&
    /^(https?:)?\/\//i.test(url) &&
    !url.includes("example.com")
  );
}

const articles = contentFiles(BLOG_ROOT)
  .map((filePath) => {
    const source = readFileSync(filePath, "utf8");
    return {
      filePath,
      source,
      title: frontmatterValue(source, "title") ?? "Blog",
      dateText: frontmatterValue(source, "date") ?? "",
      date: new Date(frontmatterValue(source, "date") ?? 0).valueOf(),
      draft: /^draft:\s*true\s*$/m.test(source),
    };
  })
  .filter((article) => !article.draft)
  .sort(
    (a, b) =>
      b.date - a.date ||
      articleHref(a.filePath).localeCompare(articleHref(b.filePath), "en"),
  );

export const galleryPhotos = articles.flatMap(
  ({ filePath, source, title: articleTitle, dateText: articleDate }) => {
    const href = articleHref(filePath);
    return sourceImages(source).flatMap(({ alt, url }, index) => {
      if (!isRenderableImageUrl(url)) return [];

      const title = imageTitle(url, alt, index);
      return [
        {
          id: `${href}-${index}`
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-|-$/g, ""),
          src: url,
          width: 1200,
          height: 800,
          alt: alt.trim() || `${articleTitle}の画像: ${title}`,
          title,
          articleDate,
          articleHref: href,
          articleTitle,
        } satisfies GalleryPhoto,
      ];
    });
  },
);
