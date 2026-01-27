# 機械学習 学習ノート

## 概要

機械学習の基礎概念と、Web アプリケーションでの活用方法を学ぶ。

## 機械学習の種類

```
┌─────────────────────────────────────────────────────┐
│              Machine Learning                        │
│                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────┐ │
│  │   Supervised  │  │  Unsupervised │  │ Reinfor │ │
│  │   Learning    │  │   Learning    │  │ cement  │ │
│  │               │  │               │  │         │ │
│  │ - 分類        │  │ - クラスタリング│ │ - 強化  │ │
│  │ - 回帰        │  │ - 次元削減    │  │   学習  │ │
│  └───────────────┘  └───────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────┘
```

## TensorFlow.js（ブラウザ/Node.js）

### セットアップ

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-node
```

### 画像分類

```typescript
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// モデルロード（事前学習済み）
const model = await mobilenet.load();

// 画像分類
async function classifyImage(imageElement: HTMLImageElement) {
  const predictions = await model.classify(imageElement);
  return predictions;
  // [{ className: 'cat', probability: 0.95 }, ...]
}
```

### カスタムモデル

```typescript
// シンプルな分類モデル
const model = tf.sequential();

model.add(tf.layers.dense({
  inputShape: [10],
  units: 32,
  activation: 'relu',
}));

model.add(tf.layers.dense({
  units: 3,
  activation: 'softmax',
}));

model.compile({
  optimizer: 'adam',
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy'],
});

// トレーニング
await model.fit(xTrain, yTrain, {
  epochs: 100,
  validationSplit: 0.2,
  callbacks: {
    onEpochEnd: (epoch, logs) => {
      console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
    },
  },
});

// 予測
const prediction = model.predict(tf.tensor2d([[...input]]));
```

## Hugging Face（推論 API）

```typescript
// Hugging Face Inference API
async function classify(text: string) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/bert-base-uncased',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  return response.json();
}

// 感情分析
async function analyzeSentiment(text: string) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  return response.json();
}
```

## 推薦システム

```typescript
// 協調フィルタリング（簡易版）
interface UserRating {
  userId: string;
  itemId: string;
  rating: number;
}

class RecommendationEngine {
  private ratings: UserRating[];

  constructor(ratings: UserRating[]) {
    this.ratings = ratings;
  }

  // ユーザーベース協調フィルタリング
  recommendForUser(userId: string, topN = 10): string[] {
    const userRatings = this.getUserRatings(userId);
    const similarUsers = this.findSimilarUsers(userId, userRatings);

    const recommendations = new Map<string, number>();

    for (const { userId: similarUserId, similarity } of similarUsers) {
      const otherRatings = this.getUserRatings(similarUserId);
      
      for (const { itemId, rating } of otherRatings) {
        if (!userRatings.has(itemId)) {
          const score = (recommendations.get(itemId) || 0) + rating * similarity;
          recommendations.set(itemId, score);
        }
      }
    }

    return [...recommendations.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([itemId]) => itemId);
  }

  private getUserRatings(userId: string): Map<string, number> {
    const map = new Map<string, number>();
    for (const r of this.ratings.filter((r) => r.userId === userId)) {
      map.set(r.itemId, r.rating);
    }
    return map;
  }

  private findSimilarUsers(userId: string, userRatings: Map<string, number>) {
    // コサイン類似度で類似ユーザーを計算
    // 実装は省略
    return [];
  }
}
```

## 異常検知

```typescript
// 統計的異常検知（Z-score）
function detectAnomalies(data: number[], threshold = 3): number[] {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(
    data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length
  );

  const anomalies: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const zScore = Math.abs((data[i] - mean) / std);
    if (zScore > threshold) {
      anomalies.push(i);
    }
  }

  return anomalies;
}

// API レスポンスタイム監視
async function monitorLatency() {
  const latencies = await getRecentLatencies();
  const anomalies = detectAnomalies(latencies);

  if (anomalies.length > 0) {
    await sendAlert('Latency anomaly detected');
  }
}
```

## Vercel AI SDK との統合

```typescript
// Embeddings for ML
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// テキストの埋め込みベクトル化
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'Machine learning is fascinating',
});

// 類似度計算
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

## MLOps 基礎

```
1. データ収集 → 2. 前処理 → 3. トレーニング → 4. 評価 → 5. デプロイ → 6. 監視
     ↑                                                                    │
     └────────────────────────────────────────────────────────────────────┘
                              フィードバックループ
```

## 参考リソース

- [TensorFlow.js](https://www.tensorflow.org/js)
- [Hugging Face](https://huggingface.co/)
- [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course)
