# 第6章: Elasticsearch 検索クエリ

## クエリ DSL の基本

```
┌─────────────────────────────────────────────────────┐
│               Query DSL Structure                    │
│                                                     │
│  {                                                  │
│    "query": {           ← 検索条件                  │
│      "bool": { ... }                                │
│    },                                               │
│    "from": 0,           ← ページング                │
│    "size": 10,                                      │
│    "sort": [ ... ],     ← ソート                    │
│    "aggs": { ... },     ← 集計                      │
│    "_source": [ ... ]   ← 返すフィールド            │
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

## 基本的なクエリ

### Match Query

```typescript
// 全文検索
const result = await client.search({
  index: "products",
  body: {
    query: {
      match: {
        name: "スマートフォン",
      },
    },
  },
});
```

### Multi Match Query

```typescript
// 複数フィールドを検索
const result = await client.search({
  index: "products",
  body: {
    query: {
      multi_match: {
        query: "iPhone",
        fields: ["name^2", "description", "tags"], // ^2 はブースト
        type: "best_fields",
      },
    },
  },
});
```

### Term Query（完全一致）

```typescript
// keyword フィールドの完全一致
const result = await client.search({
  index: "products",
  body: {
    query: {
      term: {
        category: "electronics",
      },
    },
  },
});
```

### Range Query

```typescript
// 範囲検索
const result = await client.search({
  index: "products",
  body: {
    query: {
      range: {
        price: {
          gte: 1000,
          lte: 5000,
        },
      },
    },
  },
});

// 日付範囲
const result = await client.search({
  index: "products",
  body: {
    query: {
      range: {
        created_at: {
          gte: "now-7d/d",
          lt: "now/d",
        },
      },
    },
  },
});
```

## Bool Query（複合条件）

```typescript
const result = await client.search({
  index: "products",
  body: {
    query: {
      bool: {
        // すべて満たす（AND）
        must: [{ match: { name: "スマートフォン" } }],
        // いずれかを満たす（OR）
        should: [
          { term: { category: "electronics" } },
          { term: { category: "mobile" } },
        ],
        // 除外する（NOT）
        must_not: [{ term: { status: "discontinued" } }],
        // フィルター（スコアに影響しない）
        filter: [
          { range: { price: { gte: 1000, lte: 100000 } } },
          { term: { is_active: true } },
        ],
        // should の最小マッチ数
        minimum_should_match: 1,
      },
    },
  },
});
```

## フィルタリング

```typescript
// フィルターはキャッシュされ高速
const result = await client.search({
  index: "products",
  body: {
    query: {
      bool: {
        must: [{ match: { name: query } }],
        filter: [
          { term: { category: "electronics" } },
          { range: { price: { lte: maxPrice } } },
          { terms: { tags: ["new", "sale"] } },
        ],
      },
    },
  },
});
```

## ソート

```typescript
const result = await client.search({
  index: "products",
  body: {
    query: { match_all: {} },
    sort: [
      { price: "asc" },
      { _score: "desc" },
      { created_at: { order: "desc", missing: "_last" } },
    ],
  },
});
```

## ページネーション

### From / Size

```typescript
// 基本的なページネーション
const page = 2;
const pageSize = 20;

const result = await client.search({
  index: "products",
  body: {
    query: { match_all: {} },
    from: (page - 1) * pageSize,
    size: pageSize,
  },
});
```

### Search After（大量データ向け）

```typescript
// 最初のページ
const firstPage = await client.search({
  index: "products",
  body: {
    query: { match_all: {} },
    size: 20,
    sort: [{ created_at: "desc" }, { _id: "asc" }],
  },
});

// 次のページ
const lastHit = firstPage.hits.hits[firstPage.hits.hits.length - 1];
const nextPage = await client.search({
  index: "products",
  body: {
    query: { match_all: {} },
    size: 20,
    sort: [{ created_at: "desc" }, { _id: "asc" }],
    search_after: lastHit.sort,
  },
});
```

## ハイライト

```typescript
const result = await client.search({
  index: "products",
  body: {
    query: {
      multi_match: {
        query: "スマートフォン",
        fields: ["name", "description"],
      },
    },
    highlight: {
      fields: {
        name: {},
        description: { fragment_size: 150, number_of_fragments: 3 },
      },
      pre_tags: ["<em>"],
      post_tags: ["</em>"],
    },
  },
});

