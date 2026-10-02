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

if (document.querySelector(".twitter-tweet")) {
  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  document.head.append(script);
}
