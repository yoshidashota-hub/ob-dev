# 第11章: AI SDK + ML 統合

## AI SDK と ML の連携

```
┌─────────────────────────────────────────────────────────┐
│              AI SDK + ML アーキテクチャ                   │
│                                                         │
│  ユーザー入力                                            │
│       ↓                                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  前処理 (ML)                                    │   │
│  │  • テキスト分類                                 │   │
│  │  • 意図推定                                     │   │
│  │  • エンティティ抽出                             │   │
│  └─────────────────────────────────────────────────┘   │
│       ↓                                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  LLM (AI SDK)                                   │   │
│  │  • コンテキスト理解                             │   │
│  │  • 応答生成                                     │   │
│  │  • ツール呼び出し                               │   │
│  └─────────────────────────────────────────────────┘   │
│       ↓                                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  後処理 (ML)                                    │   │
│  │  • 感情分析                                     │   │
│  │  • 品質スコアリング                             │   │
│  │  • 安全性チェック                               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 意図分類 + LLM

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// 意図分類モデル
interface IntentClassification {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
}

async function classifyIntent(text: string): Promise<IntentClassification> {
  // Hugging Face または自作モデルで分類
  const response = await fetch(
    "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: [
            "question",
            "request",
            "complaint",
            "feedback",
            "greeting",
          ],
        },
      }),
    },
  );

  const result = await response.json();
  const topIndex = result.scores.indexOf(Math.max(...result.scores));

  return {
    intent: result.labels[topIndex],
    confidence: result.scores[topIndex],
    entities: {}, // NER で抽出
  };
}

// 意図に基づいて LLM を呼び出し
async function handleUserMessage(userMessage: string) {
  // 1. 意図を分類
  const classification = await classifyIntent(userMessage);

  // 2. 意図に基づいてプロンプトを調整
  let systemPrompt = "";
  switch (classification.intent) {
    case "question":
      systemPrompt = `You are a helpful assistant. Answer the following question clearly and concisely.`;
      break;
    case "complaint":
      systemPrompt = `You are a customer service representative. Address the complaint empathetically and offer solutions.`;
      break;
    case "request":
      systemPrompt = `You are a helpful assistant. Help the user with their request.`;
      break;
    default:
      systemPrompt = `You are a friendly assistant.`;
  }

  // 3. LLM で応答を生成
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt: userMessage,
  });

  return {
    response: text,
    intent: classification.intent,
    confidence: classification.confidence,
  };
}
```

## セマンティック検索 + LLM (RAG)

```typescript
import { embed, generateText } from "ai";
import { openai } from "@ai-sdk/openai";

interface Document {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

class RAGSystem {
  private documents: Document[] = [];

  // ドキュメントを追加
  async addDocuments(docs: Array<{ id: string; content: string; metadata?: any }>) {
    for (const doc of docs) {
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: doc.content,
      });

      this.documents.push({
        ...doc,
        embedding,
      });
    }
  }

  // 関連ドキュメントを検索
  async searchRelevant(query: string, topK: number = 5): Promise<Document[]> {
    const { embedding: queryEmbedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    return this.documents
      .map((doc) => ({
        ...doc,
        similarity: this.cosineSimilarity(queryEmbedding, doc.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  // RAG で回答を生成
  async answer(question: string): Promise<{
    answer: string;
    sources: Document[];
  }> {
    // 1. 関連ドキュメントを検索
    const relevantDocs = await this.searchRelevant(question, 3);

    // 2. コンテキストを構築
    const context = relevantDocs
      .map((doc, i) => `[Source ${i + 1}]\n${doc.content}`)
      .join("\n\n");

    // 3. LLM で回答を生成
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a helpful assistant. Answer questions based on the provided context.
If the answer cannot be found in the context, say so.
Always cite your sources using [Source N] notation.`,
      prompt: `Context:
${context}

Question: ${question}`,
    });

    return {
      answer: text,
      sources: relevantDocs,
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
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
}

// 使用例
const rag = new RAGSystem();

await rag.addDocuments([
  {
    id: "1",
    content: "TensorFlow.js is a library for machine learning in JavaScript...",
  },
  {
    id: "2",
    content: "React is a JavaScript library for building user interfaces...",
  },
]);

