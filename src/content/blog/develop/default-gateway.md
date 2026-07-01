---
title: "デフォルトゲートウェイを調べるコマンド"
date: "2026-07-01T18:30:04+09:00"
draft: false
tags: ["開発"]
---

## Mac

```nushell
➜ route -n get default
   route to: default
destination: default
       mask: default
    gateway: 192.168.11.1
  interface: en0
      flags: <UP,GATEWAY,DONE,STATIC,PRCLONING,GLOBAL>
 recvpipe  sendpipe  ssthresh  rtt,msec    rttvar  hopcount      mtu     expire
       0         0         0         0         0         0      1500         0
```

↑出力結果の`gateway`を確認する

## Windows

```nushell
ipconifg /all
```

出力結果から、`イーサネット → デフォルト ゲートウェイ`欄を確認する

## デフォルトゲートウェイとは

同一ネットワーク外の宛先へ通信するときに、まずパケットを送るルーターのIPアドレス
