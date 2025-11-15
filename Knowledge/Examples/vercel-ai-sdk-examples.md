# Vercel AI SDK 実装例

ストリーミング対応のAIチャットボットとテキスト生成の完全ガイド。

---

## 📋 目次

1. [概要](#概要)
2. [セットアップ](#セットアップ)
3. [基本的なチャット実装](#基本的なチャット実装)
4. [ストリーミング応答](#ストリーミング応答)
5. [テキスト生成](#テキスト生成)
6. [高度な使用例](#高度な使用例)
7. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### Vercel AI SDK とは

AIアプリケーションを簡単に構築するためのフレームワーク：
- **マルチモデル対応**: OpenAI、Anthropic、Google、Mistral など
- **ストリーミング**: リアルタイムでAIの応答を表示
- **React Hooks**: useChat、useCompletion で簡単実装
- **Edge Runtime**: 高速で低コストな実行環境

### 主な機能

- チャットボット（会話履歴付き）
- テキスト生成
- 関数呼び出し（Function Calling）
- マルチモーダル（画像入力）
- ストリーミング応答

---

## セットアップ

### 1. パッケージのインストール

```bash
# AI SDK Core
npm install ai

# Anthropic (Claude)
npm install @ai-sdk/anthropic

# OpenAI (GPT)
npm install @ai-sdk/openai

# Google (Gemini)
npm install @ai-sdk/google
```

### 2. 環境変数の設定

**ファイル**: `.env.local`

```bash
# Anthropic (推奨)
ANTHROPIC_API_KEY="sk-ant-xxxx"

# または OpenAI
OPENAI_API_KEY="sk-xxxx"

# または Google
GOOGLE_API_KEY="xxxx"
```

### 3. API キーの取得

#### Anthropic Claude

```
1. https://console.anthropic.com/ にアクセス
2. Settings → API Keys
3. "Create Key" をクリック
4. キーをコピー
```

#### OpenAI

```
1. https://platform.openai.com/api-keys にアクセス
2. "Create new secret key" をクリック
3. キーをコピー
```

---

## 基本的なチャット実装

### Chat API の作成

**ファイル**: `app/api/chat/route.ts`

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

// Edge Runtime で実行（高速・低コスト）
export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: 'You are a helpful assistant for a Next.js 16 sandbox application.',
    messages,
  });

  return result.toDataStreamResponse();
}
```

### チャットページの作成

**ファイル**: `app/ai-chat/page.tsx`

```typescript
'use client';

import { useChat } from 'ai/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">🤖 AI Chat</h1>

      <div className="bg-white rounded-lg shadow">
        {/* メッセージ表示エリア */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg">Start a conversation!</p>
              <p className="text-sm mt-2">
                Ask me anything about Next.js, React, or web development.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex space-x-4">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## ストリーミング応答

### ストリーミングの仕組み

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // ストリーミング応答を生成
  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
  });

  // ストリーミングレスポンスを返す
  return result.toDataStreamResponse();
}
```

### カスタムストリーミング処理

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
    onFinish: ({ text, usage }) => {
      // 生成完了時の処理
      console.log('Generated text:', text);
      console.log('Token usage:', usage);
    },
  });

  return result.toDataStreamResponse();
}
```

---

## テキスト生成

### useCompletion フックの使用

**ファイル**: `app/api/completion/route.ts`

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    prompt,
  });

  return result.toDataStreamResponse();
}
```

**ファイル**: `app/text-generation/page.tsx`

```typescript
'use client';

import { useCompletion } from 'ai/react';

