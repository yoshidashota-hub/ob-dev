# 第12章: RAG と ML の統合

## RAG アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    RAG パイプライン                       │
│                                                         │
│  クエリ                                                  │
│    ↓                                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Query Processing (ML)                          │   │
│  │  • クエリ拡張                                   │   │
│  │  • 意図分類                                     │   │
│  │  • キーワード抽出                               │   │
│  └─────────────────────────────────────────────────┘   │
│    ↓                                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Retrieval (Embeddings + Vector DB)             │   │
│  │  • セマンティック検索                           │   │
│  │  • ハイブリッド検索                             │   │
│  │  • リランキング                                 │   │
│  └─────────────────────────────────────────────────┘   │
│    ↓                                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Generation (LLM)                               │   │
│  │  • コンテキスト統合                             │   │
│  │  • 回答生成                                     │   │
│  │  • 引用付与                                     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## クエリ処理

### クエリ拡張

```typescript
import { generateText, embed } from "ai";
import { openai } from "@ai-sdk/openai";

interface ExpandedQuery {
  original: string;
  expanded: string[];
  keywords: string[];
  intent: string;
}

async function expandQuery(query: string): Promise<ExpandedQuery> {
  // LLM でクエリを拡張
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `You are a query expansion system. Given a user query, generate:
1. 3-5 alternative phrasings of the query
2. Key keywords and phrases
3. The primary intent

