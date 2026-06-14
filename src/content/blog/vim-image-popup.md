---
title: "Vimで画像を表示できるようになった"
date: "2026-06-14"
draft: false
tags: ["開発"]
---

https://x.com/mattn_jp/status/2064488792627847600?s=20

Kittyやsixel対応エミュレータだと画像表示出来るようになったらしい。

サイズなど制約はあるけど、純粋なVimで画像表示できるのは素晴らしい進化。

やってみる。

## 構想issueを読む

mattnさんすげぇ

https://github.com/vim/vim/pull/20136

`popup_create()`と`popup_setoptions()`にpixelバッファをレンダーする機能を追加したと。

ターミナルバックエンドはバッファをDEC sixel DCSセクエンスで出力する。(FEAT_IMAGE_SIXEL)  ←←←なんだこれ

もしくは、kitty graphics protocol APC セクエンスで出力する。(FEAT_IMAGE_KITTY)  ←←←なんだこれ

MS-Windows GUIでは何か良い感じにこのデータを処理してやってるらしい。

popupウィンドウは画像のピクセルから自動的にセルボックス(縁取り？)を計算する。

なので、呼び出し側は`minWidht`とか`maxHeight`などを手動で計算する必要はない。

![](https://assets.blog.amatatu.com/paste-images/20260614144225.avif)
*すげー*

Vim自身は`libpng`, `libjpeg`, `libwebp`などの画像でコード系ライブラリのリンクを持っていない

なので、`image`アトリビュート(APIって認識で良いのか？)はすでにRGB or RGBAのピクセルバッファにデコードされているやつを取り扱う。

すなわち、呼び出し側がやる必要があり、呼び出し側は、ファイルを任意の外部ツール(ffmpeg, imagemagic, ...etc)と繋げることができ、結果バイト列をBlob経由で渡すことができる。

~~これは、Vimが生成したフットプリント(←なんだこれ)を変更することがない。ユーザーに各種画像フォーマットにレンダーしてる間~~

これは、Vimのビルドサイズを変更するとなく、ユーザーが既に持っているデコーダを使って、各種画像フォーマットをレンダリングすることが出来る。

image dict(←？？引数のことかな) は`data`(`width*heigh*3`のRGB or `width*heigh*4`のRGBAのBlob)と`width`, `height`を許可する

仲間のscriptの`getbgcolor()`は背景色を[r, g, b]で返す。だから、ピクセルと事前合成したいスクリプトは実際のポップアップの背景に合わせることが出来る。


```vimscript:4x4の赤い正方形を表示する.vim
let pixels = repeat([0xff, 0x00, 0x00], 4 * 4)->list2blob()
call popup_create('', #{
      \ image: #{ data: pixels, width: 4, height: 4 },
      \ line: 'cursor+1', col: 'cursor',
      \ })
```

サンプルコードのこれをやってみる




### 最近上がってたissue

https://github.com/vim/vim/issues/20494
