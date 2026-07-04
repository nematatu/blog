---
title: "Rust製リモートデスクトップアプリ Rust Desk"
date: "2026-07-04T18:24:14+09:00"
draft: false
tags: []
ogImage: /ogp/rustdesk.png
---

<h2 class="text-center bg-yellow-300 text-gray-700 py-5 leading-loose"><span class="p-2 bg-gray-800 text-gray-200">Win11 Home</span> はリモートデスクトップが出来ない !</h2>

## 結論

- `Home`は[Rust Desk](https://github.com/rustdesk/rustdesk/releases/tag/1.4.8)を使う。
- `Pro`は公式のリモートデスクトップアプリ使う。
- TailscaleのIPで接続すると便利。

## 筆者の環境

MacBook → Windowsにリモートデスクトップして操作したい

## Win11 Home

MacBookとWindows両方に[Rust Desk](https://github.com/rustdesk/rustdesk)をインストールする [^1]

### 設定

MacとWindows両方で行う

1. 設定を開く
   ![](https://assets.blog.amatatu.com/paste-images/20260704192610.avif)

2. セキュリティ > セキュリティ設定のロックを解除
   ![](https://assets.blog.amatatu.com/paste-images/20260704193003.avif)

3. `固定パスワード認証`に変更
   ![](https://assets.blog.amatatu.com/paste-images/20260704193348.avif)

4. `直接IPアクセス`を有効化する

   Mac と Windows 両方で有効化しないとIPアドレスで接続できない
   ![](https://assets.blog.amatatu.com/paste-images/20260704193513.avif)

設定終了

---

ホームの `リモートIDを入力` 欄にTailscaleのIPを入力して`接続`で完了

![](https://assets.blog.amatatu.com/paste-images/20260704194509.avif)

<h2 class="text-center bg-yellow-300 text-gray-700 py-5">これで、 <span class="p-2 bg-gray-800 text-gray-200">Win11 Home</span> でリモートデスクトップできるようになった ！</h2>

---

## Win11 Pro

1. Windowsの設定からリモートデスクトップを許可する

   `設定 > システム > リモートデスクトップ > リモートデスクトップを許可`
   ![](https://assets.blog.amatatu.com/paste-images/20260704200419.avif)

2. Windows Appで接続

   TailscaleのIPを入力するとリモートデスクトップできる
   ![](https://assets.blog.amatatu.com/paste-images/20260704200020.avif)

簡単！

[^1]:
    名前の通り、ほとんどRustで書かれている。デスクトップアプリはFlutter製。
    開発も活発。コントリビューター鋭意募集中らしい。

## 「へ〜」な知識

ダウンロードはPCにファイルを保存すること。インストールはそのPCで使用できるように**取り込む**という違いがあるらしい。

参考: [Q. ダウンロードとインストールって何ですか？ - チエネッタ｜NTT西日本](https://flets-w.com/chienetta/pc_mobile/cb_internet10.html)
