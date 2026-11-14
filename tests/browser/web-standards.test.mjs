// ビルド済みサイトを実ブラウザで開き、レンダリング後の DOM と計算済みスタイルを検証する。
// 静的解析では分からない「実際にどう読み込まれ、どう動くか」を確認するためのテスト。
// 事前に `pnpm build` が必要。`pnpm test:browser` で実行する。
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { serveDist } from "./static-server.mjs";

const dist = path.resolve("dist");
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };
// 外部画像の代わりに返す 1x1 PNG。ネットワークに依存させない。
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==",
  "base64",
);

let browser;
let site;

before(async () => {
  assert.ok(
    existsSync(path.join(dist, "index.html")),
    "dist/ がありません。先に `pnpm build` を実行してください。",
  );
  site = await serveDist(dist);
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await site?.close();
});

async function open(pathname, options = {}) {
  const context = await browser.newContext({ viewport: MOBILE, ...options });
  await context.route(
    (url) => url.origin !== site.origin,
    (route) =>
      route.request().resourceType() === "image"
        ? route.fulfill({ contentType: "image/png", body: PIXEL })
        : route.abort(),
  );
  const page = await context.newPage();
  await page.goto(site.origin + pathname, { waitUntil: "load" });
  return page;
}

const images = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("main img")].map((image) => {
      const rect = image.getBoundingClientRect();
      return {
        src: image.getAttribute("src"),
        className: image.className,
        loading: image.getAttribute("loading"),
        fetchpriority: image.getAttribute("fetchpriority"),
        inViewport: rect.top < innerHeight && rect.bottom > 0,
        inPostBody: Boolean(image.closest(".post-body")),
      };
    }),
  );

function postPaths() {
  const root = path.join(dist, "blog");
  return readdirSync(root, { recursive: true })
    .filter((file) => path.basename(file) === "index.html")
    .map((file) => `/blog/${path.dirname(file).split(path.sep).join("/")}/`)
    .sort();
}

test("記事一覧: 初期ビューポートのサムネイルは遅延読み込みせず、画面外は遅延読み込みする", async () => {
  for (const viewport of [MOBILE, DESKTOP]) {
    const page = await open("/", { viewport });
    const all = await images(page);
    const visible = all.filter((image) => image.inViewport);
    const hidden = all.filter((image) => !image.inViewport);
    assert.ok(visible.length > 0, "初期ビューポートにサムネイルがある");
    assert.deepEqual(
      visible.filter((image) => image.loading === "lazy"),
      [],
      `${viewport.width}px: 初期ビューポートの画像が lazy になっている`,
    );
    assert.ok(hidden.length > 0, "画面外にもサムネイルがある");
    // 先頭の数件は余裕を持って eager にしているので、十分下にあるものだけを見る。
    assert.equal(hidden.at(-1).loading, "lazy");
    await page.context().close();
  }
});

test("全記事: 優先度の高い画像は 1 枚までで、遅延読み込みと併用しない", async () => {
  const page = await open("/");
  for (const pathname of postPaths()) {
    await page.goto(site.origin + pathname, { waitUntil: "domcontentloaded" });
    const high = (await images(page)).filter(
      (image) => image.fetchpriority === "high",
    );
    assert.ok(high.length <= 1, `${pathname}: fetchpriority=high が複数ある`);
    for (const image of high) {
      assert.notEqual(
        image.loading,
        "lazy",
        `${pathname}: high と lazy を併用している`,
      );
      assert.ok(image.inViewport, `${pathname}: 画面外の画像が high`);
    }
  }
  await page.context().close();
});

