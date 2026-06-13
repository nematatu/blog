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

## ライセンス

このリポジトリには `LICENSE` が含まれています。
