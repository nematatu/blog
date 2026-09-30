import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { listMarkdownFiles } from "../scripts/post-files.mjs";

test("Markdown discovery preserves nested posts and optional archive exclusion", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "blog-post-files-"));
  try {
    await mkdir(path.join(root, "nested"));
    await mkdir(path.join(root, "archive"));
    await Promise.all([
      writeFile(path.join(root, "post.md"), ""),
      writeFile(path.join(root, "nested", "page.mdx"), ""),
      writeFile(path.join(root, "archive", "old.md"), ""),
      writeFile(path.join(root, "ignore.txt"), ""),
    ]);

    const relative = (files) => files.map((file) => path.relative(root, file));
    assert.deepEqual(relative(await listMarkdownFiles(root)).sort(), [
      "archive/old.md",
      "nested/page.mdx",
      "post.md",
    ]);
    assert.deepEqual(
      relative(await listMarkdownFiles(root, ["archive"])).sort(),
      ["nested/page.mdx", "post.md"],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
