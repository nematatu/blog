---
title: "Vimscriptを実行する"
date: "2026-06-15T18:27:17+09:00"
draft: false
tags: ["開発"]
---

Vimで画像表示する記事に繋がる

毎回`:`で1行ずつ実行していくのは面倒だし、カーソル移動もしづらいのでファイル単位で実行したいと思った。

---

`source`コマンドでVimscriptファイルを指定して実行出来る

`source %`で、開いているVimscriptファイルを実行出来る

[ゴリラさんのVimプラグイン開発本](https://zenn.dev/skanehira/books/make-vim-plugin/viewer/vim_script#fn-dbf3-1)を参考にやっていく

以下のファイルを作成して`:source file/to/path`で実行できる

```vimscript:echo.vim
echo 'nematatu'
```

→ `nematatu`が出力される

## 疑問

スコープの話よく分からんな

変数定義するときに書くのかな？

## Vimscript書いてみた

関数が存在するか確認する関数

```vimscript
function! IsExistsFunc(funcName) abort
if exists('*' . a:funcName)
    echo a:funcName . ' is exists'
    return
endif
echo a:funcName . ' is not exists'
endfunction

let a = 'readdir3'

call IsExistsFunc(a)
```

記事内にあった以下のコードを関数に拡張したもの

```vimscript
" readdir 関数の存在チェック
if exists('*readdir')
  " do something
endif
```

- `abort`で関数内でエラーが出たら終了
- `.`で文字列結合
- `a:`で関数内スコープ変数
- 条件分岐も使えた

バッファ変更したら'hello'を出力する

```vimscript
augroup MyAutoCmd
    autocmd!
     autocmd BufEnter * echo 'hello'
augroup END
```

[Vimプラグイン開発](https://zenn.dev/skanehira/books/make-vim-plugin/viewer/develop_plugin)はまた今度やる
