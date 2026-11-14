import assert from "node:assert/strict";
import test from "node:test";
import { relatedPosts } from "../src/lib/related-posts.ts";

const post = (id, date, tags) => ({ id, data: { date: new Date(date), tags } });

test("related posts prefer more shared tags, then closer dates", () => {
  const self = post("self", "2026-06-15", ["開発", "Vim"]);
  const posts = [
    self,
    post("far-one-tag", "2025-01-01", ["開発"]),
    post("near-one-tag", "2026-06-10", ["開発"]),
    post("two-tags", "2024-01-01", ["開発", "Vim"]),
    post("other", "2026-06-15", ["趣味"]),
    post("neighbor", "2026-06-14", ["開発", "Vim"]),
  ];
  assert.deepEqual(
    relatedPosts(self, posts, { limit: 3, exclude: ["neighbor"] }).map(
      (p) => p.id,
    ),
    ["two-tags", "near-one-tag", "far-one-tag"],
  );
});

test("posts without tags have no related posts", () => {
  const self = post("self", "2026-06-15", []);
  assert.deepEqual(relatedPosts(self, [self, post("a", "2026-06-15", [])]), []);
});
