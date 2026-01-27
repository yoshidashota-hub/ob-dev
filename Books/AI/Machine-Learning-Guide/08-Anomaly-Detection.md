# 第8章: 異常検知

## 異常検知の概要

```
┌─────────────────────────────────────────────────────────┐
│                  異常検知の種類                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  統計的手法                                      │   │
│  │  • Z-score                                      │   │
│  │  • IQR（四分位範囲）                            │   │
│  │  • グラブス検定                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  機械学習手法                                    │   │
│  │  • Isolation Forest                             │   │
│  │  • One-Class SVM                                │   │
│  │  • Autoencoder                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  時系列異常検知                                  │   │
│  │  • 移動平均                                     │   │
│  │  • 季節性分解                                   │   │
│  │  • LSTM/Transformer                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 統計的手法

### Z-score

```typescript
interface AnomalyResult {
  index: number;
  value: number;
  score: number;
  isAnomaly: boolean;
}

class ZScoreDetector {
  private mean: number = 0;
  private std: number = 1;
  private threshold: number;

  constructor(threshold: number = 3) {
    this.threshold = threshold;
  }

  fit(data: number[]): void {
    const n = data.length;
    this.mean = data.reduce((a, b) => a + b, 0) / n;
    this.std = Math.sqrt(
      data.reduce((sum, x) => sum + Math.pow(x - this.mean, 2), 0) / n,
    );
  }

  detect(data: number[]): AnomalyResult[] {
    return data.map((value, index) => {
      const score = Math.abs((value - this.mean) / this.std);
      return {
        index,
        value,
        score,
        isAnomaly: score > this.threshold,
      };
    });
  }

  fitDetect(data: number[]): AnomalyResult[] {
    this.fit(data);
    return this.detect(data);
  }
}

// 使用例
const detector = new ZScoreDetector(3);
const data = [10, 12, 11, 13, 12, 100, 11, 10, 12, 11]; // 100 が異常値

const results = detector.fitDetect(data);
const anomalies = results.filter((r) => r.isAnomaly);
console.log("異常値:", anomalies);
// [{ index: 5, value: 100, score: 8.5, isAnomaly: true }]
```

### IQR（四分位範囲）

```typescript
class IQRDetector {
  private q1: number = 0;
  private q3: number = 0;
  private iqr: number = 0;
  private lowerBound: number = 0;
  private upperBound: number = 0;
  private multiplier: number;

  constructor(multiplier: number = 1.5) {
    this.multiplier = multiplier;
  }

  fit(data: number[]): void {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;

    this.q1 = sorted[Math.floor(n * 0.25)];
    this.q3 = sorted[Math.floor(n * 0.75)];
    this.iqr = this.q3 - this.q1;

    this.lowerBound = this.q1 - this.multiplier * this.iqr;
    this.upperBound = this.q3 + this.multiplier * this.iqr;
  }

  detect(data: number[]): AnomalyResult[] {
    return data.map((value, index) => {
      const isAnomaly = value < this.lowerBound || value > this.upperBound;
      const score = isAnomaly
        ? Math.abs(value - (value < this.lowerBound ? this.lowerBound : this.upperBound))
        : 0;

      return { index, value, score, isAnomaly };
    });
  }

  getBounds(): { lower: number; upper: number } {
    return { lower: this.lowerBound, upper: this.upperBound };
  }
}
```

### 移動ウィンドウ検知

```typescript
class MovingWindowDetector {
  private windowSize: number;
  private threshold: number;

  constructor(windowSize: number = 10, threshold: number = 2) {
    this.windowSize = windowSize;
    this.threshold = threshold;
  }

  detect(data: number[]): AnomalyResult[] {
    const results: AnomalyResult[] = [];

    for (let i = this.windowSize; i < data.length; i++) {
      const window = data.slice(i - this.windowSize, i);
      const mean = window.reduce((a, b) => a + b, 0) / window.length;
      const std = Math.sqrt(
        window.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / window.length,
      );

      const value = data[i];
      const score = std > 0 ? Math.abs((value - mean) / std) : 0;
      const isAnomaly = score > this.threshold;

      results.push({ index: i, value, score, isAnomaly });
    }

    return results;
  }
}
```

## Isolation Forest

```typescript
interface TreeNode {
  feature?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  size?: number;
}