const result = await rag.answer("What is TensorFlow.js?");
console.log(result.answer);
```

## 感情分析 + 応答調整

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

interface SentimentAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  emotions: Record<string, number>;
}

// 感情分析
async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    },
  );

  const result = await response.json();
  const emotions: Record<string, number> = {};

  result[0].forEach((item: { label: string; score: number }) => {
    emotions[item.label] = item.score;
  });

  // 主要な感情を判定
  const negativeEmotions = ["anger", "fear", "sadness", "disgust"];
  const positiveEmotions = ["joy", "surprise"];

  const negativeScore = negativeEmotions.reduce(
    (sum, e) => sum + (emotions[e] || 0),
    0,
  );
  const positiveScore = positiveEmotions.reduce(
    (sum, e) => sum + (emotions[e] || 0),
    0,
  );

  let sentiment: "positive" | "negative" | "neutral";
  if (positiveScore > negativeScore + 0.2) {
    sentiment = "positive";
  } else if (negativeScore > positiveScore + 0.2) {
    sentiment = "negative";
  } else {
    sentiment = "neutral";
  }

  return { sentiment, score: positiveScore - negativeScore, emotions };
}

// 感情に応じた応答生成
async function generateEmpathicResponse(userMessage: string) {
  // 1. 感情を分析
  const sentiment = await analyzeSentiment(userMessage);

  // 2. 感情に応じたプロンプトを構築
  let toneInstruction = "";
  switch (sentiment.sentiment) {
    case "negative":
      toneInstruction = `The user seems upset or frustrated. Be empathetic, acknowledge their feelings, and offer support.`;
      break;
    case "positive":
      toneInstruction = `The user seems happy. Match their positive energy and enthusiasm.`;
      break;
    default:
      toneInstruction = `Respond in a neutral, helpful tone.`;
  }

  // 3. LLM で応答を生成
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are a helpful customer service assistant.
${toneInstruction}`,
    prompt: userMessage,
  });

  return {
    response: text,
    sentiment: sentiment.sentiment,
    emotions: sentiment.emotions,
  };
}
```

## 推薦 + LLM 説明

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
}

interface Recommendation {
  product: Product;
  score: number;
  reason: string;
}

// ML ベースの推薦
async function getMLRecommendations(
  userId: string,
  topK: number = 5,
): Promise<Array<{ product: Product; score: number }>> {
  // 協調フィルタリングまたはコンテンツベースの推薦
  // 実際の実装は前章を参照
  return [];
}

// LLM で推薦理由を生成
async function explainRecommendations(
  recommendations: Array<{ product: Product; score: number }>,
  userProfile: { interests: string[]; recentPurchases: string[] },
): Promise<Recommendation[]> {
  const results: Recommendation[] = [];

  for (const rec of recommendations) {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `You are a shopping assistant. Generate a brief, personalized explanation for why this product is recommended.
Keep it to 1-2 sentences. Be specific and reference the user's interests when relevant.`,
      prompt: `User interests: ${userProfile.interests.join(", ")}
Recent purchases: ${userProfile.recentPurchases.join(", ")}

Recommended product:
Name: ${rec.product.name}
Description: ${rec.product.description}
Category: ${rec.product.category}

Why is this product recommended?`,
    });

    results.push({
      product: rec.product,
      score: rec.score,
      reason: text,
    });
  }

  return results;
}

// 対話型推薦
async function conversationalRecommendation(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  availableProducts: Product[],
): Promise<{ response: string; recommendations: Product[] }> {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are a helpful shopping assistant. Help users find products that match their needs.
Available products:
${availableProducts.map((p) => `- ${p.name}: ${p.description} ($${p.price})`).join("\n")}

When recommending products, explain why they match the user's needs.
If the user's requirements are unclear, ask clarifying questions.`,
    messages: [
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: userMessage },
    ],
  });

  // 応答から推薦商品を抽出（簡易版）
  const recommendedProducts = availableProducts.filter((p) =>
    text.toLowerCase().includes(p.name.toLowerCase()),
  );

  return {
    response: text,
    recommendations: recommendedProducts,
  };
}
```

## 異常検知 + LLM アラート

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

interface AnomalyAlert {
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  severity: "low" | "medium" | "high";
  context: Record<string, any>;
}

// ML で異常を検知
async function detectAnomalies(
  metrics: Array<{ name: string; values: number[] }>,
): Promise<AnomalyAlert[]> {
  const alerts: AnomalyAlert[] = [];

  for (const metric of metrics) {
    // Z-score ベースの異常検知
    const mean = metric.values.reduce((a, b) => a + b) / metric.values.length;
    const std = Math.sqrt(
      metric.values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
        metric.values.length,
    );

    const latestValue = metric.values[metric.values.length - 1];
    const zScore = Math.abs((latestValue - mean) / std);

    if (zScore > 3) {
      alerts.push({
        timestamp: new Date(),
        metric: metric.name,
        value: latestValue,
        threshold: mean + 3 * std,
        severity: zScore > 5 ? "high" : zScore > 4 ? "medium" : "low",
        context: { mean, std, zScore },
      });
    }
  }

  return alerts;
}

// LLM でアラートサマリーを生成
async function generateAlertSummary(alerts: AnomalyAlert[]): Promise<string> {
  if (alerts.length === 0) {
    return "No anomalies detected.";
  }

  const alertDetails = alerts
    .map(
      (a) =>
        `- ${a.metric}: ${a.value.toFixed(2)} (threshold: ${a.threshold.toFixed(2)}, severity: ${a.severity})`,
    )
    .join("\n");

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `You are a system monitoring assistant. Analyze the following anomaly alerts and provide:
1. A brief summary of the situation
2. Potential causes
3. Recommended actions

