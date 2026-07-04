---
title: "研究室WindowsPCを快適に使うための設定"
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

1. 完全にリセットして再度セットアップするなら、`wsl --unregister Ubuntu`[^1]

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

4. `gh`コマンドで認証する
   ssh認証だとセッションで完結するから良いよ

5. Miniforge (機械学習するなら)

```nushell
cd ~
wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
chmod +x Miniforge3-Linux-x86_64.sh
sh Miniforge3-Linux-x86_64.sh
```

これで最低限使えるLinux環境が手に入った。

次は、SSHしてどこからでも使えるように設定する。

---

## Tailscale

やること

- WSL2にTailscaleをインストールする
- Tailscaleとsshを常時起動する
- Windowsを起動したらWSL2を自動起動する

参考: [WSL2に外部からSSH接続する方法（Tailscale + 自動起動）](https://zenn.dev/imudak/articles/wsl-ssh-tailscale-autostart)

↑ 記事が完璧なのでコピペ実行すればおｋ

## Windowsの常時起動

`設定 > システム電源 > 外面、スリープ、休止状態のタイムアウト > 後で電源をオフにする > 「なし」に設定`

![](https://assets.blog.amatatu.com/paste-images/20260702182223.avif)

## めっちゃその他

- EIZOモニターの明るさ自動調整をオフにする

  `Auto EcoView`をオフにする [FAQ詳細 | EIZO株式会社](https://www.eizo.co.jp/support/db/faq/1705)

## 参考

[^1]: [WSLの初期化のやり方 #Ubuntu - Qiita](https://qiita.com/akiraarika932/items/b7574ed4878e7cdd025d)
