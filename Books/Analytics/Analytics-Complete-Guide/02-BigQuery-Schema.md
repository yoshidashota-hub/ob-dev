# 第2章: BigQuery スキーマ設計

## データ型

```
┌─────────────────────────────────────────────────────┐
│              BigQuery Data Types                     │
│                                                     │
│  基本型                                              │
│  ├── STRING    文字列                                │
│  ├── INT64     整数                                  │
│  ├── FLOAT64   浮動小数点                            │
│  ├── BOOL      真偽値                                │
│  ├── BYTES     バイナリ                              │
│  └── NUMERIC   高精度数値（通貨等）                   │
│                                                     │
│  日時型                                              │
│  ├── DATE      日付（2024-01-15）                    │
│  ├── TIME      時刻（12:30:00）                      │
│  ├── DATETIME  日時（タイムゾーンなし）               │
│  └── TIMESTAMP 日時（UTC タイムゾーン）              │
│                                                     │
│  複合型                                              │
│  ├── ARRAY     配列                                  │
│  ├── STRUCT    構造体                                │
│  └── JSON      JSON データ                           │
└─────────────────────────────────────────────────────┘
```

## テーブル設計パターン

### イベントテーブル

```sql
CREATE TABLE analytics.events (
  -- 識別子
  id STRING NOT NULL,

  -- イベント情報
  event_name STRING NOT NULL,
  event_category STRING,

  -- ユーザー情報
  user_id STRING,
  session_id STRING,

  -- プロパティ（柔軟な構造）
  properties JSON,

  -- コンテキスト
  page_url STRING,
  referrer STRING,
  user_agent STRING,
  ip_address STRING,

  -- 地理情報
  country STRING,
  region STRING,
  city STRING,

  -- タイムスタンプ
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_name, user_id;
```

### ユーザーテーブル

```sql
CREATE TABLE analytics.users (
  id STRING NOT NULL,
  email STRING,
  name STRING,

  -- 属性
  plan STRING,  -- free, pro, enterprise
  status STRING,  -- active, inactive, churned

  -- メタデータ
  first_seen_at TIMESTAMP,
  last_seen_at TIMESTAMP,
  total_events INT64,

  -- 更新日時
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
)
CLUSTER BY plan, status;
```

### セッションテーブル

```sql
CREATE TABLE analytics.sessions (
  id STRING NOT NULL,
  user_id STRING,

  -- セッション情報
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_seconds INT64,

  -- 流入元
  source STRING,
  medium STRING,
  campaign STRING,

  -- デバイス情報
  device_type STRING,  -- desktop, mobile, tablet
  browser STRING,
  os STRING,

  -- 集計
  page_views INT64,
  events_count INT64
)
PARTITION BY DATE(started_at)
CLUSTER BY user_id;
```

## パーティショニング

### 日付パーティション

```sql
-- 日付でパーティション（推奨）
CREATE TABLE analytics.events (
  ...
)
PARTITION BY DATE(timestamp);

-- 月単位でパーティション
CREATE TABLE analytics.monthly_reports (
  ...
)
PARTITION BY DATE_TRUNC(report_date, MONTH);

-- 整数でパーティション
CREATE TABLE analytics.users_partitioned (
  ...
)
PARTITION BY RANGE_BUCKET(user_id_numeric, GENERATE_ARRAY(0, 1000000, 10000));
```

### パーティションのメリット

```sql
-- パーティションプルーニング
-- 指定した日付のパーティションのみスキャン
SELECT * FROM analytics.events
WHERE timestamp BETWEEN '2024-01-01' AND '2024-01-31';

-- コスト削減: フルスキャン vs パーティションスキャン
-- 1年分のデータ (365TB) → 1ヶ月分 (30TB) のスキャンに削減
```

## クラスタリング

```sql
-- クラスタリングでクエリ効率化
CREATE TABLE analytics.events (
  ...
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_name, user_id;

-- クラスタリングが効くクエリ
SELECT * FROM analytics.events
WHERE event_name = 'purchase' AND user_id = 'user_123';
```