export default function TextGenerationPage() {
  const { completion, input, handleInputChange, handleSubmit, isLoading } =
    useCompletion();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">✍️ Text Generation</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt
          </label>
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Enter your prompt..."
            rows={4}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {completion && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Result:</h2>
            <p className="whitespace-pre-wrap">{completion}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 高度な使用例

### 1. システムプロンプトのカスタマイズ

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: `You are a professional Japanese translator.
      - Translate English to natural Japanese
      - Keep technical terms in English when appropriate
      - Maintain the tone and style of the original text`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

### 2. 温度とトークン制限の設定

```typescript
const result = await streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  messages,
  temperature: 0.7, // 0-1: 低いほど決定的、高いほど創造的
  maxTokens: 1000, // 最大トークン数
  topP: 0.9, // Nucleus sampling
});
```

### 3. 複数モデルの使い分け

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  let selectedModel;
  switch (model) {
    case 'claude':
      selectedModel = anthropic('claude-3-5-sonnet-20241022');
      break;
    case 'gpt-4':
      selectedModel = openai('gpt-4-turbo');
      break;
    case 'gpt-3.5':
      selectedModel = openai('gpt-3.5-turbo');
      break;
    default:
      selectedModel = anthropic('claude-3-5-sonnet-20241022');
  }

  const result = await streamText({
    model: selectedModel,
    messages,
  });

  return result.toDataStreamResponse();
}
```

### 4. Function Calling（ツール使用）

```typescript
import { streamText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
    tools: {
      getWeather: tool({
        description: 'Get the weather for a location',
        parameters: z.object({
          location: z.string().describe('The location to get weather for'),
        }),
        execute: async ({ location }) => {
          // 実際の天気APIを呼び出す
          const weather = await fetchWeather(location);
          return weather;
        },
      }),
      searchDatabase: tool({
        description: 'Search the database for information',
        parameters: z.object({
          query: z.string().describe('The search query'),
        }),
        execute: async ({ query }) => {
          const results = await searchDB(query);
          return results;
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
```

### 5. 会話履歴の保存

```typescript
'use client';

import { useChat } from 'ai/react';
import { useEffect } from 'react';

export default function ChatWithHistory() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    id: 'persistent-chat', // チャット ID
    onFinish: (message) => {
      // メッセージを保存
      saveChatHistory(message);
    },
  });

  // ローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('chat-messages', JSON.stringify(messages));
  }, [messages]);

  return (
    <div>
      {/* チャット UI */}
    </div>
  );
}
```

### 6. RAG（Retrieval Augmented Generation）

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { searchDocuments } from '@/lib/vector-search';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // ベクトル検索で関連ドキュメントを取得
  const relevantDocs = await searchDocuments(lastMessage);

  const context = relevantDocs.map(doc => doc.content).join('\n\n');

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: `You are a helpful assistant. Use the following context to answer questions:

Context:
${context}

If the answer is not in the context, say "I don't have enough information to answer that."`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

### 7. マルチモーダル（画像入力）

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'What is in this image?',
          },
          {
            type: 'image',
            image: 'https://example.com/image.jpg',
          },
        ],
      },
    ],
  });

  return result.toDataStreamResponse();
}
```

### 8. ストリーミングイベントの監視

```typescript
'use client';

import { useChat } from 'ai/react';

export default function ChatWithEvents() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    onResponse: (response) => {
      console.log('Response started:', response);
    },
    onFinish: (message) => {
      console.log('Response finished:', message);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  return (
    <div>
      {/* チャット UI */}
    </div>
  );
}
```

---

## トラブルシューティング

### エラー: "API key not found"

```bash
# 環境変数を確認
echo $ANTHROPIC_API_KEY

# .env.local に追加
ANTHROPIC_API_KEY="sk-ant-xxxx"

# サーバーを再起動
npm run dev
```

### エラー: "Rate limit exceeded"

```typescript
// リトライロジックを実装
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    if (error.message?.includes('rate limit')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429 }
      );
    }
    throw error;
  }
}
```

### ストリーミングが動作しない

```typescript
// Edge Runtime を使用
export const runtime = 'edge';

// または Node.js Runtime で動的レンダリング
export const dynamic = 'force-dynamic';
```

### モデルの選択

```typescript
// Claude 3.5 Sonnet (推奨: バランスが良い)
anthropic('claude-3-5-sonnet-20241022')

// Claude 3 Opus (高性能だがコストが高い)
anthropic('claude-3-opus-20240229')

// Claude 3 Haiku (高速で安価)
anthropic('claude-3-haiku-20240307')

// OpenAI GPT-4 Turbo
openai('gpt-4-turbo')

// OpenAI GPT-3.5 Turbo (安価)
openai('gpt-3.5-turbo')
```

---

## まとめ

### チェックリスト

- [ ] AI SDK をインストール
- [ ] API キーを取得して設定
- [ ] Chat API を実装
- [ ] useChat フックでチャットページを作成
- [ ] ストリーミング応答を確認
- [ ] システムプロンプトをカスタマイズ
- [ ] エラーハンドリングを実装
- [ ] Vercel にデプロイ

### ベストプラクティス

- ✅ Edge Runtime で実行（高速・低コスト）
- ✅ ストリーミングでユーザー体験を向上
- ✅ システムプロンプトで振る舞いを制御
- ✅ Rate Limiting を実装
- ✅ エラーハンドリングを適切に実装
- ✅ トークン使用量を監視

### 次のステップ

- Edge Config で Feature Flags を実装
- Vercel Postgres でチャット履歴を保存
- Function Calling でツール使用を実装

---

**最終更新**: 2025年11月
**難易度**: ★★★★☆
**所要時間**: 3-4時間
