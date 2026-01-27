# 第2章: データ準備

## データ準備の流れ

```
┌─────────────────────────────────────────────────────────┐
│                  データ準備パイプライン                    │
│                                                         │
│  1. データ収集                                           │
│     ↓                                                   │
│  2. 探索的データ分析 (EDA)                               │
│     ↓                                                   │
│  3. データクリーニング                                    │
│     ↓                                                   │
│  4. 特徴量エンジニアリング                                │
│     ↓                                                   │
│  5. データ変換（正規化・エンコード）                       │
│     ↓                                                   │
│  6. データ分割                                           │
└─────────────────────────────────────────────────────────┘
```

## 探索的データ分析（EDA）

### 基本統計量

```typescript
interface Statistics {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
}

function calculateStatistics(values: number[]): Statistics {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);

  return {
    count: n,
    mean,
    std,
    min: sorted[0],
    max: sorted[n - 1],
    median,
    q1: sorted[q1Index],
    q3: sorted[q3Index],
  };
}

// 使用例
const ages = [25, 30, 35, 40, 45, 50, 55, 60];
console.log(calculateStatistics(ages));
// { count: 8, mean: 42.5, std: 11.18, min: 25, max: 60, ... }
```

### 欠損値の確認

```typescript
interface MissingValueReport {
  column: string;
  missingCount: number;
  missingPercentage: number;
}

function analyzeMissingValues<T extends Record<string, any>>(
  data: T[],
): MissingValueReport[] {
  if (data.length === 0) return [];

  const columns = Object.keys(data[0]);
  const n = data.length;

  return columns.map((column) => {
    const missingCount = data.filter(
      (row) =>
        row[column] === null || row[column] === undefined || row[column] === "",
    ).length;

    return {
      column,
      missingCount,
      missingPercentage: (missingCount / n) * 100,
    };
  });
}

// 使用例
const userData = [
  { name: "Alice", age: 30, email: "alice@example.com" },
  { name: "Bob", age: null, email: "bob@example.com" },
  { name: "Charlie", age: 25, email: null },
];

console.log(analyzeMissingValues(userData));
// [
//   { column: 'name', missingCount: 0, missingPercentage: 0 },
//   { column: 'age', missingCount: 1, missingPercentage: 33.33 },
//   { column: 'email', missingCount: 1, missingPercentage: 33.33 }
// ]
```

## データクリーニング

### 欠損値の処理

```typescript
type ImputationStrategy = "mean" | "median" | "mode" | "constant" | "drop";

interface ImputationConfig {
  strategy: ImputationStrategy;
  constantValue?: any;
}

class MissingValueImputer {
  private strategy: ImputationStrategy;
  private constantValue: any;
  private computedValues: Map<string, any> = new Map();

  constructor(config: ImputationConfig) {
    this.strategy = config.strategy;
    this.constantValue = config.constantValue;
  }

  // 訓練データから統計量を計算
  fit(data: Record<string, any>[], columns: string[]): void {
    for (const col of columns) {
      const values = data
        .map((row) => row[col])
        .filter((v) => v !== null && v !== undefined);

      switch (this.strategy) {
        case "mean":
          this.computedValues.set(
            col,
            values.reduce((a, b) => a + b, 0) / values.length,
          );
          break;
        case "median":
          const sorted = [...values].sort((a, b) => a - b);
          this.computedValues.set(col, sorted[Math.floor(sorted.length / 2)]);
          break;
        case "mode":
          const counts = new Map<any, number>();
          values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
          const mode = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
          this.computedValues.set(col, mode);
          break;
      }
    }
  }

  // 欠損値を補完
  transform(
    data: Record<string, any>[],
    columns: string[],
  ): Record<string, any>[] {
    if (this.strategy === "drop") {
      return data.filter((row) =>
        columns.every((col) => row[col] !== null && row[col] !== undefined),
      );
    }

    return data.map((row) => {
      const newRow = { ...row };
      for (const col of columns) {
        if (newRow[col] === null || newRow[col] === undefined) {
          newRow[col] =
            this.strategy === "constant"
              ? this.constantValue
              : this.computedValues.get(col);
        }
      }
      return newRow;
    });
  }
}

// 使用例
const imputer = new MissingValueImputer({ strategy: "mean" });
imputer.fit(trainingData, ["age", "income"]);
const cleanedData = imputer.transform(trainingData, ["age", "income"]);
```

