# 第4章: BigQuery ストリーミング

## ストリーミング挿入とは

リアルタイムでデータを BigQuery に挿入する仕組み。

```
┌─────────────────────────────────────────────────────┐
│            Streaming Insert Flow                     │
│                                                     │
│  ┌─────────┐     ┌─────────┐     ┌─────────────┐   │
│  │  Client │ ──▶ │   API   │ ──▶ │  BigQuery   │   │
│  └─────────┘     └─────────┘     │  Streaming  │   │
│                                   │   Buffer    │   │
│                                   └──────┬──────┘   │
│                                          │          │
│                                          ▼          │
│                                   ┌─────────────┐   │
│                                   │   Table     │   │
│                                   │  (Storage)  │   │
│                                   └─────────────┘   │
│                                                     │
│  特徴:                                              │
│  • リアルタイム挿入（秒単位）                        │
│  • クエリ可能になるまで数秒〜数分                    │
│  • バッチより高コスト（$0.05/200MB）                │
└─────────────────────────────────────────────────────┘
```

## 基本的なストリーミング挿入

```typescript
// lib/bigquery.ts
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();

interface Event {
  id: string;
  eventName: string;
  userId?: string;
  properties?: Record<string, unknown>;
}

export async function insertEvent(event: Event): Promise<void> {
  const datasetId = "analytics";
  const tableId = "events";

  const row = {
    id: event.id,
    event_name: event.eventName,
    user_id: event.userId || null,
    properties: event.properties ? JSON.stringify(event.properties) : null,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  await bigquery.dataset(datasetId).table(tableId).insert([row]);
}
```

## バッファリングと一括挿入

### バッファの実装

```typescript
// lib/event-buffer.ts
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();

interface EventRow {
  id: string;
  event_name: string;
  user_id: string | null;
  properties: string | null;
  timestamp: string;
  created_at: string;
}

class EventBuffer {
  private buffer: EventRow[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly maxBufferSize = 500;
  private readonly flushIntervalMs = 5000; // 5秒

  constructor() {
    this.startFlushInterval();
  }

  add(event: EventRow): void {
    this.buffer.push(event);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushIntervalMs);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const rows = [...this.buffer];
    this.buffer = [];

    try {
      await bigquery.dataset("analytics").table("events").insert(rows);
      console.log(`Flushed ${rows.length} events`);
    } catch (error) {
      console.error("Failed to flush events:", error);
      // 失敗した行を再度バッファに追加
      this.buffer.unshift(...rows);
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}

export const eventBuffer = new EventBuffer();
```

### 使用例

```typescript
// app/api/events/route.ts
import { NextResponse } from "next/server";
import { eventBuffer } from "@/lib/event-buffer";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { eventName, userId, properties } = await req.json();

  eventBuffer.add({
    id: randomUUID(),
    event_name: eventName,
    user_id: userId || null,
    properties: properties ? JSON.stringify(properties) : null,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
```

## Pub/Sub を使った非同期挿入

### アーキテクチャ

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Client │ ──▶ │   API   │ ──▶ │ Pub/Sub │ ──▶ │ BigQuery│
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                     │                               ▲
                     │          ┌─────────┐          │
                     └─────────▶│ Worker  │──────────┘
                                └─────────┘
```

### Pub/Sub へのパブリッシュ

```typescript
// lib/pubsub.ts
import { PubSub } from "@google-cloud/pubsub";

const pubsub = new PubSub();
const topicName = "analytics-events";

interface Event {
  id: string;
  eventName: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp: string;
}

export async function publishEvent(event: Event): Promise<void> {
  const topic = pubsub.topic(topicName);
  const data = Buffer.from(JSON.stringify(event));
  await topic.publishMessage({ data });
}
```

### Cloud Functions で処理

```typescript
// functions/process-events.ts
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();

interface PubSubMessage {
  data: string;
}

export async function processEvents(message: PubSubMessage): Promise<void> {
  const eventData = JSON.parse(Buffer.from(message.data, "base64").toString());

  const row = {
    id: eventData.id,
    event_name: eventData.eventName,
    user_id: eventData.userId || null,
    properties: eventData.properties
      ? JSON.stringify(eventData.properties)
      : null,
    timestamp: eventData.timestamp,
    created_at: new Date().toISOString(),
  };

  await bigquery.dataset("analytics").table("events").insert([row]);
}
```

## エラーハンドリング

### 部分的な挿入エラー

```typescript
async function insertWithRetry(
  rows: EventRow[],
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await bigquery.dataset("analytics").table("events").insert(rows, {
        skipInvalidRows: false, // 無効な行はスキップしない
        ignoreUnknownValues: false, // 未知のフィールドはエラー
      });
      return;
    } catch (error: any) {
      if (error.name === "PartialFailureError") {
        // 一部の行だけ失敗
        const failedRows = error.errors.map((e: any) => rows[e.row]);
        console.error("Partial failure:", error.errors);

        // 失敗した行だけ再試行
        rows = failedRows;
      } else {
        throw error;
      }
    }

    // 指数バックオフ
    await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
  }

  throw new Error("Max retries exceeded");
}
```

### デッドレターキュー

```typescript
// 失敗したイベントを別テーブルに保存
async function handleFailedEvent(event: EventRow, error: Error): Promise<void> {
  await bigquery
    .dataset("analytics")
    .table("failed_events")
    .insert([
      {
        original_event: JSON.stringify(event),
        error_message: error.message,
        failed_at: new Date().toISOString(),
      },
    ]);
}
```

## 重複排除

### insertId の使用

```typescript
async function insertEventWithDedup(event: Event): Promise<void> {
  const row = {
    insertId: event.id, // 重複排除キー
    json: {
      id: event.id,
      event_name: event.eventName,
      user_id: event.userId,
      properties: JSON.stringify(event.properties),
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  };

  await bigquery.dataset("analytics").table("events").insert([row], {
    raw: true,
  });
}
```

### クエリ時の重複排除

```sql
-- 同じ id の重複を排除
SELECT * EXCEPT(row_num)
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as row_num
  FROM `project.analytics.events`
)
WHERE row_num = 1;
```

## パフォーマンス最適化

### バッチサイズの最適化

```typescript
// 推奨: 500行または1MBを超えない
const OPTIMAL_BATCH_SIZE = 500;
const MAX_PAYLOAD_SIZE = 1_000_000; // 1MB

function splitIntoBatches(rows: EventRow[]): EventRow[][] {
  const batches: EventRow[][] = [];
  let currentBatch: EventRow[] = [];
  let currentSize = 0;

  for (const row of rows) {
    const rowSize = JSON.stringify(row).length;

    if (
      currentBatch.length >= OPTIMAL_BATCH_SIZE ||
      currentSize + rowSize > MAX_PAYLOAD_SIZE
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }

    currentBatch.push(row);
    currentSize += rowSize;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}
```

### 並列挿入

```typescript
async function insertParallel(rows: EventRow[]): Promise<void> {
  const batches = splitIntoBatches(rows);

  await Promise.all(
    batches.map((batch) =>
      bigquery.dataset("analytics").table("events").insert(batch),
    ),
  );
}
```

## コスト管理

```
ストリーミング挿入のコスト:
• $0.05 per 200MB（成功した挿入）

バッチロード（無料）との比較:
• リアルタイム性が不要 → バッチロード
• 数秒の遅延が許容できる → バッファリング + バッチ

最適化:
1. バッファリングで挿入回数を減らす
2. 不要なフィールドを削除
3. JSON の圧縮
```

## 次のステップ

次章では、Elasticsearch のセットアップについて学びます。
