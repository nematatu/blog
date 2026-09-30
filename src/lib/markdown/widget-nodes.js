export function directiveLabel(node) {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return null;
  }

  const first = node.children[0];
  if (first.type !== "paragraph" || first.data?.directiveLabel !== true) {
    return null;
  }

  return node.children.shift();
}

export function directiveElement(
  type,
  name,
  tag,
  className,
  children,
  properties = {},
) {
  return {
    type,
    name,
    children,
    data: {
      hName: tag,
      hProperties: {
        className: Array.isArray(className) ? className : [className],
        ...properties,
      },
    },
  };
}
