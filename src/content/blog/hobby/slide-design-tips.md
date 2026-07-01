---
title: "スライド作成で気をつけていること"
date: "2026-06-23T17:58:20+09:00"
draft: true
tags: ["趣味"]
---

## 気をつけること

• スライドに書いてる文章、そのまま読んでいる
• いきなり専門用語(?)が出る。（何なのか悩んでる途端、次のスライドなって迷子）
• どこの部分を喋っているのか、追い付けられない。

[京大のプレゼン講座](https://repository.kulib.kyoto-u.ac.jp/server/api/core/bitstreams/9da147c7-5bab-41a2-8fe4-9dcb0958f1ad/content)

- 内容をすぐ忘れる(相手が)

### プレゼン発表の目的は

:::warning
❌️ ~~賢さをアピールする場~~

⭕️ <mark>紹介して理解してもらい、学んでもらう</mark>
:::

- 文字より図
- 端っこの人もわかるように
  - 下の部分が見えなかったりする
- 用語の説明
- 一発で理解できるように
  - スラッスラ理解できると気持ちいよね

:::note
見出しや強調部はゴシック、長文は明朝体にするとわかりやすい

でも、明朝体をスライドに使いたくない

Wordとかで使えるテクニック

> ["｢見る｣要素の文字には、ゴシック体とサンセリフ体"](https://tsutawarudesign.com/yomiyasuku1.html#:~:text=%EF%BD%A2%E8%A6%8B%E3%82%8B%EF%BD%A3%E8%A6%81%E7%B4%A0%E3%81%AE%E6%96%87%E5%AD%97%E3%81%AB%E3%81%AF%E3%80%81%E3%82%B4%E3%82%B7%E3%83%83%E3%82%AF%E4%BD%93%E3%81%A8%E3%82%B5%E3%83%B3%E3%82%BB%E3%83%AA%E3%83%95%E4%BD%93)
> :::

- 1行を長くするより、短く複数行のほうが良いらしい
- 左揃え

- 結局メイリオ+Segoe
  - ArialはSegoeより文字の余白が狭くて視認性が少し落ちる
- 記号は時間を詰める(約物)

- 小見出しは**bold**+サイズアップが良いかも
- 文字色変更>**bold** 情報が散乱しない
- 無駄な階層はいらない
- ← これより、🟣←こういうやつ
- 禁則処理(、が文頭になるようには改行しない)
- 単位は小さく(すげーわかりやすい)
- ()より | がイケてる
- ？や！！より、?や!!(半角)

### 表とグラフ

[表とグラフ](https://tsutawarudesign.com/miyasuku1.html)

- まとまり、アイキャッチ

### スライドマスター

- ページ番号
- フォント管理
- 今の位置

## フォント

### NotoSans JP

PDF出力時にthinになる

- 読みやすい
- no more tofu
- 権利周りも安心
- Webフォント

しかし、PDF出力が怖い

Webサイトならとりあえずこれでいい

JP の英数字は読みにくいから(gとか1とか)、`font-family: "Noto Sans" "Noto Sans JP" `にする

:::note
別名だけど全く同じフォントの**源ノ角ゴシック**はバリアブルフォントではないからこれ使うと解決できる
:::

### メイリオのズレ

上にズレるように設計されてる

- 図形の上の余白を1mm大きく、下の余白を1mm小さくする
- 行間を1.3倍にする

[なぜメイリオは上にズレるのか？ パワポでメイリオをキレイに上下中央配置するコツ ｜プレゼンデザイン](https://ppt.design4u.jp/best-practice-meiryo-centering/)

## 参考

[伝わるデザイン｜研究発表のユニバーサルデザイン](https://tsutawarudesign.com/index.html)

これ良いわ〜
「お、大事なんだな！読も！」ってなる
![](https://b55858b0d5c41b055859b1e758ddf3a2.r2.cloudflarestorage.com/blog-images/paste-images/20260624040316.avif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=068034e59fa6e75d0f3f5e66181df5e6%2F20260623%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260623T190321Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=9d8add8dcb1b2049a77612a01598ee062555f6f8a700e2f172e309e17cb8cf2a)

横線

258D

https://ppt.design4u.jp/symbol/

色反転でアイキャッチは挟むやつとか

https://ppt.design4u.jp/storytelling-with-arranged-layouts/

マジわかりやすい

数値は右揃えとか、長文は両端揃えが良いとか

https://ppt.design4u.jp/alignment/
