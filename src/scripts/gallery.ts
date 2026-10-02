import { galleryUrl, selectedPhoto } from "@/lib/gallery-url";

const gallery = document.querySelector<HTMLElement>("[data-photo-gallery]");
if (gallery) {
  const get = <T extends HTMLElement>(name: string) =>
    gallery.querySelector<T>(`[data-gallery-${name}]`)!;
  const tiles = [
    ...gallery.querySelectorAll<HTMLAnchorElement>("[data-gallery-open]"),
  ];
  const photos = tiles.map((tile) => ({ id: tile.dataset.galleryId! }));
  const dialog = get<HTMLDialogElement>("dialog");
  const image = get<HTMLImageElement>("image");
  const previous = get<HTMLButtonElement>("previous");
  const next = get<HTMLButtonElement>("next");
  const retry = get<HTMLButtonElement>("retry");
  const message = get("message");
  let current = 0;
  let touch: { x: number; y: number } | null = null;

  function load() {
    image.hidden = true;
    retry.hidden = true;
    image.setAttribute("aria-busy", "true");
    message.textContent = "画像を読み込んでいます…";
    const source = tiles[current].querySelector("img")!;
    image.alt = source.alt;
    image.src = source.src;
  }
  image.addEventListener("load", () => {
    image.hidden = false;
    image.removeAttribute("aria-busy");
    message.textContent = "";
  });
  image.addEventListener("error", () => {
    image.removeAttribute("aria-busy");
    message.textContent = "画像を読み込めませんでした。";
    retry.hidden = false;
  });
  retry.addEventListener("click", load);

  function show(index: number, mode: "push" | "replace" | "none" = "replace") {
    if (index < 0 || index >= tiles.length) return;
    current = index;
    if (mode !== "none")
      history[mode === "push" ? "pushState" : "replaceState"](
        mode === "push"
          ? { ...history.state, photoGallery: true }
          : history.state,
        "",
        galleryUrl(location.href, photos[index].id),
      );
    if (!dialog.open) {
      tiles[index].focus({ preventScroll: true });
      dialog.showModal();
    }
    get<HTMLAnchorElement>("article").href =
      tiles[index].dataset.galleryArticleHref!;
    get("position").textContent = `${index + 1} / ${tiles.length}`;
    previous.disabled = index === 0;
    next.disabled = index === tiles.length - 1;
    if (
      (document.activeElement === previous && previous.disabled) ||
      (document.activeElement === next && next.disabled)
    )
      dialog.querySelector("button")!.focus({ preventScroll: true });
    load();
  }
  tiles.forEach((tile, index) =>
    tile.addEventListener("click", (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      show(index, "push");
    }),
  );
  previous.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  dialog.addEventListener("close", () => {
    if (!new URL(location.href).searchParams.has("photo")) return;
    if (history.state?.photoGallery) history.back();
    else history.replaceState(history.state, "", galleryUrl(location.href));
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const index = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: tiles.length - 1,
    }[event.key];
    if (index === undefined) return;
    event.preventDefault();
    show(index);
  });
  image.addEventListener("pointerdown", (event) => {
    if (event.isPrimary && event.pointerType !== "mouse") {
      touch = { x: event.clientX, y: event.clientY };
      image.setPointerCapture(event.pointerId);
    }
  });
  image.addEventListener("pointerup", (event) => {
    if (!touch) return;
    const dx = event.clientX - touch.x;
    const dy = event.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25)
      show(current + (dx < 0 ? 1 : -1));
  });
  image.addEventListener("pointercancel", () => {
    touch = null;
  });

  function sync() {
    const { id, index } = selectedPhoto(photos, location.href);
    if (index >= 0) show(index, "none");
    else {
      if (id !== null)
        history.replaceState(history.state, "", galleryUrl(location.href));
      dialog.close();
    }
  }
  addEventListener("popstate", sync);
  addEventListener("pageshow", (event) => {
    if (event.persisted) sync();
  });
  sync();
}
