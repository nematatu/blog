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

test("post dates are keyed by the URL path and skip drafts and archives", async () => {
  const { mkdtemp, mkdir, rm, writeFile } = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const { readPostDates } = await import("../scripts/post-dates.mjs");
  const root = await mkdtemp(path.join(os.tmpdir(), "blog-post-dates-"));
  try {
    await mkdir(path.join(root, "Dev"));
    await mkdir(path.join(root, "archive"));
    const post = (date, draft = false) =>
      `---\ntitle: "t"\ndate: "${date}"\ndraft: ${draft}\n---\n本文\n`;
    await writeFile(path.join(root, "Dev", "My-Post.md"), post("2026-06-14"));
    await writeFile(path.join(root, "Dev", "wip.md"), post("2026-06-15", true));
    await writeFile(path.join(root, "archive", "old.md"), post("2020-01-01"));
    const dates = readPostDates(root);
    assert.deepEqual([...dates.keys()], ["/blog/dev/my-post/"]);
    assert.equal(
      dates.get("/blog/dev/my-post/").toISOString(),
      "2026-06-14T00:00:00.000Z",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
