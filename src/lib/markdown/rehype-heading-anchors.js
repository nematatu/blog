import { visit } from "unist-util-visit";

const textOf = (node) =>
  node.type === "text"
    ? node.value
    : (node.children ?? []).map(textOf).join("");

// h2〜h4 に、その見出しへのリンクを付ける (節を URL で共有できるようにする)。
// リンクの "#" は CSS で描き、見出しの文字列 (目次や検索に使われる) には混ぜない。
// id は rehypeHeadingIds が先に付けている前提。
export default function rehypeHeadingAnchors() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (!/^h[2-4]$/.test(node.tagName)) return;
      const id = node.properties?.id;
      if (!id) return;
      node.children.push({
        type: "element",
        tagName: "a",
        properties: {
          className: ["heading-anchor"],
          href: `#${id}`,
          ariaLabel: `見出し「${textOf(node).trim()}」へのリンク`,
          dataPagefindIgnore: "",
        },
        children: [],
      });
    });
  };
}
