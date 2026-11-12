// 本文の先頭付近にある最初の画像は LCP 候補になるので、遅延読み込みから外して優先度を上げる。
// ヒーロー画像 (ogImage) がある記事ではそちらが LCP になるため何もしない。
// ここで loading を明示しておくと、後段の rehype-image-caption は lazy を付けない。

// 画像より前の内容がこの量を超えたら、初期ビューポートの外にあるとみなす。
// 本文 1 文字を 1 として数える。既存記事を実ブラウザ (390x844) で測って決めた値。
export const LCP_CONTENT_BUDGET = 300;
// 見出しとコードブロックは余白が大きいので、その分を上乗せする。
const HEADING_COST = 40;
const CODE_BLOCK_COST = 80;
// 文字数から高さを見積もれない要素。画像より前にあれば、画像は画面外とみなす。
const TALL_ELEMENTS = new Set([
  "blockquote",
  "figure",
  "iframe",
  "table",
  "video",
]);

function findLeadImage(node, state) {
  if (node.type === "text") {
    state.cost += node.value.trim().length;
    return null;
  }
  // 埋め込み (ツイート、YouTube、GitHub カードなど) はこの段階では未解析の HTML で届く。
  // 高さが分からないので、画像より前にあれば画面外とみなす。
  if (node.type === "raw") state.cost = Infinity;
  if (node.type === "element") {
    if (node.tagName === "img") return node;
    if (TALL_ELEMENTS.has(node.tagName)) state.cost = Infinity;
    if (/^h[1-6]$/.test(node.tagName)) state.cost += HEADING_COST;
    if (node.tagName === "pre") state.cost += CODE_BLOCK_COST;
  }
  for (const child of node.children ?? []) {
    if (state.cost > LCP_CONTENT_BUDGET) return null;
    const image = findLeadImage(child, state);
    if (image) return image;
  }
  return null;
}

export default function rehypeLcpImage() {
  return (tree, file) => {
    if (file?.data?.astro?.frontmatter?.ogImage) return;
    const state = { cost: 0 };
    const image = findLeadImage(tree, state);
    // loading を明示してある画像はそのまま尊重する。
    if (
      !image ||
      state.cost > LCP_CONTENT_BUDGET ||
      "loading" in (image.properties ?? {})
    ) {
      return;
    }
    image.properties = {
      ...image.properties,
      loading: "eager",
      fetchpriority: "high",
    };
  };
}
