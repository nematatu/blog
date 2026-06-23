---
title: "Drizzleが新バージョンをリリースできないらしい"
date: "2026-06-13"
draft: false
tags: ["開発"]
---

https://x.com/DrizzleORM/status/2062629339556921581?s=20

これまでにリリースされたバージョンが多すぎることが原因。

epmは各リリース毎に依存関係などのメタデータを1つのjsonファイルに追記しており、それが100MBを超えるとリリース出来なくなるらしい。

## 過去のバージョンを消せば良いのでは？

一定時間が経過したバージョンを消すのは相当難しいらしい。
(ユーザー数が1人であるとか)

ソース: https://docs.npmjs.com/policies/unpublish/

## 現状

https://x.com/DrizzleORM/status/2065704671352615343?s=20

GitHubに連絡して過去リリース消す方向で頑張ってるらしい

(一時的にメタデータサイズの上限アップお願いしたけど却下された)

## メタデータのサイズの確認方法

![](https://assets.blog.amatatu.com/paste-images/20260613213850.avif)
_Drizzle(上)とPrisma(下)の比較_

## ちょっと疑問

Prismaのほうが依存多くて、リリース数も少ないのに、なぜこんなにサイズが小さいんだろう

npm以外の選択肢も考えなきゃいけないのかなぁ。
GitHub Release? jsr?

でも`npm i`や`npx`ってめっちゃ手軽で幅が広いんだよなぁ〜
