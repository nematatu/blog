---
title: "aviutl設定"
date: "2026-07-05T19:58:13+09:00"
draft: true
tags: []
---

設定項目の備忘録

## 環境

Aviutl 1.10

ディレクトリのコピペだけでインポート/エクスポート出来るらしい

後でgit管理するか

---

## 拡張編集の有効化

1. 拡張編集PluginをAviutlと同じ階層に解凍
2. メインウィンドウ左上「設定」 > 「拡張編集の設定」にチェック

## 再生ウィンドウのリサイズ

「表示」 > 拡大表示 > WindowSizeにチェック

## MP4入出力

### 入力

1. AviUtlがあるディレクトリに`Plugins`ディレクトリを作成
2. [L-SMASH Works r940 release1 / mod1 – RePOPn](https://pop.4-bit.jp/?page_id=7929)をPluginsディレクトリに解凍
3. メインウィンドウ「設定」 > 環境設定 > 入力プラグイン優先度の設定 > `L-SMASH Works`を選択してOK

### 出力

1. [Aviutl プラグイン 「かんたんMP4出力」 : プログ](https://aoytsk.blog.jp/aviutl/34586383.html)をPluginsディレクトリに解凍

おわり

参考: [【AviUtl】mp4を読み込み・出力する1番簡単な方法【プラグイン導入手順を丁寧解説】 - AKETAMA OFFICIAL BLOG](https://aketama.work/aviutl-mp4)

## 【再生】その場で一時停止

再生ウィンドウで右クリック > 環境設定 > 「再生ウィンドウで再生したときにカーソルを連動」にチェック

## ヌルヌルプレビュー

1. [aviutl_rampreviewのGitHub](https://github.com/oov/aviutl_rampreview/releases)からzipをダウンロード
2. AviUtlと同階層に解凍
3. 「設定」 > 「拡張編集RAMプレビューの設定」にチェック

参考: [【AviUtl】カクカクのプレビューをスムーズにできるプラグイン【拡張編集RAMプレビュー】](https://sosakubiyori.com/aviutl-rampreview/)

## 再生ウィンドウだけ最大化

1. [Google Drive](https://drive.google.com/file/d/19joDyULvnT2Na1yequ4Fs1Kjl7MY6a8v/view?usp=drive_link)からダウンロード
2. `.auf`をAviUtlと同階層に解凍
3. 「表示｣ > 「最大化時メインウィンドウのみを表示」にチェック

参考: [【AviUtl】大画面でプレビュー再生できるプラグイン【最大化でメインウィンドウのみ表示】](https://sosakubiyori.com/aviutl-maxwnd/)

## カット位置

タイムライン右クリック > 環境設定 > 「中間点追加・分割を常に現在フレームで行う」にチェック
参考: [【AviUtl】カット編集のやり方！不要シーンを詰めてテンポ良い動画を作成！ - AKETAMA OFFICIAL BLOG](https://aketama.work/aviutl_cut)

## 再生バーをホバーでサムネ表示

[Aviutlのシークバーにサムネイルを表示するプラグイン : プログ](https://aoytsk.blog.jp/aviutl/613302.html)

## メモリ効率化

これやらんと、エンコード時にメモリ不足で落ちる

[Flapperさんの記事](https://seguimiii.com/aviutl-tech/inputpipeplugin)

## `.mov`ファイルを読み込む

L-SMASH Worksの`exxdit.ini`に以下を書き込む

```text
.mov=動画ファイル
.mov=音声ファイル
```

## イージングスクリプト

## アニメーションスクリプト
