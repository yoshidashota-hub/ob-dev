# 第5章: 自然言語処理

## NLP の概要

```
┌─────────────────────────────────────────────────────────┐
│                   NLP タスクの種類                        │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  テキスト分類    │  │  感情分析       │              │
│  │  • スパム検出   │  │  • ポジ/ネガ    │              │
│  │  • カテゴリ分け │  │  • 星評価予測   │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  固有表現抽出    │  │  質問応答       │              │
│  │  • 人名/地名    │  │  • FAQ         │              │
│  │  • 日付/金額    │  │  • 検索        │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  テキスト生成    │  │  要約・翻訳     │              │
│  │  • チャットボット│  │  • 文書要約     │              │
│  │  • コンテンツ生成│  │  • 多言語翻訳   │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## テキストの前処理

### 基本的な前処理

```typescript
// テキストの正規化
function normalizeText(text: string): string {
  return text
    .toLowerCase() // 小文字化
    .replace(/[^\w\s]/g, " ") // 記号を空白に
    .replace(/\s+/g, " ") // 連続空白を1つに
    .trim();
}

// トークン化
function tokenize(text: string): string[] {
  return normalizeText(text).split(" ").filter(Boolean);
}

// ストップワード除去
const stopWords = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "must", "shall",
  "can", "of", "at", "by", "for", "with", "about", "against",
  "between", "into", "through", "during", "before", "after",
  "above", "below", "to", "from", "up", "down", "in", "out",
  "on", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all",
  "each", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "just", "and", "but", "if", "or", "because", "as",
  "until", "while", "this", "that", "these", "those", "i", "me",
  "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
  "yours", "yourself", "yourselves", "he", "him", "his", "himself",
  "she", "her", "hers", "herself", "it", "its", "itself", "they",
  "them", "their", "theirs", "themselves", "what", "which", "who",
  "whom",
]);

function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((token) => !stopWords.has(token));
}

// ステミング（簡易版）
function stem(word: string): string {
  return word
    .replace(/ing$/, "")
    .replace(/ed$/, "")
    .replace(/s$/, "");
}

// 前処理パイプライン
function preprocessText(text: string): string[] {
  const tokens = tokenize(text);
  const filtered = removeStopWords(tokens);
  const stemmed = filtered.map(stem);
  return stemmed;
}

// 使用例
const text = "The quick brown foxes are jumping over the lazy dogs.";
console.log(preprocessText(text));
// ["quick", "brown", "fox", "jump", "lazi", "dog"]
```

### 日本語の前処理

```typescript
// kuromoji を使用した日本語トークナイズ
import kuromoji from "kuromoji";

interface Token {
  surface_form: string;
  pos: string;
  basic_form: string;
}

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;

async function getTokenizer() {
  if (tokenizer) return tokenizer;

  return new Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>>((resolve, reject) => {
    kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((err, t) => {
      if (err) reject(err);
      tokenizer = t;
      resolve(t);
    });
  });
}

async function tokenizeJapanese(text: string): Promise<Token[]> {
  const t = await getTokenizer();
  const tokens = t.tokenize(text);

  return tokens.map((token) => ({
    surface_form: token.surface_form,
    pos: token.pos,
    basic_form: token.basic_form || token.surface_form,
  }));
}

// 名詞のみ抽出
async function extractNouns(text: string): Promise<string[]> {
  const tokens = await tokenizeJapanese(text);
  return tokens.filter((t) => t.pos === "名詞").map((t) => t.basic_form);
}

// 使用例
const japaneseText = "今日は天気がいいので公園に行きました。";
const nouns = await extractNouns(japaneseText);
console.log(nouns); // ["今日", "天気", "公園"]
```

## テキストのベクトル化

### Bag of Words

```typescript
class BagOfWords {
  private vocabulary: Map<string, number> = new Map();
  private idfValues: Map<string, number> = new Map();

  // 語彙を構築
  fit(documents: string[][]): void {
    const df = new Map<string, number>(); // Document frequency

    documents.forEach((doc) => {
      const uniqueWords = new Set(doc);
      uniqueWords.forEach((word) => {
        df.set(word, (df.get(word) || 0) + 1);
      });
    });

    // 語彙を作成（出現頻度順）
    const sortedWords = [...df.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);

    sortedWords.forEach((word, index) => {
      this.vocabulary.set(word, index);
    });

    // IDF を計算
    const N = documents.length;
    df.forEach((freq, word) => {
      this.idfValues.set(word, Math.log(N / freq) + 1);
    });
  }

