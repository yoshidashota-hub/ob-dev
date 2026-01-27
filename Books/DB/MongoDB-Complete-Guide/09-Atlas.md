# 第9章: MongoDB Atlas

## 概要

MongoDB Atlas は MongoDB のフルマネージドクラウドサービス。

```
┌─────────────────────────────────────────────────────┐
│                 MongoDB Atlas                        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Cluster (クラスター)                       │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐                 │   │
│  │  │ P   │  │ S   │  │ S   │  レプリカセット  │   │
│  │  └─────┘  └─────┘  └─────┘                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ✓ 自動スケーリング                                 │
│  ✓ 自動バックアップ                                 │
│  ✓ グローバル配信                                   │
│  ✓ セキュリティ（暗号化、VPC Peering）              │
│  ✓ モニタリング・アラート                           │
└─────────────────────────────────────────────────────┘
```

## クラスター作成

### 1. アカウント作成

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) にアクセス
2. 無料アカウントを作成
3. 組織とプロジェクトを作成

### 2. クラスター作成

```
┌─────────────────────────────────────────────────────┐
│                  クラスタータイプ                    │
│                                                     │
│  M0 (Free)     - 512MB、開発・学習用                │
│  M2/M5         - 小規模アプリケーション              │
│  M10+          - 本番環境                           │
│  Serverless    - 使用量ベース課金                   │
└─────────────────────────────────────────────────────┘
```

### 3. 接続設定

```bash
# IP アクセスリスト
# 0.0.0.0/0 で全IP許可（開発時のみ）
# 本番では特定IPのみ許可

# データベースユーザー作成
# ユーザー名: myuser
# パスワード: (強力なパスワード)
# 権限: readWriteAnyDatabase
```

### 4. 接続文字列

```bash
# 標準形式
mongodb+srv://myuser:password@cluster0.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority

# アプリケーションで使用
MONGODB_URI=mongodb+srv://myuser:password@cluster0.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority
```

## Atlas Search

全文検索エンジン。Apache Lucene ベース。

### インデックス作成

```javascript
// Atlas UI または API で作成
{
  "mappings": {
    "dynamic": true,  // 自動マッピング
    "fields": {
      "title": {
        "type": "string",
        "analyzer": "lucene.japanese"
      },
      "content": {
        "type": "string",
        "analyzer": "lucene.japanese"
      },
      "tags": {
        "type": "string"
      },
      "price": {
        "type": "number"
      }
    }
  }
}
```

### 検索クエリ

```typescript
// 基本検索
const results = await db
  .collection("products")
  .aggregate([
    {
      $search: {
        index: "default", // インデックス名
        text: {
          query: "iPhone",
          path: ["title", "description"],
        },
      },
    },
    { $limit: 10 },
  ])
  .toArray();

// 複合検索
const results = await db
  .collection("products")
  .aggregate([
    {
      $search: {
        index: "default",
        compound: {
          must: [
            {
              text: {
                query: "スマートフォン",
                path: "category",
              },
            },
          ],
          should: [
            {
              text: {
                query: "iPhone",
                path: "title",
                score: { boost: { value: 2 } },
              },
            },
          ],
          filter: [
            {
              range: {
                path: "price",
                gte: 50000,
                lte: 150000,
              },
            },
          ],
        },
      },
    },
  ])
  .toArray();

// オートコンプリート
const suggestions = await db
  .collection("products")
  .aggregate([
    {
      $search: {
        index: "autocomplete",
        autocomplete: {
          query: "iPho",
          path: "title",
          fuzzy: { maxEdits: 1 },
        },
      },
    },
    { $limit: 5 },
    { $project: { title: 1, _id: 0 } },
  ])
  .toArray();

// スコア取得
const results = await db
  .collection("products")
  .aggregate([
    {
      $search: {
        text: { query: "iPhone", path: "title" },
      },
    },
    {
      $project: {
        title: 1,
        score: { $meta: "searchScore" },
      },
    },
  ])
  .toArray();
```

