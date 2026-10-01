---
title: "md記法"
date: "2026-06-23T19:24:00+09:00"
draft: true
tags: ["開発"]
---

このブログで使える独自のMarkdown記法まとめ。

## frontmatter

`title` と `date` は必須。それ以外は省略できる。

```yaml
---
title: "記事タイトル"
description: "記事の説明"
date: "2026-06-23T19:24:00+09:00"
draft: true
pinned: false
tags: ["開発", "趣味"]
ogImage: "/ogp/example.png"
---
```

- `draft: true`: 開発環境だけに表示する
- `pinned: true`: 記事一覧の先頭へ固定する
- `ogImage`: OGP画像を指定する。省略時は自動生成する

## Admonition

利用できる種類は `note`、`tip`、`important`、`caution`、`warning`。

```markdown
:::note
補足情報
:::

:::tip
ヒント
:::

:::important
重要事項
:::

:::caution
注意事項
:::

:::warning
警告
:::
```

表示例：

:::note
補足情報
:::

:::tip
ヒント
:::

:::important
重要事項
:::

:::caution
注意事項
:::

:::warning
警告
:::

タイトルを付ける場合は種類の直後に `[]` を置く。

```markdown
:::note[任意のタイトル]
本文
:::
```

表示例：

:::note[任意のタイトル]
本文
:::

## GitHubカード

リポジトリまたはユーザーへのリンクをカード表示する。

```markdown
::github{repo="owner/repository"}

::github{user="username"}
```

`repo` は `owner/repository` 形式、`user` はユーザー名だけを指定する。

表示例：

::github{repo="nematatu/blog"}

::github{user="nematatu"}

## X（Twitter）の埋め込み

ポストのURLだけを1段落に書くと埋め込みへ変換する。`x.com` と
`twitter.com` のURLに対応している。

```markdown
https://x.com/username/status/1234567890123456789
```

Markdownリンクでも、そのリンクだけで1段落を構成すれば変換される。

```markdown
[ポストを見る](https://x.com/username/status/1234567890123456789)
```

前後に文章や別のリンクがある場合は埋め込みにならない。

表示例：

https://x.com/ilovebadm/status/1981732140803899821

## YouTubeの埋め込み

動画URLだけを1段落に書くと、YouTubeの埋め込みプレーヤーへ変換する。

```markdown
https://www.youtube.com/watch?v=abcdefghijk
```

`youtu.be`、`watch`、`embed`、`shorts`、`live` のURL形式に対応する。
開始位置は `t` または `start` で指定できる。

```markdown
https://youtu.be/abcdefghijk?t=1m30s

https://www.youtube.com/watch?v=abcdefghijk&start=90
```

Xの埋め込みと同様に、前後へ別の内容を書いた段落は変換されない。

表示例：

https://www.youtube.com/watch?v=sTDFkzurG4U

## コードブロックのファイル名

言語名の後ろへ `:ファイル名` を付けると、コードブロックのヘッダーへ
ファイル名を表示する。シンタックスハイライトには `:` より前の言語名を使う。

````markdown
```ts:src/example.ts
const message = "Hello";
```
````

ファイル名には空白を含めない。

表示例：

```ts:src/example.ts
const message = "Hello";
```

## 画像キャプション

画像の直後に、同じ段落内で強調記法のキャプションを書く。

```markdown
![代替テキスト](https://example.com/image.jpg) _画像の説明_
```

画像とキャプションの間には空白だけを置き、キャプションを段落の最後にする。
キャプション内で利用できるのはテキストだけ。

表示例：

![ブログアイコン](/icon/favicon-32x32.png) _画像キャプションの表示例_

## 外部リンク

外部サイトへのHTTP/HTTPSリンクには自動で `target="_blank"` と
`rel="noopener noreferrer"` が付く。同一サイト内のリンクには付かない。

表示例：

[外部リンク](https://example.com) / [内部リンク](/blog)