### クラスタリングのベストプラクティス

```
クラスタリング列の選択基準:
1. WHERE句で頻繁に使用する列
2. カーディナリティが高い列（一意の値が多い）
3. 最大4列まで指定可能
4. 順序が重要（最も使う列を最初に）

例:
✅ CLUSTER BY user_id, event_name
❌ CLUSTER BY timestamp (パーティションと重複)
```

## STRUCT と ARRAY

### STRUCT（構造体）

```sql
CREATE TABLE analytics.orders (
  id STRING NOT NULL,

  -- STRUCT: ネストした構造
  customer STRUCT<
    id STRING,
    name STRING,
    email STRING
  >,

  -- STRUCT の配列
  items ARRAY<STRUCT<
    product_id STRING,
    name STRING,
    quantity INT64,
    price NUMERIC
  >>,

  total_amount NUMERIC,
  created_at TIMESTAMP
);

-- 挿入
INSERT INTO analytics.orders VALUES (
  'order_001',
  STRUCT('cust_001', 'John', 'john@example.com'),
  [
    STRUCT('prod_001', 'Widget', 2, 100.00),
    STRUCT('prod_002', 'Gadget', 1, 200.00)
  ],
  400.00,
  CURRENT_TIMESTAMP()
);

-- クエリ
SELECT
  id,
  customer.name as customer_name,
  (SELECT SUM(quantity) FROM UNNEST(items)) as total_items
FROM analytics.orders;
```

### JSON 型

```sql
CREATE TABLE analytics.events (
  id STRING NOT NULL,
  event_name STRING NOT NULL,
  properties JSON,  -- 柔軟なスキーマ
  timestamp TIMESTAMP
);

-- JSON の挿入
INSERT INTO analytics.events VALUES (
  'evt_001',
  'purchase',
  JSON '{"product_id": "prod_123", "amount": 1000, "currency": "JPY"}',
  CURRENT_TIMESTAMP()
);

-- JSON からの値取得
SELECT
  id,
  event_name,
  JSON_VALUE(properties, '$.product_id') as product_id,
  CAST(JSON_VALUE(properties, '$.amount') AS INT64) as amount
FROM analytics.events;
```

## スキーマ進化

### 列の追加

```sql
-- 新しい列を追加（既存データは NULL）
ALTER TABLE analytics.events
ADD COLUMN device_type STRING;
```

### 列の名前変更

```sql
ALTER TABLE analytics.events
RENAME COLUMN old_name TO new_name;
```

### テーブルの複製と移行

```sql
-- 新スキーマでテーブル作成
CREATE TABLE analytics.events_v2 AS
SELECT
  id,
  event_name,
  user_id,
  -- 変換やデフォルト値を設定
  IFNULL(device_type, 'unknown') as device_type,
  timestamp
FROM analytics.events;
```

## TypeScript での型定義

```typescript
// types/bigquery.ts

// イベントの型
interface AnalyticsEvent {
  id: string;
  event_name: string;
  user_id: string | null;
  properties: Record<string, unknown>;
  timestamp: string;
  created_at: string;
}

// BigQuery の行を変換
function toAnalyticsEvent(row: any): AnalyticsEvent {
  return {
    id: row.id,
    event_name: row.event_name,
    user_id: row.user_id,
    properties: row.properties ? JSON.parse(row.properties) : {},
    timestamp: row.timestamp.value,
    created_at: row.created_at.value,
  };
}

// 挿入用データの型
interface InsertEvent {
  id: string;
  event_name: string;
  user_id?: string;
  properties?: Record<string, unknown>;
}

function toInsertRow(event: InsertEvent) {
  return {
    id: event.id,
    event_name: event.event_name,
    user_id: event.user_id || null,
    properties: event.properties ? JSON.stringify(event.properties) : null,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}
```

## 次のステップ

次章では、BigQuery のクエリと分析について詳しく学びます。
