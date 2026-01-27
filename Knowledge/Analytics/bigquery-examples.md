# BigQuery サンプル集

## 接続設定

```typescript
// lib/bigquery.ts
import { BigQuery } from '@google-cloud/bigquery';

export const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
```

## イベント収集

```typescript
// app/api/events/route.ts
import { bigquery } from '@/lib/bigquery';

export async function POST(req: Request) {
  const event = await req.json();

  const row = {
    event_id: crypto.randomUUID(),
    event_name: event.name,
    user_id: event.userId,
    session_id: event.sessionId,
    properties: JSON.stringify(event.properties),
    event_timestamp: new Date().toISOString(),
    user_agent: req.headers.get('user-agent'),
    ip_address: req.headers.get('x-forwarded-for'),
  };

  await bigquery
    .dataset('analytics')
    .table('events')
    .insert([row]);

  return Response.json({ success: true });
}
```

## 分析クエリ

### DAU/MAU

```sql
-- 日次アクティブユーザー
SELECT
  DATE(event_timestamp) AS date,
  COUNT(DISTINCT user_id) AS dau
FROM
  `project.analytics.events`
WHERE
  _PARTITIONDATE BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) AND CURRENT_DATE()
GROUP BY
  date
ORDER BY
  date;

-- 月次アクティブユーザー
SELECT
  DATE_TRUNC(event_timestamp, MONTH) AS month,
  COUNT(DISTINCT user_id) AS mau
FROM
  `project.analytics.events`
WHERE
  _PARTITIONDATE >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
GROUP BY
  month
ORDER BY
  month;
```

### ファネル分析

```sql
WITH funnel AS (
  SELECT
    user_id,
    MAX(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS viewed,
    MAX(CASE WHEN event_name = 'add_to_cart' THEN 1 ELSE 0 END) AS added_to_cart,
    MAX(CASE WHEN event_name = 'checkout_start' THEN 1 ELSE 0 END) AS started_checkout,
    MAX(CASE WHEN event_name = 'purchase' THEN 1 ELSE 0 END) AS purchased
  FROM
    `project.analytics.events`
  WHERE
    _PARTITIONDATE = CURRENT_DATE()
  GROUP BY
    user_id
)
SELECT
  COUNT(DISTINCT CASE WHEN viewed = 1 THEN user_id END) AS step1_viewed,
  COUNT(DISTINCT CASE WHEN added_to_cart = 1 THEN user_id END) AS step2_cart,
  COUNT(DISTINCT CASE WHEN started_checkout = 1 THEN user_id END) AS step3_checkout,
  COUNT(DISTINCT CASE WHEN purchased = 1 THEN user_id END) AS step4_purchased
FROM
  funnel;
```

### コホート分析

```sql
WITH user_cohort AS (
  SELECT
    user_id,
    DATE_TRUNC(MIN(event_timestamp), WEEK) AS cohort_week
  FROM
    `project.analytics.events`
  GROUP BY
    user_id
),
user_activity AS (
  SELECT
    e.user_id,
    c.cohort_week,
    DATE_DIFF(DATE(e.event_timestamp), c.cohort_week, WEEK) AS weeks_since_signup
  FROM
    `project.analytics.events` e
  JOIN
    user_cohort c ON e.user_id = c.user_id
)
SELECT
  cohort_week,
  weeks_since_signup,
  COUNT(DISTINCT user_id) AS users
FROM
  user_activity
WHERE
  weeks_since_signup <= 8
GROUP BY
  cohort_week, weeks_since_signup
ORDER BY
  cohort_week, weeks_since_signup;
```

## Node.js からクエリ実行

```typescript
// app/api/analytics/daily/route.ts
import { bigquery } from '@/lib/bigquery';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const query = `
    SELECT
      DATE(event_timestamp) AS date,
      event_name,
      COUNT(*) AS count,
      COUNT(DISTINCT user_id) AS unique_users
    FROM
      \`${process.env.GCP_PROJECT_ID}.analytics.events\`
    WHERE
      _PARTITIONDATE BETWEEN @startDate AND @endDate
    GROUP BY
      date, event_name
    ORDER BY
      date DESC, count DESC
  `;

  const [rows] = await bigquery.query({
    query,
    params: { startDate, endDate },
  });

  return Response.json({ data: rows });
}
```

## テーブル作成

```sql
CREATE TABLE `project.analytics.events`
(
  event_id STRING NOT NULL,
  event_name STRING NOT NULL,
  user_id STRING,
  session_id STRING,
  properties JSON,
  event_timestamp TIMESTAMP NOT NULL,
  user_agent STRING,
  ip_address STRING
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY user_id, event_name
OPTIONS (
  description = 'User events table',
  require_partition_filter = true
);
```

## マテリアライズドビュー

```sql
CREATE MATERIALIZED VIEW `project.analytics.daily_stats`
OPTIONS (
  enable_refresh = true,
  refresh_interval_minutes = 60
)
AS
SELECT
  DATE(event_timestamp) AS date,
  event_name,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_id) AS unique_users
FROM
  `project.analytics.events`
GROUP BY
  date, event_name;
```
