import { visit } from "unist-util-visit";

const twitterHosts = new Set([
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "x.com",
  "www.x.com",
]);
const youtubeHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function standaloneUrl(node) {
  if (node.children?.length !== 1) return null;
  const child = node.children[0];
  const value =
    child.type === "link"
      ? child.url
      : child.type === "text"
        ? child.value
        : null;
  if (!value?.trim()) return null;
  try {
    return new URL(
      /^https?:\/\//i.test(value) ? value.trim() : `https://${value.trim()}`,
    );
  } catch {
    return null;
  }
}

function twitterEmbed(url) {
  if (!twitterHosts.has(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  let path;
  if (parts[1] === "status" && /^\d+$/.test(parts[2] ?? "")) {
    path = `${parts[0]}/status/${parts[2]}`;
  } else if (
    parts[0] === "i" &&
    parts[1] === "web" &&
    parts[2] === "status" &&
    /^\d+$/.test(parts[3] ?? "")
  ) {
    path = `i/web/status/${parts[3]}`;
  }
  if (!path) return null;
  const href = escapeHtml(`https://twitter.com/${path}${url.search}`);
  return `<details class="social-embed" data-social-embed><summary>Xの投稿を表示</summary><p><a href="${href}">Xで開く</a></p><template><blockquote class="twitter-tweet"><a href="${href}"></a></blockquote></template></details>`;
}

function startSeconds(value) {
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  if (!match) return null;
  return (
    Number(match[1] ?? 0) * 3600 +
      Number(match[2] ?? 0) * 60 +
      Number(match[3] ?? 0) || null
  );
}

function youtubeEmbed(url) {
  if (!youtubeHosts.has(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const id = url.hostname.endsWith("youtu.be")
    ? parts[0]
    : parts[0] === "watch"
      ? url.searchParams.get("v")
      : ["embed", "shorts", "live"].includes(parts[0])
        ? parts[1]
        : null;
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id ?? "")) return null;
  const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  const start = startSeconds(
    url.searchParams.get("start") ?? url.searchParams.get("t"),
  );
  if (start) embed.searchParams.set("start", String(start));
  return `<details class="social-embed" data-social-embed><summary>動画を再生</summary><p><a href="${escapeHtml(url.toString())}">YouTubeで開く</a></p><template><div class="youtube-player my-6 aspect-video w-full overflow-hidden border border-black/15 bg-black"><iframe class="block size-full" src="${escapeHtml(embed.toString())}" title="YouTube video player" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div></template></details>`;
}

export default function remarkSocialEmbeds() {
  return (tree) => {
    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || index === undefined) return;
      const url = standaloneUrl(node);
      const html = url && (twitterEmbed(url) ?? youtubeEmbed(url));
      if (html) parent.children[index] = { type: "html", value: html };
    });
  };
}
