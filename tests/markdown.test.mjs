import assert from "node:assert/strict";
import test from "node:test";
import { imageUrls } from "../scripts/image-sizes.mjs";
import rehypeImageSize from "../src/lib/markdown/rehype-image-size.js";
import rehypeImageCaption from "../src/lib/markdown/rehype-image-caption.js";
import rehypeLcpImage, {
  LCP_CONTENT_BUDGET,
} from "../src/lib/markdown/rehype-lcp-image.js";
import rehypeExternalLinks from "../src/lib/markdown/rehype-external-links.js";
import remarkDirectiveWidgets from "../src/lib/markdown/remark-directive-widgets.js";
import remarkSocialEmbeds from "../src/lib/markdown/remark-social-embeds.js";

const text = (value) => ({ type: "text", value });
const paragraph = (children, data) => ({ type: "paragraph", children, data });

test("Markdown widgets keep admonitions and GitHub cards", () => {
  const admonition = {
    type: "containerDirective",
    name: "warning",
    children: [
      paragraph([text("注意")], { directiveLabel: true }),
      paragraph([text("本文")]),
    ],
  };
  const github = {
    type: "leafDirective",
    name: "github",
    attributes: { repo: "owner/repo", description: "説明" },
    children: [],
  };
  remarkDirectiveWidgets()({
    type: "root",
    children: [admonition, github],
  });
  assert.equal(admonition.data.hName, "aside");
  assert.equal(admonition.children[0].data.hName, "div");
  assert.equal(github.type, "html");
  assert.match(github.value, /href="https:\/\/github\.com\/owner\/repo"/);
  assert.match(github.value, />説明</);
});

test("standalone social links become embeds without changing other links", () => {
  const youtube = paragraph([text("https://youtu.be/abcdefghijk?t=1m30s")]);
  const twitter = paragraph([text("https://x.com/user/status/12345")]);
  const ordinary = paragraph([text("普通の文章")]);
  const tree = { type: "root", children: [youtube, twitter, ordinary] };
  remarkSocialEmbeds()(tree);
  assert.match(
    tree.children[0].value,
    /youtube-nocookie\.com\/embed\/abcdefghijk\?start=90/,
  );
  assert.match(tree.children[1].value, /twitter-tweet/);
  assert.match(tree.children[0].value, /^<div class="youtube-player/);
  assert.match(tree.children[1].value, /^<blockquote/);
  assert.match(tree.children[0].value, /<iframe[^>]+src=/);
  assert.doesNotMatch(tree.children[0].value, /<details|<template|<summary/);
  assert.doesNotMatch(tree.children[1].value, /<details|<template|<summary/);
  assert.match(tree.children[1].value, /Xで開く<\/a>/);
  assert.equal(tree.children[2], ordinary);
});

test("Markdown rendering keeps external links and GitHub cards without network requests", (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Markdown rendering must not fetch external resources");
  });
  const link = (href) => ({
    type: "element",
    tagName: "a",
    properties: { href },
    children: [text("リンク")],
  });
  const external = link("https://example.com/docs");
  const internal = link("/blog/post");
  const mail = link("mailto:hello@example.com");
  rehypeExternalLinks({ site: "https://blog.amatatu.com" })({
    type: "root",
    children: [external, internal, mail],
  });
  assert.equal(external.properties.target, "_blank");
  assert.equal(external.properties.rel, "noopener noreferrer");
  assert.equal(internal.properties.target, undefined);
  assert.equal(mail.properties.target, undefined);
  assert.equal(external.children.length, 1);

  const github = paragraph([text("https://github.com/owner/repo")]);
  remarkDirectiveWidgets()({ type: "root", children: [github] });
  assert.match(github.value, /GitHub repository/);
  assert.equal(fetch.mock.callCount(), 0);
});

test("image captions keep lazy loading and text", () => {
  const photo = {
    type: "element",
    tagName: "img",
    properties: { src: "/photo.png" },
    children: [],
  };
  const caption = {
    type: "element",
    tagName: "p",
    properties: {},
    children: [text("説明")],
  };
  const tree = { type: "root", children: [photo, caption] };
  rehypeImageCaption()(tree);
  assert.equal(tree.children[0].tagName, "figure");
  assert.equal(tree.children[0].children[0].properties.loading, "lazy");
  assert.equal(tree.children[0].children[1].children[0].value, "説明");
});

