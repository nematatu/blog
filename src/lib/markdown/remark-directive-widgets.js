import { visit } from "unist-util-visit";

const ADMONITION_TYPES = new Set([
  "note",
  "tip",
  "important",
  "caution",
  "warning",
]);

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

function githubTarget(node) {
  const repo = node.attributes?.repo;
  if (typeof repo === "string" && /^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return {
      label: repo,
      meta: "GitHub repository",
      path: repo,
      url: `https://github.com/${repo}`,
    };
  }

  const user = node.attributes?.user;
  if (typeof user === "string" && /^[\w.-]+$/.test(user)) {
    return {
      label: user,
      meta: "GitHub user",
      path: user,
      url: `https://github.com/${user}`,
    };
  }

  return null;
}

function transformGithub(node) {
  const target = githubTarget(node);
  if (!target) return;

  const safeUrl = escapeHtml(target.url);
  const safeLabel = escapeHtml(target.label);
  const safeMeta = escapeHtml(target.meta);

  node.type = "html";
  node.value = `<div class="github-card"><a href="${safeUrl}" target="_blank" rel="noreferrer"><span class="github-card__label">${safeLabel}</span><span class="github-card__meta">${safeMeta}</span></a></div>`;
  delete node.name;
  delete node.attributes;
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
  return (tree) => {
    visit(tree, (node) => {
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
        transformGithub(node);
        return;
      }

      if (
        (node.type === "containerDirective" || node.type === "textDirective") &&
        (node.name === "fuki" || node.name === "fuki-right")
      ) {
        transformFuki(node);
      }
    });
  };
}
