# 第7章: Embeddings

## Embeddings とは

```
┌─────────────────────────────────────────────────────────┐
│                   Embeddings の概念                      │
│                                                         │
│  入力データ                   ベクトル空間                │
│                                                         │
│  "猫"    ─────────────→    [0.2, 0.8, -0.1, ...]       │
│  "犬"    ─────────────→    [0.3, 0.7, -0.2, ...]       │
│  "車"    ─────────────→    [-0.5, 0.1, 0.9, ...]       │
│                                                         │
│  • 意味的に似たものは近い位置に配置される                 │
│  • 高次元空間で意味を捉える                              │
│  • 計算可能な表現に変換                                  │
└─────────────────────────────────────────────────────────┘
```

## テキスト Embeddings

### AI SDK での Embeddings

```typescript
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

// 単一テキストの埋め込み
async function getEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });
  return embedding; // 1536次元のベクトル
}

// 複数テキストの一括埋め込み
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: texts,
  });
  return embeddings;
}

// 使用例
const embedding = await getEmbedding("機械学習は素晴らしい技術です");
console.log(`次元数: ${embedding.length}`); // 1536

const embeddings = await getEmbeddings([
  "今日は天気がいい",
  "明日は雨が降るでしょう",
  "プログラミングを学んでいます",
]);
```

### Embedding モデルの比較

```typescript
// 異なるモデルの比較
const models = {
  "text-embedding-3-small": {
    dimensions: 1536,
    maxTokens: 8191,
    cost: "低",
    speed: "高速",
    quality: "良好",
  },
  "text-embedding-3-large": {
    dimensions: 3072,
    maxTokens: 8191,
    cost: "中",
    speed: "中速",
    quality: "高品質",
  },
  "text-embedding-ada-002": {
    dimensions: 1536,
    maxTokens: 8191,
    cost: "低",
    speed: "高速",
    quality: "標準",
  },
};

// 次元数の削減（text-embedding-3 シリーズのみ）
async function getReducedEmbedding(
  text: string,
  dimensions: number = 256,
): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small", {
      dimensions, // 256, 512, 1024 など
    }),
    value: text,
  });
  return embedding;
}
```

## 類似度計算

### コサイン類似度

```typescript
// コサイン類似度
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ユークリッド距離
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

// ドット積（正規化されたベクトル用）
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

// 使用例
const embedding1 = await getEmbedding("猫は可愛い動物です");
const embedding2 = await getEmbedding("犬は忠実なペットです");
const embedding3 = await getEmbedding("プログラミングは楽しい");

console.log("猫と犬:", cosineSimilarity(embedding1, embedding2)); // ~0.8
console.log("猫とプログラミング:", cosineSimilarity(embedding1, embedding3)); // ~0.3
```

## セマンティック検索

```typescript
interface Document {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

class SemanticSearch {
  private documents: Document[] = [];

  // ドキュメントを追加
  async addDocuments(
    docs: Array<{ id: string; content: string; metadata?: any }>,
  ) {
    const contents = docs.map((d) => d.content);
    const embeddings = await getEmbeddings(contents);

    for (let i = 0; i < docs.length; i++) {
      this.documents.push({
        ...docs[i],
        embedding: embeddings[i],
      });
    }
  }

  // 検索
  async search(
    query: string,
    topK: number = 5,
    threshold: number = 0.5,
  ): Promise<Array<{ document: Document; similarity: number }>> {
    const queryEmbedding = await getEmbedding(query);

    const results = this.documents
      .map((doc) => ({
        document: doc,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding!),
      }))
      .filter((r) => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }

  // ハイブリッド検索（キーワード + セマンティック）
  async hybridSearch(
    query: string,
    topK: number = 5,
    alpha: number = 0.5, // セマンティックの重み
  ): Promise<Array<{ document: Document; score: number }>> {
    // セマンティック検索
    const semanticResults = await this.search(query, topK * 2);

    // キーワード検索（BM25 簡易版）
    const queryTerms = query.toLowerCase().split(/\s+/);
    const keywordScores = new Map<string, number>();

    this.documents.forEach((doc) => {
      const content = doc.content.toLowerCase();
      let score = 0;
      queryTerms.forEach((term) => {
        const count = (content.match(new RegExp(term, "g")) || []).length;
        score += count;
      });
      keywordScores.set(doc.id, score);
    });

    // スコアを正規化して結合
    const maxKeyword = Math.max(...keywordScores.values()) || 1;
    const maxSemantic = semanticResults[0]?.similarity || 1;

    const combinedScores = new Map<string, number>();

    this.documents.forEach((doc) => {
      const keywordScore = (keywordScores.get(doc.id) || 0) / maxKeyword;
      const semanticScore =
        (semanticResults.find((r) => r.document.id === doc.id)?.similarity ||
          0) / maxSemantic;

      combinedScores.set(
        doc.id,
        alpha * semanticScore + (1 - alpha) * keywordScore,
      );
    });

    return this.documents
      .map((doc) => ({
        document: doc,
        score: combinedScores.get(doc.id) || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

// 使用例
const search = new SemanticSearch();

await search.addDocuments([
  { id: "1", content: "機械学習の基礎について説明します。" },
  { id: "2", content: "深層学習はニューラルネットワークの一種です。" },
  { id: "3", content: "自然言語処理でテキストを分析します。" },
  { id: "4", content: "今日のランチは何にしようか迷っています。" },
]);

const results = await search.search("AI について教えて");
results.forEach((r) => {
  console.log(`${r.document.content} (類似度: ${r.similarity.toFixed(3)})`);
});
```

## ベクトルデータベース

### Pinecone との統合

