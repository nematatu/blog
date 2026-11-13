import { visit } from "unist-util-visit";

// 狭い画面では表が横スクロールになる (article.css)。
// キーボードでもスクロールできるよう、フォーカスできるようにする。
export default function rehypeScrollableTable() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "table") return;
      node.properties = { ...node.properties, tabIndex: 0 };
    });
  };
}
