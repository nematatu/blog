const root = document.documentElement;
const lightboxImageSelector =
  "article img:not(.fuki__icon):not([data-no-lightbox])";

const copyIcon = (copied) =>
  copied
    ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>'
    : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';

const updateImageComparisonAria = (slider) => {
  const rawValue = Number(slider.value);
  const value = Math.round(
    Math.min(100, Math.max(0, Number.isFinite(rawValue) ? rawValue : 50)),
  );
  const beforeLabel = slider.dataset.beforeLabel || "変更前";
  const afterLabel = slider.dataset.afterLabel || "変更後";

  slider.setAttribute("aria-valuenow", String(value));
  slider.setAttribute(
    "aria-valuetext",
    `${beforeLabel} ${value}%、${afterLabel} ${100 - value}%`,
  );
};

addEventListener("DOMContentLoaded", async () => {
  const designToggle = document.querySelector("[data-design-toggle]");
  if (designToggle) {
    const classic = root.classList.contains("classic-design");
    designToggle.textContent = classic
      ? "新しいデザインに切替"
      : "以前のデザインに切替";
    designToggle.setAttribute("aria-pressed", String(classic));
  }

  document.addEventListener("click", async (event) => {
    const target = event.target.closest?.("button,a,img");
    if (!target) return;

    if (target.matches("[data-design-toggle]")) {
      const classic = root.classList.toggle("classic-design");
      target.textContent = classic
        ? "新しいデザインに切替"
        : "以前のデザインに切替";
      target.setAttribute("aria-pressed", String(classic));
      try {
        localStorage.setItem("blog-design", classic ? "classic" : "reference");
      } catch {}
    }
    if (target.id === "back-to-prev") history.back();
    if (target.dataset.copyCode) {
      const codeBlock = target
        .closest(".code-block-wrapper")
        ?.querySelector("pre");
      if (codeBlock) {
        await navigator.clipboard.writeText(codeBlock.innerText);
        target.innerHTML = copyIcon(true);
        setTimeout(() => (target.innerHTML = copyIcon(false)), 2000);
      }
    }
    if (target.matches(lightboxImageSelector)) openLightbox(target);
  });

  for (const image of document.querySelectorAll(lightboxImageSelector)) {
    image.tabIndex = 0;
    image.role = "button";
  }

  const sliders = document.querySelectorAll("img-comparison-slider");
  if (sliders.length) await import("img-comparison-slider");
  for (const slider of sliders) {
    updateImageComparisonAria(slider);
    slider.addEventListener("slide", () => updateImageComparisonAria(slider));
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
});

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
      ) {
        closeLightbox(lightbox);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox(lightbox);
      }
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
