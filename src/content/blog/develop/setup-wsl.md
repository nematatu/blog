---
title: "WSL(と、周辺の)セットアップ"
date: "2026-07-01T15:55:16+09:00"
draft: true
tags: ["開発"]
---

研究室Windowsを使いやすくするための備忘録

## Power Toys

設定のインポートをする

デバイス間のファイル移動は、[あとでURL貼る]()

### キーリマップ

### Raycast的なやつ

---

## WSL2

1. 完全にリセットして再度セットアップするなら、`wsl --unregister Ubuntu`

2. CPUの仮想化がオフになっていたら起動できないのでBIOSから設定する

   [Windows 11 で BIOS で仮想化を有効にするには？ : r/Winsides](https://www.reddit.com/r/Winsides/comments/1j9o47l/how_to_enable_virtualization_in_bios_for_windows/?share_id=1sXSUbnQGIi1RucNp-MY2&tl=ja&utm_medium=ios_app&utm_name=ioscss&utm_source=share&utm_term=9)

3. dotfiles

```nushell
mkdir -p ~/src/github.com/nematatu
cd ~/src/github.com/nematatu

git clone https://github.com/nematatu/dotfiles.git
cd dotfiles

./install.sh
```

最初から`ghq`のディレクトリ構成にしておくと、あとから移動させなくて済むから良い

## 参考

[WSLの初期化のやり方 #Ubuntu - Qiita](https://qiita.com/akiraarika932/items/b7574ed4878e7cdd025d)