test("記事: ヒーロー画像が LCP 候補として優先され、本文の画像は遅延読み込みされる", async () => {
  const page = await open("/");
  let checked = 0;
  for (const pathname of postPaths()) {
    await page.goto(site.origin + pathname, { waitUntil: "domcontentloaded" });
    const all = await images(page);
    const hero = all.find((image) =>
      image.className.includes("reference-post-image"),
    );
    if (!hero) continue;
    checked++;
    assert.equal(hero.loading, "eager", pathname);
    assert.equal(hero.fetchpriority, "high", pathname);
    // ヒーロー直下の 1 枚目だけは、初期ビューポートに入るなら遅延させない。
    const [first, ...rest] = all.filter((image) => image.inPostBody);
    if (first?.loading === "eager") {
      assert.ok(first.inViewport, `${pathname}: 画面外の画像が eager`);
      assert.equal(first.fetchpriority, null, pathname);
    }
    for (const image of rest) {
      assert.equal(image.loading, "lazy", `${pathname}: ${image.src}`);
    }
  }
  assert.ok(checked > 0, "ヒーロー画像のある記事が 1 つ以上ある");
  await page.context().close();
});

test("記事: ヒーロー画像がなく冒頭に画像がある場合、その画像を優先して読み込む", async () => {
  const page = await open("/");
  let checked = 0;
  for (const pathname of postPaths()) {
    await page.goto(site.origin + pathname, { waitUntil: "domcontentloaded" });
    const body = (await images(page)).filter((image) => image.inPostBody);
    const lead = body.find((image) => image.fetchpriority === "high");
    if (!lead) continue;
    checked++;
    assert.equal(lead, body[0], `${pathname}: 最初の画像ではない`);
    assert.equal(lead.loading, "eager", pathname);
    for (const image of body.slice(1)) {
      assert.equal(image.loading, "lazy", `${pathname}: ${image.src}`);
    }
  }
  assert.ok(checked > 0, "冒頭画像を優先する記事が 1 つ以上ある");
  await page.context().close();
});

// スクロールできる長さがあり、リンクで包まれていない本文画像を持つ記事を探す。
async function findLongPostWithImage(page) {
  for (const pathname of postPaths()) {
    await page.goto(site.origin + pathname, { waitUntil: "load" });
    const ok = await page.evaluate(
      () =>
        document.documentElement.scrollHeight > innerHeight * 2 &&
        [...document.querySelectorAll(".post-body img")].some(
          (image) => !image.closest("a"),
        ),
    );
    if (ok) return pathname;
  }
  assert.fail("検証に使える記事がありません");
}

test("読了位置バー: スクロール駆動アニメーションで進み、JS なしで動く", async () => {
  const page = await open("/", { javaScriptEnabled: false });
  await findLongPostWithImage(page);
  const bar = page.locator(".reading-progress");
  const scaleX = () =>
    bar.evaluate((element) => {
      const scale = getComputedStyle(element).scale;
      return scale === "none" ? 1 : Number.parseFloat(scale);
    });
  assert.match(
    await bar.evaluate(
      (element) => getComputedStyle(element).animationTimeline,
    ),
    /^scroll\(/,
  );
  assert.equal(await scaleX(), 0);
  await page.evaluate(() =>
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    }),
  );
  // アニメーションの進行は次の描画フレームで反映される。
  // JS を無効にしているのでページ内では待てず、テスト側で読み直す。
  let scale = await scaleX();
  for (let retry = 0; retry < 50 && Math.abs(scale - 1) >= 0.01; retry++) {
    await page.waitForTimeout(100);
    scale = await scaleX();
  }
  assert.ok(Math.abs(scale - 1) < 0.01, `末尾で 100% になる (実際: ${scale})`);
  await page.context().close();
});

test("読了位置バー: 動きを減らす設定では表示しない", async () => {
  const page = await open("/", { reducedMotion: "reduce" });
  await findLongPostWithImage(page);
  assert.equal(
    await page
      .locator(".reading-progress")
      .evaluate((element) => getComputedStyle(element).display),
    "none",
  );
  await page.context().close();
});

