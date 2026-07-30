---
title: "人物3D化"
date: "2026-07-11T22:00:57+09:00"
draft: true
tags: []
---

AIに調べさせた↓

## 使用環境

- **Google Colab**
  - GPU: Tesla T4
  - VRAM: 15,360 MiB

## おすすめ順

| 名前              | URL                                                                                                                                           | 特徴                                                                                                    | デメリット                                                 | 必須環境                                                 |          T4 15GBでの適性 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- | -----------------------: |
| **LHM++**         | [GitHub](https://github.com/aigc3d/LHM-plusplus)<br>[公式ページ](https://lingtengqiu.github.io/LHM%2B%2B/)                                    | 画像1枚から、服・顔・髪・色を含む写実的な3D人物を生成。360度表示とアニメーションに対応。3D Gaussian形式 | Colab用にPython・PyTorch・CUDA依存関係を構築する必要がある | モデルの公式サービス要件は **VRAM 7.3～8GB**             |             **◎ 最優先** |
| **LHM省メモリ版** | [GitHub](https://github.com/aigc3d/LHM)                                                                                                       | LHM++の前世代。画像1枚から写実的な3D人物を生成し、アニメーションも可能                                  | LHM++より古く、モデルや前処理によってメモリ使用量が増える  | Python 3.10、CUDA 11.8／12.1、**VRAM 14GB以上**          |           **○ 実行候補** |
| **LHM-MINI**      | [GitHub](https://github.com/aigc3d/LHM)<br>[モデル](https://huggingface.co/3DAIGC/LHM-MINI)                                                   | LHMの軽量モデル。半身・全身画像に対応                                                                   | 公式要件が16GBで、T4の15GBでは不足する可能性がある         | Python 3.10、CUDA 11.8／12.1、**VRAM 16GB**              |               **△ 境界** |
| **SiTH**          | [GitHub](https://github.com/SiTH-Diffusion/SiTH)<br>[オンラインデモ](https://ait.ethz.ch/sith-demo)<br>[公式ページ](https://ait.ethz.ch/sith) | 服の模様や色を含む、完全にテクスチャ付きの3D人物を生成。見えない背面も補完                              | SMPL-Xなどの追加データが必要。公式検証GPUはRTX 3090        | RTX 3090級、公式実行時間は約2分                          | **△ オンラインデモ推奨** |
| **SIFU**          | [GitHub](https://github.com/River-Zhang/SIFU)<br>[公式ページ](https://river-zhang.github.io/SIFU-projectpage/)                                | 服の形状、側面、背面の復元を重視                                                                        | 15GBでは公式要件未満。Python・PyTorch・CUDA環境も古い      | Ubuntu 18／20、Python 3.8、PyTorch 1.13、**VRAM 16GB超** |             **× 対象外** |
| **PSHuman**       | [GitHub](https://github.com/pengHTYX/PSHuman)<br>[Hugging Faceデモ](https://huggingface.co/spaces/fffiloni/PSHuman)                           | 高品質な色付き3D人物と回転動画を生成                                                                    | 必要VRAMが非常に大きい                                     | Python 3.10、PyTorch 2.1、**VRAM 40GB超**                |             **× 対象外** |

## 採用方針

1. **Google ColabのTesla T4でLHM++を実行する**
2. LHM++が依存関係やメモリで動かない場合は、**LHM省メモリ版**を試す
3. SiTHはColab実行より、まず**公式オンラインデモ**で結果を確認する
4. LHM-MINIは15GBと16GBの境界にあるため、優先度を下げる
5. SIFUとPSHumanは、現在のGPU環境では対象外とする

## 最終結論

現在の環境では、**LHM++が最も適している**。

Tesla T4のVRAMは約15GBあり、LHM++の公式サービス要件である7.3～8GBを満たしている。

次に作成するものは、以下を一つにまとめたColabノートとする。

```text
人物画像を1枚アップロード
        ↓
背景除去・人物の前処理
        ↓
LHM++で3D人物を生成
        ↓
色・服・顔を含む3D表示
        ↓
360度回転表示
        ↓
結果ファイルを保存
```

## 根拠

- LHM++  
  https://github.com/aigc3d/LHM-plusplus
- LHM／LHM-MINI  
  https://github.com/aigc3d/LHM
- SiTH  
  https://github.com/SiTH-Diffusion/SiTH
- SIFU  
  https://github.com/River-Zhang/SIFU
- PSHuman  
  https://github.com/pengHTYX/PSHuman
