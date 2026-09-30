import assert from "node:assert/strict";
import test from "node:test";
import { galleryUrl, selectedPhoto } from "../src/lib/gallery-url.ts";

test("gallery deep links preserve other query parameters and fragments", () => {
  const href = "https://blog.example/gallery/?tag=photo#grid";
  const open = galleryUrl(href, "blog/one-0");
  assert.equal(
    open.toString(),
    "https://blog.example/gallery/?tag=photo&photo=blog%2Fone-0#grid",
  );
  assert.equal(galleryUrl(open.toString()).toString(), href);
});

test("gallery URL selection distinguishes missing and unknown photos", () => {
  const photos = [{ id: "first" }, { id: "second" }];
  assert.deepEqual(
    selectedPhoto(photos, "https://blog.example/gallery/?photo=second"),
    {
      id: "second",
      index: 1,
    },
  );
  assert.deepEqual(
    selectedPhoto(photos, "https://blog.example/gallery/?photo=unknown"),
    {
      id: "unknown",
      index: -1,
    },
  );
  assert.deepEqual(selectedPhoto(photos, "https://blog.example/gallery/"), {
    id: null,
    index: -1,
  });
});