class IsolationForest {
  private trees: TreeNode[] = [];
  private numTrees: number;
  private sampleSize: number;
  private maxDepth: number;

  constructor(numTrees: number = 100, sampleSize: number = 256) {
    this.numTrees = numTrees;
    this.sampleSize = sampleSize;
    this.maxDepth = Math.ceil(Math.log2(sampleSize));
  }

  fit(data: number[][]): void {
    this.trees = [];

    for (let i = 0; i < this.numTrees; i++) {
      // サブサンプリング
      const sample = this.subsample(data);
      // ツリーを構築
      const tree = this.buildTree(sample, 0);
      this.trees.push(tree);
    }
  }

  private subsample(data: number[][]): number[][] {
    const indices = new Set<number>();
    while (indices.size < Math.min(this.sampleSize, data.length)) {
      indices.add(Math.floor(Math.random() * data.length));
    }
    return [...indices].map((i) => data[i]);
  }

  private buildTree(data: number[][], depth: number): TreeNode {
    // 終了条件
    if (depth >= this.maxDepth || data.length <= 1) {
      return { size: data.length };
    }

    const numFeatures = data[0].length;
    const feature = Math.floor(Math.random() * numFeatures);

    // 特徴量の範囲でランダムな閾値
    const featureValues = data.map((row) => row[feature]);
    const min = Math.min(...featureValues);
    const max = Math.max(...featureValues);

    if (min === max) {
      return { size: data.length };
    }

    const threshold = min + Math.random() * (max - min);

    // データを分割
    const leftData = data.filter((row) => row[feature] < threshold);
    const rightData = data.filter((row) => row[feature] >= threshold);

    return {
      feature,
      threshold,
      left: this.buildTree(leftData, depth + 1),
      right: this.buildTree(rightData, depth + 1),
    };
  }

  private pathLength(point: number[], tree: TreeNode, depth: number = 0): number {
    if (tree.size !== undefined) {
      // リーフノード
      return depth + this.c(tree.size);
    }

    if (point[tree.feature!] < tree.threshold!) {
      return this.pathLength(point, tree.left!, depth + 1);
    } else {
      return this.pathLength(point, tree.right!, depth + 1);
    }
  }

  // 正規化係数
  private c(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n;
  }

  // 異常スコアを計算
  score(point: number[]): number {
    const avgPathLength =
      this.trees.reduce((sum, tree) => sum + this.pathLength(point, tree), 0) /
      this.trees.length;

    return Math.pow(2, -avgPathLength / this.c(this.sampleSize));
  }

  // 異常を検出
  detect(data: number[][], threshold: number = 0.5): AnomalyResult[] {
    return data.map((point, index) => {
      const scoreValue = this.score(point);
      return {
        index,
        value: point[0], // 代表値として最初の特徴量
        score: scoreValue,
        isAnomaly: scoreValue > threshold,
      };
    });
  }
}

// 使用例
const data = [
  [1, 2],
  [1.5, 1.8],
  [5, 8], // 異常値
  [1.2, 2.1],
  [1.1, 1.9],
  [6, 9], // 異常値
  [1.3, 2.0],
];

const iforest = new IsolationForest(100, 256);
iforest.fit(data);

const results = iforest.detect(data);
console.log(results.filter((r) => r.isAnomaly));
```

## Autoencoder による異常検知

```typescript
import * as tf from "@tensorflow/tfjs";

class AnomalyAutoencoder {
  private encoder: tf.LayersModel | null = null;
  private decoder: tf.LayersModel | null = null;
  private autoencoder: tf.LayersModel | null = null;
  private threshold: number = 0;

