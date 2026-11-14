type Post = {
  id: string;
  data: { date: Date; tags?: string[] };
};

// 共通のタグが多い順、同数なら公開日が近い順に、関連記事を選ぶ。
// exclude には前後リンクで既に出している記事などを渡す。
export function relatedPosts<T extends Post>(
  post: T,
  posts: T[],
  { limit = 3, exclude = [] as string[] } = {},
) {
  const tags = new Set(post.data.tags ?? []);
  if (tags.size === 0) return [];
  const skip = new Set([post.id, ...exclude]);
  const distance = (other: T) =>
    Math.abs(other.data.date.valueOf() - post.data.date.valueOf());
  return posts
    .filter((other) => !skip.has(other.id))
    .map((other) => ({
      other,
      shared: (other.data.tags ?? []).filter((tag) => tags.has(tag)).length,
    }))
    .filter(({ shared }) => shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        distance(a.other) - distance(b.other) ||
        a.other.id.localeCompare(b.other.id, "en"),
    )
    .slice(0, limit)
    .map(({ other }) => other);
}