### ファセット検索

```typescript
const facetResults = await db
  .collection("products")
  .aggregate([
    {
      $searchMeta: {
        index: "default",
        facet: {
          operator: {
            text: { query: "phone", path: "description" },
          },
          facets: {
            categoryFacet: {
              type: "string",
              path: "category",
            },
            priceFacet: {
              type: "number",
              path: "price",
              boundaries: [0, 50000, 100000, 200000],
            },
          },
        },
      },
    },
  ])
  .toArray();
```

## Atlas Vector Search

ベクトル検索（AI/ML 用）。

### ベクトルインデックス

```javascript
// インデックス定義
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,  // OpenAI ada-002
      "similarity": "cosine"  // cosine | euclidean | dotProduct
    }
  ]
}
```

### ベクトル検索

```typescript
// OpenAI Embedding を使用
import OpenAI from "openai";

const openai = new OpenAI();

async function searchSimilar(query: string) {
  // クエリをベクトル化
  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });

  const queryVector = embedding.data[0].embedding;

  // ベクトル検索
  const results = await db
    .collection("documents")
    .aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector,
          numCandidates: 100,
          limit: 10,
        },
      },
      {
        $project: {
          title: 1,
          content: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ])
    .toArray();

  return results;
}
```

## Data API

REST API でデータベースにアクセス。

### 設定

1. Atlas UI で Data API を有効化
2. API キーを作成
3. エンドポイント URL を取得

### 使用例

```typescript
const DATA_API_URL = "https://data.mongodb-api.com/app/xxx/endpoint/data/v1";
const API_KEY = process.env.MONGODB_DATA_API_KEY!;

// Find
async function findDocuments(filter: object) {
  const response = await fetch(`${DATA_API_URL}/action/find`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
    body: JSON.stringify({
      dataSource: "Cluster0",
      database: "mydb",
      collection: "users",
      filter,
    }),
  });

  return response.json();
}

// Insert
async function insertDocument(document: object) {
  const response = await fetch(`${DATA_API_URL}/action/insertOne`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
    body: JSON.stringify({
      dataSource: "Cluster0",
      database: "mydb",
      collection: "users",
      document,
    }),
  });

  return response.json();
}
```

## App Services（旧 Realm）

### Functions

```javascript
// Atlas Functions
exports = async function (payload) {
  const { userId, action } = payload.body;

  const mongodb = context.services.get("mongodb-atlas");
  const users = mongodb.db("mydb").collection("users");

  if (action === "getProfile") {
    return await users.findOne({ _id: userId });
  }

  return { error: "Unknown action" };
};
```

### Triggers

```javascript
// Database Trigger
exports = async function (changeEvent) {
  const { operationType, fullDocument } = changeEvent;

  if (operationType === "insert") {
    // 新規ユーザー作成時にウェルカムメール送信
    await context.functions.execute("sendWelcomeEmail", fullDocument.email);
  }
};

// Scheduled Trigger (Cron)
exports = async function () {
  const mongodb = context.services.get("mongodb-atlas");
  const sessions = mongodb.db("mydb").collection("sessions");

  // 24時間以上経過したセッションを削除
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await sessions.deleteMany({ createdAt: { $lt: cutoff } });
};
```

## モニタリング

### Performance Advisor

