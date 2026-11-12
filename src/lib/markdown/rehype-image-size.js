import { visit } from "unist-util-visit";
import { readImageSizes } from "../../../scripts/image-sizes.mjs";

// 実寸が分かっている本文画像に width / height を付け、読み込み前から表示領域を確保する
// (レイアウトのずれ = CLS を防ぐ)。表示サイズは CSS の max-width と height: auto が決める。
export default function rehypeImageSize({ sizes = readImageSizes() } = {}) {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      const size = sizes[node.properties?.src];
      if (!size || "width" in node.properties || "height" in node.properties) {
        return;
      }
      [node.properties.width, node.properties.height] = size;
    });
  };
}
