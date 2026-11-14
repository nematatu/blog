import { getCollection, render } from "astro:content";
import rss from "@astrojs/rss";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { SITE } from "@consts";
import { isVisibleEntry, sortByDateDesc } from "@lib/content-sort";
import { getExcerpt } from "@lib/post-metrics";

// フィードリーダーで記事を最後まで読めるよう、本文の HTML を content として載せる。
// リーダーはサイト外で表示するので、サイト内の相対 URL は絶対 URL にし、
// サイトの JS に頼る要素 (スクリプト、コピーボタン用の属性など) は落とす。
function feedHtml(html, site) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<a class="heading-anchor"[^>]*><\/a>/g, "")
    .replace(
      /\s(href|src)="(\/[^/"][^"]*)"/g,
      (_, name, path) => ` ${name}="${new URL(path, site)}"`,
    );
}

export async function GET(context) {
  const blog = (await getCollection("blog")).filter(isVisibleEntry);
  const projects = import.meta.env.DEV ? await getCollection("projects") : [];
  const items = sortByDateDesc([...blog, ...projects]);
  const container = await AstroContainer.create();

  return rss({
    title: SITE.TITLE,
    description: SITE.DESCRIPTION,
    site: context.site,
    customData: "<language>ja</language>",
    items: await Promise.all(
      items.map(async (item) => {
        const { Content } = await render(item);
        return {
          title: item.data.title,
          description:
            item.data.description ||
            getExcerpt(item.body ?? "") ||
            SITE.DESCRIPTION,
          content: feedHtml(
            await container.renderToString(Content),
            context.site,
          ),
          categories: item.data.tags,
          pubDate: item.data.date,
          link: `/${item.collection}/${item.id}/`,
        };
      }),
    ),
  });
}
