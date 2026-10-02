import assert from "node:assert/strict";
import test from "node:test";
import rehypeImageCaption from "../src/lib/markdown/rehype-image-caption.js";
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
