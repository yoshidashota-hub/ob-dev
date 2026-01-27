# 第1章: 基本概念

## 教師あり学習（Supervised Learning）

データとその正解（ラベル）のペアから学習する手法です。

```
┌─────────────────────────────────────────────────────────┐
│               教師あり学習の流れ                          │
│                                                         │
│  入力データ (X)          正解ラベル (y)                  │
│  ┌─────────────┐        ┌─────────────┐                │
│  │ [特徴量1]   │        │ [ラベル1]   │                │
│  │ [特徴量2]   │   →    │ [ラベル2]   │   → モデル学習  │
│  │ [特徴量3]   │        │ [ラベル3]   │                │
│  └─────────────┘        └─────────────┘                │
│                                                         │
│  学習済みモデル                                          │
│  ┌─────────────┐        ┌─────────────┐                │
│  │ 新しいデータ │   →    │ 予測結果    │                │
│  └─────────────┘        └─────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### 分類（Classification）

離散的なカテゴリを予測します。

```typescript
// 例: スパムメール判定
interface EmailData {
  subject: string;
  body: string;
  senderDomain: string;
}

type Label = "spam" | "not_spam";

// 学習データ
const trainingData: Array<{ email: EmailData; label: Label }> = [
  {
    email: {
      subject: "お金を稼ぐ方法",
      body: "...",
      senderDomain: "unknown.com",
    },
    label: "spam",
  },
  {
    email: {
      subject: "会議のお知らせ",
      body: "...",
      senderDomain: "company.com",
    },
    label: "not_spam",
  },
];
```

### 回帰（Regression）

連続的な値を予測します。

```typescript
// 例: 住宅価格予測
interface HouseFeatures {
  area: number; // 面積 (m²)
  rooms: number; // 部屋数
  age: number; // 築年数
  distance: number; // 駅からの距離 (km)
}

// 学習データ
const trainingData: Array<{ features: HouseFeatures; price: number }> = [
  { features: { area: 80, rooms: 3, age: 5, distance: 0.5 }, price: 45000000 },
  {
    features: { area: 120, rooms: 4, age: 10, distance: 1.0 },
    price: 55000000,
  },
];

// 予測: 特徴量 → 価格（連続値）
```

## 教師なし学習（Unsupervised Learning）

正解ラベルなしでデータの構造やパターンを発見する手法です。

```
┌─────────────────────────────────────────────────────────┐
│               教師なし学習の流れ                          │
│                                                         │
│  入力データ (X) のみ                                     │
│  ┌─────────────┐                                        │
│  │ [データ1]   │                                        │
│  │ [データ2]   │   →   パターン発見                     │
│  │ [データ3]   │                                        │
│  │ [データ4]   │                                        │
│  └─────────────┘                                        │
│                                                         │
│  結果:                                                   │
│  • クラスタ（グループ）                                  │
│  • 次元削減された表現                                    │
│  • 異常値の検出                                          │
└─────────────────────────────────────────────────────────┘
```

### クラスタリング（Clustering）

類似したデータをグループ化します。

```typescript
// 例: 顧客セグメンテーション
interface Customer {
  totalPurchases: number; // 購入総額
  frequency: number; // 購入頻度
  recency: number; // 最終購入からの日数
}

const customers: Customer[] = [
  { totalPurchases: 100000, frequency: 20, recency: 5 },
  { totalPurchases: 5000, frequency: 2, recency: 90 },
  { totalPurchases: 50000, frequency: 10, recency: 15 },
  // ...
];

// K-means クラスタリング結果
// クラスタ1: VIP顧客（高額・高頻度）
// クラスタ2: 休眠顧客（低頻度・古い）
// クラスタ3: 一般顧客（中程度）
```

### 次元削減（Dimensionality Reduction）

高次元データを低次元に圧縮します。

```typescript
// 例: 商品の特徴を2次元に圧縮して可視化
interface Product {
  price: number;
  weight: number;
  size: number;
  rating: number;
  reviews: number;
  // ... 100個の特徴
}

