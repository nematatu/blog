import { visit } from "unist-util-visit";

export default function remarkCodeLanguage() {
  return (tree) => {
    visit(tree, "code", (node) => {
      if (typeof node.lang !== "string") return;

      const separatorIndex = node.lang.indexOf(":");
      if (separatorIndex > 0) {
        node.lang = node.lang.slice(0, separatorIndex);
      }
    });
  };
}
