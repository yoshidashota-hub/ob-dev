# 第4章: ツール呼び出し

## ツールとは

LLM が外部の関数を呼び出す仕組み。

```
┌─────────────────────────────────────────────────────┐
│                Tool Calling Flow                     │
│                                                     │
│  User: "東京の天気は？"                              │
│           │                                         │
│           ▼                                         │
│  ┌─────────────┐                                   │
│  │    LLM      │ → "getWeather を呼び出す必要あり"  │
│  └─────────────┘                                   │
│           │                                         │
│           ▼                                         │
│  ┌─────────────┐                                   │
│  │ getWeather  │ → { location: "東京" }            │
│  └─────────────┘                                   │
│           │                                         │
│           ▼                                         │
│  Tool Result: { temp: 22, condition: "晴れ" }       │
│           │                                         │
│           ▼                                         │
│  LLM: "東京は22度で晴れています"                    │
└─────────────────────────────────────────────────────┘
```

## 基本的な使い方

```typescript
import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const result = await generateText({
  model: openai("gpt-4o"),
  tools: {
    getWeather: tool({
      description: "指定された都市の天気を取得します",
      parameters: z.object({
        city: z.string().describe("都市名"),
      }),
      execute: async ({ city }) => {
        // 実際の API 呼び出し
        const weather = await fetchWeather(city);
        return weather;
      },
    }),
  },
  prompt: "東京の天気を教えてください。",
});

console.log(result.text);
// 東京は現在22度で晴れています。
```

## 複数のツール

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  tools: {
    getWeather: tool({
      description: "天気を取得",
      parameters: z.object({
        city: z.string(),
      }),
      execute: async ({ city }) => {
        return { temp: 22, condition: "晴れ" };
      },
    }),
    searchWeb: tool({
      description: "Web検索を実行",
      parameters: z.object({
        query: z.string(),
      }),
      execute: async ({ query }) => {
        return { results: ["結果1", "結果2"] };
      },
    }),
    calculator: tool({
      description: "計算を実行",
      parameters: z.object({
        expression: z.string(),
      }),
      execute: async ({ expression }) => {
        return { result: eval(expression) };
      },
    }),
  },
  prompt: "東京の天気と、2+2の計算結果を教えて",
});
```

## ツール呼び出しの詳細

### toolCall の取得

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  tools: {
    getWeather: tool({
      description: "天気を取得",
      parameters: z.object({
        city: z.string(),
      }),
      execute: async ({ city }) => ({ temp: 22 }),
    }),
  },
  prompt: "東京の天気は？",
});

// ツール呼び出しの詳細
console.log(result.toolCalls);
// [{ toolName: "getWeather", args: { city: "東京" } }]

// ツール実行結果
console.log(result.toolResults);
// [{ toolName: "getWeather", result: { temp: 22 } }]
```

### maxSteps（複数ステップ）

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  tools: {
    getWeather: tool({...}),
    getRecommendation: tool({...}),
  },
  maxSteps: 5,  // 最大5回のツール呼び出し
  prompt: "東京の天気を調べて、服装のアドバイスをください",
});

// 複数ステップの結果
console.log(result.steps);
// [
//   { toolCalls: [...], toolResults: [...] },
//   { toolCalls: [...], toolResults: [...] },
//   { text: "..." }
// ]
```

## ストリーミングでのツール呼び出し

```typescript
import { streamText, tool } from "ai";

const result = streamText({
  model: openai("gpt-4o"),
  tools: {
    getWeather: tool({
      description: "天気を取得",
      parameters: z.object({
        city: z.string(),
      }),
      execute: async ({ city }) => ({ temp: 22, condition: "晴れ" }),
    }),
  },
  prompt: "東京の天気は？",
});

for await (const event of result.fullStream) {
  switch (event.type) {
    case "tool-call":
      console.log("Tool called:", event.toolName, event.args);
      break;
    case "tool-result":
      console.log("Tool result:", event.result);
      break;
    case "text-delta":
      process.stdout.write(event.textDelta);
      break;
  }
}
```

## Next.js でのツール呼び出し

### API Route

```typescript
// app/api/chat/route.ts
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    tools: {
      getStockPrice: tool({
        description: "株価を取得",
        parameters: z.object({
          symbol: z.string().describe("株式シンボル"),
        }),
        execute: async ({ symbol }) => {
          const price = await fetchStockPrice(symbol);
          return { symbol, price };
        },
      }),
    },
    messages,
  });

  return result.toDataStreamResponse();
}
```

### クライアント

```typescript
"use client";

