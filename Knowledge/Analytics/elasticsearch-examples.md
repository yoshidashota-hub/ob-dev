# Elasticsearch サンプル集

## 接続設定

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
// 商品インデックス（日本語対応）
await esClient.indices.create({
  index: 'products',
  body: {
    settings: {
      analysis: {
        analyzer: {
          ja_analyzer: {
            type: 'custom',
            tokenizer: 'kuromoji_tokenizer',
            filter: ['kuromoji_baseform', 'lowercase', 'cjk_width'],
          },
        },
      },
    },
    mappings: {
      properties: {
        name: {
          type: 'text',
          analyzer: 'ja_analyzer',
          fields: { keyword: { type: 'keyword' } },
        },
        description: { type: 'text', analyzer: 'ja_analyzer' },
        price: { type: 'integer' },
        category: { type: 'keyword' },
        tags: { type: 'keyword' },
        stock: { type: 'integer' },
        createdAt: { type: 'date' },
        suggest: { type: 'completion', analyzer: 'ja_analyzer' },
      },
    },
  },
});
```

## データ投入

```typescript
// バルクインデックス
async function indexProducts(products: Product[]) {
  const operations = products.flatMap((doc) => [
    { index: { _index: 'products', _id: doc.id } },
    {
      ...doc,
      suggest: {
        input: [doc.name, ...doc.tags],
        weight: doc.stock > 0 ? 10 : 1,
      },
    },
  ]);

  const result = await esClient.bulk({ refresh: true, operations });

  if (result.errors) {
    console.error('Bulk indexing errors:', result.items);
  }

  return result;
}
```

## 検索 API

```typescript
// app/api/search/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const must: any[] = [];
  const filter: any[] = [];

  // テキスト検索
  if (q) {
    must.push({
      multi_match: {
        query: q,
        fields: ['name^3', 'description', 'tags^2'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }

  // フィルター
  if (category) {
    filter.push({ term: { category } });
  }
  if (minPrice || maxPrice) {
    filter.push({
      range: {
        price: {
          ...(minPrice && { gte: parseInt(minPrice) }),
          ...(maxPrice && { lte: parseInt(maxPrice) }),
        },
      },
    });
  }
  // 在庫ありのみ
  filter.push({ range: { stock: { gt: 0 } } });

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
        fields: { name: {}, description: {} },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
      aggs: {
        categories: { terms: { field: 'category', size: 20 } },
        price_ranges: {
          range: {
            field: 'price',
            ranges: [
              { to: 1000, key: '〜1,000円' },
              { from: 1000, to: 5000, key: '1,000〜5,000円' },
              { from: 5000, to: 10000, key: '5,000〜10,000円' },
              { from: 10000, key: '10,000円〜' },
            ],
          },
        },
      },
      from: (page - 1) * limit,
      size: limit,
      sort: q ? ['_score', { createdAt: 'desc' }] : [{ createdAt: 'desc' }],
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
    aggregations: {
      categories: (result.aggregations?.categories as any)?.buckets || [],
      priceRanges: (result.aggregations?.price_ranges as any)?.buckets || [],
    },
  });
}
```

## 自動補完

```typescript
// app/api/suggest/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  const result = await esClient.search({
    index: 'products',
    body: {
      suggest: {
        product_suggest: {
          prefix: q,
          completion: {
            field: 'suggest',
            size: 10,
            fuzzy: { fuzziness: 'AUTO' },
            skip_duplicates: true,
          },
        },
      },
    },
  });

  const suggestions = (result.suggest?.product_suggest[0]?.options || []).map(
    (opt: any) => ({
      text: opt.text,
      score: opt._score,
    })
  );

  return Response.json({ suggestions });
}
```

## ログ検索（ELK パターン）

```typescript
// ログインデックス
await esClient.indices.create({
  index: 'logs-2024.01',
  body: {
    mappings: {
      properties: {
        '@timestamp': { type: 'date' },
        level: { type: 'keyword' },
        message: { type: 'text' },
        service: { type: 'keyword' },
        trace_id: { type: 'keyword' },
        user_id: { type: 'keyword' },
        metadata: { type: 'object', enabled: false },
      },
    },
  },
});

// ログ検索
const logs = await esClient.search({
  index: 'logs-*',
  body: {
    query: {
      bool: {
        must: [
          { match: { message: 'error' } },
        ],
        filter: [
          { range: { '@timestamp': { gte: 'now-1h' } } },
          { term: { level: 'error' } },
        ],
      },
    },
    sort: [{ '@timestamp': 'desc' }],
    size: 100,
  },
});
```

## 集計

```typescript
// 時系列集計
const result = await esClient.search({
  index: 'products',
  body: {
    size: 0,
    aggs: {
      sales_over_time: {
        date_histogram: {
          field: 'createdAt',
          calendar_interval: 'day',
        },
        aggs: {
          total_revenue: { sum: { field: 'price' } },
          avg_price: { avg: { field: 'price' } },
        },
      },
    },
  },
});
```
