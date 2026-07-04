---
title: "研究室PCのインターネット接続が切れるのをどうにかしたい"
date: "2026-07-03T12:58:42+09:00"
draft: true
tags: []
---

## 目的

- 常に研究室PCにTailscale + SSH できるようにする

---

# Step 1: 学内ネットワークの仕様調査

## 1-1. 認証切れ時のローカル通信確認

### 実施タイミング

- 次回、学内認証が切れたとき

### 確認事項

別の研究室PCから NVIDIA PC に対して

```bash
ping <NVIDIA PCの学内IP>
```

```bash
ssh user@<NVIDIA PCの学内IP>
```

または RDP 接続を試す。

### 結果

- [ ] 成功
- [ ] 失敗

### 判定

- 成功 → 「研究室内常設PC案」が有力
- 失敗 → NVIDIA PC自身で自動認証する必要あり

---

## 1-2. 認証切れ時の Captive Portal 挙動確認

認証切れ後、NVIDIA PC上で実行。

```bash
curl -v http://neverssl.com
```

または

```bash
curl -v http://example.com
```

結果を保存する。

確認したい内容

- [ ] 認証ページURL
- [ ] HTTPステータスコード
- [ ] リダイレクト先URL

---

## 1-3. 認証ページ情報収集

認証ページが表示されたら

- [ ] URLを保存
- [ ] スクリーンショット取得
- [ ] HTML保存

Chrome DevTools を開き、

- [ ] input要素の name 属性
- [ ] form の action 属性

を確認する。

---

# Step 2: 自動認証の検証

## 条件

以下が満たされるか確認

- [x] CAPTCHAなし
- [x] 多要素認証なし
- [x] ワンタイムパスワードなし

## 実施

Playwright で

1. 認証ページへアクセス
2. ID入力
3. Password入力
4. ログインボタン押下

を自動化する。

---

# Step 3: 自動復旧システム構築

## 3-1. 疎通監視

5分ごとに実行

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.google.com/generate_204
```

正常時

```text
204
```

以外なら認証処理を実行する。

---

## 3-2. systemd timer 作成

定期実行用 timer を作成。

処理内容

```text
インターネット接続確認
↓
失敗
↓
Playwright起動
↓
自動ログイン
```

---

# Step 4: 常設PC案の検討

Step1-1 が成功した場合のみ検討。

構成案

```text
自宅MBA
↓ Tailscale
研究室常設PC
↓ RDP/SSH (LAN内)
NVIDIA PC
```

必要確認事項

- [ ] 認証切れ後も LAN 内通信可能か
- [ ] 常設PCに Tailscale を導入できるか

---

# Step 5: 大学へ確認

情報基盤センターへ確認する内容

- [ ] 研究用途サーバの無人運用可否
- [ ] MACアドレス登録制度の有無
- [ ] 認証除外制度の有無
- [ ] 固定IP払い出し制度の有無

---

# 現時点での第一候補

NVIDIA PC自身に

- Tailscale
- Playwright
- 自動認証スクリプト
- systemd timer

を導入し、完全自動復旧を実現する。