test("画像ビューア: クリックとキーボードで開き、Esc と背景クリックで閉じる", async () => {
  const page = await open("/", { viewport: DESKTOP });
  await findLongPostWithImage(page);
  const dialog = page.locator("dialog.image-lightbox");
  const isOpen = () => dialog.evaluate((element) => element.open);
  const image = page.locator(".post-body img:not(a img)").first();

  await image.scrollIntoViewIfNeeded();
  await image.click();
  assert.equal(await isOpen(), true, "クリックで開く");
  assert.equal(
    await dialog.evaluate((element) => element.matches(":modal")),
    true,
    "モーダルとして最上位レイヤーに表示される",
  );
  await page.keyboard.press("Escape");
  assert.equal(await isOpen(), false, "Esc で閉じる");

  await image.focus();
  await page.keyboard.press("Enter");
  assert.equal(await isOpen(), true, "Enter で開く");
  await page.mouse.click(5, DESKTOP.height / 2);
  assert.equal(await isOpen(), false, "背景クリックで閉じる");
  await page.context().close();
});

test("統計: グラフの数値がツールチップなしでも読める", async () => {
  const page = await open("/stats/");
  const heatmap = page.getByRole("img", { name: /ヒートマップ/ });
  assert.equal(await heatmap.count(), 1);
  const titles = await page
    .locator("[title$='件']:not([data-heatmap-day])")
    .evaluateAll((bars) =>
      bars.map((bar) => ({
        title: bar.title,
        label: bar.previousElementSibling?.textContent.replace(/\s+/g, ""),
      })),
    );
  assert.ok(titles.length > 0);
  for (const { title, label } of titles) {
    assert.equal(label, title.split(": ")[1], "棒の上に件数が表示されている");
  }
  await page.context().close();
});

test("スキップリンク: 最初の Tab で現れ、本文へ移動できる", async () => {
  const page = await open("/");
  const link = page.locator(".skip-link");
  const top = () => link.evaluate((el) => el.getBoundingClientRect().bottom);
  assert.ok((await top()) <= 0, "通常は画面外にある");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.className),
    "skip-link",
  );
  assert.ok((await top()) > 0, "フォーカスすると見える");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main");
  await page.context().close();
});

test("本文画像: 実寸が分かる画像は読み込み前から表示領域を確保する", async () => {
  const page = await open("/");
  // 画像を読み込ませず、読み込み前の状態 (属性だけで領域が決まる状態) を確かめる。
  await page.route(
    (url) => url.origin !== site.origin,
    (route) => route.abort(),
  );
  let sized = 0;
  for (const pathname of postPaths()) {
    await page.goto(site.origin + pathname, { waitUntil: "domcontentloaded" });
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll(".post-body img[width][height]")]
        .map((image) => {
          const rect = image.getBoundingClientRect();
          const expected = image.width / image.height;
          return {
            src: image.getAttribute("src"),
            ok:
              rect.height > 0 &&
              Math.abs(rect.width / rect.height - expected) / expected < 0.02 &&
              rect.width <=
                image.parentElement.getBoundingClientRect().width + 1,
          };
        })
        .concat([{ ok: true, count: true }]),
    );
    sized += bad.length - 1;
    assert.deepEqual(
      bad.filter((image) => !image.ok),
      [],
      `${pathname}: 縦横比が崩れているか、はみ出している`,
    );
  }
  assert.ok(sized > 0, "寸法つきの本文画像が 1 枚以上ある");
  await page.context().close();
});

test("記事末尾: 前後の記事へ移動でき、行き先が実在する", async () => {
  const page = await open("/");
  const paths = postPaths();
  let links = 0;
  for (const pathname of paths) {
    await page.goto(site.origin + pathname, { waitUntil: "domcontentloaded" });
    const hrefs = await page
      .getByRole("navigation", { name: "前後の記事" })
      .locator("a")
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href")));
    assert.ok(hrefs.length >= 1, `${pathname}: 前後どちらかはある`);
    for (const href of hrefs) {
      assert.ok(paths.includes(href), `${pathname}: ${href} が存在しない`);
      assert.notEqual(href, pathname);
    }
    links += hrefs.length;
  }
  // 両端の記事は片側だけなので、全体では記事数 x 2 - 2 本になる。
  assert.equal(links, paths.length * 2 - 2);
  await page.context().close();
});

