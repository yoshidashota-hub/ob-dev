# 第9章: Hugging Face

## Hugging Face 概要

```
┌─────────────────────────────────────────────────────────┐
│                  Hugging Face エコシステム                │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │    Models       │  │    Datasets     │              │
│  │  500K+モデル    │  │  100K+データセット│              │
│  │  事前学習済み   │  │  多言語対応     │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │    Spaces       │  │  Inference API  │              │
│  │  デモアプリ     │  │  ホスティング   │              │
│  │  GPU サポート   │  │  API アクセス   │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │               Transformers ライブラリ            │   │
│  │  • Python/JavaScript 対応                       │   │
│  │  • 統一的な API                                 │   │
│  │  • 簡単なファインチューニング                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Inference API

### 基本的な使い方

```typescript
const HF_TOKEN = process.env.HF_TOKEN!;

interface HFResponse {
  [key: string]: any;
}

async function callInferenceAPI(
  model: string,
  inputs: any,
  parameters?: Record<string, any>,
): Promise<HFResponse> {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs, parameters }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`HF API Error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

// リトライロジック（モデルのロード待ち対応）
async function callWithRetry(
  model: string,
  inputs: any,
  parameters?: Record<string, any>,
  maxRetries: number = 3,
): Promise<HFResponse> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callInferenceAPI(model, inputs, parameters);
    } catch (error: any) {
      if (error.message.includes("loading") && i < maxRetries - 1) {
        // モデルがロード中の場合は待機
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries reached");
}
```

### テキスト分類

```typescript
interface ClassificationResult {
  label: string;
  score: number;
}

// 感情分析
async function analyzeSentiment(text: string): Promise<ClassificationResult[]> {
  const result = await callInferenceAPI(
    "distilbert-base-uncased-finetuned-sst-2-english",
    text,
  );
  return result[0] as ClassificationResult[];
}

// 日本語感情分析
async function analyzeJapaneseSentiment(
  text: string,
): Promise<ClassificationResult[]> {
  const result = await callInferenceAPI(
    "koheiduck/bert-japanese-finetuned-sentiment",
    text,
  );
  return result[0] as ClassificationResult[];
}

// ゼロショット分類
async function classifyZeroShot(
  text: string,
  labels: string[],
): Promise<{ labels: string[]; scores: number[] }> {
  return await callInferenceAPI("facebook/bart-large-mnli", text, {
    candidate_labels: labels,
  });
}

// 使用例
const sentiment = await analyzeSentiment("I love this product!");
console.log(sentiment);
// [{ label: "POSITIVE", score: 0.9998 }, { label: "NEGATIVE", score: 0.0002 }]

const categories = await classifyZeroShot(
  "This is a tutorial about machine learning",
  ["technology", "sports", "politics", "entertainment"],
);
console.log(categories);
// { labels: ["technology", ...], scores: [0.95, ...] }
```

### 固有表現抽出（NER）

```typescript
interface NEREntity {
  entity_group: string;
  score: number;
  word: string;
  start: number;
  end: number;
}

async function extractEntities(text: string): Promise<NEREntity[]> {
  return await callInferenceAPI(
    "dbmdz/bert-large-cased-finetuned-conll03-english",
    text,
  );
}

// 日本語 NER
async function extractJapaneseEntities(text: string): Promise<NEREntity[]> {
  return await callInferenceAPI(
    "cl-tohoku/bert-base-japanese-whole-word-masking",
    text,
  );
}

// 使用例
const entities = await extractEntities(
  "Apple Inc. was founded by Steve Jobs in California.",
);
console.log(entities);
// [
//   { entity_group: "ORG", word: "Apple Inc.", score: 0.99, ... },
//   { entity_group: "PER", word: "Steve Jobs", score: 0.99, ... },
//   { entity_group: "LOC", word: "California", score: 0.98, ... }
// ]
```

### 質問応答

