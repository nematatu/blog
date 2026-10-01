import assert from "node:assert/strict";
import test from "node:test";
import rehypeImageCaption from "../src/lib/markdown/rehype-image-caption.js";
import remarkDirectiveWidgets from "../src/lib/markdown/remark-directive-widgets.js";
import remarkSocialEmbeds from "../src/lib/markdown/remark-social-embeds.js";

const text = (value) => ({ type: "text", value });
const paragraph = (children, data) => ({ type: "paragraph", children, data });

test("Markdown widgets keep admonitions and GitHub cards", async () => {
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
  await remarkDirectiveWidgets()({
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
  assert.equal(tree.children[2], ordinary);
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