Output in JSON format:
{
  "alternatives": ["alt1", "alt2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "intent": "question/search/comparison/etc"
}`,
    prompt: query,
  });

  const parsed = JSON.parse(text);

  return {
    original: query,
    expanded: [query, ...parsed.alternatives],
    keywords: parsed.keywords,
    intent: parsed.intent,
  };
}

// HyDE (Hypothetical Document Embeddings)
async function generateHypotheticalDocument(query: string): Promise<string> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `You are a document generation system. Given a question, write a short passage that would be a good answer to this question. This will be used to find similar real documents.`,
    prompt: query,
  });

  return text;
}

// クエリを複数のベクトルに変換
async function getQueryEmbeddings(
  query: string,
): Promise<{ original: number[]; hyde: number[] }> {
  const hydeDoc = await generateHypotheticalDocument(query);

  const [originalEmb, hydeEmb] = await Promise.all([
    embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    }),
    embed({
      model: openai.embedding("text-embedding-3-small"),
      value: hydeDoc,
    }),
  ]);

  return {
    original: originalEmb.embedding,
    hyde: hydeEmb.embedding,
  };
}
```

### 意図に基づくルーティング

```typescript
type QueryIntent = "factual" | "analytical" | "creative" | "code" | "comparison";

interface QueryAnalysis {
  intent: QueryIntent;
  complexity: "simple" | "moderate" | "complex";
  requiresRecentInfo: boolean;
  domains: string[];
}

async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `Analyze the following query and classify it.

Output JSON:
{
  "intent": "factual|analytical|creative|code|comparison",
  "complexity": "simple|moderate|complex",
  "requiresRecentInfo": true/false,
  "domains": ["domain1", "domain2"]
}`,
    prompt: query,
  });

  return JSON.parse(text);
}

// 意図に基づいて検索戦略を決定
function getRetrievalStrategy(analysis: QueryAnalysis): {
  topK: number;
  useHyde: boolean;
  useReranking: boolean;
  filters: Record<string, any>;
} {
  switch (analysis.intent) {
    case "factual":
      return {
        topK: 3,
        useHyde: false,
        useReranking: true,
        filters: {},
      };

    case "analytical":
      return {
        topK: 10,
        useHyde: true,
        useReranking: true,
        filters: {},
      };

    case "code":
      return {
        topK: 5,
        useHyde: false,
        useReranking: false,
        filters: { type: "code" },
      };

    case "comparison":
      return {
        topK: 8,
        useHyde: true,
        useReranking: true,
        filters: {},
      };

    default:
      return {
        topK: 5,
        useHyde: false,
        useReranking: true,
        filters: {},
      };
  }
}
```

## 高度な検索

### ハイブリッド検索

```typescript
interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

class HybridSearcher {
  private vectorDb: VectorDatabase;
  private bm25Index: BM25Index;

  constructor(vectorDb: VectorDatabase, bm25Index: BM25Index) {
    this.vectorDb = vectorDb;
    this.bm25Index = bm25Index;
  }

  // ハイブリッド検索
  async search(
    query: string,
    topK: number = 10,
    alpha: number = 0.7, // セマンティックの重み
  ): Promise<SearchResult[]> {
    // 1. セマンティック検索
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    const semanticResults = await this.vectorDb.search(embedding, topK * 2);

    // 2. キーワード検索（BM25）
    const keywordResults = this.bm25Index.search(query, topK * 2);

    // 3. Reciprocal Rank Fusion でスコアを統合
    const fusedScores = this.reciprocalRankFusion(
      semanticResults,
      keywordResults,
      alpha,
    );

    return fusedScores.slice(0, topK);
  }

  private reciprocalRankFusion(
    semanticResults: SearchResult[],
    keywordResults: SearchResult[],
    alpha: number,
  ): SearchResult[] {
    const k = 60; // RRF パラメータ
    const scores = new Map<string, { score: number; result: SearchResult }>();

    // セマンティック検索のスコア
    semanticResults.forEach((result, rank) => {
      const rrfScore = alpha * (1 / (k + rank + 1));
      scores.set(result.id, { score: rrfScore, result });
    });

    // キーワード検索のスコアを加算
    keywordResults.forEach((result, rank) => {
      const rrfScore = (1 - alpha) * (1 / (k + rank + 1));
      const existing = scores.get(result.id);

      if (existing) {
        existing.score += rrfScore;
      } else {
        scores.set(result.id, { score: rrfScore, result });
      }
    });

    // スコア順にソート
    return [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .map(({ result, score }) => ({ ...result, score }));
  }
}
```

### リランキング

```typescript
// Cross-Encoder ベースのリランキング
async function rerankResults(
  query: string,
  results: SearchResult[],
): Promise<SearchResult[]> {
  // Hugging Face の Cross-Encoder モデルを使用
  const response = await fetch(
    "https://api-inference.huggingface.co/models/cross-encoder/ms-marco-MiniLM-L-12-v2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: results.map((r) => ({
          text: query,
          text_pair: r.content,
        })),
      }),
    },
  );

  const scores = await response.json();

  // スコアで再ソート
  return results
    .map((result, i) => ({
      ...result,
      score: scores[i],
    }))
    .sort((a, b) => b.score - a.score);
}

// LLM ベースのリランキング
async function llmRerank(
  query: string,
  results: SearchResult[],
  topK: number = 5,
): Promise<SearchResult[]> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `You are a relevance ranker. Given a query and a list of documents, rank them by relevance.

Output a JSON array of document indices in order of relevance (most relevant first):
[index1, index2, ...]`,
    prompt: `Query: ${query}

Documents:
${results.map((r, i) => `[${i}] ${r.content.slice(0, 200)}...`).join("\n\n")}`,
  });

  const rankedIndices = JSON.parse(text);

  return rankedIndices.slice(0, topK).map((i: number) => results[i]);
}
```

## コンテキスト最適化

### チャンク分割

```typescript
interface Chunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    position: number;
    totalChunks: number;
  };
}

class SmartChunker {
  private maxChunkSize: number;
  private overlap: number;

  constructor(maxChunkSize: number = 500, overlap: number = 50) {
    this.maxChunkSize = maxChunkSize;
    this.overlap = overlap;
  }

  // セマンティックチャンキング
  async chunkDocument(document: string, source: string): Promise<Chunk[]> {
    // 1. 段落で分割
    const paragraphs = document.split(/\n\n+/);

    // 2. 段落をグループ化してチャンクを作成
    const chunks: Chunk[] = [];
    let currentChunk = "";
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > this.maxChunkSize) {
        if (currentChunk) {
          chunks.push({
            id: `${source}-${chunkIndex}`,
            content: currentChunk.trim(),
            metadata: {
              source,
              position: chunkIndex,
              totalChunks: 0, // 後で更新
            },
          });
          chunkIndex++;

          // オーバーラップ
          const words = currentChunk.split(/\s+/);
          currentChunk = words.slice(-this.overlap / 10).join(" ") + "\n\n";
        }
      }
      currentChunk += paragraph + "\n\n";
    }

    // 最後のチャンク
    if (currentChunk.trim()) {
      chunks.push({
        id: `${source}-${chunkIndex}`,
        content: currentChunk.trim(),
        metadata: {
          source,
          position: chunkIndex,
          totalChunks: 0,
        },
      });
    }

    // totalChunks を更新
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  // コードのチャンキング
  chunkCode(code: string, source: string): Chunk[] {
    // 関数/クラス単位で分割
    const functionPattern = /^(function|class|const|let|var|export)/m;
    const blocks = code.split(/(?=^(?:function|class|const|let|var|export))/m);

    return blocks
      .filter((block) => block.trim())
      .map((block, i) => ({
        id: `${source}-${i}`,
        content: block.trim(),
        metadata: {
          source,
          position: i,
          totalChunks: blocks.length,
        },
      }));
  }
}
```

### コンテキスト圧縮

```typescript
// 関連部分のみを抽出
async function compressContext(
  query: string,
  documents: string[],
  maxTokens: number = 2000,
): Promise<string> {
  // 1. 各ドキュメントをセンテンスに分割
  const allSentences: Array<{ docIndex: number; sentence: string }> = [];

  documents.forEach((doc, docIndex) => {
    const sentences = doc.split(/[.!?]+/).filter((s) => s.trim());
    sentences.forEach((sentence) => {
      allSentences.push({ docIndex, sentence: sentence.trim() });
    });
  });

  // 2. 各センテンスのクエリとの関連度を計算
  const queryEmbedding = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });

  const sentenceEmbeddings = await Promise.all(
    allSentences.map((s) =>
      embed({
        model: openai.embedding("text-embedding-3-small"),
        value: s.sentence,
      }),
    ),
  );

  // 3. 関連度でソート
  const scoredSentences = allSentences.map((s, i) => ({
    ...s,
    score: cosineSimilarity(
      queryEmbedding.embedding,
      sentenceEmbeddings[i].embedding,
    ),
  }));

  scoredSentences.sort((a, b) => b.score - a.score);

  // 4. トークン制限内で最も関連性の高いセンテンスを選択
  let context = "";
  let tokenCount = 0;

  for (const { sentence } of scoredSentences) {
    const sentenceTokens = sentence.split(/\s+/).length;
    if (tokenCount + sentenceTokens > maxTokens) break;

    context += sentence + ". ";
    tokenCount += sentenceTokens;
  }

  return context;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

## 回答生成

### 引用付き回答

```typescript
interface RAGResponse {
  answer: string;
  citations: Array<{
    sourceId: string;
    text: string;
    relevance: number;
  }>;
  confidence: number;
}

async function generateAnswerWithCitations(
  query: string,
  retrievedDocs: Array<{ id: string; content: string; score: number }>,
): Promise<RAGResponse> {
  const context = retrievedDocs
    .map((doc, i) => `[${i + 1}] ${doc.content}`)
    .join("\n\n");

  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are a helpful assistant that answers questions based on provided context.

Rules:
1. Only answer based on the provided context
2. Always cite sources using [N] notation
3. If the answer cannot be found in the context, say "I couldn't find information about this in the provided context"
4. Be concise but thorough`,
    prompt: `Context:
${context}

Question: ${query}

Provide a well-cited answer:`,
  });

  // 引用を抽出
  const citationPattern = /\[(\d+)\]/g;
  const usedCitations = new Set<number>();
  let match;

  while ((match = citationPattern.exec(text)) !== null) {
    usedCitations.add(parseInt(match[1]) - 1);
  }

  const citations = [...usedCitations].map((i) => ({
    sourceId: retrievedDocs[i].id,
    text: retrievedDocs[i].content.slice(0, 200),
    relevance: retrievedDocs[i].score,
  }));

  // 信頼度を計算
  const avgRelevance =
    citations.reduce((sum, c) => sum + c.relevance, 0) / citations.length || 0;
  const confidence = citations.length > 0 ? avgRelevance : 0.3;

  return {
    answer: text,
    citations,
    confidence,
  };
}
```

### ストリーミング回答

```typescript
import { streamText } from "ai";

async function* streamRAGAnswer(
  query: string,
  retrievedDocs: Array<{ id: string; content: string }>,
): AsyncGenerator<string> {
  const context = retrievedDocs
    .map((doc, i) => `[${i + 1}] ${doc.content}`)
    .join("\n\n");

  const { textStream } = await streamText({
    model: openai("gpt-4o"),
    system: `Answer based on the provided context. Cite sources using [N] notation.`,
    prompt: `Context:
${context}

Question: ${query}`,
  });

  for await (const chunk of textStream) {
    yield chunk;
  }
}

// 使用例（Next.js API Route）
export async function POST(request: Request) {
  const { query } = await request.json();

  // 検索
  const docs = await searchDocuments(query);

  // ストリーミング応答
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamRAGAnswer(query, docs)) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

## 評価と改善

```typescript
interface RAGEvaluation {
  relevance: number; // 検索結果の関連性
  faithfulness: number; // 回答の事実忠実性
  completeness: number; // 回答の完全性
  coherence: number; // 回答の一貫性
}

// LLM による自動評価
async function evaluateRAG(
  query: string,
  context: string,
  answer: string,
): Promise<RAGEvaluation> {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `Evaluate the quality of a RAG system's response.

Score each dimension from 0 to 1:
- relevance: How relevant is the retrieved context to the query?
- faithfulness: Is the answer faithful to the context (no hallucinations)?
- completeness: Does the answer fully address the query?
- coherence: Is the answer well-structured and coherent?

Output JSON: { "relevance": 0.0, "faithfulness": 0.0, "completeness": 0.0, "coherence": 0.0 }`,
    prompt: `Query: ${query}

Retrieved Context:
${context}

Generated Answer:
${answer}`,
  });

  return JSON.parse(text);
}

