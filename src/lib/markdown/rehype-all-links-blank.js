import { visit } from "unist-util-visit";

export default function rehypeAllLinksBlank() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "a") {
        node.properties ||= {};
        node.properties.target = "_blank";
        node.properties.rel = "noopener noreferrer";
      }
    });
  };
}
