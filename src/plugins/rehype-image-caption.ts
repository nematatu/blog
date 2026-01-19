import type { Element, Parent, Root } from "hast";
import type { Plugin } from "unified";

function isElement(node: unknown): node is Element {
	return !!node && typeof node === "object" && (node as Element).type === "element";
}

function isWhitespaceText(node: unknown): boolean {
	return !!node && typeof node === "object" && (node as { type?: string; value?: string }).type === "text" && ((node as { value?: string }).value ?? "").trim().length === 0;
}

function isCaptionParagraph(node: Element): boolean {
	if (node.tagName !== "p") return false;
	let hasText = false;
	for (const child of node.children) {
		if (child.type === "text") {
			if (child.value.trim().length > 0) hasText = true;
			continue;
		}
		// Allow emphasis-only inline captions (e.g. *caption*).
		if (isElement(child) && child.tagName === "em") {
			let emHasText = false;
			for (const emChild of child.children) {
				if (emChild.type === "text") {
					if (emChild.value.trim().length > 0) emHasText = true;
					continue;
				}
				return false;
			}
			if (emHasText) hasText = true;
			continue;
		}
		return false;
	}
	return hasText;
}

function isInlineEmCaption(node: Element): boolean {
	if (node.tagName !== "em") return false;
	let hasText = false;
	for (const child of node.children) {
		if (child.type === "text") {
			if (child.value.trim().length > 0) hasText = true;
			continue;
		}
		return false;
	}
	return hasText;
}

function splitParagraphWithInlineCaption(node: Element): Element[] | null {
	if (node.tagName !== "p") return null;

	let imgIndex = -1;
	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];
		if (isElement(child) && child.tagName === "img") {
			imgIndex = i;
			break;
		}
	}
	if (imgIndex === -1) return null;

	let lastMeaningfulIndex = -1;
	for (let i = node.children.length - 1; i >= 0; i--) {
		const child = node.children[i];
		if (isWhitespaceText(child)) continue;
		lastMeaningfulIndex = i;
		break;
	}
	if (lastMeaningfulIndex === -1) return null;
	const lastMeaningful = node.children[lastMeaningfulIndex];
	if (!isElement(lastMeaningful) || !isInlineEmCaption(lastMeaningful)) return null;
	if (imgIndex >= lastMeaningfulIndex) return null;

	for (let i = imgIndex + 1; i < lastMeaningfulIndex; i++) {
		if (!isWhitespaceText(node.children[i])) return null;
	}

	const beforeChildren = node.children.slice(0, imgIndex).filter((child) => !isWhitespaceText(child));
	const figure: Element = {
		type: "element",
		tagName: "figure",
		properties: { className: ["image-caption"] },
		children: [
			node.children[imgIndex] as Element,
			{
				type: "element",
				tagName: "figcaption",
				properties: {},
				children: lastMeaningful.children,
			},
		],
	};

	const result: Element[] = [];
	if (beforeChildren.length > 0) {
		result.push({
			type: "element",
			tagName: "p",
			properties: node.properties ?? {},
			children: beforeChildren,
		});
	}
	result.push(figure);
	return result;
}

function wrapImageWithCaption(parent: Parent) {
	if (!parent.children) return;

	for (let i = 0; i < parent.children.length - 1; i++) {
		const node = parent.children[i];
		const next = parent.children[i + 1];

		if (!isElement(node)) continue;

		if (node.tagName === "p") {
			const split = splitParagraphWithInlineCaption(node);
			if (split) {
				parent.children.splice(i, 1, ...split);
				i += split.length - 1;
				continue;
			}
		}

		if (node.tagName === "img" && isElement(next) && isCaptionParagraph(next)) {
			const figure: Element = {
				type: "element",
				tagName: "figure",
				properties: { className: ["image-caption"] },
				children: [
					node,
					{
						type: "element",
						tagName: "figcaption",
						properties: {},
						children: next.children,
					},
				],
			};

			parent.children.splice(i, 2, figure);
			continue;
		}

		if ("children" in node && Array.isArray(node.children)) {
			wrapImageWithCaption(node as Parent);
		}
	}
}

export const rehypeImageCaption: Plugin<[], Root> = () => {
	return (tree) => {
		wrapImageWithCaption(tree);
	};
};
