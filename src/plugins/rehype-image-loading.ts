import type { Element, Parent, Properties, Root } from "hast";
import type { Plugin } from "unified";

function isElement(node: unknown): node is Element {
	return !!node && typeof node === "object" && (node as Element).type === "element";
}

function addImageAttrs(node: Element) {
	if (node.tagName !== "img") return;
	const props = { ...(node.properties ?? {}) } as Properties & {
		fetchpriority?: string;
	};

	if (!("loading" in props)) props.loading = "lazy";
	if (!("decoding" in props)) props.decoding = "async";
	if (!("fetchpriority" in props)) props.fetchpriority = "low";

	node.properties = props;
}

function walk(parent: Parent) {
	if (!parent.children) return;
	for (const child of parent.children) {
		if (!isElement(child)) continue;
		addImageAttrs(child);
		if ("children" in child && Array.isArray(child.children)) {
			walk(child as Parent);
		}
	}
}

export const rehypeImageLoading: Plugin<[], Root> = () => {
	return (tree) => {
		walk(tree);
	};
};
