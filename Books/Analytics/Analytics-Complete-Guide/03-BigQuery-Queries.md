# 第3章: BigQuery クエリと分析

## 基本的なクエリ

### SELECT

```sql
-- 基本
SELECT event_name, COUNT(*) as count
FROM `project.analytics.events`
GROUP BY event_name
ORDER BY count DESC;

-- WHERE 条件
SELECT *
FROM `project.analytics.events`
WHERE event_name = 'purchase'
  AND timestamp >= '2024-01-01'
  AND user_id IS NOT NULL;

-- LIMIT と OFFSET
SELECT * FROM `project.analytics.events`
ORDER BY timestamp DESC
LIMIT 100 OFFSET 0;
```

### 集計関数

```sql
SELECT
  -- カウント
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,

  -- 合計・平均
  SUM(CAST(JSON_VALUE(properties, '$.amount') AS INT64)) as total_amount,
  AVG(CAST(JSON_VALUE(properties, '$.amount') AS INT64)) as avg_amount,

  -- 最大・最小
  MAX(timestamp) as last_event,
  MIN(timestamp) as first_event

FROM `project.analytics.events`
WHERE event_name = 'purchase';
```

## 時系列分析

### 日別集計

```sql
SELECT
  DATE(timestamp) as date,
  COUNT(*) as events,
  COUNT(DISTINCT user_id) as users
FROM `project.analytics.events`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date;
```

### 時間別集計

```sql
SELECT
  EXTRACT(HOUR FROM timestamp) as hour,
  COUNT(*) as events
FROM `project.analytics.events`
WHERE DATE(timestamp) = CURRENT_DATE()
GROUP BY hour
ORDER BY hour;
```

### 週別・月別

```sql
-- 週別
SELECT
  DATE_TRUNC(timestamp, WEEK) as week,
  COUNT(*) as events
FROM `project.analytics.events`
GROUP BY week
ORDER BY week;

-- 月別
SELECT
  FORMAT_TIMESTAMP('%Y-%m', timestamp) as month,
  COUNT(*) as events,
  COUNT(DISTINCT user_id) as users
FROM `project.analytics.events`
GROUP BY month
ORDER BY month;
```

## ユーザー分析

### ファネル分析

```sql
WITH funnel AS (
  SELECT
    user_id,
    MAX(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as viewed,
    MAX(CASE WHEN event_name = 'add_to_cart' THEN 1 ELSE 0 END) as added_to_cart,
    MAX(CASE WHEN event_name = 'checkout' THEN 1 ELSE 0 END) as checkout,
    MAX(CASE WHEN event_name = 'purchase' THEN 1 ELSE 0 END) as purchased
  FROM `project.analytics.events`
  WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  GROUP BY user_id
)
SELECT
  COUNT(*) as total_users,
  SUM(viewed) as step1_viewed,
  SUM(added_to_cart) as step2_cart,
  SUM(checkout) as step3_checkout,
  SUM(purchased) as step4_purchase,
  -- コンバージョン率
  ROUND(SUM(purchased) / SUM(viewed) * 100, 2) as conversion_rate
FROM funnel;
```

### コホート分析

```sql
WITH user_cohort AS (
  SELECT
    user_id,
    DATE_TRUNC(MIN(timestamp), WEEK) as cohort_week
  FROM `project.analytics.events`
  GROUP BY user_id
),
user_activity AS (
  SELECT
    e.user_id,
    c.cohort_week,
    DATE_DIFF(DATE(e.timestamp), DATE(c.cohort_week), WEEK) as weeks_since_signup
  FROM `project.analytics.events` e
  JOIN user_cohort c ON e.user_id = c.user_id
)
SELECT
  cohort_week,
  weeks_since_signup,
  COUNT(DISTINCT user_id) as users
FROM user_activity
WHERE weeks_since_signup <= 8
GROUP BY cohort_week, weeks_since_signup
ORDER BY cohort_week, weeks_since_signup;
```

### リテンション率

