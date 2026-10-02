import socials from "./data/socials.json";
import type { Metadata, Site, Socials } from "./types";

export const SITE: Site = {
  TITLE: "日記ニキ",
  DESCRIPTION: "日記にき",
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "What's new?",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "ブログ",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "A collection of my projects with links to repositories and live demos.",
};

export const SOCIALS = socials as Socials;
export const PAGES = [
  "gallery",
  "stats",
  ...(import.meta.env.DEV ? ["projects"] : []),
  "tags",
  "search",
];
