# 第0章: はじめに

## Vercel AI SDK とは

Vercel AI SDK は、Web アプリケーションに AI 機能を統合するためのライブラリです。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                    Your Application                  │
│  ┌─────────────────────────────────────────────┐   │
│  │              AI SDK Core                     │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │generate │  │ stream  │  │  tools  │     │   │
│  │  │ Text    │  │ Text    │  │         │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘     │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │              AI SDK UI                       │   │
│  │  ┌─────────┐  ┌─────────┐                   │   │
│  │  │ useChat │  │useComple│                   │   │
│  │  │         │  │  tion   │                   │   │
│  │  └─────────┘  └─────────┘                   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────┐   ┌───────────┐   ┌───────────┐
│ @ai-sdk/  │   │ @ai-sdk/  │   │ @ai-sdk/  │
│ anthropic │   │  openai   │   │  google   │
└───────────┘   └───────────┘   └───────────┘
```

## セットアップ

```bash
# コアパッケージ
npm install ai

# プロバイダー（使用するものを選択）
npm install @ai-sdk/anthropic
npm install @ai-sdk/openai
npm install @ai-sdk/google
```

### 環境変数

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## クイックスタート

### テキスト生成

```typescript
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const { text } = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  prompt: 'TypeScript の利点を3つ挙げてください',
})

console.log(text)
```

### ストリーミング

```typescript
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  prompt: 'Next.js について説明してください',
})

for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}
```

### 構造化出力

```typescript
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const { object } = await generateObject({
  model: anthropic('claude-sonnet-4-20250514'),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
  }),
  prompt: 'TypeScript の学習ガイドを作成してください',
})

console.log(object.title)
console.log(object.tags)
```

## Next.js との統合

### Route Handler

```typescript
// app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages,
  })

  return result.toDataStreamResponse()
}
```

### React Component

```typescript
// app/chat/page.tsx
'use client'

import { useChat } from 'ai/react'

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button type="submit">送信</button>
      </form>
    </div>
  )
}
```

## プロバイダーの選択

| プロバイダー | モデル | 特徴 |
|------------|-------|------|
| Anthropic | Claude 3.5 | 長文理解、コード生成 |
| OpenAI | GPT-4o | 汎用性、マルチモーダル |
| Google | Gemini | 高速、コスト効率 |

## 次のステップ

次章では、テキスト生成の詳細なオプションと使い方を学びます。
