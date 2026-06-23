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

function applyCodeFilenames(node, filenames, indexRef) {
  if (!node || !Array.isArray(node.children)) return;

  for (const child of node.children) {
    if (isElement(child) && child.tagName === "pre") {
      const filename = filenames[indexRef.index];
      indexRef.index += 1;

      if (filename) {
        child.properties ||= {};
        child.properties["data-filename"] = filename;
      }
    }

    applyCodeFilenames(child, filenames, indexRef);
  }
}

export default function rehypeCodeFilename() {
  return (tree, file) => {
    const path = file.history?.[0];
    if (!path) return;

    const filenames = extractCodeFilenames(readFileSync(path, "utf8"));
    if (!filenames.some(Boolean)) return;

    applyCodeFilenames(tree, filenames, { index: 0 });
  };
}
