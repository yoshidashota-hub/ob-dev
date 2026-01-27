# Vercel AI SDK 学習ノート

## 概要

Vercel AI SDK は、AI アプリケーションを構築するためのライブラリ。ストリーミング、ツール呼び出し、マルチモーダル対応。

## セットアップ

```bash
npm install ai @ai-sdk/anthropic @ai-sdk/openai
```

## Core API

### generateText

```typescript
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const { text } = await generateText({
  model: anthropic("claude-sonnet-4-20250514"),
  prompt: "What is TypeScript?",
});

console.log(text);
```

### generateObject（構造化出力）

```typescript
import { generateObject } from "ai";
import { z } from "zod";

const { object } = await generateObject({
  model: anthropic("claude-sonnet-4-20250514"),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      steps: z.array(z.string()),
    }),
  }),
  prompt: "Generate a recipe for chocolate cake",
});

console.log(object.recipe.name);
```

### streamText

```typescript
import { streamText } from "ai";

const result = streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  prompt: "Write a story about a robot",
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

## Next.js 統合

### Route Handler

```typescript
// app/api/chat/route.ts
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    messages,
  });

  return result.toDataStreamResponse();
}
```

### useChat Hook

```typescript
// app/chat/page.tsx
"use client";

import { useChat } from "ai/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Say something..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}
```

## ツール呼び出し

```typescript
import { generateText, tool } from "ai";
import { z } from "zod";

const result = await generateText({
  model: anthropic("claude-sonnet-4-20250514"),
  tools: {
    weather: tool({
      description: "Get the weather in a location",
      parameters: z.object({
        location: z.string().describe("The location to get weather for"),
      }),
      execute: async ({ location }) => {
        // 実際のAPIコール
        return { temperature: 20, condition: "sunny" };
      },
    }),
  },
  prompt: "What's the weather in Tokyo?",
});

console.log(result.text);
console.log(result.toolResults);
```

## マルチモーダル

```typescript
import { generateText } from "ai";

const result = await generateText({
  model: anthropic("claude-sonnet-4-20250514"),
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        { type: "image", image: imageBuffer },
      ],
    },
  ],
});
```

## RAG パターン

```typescript
import { embed, generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// 埋め込みベクトル生成
const { embedding } = await embed({
  model: openai.embedding("text-embedding-3-small"),
  value: "What is TypeScript?",
});

// ベクトル検索で関連ドキュメント取得
const relevantDocs = await vectorStore.search(embedding, { topK: 5 });

// コンテキスト付きで生成
const { text } = await generateText({
  model: anthropic("claude-sonnet-4-20250514"),
  system: `Use the following context to answer questions:
${relevantDocs.map((d) => d.content).join("\n\n")}`,
  prompt: userQuestion,
});
```

## エラーハンドリング

```typescript
import { APICallError, generateText } from "ai";

try {
  const result = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt: "Hello",
  });
} catch (error) {
  if (error instanceof APICallError) {
    console.error("API Error:", error.message);
    console.error("Status:", error.statusCode);
  }
}
```

## ストリーミング UI

```typescript
// app/api/completion/route.ts
import { streamText } from "ai";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt,
  });

  return result.toDataStreamResponse();
}

// Client
"use client";
import { useCompletion } from "ai/react";

export default function Completion() {
  const { completion, input, handleInputChange, handleSubmit } =
    useCompletion();

  return (
    <form onSubmit={handleSubmit}>
      <input value={input} onChange={handleInputChange} />
      <p>{completion}</p>
    </form>
  );
}
```

## ベストプラクティス

1. **ストリーミング活用**: UX向上のため積極的に使用
2. **構造化出力**: `generateObject` で型安全な出力
3. **エラーハンドリング**: レート制限等に対応
4. **キャッシュ活用**: 同一プロンプトの結果をキャッシュ
5. **コスト管理**: 使用量モニタリング

## 参考リソース

- [Vercel AI SDK ドキュメント](https://sdk.vercel.ai/docs)
- [AI SDK Examples](https://github.com/vercel/ai/tree/main/examples)
