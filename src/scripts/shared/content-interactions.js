const root = document.documentElement;
const lightboxImageSelector = "article img:not([data-no-lightbox])";

document.addEventListener("click", (event) => {
  const target = event.target.closest?.("a,img");
  if (target?.matches(lightboxImageSelector)) openLightbox(target);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const lightbox = document.querySelector(".image-lightbox.is-open");
    if (lightbox) closeLightbox(lightbox);
  }
});

for (const image of document.querySelectorAll(lightboxImageSelector)) {
  image.tabIndex = 0;
  image.role = "button";
}

if (document.querySelector(".twitter-tweet")) {
  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  document.head.append(script);
}

if (document.querySelector("iconify-icon")) {
  const script = document.createElement("script");
  script.src =
    "https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js";
  script.defer = true;
  document.head.append(script);
}

function openLightbox(image) {
  let lightbox = document.querySelector(".image-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "image-lightbox";
    lightbox.innerHTML = `<button class="image-lightbox__close" type="button" aria-label="Close image preview"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><img class="image-lightbox__image" alt="" />`;
    lightbox.addEventListener("click", (event) => {
      if (
        event.target === lightbox ||
        event.target.closest(".image-lightbox__image, .image-lightbox__close")
      )
        closeLightbox(lightbox);
    });
    document.body.append(lightbox);
  }

  const preview = lightbox.querySelector("img");
  preview.src = image.currentSrc || image.src;
  preview.alt = image.alt || "";
  root.classList.add("image-lightbox-open");
  requestAnimationFrame(() => lightbox.classList.add("is-open"));
}

function closeLightbox(lightbox) {
  lightbox.classList.remove("is-open");
  root.classList.remove("image-lightbox-open");
}
