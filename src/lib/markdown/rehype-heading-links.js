const headingTagNames = new Set(["h2", "h3", "h4", "h5", "h6"]);

function addHeadingLinks(node) {
  if (!node || typeof node !== "object") return;

  if (node.type === "element" && headingTagNames.has(node.tagName)) {
    const level = Number(node.tagName.slice(1));
    node.children.unshift({
      type: "element",
      tagName: "button",
      properties: {
        className: ["copy-heading-link"],
        type: "button",
        "data-copy-heading": "true",
        "data-heading-marker": "#".repeat(level),
        title: "Copy link to this heading",
        "aria-label": "Copy link to this heading",
      },
      children: [],
    });
  }

  for (const child of node.children || []) addHeadingLinks(child);
}

export default function rehypeHeadingLinks() {
  return addHeadingLinks;
}
