---
title: "Vimのアップデート"
date: "2026-06-14"
draft: false
tags: ["開発"]
---

![](https://assets.blog.amatatu.com/paste-images/20260614020630.avif)

rgba画像を表示できるようになったらしく、試したかったのでアップデートする

昔適当にローカルにインストールしたVimを使っていたので、古いバージョンのままだった。

公式レポジトリ見ると、homebrew推奨したりしてたけど、`brew upgrade`しても、v.9.2.600みたいに表示されていた。

おかしい。

レポジトリのReleaseではv.9.2.0629など、マイナーバージョンが06から始まるのにhomebrewでインストールしたVimは600になってる

おかしいので、cloneしてインストールすることにした

## 方法

```nushell
ghq get https://github.com/vim/vim

cd src

make

sudo make install
```

(makeに6m30sかかった)

でもまだバージョンが更新されてない

`which -a vim`でパスが通っているか確認する↓

![](https://assets.blog.amatatu.com/paste-images/20260614021745.avif)

`rehash`で更新したら、レポジトリからインストールしたVimが起動できた

v.9.2.0629

OK

![](https://assets.blog.amatatu.com/paste-images/20260614021314.avif)

## 参考

[GitHub - vim/vim](https://github.com/vim/vim)
