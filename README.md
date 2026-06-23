# blog

Astroで作っている個人ブログです。

## 技術スタック

- Astro
- React
- TypeScript
- Tailwind CSS
- MDX
- Pagefind

## セットアップ

```sh
pnpm install
```

`mise` を使う場合は、`mise.toml` に `pnpm` が定義されています。

```sh
mise install
```

## 開発

```sh
pnpm dev
```

Astroの開発サーバーを起動します。

## ビルド

```sh
pnpm build
```

`astro check` を実行したあと、静的サイトをビルドします。

## プレビュー

```sh
pnpm preview
```

ビルド済みのサイトをローカルで確認します。

## フォーマット

```sh
pnpm check
```

`src` 配下の Astro / JavaScript / TypeScript / Markdown / CSS / JSON を Prettier で整形します。

## 記事の作成

```sh
pnpm post:new
```

対話形式で `src/content/blog` に新しい記事ファイルを作成します。slug は英数字とハイフンのみ利用できます。

## ディレクトリ構成

```txt
src/
  components/        UIコンポーネント
  content/
    blog/            ブログ記事
    projects/        プロジェクト記事
  layouts/           Astroレイアウト
  lib/               ユーティリティとMarkdown拡張
  pages/             ルーティング
  styles/            グローバルCSS
public/              静的アセット
scripts/             補助スクリプト
```

## コンテンツ

ブログ記事は `src/content/blog`、プロジェクト記事は `src/content/projects` に配置します。frontmatter は `src/content.config.ts` のスキーマに従います。

### ブログ記事

```yaml
---
title: "記事タイトル"
description: "記事説明"
date: "2026-01-01"
draft: true
tags: ["tag"]
ogImage: "https://example.com/image.png"
---
```

### プロジェクト記事

```yaml
---
title: "プロジェクト名"
description: "説明"
date: "2026-01-01"
draft: false
demoURL: "https://example.com"
repoURL: "https://github.com/example/repo"
ogImage: "https://example.com/image.png"
---
```

### 吹き出し

インラインの吹き出しは `fuki` ディレクティブで記述します。`fuki` は左向き、
`fuki-right` は右向きです。赤い吹き出しは `tone="emphasis"` を指定します。

```markdown
:fuki[左の吹き出し]

:fuki-right[右の吹き出し]

:fuki[赤い吹き出し]{tone="emphasis"}

:fuki[別のアイコン]{icon="/画像のパス.png"}
```

アイコンは既定で `/icon/icon.svg` を表示します。`icon` には `public` からの
絶対パスまたは画像URLを指定できます。

複数段落を含む場合はコンテナ形式を使います。

```markdown
:::fuki
見た目は面白い。

文章や[リンク](https://example.com)を含められます。
:::
```

## ライセンス

このリポジトリには `LICENSE` が含まれています。