import { useChat } from "ai/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <strong>{message.role}:</strong>
          {message.content}

          {/* ツール呼び出しの表示 */}
          {message.toolInvocations?.map((tool) => (
            <div key={tool.toolCallId}>
              <p>Tool: {tool.toolName}</p>
              <p>Args: {JSON.stringify(tool.args)}</p>
              {tool.state === "result" && (
                <p>Result: {JSON.stringify(tool.result)}</p>
              )}
            </div>
          ))}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">送信</button>
      </form>
    </div>
  );
}
```

## 人間の確認を挟む

```typescript
// app/api/chat/route.ts
import { streamText, tool } from "ai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    tools: {
      sendEmail: tool({
        description: "メールを送信",
        parameters: z.object({
          to: z.string(),
          subject: z.string(),
          body: z.string(),
        }),
        // execute を定義しない → 自動実行されない
      }),
    },
    messages,
  });

  return result.toDataStreamResponse();
}
```

```typescript
// クライアント側で確認
"use client";

import { useChat } from "ai/react";

export default function Chat() {
  const { messages, addToolResult } = useChat();

  const handleApprove = (toolCallId: string, args: any) => {
    // 承認後に実行
    sendEmail(args).then((result) => {
      addToolResult({ toolCallId, result });
    });
  };

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.toolInvocations?.map((tool) => {
            if (tool.state === "call" && tool.toolName === "sendEmail") {
              return (
                <div key={tool.toolCallId}>
                  <p>メールを送信しますか？</p>
                  <p>宛先: {tool.args.to}</p>
                  <button onClick={() => handleApprove(tool.toolCallId, tool.args)}>
                    承認
                  </button>
                </div>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
}
```

## 実用例

### データベース検索

```typescript
const tools = {
  searchProducts: tool({
    description: "商品を検索",
    parameters: z.object({
      query: z.string().describe("検索キーワード"),
      category: z.enum(["electronics", "clothing", "food"]).optional(),
      maxPrice: z.number().optional(),
    }),
    execute: async ({ query, category, maxPrice }) => {
      const products = await db.product.findMany({
        where: {
          name: { contains: query },
          category: category,
          price: maxPrice ? { lte: maxPrice } : undefined,
        },
        take: 10,
      });
      return products;
    },
  }),

  getProductDetails: tool({
    description: "商品の詳細を取得",
    parameters: z.object({
      productId: z.string(),
    }),
    execute: async ({ productId }) => {
      return await db.product.findUnique({
        where: { id: productId },
        include: { reviews: true },
      });
    },
  }),
};
```

### 外部 API 連携

```typescript
const tools = {
  translateText: tool({
    description: "テキストを翻訳",
    parameters: z.object({
      text: z.string(),
      targetLanguage: z.enum(["en", "ja", "zh", "ko"]),
    }),
    execute: async ({ text, targetLanguage }) => {
      const response = await fetch("https://api.translation.com/translate", {
        method: "POST",
        body: JSON.stringify({ text, target: targetLanguage }),
      });
      return response.json();
    },
  }),

  sendSlackMessage: tool({
    description: "Slack にメッセージを送信",
    parameters: z.object({
      channel: z.string(),
      message: z.string(),
    }),
    execute: async ({ channel, message }) => {
      await slack.chat.postMessage({
        channel,
        text: message,
      });
      return { success: true };
    },
  }),
};
```

## エラーハンドリング

```typescript
const tools = {
  riskyOperation: tool({
    description: "失敗する可能性のある操作",
    parameters: z.object({
      input: z.string(),
    }),
    execute: async ({ input }) => {
      try {
        const result = await performOperation(input);
        return { success: true, data: result };
      } catch (error) {
        // エラーを返す（LLM が対処法を考える）
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  }),
};
```

## 次のステップ

次章では、プロバイダーについて詳しく学びます。