```typescript
interface QAResult {
  answer: string;
  score: number;
  start: number;
  end: number;
}

async function answerQuestion(
  question: string,
  context: string,
): Promise<QAResult> {
  return await callInferenceAPI("deepset/roberta-base-squad2", {
    question,
    context,
  });
}

// 日本語質問応答
async function answerJapaneseQuestion(
  question: string,
  context: string,
): Promise<QAResult> {
  return await callInferenceAPI("cl-tohoku/bert-base-japanese-squad", {
    question,
    context,
  });
}

// 使用例
const context = `
TensorFlow.js is a library for machine learning in JavaScript.
It was released by Google in March 2018.
It allows developers to train and deploy ML models in the browser.
`;

const answer = await answerQuestion(
  "When was TensorFlow.js released?",
  context,
);
console.log(answer);
// { answer: "March 2018", score: 0.95, start: 70, end: 80 }
```

### テキスト生成

```typescript
interface GenerationParams {
  max_new_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  do_sample?: boolean;
  repetition_penalty?: number;
}

async function generateText(
  prompt: string,
  params: GenerationParams = {},
): Promise<string> {
  const defaultParams: GenerationParams = {
    max_new_tokens: 100,
    temperature: 0.7,
    top_p: 0.9,
    do_sample: true,
  };

  const result = await callInferenceAPI("gpt2", prompt, {
    ...defaultParams,
    ...params,
  });

  return result[0].generated_text;
}

// より高品質な生成
async function generateWithMistral(
  prompt: string,
  params: GenerationParams = {},
): Promise<string> {
  const result = await callInferenceAPI(
    "mistralai/Mistral-7B-Instruct-v0.2",
    prompt,
    params,
  );

  return result[0].generated_text;
}

// 使用例
const story = await generateText("Once upon a time in a magical forest,");
console.log(story);
```

### 要約

```typescript
interface SummarizationParams {
  max_length?: number;
  min_length?: number;
  do_sample?: boolean;
}

async function summarize(
  text: string,
  params: SummarizationParams = {},
): Promise<string> {
  const defaultParams = {
    max_length: 150,
    min_length: 30,
    do_sample: false,
  };

  const result = await callInferenceAPI("facebook/bart-large-cnn", text, {
    ...defaultParams,
    ...params,
  });

  return result[0].summary_text;
}

// 使用例
const article = `
Machine learning is a subset of artificial intelligence that provides
systems the ability to automatically learn and improve from experience
without being explicitly programmed. It focuses on the development of
computer programs that can access data and use it to learn for themselves.
`;

const summary = await summarize(article);
console.log(summary);
```

### 翻訳

```typescript
async function translate(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  // 言語ペアに応じたモデルを選択
  const modelMap: Record<string, string> = {
    "en-ja": "Helsinki-NLP/opus-mt-en-jap",
    "ja-en": "Helsinki-NLP/opus-mt-ja-en",
    "en-zh": "Helsinki-NLP/opus-mt-en-zh",
    "en-de": "Helsinki-NLP/opus-mt-en-de",
    "en-fr": "Helsinki-NLP/opus-mt-en-fr",
  };

  const modelKey = `${sourceLang}-${targetLang}`;
  const model = modelMap[modelKey];

  if (!model) {
    throw new Error(`Translation not supported: ${modelKey}`);
  }

  const result = await callInferenceAPI(model, text);
  return result[0].translation_text;
}

// 使用例
const translated = await translate("Hello, how are you?", "en", "ja");
console.log(translated); // "こんにちは、お元気ですか？"
```

### 画像分類

```typescript
interface ImageClassificationResult {
  label: string;
  score: number;
}

async function classifyImage(
  imageUrl: string,
): Promise<ImageClassificationResult[]> {
  // 画像を取得
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  const response = await fetch(
    "https://api-inference.huggingface.co/models/google/vit-base-patch16-224",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
      },
      body: Buffer.from(imageBuffer),
    },
  );

  return response.json();
}

// 物体検出
async function detectObjects(imageBuffer: Buffer): Promise<any[]> {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/facebook/detr-resnet-50",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
      },
      body: imageBuffer,
    },
  );

  return response.json();
}
```

### Embeddings

