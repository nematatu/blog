import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE } from "@consts";
import { isVisibleEntry, sortByDateDesc } from "@lib/content-sort";

export async function GET(context) {
  const blog = (await getCollection("blog")).filter(isVisibleEntry);
  const projects = (await getCollection("projects")).filter(isVisibleEntry);
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
