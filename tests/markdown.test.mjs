import assert from "node:assert/strict";
import test from "node:test";
import rehypeImageCaption from "../src/lib/markdown/rehype-image-caption.js";
import remarkDirectiveWidgets from "../src/lib/markdown/remark-directive-widgets.js";
import remarkSocialEmbeds from "../src/lib/markdown/remark-social-embeds.js";

const text = (value) => ({ type: "text", value });
const paragraph = (children, data) => ({ type: "paragraph", children, data });
const image = (url) => ({ type: "image", url, alt: "" });
const file = {
  fail(message) {
    throw new Error(message);
  },
};

test("Markdown widgets keep compare captions, slots, and accessible labels", async () => {
  const node = {
    type: "containerDirective",
    name: "compare",
    attributes: { "before-label": "元", "after-label": "後" },
    children: [
      paragraph([text("画質比較")], { directiveLabel: true }),
      paragraph([image("/before.png")]),
      paragraph([image("/after.png")]),
    ],
  };
  await remarkDirectiveWidgets()({ type: "root", children: [node] }, file);
  const [stage, caption] = node.children;
  const slider = stage.children[0];
  assert.equal(node.data.hName, "figure");
  assert.equal(caption.data.hName, "figcaption");
  assert.equal(slider.data.hProperties.ariaLabel, "元と後の画像比較");
  assert.deepEqual(
    slider.children.slice(0, 2).map((child) => child.data.hProperties.slot),
    ["first", "second"],
  );
  assert.equal(slider.children[0].data.hProperties.dataNoLightbox, "");
});

test("Markdown widgets keep admonitions, speech bubbles, and GitHub cards", async () => {
  const admonition = {
    type: "containerDirective",
    name: "warning",
    children: [
      paragraph([text("注意")], { directiveLabel: true }),
      paragraph([text("本文")]),
    ],
  };
  const fuki = {
    type: "textDirective",
    name: "fuki-right",
    attributes: { tone: "emphasis" },
    children: [text("会話")],
  };
  const github = {
    type: "leafDirective",
    name: "github",
    attributes: { repo: "owner/repo", description: "説明" },
    children: [],
  };
  await remarkDirectiveWidgets()(
    { type: "root", children: [admonition, fuki, github] },
    file,
  );
  assert.equal(admonition.data.hName, "aside");
  assert.equal(admonition.children[0].data.hName, "div");
  assert.equal(fuki.children[0].data.hName, "span");
  assert.ok(fuki.data.hProperties.className.includes("fuki--emphasis"));
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