```typescript
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const result = await callInferenceAPI(
    "sentence-transformers/all-MiniLM-L6-v2",
    { inputs: texts },
  );

  return result as number[][];
}

// 多言語 Embeddings
async function getMultilingualEmbeddings(texts: string[]): Promise<number[][]> {
  const result = await callInferenceAPI(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    { inputs: texts },
  );

  return result as number[][];
}

// 使用例
const embeddings = await getEmbeddings([
  "Machine learning is fascinating",
  "I love artificial intelligence",
  "The weather is nice today",
]);

console.log(`次元数: ${embeddings[0].length}`); // 384
```

## 実践: マルチタスク API

```typescript
// Next.js API Route
// app/api/nlp/route.ts

import { NextRequest } from "next/server";

type Task = "sentiment" | "ner" | "qa" | "summarize" | "translate" | "classify";

interface NLPRequest {
  task: Task;
  text: string;
  options?: {
    question?: string;
    context?: string;
    labels?: string[];
    sourceLang?: string;
    targetLang?: string;
  };
}

export async function POST(request: NextRequest) {
  const { task, text, options }: NLPRequest = await request.json();

  try {
    let result;

    switch (task) {
      case "sentiment":
        result = await analyzeSentiment(text);
        break;

      case "ner":
        result = await extractEntities(text);
        break;

      case "qa":
        if (!options?.context) {
          return Response.json(
            { error: "Context required for QA" },
            { status: 400 },
          );
        }
        result = await answerQuestion(text, options.context);
        break;

      case "summarize":
        result = await summarize(text);
        break;

      case "translate":
        if (!options?.sourceLang || !options?.targetLang) {
          return Response.json(
            { error: "Source and target language required" },
            { status: 400 },
          );
        }
        result = await translate(text, options.sourceLang, options.targetLang);
        break;

      case "classify":
        if (!options?.labels) {
          return Response.json(
            { error: "Labels required for classification" },
            { status: 400 },
          );
        }
        result = await classifyZeroShot(text, options.labels);
        break;

      default:
        return Response.json({ error: "Unknown task" }, { status: 400 });
    }

    return Response.json({ result });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## モデル選択ガイド

```
┌─────────────────────────────────────────────────────────┐
│                  タスク別推奨モデル                       │
│                                                         │
│  感情分析                                                │
│  • 英語: distilbert-base-uncased-finetuned-sst-2       │
│  • 日本語: koheiduck/bert-japanese-finetuned-sentiment │
│  • 多言語: nlptown/bert-base-multilingual-sentiment    │
│                                                         │
│  NER                                                    │
│  • 英語: dbmdz/bert-large-cased-finetuned-conll03     │
│  • 日本語: cl-tohoku/bert-base-japanese               │
│                                                         │
│  質問応答                                                │
│  • 英語: deepset/roberta-base-squad2                  │
│  • 多言語: deepset/xlm-roberta-base-squad2            │
│                                                         │
│  要約                                                    │
│  • 英語: facebook/bart-large-cnn                      │
│  • 日本語: sonoisa/t5-base-japanese                   │
│                                                         │
│  Embeddings                                             │
│  • 高速: all-MiniLM-L6-v2 (384次元)                   │
│  • 高品質: all-mpnet-base-v2 (768次元)                │
│  • 多言語: paraphrase-multilingual-MiniLM-L12-v2      │
└─────────────────────────────────────────────────────────┘
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│         Hugging Face のベストプラクティス                  │
│                                                         │
│  1. モデル選択                                           │
│     • タスクに特化したモデルを使用                       │
│     • モデルサイズと精度のトレードオフを考慮             │
│     • 日本語には日本語専用モデルを使用                   │
│                                                         │
│  2. API 使用                                            │
│     • レート制限に注意（Pro プランで緩和）              │
│     • モデルのロード待ちにリトライを実装                │
│     • レスポンスをキャッシュ                            │
│                                                         │
│  3. パフォーマンス                                       │
│     • バッチ処理で効率化                                │
│     • 軽量モデル（distil*, mini*）を検討               │
│     • Inference Endpoints で専用インスタンス           │
│                                                         │
│  4. セキュリティ                                         │
│     • API トークンを環境変数で管理                      │
│     • 入力のサニタイズ                                  │
│     • 機密データは送信しない                            │
└─────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、MLOps について学びます。
