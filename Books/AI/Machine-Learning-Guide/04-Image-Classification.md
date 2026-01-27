# 第4章: 画像分類

## 画像分類の概要

```
┌─────────────────────────────────────────────────────────┐
│                  画像分類パイプライン                      │
│                                                         │
│  入力画像        前処理         モデル        出力        │
│  ┌─────┐      ┌─────┐      ┌─────┐      ┌─────┐       │
│  │ 🖼️  │  →  │Resize│  →  │ CNN │  →  │ 猫  │       │
│  │     │      │Norm  │      │     │      │ 90% │       │
│  └─────┘      └─────┘      └─────┘      └─────┘       │
│                                                         │
│  224x224 RGB    0-1正規化    特徴抽出    クラス確率      │
└─────────────────────────────────────────────────────────┘
```

## 事前学習モデルの利用

### MobileNet

```typescript
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

async function classifyImage(imageElement: HTMLImageElement) {
  // モデルを読み込み
  const model = await mobilenet.load({
    version: 2,
    alpha: 1.0, // モデルサイズ（0.25, 0.5, 0.75, 1.0）
  });

  // 分類を実行
  const predictions = await model.classify(imageElement, 5); // Top 5

  return predictions;
  // [
  //   { className: "tabby, tabby cat", probability: 0.85 },
  //   { className: "tiger cat", probability: 0.10 },
  //   ...
  // ]
}

// 使用例
const img = document.getElementById("myImage") as HTMLImageElement;
const results = await classifyImage(img);
console.log(results);
```

### COCO-SSD（物体検出）

```typescript
import * as cocoSsd from "@tensorflow-models/coco-ssd";

interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

async function detectObjects(
  imageElement: HTMLImageElement,
): Promise<Detection[]> {
  const model = await cocoSsd.load({
    base: "mobilenet_v2", // または "lite_mobilenet_v2"
  });

  const predictions = await model.detect(imageElement);

  return predictions.map((p) => ({
    bbox: p.bbox as [number, number, number, number],
    class: p.class,
    score: p.score,
  }));
}

// 検出結果を描画
function drawDetections(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  detections: Detection[],
) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = image.width;
  canvas.height = image.height;

  // 画像を描画
  ctx.drawImage(image, 0, 0);

  // 検出結果を描画
  detections.forEach((detection) => {
    const [x, y, width, height] = detection.bbox;

    // バウンディングボックス
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // ラベル
    ctx.fillStyle = "#00ff00";
    ctx.font = "16px Arial";
    ctx.fillText(
      `${detection.class} (${(detection.score * 100).toFixed(1)}%)`,
      x,
      y - 5,
    );
  });
}
```

## 画像の前処理

```typescript
// 画像をテンソルに変換
function imageToTensor(
  image: HTMLImageElement | HTMLCanvasElement,
  targetSize: [number, number] = [224, 224],
): tf.Tensor3D {
  return tf.tidy(() => {
    // 画像をテンソルに変換
    let tensor = tf.browser.fromPixels(image);

    // リサイズ
    const resized = tf.image.resizeBilinear(tensor, targetSize);

    // 正規化（0-255 → 0-1）
    const normalized = resized.div(255.0);

    return normalized as tf.Tensor3D;
  });
}

// バッチ処理用
function imageToBatchTensor(
  image: HTMLImageElement,
  targetSize: [number, number] = [224, 224],
): tf.Tensor4D {
  return tf.tidy(() => {
    const tensor = imageToTensor(image, targetSize);
    return tensor.expandDims(0) as tf.Tensor4D;
  });
}

// データ拡張
function augmentImage(tensor: tf.Tensor3D): tf.Tensor3D {
  return tf.tidy(() => {
    let augmented = tensor;

    // ランダムに左右反転
    if (Math.random() > 0.5) {
      augmented = tf.image.flipLeftRight(augmented);
    }

    // ランダムに回転（-15° ~ 15°）
    const angle = (Math.random() - 0.5) * 30 * (Math.PI / 180);
    // TensorFlow.js には直接の回転がないため、affine変換を使用

    // 明るさ調整
    const brightness = Math.random() * 0.4 - 0.2;
    augmented = augmented.add(brightness);

    // コントラスト調整
    const contrast = 0.8 + Math.random() * 0.4;
    const mean = augmented.mean();
    augmented = augmented.sub(mean).mul(contrast).add(mean);

    // クリップ
    augmented = tf.clipByValue(augmented, 0, 1);

    return augmented as tf.Tensor3D;
  });
}
```

