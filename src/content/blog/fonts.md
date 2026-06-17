---
title: "ブログに適したフォント"
date: "2026-06-17T19:58:48+09:00"
draft: false
tags: ["開発", "趣味"]
ogImage: /ogp/blog-fonts.png
---

## 結論

- apple端末ならヒラギノ角ゴ、ソレ以外は`Noto Sans JP`を使う
- 約物半角フォント[^1]と`text-autospace`[^2]を入れよう
  [^1]: [YakuHanJP](https://yakuhanjp.qranoko.jp/)
  [^2]: https://developer.mozilla.org/ja/docs/Web/CSS/Reference/Properties/text-autospace

## プロンプト

```
1. 現状のブログシステムに`YakuHanJPフォント`を適応して
2. 参照デバイスがApple系の場合は`ヒラギノ角ゴ`を使うように設定して
3. 参照デバイスがApple以外の場合はNoto Sans JPを使うように設定して
4. `text-autospace: normal;`を適用して
```

任意のAgentに投げたら、よしなに実装してくれるよ。きっと。

## 比較

![](https://assets.blog.amatatu.com/paste-images/20260618013248.avif)

好みの違いすぎる

![](https://assets.blog.amatatu.com/paste-images/20260618015514.avif)

## 具体例

AIに書かせるなら読む必要無いので、このセクションも実はいらないのかな、と思ったり思わなかったり

```css
@import "@fontsource/noto-sans-jp/400.css";
@import "@fontsource/noto-sans-jp/500.css";
@import "@fontsource/noto-sans-jp/600.css";
@import "@fontsource/noto-sans-jp/700.css";
@import "yakuhanjp";

@theme {
  --font-sans:
    "YakuHanJP", -apple-system, BlinkMacSystemFont, "Hiragino Sans",
    "Hiragino Kaku Gothic ProN", "Noto Sans JP", ui-sans-serif, system-ui,
    "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}
```

と、

```css
text-autospace: normal;
```

## 小ネタ

今回のOGPと記事内画像はKeynoteで作ってみた

それっぽい

![](https://assets.blog.amatatu.com/paste-images/20260617230145.avif)

「ブログに適したフォント」というより<mark>「ブログに適したフォントの設定」</mark>が適してるかも知れない
