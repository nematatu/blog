import { readFileSync } from "node:fs";

function isElement(node) {
  return !!node && typeof node === "object" && node.type === "element";
}

function extractCodeFilenames(source) {
  const filenames = [];
  let fence = null;

  for (const line of source.split(/\r?\n/)) {
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (!fenceMatch) continue;

    const marker = fenceMatch[1][0];
    const length = fenceMatch[1].length;
    if (fence) {
      if (
        marker === fence.marker &&
        length >= fence.length &&
        fenceMatch[2].trim() === ""
      ) {
        fence = null;
      }
      continue;
    }

    fence = { marker, length };
    const info = fenceMatch[2].trim().split(/\s+/)[0] || "";
    const filenameMatch = info.match(/^[A-Za-z][\w-]*:(.+)$/);
    filenames.push(filenameMatch?.[1] ?? null);
  }

  return filenames;
}

function createCopyButton() {
  return {
    type: "element",
    tagName: "button",
    properties: {
      className: ["copy-code"],
      type: "button",
      dataCopyCode: "true",
      title: "Copy code",
      ariaLabel: "コードをコピー",
    },
    children: [
      {
        type: "element",
        tagName: "iconify-icon",
        properties: { icon: "lucide:copy", ariaHidden: "true" },
        children: [],
      },
    ],
  };
}

function wrapCodeBlocks(node, filenames, indexRef) {
  if (!node || !Array.isArray(node.children)) return;

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];

    if (isElement(child) && child.tagName === "pre") {
      const filename = filenames[indexRef.index];
      indexRef.index += 1;
      child.properties ||= {};
      child.properties.tabIndex = 0;

      if (filename) {
        child.properties["data-filename"] = filename;
      }

      const wrapperChildren = [];
      if (filename) {
        wrapperChildren.push({
          type: "element",
          tagName: "div",
          properties: { className: ["code-block-header"] },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["code-filename"] },
              children: [{ type: "text", value: filename }],
            },
          ],
        });
      }

      wrapperChildren.push(child, createCopyButton());
      node.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["code-block-wrapper"] },
        children: wrapperChildren,
      };
      continue;
    }

    wrapCodeBlocks(child, filenames, indexRef);
  }
}

export default function rehypeCodeFilename() {
  return (tree, file) => {
    const path = file.history?.[0];
    if (!path) return;

    const filenames = extractCodeFilenames(readFileSync(path, "utf8"));
    wrapCodeBlocks(tree, filenames, { index: 0 });
  };
}