```
┌─────────────────────────────────────────────────────┐
│              Performance Advisor                     │
│                                                     │
│  推奨インデックス:                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ users.email_1                               │   │
│  │ 推定改善: 95% のクエリが高速化              │   │
│  │ [Create Index]                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  遅いクエリ:                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ db.orders.find({ status: "pending" })      │   │
│  │ 平均実行時間: 2.5秒                         │   │
│  │ COLLSCAN を使用                             │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Real-Time Performance Panel

```
┌─────────────────────────────────────────────────────┐
│                リアルタイムメトリクス                │
│                                                     │
│  Operations/s     Connections      CPU              │
│  ┌────────────┐   ┌────────────┐  ┌────────────┐  │
│  │    ▃▅▇▅▃   │   │     150    │  │    23%     │  │
│  │    1,250   │   │            │  │            │  │
│  └────────────┘   └────────────┘  └────────────┘  │
│                                                     │
│  Read/Write        Memory          Disk I/O        │
│  ┌────────────┐   ┌────────────┐  ┌────────────┐  │
│  │  R: 800/s  │   │   4.2 GB   │  │   50 MB/s  │  │
│  │  W: 450/s  │   │            │  │            │  │
│  └────────────┘   └────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────┘
```

### アラート設定

```javascript
// 設定例
{
  "alertConfigs": [
    {
      "eventTypeName": "REPLICATION_OPLOG_WINDOW_RUNNING_OUT",
      "enabled": true,
      "notifications": [
        {
          "typeName": "EMAIL",
          "emailAddress": "admin@example.com"
        },
        {
          "typeName": "SLACK",
          "webhookUrl": "https://hooks.slack.com/..."
        }
      ]
    },
    {
      "eventTypeName": "OUTSIDE_METRIC_THRESHOLD",
      "metricThreshold": {
        "metricName": "QUERY_EXECUTOR_SCANNED_OBJECTS_PER_RETURNED",
        "operator": "GREATER_THAN",
        "threshold": 1000
      },
      "notifications": [...]
    }
  ]
}
```

## バックアップ

### 継続的バックアップ

```
┌─────────────────────────────────────────────────────┐
│                 バックアップ設定                     │
│                                                     │
│  スナップショット保持:                               │
│  - 時間単位: 24時間                                 │
│  - 日単位: 7日間                                    │
│  - 週単位: 4週間                                    │
│  - 月単位: 12ヶ月                                   │
│                                                     │
│  ポイントインタイムリカバリ: 有効（直近7日間）       │
└─────────────────────────────────────────────────────┘
```

### リストア

```bash
# スナップショットからリストア
# 1. Atlas UI でスナップショットを選択
# 2. リストア先を選択（同一クラスター or 新規クラスター）
# 3. リストア実行

# ポイントインタイムリカバリ
# 特定の日時を指定してリストア
```

## セキュリティ

### ネットワーク

```
┌─────────────────────────────────────────────────────┐
│                セキュリティ設定                      │
│                                                     │
│  IP アクセスリスト:                                 │
│  - 203.0.113.10/32  (オフィス)                      │
│  - 198.51.100.0/24  (VPN)                          │
│                                                     │
│  VPC Peering:                                       │
│  - AWS VPC: vpc-12345678                           │
│                                                     │
│  Private Endpoint:                                  │
│  - AWS PrivateLink: 有効                           │
└─────────────────────────────────────────────────────┘
```

### 暗号化

```
- 転送中の暗号化: TLS 1.2+ (常時有効)
- 保存時の暗号化: AES-256 (常時有効)
- クライアントサイド暗号化 (CSFLE): オプション
```

### 監査ログ

```javascript
// 監査設定
{
  "auditFilter": {
    "atype": {
      "$in": [
        "authenticate",
        "createCollection",
        "dropCollection",
        "createUser",
        "dropUser"
      ]
    }
  }
}
```

## 料金

```
┌─────────────────────────────────────────────────────┐
│                    料金体系                          │
│                                                     │
│  M0 (Free)                                          │
│  - 512MB ストレージ                                 │
│  - 共有クラスター                                   │
│  - $0/月                                           │
│                                                     │
│  M10 (Dedicated)                                    │
│  - 2GB RAM, 10GB ストレージ                        │
│  - 専用クラスター                                   │
│  - 約 $60/月〜                                     │
│                                                     │
│  Serverless                                         │
│  - 使用量ベース課金                                 │
│  - $0.10/100万読み取り                             │
│  - $1.00/100万書き込み                             │
└─────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、Next.js アプリケーションとの統合パターンを学びます。