### 外れ値の検出と処理

```typescript
interface OutlierConfig {
  method: "iqr" | "zscore";
  threshold?: number; // Z-score の場合のしきい値（デフォルト: 3）
}

class OutlierDetector {
  private method: string;
  private threshold: number;
  private bounds: Map<string, { lower: number; upper: number }> = new Map();

  constructor(config: OutlierConfig) {
    this.method = config.method;
    this.threshold = config.threshold || 3;
  }

  fit(data: Record<string, number>[], columns: string[]): void {
    for (const col of columns) {
      const values = data.map((row) => row[col]).filter((v) => v != null);
      const sorted = [...values].sort((a, b) => a - b);

      if (this.method === "iqr") {
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        this.bounds.set(col, {
          lower: q1 - 1.5 * iqr,
          upper: q3 + 1.5 * iqr,
        });
      } else {
        // Z-score
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(
          values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
            values.length,
        );
        this.bounds.set(col, {
          lower: mean - this.threshold * std,
          upper: mean + this.threshold * std,
        });
      }
    }
  }

  // 外れ値をクリップ
  clip(
    data: Record<string, number>[],
    columns: string[],
  ): Record<string, number>[] {
    return data.map((row) => {
      const newRow = { ...row };
      for (const col of columns) {
        const bounds = this.bounds.get(col);
        if (bounds) {
          newRow[col] = Math.max(
            bounds.lower,
            Math.min(bounds.upper, row[col]),
          );
        }
      }
      return newRow;
    });
  }

  // 外れ値を検出
  detect(data: Record<string, number>[], columns: string[]): boolean[] {
    return data.map((row) => {
      return columns.some((col) => {
        const bounds = this.bounds.get(col);
        return bounds && (row[col] < bounds.lower || row[col] > bounds.upper);
      });
    });
  }
}
```

## 特徴量エンジニアリング

### カテゴリ変数のエンコーディング

```typescript
// One-Hot エンコーディング
class OneHotEncoder {
  private categories: Map<string, string[]> = new Map();

  fit(data: Record<string, string>[], columns: string[]): void {
    for (const col of columns) {
      const uniqueValues = [...new Set(data.map((row) => row[col]))];
      this.categories.set(col, uniqueValues);
    }
  }

  transform(
    data: Record<string, any>[],
    columns: string[],
  ): Record<string, any>[] {
    return data.map((row) => {
      const newRow: Record<string, any> = { ...row };

      for (const col of columns) {
        const categories = this.categories.get(col) || [];
        delete newRow[col];

        for (const cat of categories) {
          newRow[`${col}_${cat}`] = row[col] === cat ? 1 : 0;
        }
      }

      return newRow;
    });
  }
}

// Label エンコーディング
class LabelEncoder {
  private mappings: Map<string, Map<string, number>> = new Map();

  fit(data: Record<string, string>[], columns: string[]): void {
    for (const col of columns) {
      const uniqueValues = [...new Set(data.map((row) => row[col]))];
      const mapping = new Map<string, number>();
      uniqueValues.forEach((val, idx) => mapping.set(val, idx));
      this.mappings.set(col, mapping);
    }
  }

  transform(
    data: Record<string, any>[],
    columns: string[],
  ): Record<string, any>[] {
    return data.map((row) => {
      const newRow = { ...row };
      for (const col of columns) {
        const mapping = this.mappings.get(col);
        if (mapping) {
          newRow[col] = mapping.get(row[col]) ?? -1;
        }
      }
      return newRow;
    });
  }
}

// 使用例
const data = [
  { color: "red", size: "S" },
  { color: "blue", size: "M" },
  { color: "green", size: "L" },
];

const encoder = new OneHotEncoder();
encoder.fit(data, ["color", "size"]);
const encoded = encoder.transform(data, ["color", "size"]);
// [
//   { color_red: 1, color_blue: 0, color_green: 0, size_S: 1, size_M: 0, size_L: 0 },
//   ...
// ]
```

