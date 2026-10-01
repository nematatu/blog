import { visit } from "unist-util-visit";
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
  const first = node.children?.[0];
  const title =
    first?.type === "paragraph" && first.data?.directiveLabel === true
      ? node.children.shift()
      : null;
  const className = [
    "admonition my-6 border-l-4 bg-black/[0.03] px-4 py-3 text-black/80",
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
        className: ["m-0 font-semibold text-black"],
      },
    };
    node.children.unshift(title);
  }
}

export default function remarkDirectiveWidgets() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === "paragraph") {
        const child = node.children?.length === 1 && node.children[0];
        const target =
          child?.type === "text"
            ? githubTargetFromUrl(child.value)
            : child?.type === "link"
              ? githubTargetFromUrl(child.url)
              : null;
        if (target) renderGithubCard(node, target);
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
        if (target) renderGithubCard(node, target);
        return;
      }
    });
  };
}
