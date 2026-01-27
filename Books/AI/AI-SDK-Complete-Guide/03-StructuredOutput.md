# 第3章: 構造化出力

## generateObject

Zod スキーマを使って型安全な出力を生成。

```
┌─────────────────────────────────────────────────────┐
│              Structured Output                       │
│                                                     │
│  Prompt: "東京について教えて"                        │
│                   │                                 │
│                   ▼                                 │
│  Schema: z.object({                                │
│    name: z.string(),                               │
│    population: z.number(),                         │
│    attractions: z.array(z.string()),               │
│  })                                                │
│                   │                                 │
│                   ▼                                 │
│  Output: {                                         │
│    name: "東京",                                    │
│    population: 14000000,                           │
│    attractions: ["東京タワー", "浅草寺", ...]      │
│  }                                                 │
└─────────────────────────────────────────────────────┘
```

## 基本的な使い方

```typescript
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const result = await generateObject({
  model: openai("gpt-4o"),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(
        z.object({
          name: z.string(),
          amount: z.string(),
        }),
      ),
      steps: z.array(z.string()),
    }),
  }),
  prompt: "カレーのレシピを教えてください。",
});

console.log(result.object.recipe.name);
// カレーライス

console.log(result.object.recipe.ingredients);
// [{ name: "玉ねぎ", amount: "2個" }, ...]
```

## スキーマの定義

### 基本型

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
  isActive: z.boolean(),
  tags: z.array(z.string()),
});
```

### オプショナルと説明

```typescript
const schema = z.object({
  title: z.string().describe("記事のタイトル"),
  summary: z.string().describe("100文字以内の要約"),
  category: z.enum(["tech", "business", "lifestyle"]).describe("カテゴリー"),
  publishDate: z.string().optional().describe("公開日（任意）"),
});
```

### ネストした構造

```typescript
const schema = z.object({
  company: z.object({
    name: z.string(),
    founded: z.number(),
    ceo: z.object({
      name: z.string(),
      age: z.number().optional(),
    }),
    products: z.array(
      z.object({
        name: z.string(),
        price: z.number(),
        category: z.string(),
      }),
    ),
  }),
});
```

### Enum

```typescript
const schema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string()).max(5),
});

const result = await generateObject({
  model: openai("gpt-4o"),
  schema,
  prompt: "この文章の感情を分析してください: 今日は素晴らしい一日でした！",
});

console.log(result.object);
// { sentiment: "positive", confidence: 0.95, keywords: ["素晴らしい", "一日"] }
```

## streamObject

ストリーミングで構造化データを生成。

```typescript
import { streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const result = streamObject({
  model: openai("gpt-4o"),
  schema: z.object({
    characters: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    ),
  }),
  prompt: "ファンタジー小説のキャラクターを5人作成してください。",
});

for await (const partialObject of result.partialObjectStream) {
  console.log(partialObject);
  // { characters: [{ name: "...", description: "..." }, ...] }
  // 徐々に完成していく
}

const finalObject = await result.object;
```

## 実用例

### データ抽出

```typescript
const extractionSchema = z.object({
  people: z.array(
    z.object({
      name: z.string(),
      role: z.string().optional(),
      organization: z.string().optional(),
    }),
  ),
  dates: z.array(
    z.object({
      date: z.string(),
      event: z.string(),
    }),
  ),
  locations: z.array(z.string()),
});

const result = await generateObject({
  model: openai("gpt-4o"),
  schema: extractionSchema,
  prompt: `以下の文章から情報を抽出してください:
    2024年4月、田中社長がApple本社を訪問し、
    クック氏と新製品について議論しました。`,
});
```

### 分類

```typescript
const classificationSchema = z.object({
  category: z.enum(["bug", "feature", "question", "documentation"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  labels: z.array(z.string()),
  suggestedAssignee: z.string().optional(),
});

const result = await generateObject({
  model: openai("gpt-4o"),
  schema: classificationSchema,
  system: "あなたはGitHub IssueのトリアージAIです。",
  prompt: `Issue: アプリがクラッシュする
    ログインボタンを押すとアプリが強制終了します。
    iPhone 15 Pro, iOS 17.4`,
});

// { category: "bug", priority: "high", labels: ["crash", "ios", "auth"], ... }
```

### 要約

```typescript
const summarySchema = z.object({
  title: z.string().describe("5語以内のタイトル"),
  summary: z.string().describe("50語以内の要約"),
  keyPoints: z.array(z.string()).max(5).describe("重要なポイント"),
  sentiment: z.enum(["positive", "negative", "neutral"]),
});

const result = await generateObject({
  model: openai("gpt-4o"),
  schema: summarySchema,
  prompt: `以下の記事を要約してください: ${articleContent}`,
});
```

## output オプション

### object（デフォルト）

```typescript
const result = await generateObject({
  model: openai("gpt-4o"),
  output: "object",
  schema: z.object({ ... }),
  prompt: "...",
});
```

### array

```typescript
const result = await generateObject({
  model: openai("gpt-4o"),
  output: "array",
  schema: z.object({
    name: z.string(),
    description: z.string(),
  }),
  prompt: "プログラミング言語を5つ挙げてください。",
});

// result.object は配列
// [{ name: "JavaScript", ... }, ...]
```

### enum

```typescript
const result = await generateObject({
  model: openai("gpt-4o"),
  output: "enum",
  enum: ["positive", "negative", "neutral"],
  prompt: "この文章の感情は？: 今日は最悪だった。",
});

// result.object = "negative"
```

## 次のステップ

次章では、ツール呼び出しについて詳しく学びます。
