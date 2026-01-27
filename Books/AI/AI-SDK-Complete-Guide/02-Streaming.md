# 第2章: ストリーミング

## ストリーミングとは

レスポンスをリアルタイムで受信する仕組み。

```
┌─────────────────────────────────────────────────────┐
│                 Streaming Flow                       │
│                                                     │
│  Request                                            │
│  ────────▶  LLM                                    │
│                                                     │
│  Response (streaming)                               │
│  こ◀────────                                       │
│  こん◀─────────                                    │
│  こんにち◀──────────                               │
│  こんにちは◀───────────                            │
│                                                     │
│  完了までの時間: 通常より短い体感時間               │
└─────────────────────────────────────────────────────┘
```

## streamText

### 基本

```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = streamText({
  model: openai("gpt-4o"),
  prompt: "長い物語を書いてください。",
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### 全てのイベント

```typescript
const result = streamText({
  model: openai("gpt-4o"),
  prompt: "...",
});

for await (const event of result.fullStream) {
  switch (event.type) {
    case "text-delta":
      console.log("Text:", event.textDelta);
      break;
    case "tool-call":
      console.log("Tool call:", event.toolName);
      break;
    case "finish":
      console.log("Finished:", event.finishReason);
      break;
  }
}
```

## Next.js でのストリーミング

### API Route

```typescript
// app/api/chat/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
  });

  return result.toDataStreamResponse();
}
```

### クライアント（useChat）

```typescript
// app/page.tsx
"use client";

import { useChat } from "ai/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div>
      {/* メッセージ表示 */}
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          placeholder="メッセージを入力..."
        />
        <button type="submit" disabled={isLoading}>
          送信
        </button>
      </form>
    </div>
  );
}
```

## useChat の詳細

### オプション

```typescript
const {
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  reload, // 最後のメッセージを再生成
  stop, // ストリーミングを停止
  setMessages, // メッセージを手動で設定
  append, // メッセージを追加
} = useChat({
  api: "/api/chat",
  initialMessages: [{ id: "1", role: "assistant", content: "こんにちは！" }],
  onFinish: (message) => {
    console.log("完了:", message);
  },
  onError: (error) => {
    console.error("エラー:", error);
  },
  body: {
    // 追加のデータを送信
    userId: "user_123",
  },
  headers: {
    Authorization: "Bearer ...",
  },
});
```

### システムプロンプト

```typescript
// API Route
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: "あなたは親切な日本語アシスタントです。",
    messages,
  });

  return result.toDataStreamResponse();
}
```

## useCompletion

単一のテキスト補完用。

```typescript
"use client";

import { useCompletion } from "ai/react";

export default function Completion() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useCompletion({
    api: "/api/completion",
  });

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
        />
        <button type="submit">生成</button>
      </form>
      <p>{completion}</p>
    </div>
  );
}
```

```typescript
// app/api/completion/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    prompt,
  });

  return result.toDataStreamResponse();
}
```

## ストリーミングの結果を待つ

```typescript
const result = streamText({
  model: openai("gpt-4o"),
  prompt: "...",
});

// ストリーミング中に処理
for await (const chunk of result.textStream) {
  console.log(chunk);
}

// 完了後のデータにアクセス
const finalText = await result.text;
const usage = await result.usage;
const finishReason = await result.finishReason;
```

## Server-Sent Events (SSE)

```typescript
// 手動でSSEを扱う場合
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
  });

  return new Response(result.toDataStream(), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

## エラーハンドリング

```typescript
const { messages, error, isLoading } = useChat({
  onError: (error) => {
    console.error("Chat error:", error);
  },
});

if (error) {
  return <div>エラーが発生しました: {error.message}</div>;
}
```

## 次のステップ

次章では、構造化出力について詳しく学びます。