```typescript
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index("my-index");

// ベクトルを追加
async function upsertVectors(
  items: Array<{ id: string; content: string; metadata?: any }>,
) {
  const embeddings = await getEmbeddings(items.map((i) => i.content));

  await index.upsert(
    items.map((item, i) => ({
      id: item.id,
      values: embeddings[i],
      metadata: {
        content: item.content,
        ...item.metadata,
      },
    })),
  );
}

// 検索
async function searchVectors(query: string, topK: number = 5) {
  const queryEmbedding = await getEmbedding(query);

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return results.matches;
}

// フィルタ付き検索
async function searchWithFilter(
  query: string,
  filter: Record<string, any>,
  topK: number = 5,
) {
  const queryEmbedding = await getEmbedding(query);

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    filter, // { category: "技術", year: { $gte: 2023 } }
    includeMetadata: true,
  });

  return results.matches;
}
```

### Supabase pgvector との統合

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
);

// テーブル作成（SQL）
/*
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  content text,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamp default now()
);

create index on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
*/

// ドキュメントを追加
async function addDocument(content: string, metadata?: any) {
  const embedding = await getEmbedding(content);

  const { data, error } = await supabase.from("documents").insert({
    content,
    embedding,
    metadata,
  });

  if (error) throw error;
  return data;
}

// 類似検索
async function searchDocuments(query: string, limit: number = 5) {
  const queryEmbedding = await getEmbedding(query);

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: limit,
  });

  if (error) throw error;
  return data;
}

// RPC 関数（SQL）
/*
create function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
*/
```

## 画像 Embeddings

```typescript
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs-node";

// 画像の Embedding を取得
async function getImageEmbedding(imagePath: string): Promise<number[]> {
  // 画像を読み込み
  const imageBuffer = await fs.readFile(imagePath);
  const tensor = tf.node.decodeImage(imageBuffer, 3);

  // MobileNet で特徴抽出
  const model = await mobilenet.load({ version: 2, alpha: 1.0 });
  const embedding = model.infer(tensor, true); // 特徴ベクトルを取得

  const values = await embedding.data();

  // クリーンアップ
  tensor.dispose();
  embedding.dispose();

  return Array.from(values);
}

// 類似画像検索
class ImageSearch {
  private images: Array<{ id: string; path: string; embedding: number[] }> = [];

  async addImage(id: string, imagePath: string) {
    const embedding = await getImageEmbedding(imagePath);
    this.images.push({ id, path: imagePath, embedding });
  }

  async findSimilar(
    queryImagePath: string,
    topK: number = 5,
  ): Promise<Array<{ id: string; path: string; similarity: number }>> {
    const queryEmbedding = await getImageEmbedding(queryImagePath);

    return this.images
      .map((img) => ({
        id: img.id,
        path: img.path,
        similarity: cosineSimilarity(queryEmbedding, img.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}
```

## マルチモーダル Embeddings

```typescript
// OpenAI CLIP スタイルのマルチモーダル検索
interface MultimodalItem {
  id: string;
  type: "text" | "image";
  content: string; // テキストまたは画像パス
  embedding?: number[];
}

class MultimodalSearch {
  private items: MultimodalItem[] = [];

  async addText(id: string, text: string) {
    const embedding = await getEmbedding(text);
    this.items.push({ id, type: "text", content: text, embedding });
  }

  async addImage(id: string, imagePath: string) {
    const embedding = await getImageEmbedding(imagePath);
    this.items.push({ id, type: "image", content: imagePath, embedding });
  }

  // テキストで画像を検索
  async searchImagesByText(
    query: string,
    topK: number = 5,
  ): Promise<MultimodalItem[]> {
    const queryEmbedding = await getEmbedding(query);

    return this.items
      .filter((item) => item.type === "image")
      .map((item) => ({
        ...item,
        similarity: cosineSimilarity(queryEmbedding, item.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  // 画像で類似画像を検索
  async searchImagesByImage(
    imagePath: string,
    topK: number = 5,
  ): Promise<MultimodalItem[]> {
    const queryEmbedding = await getImageEmbedding(imagePath);

    return this.items
      .filter((item) => item.type === "image")
      .map((item) => ({
        ...item,
        similarity: cosineSimilarity(queryEmbedding, item.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}
```

## キャッシュと最適化

```typescript
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

// Embedding のキャッシュ
async function getCachedEmbedding(text: string): Promise<number[]> {
  const cacheKey = `embedding:${hashString(text)}`;

  // キャッシュを確認
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 新しく生成
  const embedding = await getEmbedding(text);

  // キャッシュに保存（7日間）
  await redis.setex(cacheKey, 7 * 24 * 60 * 60, JSON.stringify(embedding));

  return embedding;
}

// バッチ処理で効率化
async function batchGetEmbeddings(
  texts: string[],
  batchSize: number = 100,
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await getEmbeddings(batch);
    results.push(...embeddings);

    // レート制限対策
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

// ハッシュ関数
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│            Embeddings のベストプラクティス                 │
│                                                         │
│  1. モデル選択                                           │
│     • 用途に合った次元数を選択                           │
│     • 多言語対応が必要なら対応モデルを使用               │
│     • コストと品質のバランスを考慮                       │
│                                                         │
│  2. 前処理                                               │
│     • テキストの正規化（小文字化、空白除去等）           │
│     • 長すぎるテキストは分割                            │
│     • ノイズの除去                                      │
│                                                         │
│  3. インデックス                                         │
│     • 大規模データには ANN（近似最近傍）を使用           │
│     • 適切なインデックスタイプを選択（HNSW, IVF等）      │
│                                                         │
│  4. 運用                                                 │
│     • Embedding をキャッシュ                            │
│     • バッチ処理で API コール削減                       │
│     • 定期的に再インデックス                            │
└─────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、異常検知について学びます。
