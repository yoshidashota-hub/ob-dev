# 第6章: ベストプラクティス

## プロジェクト構成

```
src/
├── lib/
│   └── ai/
│       ├── index.ts        # エクスポート
│       ├── client.ts       # AI クライアント設定
│       ├── tools.ts        # ツール定義
│       └── prompts.ts      # プロンプトテンプレート
├── app/
│   └── api/
│       └── chat/
│           └── route.ts    # API Route
└── components/
    └── chat/
        ├── Chat.tsx        # チャット UI
        └── Message.tsx     # メッセージコンポーネント
```

## AI クライアントの設定

```typescript
// lib/ai/client.ts
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

export type ModelProvider = "openai" | "anthropic";

const models = {
  openai: {
    default: openai("gpt-4o"),
    fast: openai("gpt-4o-mini"),
    embedding: openai.embedding("text-embedding-3-small"),
  },
  anthropic: {
    default: anthropic("claude-3-5-sonnet-20241022"),
    fast: anthropic("claude-3-5-haiku-20241022"),
  },
} as const;

export function getModel(
  provider: ModelProvider = "openai",
  type: "default" | "fast" = "default"
) {
  return models[provider][type];
}
```

## プロンプト管理

```typescript
// lib/ai/prompts.ts

// システムプロンプト
export const systemPrompts = {
  assistant: `あなたは親切で知識豊富なアシスタントです。
常に丁寧な日本語で回答してください。`,

  codeReviewer: `あなたは経験豊富なソフトウェアエンジニアです。
コードレビューを行い、改善点を指摘してください。
- バグの可能性
- パフォーマンスの問題
- セキュリティの懸念
- 可読性の改善`,

  translator: `あなたはプロの翻訳者です。
自然で流暢な翻訳を提供してください。`,
};

// プロンプトテンプレート
export function createPrompt(
  template: string,
  variables: Record<string, string>
): string {
  return Object.entries(variables).reduce(
    (prompt, [key, value]) => prompt.replace(`{{${key}}}`, value),
    template
  );
}

// 使用例
const reviewPrompt = createPrompt(
  "以下のコードをレビューしてください:\n\n```{{language}}\n{{code}}\n```",
  { language: "typescript", code: "const x = 1;" }
);
```

## エラーハンドリング

```typescript
// lib/ai/errors.ts
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "AIError";
  }
}

export function handleAIError(error: unknown): AIError {
  if (error instanceof Error) {
    // Rate limit
    if (error.message.includes("rate_limit")) {
      return new AIError("Rate limit exceeded", "RATE_LIMIT", true);
    }
    // Token limit
    if (error.message.includes("context_length")) {
      return new AIError("Context too long", "CONTEXT_LENGTH", false);
    }
    // API error
    if (error.message.includes("API")) {
      return new AIError("API error", "API_ERROR", true);
    }
  }
  return new AIError("Unknown error", "UNKNOWN", false);
}
```

```typescript
// 使用例
import { generateText } from "ai";
import { handleAIError, AIError } from "./errors";

async function safeGenerate(prompt: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await generateText({
        model: getModel(),
        prompt,
      });
      return result.text;
    } catch (error) {
      const aiError = handleAIError(error);

      if (!aiError.retryable || i === maxRetries - 1) {
        throw aiError;
      }

      // 指数バックオフ
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new AIError("Max retries exceeded", "MAX_RETRIES", false);
}
```

## Next.js API Route

```typescript
// app/api/chat/route.ts
import { streamText } from "ai";
import { getModel } from "@/lib/ai/client";
import { systemPrompts } from "@/lib/ai/prompts";
import { handleAIError } from "@/lib/ai/errors";

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt = "assistant" } = await req.json();

    // 入力バリデーション
    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages", { status: 400 });
    }

    const result = streamText({
      model: getModel(),
      system: systemPrompts[systemPrompt as keyof typeof systemPrompts],
      messages,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    const aiError = handleAIError(error);
    return new Response(aiError.message, {
      status: aiError.code === "RATE_LIMIT" ? 429 : 500,
    });
  }
}
```

## クライアントコンポーネント

