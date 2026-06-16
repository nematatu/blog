import { visit } from "unist-util-visit";

const ADMONITION_TYPES = new Set([
  "note",
  "tip",
  "important",
  "caution",
  "warning",
]);

const ADMONITION_LABELS = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  caution: "Caution",
  warning: "Warning",
};

function text(value) {
  return { type: "text", value };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function directiveLabel(node, fallback) {
  if (!Array.isArray(node.children) || node.children.length === 0) {
    return fallback;
  }

  const first = node.children[0];
  if (first.type !== "paragraph" || !Array.isArray(first.children)) {
    return fallback;
  }

  const labelParts = [];
  for (const child of first.children) {
    if (child.type !== "text") return fallback;
    labelParts.push(child.value);
  }

  const value = labelParts.join("").trim();
  if (!value) return fallback;

  node.children.shift();
  return value;
}

function transformAdmonition(node) {
  const type = node.name;
  const title = directiveLabel(node, ADMONITION_LABELS[type]);
  const className = ["admonition", `admonition--${type}`];

  node.data = {
    hName: "aside",
    hProperties: { className, dataAdmonition: type },
  };
  node.children.unshift({
    type: "paragraph",
    data: {
      hName: "div",
      hProperties: { className: ["admonition__title"] },
    },
    children: [text(title)],
  });
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
      }
    });
  };
}
