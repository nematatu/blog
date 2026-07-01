---
title: "IPアドレス確認コマンド"
date: "2026-07-01T16:44:31+09:00"
draft: false
tags: ["開発"]
---

## Mac

```nushell
➜ ifconfig en0 | grep 'inet '
        inet 192.168.11.14 netmask 0xffffff00 broadcast 192.168.11.255
```

設定からも確認できる

![](https://assets.blog.amatatu.com/paste-images/20260701165120.avif)

## Windows

`ipconfig`のIPv4アドレスを確認する