test("コードブロック: コピーボタンでコードをクリップボードに入れられる", async () => {
  const page = await open("/", { viewport: DESKTOP });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const pathname of postPaths()) {
    await page.goto(site.origin + pathname, { waitUntil: "load" });
    if (await page.locator(".post-body pre").count()) break;
  }
  const frame = page.locator(".code-frame").first();
  const button = frame.getByRole("button", { name: "コードをコピー" });
  await frame.scrollIntoViewIfNeeded();
  await button.focus();
  assert.equal(
    await button.evaluate((element) => getComputedStyle(element).opacity),
    "1",
    "キーボードフォーカスで見える",
  );
  await button.click();
  const code = await frame.locator("code").evaluate((el) => el.innerText);
  assert.ok(code.trim().length > 0);
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), code);
  assert.equal(await button.textContent(), "コピーしました");
  await page.context().close();
});

test("記事: 読了時間の目安が表示される", async () => {
  const page = await open(postPaths()[0]);
  assert.match(
    await page.locator(".reference-post-reading-time").textContent(),
    /約\d+分で読めます/,
  );
  await page.context().close();
});

test("目次: 開くと見出しへ移動でき、リンク先が本文に実在する", async () => {
  const page = await open("/");
  let checked = 0;
  for (const pathname of postPaths()) {
    await page.goto(site.origin + pathname, { waitUntil: "domcontentloaded" });
    const toc = page.locator("details.post-toc");
    if (!(await toc.count())) continue;
    checked++;
    const missing = await toc
      .locator("a")
      .evaluateAll((anchors) =>
        anchors
          .map((a) => decodeURIComponent(a.getAttribute("href").slice(1)))
          .filter(
            (id) =>
              !document
                .querySelector(".post-body")
                ?.querySelector(`[id="${CSS.escape(id)}"]`),
          ),
      );
    assert.deepEqual(missing, [], `${pathname}: 行き先のない目次項目`);
    if (checked === 1) {
      assert.equal(
        await toc.evaluate((el) => el.open),
        false,
        "初期は閉じている",
      );
      await toc.locator("summary").click();
      const link = toc.locator("a").last();
      await link.click();
      const id = decodeURIComponent((await link.getAttribute("href")).slice(1));
      assert.equal(
        await page.evaluate(() => decodeURIComponent(location.hash.slice(1))),
        id,
      );
    }
  }
  assert.ok(checked > 0, "目次のある記事が 1 つ以上ある");
  await page.context().close();
});

for (const colorScheme of ["light", "dark"]) {
  test(`アクセシビリティ: 全ページで axe の違反がない (${colorScheme})`, async () => {
    const axe = readFileSync(
      createRequire(import.meta.url).resolve("axe-core/axe.min.js"),
      "utf8",
    );
    // 見出しレベルの飛びは記事の書き方によるもので、サイトの実装では直せない。
    const CONTENT_RULES = ["heading-order"];
    const page = await open("/", { colorScheme });
    const pages = [
      "/",
      "/tags/",
      "/stats/",
      "/search/",
      "/404.html",
      ...postPaths(),
    ];
    const tag = await page
      .goto(site.origin + "/tags/")
      .then(() => page.locator(".tag-list a").first().getAttribute("href"));
    for (const pathname of [...pages, tag]) {
      await page.goto(site.origin + pathname, { waitUntil: "load" });
      await page.addScriptTag({ content: axe });
      const violations = await page.evaluate(
        (disabled) =>
          globalThis.axe
            .run(document, {
              resultTypes: ["violations"],
              rules: Object.fromEntries(
                disabled.map((rule) => [rule, { enabled: false }]),
              ),
            })
            .then((result) =>
              result.violations.map(
                (violation) =>
                  `${violation.id}: ${violation.nodes[0].html.slice(0, 120)}`,
              ),
            ),
        CONTENT_RULES,
      );
      assert.deepEqual(violations, [], pathname);
    }
    await page.context().close();
  });
}

test("検索: 記事タイトルの語で検索すると、その記事が結果に出る", async () => {
  const page = await open("/search/");
  const input = page.getByRole("textbox", { name: "記事を検索" });
  await input.fill("Drizzle");
  const result = page.locator(".pagefind-ui__result-link").first();
  await result.waitFor({ timeout: 15_000 });
  assert.match(
    await result.getAttribute("href"),
    /\/blog\/develop\/drizzle-npm\//,
  );
  await page.context().close();
});

