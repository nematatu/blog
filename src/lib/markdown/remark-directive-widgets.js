import { visit } from "unist-util-visit";

const ADMONITION_TYPES = new Set([
  "note",
  "tip",
  "important",
  "caution",
  "warning",
]);
const githubDescriptionCache = new Map();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function directiveLabel(node) {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return null;
  }

  const first = node.children[0];
  if (first.type !== "paragraph" || first.data?.directiveLabel !== true) {
    return null;
  }

  return node.children.shift();
}

function transformAdmonition(node) {
  const type = node.name;
  const title = directiveLabel(node);
  const className = ["admonition", `admonition--${type}`];

  node.data = {
    hName: "aside",
    hProperties: { className, dataAdmonition: type },
  };

  if (title) {
    title.data = {
      ...title.data,
      hName: "div",
      hProperties: { className: ["admonition__title"] },
    };
    node.children.unshift(title);
  }
}

async function fetchJson(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "blog-build",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) return null;

  return response.json();
}

async function githubDescription(target) {
  if (target.description) return target.description;

  const cacheKey = `${target.kind}:${target.path}`;
  if (githubDescriptionCache.has(cacheKey)) {
    return githubDescriptionCache.get(cacheKey);
  }

  let description = "";
  try {
    if (target.kind === "repo") {
      const repo = await fetchJson(
        `https://api.github.com/repos/${target.path}`,
      );
      description =
        typeof repo?.description === "string" && repo.description.trim()
          ? repo.description.trim()
          : "";
    } else {
      const user = await fetchJson(
        `https://api.github.com/users/${target.path}`,
      );
      description =
        typeof user?.bio === "string" && user.bio.trim()
          ? user.bio.trim()
          : typeof user?.name === "string" && user.name.trim()
            ? user.name.trim()
            : "";
    }
  } catch {
    description = "";
  }

  if (!description) {
    description =
      target.kind === "repo" ? "GitHub repository" : "GitHub profile";
  }

  githubDescriptionCache.set(cacheKey, description);
  return description;
}

function githubTarget(node) {
  const repo = node.attributes?.repo;
  const normalizedRepo =
    typeof repo === "string" ? repo.replace(/^\/+/, "") : "";
  const description =
    typeof node.attributes?.description === "string"
      ? node.attributes.description
      : typeof node.attributes?.desc === "string"
        ? node.attributes.desc
        : "";

  if (/^[\w.-]+\/[\w.-]+$/.test(normalizedRepo)) {
    return {
      kind: "repo",
      label: normalizedRepo,
      description,
      meta: "GitHub repository",
      image: `https://opengraph.githubassets.com/1/${normalizedRepo}`,
      path: normalizedRepo,
      url: `https://github.com/${normalizedRepo}`,
    };
  }

  const user = node.attributes?.user;
  if (typeof user === "string" && /^[\w.-]+$/.test(user)) {
    return {
      kind: "user",
      label: user,
      description,
      meta: "GitHub user",
      image: `https://opengraph.githubassets.com/1/${user}`,
      path: user,
      url: `https://github.com/${user}`,
    };
  }

  return null;
}

function githubTargetFromUrl(value) {
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    return null;
  }

  if (url.hostname !== "github.com") return null;

  const pathParts = url.pathname.split("/").filter(Boolean);
  if (pathParts.length === 1 && /^[\w.-]+$/.test(pathParts[0])) {
    const user = pathParts[0];
    return {
      kind: "user",
      label: user,
      description: "",
      meta: "GitHub user",
      image: `https://opengraph.githubassets.com/1/${user}`,
      path: user,
      url: `https://github.com/${user}`,
    };
  }

  if (
    pathParts.length >= 2 &&
    /^[\w.-]+$/.test(pathParts[0]) &&
    /^[\w.-]+$/.test(pathParts[1])
  ) {
    const repo = `${pathParts[0]}/${pathParts[1]}`;
    return {
      kind: "repo",
      label: repo,
      description: "",
      meta: "GitHub repository",
      image: `https://opengraph.githubassets.com/1/${repo}`,
      path: repo,
      url: `https://github.com/${repo}`,
    };
  }

  return null;
}

async function githubCardHtml(target) {
  const safeUrl = escapeHtml(target.url);
  const safeImage = escapeHtml(target.image);
  const safeLabel = escapeHtml(target.label);
  const safeDescription = escapeHtml(await githubDescription(target));

  return `<div class="github-card"><a class="github-card__link" href="${safeUrl}" target="_blank" rel="noreferrer"><span class="github-card__thumb" aria-hidden="true"><img src="${safeImage}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></span><span class="github-card__body"><span class="github-card__title">${safeLabel}</span><span class="github-card__desc">${safeDescription}</span><span class="github-card__meta" aria-label="GitHub"><span class="github-card__favicon" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.86c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path></svg></span></span></span></a></div>`;
}

async function transformGithub(node) {
  const target = githubTarget(node);
  if (!target) return;

  node.type = "html";
  node.value = await githubCardHtml(target);
  delete node.name;
  delete node.attributes;
  delete node.children;
  delete node.data;
}

async function transformGithubUrlParagraph(node) {
  if (!Array.isArray(node.children) || node.children.length !== 1) return;

  const child = node.children[0];
  const target =
    child.type === "text"
      ? githubTargetFromUrl(child.value)
      : child.type === "link"
        ? githubTargetFromUrl(child.url)
        : null;

  if (!target) return;

  node.type = "html";
  node.value = await githubCardHtml(target);
  delete node.children;
  delete node.data;
}

function transformFuki(node) {
  const side = node.name === "fuki-right" ? "right" : "left";
  const isInline = node.type === "textDirective";
  const icon =
    typeof node.attributes?.icon === "string" && node.attributes.icon.trim()
      ? node.attributes.icon
      : "/icon/icon.svg";
  const iconNode = {
    type: "image",
    url: icon,
    alt: "",
    data: {
      hProperties: { className: ["fuki__icon"] },
    },
  };
  const contentNode = {
    type: "containerDirective",
    name: "fukiContent",
    children: node.children,
    data: {
      hName: isInline ? "span" : "div",
      hProperties: { className: ["fuki__content"] },
    },
  };

  if (side === "right") {
    node.children = [contentNode, iconNode];
  } else {
    node.children = [iconNode, contentNode];
  }

  const className = [
    "fuki",
    `fuki--${side}`,
    isInline ? "fuki--inline" : "fuki--block",
  ];
  if (node.attributes?.tone === "emphasis") {
    className.push("fuki--emphasis");
  }

  node.data = {
    hName: isInline ? "span" : "div",
    hProperties: { className },
  };
}

export default function remarkDirectiveWidgets() {
  return async (tree) => {
    const githubNodes = [];
    const githubUrlParagraphs = [];

    visit(tree, (node) => {
      if (node.type === "paragraph") {
        githubUrlParagraphs.push(node);
        return;
      }

      if (
        node.type === "containerDirective" &&
        ADMONITION_TYPES.has(node.name)
      ) {
        transformAdmonition(node);
        return;
      }

      if (
        (node.type === "leafDirective" || node.type === "textDirective") &&
        node.name === "github"
      ) {
        githubNodes.push(node);
        return;
      }

      if (
        (node.type === "containerDirective" || node.type === "textDirective") &&
        (node.name === "fuki" || node.name === "fuki-right")
      ) {
        transformFuki(node);
      }
    });

    await Promise.all([
      ...githubNodes.map((node) => transformGithub(node)),
      ...githubUrlParagraphs.map((node) => transformGithubUrlParagraph(node)),
    ]);
  };
}