// 検索精度の評価
function evaluateRetrieval(
  retrievedIds: string[],
  relevantIds: string[],
): { precision: number; recall: number; mrr: number } {
  const hits = retrievedIds.filter((id) => relevantIds.includes(id));

  const precision = hits.length / retrievedIds.length;
  const recall = hits.length / relevantIds.length;

  // Mean Reciprocal Rank
  const firstRelevantIndex = retrievedIds.findIndex((id) =>
    relevantIds.includes(id),
  );
  const mrr = firstRelevantIndex >= 0 ? 1 / (firstRelevantIndex + 1) : 0;

  return { precision, recall, mrr };
}
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│              RAG のベストプラクティス                      │
│                                                         │
│  1. インデックス                                         │
│     • 適切なチャンクサイズ（200-500トークン）            │
│     • メタデータを活用したフィルタリング                 │
│     • 定期的な再インデックス                            │
│                                                         │
│  2. 検索                                                 │
│     • ハイブリッド検索（セマンティック + キーワード）    │
│     • クエリ拡張で網羅性向上                            │
│     • リランキングで精度向上                            │
│                                                         │
│  3. 生成                                                 │
│     • コンテキストサイズを最適化                        │
│     • 引用を必須にして幻覚を防止                        │
│     • 自信がない場合は明示                              │
│                                                         │
│  4. 評価                                                 │
│     • 検索と生成を分けて評価                            │
│     • 人間評価と自動評価を組み合わせ                    │
│     • 継続的なモニタリング                              │
└─────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、ファインチューニングについて学びます。