## CNN モデルの構築

### 基本的な CNN

```typescript
function createCNNModel(
  inputShape: [number, number, number],
  numClasses: number,
): tf.LayersModel {
  const model = tf.sequential();

  // 畳み込み層 1
  model.add(
    tf.layers.conv2d({
      inputShape,
      filters: 32,
      kernelSize: 3,
      activation: "relu",
      padding: "same",
    }),
  );
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // 畳み込み層 2
  model.add(
    tf.layers.conv2d({
      filters: 64,
      kernelSize: 3,
      activation: "relu",
      padding: "same",
    }),
  );
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // 畳み込み層 3
  model.add(
    tf.layers.conv2d({
      filters: 128,
      kernelSize: 3,
      activation: "relu",
      padding: "same",
    }),
  );
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // 全結合層
  model.add(tf.layers.flatten());
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: 256, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

// 使用例
const model = createCNNModel([224, 224, 3], 10);
model.summary();
```

### 転移学習

```typescript
import * as mobilenet from "@tensorflow-models/mobilenet";

async function createTransferLearningModel(numClasses: number) {
  // MobileNet を読み込み
  const mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });

  // 特徴抽出用のモデルを取得
  const layer = mobilenetModel.model.getLayer("global_average_pooling2d_1");
  const featureModel = tf.model({
    inputs: mobilenetModel.model.inputs,
    outputs: layer.output,
  });

  // 新しい分類層を追加
  const model = tf.sequential();

  // MobileNet の出力を入力として受け取る
  model.add(
    tf.layers.dense({
      inputShape: [1280], // MobileNet V2 の出力次元
      units: 128,
      activation: "relu",
    }),
  );
  model.add(tf.layers.dropout({ rate: 0.5 }));
  model.add(
    tf.layers.dense({
      units: numClasses,
      activation: "softmax",
    }),
  );

  model.compile({
    optimizer: tf.train.adam(0.0001), // 低い学習率
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return { featureModel, classificationModel: model };
}

// 訓練
async function trainTransferLearning(
  featureModel: tf.LayersModel,
  classificationModel: tf.Sequential,
  images: tf.Tensor4D,
  labels: tf.Tensor2D,
) {
  // 特徴量を抽出
  const features = featureModel.predict(images) as tf.Tensor2D;

  // 分類モデルを訓練
  await classificationModel.fit(features, labels, {
    epochs: 50,
    validationSplit: 0.2,
    callbacks: tf.callbacks.earlyStopping({ patience: 5 }),
  });
}
```

## 実践: 商品画像分類

```typescript
// Next.js API Route での画像分類
// app/api/classify/route.ts
import * as tf from "@tensorflow/tfjs-node";
import * as mobilenet from "@tensorflow-models/mobilenet";

let model: mobilenet.MobileNet | null = null;

async function getModel() {
  if (!model) {
    // tf-node をバックエンドとして設定
    await tf.ready();
    model = await mobilenet.load();
  }
  return model;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image") as File;

  if (!file) {
    return Response.json({ error: "No image provided" }, { status: 400 });
  }

  // 画像をバッファとして読み込み
  const buffer = Buffer.from(await file.arrayBuffer());

  // テンソルに変換
  const tensor = tf.node.decodeImage(buffer, 3);

  // 分類
  const classifier = await getModel();
  const predictions = await classifier.classify(tensor as tf.Tensor3D);

  // クリーンアップ
  tensor.dispose();

  return Response.json({
    predictions: predictions.map((p) => ({
      label: p.className,
      confidence: p.probability,
    })),
  });
}
```

## ブラウザでのリアルタイム分類

