# 第5章: プロバイダー

## プロバイダーとは

AI SDK は複数の AI プロバイダーを統一的なインターフェースで利用可能。

```
┌─────────────────────────────────────────────────────┐
│                 Provider Abstraction                 │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │               Your Application               │   │
│  └─────────────────────────────────────────────┘   │
│                        │                           │
│                        ▼                           │
│  ┌─────────────────────────────────────────────┐   │
│  │            Unified AI SDK API                │   │
│  │   generateText / streamText / generateObject │   │
│  └─────────────────────────────────────────────┘   │
│                        │                           │
│         ┌──────────────┼──────────────┐           │
│         ▼              ▼              ▼           │
│    ┌─────────┐   ┌──────────┐   ┌─────────┐     │
│    │ OpenAI  │   │ Anthropic│   │  Google │     │
│    │ GPT-4o  │   │ Claude   │   │  Gemini │     │
│    └─────────┘   └──────────┘   └─────────┘     │
└─────────────────────────────────────────────────────┘
```

## OpenAI

### インストール

```bash
npm install @ai-sdk/openai
```

### 基本設定

```typescript
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "Hello!",
});
```

### モデル一覧

```typescript
// GPT-4o（推奨）
openai("gpt-4o");
openai("gpt-4o-mini");

// GPT-4 Turbo
openai("gpt-4-turbo");

// GPT-3.5
openai("gpt-3.5-turbo");

// 画像生成
openai.image("dall-e-3");

// 埋め込み
openai.embedding("text-embedding-3-small");
openai.embedding("text-embedding-3-large");
```

### カスタム設定

```typescript
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1", // カスタムエンドポイント
  organization: "org-xxx", // 組織ID
});

const model = openai("gpt-4o", {
  user: "user_123", // ユーザー追跡用
});
```

### 画像入力

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "この画像は何ですか？" },
        {
          type: "image",
          image: new URL("https://example.com/image.png"),
        },
      ],
    },
  ],
});
```

## Anthropic

### インストール

```bash
npm install @ai-sdk/anthropic
```

### 基本設定

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const result = await generateText({
  model: anthropic("claude-3-5-sonnet-20241022"),
  prompt: "Hello!",
});
```

### モデル一覧

```typescript
// Claude 3.5
anthropic("claude-3-5-sonnet-20241022");
anthropic("claude-3-5-haiku-20241022");

// Claude 3
anthropic("claude-3-opus-20240229");
anthropic("claude-3-sonnet-20240229");
anthropic("claude-3-haiku-20240307");
```

### カスタム設定

```typescript
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://api.anthropic.com",
});
```

### キャッシュ（Anthropic 固有）

```typescript
const result = await generateText({
  model: anthropic("claude-3-5-sonnet-20241022"),
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: longDocument,
          experimental_providerMetadata: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
        { type: "text", text: "要約してください" },
      ],
    },
  ],
});
```

## Google

### インストール

```bash
npm install @ai-sdk/google
```

### 基本設定

```typescript
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const result = await generateText({
  model: google("gemini-1.5-pro"),
  prompt: "Hello!",
});
```

### モデル一覧

```typescript
// Gemini 1.5
google("gemini-1.5-pro");
google("gemini-1.5-flash");

// Gemini 1.0
google("gemini-pro");
google("gemini-pro-vision");

// 埋め込み
google.embedding("text-embedding-004");
```

### カスタム設定

```typescript
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
```

## その他のプロバイダー

### Mistral

```bash
npm install @ai-sdk/mistral
```

```typescript
import { mistral } from "@ai-sdk/mistral";

const result = await generateText({
  model: mistral("mistral-large-latest"),
  prompt: "Hello!",
});
```

### Cohere

```bash
npm install @ai-sdk/cohere
```

```typescript
import { cohere } from "@ai-sdk/cohere";

const result = await generateText({
  model: cohere("command-r-plus"),
  prompt: "Hello!",
});
```

### Amazon Bedrock

```bash
npm install @ai-sdk/amazon-bedrock
```

```typescript
import { bedrock } from "@ai-sdk/amazon-bedrock";

const result = await generateText({
  model: bedrock("anthropic.claude-3-sonnet-20240229-v1:0"),
  prompt: "Hello!",
});
```

## プロバイダーの切り替え

### 環境変数で切り替え

```typescript
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

function getModel() {
  const provider = process.env.AI_PROVIDER || "openai";

  switch (provider) {
    case "openai":
      return openai("gpt-4o");
    case "anthropic":
      return anthropic("claude-3-5-sonnet-20241022");
    case "google":
      return google("gemini-1.5-pro");
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

const result = await generateText({
  model: getModel(),
  prompt: "Hello!",
});
```

### ファクトリーパターン

```typescript
// lib/ai.ts
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { LanguageModel } from "ai";

type ModelConfig = {
  provider: "openai" | "anthropic";
  model: string;
};

export function createModel(config: ModelConfig): LanguageModel {
  switch (config.provider) {
    case "openai":
      return openai(config.model);
    case "anthropic":
      return anthropic(config.model);
  }
}

// 使用例
const model = createModel({
  provider: "openai",
  model: "gpt-4o",
});
```

## 埋め込み（Embeddings）

```typescript
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

// 単一テキスト
const { embedding } = await embed({
  model: openai.embedding("text-embedding-3-small"),
  value: "こんにちは",
});

// 複数テキスト
const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: ["こんにちは", "さようなら", "ありがとう"],
});

// 類似度計算
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

## 画像生成

```typescript
import { experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";

const { image } = await generateImage({
  model: openai.image("dall-e-3"),
  prompt: "A cute cat wearing a hat",
  size: "1024x1024",
});

// Base64 形式
console.log(image.base64);

// URL 形式（OpenAI の場合）
console.log(image.url);
```

## レート制限とリトライ

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

async function generateWithRetry(
  prompt: string,
  maxRetries = 3,
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await generateText({
        model: openai("gpt-4o"),
        prompt,
      });
      return result.text;
    } catch (error) {
      if (error instanceof Error && error.message.includes("rate_limit")) {
        const delay = Math.pow(2, i) * 1000; // 指数バックオフ
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

## コスト管理

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "Hello!",
});

// トークン使用量を取得
console.log(result.usage);
// { promptTokens: 10, completionTokens: 20, totalTokens: 30 }

// コスト計算（例）
const COST_PER_1K_PROMPT = 0.005;
const COST_PER_1K_COMPLETION = 0.015;

const cost =
  (result.usage.promptTokens / 1000) * COST_PER_1K_PROMPT +
  (result.usage.completionTokens / 1000) * COST_PER_1K_COMPLETION;

console.log(`Cost: $${cost.toFixed(4)}`);
```

## 次のステップ

次章では、ベストプラクティスについて詳しく学びます。
