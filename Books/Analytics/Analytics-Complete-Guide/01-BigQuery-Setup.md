# 第1章: BigQuery セットアップ

## BigQuery とは

Google Cloud の完全マネージド型データウェアハウス。

```
┌─────────────────────────────────────────────────────┐
│                  BigQuery                            │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              特徴                             │   │
│  │                                              │   │
│  │  • サーバーレス（インフラ管理不要）            │   │
│  │  • ペタバイト規模のデータ処理                 │   │
│  │  • 標準 SQL をサポート                        │   │
│  │  • 従量課金（クエリ量・ストレージ）           │   │
│  │  • ストリーミング挿入対応                     │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## GCP プロジェクトのセットアップ

### 1. プロジェクト作成

```bash
# gcloud CLI のインストール
brew install google-cloud-sdk

# ログイン
gcloud auth login

# プロジェクト作成
gcloud projects create my-analytics-project

# プロジェクト設定
gcloud config set project my-analytics-project

# BigQuery API 有効化
gcloud services enable bigquery.googleapis.com
```

### 2. サービスアカウント作成

```bash
# サービスアカウント作成
gcloud iam service-accounts create bigquery-client \
  --display-name="BigQuery Client"

# 権限付与
gcloud projects add-iam-policy-binding my-analytics-project \
  --member="serviceAccount:bigquery-client@my-analytics-project.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding my-analytics-project \
  --member="serviceAccount:bigquery-client@my-analytics-project.iam.gserviceaccount.com" \
  --role="roles/bigquery.jobUser"

# キーファイル作成
gcloud iam service-accounts keys create ./credentials.json \
  --iam-account=bigquery-client@my-analytics-project.iam.gserviceaccount.com
```

## Node.js クライアントのセットアップ

### インストール

```bash
npm install @google-cloud/bigquery
```

### 環境変数

```env
# .env.local
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
GOOGLE_CLOUD_PROJECT=my-analytics-project
```

### クライアント初期化

```typescript
// lib/bigquery.ts
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default bigquery;
```

## データセットとテーブルの作成

### データセット作成

```typescript
// scripts/setup-bigquery.ts
import bigquery from "../lib/bigquery";

async function createDataset() {
  const datasetId = "analytics";

  const [dataset] = await bigquery.createDataset(datasetId, {
    location: "asia-northeast1", // 東京リージョン
  });

  console.log(`Dataset ${dataset.id} created.`);
}
```

### テーブル作成

```typescript
async function createTable() {
  const datasetId = "analytics";
  const tableId = "events";

  const schema = [
    { name: "id", type: "STRING", mode: "REQUIRED" },
    { name: "event_name", type: "STRING", mode: "REQUIRED" },
    { name: "user_id", type: "STRING", mode: "NULLABLE" },
    { name: "properties", type: "JSON", mode: "NULLABLE" },
    { name: "timestamp", type: "TIMESTAMP", mode: "REQUIRED" },
    { name: "created_at", type: "TIMESTAMP", mode: "REQUIRED" },
  ];

  const options = {
    schema,
    timePartitioning: {
      type: "DAY",
      field: "timestamp",
    },
  };

  const [table] = await bigquery
    .dataset(datasetId)
    .createTable(tableId, options);

  console.log(`Table ${table.id} created.`);
}
```

### SQL でのテーブル作成

```sql
-- BigQuery コンソールで実行
CREATE TABLE analytics.events (
  id STRING NOT NULL,
  event_name STRING NOT NULL,
  user_id STRING,
  properties JSON,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_name, user_id;
```

## 基本的なクエリ

```typescript
import bigquery from "./lib/bigquery";

// シンプルなクエリ
async function runQuery() {
  const query = `
    SELECT event_name, COUNT(*) as count
    FROM \`my-analytics-project.analytics.events\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    GROUP BY event_name
    ORDER BY count DESC
    LIMIT 10
  `;

  const [rows] = await bigquery.query({ query });

  console.log("Results:");
  rows.forEach((row) => {
    console.log(`${row.event_name}: ${row.count}`);
  });

  return rows;
}
```

## データ挿入

### バッチ挿入

```typescript
async function insertRows() {
  const datasetId = "analytics";
  const tableId = "events";

  const rows = [
    {
      id: "evt_001",
      event_name: "page_view",
      user_id: "user_123",
      properties: JSON.stringify({ page: "/home" }),
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "evt_002",
      event_name: "button_click",
      user_id: "user_123",
      properties: JSON.stringify({ button: "signup" }),
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  await bigquery.dataset(datasetId).table(tableId).insert(rows);

  console.log(`Inserted ${rows.length} rows`);
}
```

### ストリーミング挿入

```typescript
async function streamInsert(event: Event) {
  const datasetId = "analytics";
  const tableId = "events";

  await bigquery
    .dataset(datasetId)
    .table(tableId)
    .insert([
      {
        id: event.id,
        event_name: event.name,
        user_id: event.userId,
        properties: JSON.stringify(event.properties),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]);
}
```

## Next.js API Route

```typescript
// app/api/events/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { eventName, userId, properties } = await req.json();

    await bigquery
      .dataset("analytics")
      .table("events")
      .insert([
        {
          id: randomUUID(),
          event_name: eventName,
          user_id: userId,
          properties: JSON.stringify(properties),
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BigQuery insert error:", error);
    return NextResponse.json(
      { error: "Failed to insert event" },
      { status: 500 },
    );
  }
}
```

## クライアント側のイベント送信

```typescript
// lib/analytics.ts
export async function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        userId: getUserId(), // 実装に応じて
        properties,
      }),
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

// 使用例
trackEvent("page_view", { page: "/products" });
trackEvent("purchase", { productId: "prod_123", amount: 1000 });
```

## 次のステップ

次章では、BigQuery のスキーマ設計について詳しく学びます。