```sql
WITH first_activity AS (
  SELECT
    user_id,
    DATE(MIN(timestamp)) as first_date
  FROM `project.analytics.events`
  GROUP BY user_id
),
retention AS (
  SELECT
    f.first_date,
    DATE_DIFF(DATE(e.timestamp), f.first_date, DAY) as days_since_first,
    COUNT(DISTINCT e.user_id) as users
  FROM `project.analytics.events` e
  JOIN first_activity f ON e.user_id = f.user_id
  GROUP BY first_date, days_since_first
)
SELECT
  first_date,
  MAX(CASE WHEN days_since_first = 0 THEN users END) as day_0,
  MAX(CASE WHEN days_since_first = 1 THEN users END) as day_1,
  MAX(CASE WHEN days_since_first = 7 THEN users END) as day_7,
  MAX(CASE WHEN days_since_first = 30 THEN users END) as day_30
FROM retention
GROUP BY first_date
ORDER BY first_date DESC;
```

## ウィンドウ関数

### ランキング

```sql
SELECT
  user_id,
  event_count,
  ROW_NUMBER() OVER (ORDER BY event_count DESC) as rank,
  RANK() OVER (ORDER BY event_count DESC) as rank_with_ties,
  DENSE_RANK() OVER (ORDER BY event_count DESC) as dense_rank
FROM (
  SELECT user_id, COUNT(*) as event_count
  FROM `project.analytics.events`
  GROUP BY user_id
);
```

### 累積合計

```sql
SELECT
  date,
  daily_revenue,
  SUM(daily_revenue) OVER (ORDER BY date) as cumulative_revenue,
  AVG(daily_revenue) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg_7d
FROM (
  SELECT
    DATE(timestamp) as date,
    SUM(CAST(JSON_VALUE(properties, '$.amount') AS INT64)) as daily_revenue
  FROM `project.analytics.events`
  WHERE event_name = 'purchase'
  GROUP BY date
)
ORDER BY date;
```

### 前後の値との比較

```sql
SELECT
  date,
  users,
  LAG(users, 1) OVER (ORDER BY date) as prev_day_users,
  LEAD(users, 1) OVER (ORDER BY date) as next_day_users,
  users - LAG(users, 1) OVER (ORDER BY date) as diff_from_prev
FROM (
  SELECT DATE(timestamp) as date, COUNT(DISTINCT user_id) as users
  FROM `project.analytics.events`
  GROUP BY date
)
ORDER BY date;
```

## Node.js でのクエリ実行

### 基本的なクエリ

```typescript
import bigquery from "./lib/bigquery";

async function getDailyStats(days: number = 7) {
  const query = `
    SELECT
      DATE(timestamp) as date,
      COUNT(*) as events,
      COUNT(DISTINCT user_id) as users
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.analytics.events\`
    WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
    GROUP BY date
    ORDER BY date DESC
  `;

  const [rows] = await bigquery.query({
    query,
    params: { days },
  });

  return rows;
}
```

### パラメータ化クエリ

```typescript
async function getEventsByUser(userId: string, eventName?: string) {
  let query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.analytics.events\`
    WHERE user_id = @userId
  `;

  const params: Record<string, string> = { userId };

  if (eventName) {
    query += ` AND event_name = @eventName`;
    params.eventName = eventName;
  }

  query += ` ORDER BY timestamp DESC LIMIT 100`;

  const [rows] = await bigquery.query({ query, params });
  return rows;
}
```

### 大量データの処理

```typescript
async function processLargeQuery() {
  const query = `
    SELECT * FROM \`project.analytics.events\`
    WHERE timestamp >= '2024-01-01'
  `;

  // ページネーション
  const options = {
    query,
    maxResults: 1000,
    autoPaginate: false,
  };

  const [job] = await bigquery.createQueryJob(options);
  let [rows, nextQuery] = await job.getQueryResults();

  while (rows.length > 0) {
    // 処理
    rows.forEach((row) => {
      console.log(row);
    });

    if (!nextQuery) break;
    [rows, nextQuery] = await job.getQueryResults(nextQuery);
  }
}
```

## API Route での実装

```typescript
// app/api/analytics/daily/route.ts
import { NextResponse } from "next/server";
import bigquery from "@/lib/bigquery";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7");

  try {
    const query = `
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as events,
        COUNT(DISTINCT user_id) as users,
        COUNT(DISTINCT session_id) as sessions
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.analytics.events\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
      GROUP BY date
      ORDER BY date DESC
    `;

    const [rows] = await bigquery.query({ query, params: { days } });

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("BigQuery error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
```

## 次のステップ

次章では、BigQuery へのストリーミング挿入について詳しく学びます。
