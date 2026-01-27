# 第5章: Elasticsearch セットアップ

## Elasticsearch とは

分散型の全文検索・分析エンジン。

```
┌─────────────────────────────────────────────────────┐
│               Elasticsearch                          │
│                                                     │
│  特徴:                                              │
│  • 高速な全文検索（ミリ秒レベル）                     │
│  • リアルタイムインデックス                          │
│  • 水平スケーリング                                  │
│  • RESTful API                                      │
│  • JSON ドキュメント                                 │
│                                                     │
│  主な用途:                                          │
│  • 商品検索                                          │
│  • ログ分析（ELK Stack）                             │
│  • 自動補完・サジェスト                              │
│  • 地理空間検索                                      │
└─────────────────────────────────────────────────────┘
```

## セットアップ方法

### Elastic Cloud（推奨）

```bash
# Elastic Cloud でクラスター作成
# https://cloud.elastic.co/

# デプロイ情報を取得
# - Cloud ID
# - API Key
```

### Docker でローカル起動

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  es_data:
```

```bash
docker compose up -d
```

## Node.js クライアント

### インストール

```bash
npm install @elastic/elasticsearch
```

### クライアント初期化

```typescript
// lib/elasticsearch.ts
import { Client } from "@elastic/elasticsearch";

// ローカル接続
const client = new Client({
  node: "http://localhost:9200",
});

// Elastic Cloud 接続
const cloudClient = new Client({
  cloud: {
    id: process.env.ELASTIC_CLOUD_ID!,
  },
  auth: {
    apiKey: process.env.ELASTIC_API_KEY!,
  },
});

export default client;
```

### 環境変数

```env
# .env.local
ELASTIC_CLOUD_ID=my-deployment:xxxx
ELASTIC_API_KEY=your-api-key
```

## インデックスの作成

### 基本的なインデックス

```typescript
import client from "./lib/elasticsearch";

async function createIndex() {
  await client.indices.create({
    index: "products",
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            // 日本語アナライザー
            ja_analyzer: {
              type: "custom",
              tokenizer: "kuromoji_tokenizer",
              filter: ["kuromoji_baseform", "lowercase"],
            },
          },
        },
      },
      mappings: {
        properties: {
          id: { type: "keyword" },
          name: {
            type: "text",
            analyzer: "ja_analyzer",
            fields: {
              keyword: { type: "keyword" },
            },
          },
          description: {
            type: "text",
            analyzer: "ja_analyzer",
          },
          price: { type: "integer" },
          category: { type: "keyword" },
          tags: { type: "keyword" },
          created_at: { type: "date" },
          updated_at: { type: "date" },
        },
      },
    },
  });

  console.log("Index created");
}
```

### マッピングタイプ

```typescript
const mappings = {
  properties: {
    // 文字列
    name: { type: "text" },           // 全文検索用
    status: { type: "keyword" },      // 完全一致用

    // 数値
    price: { type: "integer" },       // 整数
    rating: { type: "float" },        // 小数

    // 真偽値
    is_active: { type: "boolean" },

    // 日時
    created_at: { type: "date" },

    // オブジェクト
    author: {
      properties: {
        name: { type: "text" },
        email: { type: "keyword" },
      },
    },

    // ネストされた配列
    reviews: {
      type: "nested",
      properties: {
        user_id: { type: "keyword" },
        rating: { type: "integer" },
        comment: { type: "text" },
      },
    },

    // 地理座標
    location: { type: "geo_point" },
  },
};
```

## ドキュメントの操作

### 挿入

```typescript
// 単一ドキュメント
async function indexDocument(product: Product) {
  await client.index({
    index: "products",
    id: product.id,
    body: {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  });
}

// 一括挿入
async function bulkIndex(products: Product[]) {
  const operations = products.flatMap((product) => [
    { index: { _index: "products", _id: product.id } },
    {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const result = await client.bulk({ body: operations, refresh: true });

  if (result.errors) {
    console.error("Bulk indexing errors:", result.items);
  }
}
```

### 取得

```typescript
async function getDocument(id: string) {
  const result = await client.get({
    index: "products",
    id,
  });

  return result._source;
}
```

### 更新

```typescript
async function updateDocument(id: string, updates: Partial<Product>) {
  await client.update({
    index: "products",
    id,
    body: {
      doc: {
        ...updates,
        updated_at: new Date().toISOString(),
      },
    },
  });
}
```

### 削除

```typescript
async function deleteDocument(id: string) {
  await client.delete({
    index: "products",
    id,
  });
}
```

## 基本的な検索

```typescript
async function search(query: string) {
  const result = await client.search({
    index: "products",
    body: {
      query: {
        multi_match: {
          query,
          fields: ["name^2", "description"],
        },
      },
    },
  });

  return result.hits.hits.map((hit) => ({
    id: hit._id,
    score: hit._score,
    ...hit._source,
  }));
}
```

## Next.js API Route

```typescript
// app/api/search/route.ts
import { NextResponse } from "next/server";
import client from "@/lib/elasticsearch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const result = await client.search({
      index: "products",
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ["name^2", "description", "tags"],
          },
        },
        size: 20,
      },
    });

    const products = result.hits.hits.map((hit) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
    }));

    return NextResponse.json({
      total: result.hits.total,
      products,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
```

## 接続確認

```typescript
async function checkConnection() {
  try {
    const info = await client.info();
    console.log("Connected to Elasticsearch:", info.version.number);
    return true;
  } catch (error) {
    console.error("Elasticsearch connection failed:", error);
    return false;
  }
}
```

## 次のステップ

次章では、Elasticsearch の検索クエリについて詳しく学びます。
