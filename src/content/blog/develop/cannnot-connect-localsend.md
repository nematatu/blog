---
title: "同一ネットワークに居るはずなのにlocalsendで接続できない"
date: "2026-07-01T16:55:04+09:00"
draft: false
tags: ["開発"]
---

## 環境

- 自分のMacBook Wi-Fi(192.168.11.14)

- 研究室のWindows11 PC 有線LAN (192.168.11.4) [^1]
  [^1]: [IPアドレス確認コマンド](/blog/develop/check-ip-address)

をlocalsendで接続してファイルの送受信をしたい

両PCとも研究室のネットワークに接続して[LocalSend Web](https://web.localsend.org/)にアクセスしているが、デバイスが検出されない

![](https://assets.blog.amatatu.com/paste-images/20260701165706.avif)

どちらも`192.168.11.x`系に接続してるのになぜ、、、、？？？？？

## pingしてみる

Macから

```nushell
➜ ping 192.168.11.4
PING 192.168.11.4 (192.168.11.4): 56 data bytes
Request timeout for icmp_seq 0
Request timeout for icmp_seq 1
Request timeout for icmp_seq 2
Request timeout for icmp_seq 3
ping: sendto: No route to host
Request timeout for icmp_seq 4
ping: sendto: Host is down
Request timeout for icmp_seq 5
```

タイムアウト

Winからping送った場合も同様にタイムアウト

## やったこと

### Winのファイアウォールをオフにしてみる

Winで↓を実行しファイアウォールをオフにする

```nushell
netsh advfirewall set allprofiles state off
```

そのうえでMacからping送ってもタイムアウト

→ 恐らく、VLANが分けられている？

### お互いが見えているのか？

同じLAN上に居るように見えるけど、本当にお互いを見えているのか？直接通信できるのかを確かめる

MacからWinを発見できているのかを確かめるために`arp`要求をする

```nushell
➜ arp -a | grep 192.168.11.4
? (192.168.11.4) at (incomplete) on en0 ifscope [ethernet]
```

`incomplete`なので、発見できていない

### 結果

→ IPアドレス上は同じ`192.168.11.x`だが、イーサネットレベルで直接通信できない

### 原因

- 有線LANとWi-FiでVLANが分離されている
- クライアント間通信を制限している

### 実験

- Winも同じWi-Fiに接続して再度pingとかやってみる
  → 通ったら研究室のネットワーク設定が悪さしている

### 対応

- WinもWi-Fi接続にする？
- VLANの設定を変更できない？
- ネットワーク構成を変更できない？

### 結論: 全く別のネットワークに接続してた

`192.168.x`って汎用的なipアドレスで、内部ネットワークを指してる

だから、ルーターAの内部ネットワークとルーターBの内部ネットワークで同じIPアドレス空間っぽい数値に見えても、実際に接続してる大元のルーターはぜんぜん違うってことは結構ある。

### 確認できた経緯

1. 外部ネットワークに出る時、最初にどこを通過するか確認した↓

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

`192.168.11.1`と分かる。これがWi-Fi接続してるルーターのIPアドレス

2. 実際に外部ネットワークへの接続経路を可視化してみる

```nushell
➜ traceroute 133.54.207.61
traceroute to 133.54.207.61 (133.54.207.61), 64 hops max, 40 byte packets
 1  buffalo.setup (192.168.11.1)  10.744 ms  5.071 ms  2.540 ms
```

`133.54.207.61`にアクセスしようとすると、最初に`192.168.11.1`に接続してるので、確定

3. Win機のデフォルトゲートウェイを確認する

```nushell
ipconfig /all

デフォルト ゲートウェイ 192.168.11.1
```

お？デフォルトゲートウェイが同じだ！

同じルーターに接続してるんじゃないか？

でも、だとしたらping通らないのおかしいな。

ルーターの設定がおかしいのかも。デフォルトゲートウェイに設定されてる`192.168.11.1`にアクセスして管理画面見てみるか。

パスワードわかんねー

![](https://assets.blog.amatatu.com/paste-images/20260701181638.avif)

あれ、よく見ると、Macから管理画面にアクセスした時のログイン画面のルーター名は`WHR-1165DHP4`だけど、、

Winから管理画面にアクセスした時のログイン画面のルーター名は`WHR-2533DHPL2`になってる

<h1>ルーター全く違うやないかーい!!</h1>

### 結論

`192.168.x`は汎用的な内部ネットワークIPアドレス

別々のPCでIPアドレスが似ているからって、実際には全く別のネットワークにいた。

まさにこれ↓↓↓

```nushell
ネットワークA
WHR-1166DHP4
IP: 192.168.11.1
├─ Mac 192.168.11.14
└─ ...

ネットワークB
別のルーター
IP: 192.168.11.1
├─ Windows 192.168.11.4
└─ ...
```

だから、タイトルの前提から間違っていた(勘違いしていた)

~~同一ネットワークに居るはずなのにlocalsendで接続できない~~

→ 同一ネットワークに居ると勘違いしていただけなので、localsendで接続できるはずがない
