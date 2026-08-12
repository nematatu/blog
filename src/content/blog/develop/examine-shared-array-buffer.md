---
title: "Shared Array Bufferを調べる"
date: "2026-08-08T21:44:40+09:00"
draft: true
tags: []
ogImage: /ogp/shared-array-buffer.png
---

## なぜ


[WASMを使ってVimをWebで動かす](https://rhysd.hatenablog.com/entry/2018/07/09/090115) [^1]プロジェクトを見ており、[デモページ](https://rhysd.github.io/vim.wasm/)があったので開いたところ、以下のエラーで何も表示されず。

:::note
`FATAL: SharedArrayBuffer is not supported by this browser. If you're using Firefox or Safari, please enable feature flag.`
:::

`SharedArrayBuffer`というのが利用できなくて起動できないらしい。

折角の機会なので周辺知識も含めて調べてみた。

WASMのVimも使いたいし。

## Shared Array Bufferとは

### そもそも`ArrayBuffer`ってなに
生のバイナリデータの入れ物のこと。
機能としては、「入れ物」だけであり、「読み書き」はできないので、`DataView`や`typed array`など別のクラスを使う。

参考: [ArrayBuffer - Qiita](https://qiita.com/toshi00ysm/items/ddd60c22aa58d16c8320)

## `ArrayBuffer`を学ぶ

`ArrayBuffer`とはバイナリデータの集合。メモリデータを割り当て、スペースを取るだけ。アクセスはできない。

<mark className="font-bold text-gray-900 px-1 text-xl bg-yellow-200">保存容量の節約、通信の効率化</mark> のため、0と1の2進数で表現するバイナリデータが使われる。

画像、ファイル、ネットワーク、高度なグラフィック処理のため、複雑なデータ処理が必要になりました。
そこで、バイナリデータの効率的な操作のため、ES2015で`ArrayBuffer`が導入された。

```ts
const array = new ArrayBuffer(16)
console.log(array)

// 実行結果
➜ bun src/arrayBuffer/  
ArrayBuffer(16) [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
```

```ts
console.log(array[0])

// ArrayBufferから読み書きはできない
// Element implicitly has an 'any' type because expression of type '0' can't be used to index type 'ArrayBuffer'.
// Property '0' does not exist on type 'ArrayBuffer'.
```

参考: [あらためて理解するArrayBuffer - JavaScriptでバイナリデータを扱う方法 - ICS MEDIA](https://ics.media/entry/250408/)

[ArrayBuffer, binary arrays](https://ja.javascript.info/arraybuffer-binary-arrays)

## `TypedArray`
バイナリデータを特定のデータ型として解釈して、`ArrayBuffer`を操作するためのインターフェースを提供するオブジェクト。(`Uint32Array`や`Uint8Array`などの総称)

* `Uint8Array`  : 各バイトを0-255までの値(1バイト)で解釈
* `Uint16Array` : 各2バイトを0-65535までの値(16ビット)で解釈
* `Uint32Array` : 各4バイトを32ビットで解釈 

そこで、`TypedArray`

```ts
// ArrayBufferを用意 (ただの入れもの)
const array = new ArrayBuffer(16)

// 各数値を1バイトとして解釈するビュー
const uint8array = new Uint8Array(array)

// ビューの機能: 書き込み
uint8array[0] = 255

console.log(uint8array)

// ↓ 書き込むことができて嬉しい！
// Uint8Array(16) [ 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]

```

[^1]: [Vim を WebAssembly に移植した - はやくプログラムになりたい](https://rhysd.hatenablog.com/entry/2018/07/09/090115)

## ArrayBufferとArrayの違い
* 転送時など、パフォーマンスにどれくらい違いがあるか。
* ArrayはArrayBufferと違って、いろんな型のデータを格納できるという点で柔軟性があるが、メモリが連結していなかったり、動的なメモリ管理があるという点でパフォーマンスが劣るらしい。ほんと？

## Web開発で使われる場面
### 2D Canvas
`CanvasRenderingContext2D`はHTMLの`<canvas>`に画像、図形、文字などを自由に描画できるAPI

最終的に、ピクセルごとのRGBAのビットマップに変換される。