// PCA で 2次元に圧縮
// 元: [price, weight, size, rating, reviews, ...]
// 圧縮後: [component1, component2]
// → 散布図で可視化可能に
```

## 損失関数（Loss Function）

モデルの予測と正解の差を数値化します。

```typescript
// 分類: クロスエントロピー損失
function crossEntropyLoss(predicted: number[], actual: number[]): number {
  return -actual.reduce((sum, y, i) => {
    return sum + y * Math.log(predicted[i] + 1e-15);
  }, 0);
}

// 回帰: 平均二乗誤差（MSE）
function meanSquaredError(predicted: number[], actual: number[]): number {
  const n = predicted.length;
  return (
    predicted.reduce((sum, p, i) => {
      return sum + Math.pow(p - actual[i], 2);
    }, 0) / n
  );
}

// 例
const predictions = [0.9, 0.1]; // スパム確率 90%, 非スパム 10%
const actual = [1, 0]; // 正解: スパム
console.log(crossEntropyLoss(predictions, actual)); // 低い値 = 良い予測
```

## 勾配降下法（Gradient Descent）

損失を最小化するためにパラメータを更新します。

```typescript
// 単純な勾配降下法
class LinearRegression {
  private weight: number = 0;
  private bias: number = 0;
  private learningRate: number = 0.01;

  // 予測
  predict(x: number): number {
    return this.weight * x + this.bias;
  }

  // 学習（1ステップ）
  trainStep(x: number[], y: number[]): number {
    const n = x.length;
    let weightGradient = 0;
    let biasGradient = 0;
    let totalLoss = 0;

    // 各データポイントで勾配を計算
    for (let i = 0; i < n; i++) {
      const prediction = this.predict(x[i]);
      const error = prediction - y[i];
      totalLoss += error * error;

      weightGradient += (2 / n) * error * x[i];
      biasGradient += (2 / n) * error;
    }

    // パラメータ更新
    this.weight -= this.learningRate * weightGradient;
    this.bias -= this.learningRate * biasGradient;

    return totalLoss / n;
  }

  // 複数エポック学習
  train(x: number[], y: number[], epochs: number = 1000): void {
    for (let epoch = 0; epoch < epochs; epoch++) {
      const loss = this.trainStep(x, y);
      if (epoch % 100 === 0) {
        console.log(`Epoch ${epoch}, Loss: ${loss.toFixed(4)}`);
      }
    }
  }
}
```

## 過学習と汎化

```
┌─────────────────────────────────────────────────────────┐
│                    過学習 vs 汎化                        │
│                                                         │
│  未学習         適切          過学習                     │
│  (Underfitting) (Good Fit)   (Overfitting)              │
│                                                         │
│    /\           /\  /\         /\/\/\                   │
│   /  \         /  \/  \       /      \                  │
│  /    \       /        \     /        \/\               │
│                                                         │
│  • モデルが単純     • 適度な複雑さ   • モデルが複雑      │
│  • 訓練誤差: 高     • 訓練誤差: 低   • 訓練誤差: 非常に低 │
│  • テスト誤差: 高   • テスト誤差: 低 • テスト誤差: 高     │
└─────────────────────────────────────────────────────────┘
```

### データ分割

```typescript
// 訓練/検証/テスト分割
interface DataSplit<T> {
  train: T[];
  validation: T[];
  test: T[];
}

function splitData<T>(data: T[], seed?: number): DataSplit<T> {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const n = shuffled.length;

  return {
    train: shuffled.slice(0, Math.floor(n * 0.7)), // 70%
    validation: shuffled.slice(Math.floor(n * 0.7), Math.floor(n * 0.85)), // 15%
    test: shuffled.slice(Math.floor(n * 0.85)), // 15%
  };
}

// 使用例
const { train, validation, test } = splitData(allData);

// 訓練データで学習
model.train(train);

// 検証データでハイパーパラメータ調整
const validationScore = model.evaluate(validation);

