---
title: "【macOS】グローバルショートカットを奪っている犯人を探す"
date: "2026-06-14T16:25:14+09:00"
draft: false
tags: ["開発"]
---
Vimキーバインドの`Ctrl+n`を使いたいのに、いつの日か設定したグローバルショートカットのせいでメモアプリが起動してしまう。

犯人を探して削除する。

今後こんなことがあった時のための備忘録

## 確認したこと
* 恐らく、設定したであろう`ProNotes`というNote.appのenhanceアプリを消した

* note appの設定を見たけど、ショートカットの項目はなかった。

* `設定 → キーボード → キーボードショートカット → アプリのショートカット`には何も設定されていなかった。
![](https://assets.blog.amatatu.com/paste-images/20260614163109.avif?)

* Raycastのホットキーには設定されていない。
(⌘+space → ⌘+. → Extensions)
![](https://assets.blog.amatatu.com/paste-images/20260614163609.avif?)

## 怪しい
* ProNotesの残骸がまだ残っている？

## GPT5.5に聞いた
macではアプリをゴミ箱に入れても、Preference, LaunchAgentsは自動削除されないらしい

### 確認する

```
➜ ls ~/Library/LaunchAgents                        
 com.google.GoogleUpdater.wake.plist   com.google.keystone.xpcservice.plist   com.mathworks.mathworksservicehost.agent.plist
 com.google.keystone.agent.plist       com.koekeishiya.yabai.plist

blog on  main [$!?] is 📦 0.0.1 via ⬢ v24.16.0 
➜ ls ~/Library/Application\ Support  | grep -i ProNotes

blog on  main [$!?] is 📦 0.0.1 via ⬢ v24.16.0 
➜ ls ~/Library/Preferences  | grep -i ProNotes         
com.dexterleng.ProNotes.plist

```

`~/Library/Preferences`には`com.dexterleng.ProNotes.plist`があった。

それ以外にはないんだが、それぞれの意味はなんだろう

→ `Preferences`は単なる設定ファイルで、ショートカットを発火させることはない。

常駐起動するpsやLaunchAgentsにないとおかしいんだが、何故ないんだろう

```
➜ ps aux | grep -i ProNotes
nematatu         10538   0.0  0.0 435299584   1168 s027  R+    4:47PM   0:00.00 grep -i ProNotes
```

ちなみに、、

a: all processes

u: for user information

x: include GUI processes

らしい

## とりあえず再起動する

先に ProNotesのPreferencesを削除しておく
```
rm ~/Library/Preferences/com.dexterleng.ProNotes.plist
```

plistを書き換えたり削除した場合は、↓で再起動するらしい
(キャッシュとかを削除)
```
killall cfprefsd 
```

cf: Core Foundation

prefs:  Preferences

d: Daemon

### 再起動でもだめだった！！
## 原因見つかった

普通に設定のキーボードショートカットにあった...

![](https://assets.blog.amatatu.com/paste-images/20260614181200.avif?)

### 見つけた過程

1. システムで設定されてるショートカットを一時ファイルに書き込む

```bash
➜ defaults read com.apple.symbolichotkeys AppleSymbolicHotKeys > /tmp/hotkeys.plist
```

2. jsonにして探しやすくする
```
➜ plutil -convert json -o - /tmp/hotkeys.plist | jq .                              
```

`property List util`の略

apple独自の形式らしいのでjsonに変換する

出力例
```json
➜ plutil -convert json -o - /tmp/hotkeys.plist | jq .

{
  "25": {
    "enabled": "0"
  },
  "18": {
    "enabled": "0"
  },
  "26": {
    "enabled": "0"
  },
  "190": {
    "enabled": "1",
    "value": {
      "type": "standard",
      "parameters": [
        "110",
        "45",
        "262144"
      ]
    }
  },
  "19": {
    "enabled": "0"
  },

.
.
.
Cont'd
```

この結果の中にQuick Memoの起動ショーカット情報が書かれているけど、それぞれ割り当てられた数字で記述されている。

例) Quick Memo → 190 や、n → 45 など

3. jqのオプションでquick memoの設定を探す

```json
➜ plutil -convert json -o - /tmp/hotkeys.plist | jq  '."190"'

{
  "enabled": "1",
  "value": {
    "type": "standard",
    "parameters": [
      "110",
      "45",
      "262144"
    ]
  }
}

```

45が`n`, 262144が`Control`を表すので、
Quick Memoはアップルの設定から`Ctrl+n`に割り当てられている。
