import assert from "node:assert/strict";
import test from "node:test";
import { getTitleFontSize, splitTitleLines } from "../src/lib/og-title.ts";

test("OG title layout keeps a leading label on its own line", () => {
  const lines = splitTitleLines("【速報】日本語タイトルのテスト");
  assert.equal(lines[0].text, "【速報】");
  assert.equal(
    lines.map((line) => line.text).join(""),
    "【速報】日本語タイトルのテスト",
  );
  assert.ok(lines.length <= 3);
  assert.ok(
    Math.max(...lines.map((line) => line.weight)) * getTitleFontSize(lines) <=
      900,
  );
});
