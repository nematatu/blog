---
title: "ワンライナーavifenc"
date: "2026-06-15T22:46:55+09:00"
draft: true
tags: ["開発"]
---

`public/wallpaper`配下の対象の特定の画像をavifencする

```bash
find -E public/wallpaper/ -type f -iregex '.*\.(jpeg|jpg|png|webp)$' -exec sh -c 'rm "$1"' _ {} \;
```

`-name '.(png|JPG|jpeg)'`みたいに指定できないの、初めて知った。

この、特定ディレクトリに対して一括処理するワンライナー、使いたい場面がよくある。
