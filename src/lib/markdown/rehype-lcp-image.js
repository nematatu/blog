// 本文の先頭付近にある最初の画像は LCP 候補になるので、遅延読み込みから外して優先度を上げる。
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

// ヒーロー画像のすぐ下に本文画像が続く記事では、スマホの画面だと本文画像のほうが大きく、
// そちらが LCP になる。ヒーローの分だけ画面を使っているので、許す本文量は少なくする。
export const LCP_CONTENT_BUDGET_WITH_HERO = 80;

export default function rehypeLcpImage() {
  return (tree, file) => {
    const hasHero = Boolean(file?.data?.astro?.frontmatter?.ogImage);
    const budget = hasHero ? LCP_CONTENT_BUDGET_WITH_HERO : LCP_CONTENT_BUDGET;
    const state = { cost: 0 };
    const image = findLeadImage(tree, state);
    // loading を明示してある画像はそのまま尊重する。
    if (
      !image ||
      state.cost > budget ||
      "loading" in (image.properties ?? {})
    ) {
      return;
    }
    image.properties = {
      ...image.properties,
      loading: "eager",
      // 高優先度は 1 ページに 1 枚。ヒーローがあればそちらに譲る。
      ...(hasHero ? {} : { fetchpriority: "high" }),
    };
  };
}
