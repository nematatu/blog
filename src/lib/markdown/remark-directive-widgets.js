import { visit } from "unist-util-visit";
import { directiveElement, directiveLabel } from "./widget-nodes.js";
import { transformCompare } from "./remark-compare.js";
import {
  githubTargetFromDirective,
  githubTargetFromUrl,
  renderGithubCard,
} from "./remark-github-card.js";

const ADMONITION_COLORS = {
  note: "border-blue-500",
  tip: "border-emerald-500",
  important: "border-violet-500",
  caution: "border-amber-500",
  warning: "border-red-500",
};

function transformAdmonition(node) {
  const type = node.name;
  const title = directiveLabel(node);
  const className = [
    "admonition my-6 border-l-4 bg-black/[0.03] px-4 py-3 text-black/80 dark:bg-white/[0.04] dark:text-white/80",
    ADMONITION_COLORS[type],
  ];

  node.data = {
    hName: "aside",
    hProperties: { className, dataAdmonition: type },
  };

  if (title) {
    title.data = {
      ...title.data,
      hName: "div",
      hProperties: {
        className: ["m-0 font-semibold text-black dark:text-white"],
      },
    };
    node.children.unshift(title);
  }
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
      hProperties: {
        className: [
          "fuki__icon absolute top-0 size-6 rounded-sm object-cover cursor-default",
        ],
      },
    },
  };
  const contentNode = directiveElement(
    "containerDirective",
    "fukiContent",
    isInline ? "span" : "div",
    [
      "fuki__content rounded-lg bg-[var(--fuki-background)]",
      isInline
        ? "inline-flex items-center px-[0.7em] py-[0.45em] leading-none"
        : "flow-root px-[0.9rem] py-[0.65rem]",
    ],
    node.children,
  );

  node.children =
    side === "right" ? [contentNode, iconNode] : [iconNode, contentNode];

  const className = [
    "fuki relative max-w-[calc(100%-3.75rem)] text-white",
    side === "right" ? "fuki--right mr-12 ml-3" : "fuki--left mr-3 ml-12",
    isInline ? "inline-block align-middle" : "flow-root my-5",
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
  return async (tree, file) => {
    const pendingCards = [];

    visit(tree, (node) => {
      if (node.type === "paragraph") {
        const child = node.children?.length === 1 && node.children[0];
        const target =
          child?.type === "text"
            ? githubTargetFromUrl(child.value)
            : child?.type === "link"
              ? githubTargetFromUrl(child.url)
              : null;
        if (target) pendingCards.push({ node, target });
        return;
      }

      if (node.type === "containerDirective" && node.name === "compare") {
        transformCompare(node, file);
        return;
      }

      if (
        node.type === "containerDirective" &&
        Object.hasOwn(ADMONITION_COLORS, node.name)
      ) {
        transformAdmonition(node);
        return;
      }

      if (
        (node.type === "leafDirective" || node.type === "textDirective") &&
        node.name === "github"
      ) {
        const target = githubTargetFromDirective(node);
        if (target) pendingCards.push({ node, target });
        return;
      }

      if (
        (node.type === "containerDirective" || node.type === "textDirective") &&
        (node.name === "fuki" || node.name === "fuki-right")
      ) {
        transformFuki(node);
      }
    });

    await Promise.all(
      pendingCards.map(({ node, target }) => renderGithubCard(node, target)),
    );
  };
}
