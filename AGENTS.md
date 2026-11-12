# AGENTS.md

Astro 製の個人ブログ。静的サイトとして出力し、Cloudflare Pages で配信する。

## コマンド

| コマンド            | 内容                                                |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | 開発サーバー                                        |
| `pnpm build`        | 型チェックとビルド (`dist/`)                        |
| `pnpm test`         | Markdown プラグインなどの単体テスト                 |
| `pnpm test:browser` | 実ブラウザでの検証 (事前に `pnpm build` が必要)     |
| `pnpm check`        | Prettier の整形チェック (pre-commit でも実行される) |

- `pnpm parity` はリファクタリングの前後で出力が変わっていないことを確かめる道具。記事を更新するとフィクスチャとずれるので、作業前に `pnpm build && node scripts/check-parity.mjs --record` で記録し直し、作業後に `pnpm parity` で比べる。出力を意図して変えたときは記録し直してコミットする。
- 記事 (`src/content/**`) は Prettier で整形し直さない。整形するのは変更したファイルだけにする。
- Markdown プラグインを変えたのにビルド結果が変わらないときは、`.astro/` と `node_modules/.astro/` のキャッシュを消す。

## UI とウェブ標準の優先順位

UI を作る・直すときは次の順で判断する。`modern-web-guidance` スキルは「HTML/CSS/クライアント JS のすべてで必須」と名乗るが、このリポジトリではこの順序が優先する。

1. **既存の部品を使う。** すでにあるものを、素の HTML 要素や新しい実装で置き換えない。
   - 画像: `OgImage.astro` (サムネイルの `srcset` と寸法)、本文画像は `src/lib/markdown/` の rehype プラグイン
   - 記事カード: `ArrowCard.astro`
   - 画像ビューア: `ContentInteractions.astro` の `<dialog>`
   - ページ遷移: `PostTransitions.astro` (View Transitions) と `NavigationPrefetch.astro` (Speculation Rules)
   - 注意書き・埋め込み: `:::note` などのディレクティブと `remark-*` プラグイン
   - 見た目: `src/styles/site.css` の既存クラスと Tailwind のユーティリティ
2. **既存の部品で足りないところは、ウェブ標準のネイティブ機能を使う。** HTML/CSS/クライアント JS を書く前に Modern Web Guidance を引く (`npx -y modern-web-guidance@latest search "<2〜5語の英語クエリ>"` → `retrieve "<id>"`)。スキル本体は約 16MB あるのでリポジトリには入れない。
   - スクロール連動の表現: `scroll` イベントではなく CSS スクロール駆動アニメーション (例: `.reading-progress`)
   - 開閉 UI: `<details name="...">` と `hidden="until-found"` (ページ内検索で見つかるようにする)
   - ツールチップやメニュー: 座標計算の JS ではなく Popover API
   - Core Web Vitals: LCP 候補の画像は `fetchpriority="high"` かつ遅延読み込みしない。画面外の画像は `loading="lazy"`
   - フォーム: `autocomplete` と適切な `type`
3. **ぶつかったら既存の部品を優先する。** ウェブ標準の推奨は、部品が受け付ける props や属性を通して反映する (例: 一覧先頭のカードは `ArrowCard` の `eager`、本文冒頭の画像は `rehype-lcp-image.js`)。

### 守ること

- 新しい機能は Baseline で広く使えるものを基本にする。そうでないものは `@supports` などで出し分け、未対応ブラウザでも内容が読めるようにする (機能がないだけ、にする)。
- 動きのある表現は `prefers-reduced-motion: reduce` で止めるか隠す。
- `animation-timeline` を使うときは `animation` ショートハンドを使わない。ビルド時の CSS 圧縮がタイムラインをショートハンドにまとめ、ブラウザが解釈できなくなる。
- 情報を `title` 属性だけに置かない。キーボードやタッチでは読めない。
- 効果を測れない最適化は入れない。たとえば記事一覧に `content-visibility: auto` は使っていない (数十件のカードでは描画コストが小さく、戻る操作でのスクロール位置復元がずれる恐れのほうが大きい)。

## 実ブラウザで検証する

HTML/CSS/クライアント JS を変えたら `pnpm build && pnpm test:browser` を通す。`tests/browser/` はビルド済みの `dist/` を Chromium で開き、レンダリング後の DOM と計算済みスタイルを確認する。ソースを読むだけでは分からない不具合 (圧縮後の CSS が効かない、画面外の画像が高優先度になる、など) をここで拾う。

- 挙動を足したら、対応する検証を `tests/browser/web-standards.test.mjs` に足す。
- ブラウザが未導入なら `pnpm exec playwright install chromium`。
