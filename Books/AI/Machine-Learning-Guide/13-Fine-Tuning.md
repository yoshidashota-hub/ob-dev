# 第13章: ファインチューニング

## ファインチューニングの概要

```
┌─────────────────────────────────────────────────────────┐
│              ファインチューニングの種類                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Full Fine-Tuning                               │   │
│  │  • 全パラメータを更新                           │   │
│  │  • 高品質だがコストが高い                       │   │
│  │  • 大量のデータが必要                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Parameter-Efficient Fine-Tuning (PEFT)          │   │
│  │  • 一部のパラメータのみ更新                     │   │
│  │  • LoRA, Adapters, Prefix-Tuning                │   │
│  │  • 効率的で少ないデータでも可能                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Transfer Learning                              │   │
│  │  • 事前学習モデルの最終層を置換                 │   │
│  │  • 画像分類などで一般的                         │   │
│  │  • 少ないデータで高精度                         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## OpenAI ファインチューニング

### データ準備

```typescript
interface TrainingExample {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
}

// 訓練データの作成
function createTrainingData(
  examples: Array<{ input: string; output: string }>,
  systemPrompt: string,
): TrainingExample[] {
  return examples.map((example) => ({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: example.input },
      { role: "assistant", content: example.output },
    ],
  }));
}

// JSONL ファイルに保存
import { createWriteStream } from "fs";

async function saveAsJsonl(
  data: TrainingExample[],
  filePath: string,
): Promise<void> {
  const stream = createWriteStream(filePath);

  for (const example of data) {
    stream.write(JSON.stringify(example) + "\n");
  }

  stream.end();
}

