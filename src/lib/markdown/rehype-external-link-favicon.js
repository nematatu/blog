import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { visit } from "unist-util-visit";

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const BLOG_ROOT = path.resolve(process.cwd(), "src/content/blog");
const FAVICON_ROOT = path.resolve(process.cwd(), "public/link-favicons");
const CACHE_FILE = path.resolve(process.cwd(), ".cache/link-favicons.json");
const MAX_AGE = 1000 * 60 * 60 * 24 * 30;
const MAX_BYTES = 1024 * 1024;

const isBlogMarkdown = (filePath) => {
  if (!filePath || path.extname(filePath) !== ".md") return false;
  const relativePath = path.relative(BLOG_ROOT, path.resolve(filePath));
  return (
    relativePath &&
    !relativePath.startsWith("..") &&
    !path.isAbsolute(relativePath)
  );
};

const getAttribute = (tag, name) => {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"),
  );
  return match?.[1] ?? null;
};

const findIconUrl = (html, pageUrl) => {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of linkTags) {
    const rel = getAttribute(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
    const href = getAttribute(tag, "href");
    if (href && rel.includes("icon")) {
      try {
        return new URL(href, pageUrl).toString();
      } catch {
        return null;
      }
    }
  }
  return null;
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "amatatu-blog-build/1.0",
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
};

const getImageBuffer = async (url) => {
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8",
      },
    });
    if (!response.ok) return null;
    const contentLength = Number(response.headers.get("content-length"));
    if (contentLength > MAX_BYTES) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_BYTES) return null;
    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";
    if (
      contentType.includes("text/html") ||
      contentType.includes("application/json")
    ) {
      return null;
    }
    return buffer;
  } catch {
    return null;
  }
};

const loadCache = async () => {
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
};

const saveCache = async (cache) => {
  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`);
};

const getFavicon = async (origin, cache) => {
  const cached = cache[origin];
  if (cached && Date.now() - cached.checkedAt < MAX_AGE) {
    if (!cached.src) return null;
    try {
      await stat(path.resolve(process.cwd(), "public", cached.src.slice(1)));
      return cached.src;
    } catch {
      // Re-fetch a missing generated asset.
    }
  }

  let pageUrl = `${origin}/`;
  let iconUrl = null;
  try {
    const page = await fetchWithTimeout(pageUrl, {
      headers: { Accept: "text/html" },
    });
    if (page.ok) iconUrl = findIconUrl(await page.text(), pageUrl);
  } catch {
    // The conventional favicon URL below is still worth trying.
  }

  iconUrl ??= `${origin}/favicon.ico`;
  const buffer = await getImageBuffer(iconUrl);
  if (!buffer) {
    cache[origin] = { checkedAt: Date.now(), src: null };
    return null;
  }

  const fileName = `${createHash("sha256").update(origin).digest("hex").slice(0, 20)}.ico`;
  const relativeSrc = `/link-favicons/${fileName}`;
  await mkdir(FAVICON_ROOT, { recursive: true });
  await writeFile(path.join(FAVICON_ROOT, fileName), buffer);
  cache[origin] = { checkedAt: Date.now(), src: relativeSrc };
  return relativeSrc;
};

const isExternalHttpUrl = (href, site) => {
  if (typeof href !== "string") return null;
  try {
    const url = new URL(href, site);
    const siteUrl = new URL(site);
    return HTTP_PROTOCOLS.has(url.protocol) && url.origin !== siteUrl.origin
      ? url
      : null;
  } catch {
    return null;
  }
};

const hasVisibleText = (node) =>
  node.children?.some((child) => child.type === "text" && child.value.trim()) ??
  false;

export default function rehypeExternalLinkFavicon({ site } = {}) {
  return async (tree, file) => {
    if (!isBlogMarkdown(file.history?.[0])) return;

    const links = [];
    visit(tree, "element", (node) => {
      const url =
        node.tagName === "a"
          ? isExternalHttpUrl(node.properties?.href, site)
          : null;
      if (url && hasVisibleText(node)) links.push({ node, url });
    });
    if (!links.length) return;

    const cache = await loadCache();
    const origins = [...new Set(links.map(({ url }) => url.origin))];
    const faviconByOrigin = new Map(
      await Promise.all(
        origins.map(async (origin) => [
          origin,
          await getFavicon(origin, cache),
        ]),
      ),
    );
    await saveCache(cache);

    for (const { node, url } of links) {
      const src = faviconByOrigin.get(url.origin);
      if (
        !src ||
        node.children?.some((child) =>
          child.properties?.className?.includes?.("external-link-favicon"),
        )
      )
        continue;
      const label = {
        type: "element",
        tagName: "span",
        properties: { className: ["external-link-label"] },
        children: node.children,
      };
      node.children = [
        label,
        { type: "text", value: " " },
        {
          type: "element",
          tagName: "img",
          properties: {
            src,
            alt: "",
            width: 16,
            height: 16,
            loading: "lazy",
            decoding: "async",
            className: ["external-link-favicon"],
            "data-no-lightbox": "true",
            "aria-hidden": "true",
          },
          children: [],
        },
      ];
    }
  };
}
