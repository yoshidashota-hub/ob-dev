# 第3章: TensorFlow.js

## TensorFlow.js 概要

```
┌─────────────────────────────────────────────────────────┐
│               TensorFlow.js の実行環境                    │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────┐            │
│  │    Browser      │    │    Node.js      │            │
│  │                 │    │                 │            │
│  │  • WebGL 加速   │    │  • CPU/GPU      │            │
│  │  • クライアント │    │  • サーバー処理 │            │
│  │  • プライバシー │    │  • 大規模データ │            │
│  └─────────────────┘    └─────────────────┘            │
│                                                         │
│  共通 API: tf.tensor, tf.layers, tf.sequential          │
└─────────────────────────────────────────────────────────┘
```

## セットアップ

### Node.js

```bash
# CPU版
npm install @tensorflow/tfjs @tensorflow/tfjs-node

# GPU版（CUDA必要）
npm install @tensorflow/tfjs @tensorflow/tfjs-node-gpu
```

```typescript
// Node.js での使用
import * as tf from "@tensorflow/tfjs-node";

// GPU版の場合
// import * as tf from "@tensorflow/tfjs-node-gpu";
```

### ブラウザ

```typescript
// ブラウザでの使用
import * as tf from "@tensorflow/tfjs";

// または CDN
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
```

## テンソル操作

### テンソルの作成

```typescript
import * as tf from "@tensorflow/tfjs";

// スカラー
const scalar = tf.scalar(3.14);
console.log(scalar.shape); // []

// 1次元テンソル（ベクトル）
const vector = tf.tensor1d([1, 2, 3, 4, 5]);
console.log(vector.shape); // [5]

// 2次元テンソル（行列）
const matrix = tf.tensor2d([
  [1, 2, 3],
  [4, 5, 6],
]);
console.log(matrix.shape); // [2, 3]

// 3次元テンソル
const tensor3d = tf.tensor3d([
  [
    [1, 2],
    [3, 4],
  ],
  [
    [5, 6],
    [7, 8],
  ],
]);
console.log(tensor3d.shape); // [2, 2, 2]

// 型を指定
const floatTensor = tf.tensor([1, 2, 3], [3], "float32");
const intTensor = tf.tensor([1, 2, 3], [3], "int32");

// 特殊なテンソル
const zeros = tf.zeros([3, 3]); // 全て0
const ones = tf.ones([2, 4]); // 全て1
const random = tf.randomNormal([3, 3]); // 正規分布
const uniform = tf.randomUniform([2, 2], 0, 1); // 一様分布
```

### テンソル演算

```typescript
// 基本演算
const a = tf.tensor1d([1, 2, 3]);
const b = tf.tensor1d([4, 5, 6]);

const sum = a.add(b); // [5, 7, 9]
const diff = a.sub(b); // [-3, -3, -3]
const product = a.mul(b); // [4, 10, 18]
const quotient = a.div(b); // [0.25, 0.4, 0.5]

// 行列演算
const matA = tf.tensor2d([
  [1, 2],
  [3, 4],
]);
const matB = tf.tensor2d([
  [5, 6],
  [7, 8],
]);

const matMul = matA.matMul(matB); // 行列積
const transpose = matA.transpose(); // 転置

// 集約演算
const tensor = tf.tensor1d([1, 2, 3, 4, 5]);
console.log(tensor.sum().dataSync()[0]); // 15
console.log(tensor.mean().dataSync()[0]); // 3
console.log(tensor.max().dataSync()[0]); // 5
console.log(tensor.min().dataSync()[0]); // 1

// 軸を指定
const matrix2 = tf.tensor2d([
  [1, 2],
  [3, 4],
]);
console.log(matrix2.sum(0).dataSync()); // [4, 6] (列方向)
console.log(matrix2.sum(1).dataSync()); // [3, 7] (行方向)
```

### メモリ管理

```typescript
// テンソルは手動でメモリを解放する必要がある
const tensor = tf.tensor([1, 2, 3]);
// 処理...
tensor.dispose(); // メモリ解放

// tf.tidy で自動解放
const result = tf.tidy(() => {
  const a = tf.tensor([1, 2, 3]);
  const b = tf.tensor([4, 5, 6]);
  const c = a.add(b);
  return c; // 戻り値は解放されない
});
// a, b は自動的に解放される

// メモリ使用量の確認
console.log(tf.memory());
// { numTensors: 5, numDataBuffers: 5, numBytes: 100, ... }
```

## モデル構築

### Sequential API

