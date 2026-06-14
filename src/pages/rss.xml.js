import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE } from "@consts";
import { sortByDateDesc } from "@lib/content-sort";

export async function GET(context) {
  const showDrafts = import.meta.env.DEV;
  const blog = (await getCollection("blog")).filter(
    (post) => showDrafts || !post.data.draft,
  );

  const projects = (await getCollection("projects")).filter(
    (project) => showDrafts || !project.data.draft,
  );

  const items = sortByDateDesc([...blog, ...projects]);

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.description ?? SITE.DESCRIPTION,
      pubDate: item.data.date,
      link: `/${item.collection}/${item.id}/`,
    })),
  });
}
