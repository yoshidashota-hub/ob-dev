# 第0章: はじめに

## 機械学習とは

機械学習（Machine Learning）は、データからパターンを学習し、予測や判断を行う技術です。

## 機械学習の種類

```
┌─────────────────────────────────────────────────────┐
│               Machine Learning                       │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Supervised     │  │  Unsupervised   │          │
│  │  Learning       │  │  Learning       │          │
│  │  (教師あり学習)  │  │  (教師なし学習)  │          │
│  │                 │  │                 │          │
│  │  • 分類         │  │  • クラスタリング│          │
│  │  • 回帰         │  │  • 次元削減     │          │
│  │  • 時系列予測   │  │  • 異常検知     │          │
│  └─────────────────┘  └─────────────────┘          │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Reinforcement  │  │  Deep           │          │
│  │  Learning       │  │  Learning       │          │
│  │  (強化学習)     │  │  (深層学習)     │          │
│  │                 │  │                 │          │
│  │  • ゲーム AI    │  │  • 画像認識     │          │
│  │  • ロボット制御 │  │  • 自然言語処理 │          │
│  └─────────────────┘  └─────────────────┘          │
└─────────────────────────────────────────────────────┘
```

## Web 開発での活用例

| 用途           | 技術               | 例                     |
| -------------- | ------------------ | ---------------------- |
| 画像分類       | CNN                | 商品画像の自動タグ付け |
| 検索           | Embeddings         | セマンティック検索     |
| レコメンド     | 協調フィルタリング | 商品おすすめ           |
| 感情分析       | NLP                | レビュー分析           |
| 異常検知       | 統計/ML            | 不正検知               |
| チャットボット | LLM                | カスタマーサポート     |

## ML vs AI vs LLM

```
┌─────────────────────────────────────────────────────┐
│                    AI (人工知能)                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              Machine Learning                │   │
│  │  ┌─────────────────────────────────────┐    │   │
│  │  │           Deep Learning              │    │   │
│  │  │  ┌─────────────────────────────┐    │    │   │
│  │  │  │    LLM (大規模言語モデル)    │    │    │   │
│  │  │  │    GPT, Claude, Gemini      │    │    │   │
│  │  │  └─────────────────────────────┘    │    │   │
│  │  └─────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Web 開発者向け ML ツール

### ブラウザ/Node.js

```typescript
// TensorFlow.js - クライアント/サーバーで ML
import * as tf from "@tensorflow/tfjs";

const model = tf.sequential();
model.add(tf.layers.dense({ units: 10, inputShape: [5] }));
```

### 事前学習モデル API

```typescript
// Hugging Face Inference API
const response = await fetch(
  "https://api-inference.huggingface.co/models/bert-base-uncased",
  {
    method: "POST",
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
    body: JSON.stringify({ inputs: "Hello world" }),
  },
);
```

### Embeddings (AI SDK)

```typescript
// ベクトル化
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

const { embedding } = await embed({
  model: openai.embedding("text-embedding-3-small"),
  value: "Machine learning is amazing",
});
// embedding: number[] (1536次元のベクトル)
```

## 学習の流れ

```
1. データ収集    →  2. 前処理      →  3. 特徴量設計
       ↓                                    ↓
6. デプロイ     ←  5. 評価        ←  4. モデル訓練
       ↓
7. モニタリング  →  改善ループ
```

## 本ガイドで学ぶこと

1. **基礎理論**: 機械学習の基本概念
2. **実装方法**: TensorFlow.js での実装
3. **応用**: Web アプリへの統合
4. **運用**: MLOps の基礎

## 環境構築

```bash
# TensorFlow.js (Node.js)
npm install @tensorflow/tfjs @tensorflow/tfjs-node

# 事前学習モデル
npm install @tensorflow-models/mobilenet
npm install @tensorflow-models/coco-ssd

# AI SDK (Embeddings)
npm install ai @ai-sdk/openai
```

## 次のステップ

次章では、機械学習の基本概念（教師あり学習、教師なし学習）について学びます。