```typescript
// シンプルな順伝播ネットワーク
const model = tf.sequential();

// 入力層 + 隠れ層
model.add(
  tf.layers.dense({
    units: 64,
    inputShape: [10], // 入力: 10次元
    activation: "relu",
  }),
);

// 追加の隠れ層
model.add(
  tf.layers.dense({
    units: 32,
    activation: "relu",
  }),
);

// 出力層（2クラス分類）
model.add(
  tf.layers.dense({
    units: 2,
    activation: "softmax",
  }),
);

// モデルのコンパイル
model.compile({
  optimizer: tf.train.adam(0.001), // 学習率 0.001
  loss: "categoricalCrossentropy",
  metrics: ["accuracy"],
});

// モデルの概要を表示
model.summary();
```

### Functional API

```typescript
// より複雑なモデル構造
const input = tf.input({ shape: [10] });

const dense1 = tf.layers.dense({ units: 64, activation: "relu" }).apply(input);
const dense2 = tf.layers.dense({ units: 32, activation: "relu" }).apply(dense1);

// 分岐
const branch1 = tf.layers
  .dense({ units: 16, activation: "relu" })
  .apply(dense2);
const branch2 = tf.layers
  .dense({ units: 16, activation: "relu" })
  .apply(dense2);

// 結合
const concat = tf.layers
  .concatenate()
  .apply([branch1, branch2]) as tf.SymbolicTensor;

const output = tf.layers
  .dense({ units: 2, activation: "softmax" })
  .apply(concat);

const model = tf.model({ inputs: input, outputs: output as tf.SymbolicTensor });
```

## モデルの訓練

```typescript
// データの準備
const xTrain = tf.randomNormal([1000, 10]); // 1000サンプル、10特徴量
const yTrain = tf.oneHot(tf.randomUniform([1000], 0, 2, "int32"), 2);

// 訓練
async function trainModel() {
  const history = await model.fit(xTrain, yTrain, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(
          `Epoch ${epoch + 1}: loss = ${logs?.loss?.toFixed(4)}, ` +
            `accuracy = ${logs?.acc?.toFixed(4)}`,
        );
      },
    },
  });

  return history;
}

// 訓練実行
const history = await trainModel();
console.log("訓練完了");
```

### カスタムコールバック

```typescript
// 早期停止
const earlyStopping = tf.callbacks.earlyStopping({
  monitor: "val_loss",
  patience: 5, // 5エポック改善しなければ停止
  minDelta: 0.001,
});

// カスタムコールバック
class CustomCallback extends tf.Callback {
  private bestLoss = Infinity;

  async onEpochEnd(epoch: number, logs?: tf.Logs) {
    if (logs?.val_loss && logs.val_loss < this.bestLoss) {
      this.bestLoss = logs.val_loss;
      console.log(`New best loss: ${this.bestLoss}`);
    }
  }
}

await model.fit(xTrain, yTrain, {
  epochs: 100,
  validationSplit: 0.2,
  callbacks: [earlyStopping, new CustomCallback()],
});
```

## 予測

```typescript
// 単一サンプルの予測
const input = tf.tensor2d([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]);
const prediction = model.predict(input) as tf.Tensor;

// 結果を取得
const probabilities = await prediction.data();
console.log("確率:", probabilities);

const predictedClass = prediction.argMax(1).dataSync()[0];
console.log("予測クラス:", predictedClass);

// バッチ予測
const batchInput = tf.randomNormal([100, 10]);
const batchPredictions = model.predict(batchInput) as tf.Tensor;
const classes = batchPredictions.argMax(1);
console.log("予測クラス:", await classes.data());
```

## モデルの保存と読み込み

```typescript
// Node.js でファイルに保存
await model.save("file://./my-model");

// ブラウザで IndexedDB に保存
await model.save("indexeddb://my-model");

// ブラウザで LocalStorage に保存
await model.save("localstorage://my-model");

// HTTP でサーバーに保存
await model.save("http://localhost:3000/upload-model");

// モデルの読み込み
const loadedModel = await tf.loadLayersModel("file://./my-model/model.json");
```

## 回帰モデルの例

