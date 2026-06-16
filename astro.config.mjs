import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import rehypeCodeFilename from "./src/lib/markdown/rehype-code-filename.js";
import rehypeImageCaption from "./src/lib/markdown/rehype-image-caption.js";
import remarkCodeLanguage from "./src/lib/markdown/remark-code-language.js";
import remarkDirectiveWidgets from "./src/lib/markdown/remark-directive-widgets.js";
import remarkTwitterCard from "./src/lib/markdown/remark-twitter-card.js";
import remarkYoutubePlayer from "./src/lib/markdown/remark-youtube-player.js";
import rehypeAllLinksBlank from "./src/lib/markdown/rehype-all-links-blank.js";

// https://astro.build/config
export default defineConfig({
  site: "https://blog.amatatu.com",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [sitemap(), mdx(), pagefind()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: "css-variables",
    },
    remarkRehype: {
      footnoteBackContent: "↩︎",
      footnoteBackLabel: "本文へ戻る",
    },
    remarkPlugins: [
      remarkDirective,
      remarkDirectiveWidgets,
      remarkGfm,
      remarkCodeLanguage,
      remarkTwitterCard,
      remarkYoutubePlayer,
    ],
    rehypePlugins: [rehypeCodeFilename, rehypeImageCaption, rehypeAllLinksBlank],
  },
});
