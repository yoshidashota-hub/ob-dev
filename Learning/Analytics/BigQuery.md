# BigQuery 学習ノート

## 概要

BigQuery は Google Cloud のサーバーレスデータウェアハウス。ペタバイト規模のデータを高速に分析可能。

## 基本概念

```
┌─────────────────────────────────────────────────────┐
│                    BigQuery                          │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Project   │  │   Dataset   │  │    Table    │ │
│  │  (GCP PJ)   │──│  (スキーマ)  │──│  (データ)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│  project.dataset.table                             │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
npm install @google-cloud/bigquery
```

```typescript
// lib/bigquery.ts
import { BigQuery } from '@google-cloud/bigquery';

export const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
```

## 基本クエリ

### SELECT

```sql
-- 基本的な SELECT
SELECT
  user_id,
  event_name,
  event_timestamp,
  device.category AS device_category
FROM
  `project.dataset.events`
WHERE
  _PARTITIONDATE = '2024-01-15'
  AND event_name = 'purchase'
ORDER BY
  event_timestamp DESC
LIMIT 100;
```

### 集計

```sql
-- 日別売上集計
SELECT
  DATE(event_timestamp) AS date,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) AS total_events,
  SUM(revenue) AS total_revenue
FROM
  `project.dataset.events`
WHERE
  event_name = 'purchase'
  AND _PARTITIONDATE BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY
  date
ORDER BY
  date;
```

### ウィンドウ関数

```sql
-- ユーザーごとの購入回数ランキング
SELECT
  user_id,
  purchase_count,
  RANK() OVER (ORDER BY purchase_count DESC) AS rank
FROM (
  SELECT
    user_id,
    COUNT(*) AS purchase_count
  FROM
    `project.dataset.events`
  WHERE
    event_name = 'purchase'
  GROUP BY
    user_id
);
```

## Node.js から実行

```typescript
// app/api/analytics/route.ts
import { bigquery } from '@/lib/bigquery';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const query = `
    SELECT
      DATE(event_timestamp) AS date,
      COUNT(DISTINCT user_id) AS dau,
      COUNT(*) AS events
    FROM
      \`${process.env.GCP_PROJECT_ID}.analytics.events\`
    WHERE
      _PARTITIONDATE BETWEEN @startDate AND @endDate
    GROUP BY
      date
    ORDER BY
      date
  `;

  const options = {
    query,
    params: { startDate, endDate },
  };

  const [rows] = await bigquery.query(options);

  return Response.json({ data: rows });
}
```

## データ挿入

```typescript
// ストリーミング挿入
async function insertEvents(events: any[]) {
  const dataset = bigquery.dataset('analytics');
  const table = dataset.table('events');

  await table.insert(events);
}

// バッチロード
async function loadFromGCS(gcsUri: string) {
  const dataset = bigquery.dataset('analytics');
  const table = dataset.table('events');

  const [job] = await table.load(gcsUri, {
    sourceFormat: 'NEWLINE_DELIMITED_JSON',
    writeDisposition: 'WRITE_APPEND',
  });

  await job.promise();
}
```

## パーティションとクラスタリング

```sql
-- パーティションテーブル作成
CREATE TABLE `project.dataset.events`
(
  event_id STRING,
  user_id STRING,
  event_name STRING,
  event_timestamp TIMESTAMP,
  properties JSON
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY user_id, event_name;
```

## コスト最適化

1. **パーティションで絞り込み**: `_PARTITIONDATE` を WHERE に含める
2. **SELECT * を避ける**: 必要なカラムのみ選択
3. **クラスタリング活用**: 頻繁にフィルタするカラムでクラスタ
4. **マテリアライズドビュー**: 頻繁に使う集計を事前計算

```sql
-- マテリアライズドビュー
CREATE MATERIALIZED VIEW `project.dataset.daily_stats`
AS
SELECT
  DATE(event_timestamp) AS date,
  event_name,
  COUNT(*) AS count
FROM
  `project.dataset.events`
GROUP BY
  date, event_name;
```

## Vercel Analytics 代替

```typescript
// イベント収集 API
export async function POST(req: Request) {
  const event = await req.json();

  const row = {
    event_id: crypto.randomUUID(),
    ...event,
    event_timestamp: new Date().toISOString(),
  };

  await bigquery
    .dataset('analytics')
    .table('events')
    .insert([row]);

  return Response.json({ success: true });
}
```

## 参考リソース

- [BigQuery ドキュメント](https://cloud.google.com/bigquery/docs)
- [BigQuery SQL リファレンス](https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax)
