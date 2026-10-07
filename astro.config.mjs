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
import remarkSocialEmbeds from "./src/lib/markdown/remark-social-embeds.js";
import rehypeExternalLinks from "./src/lib/markdown/rehype-external-links.js";

const site = "https://blog.amatatu.com";

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: "always",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [
    sitemap(),
    mdx(),
    pagefind({ indexConfig: { rootSelector: "[data-pagefind-body]" } }),
  ],
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
      remarkSocialEmbeds,
    ],
    rehypePlugins: [
      rehypeCodeFilename,
      rehypeImageCaption,
      [rehypeExternalLinks, { site }],
    ],
  },
});