// 結果
// hit.highlight = {
//   name: ["<em>スマートフォン</em>ケース"],
//   description: ["最新の<em>スマートフォン</em>向け..."]
// }
```

## 集計（Aggregations）

### Terms 集計

```typescript
const result = await client.search({
  index: "products",
  body: {
    size: 0, // ドキュメントは不要
    aggs: {
      categories: {
        terms: {
          field: "category",
          size: 10,
        },
      },
    },
  },
});

// result.aggregations.categories.buckets = [
//   { key: "electronics", doc_count: 150 },
//   { key: "clothing", doc_count: 120 },
// ]
```

### Range 集計

```typescript
const result = await client.search({
  index: "products",
  body: {
    size: 0,
    aggs: {
      price_ranges: {
        range: {
          field: "price",
          ranges: [
            { to: 1000 },
            { from: 1000, to: 5000 },
            { from: 5000, to: 10000 },
            { from: 10000 },
          ],
        },
      },
    },
  },
});
```

### Stats 集計

```typescript
const result = await client.search({
  index: "products",
  body: {
    size: 0,
    aggs: {
      price_stats: {
        stats: {
          field: "price",
        },
      },
    },
  },
});

// result.aggregations.price_stats = {
//   count: 100,
//   min: 100,
//   max: 99900,
//   avg: 15000,
//   sum: 1500000
// }
```

### 複合集計

```typescript
const result = await client.search({
  index: "products",
  body: {
    size: 0,
    aggs: {
      categories: {
        terms: { field: "category" },
        aggs: {
          avg_price: {
            avg: { field: "price" },
          },
          top_products: {
            top_hits: {
              size: 3,
              sort: [{ price: "desc" }],
            },
          },
        },
      },
    },
  },
});
```

## 実装例：検索 API

```typescript
// app/api/products/search/route.ts
import { NextResponse } from "next/server";
import client from "@/lib/elasticsearch";

interface SearchParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const params: SearchParams = {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    minPrice: searchParams.get("minPrice")
      ? parseInt(searchParams.get("minPrice")!)
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? parseInt(searchParams.get("maxPrice")!)
      : undefined,
    page: parseInt(searchParams.get("page") || "1"),
    pageSize: parseInt(searchParams.get("pageSize") || "20"),
    sort: searchParams.get("sort") || "relevance",
  };

  try {
    const must: any[] = [];
    const filter: any[] = [];

    // テキスト検索
    if (params.q) {
      must.push({
        multi_match: {
          query: params.q,
          fields: ["name^2", "description", "tags"],
          fuzziness: "AUTO",
        },
      });
    }

    // カテゴリフィルター
    if (params.category) {
      filter.push({ term: { category: params.category } });
    }

    // 価格フィルター
    if (params.minPrice || params.maxPrice) {
      filter.push({
        range: {
          price: {
            ...(params.minPrice && { gte: params.minPrice }),
            ...(params.maxPrice && { lte: params.maxPrice }),
          },
        },
      });
    }

    // ソート
    const sort =
      params.sort === "price_asc"
        ? [{ price: "asc" }]
        : params.sort === "price_desc"
          ? [{ price: "desc" }]
          : params.sort === "newest"
            ? [{ created_at: "desc" }]
            : [{ _score: "desc" }];

    const result = await client.search({
      index: "products",
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter,
          },
        },
        from: (params.page! - 1) * params.pageSize!,
        size: params.pageSize,
        sort,
        aggs: {
          categories: {
            terms: { field: "category", size: 20 },
          },
          price_range: {
            stats: { field: "price" },
          },
        },
        highlight: params.q
          ? {
              fields: {
                name: {},
                description: { fragment_size: 150 },
              },
            }
          : undefined,
      },
    });

    return NextResponse.json({
      total: result.hits.total,
      page: params.page,
      pageSize: params.pageSize,
      products: result.hits.hits.map((hit) => ({
        id: hit._id,
        score: hit._score,
        highlight: hit.highlight,
        ...hit._source,
      })),
      aggregations: {
        categories: result.aggregations?.categories,
        priceRange: result.aggregations?.price_range,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
```

## 次のステップ

次章では、自動補完とサジェスト機能について学びます。
