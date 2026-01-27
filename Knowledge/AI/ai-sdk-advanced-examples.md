# AI SDK 高度なサンプル集

## ツール呼び出し (Function Calling)

```typescript
// app/api/assistant/route.ts
import { generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    tools: {
      // 天気取得ツール
      getWeather: tool({
        description: "Get current weather for a location",
        parameters: z.object({
          location: z.string().describe("City name"),
          unit: z.enum(["celsius", "fahrenheit"]).optional(),
        }),
        execute: async ({ location, unit = "celsius" }) => {
          // 実際のAPIコール
          const response = await fetch(
            `https://api.weather.com/v1/current?city=${location}&unit=${unit}`,
          );
          return response.json();
        },
      }),

      // データベース検索ツール
      searchDatabase: tool({
        description: "Search for information in the database",
        parameters: z.object({
          query: z.string().describe("Search query"),
          table: z.enum(["users", "posts", "comments"]),
          limit: z.number().default(10),
        }),
        execute: async ({ query, table, limit }) => {
          const results = await prisma[table].findMany({
            where: { OR: [{ title: { contains: query } }] },
            take: limit,
          });
          return results;
        },
      }),

      // 計算ツール
      calculate: tool({
        description: "Perform mathematical calculations",
        parameters: z.object({
          expression: z.string().describe("Math expression to evaluate"),
        }),
        execute: async ({ expression }) => {
          // 安全な評価（実際は math.js などを使用）
          const result = eval(expression);
          return { result };
        },
      }),
    },
    toolChoice: "auto", // 'auto' | 'required' | 'none' | { type: 'tool', toolName: '...' }
    prompt,
  });

  return Response.json({
    text: result.text,
    toolCalls: result.toolCalls,
    toolResults: result.toolResults,
  });
}
```

## マルチモーダル（画像分析）

```typescript
// app/api/analyze-image/route.ts
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(req: Request) {
  const formData = await req.formData();
  const image = formData.get("image") as File;
  const prompt = formData.get("prompt") as string;

  const imageBuffer = await image.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");

  const result = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: `data:${image.type};base64,${base64Image}`,
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  return Response.json({ analysis: result.text });
}
```

## ストリーミング UI

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages,
    temperature: 0.7,
    maxTokens: 4096,
  });

  return result.toDataStreamResponse();
}

// Client Component
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export function ChatInterface() {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');

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
    api: '/api/chat',
    body: { systemPrompt },
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: (message) => {
      console.log('Response finished:', message);
    },
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <span className="inline-block p-2 rounded bg-gray-100">
              {m.content}
            </span>
          </div>
        ))}
        {isLoading && <div>AI is thinking...</div>}
        {error && (
          <div className="text-red-500">
            Error: {error.message}
            <button onClick={reload}>Retry</button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Send
          </button>
          {isLoading && (
            <button onClick={stop} className="px-4 py-2 bg-red-500 text-white rounded">
              Stop
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
```

## RAG 実装

```typescript
// lib/rag.ts
import { generateText, embed } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

interface RAGOptions {
  question: string;
  topK?: number;
  threshold?: number;
}

export async function queryWithRAG({
  question,
  topK = 5,
  threshold = 0.7,
}: RAGOptions) {
  // 1. 質問を埋め込みベクトルに変換
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: question,
  });

  // 2. 類似ドキュメントを検索
  const { data: documents, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: topK,
  });

  if (error) throw error;

  // 3. コンテキストを構築
  const context = documents
    .map((doc: any, i: number) => `[${i + 1}] ${doc.content}`)
    .join("\n\n");

  // 4. LLM で回答生成
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are a helpful assistant. Answer questions based on the provided context.
If the answer cannot be found in the context, say so.

Context:
${context}`,
    prompt: question,
    temperature: 0.3,
  });

  return {
    answer: text,
    sources: documents.map((d: any) => ({
      content: d.content.slice(0, 200) + "...",
      metadata: d.metadata,
      similarity: d.similarity,
    })),
  };
}

// ドキュメントのインデックス化
export async function indexDocument(
  content: string,
  metadata: Record<string, any>,
) {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: content,
  });

  await supabase.from("documents").insert({
    content,
    embedding,
    metadata,
  });
}
```

## エージェント パターン

```typescript
// lib/agent.ts
import { generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

interface AgentStep {
  thought: string;
  action: string;
  actionInput: any;
  observation: string;
}

export async function runAgent(task: string, maxSteps = 10) {
  const steps: AgentStep[] = [];
  let currentTask = task;

  for (let i = 0; i < maxSteps; i++) {
    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: `You are a helpful AI agent. Think step by step to solve the task.
Previous steps: ${JSON.stringify(steps, null, 2)}`,
      tools: {
        search: tool({
          description: "Search the web for information",
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            // Web search implementation
            return `Search results for: ${query}`;
          },
        }),
        calculate: tool({
          description: "Perform calculations",
          parameters: z.object({ expression: z.string() }),
          execute: async ({ expression }) => {
            return { result: eval(expression) };
          },
        }),
        finish: tool({
          description: "Complete the task and return the final answer",
          parameters: z.object({ answer: z.string() }),
          execute: async ({ answer }) => {
            return { done: true, answer };
          },
        }),
      },
      prompt: currentTask,
    });

    // ツール呼び出しがあれば実行
    if (result.toolCalls?.length) {
      const toolCall = result.toolCalls[0];
      const toolResult = result.toolResults?.[0];

      steps.push({
        thought: result.text || "",
        action: toolCall.toolName,
        actionInput: toolCall.args,
        observation: JSON.stringify(toolResult?.result),
      });

      // finish ツールが呼ばれたら終了
      if (toolCall.toolName === "finish") {
        return {
          answer: (toolResult?.result as any)?.answer,
          steps,
        };
      }
    } else {
      // ツール呼び出しがなければ終了
      return {
        answer: result.text,
        steps,
      };
    }
  }

  return {
    answer: "Max steps reached",
    steps,
  };
}
```

## エラーハンドリング

```typescript
import { generateText, APICallError } from "ai";

export async function safeGenerate(prompt: string) {
  try {
    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt,
    });
    return { success: true, text: result.text };
  } catch (error) {
    if (error instanceof APICallError) {
      // API エラー
      if (error.statusCode === 429) {
        return {
          success: false,
          error: "Rate limited. Please try again later.",
        };
      }
      if (error.statusCode === 401) {
        return { success: false, error: "Invalid API key." };
      }
    }

    console.error("Generation error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
```
