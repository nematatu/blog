import { visit } from "unist-util-visit";

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

const isExternalHttpUrl = (href, site) => {
  if (typeof href !== "string") return false;

  try {
    const url = new URL(href, site);
    const siteUrl = new URL(site);

    return HTTP_PROTOCOLS.has(url.protocol) && url.origin !== siteUrl.origin;
  } catch {
    return false;
  }
};

export default function rehypeExternalLinksBlank({ site } = {}) {
  return (tree) => {
    visit(tree, "element", (node) => {
      const href = node.properties?.href;

      if (node.tagName === "a" && isExternalHttpUrl(href, site)) {
        node.properties.target = "_blank";
        node.properties.rel = "noopener noreferrer";
      }
    });
  };
}
