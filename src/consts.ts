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
  "stats",
  ...(import.meta.env.DEV ? ["projects"] : []),
  "tags",
  "search",
];

// 一覧の先頭でこの件数までは初期ビューポートに入るとみなし、サムネイルを遅延読み込みしない。
// 画像なしの短いカードだけが並ぶと、スマホの初期表示に 7 件ほど入る。
// 多めに見積もっても、余分に読むのは 240px 幅のサムネイル (10KB 前後) が数枚で済む。
export const EAGER_CARD_COUNT = 8;