test("Markdown widgets size images wrapped in an image directive", () => {
  const sized = (size) => ({
    type: "containerDirective",
    name: "image",
    attributes: { size },
    children: [paragraph([{ type: "image", url: "/photo.png", alt: "" }])],
  });
  const small = sized("small");
  const medium = sized("medium");
  remarkDirectiveWidgets()({ type: "root", children: [small, medium] });
  assert.equal(small.data.hName, "div");
  assert.deepEqual(small.data.hProperties.className, [
    "image-size",
    "mx-auto w-1/2",
  ]);
  assert.equal(medium.data.hProperties.dataImageSize, "medium");
  assert.equal(small.children[0].children[0].url, "/photo.png");
});

const image = (src, properties = {}) => ({
  type: "element",
  tagName: "img",
  properties: { src, ...properties },
  children: [],
});
const block = (...children) => ({
  type: "element",
  tagName: "p",
  properties: {},
  children,
});
const lcp = (children, frontmatter = {}) => {
  const tree = { type: "root", children };
  rehypeLcpImage()(tree, { data: { astro: { frontmatter } } });
  rehypeImageCaption()(tree);
  return tree;
};

test("the lead image of a post without a hero is loaded with high priority", () => {
  const lead = image("/lead.png");
  const later = image("/later.png");
  lcp([block(text("短い導入")), block(lead), block(later)]);
  assert.equal(lead.properties.loading, "eager");
  assert.equal(lead.properties.fetchpriority, "high");
  assert.equal(later.properties.loading, "lazy");
  assert.equal(later.properties.fetchpriority, undefined);
});

test("images that are not LCP candidates stay lazy", () => {
  const withHero = image("/body.png");
  lcp([block(withHero)], { ogImage: "/ogp/hero.png" });
  assert.equal(withHero.properties.loading, "lazy");
  assert.equal(withHero.properties.fetchpriority, undefined);

  const belowFold = image("/far.png");
  lcp([block(text("あ".repeat(LCP_CONTENT_BUDGET + 1))), block(belowFold)]);
  assert.equal(belowFold.properties.loading, "lazy");
  assert.equal(belowFold.properties.fetchpriority, undefined);

  const afterEmbed = image("/embed.png");
  lcp([
    { type: "raw", value: '<blockquote class="twitter-tweet"></blockquote>' },
    block(afterEmbed),
  ]);
  assert.equal(afterEmbed.properties.loading, "lazy");
  assert.equal(afterEmbed.properties.fetchpriority, undefined);

  const afterTable = image("/table.png");
  lcp([
    { type: "element", tagName: "table", properties: {}, children: [] },
    block(afterTable),
  ]);
  assert.equal(afterTable.properties.fetchpriority, undefined);

  const card = image("/card.png", { loading: "lazy" });
  const afterCard = image("/after.png");
  lcp([block(card), block(afterCard)]);
  assert.equal(card.properties.fetchpriority, undefined);
  assert.equal(afterCard.properties.fetchpriority, undefined);
});

test("known image sizes are embedded so the layout does not shift", () => {
  const known = image("https://assets.blog.amatatu.com/a.avif");
  const unknown = image("https://assets.blog.amatatu.com/b.avif");
  const sized = image("https://assets.blog.amatatu.com/a.avif", { width: 10 });
  rehypeImageSize({
    sizes: { "https://assets.blog.amatatu.com/a.avif": [800, 600] },
  })({ type: "root", children: [block(known), block(unknown), block(sized)] });
  assert.equal(known.properties.width, 800);
  assert.equal(known.properties.height, 600);
  assert.equal(unknown.properties.width, undefined);
  assert.equal(sized.properties.width, 10);
  assert.equal(sized.properties.height, undefined);
});

test("only images on the blog's own asset host are measured", () => {
  assert.deepEqual(
    imageUrls(
      [
        "![](https://assets.blog.amatatu.com/a.avif)",
        '![説明](https://assets.blog.amatatu.com/b.jpg "title")',
        "![](https://example.com/c.png)",
        "![](/local.png)",
        "[リンク](https://assets.blog.amatatu.com/d.png)",
        "![](https://assets.blog.amatatu.com/a.avif)",
      ].join("\n"),
    ),
    [
      "https://assets.blog.amatatu.com/a.avif",
      "https://assets.blog.amatatu.com/b.jpg",
    ],
  );
});