```typescript
// React コンポーネント
import { useEffect, useRef, useState } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";

interface Prediction {
  className: string;
  probability: number;
}

export function WebcamClassifier() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);

  // モデルを読み込み
  useEffect(() => {
    mobilenet.load().then(setModel);
  }, []);

  // カメラを開始
  useEffect(() => {
    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
    startCamera();
  }, []);

  // 分類を実行
  const classify = async () => {
    if (!model || !videoRef.current) return;

    setIsClassifying(true);
    const predictions = await model.classify(videoRef.current);
    setPredictions(predictions);
    setIsClassifying(false);
  };

  // 定期的に分類
  useEffect(() => {
    if (!model) return;

    const interval = setInterval(classify, 1000);
    return () => clearInterval(interval);
  }, [model]);

  return (
    <div className="space-y-4">
      <video ref={videoRef} autoPlay playsInline className="w-full max-w-md" />

      {predictions.length > 0 && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">検出結果:</h3>
          {predictions.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>{p.className}</span>
              <span>{(p.probability * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## カスタムモデルの訓練

```typescript
// カスタム画像分類モデルの訓練
async function trainCustomClassifier(
  images: ImageData[], // { data: Uint8ClampedArray, label: number }[]
  labels: string[],
) {
  const numClasses = labels.length;

  // 画像をテンソルに変換
  const imageTensors = images.map((img) => {
    const tensor = tf.browser.fromPixels({
      data: img.data,
      width: 224,
      height: 224,
    });
    return tensor.div(255.0);
  });

  const xTrain = tf.stack(imageTensors);
  const yTrain = tf.oneHot(
    tf.tensor1d(
      images.map((img) => img.label),
      "int32",
    ),
    numClasses,
  );

  // モデル作成
  const { featureModel, classificationModel } =
    await createTransferLearningModel(numClasses);

  // 特徴抽出
  const features = featureModel.predict(xTrain) as tf.Tensor2D;

  // 訓練
  await classificationModel.fit(features, yTrain, {
    epochs: 30,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: acc=${logs?.acc?.toFixed(3)}`);
      },
    },
  });

  // モデルを保存
  await classificationModel.save("indexeddb://custom-classifier");

  // メモリ解放
  imageTensors.forEach((t) => t.dispose());
  xTrain.dispose();
  yTrain.dispose();
  features.dispose();

  return { featureModel, classificationModel, labels };
}
```

## モデルの評価

```typescript
interface ClassificationMetrics {
  accuracy: number;
  precision: number[];
  recall: number[];
  f1Score: number[];
  confusionMatrix: number[][];
}

function evaluateClassifier(
  predictions: number[],
  actual: number[],
  numClasses: number,
): ClassificationMetrics {
  // 混同行列を作成
  const confusionMatrix: number[][] = Array(numClasses)
    .fill(null)
    .map(() => Array(numClasses).fill(0));

  predictions.forEach((pred, i) => {
    confusionMatrix[actual[i]][pred]++;
  });

  // 精度
  const correct = predictions.filter((p, i) => p === actual[i]).length;
  const accuracy = correct / predictions.length;

  // クラスごとの精度、再現率、F1
  const precision: number[] = [];
  const recall: number[] = [];
  const f1Score: number[] = [];

  for (let c = 0; c < numClasses; c++) {
    const tp = confusionMatrix[c][c];
    const fp = confusionMatrix.reduce(
      (sum, row, i) => (i !== c ? sum + row[c] : sum),
      0,
    );
    const fn = confusionMatrix[c].reduce(
      (sum, val, i) => (i !== c ? sum + val : sum),
      0,
    );

    const p = tp / (tp + fp) || 0;
    const r = tp / (tp + fn) || 0;
    const f1 = (2 * p * r) / (p + r) || 0;

    precision.push(p);
    recall.push(r);
    f1Score.push(f1);
  }

  return { accuracy, precision, recall, f1Score, confusionMatrix };
}
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│           画像分類のベストプラクティス                     │
│                                                         │
│  1. データ                                               │
│     • クラスごとに十分なサンプル数（最低100枚/クラス）    │
│     • データ拡張で多様性を増やす                         │
│     • クラス間のバランスを取る                           │
│                                                         │
│  2. 前処理                                               │
│     • 一貫したサイズにリサイズ（224x224等）              │
│     • 正規化（0-1 または ImageNet 標準化）              │
│     • 訓練/テストで同じ前処理を適用                     │
│                                                         │
│  3. モデル                                               │
│     • 小規模データセットでは転移学習を使用               │
│     • MobileNet は軽量で高速                            │
│     • 過学習防止に Dropout を使用                       │
│                                                         │
│  4. 訓練                                                 │
│     • 早期停止で過学習を防止                            │
│     • 学習率スケジューリング                            │
│     • 検証データで評価                                  │
│                                                         │
│  5. デプロイ                                             │
│     • モデルサイズを考慮（ブラウザ向けは軽量化）         │
│     • 量子化でサイズ削減                                │
│     • WebGL/WASM バックエンドを使用                     │
└─────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、自然言語処理（NLP）について学びます。
