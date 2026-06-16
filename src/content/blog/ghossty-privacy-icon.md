---
title: "ghosstyの右上に表示されるプライバシーアイコンが邪魔"
date: "2026-06-16T15:01:06+09:00"
draft: false
tags: ["開発"]
---

## 結論

```
macos-secure-input-indication = false
```

消えた〜

![](https://assets.blog.amatatu.com/paste-images/20260616150114.avif)

[Secure Keyboard Entry](https://ghostty.org/docs/features#:~:text=%E3%81%8C%E3%81%A7%E3%81%8D%E3%81%BE%E3%81%99%E3%80%82-,%E3%82%BB%E3%82%AD%E3%83%A5%E3%82%A2%E3%82%AD%E3%83%BC%E3%83%9C%E3%83%BC%E3%83%89%E5%85%A5%E5%8A%9B%EF%BC%9A,-%E3%83%91%E3%82%B9%E3%83%AF%E3%83%BC%E3%83%89%E5%85%A5%E5%8A%9B%E3%83%97%E3%83%AD%E3%83%B3%E3%83%97%E3%83%88)
という機能らしい

## 機能

パスワード入力を自動検知する or 手動でONにすると他のプロセスから監視されないようにするGhosstyの目玉機能

右上にアイコンが表示されると、「Secure Keyboard Entry が機能してますよ〜」ということらしい

機能としては嬉しいんだが、コードを隠すし邪魔なので、**アイコンの表示だけ**消す。

## 遅くなる原因？

[Reddit](https://www.reddit.com/r/Ghostty/comments/1p2ofwn/ghostty_slow_with_secure_keyboard_entry_enabled/)
にて、この設定が影響して、コマンド入力が遅延するという報告がある。

個人的にあまり感じていないけど、どうなんだろ。どっかで対応されたのかな。

→ [対応されてた](https://github.com/ghostty-org/ghostty/discussions/3729)

アニメーションがメッチャCPU占有してたらしい。

今は同じ見た目でCPU利用率35%削減したらしい。
