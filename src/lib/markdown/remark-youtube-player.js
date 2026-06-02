import { visit } from "unist-util-visit";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStartSeconds(value) {
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 60 * 60 + minutes * 60 + seconds;
  return total > 0 ? total : null;
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

  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  let videoId = null;
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (url.hostname.endsWith("youtu.be")) {
    videoId = pathParts[0];
  } else if (pathParts[0] === "watch") {
    videoId = url.searchParams.get("v");
  } else if (["embed", "shorts", "live"].includes(pathParts[0])) {
    videoId = pathParts[1];
  }

  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) return null;

  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  const start = getStartSeconds(
    url.searchParams.get("start") ?? url.searchParams.get("t"),
  );
  if (start) embedUrl.searchParams.set("start", String(start));

  return embedUrl.toString();
}

function getYoutubeUrl(node) {
  if (node?.type !== "paragraph") return null;
  if (!Array.isArray(node.children) || node.children.length !== 1) return null;

  const child = node.children[0];
  if (!child) return null;

  let rawUrl = null;
  if (child.type === "link") rawUrl = child.url;
  if (child.type === "text") rawUrl = child.value;
  if (!rawUrl) return null;

  return normalizeUrl(rawUrl);
}

export default function remarkYoutubePlayer() {
  return (tree) => {
    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || index === undefined) return;

      const youtubeUrl = getYoutubeUrl(node);
      if (!youtubeUrl) return;

      const safeUrl = escapeHtml(youtubeUrl);
      const html = `<div class="youtube-player"><iframe src="${safeUrl}" title="YouTube video player" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;

      parent.children[index] = { type: "html", value: html };
    });
  };
}
