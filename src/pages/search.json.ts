import { getCollection } from "astro:content";
import { isVisibleEntry, sortByPinnedThenDateDesc } from "@lib/content-sort";
import { dateKey, getTextStats } from "@lib/post-metrics";
import { tagEmoji } from "@lib/tag-emoji";

export const prerender = true;

export async function GET() {
  const base = import.meta.env.BASE_URL ?? "/";
  const withBase = (value: string) =>
    new URL(value.replace(/^\//, ""), `https://example.com${base}`).pathname;
  const posts = sortByPinnedThenDateDesc(
    (await getCollection("blog")).filter(isVisibleEntry),
  );

  const items = posts.map((post) => {
    const stats = getTextStats(post.body ?? "");
    const description = post.data.description ?? "";
    const fallbackImage = withBase(`og-image/blog/${post.id}.png`);
    const ogImage = post.data.ogImage
      ? post.data.ogImage.startsWith("http")
        ? post.data.ogImage
        : withBase(post.data.ogImage)
      : fallbackImage;
    const date = dateKey(post.data.date);
    const tags = post.data.tags ?? [];
    const searchSource = [post.data.title, description, ...tags]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      title: post.data.title,
      description,
      date,
      dateKey: date,
      tags,
      tagsWithEmoji: tags.map((tag) => `${tagEmoji(tag)} #${tag}`),
      url: withBase(`blog/${post.id}`),
      ogImage,
      fallbackImage,
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
