import assert from "node:assert/strict";
import test from "node:test";
import { parseFrontmatter } from "../scripts/post-frontmatter.mjs";

test("draft listing reads quoted frontmatter values and skips comments", () => {
  const source = `---
# note
title: "日本語の記事"
date: '2026-09-29T10:30:00+09:00'
draft: true
---
本文`;
  assert.deepEqual(parseFrontmatter(source), {
    title: "日本語の記事",
    date: "2026-09-29T10:30:00+09:00",
    draft: "true",
  });
  assert.deepEqual(parseFrontmatter("本文のみ"), {});
});
