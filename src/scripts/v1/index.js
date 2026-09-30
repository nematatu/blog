import styles from "@/styles/v1/index.css?inline";

if (!document.querySelector("[data-v1-styles]")) {
  const style = document.createElement("style");
  style.dataset.v1Styles = "";
  style.textContent = styles;
  document.head.append(style);
}

document.addEventListener("click", async (event) => {
  if (!document.documentElement.classList.contains("design-v1")) return;
  const target = event.target.closest?.("[data-copy-code]");
  if (!target) return;

  const code = target.closest(".code-block-wrapper")?.querySelector("pre");
  if (!code) return;

  await navigator.clipboard.writeText(code.innerText);
  target.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`;
  setTimeout(() => {
    target.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>`;
  }, 2000);
});
