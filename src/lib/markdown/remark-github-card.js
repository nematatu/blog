function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function githubTarget(kind, path, description = "") {
  const valid = kind === "repo" ? /^[\w.-]+\/[\w.-]+$/ : /^[\w.-]+$/;
  if (typeof path !== "string" || !valid.test(path)) return null;
  return {
    kind,
    path,
    label: path,
    description,
    image: `https://opengraph.githubassets.com/1/${path}`,
    url: `https://github.com/${path}`,
  };
}

export function githubTargetFromDirective(node) {
  const { repo, user, description, desc } = node.attributes ?? {};
  const summary =
    [description, desc].find((value) => typeof value === "string") ?? "";
  return (
    githubTarget(
      "repo",
      typeof repo === "string" ? repo.replace(/^\/+/, "") : "",
      summary,
    ) ?? githubTarget("user", user, summary)
  );
}

export function githubTargetFromUrl(value) {
  try {
    const url = new URL(String(value).trim());
    if (url.hostname !== "github.com") return null;
    const [user, repo] = url.pathname.split("/").filter(Boolean);
    return repo
      ? githubTarget("repo", `${user}/${repo}`)
      : githubTarget("user", user);
  } catch {
    return null;
  }
}

function githubCardHtml(target) {
  const safeUrl = escapeHtml(target.url);
  const safeImage = escapeHtml(target.image);
  const safeLabel = escapeHtml(target.label);
  const safeDescription = escapeHtml(
    target.description ||
      (target.kind === "repo" ? "GitHub repository" : "GitHub profile"),
  );

  return `<div class="github-card not-prose max-w-[85%] py-8 max-[840px]:max-w-full">
    <a class="github-card__link flex min-h-40 items-stretch overflow-hidden border border-black/15 bg-white text-black/80 outline-none hover:border-blue-700/60 hover:text-black focus-visible:border-blue-700/60" href="${safeUrl}" target="_blank" rel="noreferrer">
      <span class="github-card__thumb flex w-80 max-w-[58%] shrink-0 items-center justify-center overflow-hidden bg-neutral-100 max-[840px]:w-56 max-[840px]:max-w-[54%]" aria-hidden="true"><img class="block size-full object-cover" src="${safeImage}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></span>
      <span class="flex min-w-0 flex-1 flex-col justify-between px-8 py-5">
        <span class="line-clamp-2 font-sans text-base leading-snug font-semibold text-black">${safeLabel}</span>
        <span class="line-clamp-3 text-sm leading-snug text-black/60">${safeDescription}</span>
        <span class="flex items-center justify-end text-xs text-black/45" aria-label="GitHub"><span class="inline-flex size-4 shrink-0 items-center justify-center text-black/55" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 3.86c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path></svg></span></span>
      </span>
    </a>
  </div>`;
}

export function renderGithubCard(node, target) {
  node.type = "html";
  node.value = githubCardHtml(target);
  delete node.name;
  delete node.attributes;
  delete node.children;
  delete node.data;
}