Be concise but thorough.`,
    prompt: `Detected anomalies:
${alertDetails}`,
  });

  return text;
}

// インシデント対応の自動化
async function handleIncident(alert: AnomalyAlert): Promise<{
  analysis: string;
  suggestedActions: string[];
  shouldEscalate: boolean;
}> {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are an incident response system. Analyze the anomaly and suggest actions.
Output in JSON format:
{
  "analysis": "detailed analysis",
  "suggestedActions": ["action1", "action2"],
  "shouldEscalate": true/false,
  "escalationReason": "reason if shouldEscalate is true"
}`,
    prompt: `Anomaly detected:
Metric: ${alert.metric}
Value: ${alert.value}
Expected threshold: ${alert.threshold}
Severity: ${alert.severity}
Context: ${JSON.stringify(alert.context)}`,
  });

  return JSON.parse(text);
}
```

## ハイブリッド分類

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

interface ClassificationResult {
  category: string;
  confidence: number;
  method: "ml" | "llm" | "hybrid";
  explanation?: string;
}

// ML 分類器
async function mlClassify(text: string): Promise<{
  category: string;
  confidence: number;
}> {
  // Hugging Face の分類モデルを使用
  const response = await fetch(
    "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: ["technology", "business", "sports", "entertainment"],
        },
      }),
    },
  );

  const result = await response.json();
  const topIndex = result.scores.indexOf(Math.max(...result.scores));

  return {
    category: result.labels[topIndex],
    confidence: result.scores[topIndex],
  };
}

// LLM 分類器
async function llmClassify(text: string): Promise<{
  category: string;
  confidence: number;
  explanation: string;
}> {
  const { text: response } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `Classify the following text into one of these categories: technology, business, sports, entertainment.
Output in JSON format:
{
  "category": "category name",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation"
}`,
    prompt: text,
  });

  return JSON.parse(response);
}

// ハイブリッド分類
async function hybridClassify(text: string): Promise<ClassificationResult> {
  // まず ML で分類
  const mlResult = await mlClassify(text);

  // 信頼度が高ければ ML の結果を使用
  if (mlResult.confidence > 0.9) {
    return {
      category: mlResult.category,
      confidence: mlResult.confidence,
      method: "ml",
    };
  }

  // 信頼度が低い場合は LLM でも分類
  const llmResult = await llmClassify(text);

  // 両方の結果を比較
  if (mlResult.category === llmResult.category) {
    // 一致する場合は信頼度を上げる
    return {
      category: mlResult.category,
      confidence: Math.min(1, (mlResult.confidence + llmResult.confidence) / 2 + 0.1),
      method: "hybrid",
      explanation: llmResult.explanation,
    };
  }

  // 不一致の場合は LLM を優先（説明可能性のため）
  return {
    category: llmResult.category,
    confidence: llmResult.confidence,
    method: "llm",
    explanation: llmResult.explanation,
  };
}
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│         AI SDK + ML 統合のベストプラクティス               │
│                                                         │
│  1. 役割分担                                             │
│     • ML: 高速な分類、スコアリング、埋め込み             │
│     • LLM: 理解、生成、説明                             │
│     • 各々の強みを活かす                                │
│                                                         │
│  2. パフォーマンス                                       │
│     • ML を前段でフィルタリングに使用                   │
│     • LLM の呼び出しを最小化                            │
│     • キャッシュを活用                                  │
│                                                         │
│  3. 品質                                                 │
│     • ML と LLM の結果を相互検証                        │
│     • 信頼度に基づいて手法を選択                        │
│     • フォールバック戦略を用意                          │
│                                                         │
│  4. コスト                                               │
│     • 簡単なタスクは ML で処理                          │
│     • LLM は高付加価値タスクに限定                      │
│     • バッチ処理でコスト削減                            │
└─────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、RAG と ML の詳細な統合について学びます。
