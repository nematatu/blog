import { readFileSync } from "node:fs";
import { SKIP, visit } from "unist-util-visit";

const element = (tagName, properties, children = []) => ({
  type: "element",
  tagName,
  properties,
  children,
});
const styled = (tagName, className, children) =>
  element(tagName, { className: [className] }, children);

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
  return element(
    "button",
    {
      className: [
        "copy-code absolute top-[0.65rem] right-[0.65rem] z-[2] grid size-8 place-content-center rounded-[5px] bg-transparent text-base leading-none text-white/65 hover:bg-white/10 hover:text-white",
      ],
      type: "button",
      dataCopyCode: "true",
      title: "Copy code",
      ariaLabel: "コードをコピー",
    },
    [
      {
        type: "element",
        tagName: "svg",
        properties: {
          viewBox: "0 0 24 24",
          width: 16,
          height: 16,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          ariaHidden: "true",
        },
        children: [
          {
            type: "element",
            tagName: "rect",
            properties: { x: 8, y: 8, width: 13, height: 13, rx: 2 },
            children: [],
          },
          {
            type: "element",
            tagName: "path",
            properties: {
              d: "M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3",
            },
            children: [],
          },
        ],
      },
    ],
  );
}

export default function rehypeCodeFilename() {
  return (tree, file) => {
    const path = file.history?.[0];
    if (!path) return;

    const filenames = extractCodeFilenames(
      typeof file.value === "string" ? file.value : readFileSync(path, "utf8"),
    );
    let current = 0;
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || index === undefined || !parent) return;
      const filename = filenames[current++];
      node.properties ??= {};
      node.properties.tabIndex = 0;
      if (filename) node.properties["data-filename"] = filename;
      const children = [node, createCopyButton()];
      if (filename) {
        children.unshift(
          styled(
            "div",
            "code-block-header relative z-[1] table max-w-[calc(100%-3rem)] mb-[-16px] rounded-t-[5px] bg-[#323e52] px-3 pt-[6px] pb-5",
            [
              styled(
                "span",
                "block overflow-hidden font-mono text-xs leading-[1.3] text-ellipsis whitespace-nowrap text-white/90",
                [{ type: "text", value: filename }],
              ),
            ],
          ),
        );
      }
      parent.children[index] = styled(
        "div",
        "code-block-wrapper relative my-[1.3rem]",
        children,
      );
      return SKIP;
    });
  };
}
