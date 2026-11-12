const dialog = document.querySelector(".image-lightbox");
const selector = ".post-body img:not([data-no-lightbox])";

for (const image of document.querySelectorAll(selector)) {
  if (image.closest("a")) continue;
  image.tabIndex = 0;
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", `${image.alt || "画像"}を拡大表示`);
}

function openImage(image) {
  if (!image.matches(selector) || image.closest("a")) return;
  const preview = dialog.querySelector("img");
  preview.src = image.currentSrc || image.src;
  preview.alt = image.alt;
  image.focus({ preventScroll: true });
  dialog.showModal();
}

document.addEventListener("click", (event) => {
  if (event.target instanceof HTMLImageElement) openImage(event.target);
});
document.addEventListener("keydown", (event) => {
  if (
    event.target instanceof HTMLImageElement &&
    (event.key === "Enter" || event.key === " ")
  ) {
    event.preventDefault();
    openImage(event.target);
  }
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

// コードブロックにコピーボタンを付ける。横スクロールしても動かないよう、pre を包んだ枠に置く。
if (navigator.clipboard) {
  for (const pre of document.querySelectorAll(".post-body pre")) {
    const frame = document.createElement("div");
    frame.className = "code-frame";
    pre.replaceWith(frame);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.textContent = "コピー";
    button.setAttribute("aria-label", "コードをコピー");
    frame.append(pre, button);
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(
          (pre.querySelector("code") ?? pre).innerText,
        );
        button.textContent = "コピーしました";
      } catch {
        button.textContent = "コピーできません";
      }
      setTimeout(() => {
        button.textContent = "コピー";
      }, 2000);
    });
  }
}

if (document.querySelector(".twitter-tweet")) {
  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  document.head.append(script);
}
