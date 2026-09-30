import { directiveElement, directiveLabel } from "./widget-nodes.js";

function compareParts(node) {
  const caption = directiveLabel(node);
  const images = [];

  for (const child of node.children || []) {
    if (child.type !== "paragraph") return null;

    for (const inline of child.children || []) {
      if (inline.type === "text" && /^\s*$/.test(inline.value)) continue;
      if (inline.type !== "image") return null;
      images.push(inline);
    }
  }

  if (
    images.length !== 2 ||
    images.some(
      (image) => typeof image.url !== "string" || image.url.trim().length === 0,
    )
  ) {
    return null;
  }

  return { caption, images };
}

function compareLabel(node, attribute, fallback) {
  const value = node.attributes?.[attribute];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function appendClassName(properties, className) {
  const current = properties?.className;
  const classNames = Array.isArray(current)
    ? current
    : typeof current === "string"
      ? current.split(/\s+/).filter(Boolean)
      : [];

  return [...classNames, className];
}

function prepareCompareImage(image, slot) {
  const properties = image.data?.hProperties || {};

  image.data = {
    ...image.data,
    hProperties: {
      ...properties,
      className: appendClassName(properties, "image-compare__image"),
      slot,
      loading: "lazy",
      decoding: "async",
      dataNoLightbox: "",
    },
  };

  return image;
}

function compareLabelNode(label, modifier) {
  return directiveElement(
    "textDirective",
    `compareLabel${modifier}`,
    "span",
    ["image-compare__label", `image-compare__label--${modifier}`],
    [{ type: "text", value: label }],
    { ariaHidden: "true" },
  );
}

function compareHandleNode() {
  return directiveElement(
    "textDirective",
    "compareHandle",
    "span",
    "image-compare__handle",
    [{ type: "text", value: "↔" }],
    { slot: "handle", ariaHidden: "true" },
  );
}

export function transformCompare(node, file) {
  const parts = compareParts(node);
  if (!parts) {
    file.fail(
      "compare ディレクティブには、単独の Markdown 画像を2枚指定してください。",
      node,
      "remark-directive-widgets:compare",
    );
  }

  const beforeLabel = compareLabel(node, "before-label", "変更前");
  const afterLabel = compareLabel(node, "after-label", "変更後");
  const [beforeImage, afterImage] = parts.images;

  const slider = directiveElement(
    "containerDirective",
    "compareSlider",
    "img-comparison-slider",
    "image-compare__slider",
    [
      prepareCompareImage(beforeImage, "first"),
      prepareCompareImage(afterImage, "second"),
      compareHandleNode(),
    ],
    {
      value: 50,
      tabIndex: 0,
      role: "slider",
      ariaLabel: `${beforeLabel}と${afterLabel}の画像比較`,
      ariaOrientation: "horizontal",
      ariaValueMin: 0,
      ariaValueMax: 100,
      ariaValueNow: 50,
      ariaValueText: `${beforeLabel} 50%、${afterLabel} 50%`,
      dataBeforeLabel: beforeLabel,
      dataAfterLabel: afterLabel,
    },
  );

  const stage = directiveElement(
    "containerDirective",
    "compareStage",
    "div",
    "image-compare__stage",
    [
      slider,
      compareLabelNode(beforeLabel, "before"),
      compareLabelNode(afterLabel, "after"),
    ],
  );

  if (parts.caption) {
    parts.caption.data = {
      ...parts.caption.data,
      hName: "figcaption",
      hProperties: { className: ["image-compare__caption"] },
    };
  }

  node.children = [stage, ...(parts.caption ? [parts.caption] : [])];
  node.data = {
    ...node.data,
    hName: "figure",
    hProperties: { className: ["image-compare", "not-prose"] },
  };
}