  async build(inputDim: number, encodingDim: number = 32): Promise<void> {
    // エンコーダー
    const encoderInput = tf.input({ shape: [inputDim] });
    let x = tf.layers
      .dense({ units: 64, activation: "relu" })
      .apply(encoderInput);
    x = tf.layers.dense({ units: encodingDim, activation: "relu" }).apply(x);
    this.encoder = tf.model({ inputs: encoderInput, outputs: x as tf.SymbolicTensor });

    // デコーダー
    const decoderInput = tf.input({ shape: [encodingDim] });
    let y = tf.layers
      .dense({ units: 64, activation: "relu" })
      .apply(decoderInput);
    y = tf.layers.dense({ units: inputDim, activation: "sigmoid" }).apply(y);
    this.decoder = tf.model({ inputs: decoderInput, outputs: y as tf.SymbolicTensor });

    // オートエンコーダー（結合）
    const autoInput = tf.input({ shape: [inputDim] });
    const encoded = this.encoder.apply(autoInput);
    const decoded = this.decoder.apply(encoded);
    this.autoencoder = tf.model({
      inputs: autoInput,
      outputs: decoded as tf.SymbolicTensor,
    });

    this.autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
    });
  }

  async train(
    data: number[][],
    epochs: number = 100,
    validationSplit: number = 0.1,
  ): Promise<void> {
    const tensor = tf.tensor2d(data);

    await this.autoencoder!.fit(tensor, tensor, {
      epochs,
      validationSplit,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(6)}`);
          }
        },
      },
    });

    // 閾値を計算（訓練データの再構成誤差の平均 + 標準偏差）
    const reconstructed = this.autoencoder!.predict(tensor) as tf.Tensor;
    const errors = tensor.sub(reconstructed).square().mean(1);
    const errorValues = await errors.data();

    const mean = errorValues.reduce((a, b) => a + b, 0) / errorValues.length;
    const std = Math.sqrt(
      errorValues.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) /
        errorValues.length,
    );

    this.threshold = mean + 2 * std;

    tensor.dispose();
    reconstructed.dispose();
    errors.dispose();
  }

  detect(data: number[][]): AnomalyResult[] {
    return tf.tidy(() => {
      const tensor = tf.tensor2d(data);
      const reconstructed = this.autoencoder!.predict(tensor) as tf.Tensor;
      const errors = tensor.sub(reconstructed).square().mean(1);
      const errorValues = errors.dataSync();

      return data.map((_, index) => ({
        index,
        value: data[index][0],
        score: errorValues[index],
        isAnomaly: errorValues[index] > this.threshold,
      }));
    });
  }

  // 異常スコアの可視化用
  getReconstructionError(point: number[]): number {
    return tf.tidy(() => {
      const tensor = tf.tensor2d([point]);
      const reconstructed = this.autoencoder!.predict(tensor) as tf.Tensor;
      const error = tensor.sub(reconstructed).square().mean();
      return error.dataSync()[0];
    });
  }
}
```

## 時系列異常検知

```typescript
class TimeSeriesAnomalyDetector {
  private baselineValues: number[] = [];
  private seasonalPattern: number[] = [];
  private trendCoefficients: { slope: number; intercept: number } | null = null;

  // 季節性分解
  decomposeSeasonality(data: number[], period: number): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    // 移動平均でトレンドを抽出
    const trend: number[] = [];
    const halfPeriod = Math.floor(period / 2);

    for (let i = 0; i < data.length; i++) {
      if (i < halfPeriod || i >= data.length - halfPeriod) {
        trend.push(NaN);
      } else {
        const window = data.slice(i - halfPeriod, i + halfPeriod + 1);
        trend.push(window.reduce((a, b) => a + b) / window.length);
      }
    }

    // 季節性を計算
    const detrended = data.map((val, i) => val - (trend[i] || val));
    const seasonal: number[] = new Array(data.length);

    for (let i = 0; i < period; i++) {
      const seasonalValues: number[] = [];
      for (let j = i; j < data.length; j += period) {
        if (!isNaN(detrended[j])) {
          seasonalValues.push(detrended[j]);
        }
      }
      const avgSeasonal =
        seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length;

      for (let j = i; j < data.length; j += period) {
        seasonal[j] = avgSeasonal;
      }
    }

    // 残差
    const residual = data.map(
      (val, i) => val - (trend[i] || 0) - (seasonal[i] || 0),
    );

    this.seasonalPattern = seasonal.slice(0, period);

    return { trend, seasonal, residual };
  }

  // 異常検知
  detectAnomalies(
    data: number[],
    period: number,
    threshold: number = 2,
  ): AnomalyResult[] {
    const { residual } = this.decomposeSeasonality(data, period);

    // 残差の統計量
    const validResiduals = residual.filter((r) => !isNaN(r));
    const mean = validResiduals.reduce((a, b) => a + b, 0) / validResiduals.length;
    const std = Math.sqrt(
      validResiduals.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
        validResiduals.length,
    );

    return data.map((value, index) => {
      const score = !isNaN(residual[index])
        ? Math.abs((residual[index] - mean) / std)
        : 0;

      return {
        index,
        value,
        score,
        isAnomaly: score > threshold,
      };
    });
  }

  // 予測による異常検知
  detectWithPrediction(
    data: number[],
    lookback: number = 10,
    threshold: number = 2,
  ): AnomalyResult[] {
    const results: AnomalyResult[] = [];

    for (let i = lookback; i < data.length; i++) {
      const history = data.slice(i - lookback, i);
      const predicted = this.simplePredict(history);
      const actual = data[i];
      const error = Math.abs(actual - predicted);

      // 履歴からの標準偏差
      const mean = history.reduce((a, b) => a + b, 0) / history.length;
      const std = Math.sqrt(
        history.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / history.length,
      );

      const score = std > 0 ? error / std : 0;

      results.push({
        index: i,
        value: actual,
        score,
        isAnomaly: score > threshold,
      });
    }

    return results;
  }

  private simplePredict(history: number[]): number {
    // 単純な線形予測
    const n = history.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = (n - 1) / 2;
    const yMean = history.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (history[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    return slope * n + intercept;
  }
}

// 使用例
const detector = new TimeSeriesAnomalyDetector();
const timeSeriesData = [
  10, 12, 11, 13, 12, 11, 10, 12, 100, // 異常
  11, 13, 12, 11, 10, 12, 11, 13, 12,
];

const results = detector.detectWithPrediction(timeSeriesData);
console.log(
  "異常:",
  results.filter((r) => r.isAnomaly),
);
```

## 実践: 不正検知システム

```typescript
interface Transaction {
  id: string;
  userId: string;
  amount: number;
  timestamp: Date;
  merchantCategory: string;
  location: string;
}

class FraudDetectionSystem {
  private userProfiles: Map<string, UserProfile> = new Map();
  private iforest: IsolationForest;
  private autoencoder: AnomalyAutoencoder;

  constructor() {
    this.iforest = new IsolationForest();
    this.autoencoder = new AnomalyAutoencoder();
  }

  // ユーザープロファイルを構築
  buildUserProfile(transactions: Transaction[], userId: string): UserProfile {
    const userTxns = transactions.filter((t) => t.userId === userId);

    const amounts = userTxns.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdAmount = Math.sqrt(
      amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / amounts.length,
    );

    // 時間帯パターン
    const hourCounts = new Array(24).fill(0);
    userTxns.forEach((t) => {
      hourCounts[t.timestamp.getHours()]++;
    });

    // 加盟店カテゴリパターン
    const categoryFreq = new Map<string, number>();
    userTxns.forEach((t) => {
      categoryFreq.set(t.merchantCategory, (categoryFreq.get(t.merchantCategory) || 0) + 1);
    });

    return {
      userId,
      avgAmount,
      stdAmount,
      hourPattern: hourCounts.map((c) => c / userTxns.length),
      categoryPattern: categoryFreq,
      recentLocations: [...new Set(userTxns.slice(-10).map((t) => t.location))],
    };
  }

  // 取引をベクトル化
  transactionToVector(txn: Transaction, profile: UserProfile): number[] {
    const hourOfDay = txn.timestamp.getHours();
    const dayOfWeek = txn.timestamp.getDay();
    const amountZScore = (txn.amount - profile.avgAmount) / (profile.stdAmount || 1);
    const hourAbnormality = 1 - profile.hourPattern[hourOfDay];
    const isNewLocation = profile.recentLocations.includes(txn.location) ? 0 : 1;
    const categoryFreq =
      (profile.categoryPattern.get(txn.merchantCategory) || 0) /
      (profile.categoryPattern.size || 1);

    return [
      amountZScore,
      hourAbnormality,
      isNewLocation,
      1 - categoryFreq,
      hourOfDay / 24,
      dayOfWeek / 7,
    ];
  }

  // 不正スコアを計算
  async calculateFraudScore(
    txn: Transaction,
    profile: UserProfile,
  ): Promise<{ score: number; reasons: string[] }> {
    const vector = this.transactionToVector(txn, profile);
    const reasons: string[] = [];

    // ルールベースチェック
    let ruleScore = 0;

    // 高額取引チェック
    if (txn.amount > profile.avgAmount + 3 * profile.stdAmount) {
      ruleScore += 0.3;
      reasons.push(`異常な金額: ${txn.amount}`);
    }

    // 深夜取引チェック
    const hour = txn.timestamp.getHours();
    if (hour >= 1 && hour <= 5) {
      ruleScore += 0.2;
      reasons.push(`深夜の取引: ${hour}時`);
    }

    // 新規地域チェック
    if (!profile.recentLocations.includes(txn.location)) {
      ruleScore += 0.2;
      reasons.push(`新しい場所: ${txn.location}`);
    }

    // ML スコア（Isolation Forest）
    const iforestScore = this.iforest.score(vector);
    if (iforestScore > 0.6) {
      reasons.push("パターン異常を検出");
    }

    // 総合スコア
    const totalScore = Math.min(1, ruleScore * 0.4 + iforestScore * 0.6);

    return { score: totalScore, reasons };
  }

  // リアルタイム検知
  async detectFraud(txn: Transaction): Promise<{
    isFraud: boolean;
    score: number;
    reasons: string[];
    action: "approve" | "review" | "block";
  }> {
    let profile = this.userProfiles.get(txn.userId);

    if (!profile) {
      // 新規ユーザーは慎重に
      return {
        isFraud: false,
        score: 0.5,
        reasons: ["新規ユーザー"],
        action: "review",
      };
    }

    const { score, reasons } = await this.calculateFraudScore(txn, profile);

    let action: "approve" | "review" | "block";
    if (score < 0.3) {
      action = "approve";
    } else if (score < 0.7) {
      action = "review";
    } else {
      action = "block";
    }

    return {
      isFraud: score > 0.7,
      score,
      reasons,
      action,
    };
  }
}

interface UserProfile {
  userId: string;
  avgAmount: number;
  stdAmount: number;
  hourPattern: number[];
  categoryPattern: Map<string, number>;
  recentLocations: string[];
}
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│           異常検知のベストプラクティス                     │
│                                                         │
│  1. 手法の選択                                           │
│     • 単変量: Z-score, IQR                             │
│     • 多変量: Isolation Forest, Autoencoder            │
│     • 時系列: 季節性分解, LSTM                          │
│                                                         │
│  2. 閾値の設定                                           │
│     • ビジネス要件に基づいて調整                         │
│     • 偽陽性と偽陰性のトレードオフを考慮                  │
│     • 動的に閾値を調整                                  │
│                                                         │
│  3. 評価                                                 │
│     • Precision, Recall, F1                            │
│     • 異常データは少ないため、AUC-ROC も重要            │
│     • 実際のビジネスコストを考慮                         │
│                                                         │
│  4. 運用                                                 │
│     • リアルタイム検知とバッチ検知を組み合わせ           │
│     • フィードバックループで改善                         │
│     • 説明可能性を確保                                  │
└─────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、Hugging Face の事前学習モデルについて学びます。
