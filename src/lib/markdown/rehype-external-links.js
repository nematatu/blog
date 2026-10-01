import { visit } from "unist-util-visit";

export default function rehypeExternalLinks({ site }) {
  const origin = new URL(site).origin;
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "a" || !node.properties?.href) return;
      let url;
      try {
        url = new URL(node.properties.href, site);
      } catch {
        return;
      }
      if (!/^https?:$/.test(url.protocol) || url.origin === origin) return;
      node.properties.target = "_blank";
      node.properties.rel = "noopener noreferrer";
    });
  };
}
