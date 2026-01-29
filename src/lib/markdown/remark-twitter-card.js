import { visit } from "unist-util-visit";

const TWITTER_HOSTS = new Set([
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "x.com",
  "www.x.com",
]);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeUrl(rawUrl) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (!TWITTER_HOSTS.has(url.hostname)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  let path = null;

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

function getTweetMeta(tweetUrl) {
  try {
    const url = new URL(tweetUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 3 && parts[1] === "status") {
      return { user: parts[0], id: parts[2] };
    }
    if (parts.length >= 4 && parts[0] === "i" && parts[1] === "web" && parts[2] === "status") {
      return { user: null, id: parts[3] };
    }
  } catch {
    return { user: null, id: null };
  }
  return { user: null, id: null };
}

function getTweetUrl(node) {
  if (!node || node.type !== "paragraph") return null;
  if (!Array.isArray(node.children) || node.children.length !== 1) return null;

  const child = node.children[0];
  if (!child) return null;

  let rawUrl = null;
  if (child.type === "link") rawUrl = child.url;
  if (child.type === "text") rawUrl = child.value;
  if (!rawUrl) return null;

  return normalizeUrl(rawUrl);
}

export default function remarkTwitterCard() {
  return (tree) => {
    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || index === undefined) return;

      const tweetUrl = getTweetUrl(node);
      if (!tweetUrl) return;

      const safeUrl = escapeHtml(tweetUrl);
      const { user } = getTweetMeta(tweetUrl);
      const label = user ? `@${user}` : "X";
      const safeLabel = escapeHtml(label);
      const html = `<div class="twitter-card not-prose"><a class="twitter-card__link" href="${safeUrl}" rel="noopener noreferrer"><span class="twitter-card__label">Tweet</span><span class="twitter-card__meta">${safeLabel}</span><span class="twitter-card__cta">Xで見る</span></a></div>`;

      parent.children[index] = { type: "html", value: html };
    });
  };
}
