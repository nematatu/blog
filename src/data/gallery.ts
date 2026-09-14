import path from "node:path";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { getCollection } from "astro:content";
import type { ImageMetadata } from "astro";
import { getGalleryImageDimensions } from "@/lib/gallery-image-dimensions";

export type GalleryPhoto = {
  id: string;
  src: string;
  width?: number;
  height?: number;
  alt: string;
  title: string;
  articleDate: string;
  articleHref: string;
  articleTitle: string;
};

const localImages = import.meta.glob<ImageMetadata>(
  "/src/content/**/*.{avif,gif,jpg,jpeg,png,webp,JPG,PNG}",
  { eager: true, import: "default" },
);

// Parse serialized Markdown, so code examples and comments cannot become photos.
function attribute(tag: string, name: string) {
  const value = tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1] ?? "";
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi,
    (_, entity: string) => {
      if (entity.startsWith("#")) {
        const hex = entity[1].toLowerCase() === "x";
        return String.fromCodePoint(
          parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10),
        );
      }
      return (
        { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" }[
          entity.toLowerCase()
        ] ?? _
      );
    },
  );
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const articles = (await getCollection("blog"))
    .filter((article) => !article.data.draft)
    .sort(
      (a, b) =>
        b.data.date.valueOf() - a.data.date.valueOf() ||
        a.id.localeCompare(b.id, "en"),
    );
  const processor = await createMarkdownProcessor({
    syntaxHighlight: false,
    smartypants: false,
  });

  const photos = (
    await Promise.all(
      articles.map(async (article) => {
        const { code } = await processor.render(article.body ?? "");
        const tags = [
          ...code.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<img\b[^>]*>/gi),
        ];
        // Preserve existing shared IDs, including capital letters in filenames.
        const legacyPath = article.filePath
          ? path
              .relative("src/content/blog", article.filePath)
              .replace(/\.(md|mdx)$/, "")
          : article.id;
        return tags.flatMap(([tag], index): GalleryPhoto[] => {
          let src = attribute(tag, "src");
          if (!src) return [];
          if (src.startsWith("//")) src = `https:${src}`;
          if (!/^(https?:\/\/|\/)/i.test(src)) {
            const imagePath = path.posix.normalize(
              `/${path.dirname(path.relative(process.cwd(), path.resolve(article.filePath ?? "")))}/${src}`,
            );
            src = localImages[imagePath]?.src ?? "";
          }
          if (!src) return [];
          const url = new URL(src, "https://blog.amatatu.com");
          if (!/\.(avif|gif|jpe?g|png|webp)$/i.test(url.pathname)) return [];
          const alt = attribute(tag, "alt").trim();
          const title = alt || `${article.data.title} — ${index + 1}`;
          return [
            {
              id: `blog/${legacyPath}-${index}`
                .replace(/[^a-z0-9]+/gi, "-")
                .replace(/^-|-$/g, ""),
              src,
              alt: alt || `${article.data.title}の画像 ${index + 1}`,
              title,
              articleDate: article.data.date.toISOString(),
              articleHref: `/blog/${article.id}`,
              articleTitle: article.data.title,
            },
          ];
        });
      }),
    )
  ).flat();
  const dimensions = await getGalleryImageDimensions(
    photos.map((photo) => photo.src),
  );
  return photos.map((photo) => ({ ...photo, ...dimensions.get(photo.src) }));
}
