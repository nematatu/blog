const isElement = (node, tag) =>
  node?.type === "element" && node.tagName === tag;
const isWhitespace = (node) => node?.type === "text" && !node.value?.trim();
const hasText = (nodes) =>
  nodes.some((node) => node.type === "text" && node.value?.trim());
const textOnly = (nodes) => nodes.every((node) => node.type === "text");

function isCaption(node) {
  if (!isElement(node, "p")) return false;
  const children = node.children ?? [];
  return (
    children.every(
      (child) =>
        child.type === "text" ||
        (isElement(child, "em") && textOnly(child.children ?? [])),
    ) &&
    (hasText(children) ||
      children.some(
        (child) => isElement(child, "em") && hasText(child.children ?? []),
      ))
  );
}

function lazyImage(image) {
  image.properties ??= {};
  if (!("loading" in image.properties)) image.properties.loading = "lazy";
  if (!("decoding" in image.properties)) image.properties.decoding = "async";
}

function figure(image, caption) {
  lazyImage(image);
  return {
    type: "element",
    tagName: "figure",
    properties: {
      className: [
        "image-caption",
        "my-8",
        "flex",
        "flex-col",
        "items-center",
        "gap-2",
      ],
    },
    children: [
      image,
      {
        type: "element",
        tagName: "figcaption",
        properties: {
          className: ["text-sm", "text-black/60"],
        },
        children: caption,
      },
    ],
  };
}

function splitInlineCaption(paragraph) {
  const children = paragraph.children ?? [];
  const imageIndex = children.findIndex((child) => isElement(child, "img"));
  if (imageIndex < 0) return null;

  const end = children.findLastIndex((child) => !isWhitespace(child));
  const caption = children[end];
  if (
    end <= imageIndex ||
    !isElement(caption, "em") ||
    !textOnly(caption.children ?? []) ||
    !hasText(caption.children ?? []) ||
    children.slice(imageIndex + 1, end).some((child) => !isWhitespace(child))
  ) {
    return null;
  }

  const before = children
    .slice(0, imageIndex)
    .filter((child) => !isWhitespace(child));
  return [
    ...(before.length ? [{ ...paragraph, children: before }] : []),
    figure(children[imageIndex], caption.children),
  ];
}

function decorateImages(parent) {
  if (!Array.isArray(parent?.children)) return;

  for (let index = 0; index < parent.children.length; index++) {
    const node = parent.children[index];
    if (isElement(node, "p")) {
      const split = splitInlineCaption(node);
      if (split) {
        parent.children.splice(index, 1, ...split);
        index += split.length - 1;
        continue;
      }
    }

    if (isElement(node, "img")) {
      const next = parent.children[index + 1];
      if (isCaption(next)) {
        parent.children.splice(index, 2, figure(node, next.children));
        continue;
      }
      lazyImage(node);
    }
    decorateImages(node);
  }
}

export default function rehypeImageCaption() {
  return decorateImages;
}
