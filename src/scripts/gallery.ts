import type { GalleryPhoto } from "@/data/gallery";

const gallery = document.querySelector<HTMLElement>("[data-photo-gallery]");
if (gallery) initGallery(gallery);

function initGallery(gallery: HTMLElement) {
  const get = <T extends HTMLElement>(selector: string) => {
    const element = gallery.querySelector<T>(selector);
    if (!element) throw new Error(`Missing gallery element: ${selector}`);
    return element;
  };
  const photos: GalleryPhoto[] = JSON.parse(
    get("[data-gallery-data]").textContent || "[]",
  );
  if (!photos.length) return;

  const dialog = get<HTMLDialogElement>("[data-gallery-dialog]");
  const image = get<HTMLImageElement>("[data-gallery-image]");
  const frame = get("[data-gallery-image-frame]");
  const backdrop = get("[data-gallery-backdrop]");
  const article = get<HTMLAnchorElement>("[data-gallery-article]");
  const position = get("[data-gallery-position]");
  const message = get("[data-gallery-message]");
  const feedback = get("[data-gallery-feedback]");
  const retry = get<HTMLButtonElement>("[data-gallery-retry]");
  const close = get<HTMLButtonElement>("[data-gallery-close]");
  const previous = get<HTMLButtonElement>("[data-gallery-previous]");
  const next = get<HTMLButtonElement>("[data-gallery-next]");
  const strip = get("[data-gallery-thumbnails]");
  const triggers = [
    ...gallery.querySelectorAll<HTMLAnchorElement>("[data-gallery-open]"),
  ];
  const thumbnails = [
    ...gallery.querySelectorAll<HTMLButtonElement>("[data-gallery-thumbnail]"),
  ];
  const grid = get(".photo-gallery__grid");
  let layoutFrame = 0;
  const layoutTiles = () => {
    layoutFrame = 0;
    const gap = parseFloat(getComputedStyle(grid).columnGap);
    const spans = triggers.map((tile) =>
      Math.ceil(tile.getBoundingClientRect().height + gap),
    );
    triggers.forEach((tile, index) => {
      tile.style.gridRowEnd = `span ${spans[index]}`;
    });
    // Sparse row placement preserves source order from top to bottom. Using
    // dense placement would let later (older) photos jump into earlier gaps.
    grid.dataset.masonry = "";
  };
  const scheduleLayout = () => {
    if (!layoutFrame) layoutFrame = requestAnimationFrame(layoutTiles);
  };
  let gridWidth = 0;
  const layoutObserver = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === gridWidth) return;
    gridWidth = entry.contentRect.width;
    scheduleLayout();
  });
  layoutObserver.observe(grid);
  layoutTiles();
  const session = crypto.randomUUID();
  let current = 0;
  let request = 0;
  let returnFocus: HTMLElement | null = null;
  let scrollPosition = 0;
  let oldScrollRestoration = history.scrollRestoration;
  let pointer: { id: number; x: number; y: number } | null = null;
  let swiped = false;
  const preloaded = new Set<string>();

  // Only visible thumbnails fetch images, even when opening the viewer at the end.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const thumbnailImage = entry.target as HTMLImageElement;
        if (thumbnailImage.dataset.src)
          thumbnailImage.src = thumbnailImage.dataset.src;
        observer.unobserve(thumbnailImage);
      }
    },
    { root: strip, rootMargin: "0px 200px" },
  );
  strip
    .querySelectorAll("img")
    .forEach((thumbnail) => observer.observe(thumbnail));

  const tileState = (tileImage: HTMLImageElement) => {
    const error = tileImage
      .closest("[data-gallery-open]")
      ?.querySelector<HTMLElement>("[data-gallery-tile-error]");
    if (!error) return;
    const failed = tileImage.complete && tileImage.naturalWidth === 0;
    tileImage.hidden = failed;
    error.hidden = !failed;
    if (!failed && tileImage.naturalWidth > 0) {
      tileImage.parentElement?.style.setProperty(
        "--photo-ratio",
        `${tileImage.naturalWidth} / ${tileImage.naturalHeight}`,
      );
      scheduleLayout();
    }
  };
  triggers.forEach((trigger) => {
    const tileImage = trigger.querySelector("img")!;
    tileImage.addEventListener("load", () => tileState(tileImage));
    tileImage.addEventListener("error", () => tileState(tileImage));
    if (tileImage.complete) tileState(tileImage);
  });

  const urlFor = (index?: number) => {
    const url = new URL(location.href);
    if (index === undefined) url.searchParams.delete("photo");
    else url.searchParams.set("photo", photos[index].id);
    return url;
  };

  const centerThumbnail = () => {
    const thumbnail = thumbnails[current];
    // Scroll only the strip; scrollIntoView can move the underlying page.
    strip.scrollTo({
      left:
        thumbnail.offsetLeft -
        strip.offsetLeft -
        (strip.clientWidth - thumbnail.offsetWidth) / 2,
      behavior: "instant",
    });
  };

  const loadPhoto = () => {
    const version = ++request;
    const photo = photos[current];
    image.hidden = true;
    image.alt = photo.alt;
    backdrop.style.backgroundImage = "";
    feedback.hidden = false;
    retry.hidden = true;
    message.textContent = "画像を読み込んでいます…";
    frame.setAttribute("aria-busy", "true");
    const loading = new Image();
    loading.onload = async () => {
      await loading.decode().catch(() => {});
      if (version !== request || !dialog.open) return;
      image.src = photo.src;
      image.hidden = false;
      feedback.hidden = true;
      message.textContent = "";
      frame.setAttribute("aria-busy", "false");
      backdrop.style.backgroundImage = `url(${JSON.stringify(photo.src)})`;
      for (const index of [current - 1, current + 1]) {
        const neighbor = photos[index]?.src;
        if (neighbor && !preloaded.has(neighbor)) {
          preloaded.add(neighbor);
          const preload = new Image();
          preload.src = neighbor;
        }
      }
    };
    loading.onerror = () => {
      if (version !== request || !dialog.open) return;
      frame.setAttribute("aria-busy", "false");
      message.textContent = "画像を読み込めませんでした。";
      retry.hidden = false;
    };
    loading.src = photo.src;
  };

  const showPhoto = (
    index: number,
    mode: "push" | "replace" | "none" = "replace",
  ) => {
    if (index < 0 || index >= photos.length) return;
    current = index;
    const photo = photos[current];
    if (!dialog.open) {
      scrollPosition = window.scrollY;
      oldScrollRestoration = history.scrollRestoration;
      history.scrollRestoration = "manual";
      document.documentElement.classList.add("photo-gallery-open");
      dialog.showModal();
      close.focus({ preventScroll: true });
    }
    if (mode === "push")
      history.pushState(
        { ...history.state, photoGallery: session },
        "",
        urlFor(current),
      );
    if (mode === "replace")
      history.replaceState(history.state, "", urlFor(current));
    article.href = photo.articleHref;
    position.textContent = `${current + 1} / ${photos.length}`;
    previous.disabled = current === 0;
    next.disabled = current === photos.length - 1;
    // A disabled arrow must not leave keyboard focus on the document body.
    if (
      (document.activeElement === previous && previous.disabled) ||
      (document.activeElement === next && next.disabled)
    )
      close.focus({ preventScroll: true });
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.setAttribute("aria-current", String(index === current));
      thumbnail.tabIndex = index === current ? 0 : -1;
    });
    centerThumbnail();
    loadPhoto();
  };

  const finishClose = () => {
    if (!dialog.open) return;
    ++request;
    dialog.close();
    pointer = null;
    document.documentElement.classList.remove("photo-gallery-open");
    history.scrollRestoration = oldScrollRestoration;
    returnFocus?.focus({ preventScroll: true });
    window.scrollTo({ top: scrollPosition, behavior: "instant" });
  };

  const closeGallery = () => {
    if (!dialog.open) return;
    const ownsEntry = history.state?.photoGallery === session;
    finishClose();
    if (ownsEntry) history.back();
    else history.replaceState(history.state, "", urlFor());
  };

  triggers.forEach((trigger, index) =>
    trigger.addEventListener("click", (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      returnFocus = trigger;
      showPhoto(index, "push");
    }),
  );
  thumbnails.forEach((thumbnail, index) =>
    thumbnail.addEventListener("click", () => showPhoto(index)),
  );
  previous.addEventListener("click", () => showPhoto(current - 1));
  next.addEventListener("click", () => showPhoto(current + 1));
  retry.addEventListener("click", loadPhoto);
  close.addEventListener("click", closeGallery);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeGallery();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const index = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: photos.length - 1,
    }[event.key];
    if (index === undefined) return;
    event.preventDefault();
    const thumbnailFocused = (event.target as HTMLElement).matches(
      "[data-gallery-thumbnail]",
    );
    showPhoto(index);
    if (thumbnailFocused) thumbnails[current].focus({ preventScroll: true });
  });

  frame.addEventListener("pointerdown", (event) => {
    swiped = false;
    if (
      !event.isPrimary ||
      event.pointerType === "mouse" ||
      (event.target as HTMLElement).closest("button")
    )
      return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    frame.setPointerCapture(event.pointerId);
  });
  frame.addEventListener("pointerup", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      swiped = true;
      showPhoto(current + (dx < 0 ? 1 : -1));
    }
  });
  frame.addEventListener("pointercancel", () => {
    pointer = null;
    swiped = false;
  });
  frame.addEventListener("click", (event) => {
    if (swiped) {
      swiped = false;
      return;
    }
    if (image.hidden || (event.target as HTMLElement).closest("button")) return;
    // object-fit leaves empty space inside the image element's box.
    const rect = image.getBoundingClientRect();
    const scale = Math.min(
      rect.width / image.naturalWidth,
      rect.height / image.naturalHeight,
    );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const left = rect.left + (rect.width - width) / 2;
    const top = rect.top + (rect.height - height) / 2;
    if (
      event.clientX < left ||
      event.clientX > left + width ||
      event.clientY < top ||
      event.clientY > top + height
    )
      closeGallery();
  });

  const syncUrl = () => {
    const id = new URL(location.href).searchParams.get("photo");
    const index = photos.findIndex((photo) => photo.id === id);
    if (index >= 0) {
      returnFocus ??= triggers[index];
      showPhoto(index, "none");
    } else {
      finishClose();
      if (id !== null) history.replaceState(history.state, "", urlFor());
    }
  };
  addEventListener("popstate", syncUrl);
  addEventListener("pageshow", (event) => {
    if (event.persisted) syncUrl();
  });
  syncUrl();
}
