# 第0章: はじめに

## データ分析プラットフォームの選択

```
┌─────────────────────────────────────────────────────┐
│            データ分析プラットフォーム                │
│                                                     │
│  ┌───────────────────┐  ┌───────────────────┐      │
│  │     BigQuery      │  │   Elasticsearch   │      │
│  │                   │  │                   │      │
│  │ • 大規模データ分析 │  │ • 全文検索        │      │
│  │ • SQL クエリ      │  │ • リアルタイム検索 │      │
│  │ • BI/レポート     │  │ • ログ分析        │      │
│  │ • バッチ処理      │  │ • モニタリング    │      │
│  └───────────────────┘  └───────────────────┘      │
│                                                     │
│  用途に応じて選択 or 組み合わせ                      │
└─────────────────────────────────────────────────────┘
```

## BigQuery vs Elasticsearch

| 項目       | BigQuery     | Elasticsearch    |
| ---------- | ------------ | ---------------- |
| 主な用途   | 分析・集計   | 検索・ログ       |
| クエリ言語 | SQL          | Query DSL        |
| スケール   | ペタバイト   | テラバイト       |
| レイテンシ | 秒〜分       | ミリ秒           |
| 料金体系   | クエリ量課金 | インスタンス課金 |
| マネージド | GCP          | Elastic Cloud    |

## ユースケース別選択

### BigQuery が向いているケース

```
✓ 月次/週次レポート
✓ ユーザー行動分析
✓ 売上・KPI 分析
✓ アドホッククエリ
✓ 機械学習（BigQuery ML）
```

### Elasticsearch が向いているケース

```
✓ 商品検索
✓ ログ分析（ELK Stack）
✓ リアルタイムモニタリング
✓ 自動補完・サジェスト
✓ 地理空間検索
```

## アーキテクチャ例

### イベント収集 → 分析

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │ ──▶ │  API     │ ──▶ │ BigQuery │
│          │     │          │     │          │
│ イベント  │     │ 収集     │     │ 分析     │
│ 送信     │     │ バッファ  │     │ ダッシュ │
└──────────┘     └──────────┘     └──────────┘
```

### 検索システム

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │ ──▶ │  API     │ ──▶ │ Elastic  │
│          │     │          │     │ search   │
│ 検索     │     │ クエリ   │     │          │
│ リクエスト│ ◀── │ 変換     │ ◀── │ 検索     │
└──────────┘     └──────────┘     └──────────┘
       │
       ▼
┌──────────┐
│ Database │
│ (原本)   │
└──────────┘
```

## Next.js での活用

```typescript
// イベント収集 API
// app/api/events/route.ts
export async function POST(req: Request) {
  const event = await req.json();

  // BigQuery へストリーミング挿入
  await bigquery
    .dataset("analytics")
    .table("events")
    .insert([{ ...event, timestamp: new Date() }]);

  return Response.json({ success: true });
}

// 検索 API
// app/api/search/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  // Elasticsearch で検索
  const result = await esClient.search({
    index: "products",
    body: {
      query: { match: { name: q } },
    },
  });

  return Response.json({ data: result.hits.hits });
}
```

## 次のステップ

Part 1 では BigQuery を使ったデータ分析基盤の構築を学びます。
