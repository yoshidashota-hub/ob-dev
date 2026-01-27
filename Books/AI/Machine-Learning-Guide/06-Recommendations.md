# 第6章: 推薦システム

## 推薦システムの種類

```
┌─────────────────────────────────────────────────────────┐
│                 推薦システムの分類                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  コンテンツベース (Content-Based)                 │   │
│  │  • アイテムの特徴に基づく                        │   │
│  │  • ユーザーの過去の好みと類似したものを推薦      │   │
│  │  例: 「この映画が好きなら、同じジャンルの映画」   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  協調フィルタリング (Collaborative Filtering)     │   │
│  │  • ユーザー間の類似性に基づく                    │   │
│  │  • 「似たユーザーが好んだもの」を推薦            │   │
│  │  例: 「あなたと似た人はこれも購入しています」     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ハイブリッド (Hybrid)                           │   │
│  │  • 上記を組み合わせ                              │   │
│  │  • 各手法の弱点を補完                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## コンテンツベース推薦

### 特徴量ベースの類似度計算

```typescript
interface Product {
  id: string;
  name: string;
  category: string;
  tags: string[];
  price: number;
  description: string;
}

// コサイン類似度
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 商品の特徴ベクトルを作成
function createFeatureVector(product: Product, allTags: string[]): number[] {
  const tagVector = allTags.map((tag) => (product.tags.includes(tag) ? 1 : 0));
  return tagVector;
}

// コンテンツベース推薦
function recommendByContent(
  targetProduct: Product,
  allProducts: Product[],
  allTags: string[],
  topK: number = 5,
): Array<{ product: Product; similarity: number }> {
  const targetVector = createFeatureVector(targetProduct, allTags);

  const similarities = allProducts
    .filter((p) => p.id !== targetProduct.id)
    .map((product) => {
      const vector = createFeatureVector(product, allTags);
      return {
        product,
        similarity: cosineSimilarity(targetVector, vector),
      };
    })
    .sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, topK);
}
```

### Embeddings を使ったコンテンツ推薦

```typescript
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

interface ProductWithEmbedding {
  id: string;
  name: string;
  description: string;
  embedding?: number[];
}

// 商品の Embedding を生成
async function generateProductEmbeddings(
  products: ProductWithEmbedding[],
): Promise<ProductWithEmbedding[]> {
  const texts = products.map(
    (p) => `${p.name}. ${p.description}`,
  );

  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: texts,
  });

  return products.map((product, i) => ({
    ...product,
    embedding: embeddings[i],
  }));
}

