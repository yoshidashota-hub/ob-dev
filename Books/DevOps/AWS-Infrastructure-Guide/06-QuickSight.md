# 第6章: QuickSight

## QuickSight 概要

```
┌─────────────────────────────────────────────────────────────┐
│                    QuickSight Architecture                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Data Sources                        │   │
│  │  S3 │ RDS │ Redshift │ Athena │ DynamoDB │ API     │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    SPICE                             │   │
│  │           (Super-fast, Parallel,                     │   │
│  │            In-memory Calculation Engine)             │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Dashboards                           │   │
│  │  Charts │ Tables │ KPIs │ Maps │ Insights          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## データソース接続

### S3 + Athena

```sql
-- Athena でテーブル作成
CREATE EXTERNAL TABLE IF NOT EXISTS sales (
  order_id STRING,
  customer_id STRING,
  product_id STRING,
  quantity INT,
  price DECIMAL(10,2),
  order_date DATE
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe'
WITH SERDEPROPERTIES (
  'serialization.format' = ',',
  'field.delim' = ','
)
LOCATION 's3://my-bucket/sales/'
TBLPROPERTIES ('has_encrypted_data'='false');
```

### RDS 接続

```
QuickSight → RDS 接続設定:
1. VPC 接続を有効化
2. セキュリティグループで QuickSight IP を許可
3. 接続情報を入力:
   - Host: mydb.xxxxx.ap-northeast-1.rds.amazonaws.com
   - Port: 5432
   - Database: myapp
   - Username: quicksight_user
   - Password: ***
```

### データセット作成（SQL）

```sql
-- カスタム SQL でデータセット作成
SELECT
  DATE_TRUNC('day', o.created_at) AS order_date,
  p.category,
  COUNT(*) AS order_count,
  SUM(o.amount) AS total_revenue,
  AVG(o.amount) AS avg_order_value
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.created_at >= DATE_ADD('day', -90, CURRENT_DATE)
GROUP BY 1, 2
```

## 計算フィールド

### 基本計算

```
// 売上成長率
percentDifference(
  sum({revenue}),
  sum({revenue}),
  [{order_date} ASC]
)

// 前年同期比
periodOverPeriodPercentDifference(
  sum({revenue}),
  {order_date},
  YEAR,
  1
)

// 累計
runningSum(
  sum({revenue}),
  [{order_date} ASC]
)
```

### 条件付き計算

```
// 顧客セグメント
ifelse(
  {total_orders} >= 10, 'VIP',
  {total_orders} >= 5, 'Regular',
  'New'
)

// 達成率
ifelse(
  {target} > 0,
  {actual} / {target} * 100,
  0
)

// NULL 処理
ifelse(
  isNull({value}),
  0,
  {value}
)
```

### 日付計算

```
// 曜日名
extract('WD', {order_date})

// 月初
truncDate('MM', {order_date})

// 経過日数
dateDiff({order_date}, now(), 'DD')

// 直近 30 日フラグ
ifelse(
  dateDiff({order_date}, now(), 'DD') <= 30,
  'Last 30 Days',
  'Older'
)
```

## ビジュアル作成

### KPI カード

```
設定:
- 値: sum({revenue})
- 比較値: sum({last_month_revenue})
- 比較方法: 差分パーセント
- 条件付き書式:
  - 緑: 増加
  - 赤: 減少
```

### 折れ線グラフ

```
設定:
- X軸: {order_date}（日付）
- 値: sum({revenue})
- グループ: {category}
- 参照線: 目標値
```

### ファネルチャート

```
設定:
- グループ: {funnel_stage}
- 値: count({user_id})
- 並び順:
  1. Visit
  2. Product View
  3. Add to Cart
  4. Checkout
  5. Purchase
```

## パラメータとフィルター

### 日付パラメータ

```
パラメータ設定:
- 名前: StartDate
- データ型: 日時
- デフォルト値: 相対日付（過去30日）

コントロール:
- 日付ピッカー
- ラベル: "開始日"
```

### 動的フィルター

```
計算フィールドでパラメータを使用:
ifelse(
  {order_date} >= ${StartDate} AND {order_date} <= ${EndDate},
  {revenue},
  NULL
)
```

### カスケードフィルター

```
設定:
1. 地域フィルター（全体に適用）
2. 店舗フィルター（地域でフィルター済み）
3. カテゴリフィルター

依存関係:
店舗 → 地域に依存
```

## 埋め込み分析

### 埋め込み URL 生成

```typescript
// Lambda で埋め込み URL 生成
import {
  QuickSightClient,
  GenerateEmbedUrlForRegisteredUserCommand,
} from "@aws-sdk/client-quicksight";

const quicksight = new QuickSightClient({ region: "ap-northeast-1" });

export async function generateEmbedUrl(
  userArn: string,
  dashboardId: string,
): Promise<string> {
  const response = await quicksight.send(
    new GenerateEmbedUrlForRegisteredUserCommand({
      AwsAccountId: process.env.AWS_ACCOUNT_ID!,
      UserArn: userArn,
      ExperienceConfiguration: {
        Dashboard: {
          InitialDashboardId: dashboardId,
        },
      },
      AllowedDomains: ["https://example.com"],
      SessionLifetimeInMinutes: 600,
    }),
  );

  return response.EmbedUrl!;
}
```

### React での埋め込み

```typescript
// components/EmbeddedDashboard.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  dashboardId: string;
}

