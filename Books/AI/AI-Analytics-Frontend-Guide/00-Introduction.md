# 第0章: はじめに

## AI x Analytics x Frontend とは

AI、データ分析、フロントエンドを統合したアプリケーション。

```
┌─────────────────────────────────────────────────────┐
│           AI Analytics Dashboard                     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │            Frontend (Next.js)                │   │
│  │  • ダッシュボード UI                          │   │
│  │  • チャットインターフェース                   │   │
│  │  • リアルタイム可視化                        │   │
│  └─────────────────────────────────────────────┘   │
│                        │                           │
│           ┌────────────┴────────────┐              │
│           ▼                         ▼              │
│  ┌─────────────┐           ┌─────────────┐        │
│  │   AI SDK    │           │  Analytics  │        │
│  │             │           │             │        │
│  │ • 自然言語  │◀─────────▶│ • BigQuery  │        │
│  │   クエリ   │           │ • ES        │        │
│  │ • インサイト│           │             │        │
│  └─────────────┘           └─────────────┘        │
└─────────────────────────────────────────────────────┘
```

## ユースケース

### 1. 自然言語でのデータ探索

```
ユーザー: "先月の売上トップ10商品を教えて"
    ↓
AI: SQLクエリ生成 → BigQuery実行 → 結果解釈
    ↓
回答: "先月の売上トップ10商品は..."
      + グラフ表示
```

### 2. AI によるインサイト自動生成

```
データ変化検知 → AI 分析 → インサイト生成
    ↓
"売上が前週比20%増加しています。
 主な要因は新商品Aの好調な販売です。"
```

### 3. インタラクティブダッシュボード

```
グラフ選択 → AI に質問 → 深堀り分析
    ↓
"この急落の原因は？"
    ↓
AI: "在庫切れが主な原因です。
    対象商品: X, Y, Z"
```

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                    Client                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Chat   │  │Dashboard│  │ Reports │            │
│  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼────────────┼────────────┼────────────────────┘
        │            │            │
        ▼            ▼            ▼
┌─────────────────────────────────────────────────────┐
│                  Next.js API                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ /chat   │  │/analytics│  │/reports │            │
│  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼────────────┼────────────┼────────────────────┘
        │            │            │
        ▼            ▼            ▼
┌───────────────┐  ┌───────────────────────────────────┐
│    AI SDK     │  │         Data Layer               │
│  ┌─────────┐  │  │  ┌─────────┐  ┌─────────┐      │
│  │ OpenAI  │  │  │  │BigQuery │  │   ES    │      │
│  │ Claude  │  │  │  │         │  │         │      │
│  └─────────┘  │  │  └─────────┘  └─────────┘      │
└───────────────┘  └───────────────────────────────────┘
```

## プロジェクト構成

```
src/
├── app/
│   ├── page.tsx                 # ダッシュボード
│   ├── chat/page.tsx            # チャット UI
│   └── api/
│       ├── chat/route.ts        # AI チャット
│       ├── analytics/           # 分析 API
│       │   ├── query/route.ts
│       │   └── insights/route.ts
│       └── reports/route.ts     # レポート生成
├── components/
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── Chart.tsx
│   │   └── KPICard.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   └── Message.tsx
│   └── reports/
│       └── ReportViewer.tsx
├── lib/
│   ├── ai/
│   │   ├── client.ts
│   │   ├── tools.ts             # AI ツール定義
│   │   └── prompts.ts
│   ├── analytics/
│   │   ├── bigquery.ts
│   │   ├── elasticsearch.ts
│   │   └── queries/
│   └── types/
└── hooks/
    ├── useAnalytics.ts
    └── useChat.ts
```

## 必要なパッケージ

```bash
# AI
npm install ai @ai-sdk/openai

# Analytics
npm install @google-cloud/bigquery @elastic/elasticsearch

# UI
npm install recharts @tanstack/react-query

# Utils
npm install zod date-fns
```

## 環境変数

```env
# AI
OPENAI_API_KEY=sk-...

# BigQuery
GOOGLE_CLOUD_PROJECT=my-project
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# Elasticsearch
ELASTIC_CLOUD_ID=...
ELASTIC_API_KEY=...
```

## このガイドで作るもの

1. **データ分析チャット**: 自然言語でデータを探索
2. **AI ダッシュボード**: インテリジェントな可視化
3. **自動レポート**: AI によるインサイト生成
4. **リアルタイム通知**: 異常検知とアラート

## 次のステップ

次章では、データパイプラインの構築について学びます。