test("ナビゲーション: 今いるページのリンクに aria-current が付く", async () => {
  const page = await open("/tags/");
  const current = () =>
    page
      .locator("header nav a[aria-current]")
      .evaluateAll((links) =>
        links.map((a) => [
          a.textContent.trim(),
          a.getAttribute("aria-current"),
        ]),
      );
  assert.deepEqual(await current(), [["tags", "page"]]);
  await page.locator(".tag-list a").first().click();
  assert.deepEqual(await current(), [["tags", "location"]]);
  await page.goto(site.origin + postPaths()[0]);
  assert.deepEqual(await current(), []);
  await page.context().close();
});

test("404: 検索と最近の記事へ移動できる", async () => {
  const page = await open("/404.html");
  assert.equal(
    await page
      .getByRole("link", { name: "記事を検索する" })
      .getAttribute("href"),
    "/search/",
  );
  const posts = await page.locator(".reference-post-card").count();
  assert.ok(posts > 0 && posts <= 5, `最近の記事が ${posts} 件`);
  await page.context().close();
});

test("記事末尾: 同じタグの記事が、前後リンクと重ならずに最大 3 件出る", async () => {
  const page = await open("/");
  let checked = 0;
  for (const pathname of postPaths()) {
    await page.goto(site.origin + pathname, { waitUntil: "domcontentloaded" });
    const tags = await page
      .locator(".reference-post-header .reference-tags a")
      .allTextContents();
    const related = await page
      .locator(".post-related a.reference-post-card")
      .evaluateAll((cards) => cards.map((a) => a.getAttribute("href")));
    if (tags.length === 0) {
      assert.deepEqual(related, [], pathname);
      continue;
    }
    checked++;
    assert.ok(related.length <= 3, pathname);
    const neighbors = await page
      .locator(".post-nav a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    for (const href of related) {
      assert.ok(
        !neighbors.includes(href),
        `${pathname}: ${href} が前後リンクと重複`,
      );
      assert.notEqual(href, pathname);
    }
  }
  assert.ok(checked > 0);
  await page.context().close();
});

test("見出しリンク: キーボードで見え、その見出しへ移動できる", async () => {
  const page = await open("/");
  for (const pathname of postPaths()) {
    await page.goto(site.origin + pathname, { waitUntil: "domcontentloaded" });
    if (await page.locator(".post-body .heading-anchor").count()) break;
  }
  const anchor = page.locator(".post-body .heading-anchor").first();
  const heading = anchor.locator("..");
  assert.equal(
    await heading.evaluate((h) => h.firstChild.textContent.trim()),
    await heading.evaluate((h) => h.textContent.trim()),
    "見出しの文字列に # が混ざらない",
  );
  await anchor.focus();
  assert.equal(await anchor.evaluate((a) => getComputedStyle(a).opacity), "1");
  await anchor.press("Enter");
  assert.equal(
    await page.evaluate(() => decodeURIComponent(location.hash.slice(1))),
    await heading.getAttribute("id"),
  );
  await page.context().close();
});

test("RSS: 全記事の本文がサイト外でも成り立つ形で載っている", async () => {
  const page = await open("/");
  const xml = await (await page.request.get(`${site.origin}/rss.xml`)).text();
  // ブラウザの XML パーサーで本文を取り出す (エスケープの形式に依存しない)。
  const contents = await page.evaluate(
    (source) =>
      [
        ...new DOMParser()
          .parseFromString(source, "application/xml")
          .getElementsByTagNameNS(
            "http://purl.org/rss/1.0/modules/content/",
            "encoded",
          ),
      ].map((element) => element.textContent),
    xml,
  );
  assert.equal(contents.length, postPaths().length, "全記事に本文がある");
  const all = contents.join("\n");
  assert.doesNotMatch(all, /<script\b/, "スクリプトを含まない");
  assert.doesNotMatch(all, /\s(?:href|src)="\/(?!\/)/, "相対 URL を含まない");
  assert.doesNotMatch(all, /heading-anchor/, "見出しリンクを含まない");
  await page.context().close();
});
