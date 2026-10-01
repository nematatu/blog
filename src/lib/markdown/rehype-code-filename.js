import { readFileSync } from "node:fs";
import { visit } from "unist-util-visit";

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

export default function rehypeCodeFilename() {
  return (tree, file) => {
    const path = file.history?.[0];
    if (!path) return;

    const filenames = extractCodeFilenames(
      typeof file.value === "string" ? file.value : readFileSync(path, "utf8"),
    );
    let current = 0;
    visit(tree, "element", (node) => {
      if (node.tagName !== "pre") return;
      const filename = filenames[current++];
      node.properties ??= {};
      node.properties.tabIndex = 0;
      if (filename) node.properties["data-filename"] = filename;
    });
  };
}