export function EmbeddedDashboard({ dashboardId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        // 埋め込み URL を取得
        const response = await fetch(`/api/quicksight/embed?id=${dashboardId}`);
        const { embedUrl } = await response.json();

        // QuickSight SDK をロード
        const { createEmbeddingContext } = await import(
          "amazon-quicksight-embedding-sdk"
        );

        const embeddingContext = await createEmbeddingContext();

        // ダッシュボードを埋め込み
        await embeddingContext.embedDashboard(
          {
            url: embedUrl,
            container: containerRef.current!,
            height: "600px",
            width: "100%",
          },
          {
            onMessage: (event) => {
              console.log("Dashboard event:", event);
            },
          }
        );

        setLoading(false);
      } catch (err) {
        setError("ダッシュボードの読み込みに失敗しました");
        setLoading(false);
      }
    }

    loadDashboard();
  }, [dashboardId]);

  if (loading) {
    return <div className="animate-pulse h-[600px] bg-gray-200 rounded" />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return <div ref={containerRef} />;
}
```

### API エンドポイント

```typescript
// app/api/quicksight/embed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedUrl } from "@/lib/quicksight";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dashboardId = searchParams.get("id");

  if (!dashboardId) {
    return NextResponse.json(
      { error: "Dashboard ID required" },
      { status: 400 },
    );
  }

  // ユーザー認証チェック
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userArn = `arn:aws:quicksight:ap-northeast-1:${process.env.AWS_ACCOUNT_ID}:user/default/${session.email}`;
    const embedUrl = await generateEmbedUrl(userArn, dashboardId);

    return NextResponse.json({ embedUrl });
  } catch (error) {
    console.error("Embed URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate embed URL" },
      { status: 500 },
    );
  }
}
```

## SPICE 管理

### 容量管理

```bash
# SPICE 容量確認
aws quicksight describe-account-settings \
  --aws-account-id 123456789012

# データセット更新
aws quicksight create-ingestion \
  --aws-account-id 123456789012 \
  --data-set-id my-dataset-id \
  --ingestion-id $(date +%Y%m%d%H%M%S)
```

### スケジュール更新

```
設定:
- 更新頻度: 毎日
- 時刻: 06:00 (JST)
- タイムゾーン: Asia/Tokyo
- 失敗時の通知: SNS トピック
```

## コスト最適化

```
┌────────────────────────────────────────────────────────────┐
│                 QuickSight コスト管理                        │
│                                                            │
│  ユーザータイプ:                                            │
│  • Author: $24/月 - ダッシュボード作成可能                   │
│  • Reader: $0.30/セッション（最大$5/月）                    │
│                                                            │
│  SPICE:                                                     │
│  • $0.25/GB/月（10GB 無料）                                 │
│  • 必要最小限のデータをインポート                            │
│                                                            │
│  最適化のポイント:                                          │
│  • Reader は使用頻度に応じて割り当て                         │
│  • SPICE データは定期的にクリーンアップ                      │
│  • 集計済みデータをインポート（raw データは避ける）          │
└────────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、監視とログについて学びます。
