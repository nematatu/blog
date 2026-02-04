import { getCollection } from "astro:content";
import { dateKey, formatDateJP, getTextStats } from "@lib/post-metrics";
import { tagEmoji } from "@lib/tag-emoji";

export const prerender = true;

export async function GET() {
  const base = import.meta.env.BASE_URL ?? "/";
  const withBase = (value: string) =>
    new URL(value.replace(/^\//, ""), `https://example.com${base}`).pathname;
  const showDrafts = import.meta.env.DEV;
  const posts = (await getCollection("blog"))
    .filter((post) => showDrafts || !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const normalizeOgImage = (value: string | undefined, fallback: string) => {
    if (!value) {
      return { ogImage: fallback, fallbackImage: fallback };
    }
    if (value.startsWith("http")) {
      return { ogImage: value, fallbackImage: fallback };
    }
    const ogImage = withBase(value);
    return { ogImage, fallbackImage: fallback };
  };

  const items = posts.map((post) => {
    const stats = getTextStats(post.body ?? "");
    const fallbackImage = withBase(`og-image/blog/${post.id}.png`);
    const { ogImage, fallbackImage: resolvedFallback } = normalizeOgImage(
      post.data.ogImage,
      fallbackImage,
    );
    const tags = post.data.tags ?? [];
    const searchSource = [
      post.data.title,
      post.data.description,
      ...tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      title: post.data.title,
      description: post.data.description,
      date: formatDateJP(post.data.date),
      dateKey: dateKey(post.data.date),
      tags,
      tagsWithEmoji: tags.map((tag) => `${tagEmoji(tag)} #${tag}`),
      url: withBase(`blog/${post.id}`),
      ogImage,
      fallbackImage: resolvedFallback,
      wordCount: stats.wordCount,
      charCount: stats.charCount,
      readingMinutes: stats.readingMinutes,
      search: searchSource,
    };
  });

  return new Response(JSON.stringify({ items }), {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
