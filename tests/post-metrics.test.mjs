import assert from "node:assert/strict";
import test from "node:test";
import { getExcerpt } from "../src/lib/post-metrics.ts";

test("excerpt keeps readable text and drops Markdown syntax", () => {
  const body = [
    "https://x.com/user/status/1",
    "",
    "## 見出し",
    "",
    "これは**本文**で、[リンク](https://example.com)と`code`を含む。",
    "",
    "![](https://example.com/a.png)",
    ":::note",
    "- 箇条書き",
    ":::",
    "```js",
    "ignored();",
    "```",
  ].join("\n");
  assert.equal(
    getExcerpt(body),
    "見出し これは本文で、リンクとcodeを含む。 箇条書き",
  );
});

test("excerpt is truncated with an ellipsis and can be empty", () => {
  assert.equal(getExcerpt("あ".repeat(200), 10), `${"あ".repeat(10)}…`);
  assert.equal(getExcerpt("![](https://example.com/a.png)"), "");
  assert.equal(getExcerpt("脚注つき[^1]の文\n\n[^1]: 補足"), "脚注つきの文");
});
