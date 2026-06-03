import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";
import remarkDirective from "remark-directive";
import rehypeCodeFilename from "./src/lib/markdown/rehype-code-filename.js";
import rehypeImageCaption from "./src/lib/markdown/rehype-image-caption.js";
import remarkCodeLanguage from "./src/lib/markdown/remark-code-language.js";
import remarkTwitterCard from "./src/lib/markdown/remark-twitter-card.js";
import remarkYoutubePlayer from "./src/lib/markdown/remark-youtube-player.js";

// https://astro.build/config
export default defineConfig({
  site: "https://blog.amatatu.com",
  integrations: [sitemap(), mdx(), pagefind(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: "css-variables",
    },
    remarkPlugins: [
      remarkDirective,
      remarkCodeLanguage,
      remarkTwitterCard,
      remarkYoutubePlayer,
    ],
    rehypePlugins: [rehypeCodeFilename, rehypeImageCaption],
  },
});
