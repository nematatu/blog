---
title: "TrackNetV3でバドミントンのシャトル追跡をする"
date: "2026-06-23T17:57:18+09:00"
draft: true
tags: ["バドミントン", "開発", "趣味"]
---

## TrackNetとは?

高速に移動する小型物体を追跡する深層学習モデル

https://youtu.be/NHsgkH7DG4k?si=2xhqWZO99-77QXrp

[^1]: ::github{repo="Chang-Chia-Chi/TrackNet-Badminton-Tracking-tensorflow2"}

↑ こんなことができる！！ [^1]

### 超ざっくり説明

:::note

1. バドミントンのシャトルのような、小さく高速に動く物体に特化した検出モデル
2. 静止画ではなく、連続4フレーム (V3の特徴) を入力してシャトルの動きを識別する
3. V2, V3と正確性を向上させてきた
   :::

ちなみに[V4](https://tracknetv4.github.io/)も出てるが、公式レポジトリがなかった。

## やってみる

### 実行環境

- M1 MacBook Air 16GB 1TB
- Python 3.8
- conda 26.3.2

### Python環境

機械学習、DLでPython使う時、PythonのバージョンやどのインストーラからインストールしたPythonなのかでエラー出たりするから、最初からちゃんとしておきたい

<mark>
miniforgeで環境を整える
</mark>

レポジトリ内で`conda`は使用されてないから`uv`でも良いと思ったけど、`miniforge`はApple Silicon向けに最適化されている+Pythonパッケージ以外もローカルと分離して管理できるのでエラー発生しにくいだろうということで採用

Docker使おうかと思ったが、前述した`mps`を使うためにDocker上ではなくMacの実行環境で動かす

armではなく、x86のアーキテクチャのPythonで実行するとエラーを引き起こす可能性があるので確認する

```python
import platform
print(platform.platform())

> macOS-26.5.1-arm64-arm-64bit-Mach-O
```

この出力ならarmアーキテクチャのPython

心配ならとりあえずHomeBrewで入れとけばarm対応Pythonが入る

### Miniforgeのインストール

https://conda-forge.org/download/

`arm64 (Apple Silicon)`を選択して、ダウンロードしたインストーラを実行

(実行後、Enter押してライセンス確認して続行する)

### condaの環境準備

```nushell
# 1. TrackNet用環境作成
# READMEの通りに`3.8.7`を指定したが、arm向けビルドが配布されていないらしい
➜ conda create -n tracknet python=3.8

# 2. tracknet環境が作成されていることを確認
➜ conda env list
base                     /Users/nematatu/miniforge3
tracknet                 /Users/nematatu/miniforge3/envs/tracknet

# 3. activateする
➜ conda activate tracknet

# 4. activateを確認
➜ python --version
Python 3.8.20
```

### 依存パッケージのバージョン修正

依存パッケージのバージョンが古く、`requirements.txt`を更新して`pip install -r requirements.txt`
README記載のURLからトレーニング済みデータを取得&`unzip`

```text requirements.txt
dash==2.5.1
numpy==1.22.4
opencv_python==4.13.0.92
pandas==2.0.0
Pillow==10.0.0
plotly==5.8.2
torch==2.4.1
parse
tqdm==4.68.3
pycocotools==2.0.7
```

いよいよ推論していく

### GPU実行コードをApple Siliconに対応させる

実装コードを見ると、`cuda()`を使用している。

↓

```python
x, y = x.float().cuda(), y.float().cuda()
```

```python
mask = torch.from_numpy(mask).float().cuda().unsqueeze(-1)
```

これはNvidia製GPUの使用を意味するが、M1 MacBookに搭載されていないのでエラーが発生する。

:::fuki
M1 MacBook Airでも動くように`MPS`に書き換える。

具体的には、

```python
.cuda()
```

を

```python
.to("mps")
```

へ変更するの？

参考:

- [Accelerated PyTorch training on Mac - Metal - Apple Developer](https://developer.apple.com/metal/pytorch/?utm_source=chatgpt.com)
- [MPSバックエンド — PyTorch 2.12ドキュメント](https://docs.pytorch.org/docs/2.12/notes/mps.html?utm_source=chatgpt.com)
  :::

## 活用方法

- シャトルが動いていない時間(ラリー間)を自動でカットする
  - 動画編集者は嬉しいかも
  - [コンピュータビジョンによるリアルタイムのバドミントンスコア追跡は実現可能か？ : r/computervision](https://www.reddit.com/r/computervision/comments/1sqph2b/is_realtime_badminton_score_tracking_via_computer/)

- ショット分類できるかも
  - この技術は羽を追跡するだけなので、ショット分類モデルを構築する必要がある
  - 「クリアは全体の〇%でした」とか、「攻撃型」とか

- ショットの正確性を取れたら面白いね
  - 軌道予測まで考慮しないといけない
  - 「このショットは〇%正確です」とか
- スマッシュ速度とか取れたら面白いなぁ〜

- シャトルの軌跡をアニメーションしたら面白そう
  - フェンシングの剣先をかっこいい演出にするやつバズってたよね↓

- ライブ配信に対応したい
  - ラグが生じるのは仕方ない

- Wevアプリにする
  - 他のOSSとの差別化

- 推論の高速化 \* 結構時間かかるし、エポック数小さくしないと厳しい
:::note
<video controls preload="metadata" style="width: 50%;">

<source src="https://assets.blog.amatatu.com/videos/%E5%89%A3%E5%85%88%E8%A6%96%E8%A6%9A%E5%8C%96%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%20rDamnthatsinteresting.mp4" type="video/mp4">

</video>

出典: [剣先視覚化システム : r/Damnthatsinteresting](https://www.reddit.com/r/Damnthatsinteresting/comments/1spqkk3/sword_tip_visualisation_system/?tl=ja)
:::

## TrackNetを使ったソフトウェア

姿勢推定、シャトル追跡、ヒートマップなどの情報を取得出来るレポジトリ

:::note
⭐️ 10 (2026/06/26時点)

コミット数少ない 直近コミットは2か月前

<mark>Apple Siliconで動くようにテストされてるのありがたい</mark>
![](https://assets.blog.amatatu.com/paste-images/20260625150104.avif)
::github{repo="ychenfen/badminton-pipeline-repro"}
:::

:::note
⭐️ 488 (2026/06/26時点)

開発活発

ロードマップも充実、機能追加も多い。

6/19に出来たばっかりのレポジトリだけどすごい伸びてる

<mark>GPU前提かも</mark>
![](https://assets.blog.amatatu.com/paste-images/20260625150828.avif)
::github{repo="yo-WASSUP/Good-Badminton"}
:::

## 参考

- [TrackNetV3の本家論文](https://people.cs.nycu.edu.tw/~yushuen/data/TrackNetV3.pdf)
  ::github{repo="qaz812345/TrackNetV3"}

## 関連論文

- [TrackNetを使ったダブルスのフォーメーション評価をする論文](https://ipsj.ixsq.nii.ac.jp/record/236083/files/IPSJ-Z86-4S-01.pdf)
- [バドミントン選手移動軌跡の深層学習分類を用いた打点領域検出](https://ipsj.ixsq.nii.ac.jp/record/222386/files/IPSJ-AVM22119013.pdf)
- [バドミントン選手移動軌跡の機械学習分類を用いた打点領域検出](https://www.ieice.org/publications/conference-FIT-DVDs/FIT2022/data/html/program/pdf/I-003.pdf)

↓ シャトル追跡を3D座標で取得しようとしてる。コートのバウンディングボックスとかも取ってる

- [MonoTrack: Shuttle trajectory reconstruction from monocular badminton video](https://cs.stanford.edu/people/paulliu/files/cvpr-2022.pdf)

- [Prediction of Shuttle Trajectory in Badminton Using Player’s Position](http://hvrl.ics.keio.ac.jp/paper/pdf/international_Conference/2023/VISAPP2023_Nokihara.pdf)

↓ 骨格検出までしてるっぽい(慶応の教授が書いた英論)

- [プレーヤー情報を用いたバドミントンシャトルコックの軌道予測](https://www.mdpi.com/2313-433X/9/5/99)

↓ ショットの精度向上について書いてる英論

- [バドミントンゲーム分析の強化：単眼カメラによるシャトルコック追跡とヒット検出の融合によるショット精度向上へのアプローチ](https://www.mdpi.com/1424-8220/24/13/4372)

↓ コートライン抽出に焦点を当てた論文。基盤として使えるかも知れない手法

- [水平線投影学習を用いたバドミントン大会動画のコートライン抽出アルゴリズム](https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/ipr2.12838)

↓ 選手の位置情報をヒートマップで表示する

- [Heatmap Visualization and Badminton Player Detection using Convolutional Neural Network](https://www.semanticscholar.org/paper/Heatmap-Visualization-and-Badminton-Player-using-Haq-Tarashima/12ddbf2d96e202eee2ee95d4beab6713e07ec689)

↓ サーブフォルトを判定するやつが含まれてる

- [A Machine Learning Framework for Shuttlecock Tracking and Player Service Fault Detection](https://norma.ncirl.ie/6618/1/akshaymenon.pdf)

↓ 製品として分析ソフトが実装されてる？
https://www.youtube.com/watch?v=DbJbjiizsrY

↓ スマートグラスを使った競技力向上
https://www.youtube.com/watch?v=0W7FqDBD7Ts

- [バドミントン分析ソフトのまとめ](https://badmintonandy.com/software-to-analyse-a-badminton-match/)
  マリンはデータを手作業で集めてExcelで管理してたらしい

↓ 配信中継映像から試合分析

- [Towards Structured Analysis of Broadcast Badminton Videos](https://www.researchgate.net/publication/322075902_Towards_Structured_Analysis_of_Broadcast_Badminton_Videos)

- [AWSでTrackNetを使う記事](https://aws.amazon.com/jp/blogs/media/ball-trajectory-tracking-in-sports-broadcast-videos-using-aws-machine-learning/)
  - [GitHub](https://aws.amazon.com/jp/blogs/media/ball-trajectory-tracking-in-sports-broadcast-videos-using-aws-machine-learning/)

- [バドミントンDX（デジタルトランスフォーメーション）で“勝利”をつかめ!!～AI×データで進化をめざすチーム～：日立情報通信エンジニアリング](https://www.hitachi-ite.co.jp/column/111.html)

- https://x.com/keisuke_fj/status/1532652921644408832
- [バドミントン選手の移動軌跡と骨格情報に基づくショット情報推定](https://sigmr.vrsj.org/events/pdfs/2024Jan/MR2024-6.pdf)
- https://x.com/mountain_mal/status/2066559357408465106

↓ 動画を3D深度で表現するやつ。組み合わせて遊べそう

- [Motion meets Attention: Video Motion Prompts](https://q1xiangchen.github.io/motion-prompts/)

- [CorchAI](https://inoliao.github.io/CoachAI/)
  - ::github{repo="/wywyWang/CoachAI-Projects"}
  - [公式サイト？](https://sites.google.com/view/coachai-challenge-2023/report?authuser=0)

- [並列プログラミングによるTrackNetの高速化](https://inoliao.github.io/ppTrackNetWebsite/)

## お気持ち

:fuki[AI使ってスマホでシャトル軌道取って、自動で点数数えるやつ作ってる人いたり、俺がやろうとしてることの新規性がないなぁ。]

- 「音」とか使えないかな。いい音はスマッシュ速いみたいな。分離がむずい？識別もむずいよね
  - スマッシュモーションと音のタイミングがあってれば、正しいとする？
  - 雑音の可能性もあるよね

- [バドミントン競技 × 超高臨場感通信技術 Kirari!｜NTT R&D Website](https://www.rd.ntt/research/JN202110_15548.html)

↑ これさ、配信を自鯖で処理して、ちっちゃいホログラムで立体的に見せるみたいなこと出来そうじゃね？

結構昔に、百均のアクリル4つだけで立体的に見せるみたいな流行ったよね。↓

![](https://b55858b0d5c41b055859b1e758ddf3a2.r2.cloudflarestorage.com/blog-images/paste-images/20260625045138.avif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=068034e59fa6e75d0f3f5e66181df5e6%2F20260624%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20260624T195146Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=c090f91966a51cd37c8f8ce18e7742a1062f0621bb9991f749e69bf64fe1306b)

それと組み合わせれば、ちっちゃいけど机の横に置いといて、そこでちっちゃく試合してるみたいなので遊べそう。

---

### miniforgeのデフォルト設定を変更

インストール後、自動的にBase環境に入るが、なんか気持ち悪いので設定で無効化する

```
~/.config via 🅒 base
             これ ↑↑↑
```

明示的に`activate`した時だけconda環境に入るようにする

```nushell
conda config --set auto_activate false
```

### 依存パッケージの更新

```
opencv_python==4.4.0.46
```

このopencvバージョンにarm用whellが見つからず、ソールビルドを探している

ビルド依存のnumpy 1.17.3をビルドしようとしてエラーが出てる

arm環境に適応できないからエラーかも

解決策はopencvのバージョンを上げる

:::note[最新バージョンの確認方法]

```nushell
➜ pip index versions opencv-python
WARNING: pip index is currently an experimental command. It may be removed/changed in a future release without prior warning.
opencv-python (4.13.0.92)
Available versions: 4.13.0.92, 4.13.0.90, 4.12.0.88, 4.11.0.86, 4.10.0.84, 4.10.0.82, 4.9.0.80, 4.8.1.78, 4.8.0.76, 4.8.0.74, 4.7.0.72, 4.6.0.66, 4.5.5.64,
4.5.4.60, 4.5.3.56, 4.5.1.48, 4.4.0.46, 4.4.0.40, 4.3.0.38, 3.4.18.65, 3.4.17.63, 3.4.16.59, 3.4.16.57, 3.4.15.55, 3.4.13.47, 3.4.11.45, 3.4.11.43, 3.4.11.4
1, 3.4.10.37, 3.4.0.14
```

:::

最新バージョンに変更

```text
opencv_python==4.13.0.92
```

```python
>>> print(torch.backends.mps.is_available())
True
```