```typescript
// components/chat/Chat.tsx
"use client";

import { useChat } from "ai/react";
import { useState } from "react";

export function Chat() {
  const [systemPrompt, setSystemPrompt] = useState("assistant");

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
  } = useChat({
    api: "/api/chat",
    body: { systemPrompt },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  return (
    <div className="flex flex-col h-screen">
      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700">
          エラーが発生しました。
          <button onClick={() => reload()} className="ml-2 underline">
            再試行
          </button>
        </div>
      )}

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="メッセージを入力..."
            disabled={isLoading}
            className="flex-1 p-2 border rounded"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              停止
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              送信
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
```

## セキュリティ

### API キーの保護

```typescript
// ✅ サーバーサイドでのみ使用
// app/api/chat/route.ts
import { openai } from "@ai-sdk/openai"; // 自動的に環境変数を読む

// ❌ クライアントに露出しない
// "use client" ファイルで直接使用しない
```

### 入力のサニタイズ

```typescript
// lib/ai/sanitize.ts
export function sanitizeInput(input: string): string {
  // 基本的なサニタイズ
  return input
    .trim()
    .slice(0, 10000) // 最大文字数
    .replace(/\x00/g, ""); // NULL バイト除去
}

export function validateMessages(messages: unknown): boolean {
  if (!Array.isArray(messages)) return false;

  return messages.every(
    (msg) =>
      typeof msg === "object" &&
      msg !== null &&
      ["user", "assistant", "system"].includes(msg.role) &&
      typeof msg.content === "string"
  );
}
```

### レート制限

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/chat")) {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const now = Date.now();
    const windowMs = 60 * 1000; // 1分
    const maxRequests = 20;

    const rateLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - rateLimit.lastReset > windowMs) {
      rateLimit.count = 0;
      rateLimit.lastReset = now;
    }

    rateLimit.count++;
    rateLimitMap.set(ip, rateLimit);

    if (rateLimit.count > maxRequests) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  return NextResponse.next();
}
```

## パフォーマンス

### ストリーミングの活用

```typescript
// ✅ ストリーミング（UX 向上）
const result = streamText({
  model: openai("gpt-4o"),
  prompt: "長い文章を生成",
});

// ❌ 非ストリーミング（全完了まで待機）
const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "長い文章を生成",
});
```

### 適切なモデル選択

```typescript
// 高速・低コスト（簡単なタスク）
openai("gpt-4o-mini");
anthropic("claude-3-5-haiku-20241022");

// 高品質（複雑なタスク）
openai("gpt-4o");
anthropic("claude-3-5-sonnet-20241022");
```

### キャッシング

```typescript
// lib/ai/cache.ts
const cache = new Map<string, { result: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分

export async function cachedGenerate(
  prompt: string,
  generator: () => Promise<string>
): Promise<string> {
  const cacheKey = prompt;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const result = await generator();
  cache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}
```

## テスト

### モックの作成

```typescript
// __mocks__/ai.ts
export const generateText = jest.fn().mockResolvedValue({
  text: "Mocked response",
  usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
});

export const streamText = jest.fn().mockReturnValue({
  textStream: (async function* () {
    yield "Hello ";
    yield "World";
  })(),
});
```

### テストコード

```typescript
// __tests__/chat.test.ts
import { generateText } from "ai";

jest.mock("ai");

describe("Chat", () => {
  it("should generate response", async () => {
    const result = await generateText({
      model: {} as any,
      prompt: "Hello",
    });

    expect(result.text).toBe("Mocked response");
  });
});
```

## 監視とログ

```typescript
// lib/ai/monitoring.ts
interface AIMetrics {
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  model: string;
  success: boolean;
}

export async function withMonitoring<T>(
  operation: () => Promise<T>,
  metadata: { model: string }
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operation();
    const latencyMs = Date.now() - startTime;

    // メトリクス送信（例: DataDog, CloudWatch）
    console.log("AI Metrics:", {
      ...metadata,
      latencyMs,
      success: true,
    });

    return result;
  } catch (error) {
    console.error("AI Error:", {
      ...metadata,
      error: error instanceof Error ? error.message : "Unknown",
      success: false,
    });
    throw error;
  }
}
```

## まとめ

### チェックリスト

```
□ プロジェクト構成を整理
□ プロンプトを外部ファイルで管理
□ エラーハンドリングとリトライ
□ 入力バリデーション
□ レート制限
□ 適切なモデル選択
□ ストリーミングの活用
□ テストの作成
□ 監視とログの設定
```

### 参考リンク

- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Anthropic API Reference](https://docs.anthropic.com/claude/reference)