// 類似商品を検索
function findSimilarProducts(
  targetProduct: ProductWithEmbedding,
  allProducts: ProductWithEmbedding[],
  topK: number = 5,
): Array<{ product: ProductWithEmbedding; similarity: number }> {
  if (!targetProduct.embedding) return [];

  return allProducts
    .filter((p) => p.id !== targetProduct.id && p.embedding)
    .map((product) => ({
      product,
      similarity: cosineSimilarity(targetProduct.embedding!, product.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
```

## 協調フィルタリング

### ユーザーベース協調フィルタリング

```typescript
interface Rating {
  userId: string;
  itemId: string;
  rating: number;
}

interface UserBasedCF {
  userItemMatrix: Map<string, Map<string, number>>;
  userSimilarities: Map<string, Map<string, number>>;
}

// ユーザー-アイテム行列を構築
function buildUserItemMatrix(ratings: Rating[]): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();

  for (const { userId, itemId, rating } of ratings) {
    if (!matrix.has(userId)) {
      matrix.set(userId, new Map());
    }
    matrix.get(userId)!.set(itemId, rating);
  }

  return matrix;
}

// ユーザー間の類似度を計算（ピアソン相関係数）
function calculateUserSimilarity(
  user1Ratings: Map<string, number>,
  user2Ratings: Map<string, number>,
): number {
  // 共通のアイテムを取得
  const commonItems = [...user1Ratings.keys()].filter((item) =>
    user2Ratings.has(item),
  );

  if (commonItems.length === 0) return 0;

  const ratings1 = commonItems.map((item) => user1Ratings.get(item)!);
  const ratings2 = commonItems.map((item) => user2Ratings.get(item)!);

  const mean1 = ratings1.reduce((a, b) => a + b) / ratings1.length;
  const mean2 = ratings2.reduce((a, b) => a + b) / ratings2.length;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < commonItems.length; i++) {
    const diff1 = ratings1[i] - mean1;
    const diff2 = ratings2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(denom1) * Math.sqrt(denom2);
  return denominator === 0 ? 0 : numerator / denominator;
}

// ユーザーベース推薦
function recommendUserBased(
  targetUserId: string,
  userItemMatrix: Map<string, Map<string, number>>,
  topK: number = 5,
  numSimilarUsers: number = 10,
): Array<{ itemId: string; predictedRating: number }> {
  const targetRatings = userItemMatrix.get(targetUserId);
  if (!targetRatings) return [];

  // 類似ユーザーを計算
  const similarities: Array<{ userId: string; similarity: number }> = [];

  userItemMatrix.forEach((ratings, userId) => {
    if (userId !== targetUserId) {
      const similarity = calculateUserSimilarity(targetRatings, ratings);
      if (similarity > 0) {
        similarities.push({ userId, similarity });
      }
    }
  });

  // 類似度でソートして上位N人を取得
  const topSimilarUsers = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, numSimilarUsers);

  // ターゲットユーザーが評価していないアイテムの予測評価を計算
  const predictions = new Map<string, { sum: number; weight: number }>();

  for (const { userId, similarity } of topSimilarUsers) {
    const ratings = userItemMatrix.get(userId)!;

    ratings.forEach((rating, itemId) => {
      if (!targetRatings.has(itemId)) {
        if (!predictions.has(itemId)) {
          predictions.set(itemId, { sum: 0, weight: 0 });
        }
        const pred = predictions.get(itemId)!;
        pred.sum += similarity * rating;
        pred.weight += Math.abs(similarity);
      }
    });
  }

  // 予測評価を計算してソート
  const results: Array<{ itemId: string; predictedRating: number }> = [];

  predictions.forEach(({ sum, weight }, itemId) => {
    if (weight > 0) {
      results.push({
        itemId,
        predictedRating: sum / weight,
      });
    }
  });

  return results.sort((a, b) => b.predictedRating - a.predictedRating).slice(0, topK);
}
```

### アイテムベース協調フィルタリング

```typescript
// アイテム間の類似度を計算
function calculateItemSimilarities(
  userItemMatrix: Map<string, Map<string, number>>,
): Map<string, Map<string, number>> {
  // アイテム-ユーザー行列に転置
  const itemUserMatrix = new Map<string, Map<string, number>>();

  userItemMatrix.forEach((items, userId) => {
    items.forEach((rating, itemId) => {
      if (!itemUserMatrix.has(itemId)) {
        itemUserMatrix.set(itemId, new Map());
      }
      itemUserMatrix.get(itemId)!.set(userId, rating);
    });
  });

  // アイテム間の類似度を計算
  const similarities = new Map<string, Map<string, number>>();
  const items = [...itemUserMatrix.keys()];

  for (let i = 0; i < items.length; i++) {
    const item1 = items[i];
    similarities.set(item1, new Map());

    for (let j = 0; j < items.length; j++) {
      if (i !== j) {
        const item2 = items[j];
        const sim = calculateUserSimilarity(
          itemUserMatrix.get(item1)!,
          itemUserMatrix.get(item2)!,
        );
        similarities.get(item1)!.set(item2, sim);
      }
    }
  }

  return similarities;
}

// アイテムベース推薦
function recommendItemBased(
  targetUserId: string,
  userItemMatrix: Map<string, Map<string, number>>,
  itemSimilarities: Map<string, Map<string, number>>,
  topK: number = 5,
): Array<{ itemId: string; predictedRating: number }> {
  const targetRatings = userItemMatrix.get(targetUserId);
  if (!targetRatings) return [];

  const predictions = new Map<string, { sum: number; weight: number }>();

  // 各未評価アイテムの予測評価を計算
  itemSimilarities.forEach((similarities, itemId) => {
    if (!targetRatings.has(itemId)) {
      let sum = 0;
      let weight = 0;

      targetRatings.forEach((rating, ratedItemId) => {
        const sim = similarities.get(ratedItemId) || 0;
        if (sim > 0) {
          sum += sim * rating;
          weight += Math.abs(sim);
        }
      });

      if (weight > 0) {
        predictions.set(itemId, { sum, weight });
      }
    }
  });

  const results: Array<{ itemId: string; predictedRating: number }> = [];

  predictions.forEach(({ sum, weight }, itemId) => {
    results.push({
      itemId,
      predictedRating: sum / weight,
    });
  });

  return results.sort((a, b) => b.predictedRating - a.predictedRating).slice(0, topK);
}
```

## 行列分解

```typescript
import * as tf from "@tensorflow/tfjs";

// Matrix Factorization による推薦
class MatrixFactorization {
  private userFactors: tf.Variable | null = null;
  private itemFactors: tf.Variable | null = null;
  private userBias: tf.Variable | null = null;
  private itemBias: tf.Variable | null = null;
  private globalBias: number = 0;

  private numUsers: number = 0;
  private numItems: number = 0;
  private numFactors: number;

  private userIdMap: Map<string, number> = new Map();
  private itemIdMap: Map<string, number> = new Map();

  constructor(numFactors: number = 50) {
    this.numFactors = numFactors;
  }

  // モデルを初期化
  private initialize(ratings: Rating[]): void {
    // ID マッピングを作成
    const userIds = [...new Set(ratings.map((r) => r.userId))];
    const itemIds = [...new Set(ratings.map((r) => r.itemId))];

    userIds.forEach((id, idx) => this.userIdMap.set(id, idx));
    itemIds.forEach((id, idx) => this.itemIdMap.set(id, idx));

    this.numUsers = userIds.length;
    this.numItems = itemIds.length;

    // 因子行列を初期化
    this.userFactors = tf.variable(
      tf.randomNormal([this.numUsers, this.numFactors], 0, 0.1),
    );
    this.itemFactors = tf.variable(
      tf.randomNormal([this.numItems, this.numFactors], 0, 0.1),
    );

    // バイアス項を初期化
    this.userBias = tf.variable(tf.zeros([this.numUsers]));
    this.itemBias = tf.variable(tf.zeros([this.numItems]));

    // グローバルバイアス
    this.globalBias = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  }

  // 予測
  private predict(userIdx: number, itemIdx: number): tf.Scalar {
    return tf.tidy(() => {
      const userVec = this.userFactors!.slice([userIdx, 0], [1, this.numFactors]);
      const itemVec = this.itemFactors!.slice([itemIdx, 0], [1, this.numFactors]);

      const dotProduct = userVec.mul(itemVec).sum();
      const userB = this.userBias!.slice([userIdx], [1]).squeeze();
      const itemB = this.itemBias!.slice([itemIdx], [1]).squeeze();

      return dotProduct.add(userB).add(itemB).add(this.globalBias);
    });
  }

  // 訓練
  async train(
    ratings: Rating[],
    epochs: number = 100,
    learningRate: number = 0.01,
    regularization: number = 0.02,
  ): Promise<void> {
    this.initialize(ratings);

    const optimizer = tf.train.adam(learningRate);

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;

      // シャッフル
      const shuffled = [...ratings].sort(() => Math.random() - 0.5);

      for (const { userId, itemId, rating } of shuffled) {
        const userIdx = this.userIdMap.get(userId)!;
        const itemIdx = this.itemIdMap.get(itemId)!;

        const loss = optimizer.minimize(
          () => {
            const pred = this.predict(userIdx, itemIdx);
            const mse = pred.sub(rating).square();

            // L2 正則化
            const userReg = this.userFactors!
              .slice([userIdx, 0], [1, this.numFactors])
              .square()
              .sum()
              .mul(regularization);
            const itemReg = this.itemFactors!
              .slice([itemIdx, 0], [1, this.numFactors])
              .square()
              .sum()
              .mul(regularization);

            return mse.add(userReg).add(itemReg);
          },
          true,
          [this.userFactors!, this.itemFactors!, this.userBias!, this.itemBias!],
        ) as tf.Scalar;

        totalLoss += loss.dataSync()[0];
        loss.dispose();
      }

      if (epoch % 10 === 0) {
        console.log(`Epoch ${epoch}: Loss = ${(totalLoss / ratings.length).toFixed(4)}`);
      }
    }
  }

  // 推薦
  recommend(userId: string, topK: number = 10): Array<{ itemId: string; score: number }> {
    const userIdx = this.userIdMap.get(userId);
    if (userIdx === undefined) return [];

    const scores: Array<{ itemId: string; score: number }> = [];

    this.itemIdMap.forEach((itemIdx, itemId) => {
      const score = this.predict(userIdx, itemIdx).dataSync()[0];
      scores.push({ itemId, score });
    });

    return scores.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
```

## 実践: EC サイトの推薦システム

```typescript
// Next.js API Route
// app/api/recommendations/route.ts

interface UserHistory {
  userId: string;
  viewedProducts: string[];
  purchasedProducts: string[];
  ratings: Array<{ productId: string; rating: number }>;
}

interface RecommendationResult {
  productId: string;
  score: number;
  reason: string;
}

async function getRecommendations(
  userId: string,
  context: "homepage" | "product_detail" | "cart",
  currentProductId?: string,
): Promise<RecommendationResult[]> {
  // ユーザー履歴を取得
  const history = await getUserHistory(userId);

  let recommendations: RecommendationResult[] = [];

  switch (context) {
    case "homepage":
      // パーソナライズされた推薦
      recommendations = await getPersonalizedRecommendations(history);
      break;

    case "product_detail":
      if (currentProductId) {
        // 類似商品の推薦
        const similar = await getSimilarProducts(currentProductId);
        // この商品を見た人はこれも見ています
        const alsoBought = await getAlsoBought(currentProductId);
        recommendations = [...similar, ...alsoBought];
      }
      break;

    case "cart":
      // カート内商品と一緒に購入されることが多い商品
      recommendations = await getFrequentlyBoughtTogether(
        history.viewedProducts,
      );
      break;
  }

  return recommendations;
}

// パーソナライズされた推薦
async function getPersonalizedRecommendations(
  history: UserHistory,
): Promise<RecommendationResult[]> {
  const recommendations: RecommendationResult[] = [];

  // 1. 購入履歴に基づく推薦
  if (history.purchasedProducts.length > 0) {
    const lastPurchased = history.purchasedProducts[0];
    const similar = await findSimilarProducts(lastPurchased, 5);
    recommendations.push(
      ...similar.map((p) => ({
        productId: p.id,
        score: p.similarity,
        reason: "購入した商品に基づくおすすめ",
      })),
    );
  }

  // 2. 閲覧履歴に基づく推薦
  if (history.viewedProducts.length > 0) {
    const recentViews = history.viewedProducts.slice(0, 5);
    for (const productId of recentViews) {
      const similar = await findSimilarProducts(productId, 2);
      recommendations.push(
        ...similar.map((p) => ({
          productId: p.id,
          score: p.similarity * 0.8, // 購入より重みを下げる
          reason: "閲覧した商品に基づくおすすめ",
        })),
      );
    }
  }

  // 3. 協調フィルタリングの結果を追加
  const cfRecommendations = await getCollaborativeRecommendations(history.userId);
  recommendations.push(
    ...cfRecommendations.map((r) => ({
      ...r,
      reason: "あなたと似た人が購入しています",
    })),
  );

  // 重複を除去してスコア順にソート
  const uniqueRecommendations = new Map<string, RecommendationResult>();
  for (const rec of recommendations) {
    const existing = uniqueRecommendations.get(rec.productId);
    if (!existing || existing.score < rec.score) {
      uniqueRecommendations.set(rec.productId, rec);
    }
  }

  return [...uniqueRecommendations.values()]
    .filter((r) => !history.purchasedProducts.includes(r.productId))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}
```

## 評価指標

```typescript
interface RecommendationMetrics {
  precision: number;
  recall: number;
  ndcg: number;
  coverage: number;
  diversity: number;
}

// 精度評価
function evaluateRecommendations(
  recommendations: string[],
  actualItems: string[],
  k: number,
): { precision: number; recall: number } {
  const topK = recommendations.slice(0, k);
  const hits = topK.filter((item) => actualItems.includes(item)).length;

  return {
    precision: hits / k,
    recall: actualItems.length > 0 ? hits / actualItems.length : 0,
  };
}

// NDCG (Normalized Discounted Cumulative Gain)
function calculateNDCG(
  recommendations: string[],
  relevanceScores: Map<string, number>,
  k: number,
): number {
  const topK = recommendations.slice(0, k);

  // DCG
  let dcg = 0;
  topK.forEach((item, i) => {
    const rel = relevanceScores.get(item) || 0;
    dcg += rel / Math.log2(i + 2);
  });

  // IDCG (理想的な順序)
  const idealOrder = [...relevanceScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k);

  let idcg = 0;
  idealOrder.forEach(([, rel], i) => {
    idcg += rel / Math.log2(i + 2);
  });

  return idcg > 0 ? dcg / idcg : 0;
}

// 多様性（推薦アイテム間の非類似度）
function calculateDiversity(
  recommendations: string[],
  similarityMatrix: Map<string, Map<string, number>>,
): number {
  let totalDissimilarity = 0;
  let pairs = 0;

  for (let i = 0; i < recommendations.length; i++) {
    for (let j = i + 1; j < recommendations.length; j++) {
      const sim = similarityMatrix.get(recommendations[i])?.get(recommendations[j]) || 0;
      totalDissimilarity += 1 - sim;
      pairs++;
    }
  }

  return pairs > 0 ? totalDissimilarity / pairs : 0;
}
```

## 次のステップ

次章では、Embeddings について詳しく学びます。