// テストデータで最終評価（1回のみ）
const testScore = model.evaluate(test);
```

### 正則化

```typescript
// L2 正則化（Ridge）
function l2RegularizedLoss(
  predictions: number[],
  actual: number[],
  weights: number[],
  lambda: number = 0.01,
): number {
  const baseLoss = meanSquaredError(predictions, actual);
  const l2Penalty = weights.reduce((sum, w) => sum + w * w, 0);
  return baseLoss + lambda * l2Penalty;
}

// Dropout（ニューラルネットワーク）
function dropout(values: number[], rate: number = 0.5): number[] {
  return values.map((v) => (Math.random() > rate ? v / (1 - rate) : 0));
}
```

## 評価指標

### 分類の評価指標

```typescript
interface ClassificationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

function calculateMetrics(
  predictions: boolean[],
  actual: boolean[],
): ClassificationMetrics {
  let tp = 0,
    tn = 0,
    fp = 0,
    fn = 0;

  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i] && actual[i]) tp++;
    else if (!predictions[i] && !actual[i]) tn++;
    else if (predictions[i] && !actual[i]) fp++;
    else fn++;
  }

  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1Score = (2 * precision * recall) / (precision + recall) || 0;

  return { accuracy, precision, recall, f1Score };
}

// 混同行列
console.log(`
              予測
           Pos    Neg
実際 Pos  [ TP    FN  ]
     Neg  [ FP    TN  ]
`);
```

### 回帰の評価指標

```typescript
interface RegressionMetrics {
  mse: number; // 平均二乗誤差
  rmse: number; // 二乗平均平方根誤差
  mae: number; // 平均絶対誤差
  r2: number; // 決定係数
}

function calculateRegressionMetrics(
  predictions: number[],
  actual: number[],
): RegressionMetrics {
  const n = predictions.length;

  // MSE
  const mse =
    predictions.reduce((sum, p, i) => sum + Math.pow(p - actual[i], 2), 0) / n;

  // RMSE
  const rmse = Math.sqrt(mse);

  // MAE
  const mae =
    predictions.reduce((sum, p, i) => sum + Math.abs(p - actual[i]), 0) / n;

  // R² (決定係数)
  const actualMean = actual.reduce((a, b) => a + b, 0) / n;
  const ssRes = predictions.reduce(
    (sum, p, i) => sum + Math.pow(actual[i] - p, 2),
    0,
  );
  const ssTot = actual.reduce((sum, a) => sum + Math.pow(a - actualMean, 2), 0);
  const r2 = 1 - ssRes / ssTot;

  return { mse, rmse, mae, r2 };
}
```

## 交差検証

```typescript
// K-Fold 交差検証
function kFoldCrossValidation<T>(
  data: T[],
  k: number,
  trainFn: (train: T[]) => any,
  evaluateFn: (model: any, test: T[]) => number,
): number[] {
  const foldSize = Math.floor(data.length / k);
  const scores: number[] = [];

  for (let i = 0; i < k; i++) {
    const testStart = i * foldSize;
    const testEnd = testStart + foldSize;

    const testData = data.slice(testStart, testEnd);
    const trainData = [...data.slice(0, testStart), ...data.slice(testEnd)];

    const model = trainFn(trainData);
    const score = evaluateFn(model, testData);
    scores.push(score);
  }

  return scores;
}

// 使用例
const scores = kFoldCrossValidation(
  allData,
  5, // 5-Fold
  (train) => trainModel(train),
  (model, test) => evaluateModel(model, test),
);

console.log(`平均スコア: ${scores.reduce((a, b) => a + b) / scores.length}`);
console.log(`標準偏差: ${standardDeviation(scores)}`);
```

## まとめ

| 項目       | 教師あり学習               | 教師なし学習       |
| ---------- | -------------------------- | ------------------ |
| 入力       | データ + ラベル            | データのみ         |
| 目的       | 予測・分類                 | パターン発見       |
| 評価       | 正解との比較               | 内部指標           |
| 例         | スパム検出、価格予測       | 顧客セグメント     |
| 代表的手法 | 線形回帰、決定木、SVM、CNN | K-means、PCA、UMAP |

## 次のステップ

次章では、データの前処理と特徴量エンジニアリングについて学びます。