### 数値特徴量の変換

```typescript
// 正規化（Min-Max スケーリング）
class MinMaxScaler {
  private mins: Map<string, number> = new Map();
  private maxs: Map<string, number> = new Map();

  fit(data: Record<string, number>[], columns: string[]): void {
    for (const col of columns) {
      const values = data.map((row) => row[col]);
      this.mins.set(col, Math.min(...values));
      this.maxs.set(col, Math.max(...values));
    }
  }

  transform(
    data: Record<string, number>[],
    columns: string[],
  ): Record<string, number>[] {
    return data.map((row) => {
      const newRow = { ...row };
      for (const col of columns) {
        const min = this.mins.get(col) || 0;
        const max = this.maxs.get(col) || 1;
        newRow[col] = (row[col] - min) / (max - min);
      }
      return newRow;
    });
  }

  inverseTransform(
    data: Record<string, number>[],
    columns: string[],
  ): Record<string, number>[] {
    return data.map((row) => {
      const newRow = { ...row };
      for (const col of columns) {
        const min = this.mins.get(col) || 0;
        const max = this.maxs.get(col) || 1;
        newRow[col] = row[col] * (max - min) + min;
      }
      return newRow;
    });
  }
}

// 標準化（Z-score）
class StandardScaler {
  private means: Map<string, number> = new Map();
  private stds: Map<string, number> = new Map();

  fit(data: Record<string, number>[], columns: string[]): void {
    for (const col of columns) {
      const values = data.map((row) => row[col]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
          values.length,
      );
      this.means.set(col, mean);
      this.stds.set(col, std || 1);
    }
  }

  transform(
    data: Record<string, number>[],
    columns: string[],
  ): Record<string, number>[] {
    return data.map((row) => {
      const newRow = { ...row };
      for (const col of columns) {
        const mean = this.means.get(col) || 0;
        const std = this.stds.get(col) || 1;
        newRow[col] = (row[col] - mean) / std;
      }
      return newRow;
    });
  }
}
```

### 特徴量の作成

```typescript
// 日時特徴量
function extractDateFeatures(date: Date): Record<string, number> {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    dayOfWeek: date.getDay(),
    hour: date.getHours(),
    isWeekend: date.getDay() === 0 || date.getDay() === 6 ? 1 : 0,
    quarter: Math.floor(date.getMonth() / 3) + 1,
    // 周期性をエンコード（sin/cos）
    monthSin: Math.sin((2 * Math.PI * (date.getMonth() + 1)) / 12),
    monthCos: Math.cos((2 * Math.PI * (date.getMonth() + 1)) / 12),
    hourSin: Math.sin((2 * Math.PI * date.getHours()) / 24),
    hourCos: Math.cos((2 * Math.PI * date.getHours()) / 24),
  };
}

// テキスト特徴量
function extractTextFeatures(text: string): Record<string, number> {
  const words = text.toLowerCase().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

  return {
    charCount: text.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgWordLength: words.reduce((sum, w) => sum + w.length, 0) / words.length,
    avgSentenceLength: words.length / (sentences.length || 1),
    uniqueWordRatio: new Set(words).size / words.length,
    exclamationCount: (text.match(/!/g) || []).length,
    questionCount: (text.match(/\?/g) || []).length,
  };
}

// 数値特徴量の組み合わせ
function createInteractionFeatures(
  row: Record<string, number>,
  pairs: [string, string][],
): Record<string, number> {
  const features: Record<string, number> = {};

  for (const [col1, col2] of pairs) {
    features[`${col1}_x_${col2}`] = row[col1] * row[col2];
    features[`${col1}_div_${col2}`] =
      row[col2] !== 0 ? row[col1] / row[col2] : 0;
    features[`${col1}_plus_${col2}`] = row[col1] + row[col2];
  }

  return features;
}
```

