# 第9章: ベストプラクティス

## BigQuery ベストプラクティス

### クエリの最適化

```sql
-- ✅ 必要な列のみ選択
SELECT id, name, price FROM products;

-- ❌ SELECT * は避ける
SELECT * FROM products;

-- ✅ パーティションを活用
SELECT * FROM events
WHERE DATE(timestamp) = '2024-01-15';

-- ✅ クラスタリング列でフィルター
SELECT * FROM events
WHERE event_name = 'purchase'
  AND user_id = 'user_123';
```

### コスト管理

```typescript
// クエリのコスト見積もり
async function estimateQueryCost(query: string) {
  const [job] = await bigquery.createQueryJob({
    query,
    dryRun: true,
  });

  const bytesProcessed = parseInt(job.metadata.statistics.totalBytesProcessed);
  const cost = (bytesProcessed / 1e12) * 5; // $5/TB

  return {
    bytesProcessed,
    estimatedCost: `$${cost.toFixed(4)}`,
  };
}
```

### テーブル設計

```
推奨:
✓ 日付パーティション（最も使用する日付列で）
✓ クラスタリング（WHERE/JOIN で使う列）
✓ JSON 型で柔軟なスキーマ
✓ TIMESTAMP > DATE（時刻情報を保持）

避ける:
✗ 過度に正規化（JOIN コストが高い）
✗ パーティションなしの大規模テーブル
✗ 頻繁なストリーミング挿入（コスト）
```

## Elasticsearch ベストプラクティス

### インデックス設計

```typescript
// ✅ 適切なマッピング
const mapping = {
  properties: {
    // 検索用は text
    name: {
      type: "text",
      analyzer: "ja_analyzer",
      fields: {
        keyword: { type: "keyword" }, // ソート・集計用
      },
    },
    // 完全一致・フィルターは keyword
    category: { type: "keyword" },
    status: { type: "keyword" },
    // 数値は適切な型
    price: { type: "integer" },
    rating: { type: "float" },
  },
};
```

### クエリの最適化

```typescript
// ✅ フィルターを使う（キャッシュされる）
const query = {
  bool: {
    must: [{ match: { name: searchTerm } }],
    filter: [
      { term: { category: "electronics" } },
      { range: { price: { lte: 10000 } } },
    ],
  },
};

// ✅ 必要なフィールドのみ取得
const result = await client.search({
  index: "products",
  body: {
    query,
    _source: ["id", "name", "price"], // 必要な列のみ
    size: 20,
  },
});

// ✅ 深いページネーションを避ける
// from: 10000 は遅い → search_after を使用
```

### バルク操作

```typescript
// ✅ 一括挿入
const operations = products.flatMap((p) => [
  { index: { _index: "products", _id: p.id } },
  p,
]);

await client.bulk({
  body: operations,
  refresh: false, // バルク後にまとめてリフレッシュ
});

await client.indices.refresh({ index: "products" });
```

## プロジェクト構成

```
src/
├── lib/
│   ├── bigquery/
│   │   ├── client.ts        # BigQuery クライアント
│   │   ├── queries/         # クエリファイル
│   │   │   ├── events.ts
│   │   │   └── users.ts
│   │   └── types.ts
│   ├── elasticsearch/
│   │   ├── client.ts        # ES クライアント
│   │   ├── indices/         # インデックス定義
│   │   │   └── products.ts
│   │   └── queries/         # 検索クエリ
│   │       └── search.ts
│   └── sync/
│       ├── product-sync.ts
│       └── event-listener.ts
├── app/
│   └── api/
│       ├── events/          # イベント収集
│       ├── search/          # 検索 API
│       └── analytics/       # 分析 API
└── scripts/
    ├── setup-bigquery.ts
    ├── setup-elasticsearch.ts
    └── sync-all.ts
```

## エラーハンドリング

### BigQuery

```typescript
import { BigQuery } from "@google-cloud/bigquery";

async function safeQuery<T>(query: string, params?: Record<string, any>): Promise<T[]> {
  try {
    const [rows] = await bigquery.query({ query, params });
    return rows as T[];
  } catch (error: any) {
    if (error.code === 400) {
      console.error("Invalid query:", error.message);
      throw new Error("Invalid query");
    }
    if (error.code === 403) {
      console.error("Permission denied:", error.message);
      throw new Error("Permission denied");
    }
    throw error;
  }
}
```

### Elasticsearch

```typescript
import { Client, errors } from "@elastic/elasticsearch";

async function safeSearch(index: string, body: any) {
  try {
    return await client.search({ index, body });
  } catch (error) {
    if (error instanceof errors.ResponseError) {
      if (error.statusCode === 404) {
        console.error("Index not found:", index);
        return { hits: { hits: [], total: { value: 0 } } };
      }
      if (error.statusCode === 400) {
        console.error("Bad request:", error.message);
        throw new Error("Invalid search query");
      }
    }
    throw error;
  }
}
```

## 監視とアラート

### BigQuery 監視

```typescript
// クエリログの取得
const query = `
  SELECT
    creation_time,
    user_email,
    query,
    total_bytes_processed,
    total_slot_ms
  FROM \`region-asia-northeast1\`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
  WHERE creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
  ORDER BY total_bytes_processed DESC
  LIMIT 20
`;
```

### Elasticsearch 監視

```typescript
// クラスター状態
const health = await client.cluster.health();
console.log("Cluster status:", health.status); // green, yellow, red

// インデックス統計
const stats = await client.indices.stats({ index: "products" });
console.log("Docs count:", stats._all.primaries.docs.count);
console.log("Store size:", stats._all.primaries.store.size_in_bytes);
```

## セキュリティ

### BigQuery

```typescript
// 環境変数でクレデンシャル管理
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// ビューでアクセス制限
// 機密データは別テーブルに分離
```

### Elasticsearch

```typescript
// API Key 認証
const client = new Client({
  cloud: { id: process.env.ELASTIC_CLOUD_ID! },
  auth: { apiKey: process.env.ELASTIC_API_KEY! },
});

// インデックス権限の分離
// 読み取り専用の API Key を使用
```

## チェックリスト

### BigQuery

```
□ パーティショニング設定
□ クラスタリング設定
□ 適切なデータ型
□ クエリコストの監視
□ 権限の最小化
□ バックアップ設定
```

### Elasticsearch

```
□ 適切なマッピング定義
□ シャード数の最適化
□ レプリカ設定
□ インデックステンプレート
□ バックアップ（スナップショット）
□ 監視アラート設定
```

### データ同期

```
□ 同期方式の選択
□ エラーハンドリング
□ リトライロジック
□ 整合性チェック
□ 監視とアラート
```

## 参考リンク

- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [BigQuery Best Practices](https://cloud.google.com/bigquery/docs/best-practices-performance-overview)
- [Elasticsearch Performance](https://www.elastic.co/guide/en/elasticsearch/reference/current/tune-for-search-speed.html)
