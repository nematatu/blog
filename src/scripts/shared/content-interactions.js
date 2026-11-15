const dialog = document.querySelector(".image-lightbox");
const selector = ".post-body img:not([data-no-lightbox])";

for (const image of document.querySelectorAll(selector)) {
  if (image.closest("a")) continue;
  image.tabIndex = 0;
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", `${image.alt || "画像"}を拡大表示`);
  // alt="" のままだと「装飾」と「操作できるボタン」が矛盾するので、名前を持たせる。
  if (!image.alt) image.alt = "画像";
}

const preview = dialog.querySelector("img");
let source = null;

// タップした画像から拡大表示へ、拡大表示から元の画像へ、View Transition で移る。
// 画像は同じ名前 (lightbox-image) を渡し合って広がり・縮み、黒い背景はフェードする。
// 未対応のブラウザと、動きを減らす設定では、アニメーションなしで切り替える。
function transition(update) {
  if (
    !source ||
    !document.startViewTransition ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  const opening = !dialog.open;
  const [from, to] = opening ? [source, preview] : [preview, source];
  from.style.viewTransitionName = "lightbox-image";
  if (!opening) dialog.style.viewTransitionName = "lightbox-backdrop";
  dialog.classList.add("is-animating");
  const clear = () => {
    dialog.classList.remove("is-animating");
    for (const element of [source, preview, dialog]) {
      element?.style.removeProperty("view-transition-name");
    }
  };
  document
    .startViewTransition(() => {
      from.style.removeProperty("view-transition-name");
      to.style.viewTransitionName = "lightbox-image";
      if (opening) dialog.style.viewTransitionName = "lightbox-backdrop";
      else dialog.style.removeProperty("view-transition-name");
      update();
    })
    .finished.then(clear, clear);
}

function openImage(image) {
  if (!image.matches(selector) || image.closest("a") || dialog.open) return;
  source = image;
  preview.src = image.currentSrc || image.src;
  preview.alt = image.alt;
  image.focus({ preventScroll: true });
  // 拡大画像の寸法が決まってから遷移しないと、行き先の位置がずれる。
  preview
    .decode()
    .catch(() => {})
    .finally(() => transition(() => dialog.showModal()));
}

function closeImage() {
  if (!dialog.open) return;
  transition(() => {
    dialog.close();
    source?.focus({ preventScroll: true });
  });
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
// 背景のタップ、Esc、閉じるボタンのどれで閉じても同じアニメーションにする。
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeImage();
});
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeImage();
});
dialog.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  closeImage();
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
