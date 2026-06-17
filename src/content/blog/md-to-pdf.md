---
title: "ターミナルでMarkdownをPDFに変換"
date: "2026-06-14"
draft: false
tags: ["開発"]
ogImage: /ogp/md-to-pdf.png
---

適当なPDFで提出する必要のある課題とかをMarkdownで書いて変換したい時がある

(Markdown Webエディタ→PDF出力 を無料で出来るSaas全然なくね？...)

## 選択肢

`md-to-pdf`と`pandoc`

## pandoc

`brew install pandoc typst`

単に、以下をやろうとしても出来ないからエンジンにtypstが必要 (typst以外にも選択肢あるけど、typstが1番手軽そう。なんとなく)

```nushell
pandoc -t pdf README.md -o README.pdf
```

![](https://assets.blog.amatatu.com/paste-images/20260614005804.avif)

明朝体で、文字の一部がボールドになってて、中華感があるな〜

## md-to-pdf

```nushell
npx md-to-pdf README.md

Need to install the following packages:
md-to-pdf@5.2.5
Ok to proceed? (y)
  ✔ generating PDF from README.md
```

`npx`で使えるのが良いよね

初回実行に時間がかかるのがネックだけど、まあ許容

フォントや文字組も感じもシンプルで視認性良いし、これで良い。

LaTex, mermaid等を使うにはまた別のライブラリ使う必要がある

![](https://assets.blog.amatatu.com/paste-images/20260614010206.avif)

シンプルって感じだけど余白が多くてスカスカ感

オプションで調整必要かもね

## 変換に使ったMarkdown

````md
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

.
.
.

(Con'd)
````
