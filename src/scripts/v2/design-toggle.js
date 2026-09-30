const root = document.documentElement;
const toggle = document.querySelector("[data-design-toggle]");

async function enableClassicDesign() {
  await import("@/scripts/v1/index.js");
  root.classList.remove("design-v2");
  root.classList.add("design-v1");
}

if (root.classList.contains("design-v1")) {
  void import("@/scripts/v1/index.js");
} else {
  root.classList.add("design-v2");
}

if (toggle) {
  const updateToggle = () => {
    const classic = root.classList.contains("design-v1");
    toggle.textContent = classic
      ? "新しいデザインに切替"
      : "以前のデザインに切替";
    toggle.setAttribute("aria-pressed", String(classic));
  };

  updateToggle();
  toggle.addEventListener("click", async () => {
    if (root.classList.contains("design-v1")) {
      root.classList.remove("design-v1");
      root.classList.add("design-v2");
    } else {
      await enableClassicDesign();
    }
    try {
      localStorage.setItem(
        "blog-design",
        root.classList.contains("design-v1") ? "classic" : "reference",
      );
    } catch {}
    updateToggle();
  });
}