## データパイプライン

```typescript
// 前処理パイプライン
interface PipelineStep {
  name: string;
  fit?: (data: any[]) => void;
  transform: (data: any[]) => any[];
}

class DataPipeline {
  private steps: PipelineStep[] = [];

  addStep(step: PipelineStep): this {
    this.steps.push(step);
    return this;
  }

  fit(data: any[]): void {
    let currentData = data;
    for (const step of this.steps) {
      if (step.fit) {
        step.fit(currentData);
      }
      currentData = step.transform(currentData);
    }
  }

  transform(data: any[]): any[] {
    let currentData = data;
    for (const step of this.steps) {
      currentData = step.transform(currentData);
    }
    return currentData;
  }

  fitTransform(data: any[]): any[] {
    this.fit(data);
    return this.transform(data);
  }
}

// 使用例
const pipeline = new DataPipeline()
  .addStep({
    name: "impute_missing",
    fit: (data) => imputer.fit(data, ["age", "income"]),
    transform: (data) => imputer.transform(data, ["age", "income"]),
  })
  .addStep({
    name: "encode_categories",
    fit: (data) => encoder.fit(data, ["category"]),
    transform: (data) => encoder.transform(data, ["category"]),
  })
  .addStep({
    name: "scale_features",
    fit: (data) => scaler.fit(data, ["age", "income"]),
    transform: (data) => scaler.transform(data, ["age", "income"]),
  });

// 訓練データで学習
const processedTrain = pipeline.fitTransform(trainData);

// テストデータを変換（学習済みパラメータを使用）
const processedTest = pipeline.transform(testData);
```

## TensorFlow.js でのデータ処理

```typescript
import * as tf from "@tensorflow/tfjs";

// データをテンソルに変換
function dataToTensors(
  data: Record<string, number>[],
  featureColumns: string[],
  labelColumn: string,
): { features: tf.Tensor2D; labels: tf.Tensor1D } {
  const features = data.map((row) => featureColumns.map((col) => row[col]));

  const labels = data.map((row) => row[labelColumn]);

  return {
    features: tf.tensor2d(features),
    labels: tf.tensor1d(labels),
  };
}

// バッチ処理
function* batchGenerator<T>(
  data: T[],
  batchSize: number,
): Generator<T[], void, unknown> {
  for (let i = 0; i < data.length; i += batchSize) {
    yield data.slice(i, i + batchSize);
  }
}

// データ拡張（画像用）
async function augmentImage(imageTensor: tf.Tensor3D): Promise<tf.Tensor3D> {
  let augmented = imageTensor;

  // ランダムに左右反転
  if (Math.random() > 0.5) {
    augmented = tf.image.flipLeftRight(augmented);
  }

  // 明るさ調整
  const brightness = tf.randomUniform([], -0.2, 0.2);
  augmented = tf.add(augmented, brightness) as tf.Tensor3D;

  // クリップ
  augmented = tf.clipByValue(augmented, 0, 1) as tf.Tensor3D;

  return augmented;
}
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│             データ準備のベストプラクティス                  │
│                                                         │
│  1. 訓練/テストデータのリーク防止                         │
│     • スケーリングは訓練データで fit、テストで transform   │
│     • 時系列は時間順に分割                               │
│                                                         │
│  2. パイプラインの再現性                                  │
│     • 乱数シードを固定                                   │
│     • 処理手順を文書化                                   │
│                                                         │
│  3. 特徴量の選択                                         │
│     • 相関分析で冗長な特徴量を削除                        │
│     • 特徴量重要度を確認                                 │
│                                                         │
│  4. データの品質チェック                                  │
│     • 型の一貫性                                         │
│     • 値の範囲の妥当性                                   │
│     • 欠損パターンの理解                                 │
└─────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、TensorFlow.js を使った機械学習モデルの実装について学びます。