// データの検証
function validateTrainingData(data: TrainingExample[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  data.forEach((example, i) => {
    // メッセージの存在確認
    if (!example.messages || example.messages.length === 0) {
      errors.push(`Example ${i}: No messages`);
      return;
    }

    // assistant メッセージの確認
    const hasAssistant = example.messages.some((m) => m.role === "assistant");
    if (!hasAssistant) {
      errors.push(`Example ${i}: No assistant message`);
    }

    // 内容の長さチェック
    const totalLength = example.messages.reduce(
      (sum, m) => sum + m.content.length,
      0,
    );
    if (totalLength > 32000) {
      errors.push(`Example ${i}: Total content too long`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// 使用例
const trainingExamples = [
  {
    input: "このレビューは良い評価ですか？「最高の商品です！」",
    output: "良い評価です。「最高」という強い肯定表現が使われています。",
  },
  {
    input: "このレビューは良い評価ですか？「使いにくい」",
    output: "悪い評価です。「使いにくい」という否定的な表現が使われています。",
  },
];

const trainingData = createTrainingData(
  trainingExamples,
  "You are a sentiment analysis assistant. Analyze Japanese reviews and explain your reasoning.",
);

await saveAsJsonl(trainingData, "training_data.jsonl");
```

### ファインチューニングの実行

```typescript
import OpenAI from "openai";

const openai = new OpenAI();

// ファイルをアップロード
async function uploadTrainingFile(filePath: string): Promise<string> {
  const file = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose: "fine-tune",
  });

  return file.id;
}

// ファインチューニングジョブを作成
async function createFineTuningJob(
  trainingFileId: string,
  validationFileId?: string,
): Promise<string> {
  const job = await openai.fineTuning.jobs.create({
    training_file: trainingFileId,
    validation_file: validationFileId,
    model: "gpt-4o-mini-2024-07-18",
    hyperparameters: {
      n_epochs: 3,
      batch_size: 4,
      learning_rate_multiplier: 1.0,
    },
    suffix: "sentiment-analyzer",
  });

  return job.id;
}

// ジョブの状態を監視
async function monitorJob(jobId: string): Promise<void> {
  while (true) {
    const job = await openai.fineTuning.jobs.retrieve(jobId);

    console.log(`Status: ${job.status}`);

    if (job.status === "succeeded") {
      console.log(`Fine-tuned model: ${job.fine_tuned_model}`);
      break;
    } else if (job.status === "failed") {
      console.error(`Job failed: ${job.error}`);
      break;
    }

    // イベントを取得
    const events = await openai.fineTuning.jobs.listEvents(jobId, { limit: 5 });
    for (const event of events.data) {
      console.log(`  ${event.created_at}: ${event.message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
}

// ファインチューニング済みモデルを使用
async function useFineTunedModel(
  modelId: string,
  prompt: string,
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: modelId,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0].message.content || "";
}

// 実行フロー
async function runFineTuning() {
  // 1. データをアップロード
  const trainingFileId = await uploadTrainingFile("training_data.jsonl");
  const validationFileId = await uploadTrainingFile("validation_data.jsonl");

  console.log(`Training file: ${trainingFileId}`);
  console.log(`Validation file: ${validationFileId}`);

  // 2. ジョブを作成
  const jobId = await createFineTuningJob(trainingFileId, validationFileId);
  console.log(`Job ID: ${jobId}`);

  // 3. 完了を待機
  await monitorJob(jobId);
}
```

## TensorFlow.js での転移学習

### 画像分類の転移学習

```typescript
import * as tf from "@tensorflow/tfjs-node";
import * as mobilenet from "@tensorflow-models/mobilenet";

async function createTransferModel(
  numClasses: number,
): Promise<tf.LayersModel> {
  // MobileNet を読み込み
  const mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });

  // 特徴抽出層を取得
  const layer = mobilenetModel.model.getLayer("global_average_pooling2d_1");
  const featureExtractor = tf.model({
    inputs: mobilenetModel.model.inputs,
    outputs: layer.output,
  });

  // 新しい分類ヘッドを追加
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [1280],
      units: 128,
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
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
    optimizer: tf.train.adam(0.0001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

// 訓練
async function trainTransferModel(
  model: tf.LayersModel,
  featureExtractor: tf.LayersModel,
  images: tf.Tensor4D,
  labels: tf.Tensor2D,
  epochs: number = 20,
): Promise<void> {
  // 特徴を抽出
  const features = featureExtractor.predict(images) as tf.Tensor2D;

  // 訓練
  await model.fit(features, labels, {
    epochs,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(
          `Epoch ${epoch + 1}: loss=${logs?.loss?.toFixed(4)}, ` +
            `acc=${logs?.acc?.toFixed(4)}, ` +
            `val_loss=${logs?.val_loss?.toFixed(4)}, ` +
            `val_acc=${logs?.val_acc?.toFixed(4)}`,
        );
      },
    },
  });

  features.dispose();
}
```

### テキスト分類の転移学習

```typescript
// Universal Sentence Encoder を使用
import * as use from "@tensorflow-models/universal-sentence-encoder";

async function createTextClassifier(numClasses: number) {
  // USE をロード
  const encoder = await use.load();

  // 分類モデル
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [512], // USE の出力次元
      units: 64,
      activation: "relu",
    }),
  );
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(
    tf.layers.dense({
      units: numClasses,
      activation: "softmax",
    }),
  );

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return { encoder, model };
}

// テキストを埋め込みに変換
async function encodeTexts(
  encoder: use.UniversalSentenceEncoder,
  texts: string[],
): Promise<tf.Tensor2D> {
  return encoder.embed(texts);
}

// 訓練と予測
async function trainTextClassifier(
  texts: string[],
  labels: number[],
  numClasses: number,
) {
  const { encoder, model } = await createTextClassifier(numClasses);

  // テキストを埋め込みに変換
  const embeddings = await encodeTexts(encoder, texts);
  const labelTensor = tf.oneHot(tf.tensor1d(labels, "int32"), numClasses);

  // 訓練
  await model.fit(embeddings, labelTensor, {
    epochs: 50,
    validationSplit: 0.2,
  });

  // 予測関数を返す
  return async (text: string): Promise<number> => {
    const embedding = await encodeTexts(encoder, [text]);
    const prediction = model.predict(embedding) as tf.Tensor;
    const classIndex = prediction.argMax(1).dataSync()[0];

    embedding.dispose();
    prediction.dispose();

    return classIndex;
  };
}
```

## Hugging Face でのファインチューニング

### AutoTrain でのノーコードファインチューニング

```typescript
// Hugging Face AutoTrain API
async function createAutoTrainProject(
  projectName: string,
  task: string,
  datasetId: string,
): Promise<string> {
  const response = await fetch("https://api.huggingface.co/autotrain/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_name: projectName,
      task,
      base_model: "bert-base-uncased",
      dataset_id: datasetId,
      train_split: "train",
      valid_split: "validation",
      text_column: "text",
      label_column: "label",
    }),
  });

  const result = await response.json();
  return result.project_id;
}

// Inference Endpoints でデプロイ
async function deployModel(
  modelId: string,
  endpointName: string,
): Promise<string> {
  const response = await fetch(
    "https://api.huggingface.co/inference-endpoints",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: endpointName,
        model: modelId,
        instance_type: "nvidia-t4",
        instance_size: "x1",
        framework: "pytorch",
        task: "text-classification",
      }),
    },
  );

  const result = await response.json();
  return result.endpoint_url;
}
```

### Transformers.js での推論

```typescript
import { pipeline } from "@xenova/transformers";

// ファインチューニング済みモデルの読み込み
async function loadFineTunedModel() {
  const classifier = await pipeline(
    "text-classification",
    "my-username/my-fine-tuned-model",
  );

  return classifier;
}

// 推論
async function classify(text: string) {
  const classifier = await loadFineTunedModel();
  const result = await classifier(text);
  return result;
}
```

## データセット準備のベストプラクティス

### データ品質チェック

```typescript
interface DatasetStats {
  totalExamples: number;
  avgInputLength: number;
  avgOutputLength: number;
  labelDistribution: Record<string, number>;
  duplicates: number;
  issues: string[];
}

function analyzeDataset(
  examples: Array<{ input: string; output: string; label?: string }>,
): DatasetStats {
  const issues: string[] = [];
  const labelCounts: Record<string, number> = {};

  // 重複チェック
  const inputSet = new Set<string>();
  let duplicates = 0;

  let totalInputLength = 0;
  let totalOutputLength = 0;

  for (const example of examples) {
    // 入力の長さ
    totalInputLength += example.input.length;
    totalOutputLength += example.output.length;

    // 重複チェック
    if (inputSet.has(example.input)) {
      duplicates++;
    }
    inputSet.add(example.input);

    // ラベル分布
    if (example.label) {
      labelCounts[example.label] = (labelCounts[example.label] || 0) + 1;
    }

    // 品質チェック
    if (example.input.length < 10) {
      issues.push(`Short input: "${example.input.slice(0, 50)}"`);
    }
    if (example.output.length < 5) {
      issues.push(`Short output: "${example.output}"`);
    }
  }

  // ラベルの不均衡チェック
  const labelValues = Object.values(labelCounts);
  if (labelValues.length > 1) {
    const maxCount = Math.max(...labelValues);
    const minCount = Math.min(...labelValues);
    if (maxCount / minCount > 5) {
      issues.push("Severe label imbalance detected");
    }
  }

  return {
    totalExamples: examples.length,
    avgInputLength: totalInputLength / examples.length,
    avgOutputLength: totalOutputLength / examples.length,
    labelDistribution: labelCounts,
    duplicates,
    issues,
  };
}
```

### データ拡張

```typescript
// テキストデータの拡張
async function augmentTextData(
  examples: Array<{ input: string; output: string }>,
  augmentationFactor: number = 2,
): Promise<Array<{ input: string; output: string }>> {
  const augmented: Array<{ input: string; output: string }> = [...examples];

  for (const example of examples) {
    // 1. パラフレーズ生成
    const paraphrases = await generateParaphrases(
      example.input,
      augmentationFactor - 1,
    );

    for (const paraphrase of paraphrases) {
      augmented.push({
        input: paraphrase,
        output: example.output,
      });
    }
  }

  return augmented;
}

async function generateParaphrases(
  text: string,
  count: number,
): Promise<string[]> {
  const { text: result } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `Generate ${count} paraphrases of the given text. Keep the meaning the same but vary the wording. Output as JSON array of strings.`,
    prompt: text,
  });

  return JSON.parse(result);
}

// バックトランスレーション
async function backTranslate(text: string): Promise<string> {
  // 日本語 → 英語 → 日本語
  const english = await translate(text, "ja", "en");
  const backTranslated = await translate(english, "en", "ja");
  return backTranslated;
}
```

## 評価と比較

```typescript
interface ModelComparison {
  baseModel: string;
  fineTunedModel: string;
  metrics: {
    accuracy: number;
    latency: number;
    cost: number;
  };
  examples: Array<{
    input: string;
    baseOutput: string;
    fineTunedOutput: string;
    expectedOutput: string;
  }>;
}

async function compareModels(
  baseModelId: string,
  fineTunedModelId: string,
  testSet: Array<{ input: string; expected: string }>,
): Promise<ModelComparison> {
  const examples: ModelComparison["examples"] = [];
  let baseCorrect = 0;
  let fineTunedCorrect = 0;
  let baseLatency = 0;
  let fineTunedLatency = 0;

  for (const { input, expected } of testSet) {
    // ベースモデル
    const baseStart = Date.now();
    const baseOutput = await generateText({
      model: openai(baseModelId),
      prompt: input,
    });
    baseLatency += Date.now() - baseStart;

    // ファインチューニング済みモデル
    const ftStart = Date.now();
    const ftOutput = await generateText({
      model: openai(fineTunedModelId),
      prompt: input,
    });
    fineTunedLatency += Date.now() - ftStart;

    // 評価
    if (baseOutput.text.trim() === expected.trim()) baseCorrect++;
    if (ftOutput.text.trim() === expected.trim()) fineTunedCorrect++;

    examples.push({
      input,
      baseOutput: baseOutput.text,
      fineTunedOutput: ftOutput.text,
      expectedOutput: expected,
    });
  }

  const n = testSet.length;

  return {
    baseModel: baseModelId,
    fineTunedModel: fineTunedModelId,
    metrics: {
      accuracy: fineTunedCorrect / n - baseCorrect / n, // 改善度
      latency: (baseLatency - fineTunedLatency) / n, // レイテンシ改善
      cost: 0, // コスト計算は別途
    },
    examples,
  };
}
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│         ファインチューニングのベストプラクティス            │
│                                                         │
│  1. データ準備                                           │
│     • 最低100-500の高品質な例を用意                     │
│     • ラベルの偏りを確認・修正                          │
│     • 重複を除去                                        │
│     • 入出力のフォーマットを統一                        │
│                                                         │
│  2. モデル選択                                           │
│     • 小さいモデルから始める（gpt-4o-mini）             │
│     • タスクに特化したベースモデルを選択                │
│     • コストと精度のトレードオフを検討                  │
│                                                         │
│  3. 訓練                                                 │
│     • 少ないエポック（1-3）から始める                   │
│     • 検証セットで過学習を監視                          │
│     • ハイパーパラメータを段階的に調整                  │
│                                                         │
│  4. 評価                                                 │
│     • ベースモデルと必ず比較                            │
│     • 定量的・定性的両面で評価                          │
│     • エッジケースをテスト                              │
│                                                         │
│  5. 運用                                                 │
│     • モデルバージョンを管理                            │
│     • パフォーマンスを継続監視                          │
│     • 定期的に再訓練を検討                              │
└─────────────────────────────────────────────────────────┘
```

## まとめ

本ガイドでは、Web 開発者のための機械学習の基礎から応用までを学びました。

- **基礎**: 教師あり/なし学習、データ準備
- **実装**: TensorFlow.js、画像分類、NLP
- **応用**: 推薦システム、Embeddings、異常検知
- **運用**: MLOps、AI SDK 統合、RAG、ファインチューニング

これらの知識を活用して、AI を活用した Web アプリケーションを構築してください。
