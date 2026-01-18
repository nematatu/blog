import type { Paragraph, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { h } from "../utils/remark";

const TWITTER_HOSTS = new Set(["twitter.com", "www.twitter.com", "x.com", "www.x.com"]);

function getTweetUrl(node: Paragraph): string | null {
	if (node.children.length !== 1) return null;

	const child = node.children[0];
	if (!child) return null;
	let rawUrl: string | null = null;
	if (child.type === "link") rawUrl = child.url;
	if (child.type === "text") rawUrl = child.value;
	if (!rawUrl) return null;

	const trimmed = rawUrl.trim();
	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		return null;
	}

	if (!TWITTER_HOSTS.has(url.hostname)) return null;

	const parts = url.pathname.split("/").filter(Boolean);
	let path: string | null = null;

	if (parts.length >= 3 && parts[1] === "status" && /^\d+$/.test(parts[2])) {
		path = `${parts[0]}/status/${parts[2]}`;
	} else if (
		parts.length >= 4 &&
		parts[0] === "i" &&
		parts[1] === "web" &&
		parts[2] === "status" &&
		/^\d+$/.test(parts[3])
	) {
		path = `i/web/status/${parts[3]}`;
	}

	if (!path) return null;

	let normalized = `https://twitter.com/${path}`;
	if (url.search) normalized += url.search;
	return normalized;
}

export const remarkTwitterCard: Plugin<[], Root> = () => {
	return (tree) => {
		visit(tree, "paragraph", (node, index, parent) => {
			if (!parent || index === undefined) return;

			const tweetUrl = getTweetUrl(node as Paragraph);
			if (!tweetUrl) return;

			parent.children[index] = h("div", { class: "twitter-card" }, [
				h("blockquote", { class: "twitter-tweet" }, [
					h("a", { href: tweetUrl }, [{ type: "text", value: tweetUrl }]),
				]),
			]);
		});
	};
};
