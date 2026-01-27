# 第1章: セットアップ

## AI SDK とは

Vercel が開発した AI アプリケーション構築用 SDK。

```
┌─────────────────────────────────────────────────────┐
│                   AI SDK                             │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              Your Application               │   │
│  └─────────────────────────────────────────────┘   │
│                        │                           │
│                        ▼                           │
│  ┌─────────────────────────────────────────────┐   │
│  │               AI SDK Core                    │   │
│  │  - generateText                              │   │
│  │  - streamText                                │   │
│  │  - generateObject                            │   │
│  │  - Tool Calling                              │   │
│  └─────────────────────────────────────────────┘   │
│                        │                           │
│         ┌──────────────┼──────────────┐           │
│         ▼              ▼              ▼           │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐     │
│  │  OpenAI   │  │ Anthropic │  │  Google   │     │
│  └───────────┘  └───────────┘  └───────────┘     │
└─────────────────────────────────────────────────────┘
```

## インストール

```bash
# Core パッケージ
npm install ai

# プロバイダー（使用するものをインストール）
npm install @ai-sdk/openai
npm install @ai-sdk/anthropic
npm install @ai-sdk/google
```

## 環境変数

```env
# .env.local

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## プロバイダーの設定

### OpenAI

```typescript
import { openai } from "@ai-sdk/openai";

const model = openai("gpt-4o");
```

### Anthropic

```typescript
import { anthropic } from "@ai-sdk/anthropic";

const model = anthropic("claude-3-5-sonnet-20241022");
```

### Google

```typescript
import { google } from "@ai-sdk/google";

const model = google("gemini-1.5-pro");
```

## 最初のリクエスト

### generateText

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "日本の首都は？",
});

console.log(result.text);
// 東京です。
```

### システムプロンプト

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  system: "あなたは親切な日本語アシスタントです。",
  prompt: "自己紹介してください。",
});
```

### メッセージ形式

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  messages: [
    { role: "system", content: "あなたは親切なアシスタントです。" },
    { role: "user", content: "こんにちは" },
    { role: "assistant", content: "こんにちは！何かお手伝いできることはありますか？" },
    { role: "user", content: "天気について教えて" },
  ],
});
```

## Next.js との統合

### API Route

```typescript
// app/api/chat/route.ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = await generateText({
    model: openai("gpt-4o"),
    prompt,
  });

  return NextResponse.json({ text: result.text });
}
```

### クライアント

```typescript
// app/page.tsx
"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input }),
    });
    const data = await res.json();
    setResponse(data.text);
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={handleSubmit}>送信</button>
      <p>{response}</p>
    </div>
  );
}
```

## モデルのオプション

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "...",

  // 温度（創造性）0-2
  temperature: 0.7,

  // 最大トークン数
  maxTokens: 1000,

  // Top P
  topP: 0.9,

  // 停止シーケンス
  stopSequences: ["END"],

  // シード（再現性）
  seed: 12345,
});
```

## レスポンスの詳細

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "Hello",
});

// テキスト
console.log(result.text);

// 使用トークン
console.log(result.usage);
// { promptTokens: 10, completionTokens: 20, totalTokens: 30 }

// 終了理由
console.log(result.finishReason);
// "stop" | "length" | "tool-calls" | ...

// 生のレスポンス
console.log(result.response);
```

## 次のステップ

次章では、ストリーミングについて詳しく学びます。