  // BoW ベクトルに変換
  transform(document: string[]): number[] {
    const vector = new Array(this.vocabulary.size).fill(0);

    document.forEach((word) => {
      const index = this.vocabulary.get(word);
      if (index !== undefined) {
        vector[index]++;
      }
    });

    return vector;
  }

  // TF-IDF ベクトルに変換
  transformTfIdf(document: string[]): number[] {
    const vector = new Array(this.vocabulary.size).fill(0);
    const wordCounts = new Map<string, number>();

    // TF を計算
    document.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // TF-IDF を計算
    wordCounts.forEach((count, word) => {
      const index = this.vocabulary.get(word);
      if (index !== undefined) {
        const tf = count / document.length;
        const idf = this.idfValues.get(word) || 1;
        vector[index] = tf * idf;
      }
    });

    return vector;
  }
}

// 使用例
const documents = [
  ["machine", "learning", "is", "great"],
  ["deep", "learning", "is", "powerful"],
  ["machine", "learning", "and", "deep", "learning"],
];

const bow = new BagOfWords();
bow.fit(documents);

const vector = bow.transformTfIdf(["machine", "learning"]);
console.log(vector);
```

### Word Embeddings（AI SDK 使用）

```typescript
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

// 単一テキストの埋め込み
async function getEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });
  return embedding;
}

// 複数テキストの埋め込み
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: texts,
  });
  return embeddings;
}

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

// 類似テキスト検索
async function findSimilar(
  query: string,
  documents: string[],
  topK: number = 5,
): Promise<Array<{ text: string; similarity: number }>> {
  const queryEmbedding = await getEmbedding(query);
  const docEmbeddings = await getEmbeddings(documents);

  const similarities = documents.map((doc, i) => ({
    text: doc,
    similarity: cosineSimilarity(queryEmbedding, docEmbeddings[i]),
  }));

  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}
```

## テキスト分類

### 感情分析

```typescript
import * as tf from "@tensorflow/tfjs";

// シンプルな感情分析モデル
class SentimentClassifier {
  private model: tf.LayersModel | null = null;
  private vocabulary: Map<string, number> = new Map();
  private maxLength: number = 100;

