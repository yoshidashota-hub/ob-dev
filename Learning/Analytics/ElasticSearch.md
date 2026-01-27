# Elasticsearch 学習ノート

## 概要

Elasticsearch は分散型の検索・分析エンジン。全文検索、ログ分析、リアルタイム検索に最適。

## 基本概念

```
┌─────────────────────────────────────────────────────┐
│                   Elasticsearch                      │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Cluster   │  │    Index    │  │  Document   │ │
│  │  (クラスタ) │──│  (≒テーブル)│──│  (≒レコード)│ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│  Index は複数の Shard に分散                        │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
npm install @elastic/elasticsearch
```

```typescript
// lib/elasticsearch.ts
import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY!,
  },
});
```

## インデックス作成

```typescript
// インデックス作成（マッピング定義）
await esClient.indices.create({
  index: 'products',
  body: {
    mappings: {
      properties: {
        name: {
          type: 'text',
          analyzer: 'kuromoji', // 日本語
          fields: {
            keyword: { type: 'keyword' }, // 完全一致用
          },
        },
        description: { type: 'text', analyzer: 'kuromoji' },
        price: { type: 'integer' },
        category: { type: 'keyword' },
        tags: { type: 'keyword' },
        createdAt: { type: 'date' },
      },
    },
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
    },
  },
});
```

## CRUD 操作

### ドキュメント追加

```typescript
// 単一追加
await esClient.index({
  index: 'products',
  id: 'product-123',
  body: {
    name: 'TypeScript入門',
    description: 'TypeScriptの基礎から応用まで',
    price: 2980,
    category: 'book',
    tags: ['typescript', 'programming'],
    createdAt: new Date(),
  },
});

// バルク追加
const products = [/* ... */];
const operations = products.flatMap((doc) => [
  { index: { _index: 'products', _id: doc.id } },
  doc,
]);

await esClient.bulk({ refresh: true, operations });
```

### 検索

```typescript
// 基本検索
const result = await esClient.search({
  index: 'products',
  body: {
    query: {
      match: {
        name: 'TypeScript',
      },
    },
  },
});

// 複合検索
const result = await esClient.search({
  index: 'products',
  body: {
    query: {
      bool: {
        must: [
          { match: { name: 'TypeScript' } },
        ],
        filter: [
          { term: { category: 'book' } },
          { range: { price: { lte: 5000 } } },
        ],
      },
    },
    sort: [{ price: 'asc' }],
    from: 0,
    size: 20,
  },
});
```

## 全文検索 API

```typescript
// app/api/search/route.ts
import { esClient } from '@/lib/elasticsearch';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const must: any[] = [];
  const filter: any[] = [];

  if (q) {
    must.push({
      multi_match: {
        query: q,
        fields: ['name^2', 'description'], // name に重み付け
        type: 'best_fields',
        fuzziness: 'AUTO', // タイポ許容
      },
    });
  }

  if (category) {
    filter.push({ term: { category } });
  }

  const result = await esClient.search({
    index: 'products',
    body: {
      query: {
        bool: {
          must: must.length ? must : [{ match_all: {} }],
          filter,
        },
      },
      highlight: {
        fields: {
          name: {},
          description: {},
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
      from: (page - 1) * limit,
      size: limit,
    },
  });

  return Response.json({
    data: result.hits.hits.map((hit: any) => ({
      ...hit._source,
      id: hit._id,
      score: hit._score,
      highlight: hit.highlight,
    })),
    meta: {
      total: (result.hits.total as any).value,
      page,
      limit,
    },
  });
}
```

## 集計（Aggregation）

```typescript
// カテゴリ別集計
const result = await esClient.search({
  index: 'products',
  body: {
    size: 0, // ドキュメントは不要
    aggs: {
      categories: {
        terms: { field: 'category' },
        aggs: {
          avg_price: { avg: { field: 'price' } },
        },
      },
      price_ranges: {
        range: {
          field: 'price',
          ranges: [
            { to: 1000 },
            { from: 1000, to: 5000 },
            { from: 5000 },
          ],
        },
      },
    },
  },
});
```

## 自動補完（Suggest）

```typescript
// Completion Suggester 用マッピング
await esClient.indices.create({
  index: 'products',
  body: {
    mappings: {
      properties: {
        suggest: {
          type: 'completion',
          analyzer: 'kuromoji',
        },
      },
    },
  },
});

// 補完検索
const result = await esClient.search({
  index: 'products',
  body: {
    suggest: {
      product_suggest: {
        prefix: 'type',
        completion: {
          field: 'suggest',
          fuzzy: { fuzziness: 'AUTO' },
        },
      },
    },
  },
});
```

## 日本語対応

```json
// インデックス設定
{
  "settings": {
    "analysis": {
      "analyzer": {
        "ja_analyzer": {
          "type": "custom",
          "tokenizer": "kuromoji_tokenizer",
          "filter": ["kuromoji_baseform", "lowercase"]
        }
      }
    }
  }
}
```

## ベストプラクティス

1. **適切なマッピング**: 検索パターンに合わせて設計
2. **バルク操作**: 大量データは bulk API で
3. **インデックスエイリアス**: 無停止でインデックス切り替え
4. **シャード設計**: データ量に応じて調整

## 参考リソース

- [Elasticsearch ドキュメント](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Elastic Cloud](https://www.elastic.co/cloud/)