```typescript
// 住宅価格予測
async function housePricePrediction() {
  // データ生成（実際はDBやCSVから読み込む）
  const numSamples = 1000;
  const area = tf.randomUniform([numSamples, 1], 50, 200);
  const rooms = tf.randomUniform([numSamples, 1], 1, 6);
  const age = tf.randomUniform([numSamples, 1], 0, 50);

  // 特徴量を結合
  const features = tf.concat([area, rooms, age], 1);

  // 価格を生成（実際は実データを使用）
  const prices = area
    .mul(500000)
    .add(rooms.mul(2000000))
    .sub(age.mul(100000))
    .add(tf.randomNormal([numSamples, 1], 0, 1000000));

  // データを正規化
  const featureMean = features.mean(0);
  const featureStd = features.sub(featureMean).square().mean(0).sqrt();
  const normalizedFeatures = features.sub(featureMean).div(featureStd);

  const priceMean = prices.mean();
  const priceStd = prices.sub(priceMean).square().mean().sqrt();
  const normalizedPrices = prices.sub(priceMean).div(priceStd);

  // モデル定義
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 64, inputShape: [3], activation: "relu" }),
  );
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1 })); // 回帰なので活性化関数なし

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "meanSquaredError",
    metrics: ["mae"],
  });

  // 訓練
  await model.fit(normalizedFeatures, normalizedPrices, {
    epochs: 100,
    validationSplit: 0.2,
    callbacks: tf.callbacks.earlyStopping({ patience: 10 }),
  });

  // 予測
  const newHouse = tf.tensor2d([[120, 3, 10]]); // 120m², 3部屋, 築10年
  const normalizedInput = newHouse.sub(featureMean).div(featureStd);
  const normalizedPrediction = model.predict(normalizedInput) as tf.Tensor;

  // 逆正規化
  const prediction = normalizedPrediction.mul(priceStd).add(priceMean);
  console.log("予測価格:", (await prediction.data())[0].toLocaleString(), "円");

  // クリーンアップ
  model.dispose();
}
```

## 分類モデルの例

```typescript
// アイリス分類
async function irisClassification() {
  // アイリスデータセット（簡略化）
  const irisData = [
    {
      sepalLength: 5.1,
      sepalWidth: 3.5,
      petalLength: 1.4,
      petalWidth: 0.2,
      species: 0,
    },
    {
      sepalLength: 7.0,
      sepalWidth: 3.2,
      petalLength: 4.7,
      petalWidth: 1.4,
      species: 1,
    },
    {
      sepalLength: 6.3,
      sepalWidth: 3.3,
      petalLength: 6.0,
      petalWidth: 2.5,
      species: 2,
    },
    // ... more data
  ];

  // データをシャッフル
  const shuffled = [...irisData].sort(() => Math.random() - 0.5);

  // 訓練/テスト分割
  const splitIndex = Math.floor(shuffled.length * 0.8);
  const trainData = shuffled.slice(0, splitIndex);
  const testData = shuffled.slice(splitIndex);

  // テンソルに変換
  const xTrain = tf.tensor2d(
    trainData.map((d) => [
      d.sepalLength,
      d.sepalWidth,
      d.petalLength,
      d.petalWidth,
    ]),
  );
  const yTrain = tf.oneHot(
    tf.tensor1d(
      trainData.map((d) => d.species),
      "int32",
    ),
    3,
  );

  const xTest = tf.tensor2d(
    testData.map((d) => [
      d.sepalLength,
      d.sepalWidth,
      d.petalLength,
      d.petalWidth,
    ]),
  );
  const yTest = tf.oneHot(
    tf.tensor1d(
      testData.map((d) => d.species),
      "int32",
    ),
    3,
  );

  // モデル定義
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 16, inputShape: [4], activation: "relu" }),
  );
  model.add(tf.layers.dense({ units: 8, activation: "relu" }));
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  // 訓練
  await model.fit(xTrain, yTrain, {
    epochs: 100,
    validationSplit: 0.2,
  });

  // 評価
  const evaluation = model.evaluate(xTest, yTest) as tf.Scalar[];
  console.log("テスト損失:", (await evaluation[0].data())[0].toFixed(4));
  console.log("テスト精度:", (await evaluation[1].data())[0].toFixed(4));
}
```

## 転移学習

```typescript
// 事前学習モデルを利用
import * as mobilenet from "@tensorflow-models/mobilenet";

async function transferLearning() {
  // MobileNet を読み込み
  const baseModel = await mobilenet.load();

  // 特徴抽出器として使用
  async function extractFeatures(image: HTMLImageElement): Promise<tf.Tensor> {
    const logits = baseModel.infer(image, true); // 特徴ベクトルを取得
    return logits as tf.Tensor;
  }

  // 新しい分類層を追加
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      units: 64,
      inputShape: [1024], // MobileNet の出力次元
      activation: "relu",
    }),
  );
  model.add(tf.layers.dense({ units: 10, activation: "softmax" })); // 10クラス分類

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return { baseModel, model, extractFeatures };
}
```

## 次のステップ

次章では、TensorFlow.js を使った画像分類について学びます。
