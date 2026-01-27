# RAG (Retrieval-Augmented Generation) 学習ノート

## 概要

RAG は検索と生成を組み合わせたアーキテクチャ。外部知識を活用して LLM の回答精度を向上させる。

## RAG アーキテクチャ

```
┌──────────────────────────────────────────────────────┐
│                    RAG Pipeline                       │
│                                                       │
│  ┌─────────┐     ┌─────────┐     ┌─────────────────┐ │
│  │ Query   │ ──▶ │ Embed   │ ──▶ │ Vector Search   │ │
│  │         │     │         │     │                 │ │
│  └─────────┘     └─────────┘     └────────┬────────┘ │
│                                           │          │
│                                           ▼          │
│  ┌─────────┐     ┌─────────┐     ┌─────────────────┐ │
│  │ Response│ ◀── │ LLM     │ ◀── │ Context +       │ │
│  │         │     │ Generate│     │ Retrieved Docs  │ │
│  └─────────┘     └─────────┘     └─────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## ベクトルデータベース

### 主要な選択肢

| DB                | 特徴                     |
| ----------------- | ------------------------ |
| Pinecone          | マネージド、スケーラブル |
| Supabase pgvector | PostgreSQL 統合          |
| Vercel KV + Index | Vercel エコシステム      |
| Weaviate          | オープンソース、多機能   |
| Chroma            | ローカル開発向け         |

### Supabase pgvector

```sql
-- テーブル作成
create extension if not exists vector;

create table documents (
  id bigserial primary key,
  content text,
  embedding vector(1536),
  metadata jsonb
);

-- インデックス作成
create index on documents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);

// ドキュメント追加
await supabase.from("documents").insert({
  content: "Document content...",
  embedding: vectorEmbedding,
  metadata: { source: "manual.pdf" },
});

// 類似検索
const { data } = await supabase.rpc("match_documents", {
  query_embedding: queryVector,
  match_threshold: 0.78,
  match_count: 5,
});
```

## 埋め込み生成

```typescript
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

// 単一テキスト
const { embedding } = await embed({
  model: openai.embedding("text-embedding-3-small"),
  value: "What is TypeScript?",
});

// バッチ処理
const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: ["Text 1", "Text 2", "Text 3"],
});
```

## ドキュメント処理

### チャンキング

```typescript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = await splitter.splitText(document);
```

### メタデータ付与

```typescript
interface DocumentChunk {
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    page?: number;
    section?: string;
    timestamp: string;
  };
}
```

## RAG 実装例

```typescript
// lib/rag.ts
import { generateText, embed } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { supabase } from "./supabase";

export async function ragQuery(question: string) {
  // 1. クエリを埋め込みベクトルに変換
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: question,
  });

  // 2. 類似ドキュメントを検索
  const { data: documents } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5,
  });

  // 3. コンテキストを構築
  const context = documents
    .map((doc) => `[Source: ${doc.metadata.source}]\n${doc.content}`)
    .join("\n\n---\n\n");

  // 4. LLM で回答生成
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are a helpful assistant. Use the following context to answer questions.
If the answer is not in the context, say so.

Context:
${context}`,
    prompt: question,
  });

  return {
    answer: text,
    sources: documents.map((d) => d.metadata.source),
  };
}
```

## Next.js API Route

```typescript
// app/api/rag/route.ts
import { ragQuery } from "@/lib/rag";

export async function POST(req: Request) {
  const { question } = await req.json();

  const result = await ragQuery(question);

  return Response.json(result);
}
```

## 高度なテクニック

### Hybrid Search

```typescript
// キーワード検索 + ベクトル検索の組み合わせ
const hybridResults = await supabase.rpc("hybrid_search", {
  query_text: question,
  query_embedding: embedding,
  match_count: 10,
  full_text_weight: 0.3,
  semantic_weight: 0.7,
});
```

### Re-ranking

```typescript
// 検索結果を LLM で再ランキング
const reranked = await generateObject({
  model: anthropic("claude-sonnet-4-20250514"),
  schema: z.object({
    rankings: z.array(
      z.object({
        documentId: z.string(),
        relevanceScore: z.number(),
      }),
    ),
  }),
  prompt: `Rank these documents by relevance to: "${question}"
${documents.map((d, i) => `[${i}] ${d.content}`).join("\n")}`,
});
```

## ベストプラクティス

1. **適切なチャンクサイズ**: 小さすぎると文脈喪失、大きすぎると検索精度低下
2. **メタデータ活用**: ソース情報で回答の信頼性向上
3. **ハイブリッド検索**: キーワード + セマンティック
4. **キャッシュ**: 頻出クエリの結果をキャッシュ
5. **評価**: 定期的に回答品質を評価

## 参考リソース

- [Vercel AI SDK RAG Guide](https://sdk.vercel.ai/docs/guides/rag-chatbot)
- [Supabase pgvector](https://supabase.com/docs/guides/ai)