  async build(vocabSize: number): Promise<void> {
    this.model = tf.sequential();

    // 埋め込み層
    this.model.add(
      tf.layers.embedding({
        inputDim: vocabSize,
        outputDim: 64,
        inputLength: this.maxLength,
      }),
    );

    // LSTM 層
    this.model.add(
      tf.layers.lstm({
        units: 64,
        returnSequences: false,
      }),
    );

    // 全結合層
    this.model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    this.model.add(tf.layers.dropout({ rate: 0.5 }));
    this.model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });
  }

  // テキストを数値シーケンスに変換
  private textToSequence(text: string): number[] {
    const tokens = tokenize(text);
    const sequence = tokens.map((token) => this.vocabulary.get(token) || 0);

    // パディング/トランケート
    if (sequence.length > this.maxLength) {
      return sequence.slice(0, this.maxLength);
    }
    return [...sequence, ...new Array(this.maxLength - sequence.length).fill(0)];
  }

  // 語彙を構築
  buildVocabulary(texts: string[]): void {
    const wordCounts = new Map<string, number>();

    texts.forEach((text) => {
      tokenize(text).forEach((token) => {
        wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
      });
    });

    // 頻度順に並べて語彙を構築
    const sortedWords = [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9999); // 10000語まで

    this.vocabulary.set("<PAD>", 0);
    sortedWords.forEach(([word], index) => {
      this.vocabulary.set(word, index + 1);
    });
  }

  // 訓練
  async train(
    texts: string[],
    labels: number[], // 0: ネガティブ, 1: ポジティブ
    epochs: number = 10,
  ): Promise<void> {
    this.buildVocabulary(texts);
    await this.build(this.vocabulary.size);

    const sequences = texts.map((t) => this.textToSequence(t));
    const xTrain = tf.tensor2d(sequences);
    const yTrain = tf.tensor1d(labels);

    await this.model!.fit(xTrain, yTrain, {
      epochs,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: acc=${logs?.acc?.toFixed(3)}`);
        },
      },
    });

    xTrain.dispose();
    yTrain.dispose();
  }

  // 予測
  predict(text: string): { sentiment: string; confidence: number } {
    const sequence = this.textToSequence(text);
    const input = tf.tensor2d([sequence]);
    const prediction = this.model!.predict(input) as tf.Tensor;
    const score = prediction.dataSync()[0];

    input.dispose();
    prediction.dispose();

    return {
      sentiment: score > 0.5 ? "positive" : "negative",
      confidence: score > 0.5 ? score : 1 - score,
    };
  }
}
```

### Hugging Face Transformers を使った分類

```typescript
// Hugging Face Inference API を使用
interface ClassificationResult {
  label: string;
  score: number;
}

async function classifyText(
  text: string,
  model: string = "distilbert-base-uncased-finetuned-sst-2-english",
): Promise<ClassificationResult[]> {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    },
  );

  const results = await response.json();
  return results[0] as ClassificationResult[];
}

// 日本語感情分析
async function analyzeJapaneseSentiment(text: string) {
  return classifyText(
    text,
    "koheiduck/bert-japanese-finetuned-sentiment",
  );
}

// 使用例
const result = await classifyText("This movie was absolutely fantastic!");
console.log(result);
// [{ label: "POSITIVE", score: 0.9998 }, { label: "NEGATIVE", score: 0.0002 }]
```

## 固有表現抽出（NER）

```typescript
interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
  score: number;
}

async function extractEntities(text: string): Promise<Entity[]> {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/dbmdz/bert-large-cased-finetuned-conll03-english",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    },
  );

  const results = await response.json();

  // エンティティをグループ化
  const entities: Entity[] = [];
  let currentEntity: Partial<Entity> | null = null;

  for (const token of results) {
    if (token.entity.startsWith("B-")) {
      // 新しいエンティティ開始
      if (currentEntity) {
        entities.push(currentEntity as Entity);
      }
      currentEntity = {
        text: token.word,
        type: token.entity.slice(2),
        start: token.start,
        end: token.end,
        score: token.score,
      };
    } else if (token.entity.startsWith("I-") && currentEntity) {
      // エンティティ継続
      currentEntity.text += token.word.replace("##", "");
      currentEntity.end = token.end;
      currentEntity.score = Math.min(currentEntity.score!, token.score);
    } else if (currentEntity) {
      entities.push(currentEntity as Entity);
      currentEntity = null;
    }
  }

  if (currentEntity) {
    entities.push(currentEntity as Entity);
  }

  return entities;
}

// 使用例
const entities = await extractEntities(
  "Apple Inc. was founded by Steve Jobs in Cupertino, California.",
);
console.log(entities);
// [
//   { text: "Apple Inc.", type: "ORG", ... },
//   { text: "Steve Jobs", type: "PER", ... },
//   { text: "Cupertino", type: "LOC", ... },
//   { text: "California", type: "LOC", ... }
// ]
```

## テキスト要約

```typescript
async function summarizeText(
  text: string,
  maxLength: number = 150,
  minLength: number = 30,
): Promise<string> {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          max_length: maxLength,
          min_length: minLength,
        },
      }),
    },
  );

  const result = await response.json();
  return result[0].summary_text;
}

// 使用例
const longText = `
  Machine learning is a subset of artificial intelligence (AI) that provides
  systems the ability to automatically learn and improve from experience without
  being explicitly programmed. Machine learning focuses on the development of
  computer programs that can access data and use it to learn for themselves.
`;

const summary = await summarizeText(longText);
console.log(summary);
```

## 質問応答

```typescript
interface QAResult {
  answer: string;
  score: number;
  start: number;
  end: number;
}

async function answerQuestion(
  question: string,
  context: string,
): Promise<QAResult> {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          question,
          context,
        },
      }),
    },
  );

  return response.json();
}

// 使用例
const context = `
  TensorFlow.js is a library for machine learning in JavaScript.
  It lets you develop ML models in JavaScript, and use ML directly
  in the browser or in Node.js. TensorFlow.js was released in March 2018.
`;

const answer = await answerQuestion(
  "When was TensorFlow.js released?",
  context,
);
console.log(answer);
// { answer: "March 2018", score: 0.95, start: 180, end: 190 }
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│              NLP のベストプラクティス                      │
│                                                         │
│  1. 前処理                                               │
│     • タスクに応じた正規化                               │
│     • 言語に合ったトークナイザを使用                     │
│     • ストップワードは慎重に除去                         │
│                                                         │
│  2. ベクトル化                                           │
│     • 小規模データ: TF-IDF                              │
│     • 大規模/意味重視: Embeddings                       │
│     • 最新: Transformer ベースのモデル                  │
│                                                         │
│  3. モデル選択                                           │
│     • 分類: BERT, DistilBERT                           │
│     • 生成: GPT, Claude                                 │
│     • 軽量: DistilBERT, MiniLM                         │
│                                                         │
│  4. 評価                                                 │
│     • 分類: Accuracy, F1, AUC                          │
│     • 生成: BLEU, ROUGE                                │
│     • 人間評価も重要                                    │
└─────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、推薦システムについて学びます。
