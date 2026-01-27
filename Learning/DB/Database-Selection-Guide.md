# データベース使い分けガイド

## データベースの分類

```
┌─────────────────────────────────────────────────────────────────┐
│                    データベースの種類                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  リレーショナル (RDBMS)                                         │
│  ├── PostgreSQL    - 高機能、拡張性                            │
│  ├── MySQL         - 実績、シンプル                            │
│  └── SQLite        - 組み込み、ローカル                        │
│                                                                 │
│  ドキュメント指向                                               │
│  ├── MongoDB       - 柔軟なスキーマ                            │
│  └── DynamoDB      - サーバーレス、AWS統合                      │
│                                                                 │
│  キーバリュー                                                   │
│  ├── Redis         - キャッシュ、高速                          │
│  └── Valkey        - Redis OSS 互換                            │
│                                                                 │
│  グラフ                                                         │
│  └── Neo4j         - 関係性分析                                │
│                                                                 │
│  時系列                                                         │
│  ├── InfluxDB      - メトリクス                                │
│  └── TimescaleDB   - PostgreSQL拡張                            │
│                                                                 │
│  ベクトル                                                       │
│  ├── Pinecone      - AI/ML向けマネージド                       │
│  ├── Weaviate      - オープンソース                            │
│  └── pgvector      - PostgreSQL拡張                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 選択フローチャート

```
データベース選択の判断基準
│
├─ データ構造が明確で固定？
│   ├─ YES → リレーショナルDB
│   │         ├─ 複雑なクエリ/分析 → PostgreSQL
│   │         ├─ シンプル/実績重視 → MySQL
│   │         └─ 組み込み/ローカル → SQLite
│   │
│   └─ NO → NoSQL を検討
│            ├─ JSON ライクなデータ → MongoDB / DynamoDB
│            ├─ キャッシュ/セッション → Redis
│            └─ 関係性重視 → Neo4j
│
├─ トランザクションが重要？
│   ├─ YES（金融、在庫）→ PostgreSQL / MySQL
│   └─ NO または限定的 → MongoDB でも可
│
├─ スケール要件は？
│   ├─ 垂直スケール → PostgreSQL / MySQL
│   └─ 水平スケール → MongoDB / DynamoDB
│
└─ インフラ管理は？
    ├─ マネージド希望 → Supabase / PlanetScale / MongoDB Atlas
    └─ セルフホスト可 → 任意
```

## ユースケース別おすすめ

### Web アプリケーション（一般的）

| 要件                     | おすすめ             |
| ------------------------ | -------------------- |
| 基本的な CRUD            | PostgreSQL / MySQL   |
| ユーザー認証             | PostgreSQL           |
| コンテンツ管理           | MongoDB              |
| セッション管理           | Redis                |
| 全文検索                 | PostgreSQL / MongoDB |

### E コマース

```
PostgreSQL (メイン)
├── users         - ユーザー情報
├── orders        - 注文（トランザクション重要）
├── payments      - 決済記録
└── inventory     - 在庫管理

MongoDB (補助)
├── products      - 商品カタログ（属性が可変）
├── reviews       - レビュー
└── recommendations - おすすめ

Redis (キャッシュ)
├── sessions      - ログインセッション
├── cart          - カート（一時データ）
└── rate_limit    - API レート制限
```

### SaaS / マルチテナント

```
PostgreSQL
├── RLS (Row Level Security) でテナント分離
├── 複雑な権限管理
└── 監査ログ

理由:
- ACID トランザクション
- 強力なアクセス制御
- 成熟したエコシステム
```

### リアルタイムアプリ（チャット等）

```
MongoDB
├── messages      - メッセージ履歴
├── conversations - 会話メタデータ
└── presence      - オンライン状態

Redis
├── pub/sub       - リアルタイム配信
├── presence      - オンライン状態（キャッシュ）
└── typing        - 入力中表示
```

### IoT / ログ収集

```
時系列DB (InfluxDB / TimescaleDB)
├── sensor_data   - センサーデータ
├── metrics       - メトリクス
└── events        - イベントログ

理由:
- 時間ベースの効率的なクエリ
- 自動データ圧縮
- 集計関数が豊富
```

### AI / RAG アプリケーション

```
ベクトルDB (Pinecone / pgvector)
├── embeddings    - ドキュメント埋め込み
└── semantic_search - 意味検索

PostgreSQL + pgvector
├── documents     - 元ドキュメント
├── chunks        - チャンク
└── embeddings    - ベクトル（pgvector）

理由:
- 類似度検索が高速
- メタデータフィルタリング
```

## 主要データベース比較

### PostgreSQL vs MySQL

| 観点           | PostgreSQL                   | MySQL                   |
| -------------- | ---------------------------- | ----------------------- |
| 機能性         | 高い（JSON、配列、拡張）     | 標準的                  |
| パフォーマンス | 複雑なクエリに強い           | シンプルなクエリに強い  |
| 拡張性         | 多数の拡張（PostGIS 等）     | 限定的                  |
| 学習コスト     | やや高い                     | 低い                    |
| エコシステム   | Supabase, Vercel Postgres    | PlanetScale, Vitess     |
| おすすめ       | 新規プロジェクト、複雑な要件 | レガシー移行、シンプル  |

### MongoDB vs PostgreSQL

| 観点             | MongoDB                   | PostgreSQL           |
| ---------------- | ------------------------- | -------------------- |
| スキーマ         | 柔軟（スキーマレス）      | 固定（マイグレーション）|
| クエリ           | JSON ベース               | SQL                  |
| トランザクション | 4.0+ で対応               | 完全対応             |
| スケール         | 水平（シャーディング）    | 垂直（レプリカ）     |
| JOIN             | $lookup（制限あり）       | 強力                 |
| おすすめ         | 可変スキーマ、素早い開発  | 複雑なリレーション   |

### MongoDB vs DynamoDB

| 観点         | MongoDB                 | DynamoDB                |
| ------------ | ----------------------- | ----------------------- |
| 運用         | Atlas またはセルフホスト| フルマネージド          |
| 料金         | 予測しやすい            | 使用量ベース            |
| クエリ       | 柔軟                    | キーベース（制限あり）  |
| AWS 統合     | 別途設定                | ネイティブ              |
| 学習コスト   | 中程度                  | 高い（設計が独特）      |
| おすすめ     | 汎用                    | サーバーレス、AWS 中心  |

## 技術スタック別おすすめ

### Next.js + Vercel

```typescript
// おすすめ構成
const stack = {
  primary: 'Vercel Postgres' | 'Supabase' | 'PlanetScale',
  cache: 'Vercel KV (Redis)',
  search: 'Algolia' | 'Meilisearch',

  // ORM
  orm: 'Prisma' | 'Drizzle',
}

// 理由
// - Vercel とのシームレス統合
// - エッジランタイム対応
// - サーバーレス最適化
```

### サーバーレス (AWS Lambda)

```typescript
const stack = {
  primary: 'DynamoDB',    // コールドスタートなし
  rdbms: 'Aurora Serverless v2',  // 必要な場合
  cache: 'ElastiCache',
}

// 理由
// - 接続プールが不要
// - 自動スケール
// - AWS サービス統合
```

### フルスタック（従来型）

```typescript
const stack = {
  primary: 'PostgreSQL',
  cache: 'Redis',
  search: 'Elasticsearch' | 'PostgreSQL FTS',

  // ORM
  orm: 'Prisma' | 'TypeORM',
}
```

## 実装パターン

### ポリグロット永続化（複数DB併用）

```typescript
// 各データを適切なDBに保存
class DataService {
  constructor(
    private postgres: PostgresClient,  // トランザクション
    private mongo: MongoClient,        // ドキュメント
    private redis: RedisClient,        // キャッシュ
  ) {}

  // ユーザー作成（PostgreSQL）
  async createUser(data: UserInput) {
    return this.postgres.user.create({ data });
  }

  // 商品カタログ（MongoDB）
  async getProduct(id: string) {
    const cached = await this.redis.get(`product:${id}`);
    if (cached) return JSON.parse(cached);

    const product = await this.mongo.collection('products').findOne({ _id: id });
    await this.redis.set(`product:${id}`, JSON.stringify(product), 'EX', 3600);
    return product;
  }

  // 注文（トランザクション）
  async createOrder(userId: string, items: OrderItem[]) {
    return this.postgres.$transaction(async (tx) => {
      // 在庫確認・更新
      for (const item of items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      // 注文作成
      return tx.order.create({
        data: { userId, items: { create: items } },
      });
    });
  }
}
```

### キャッシュパターン

```typescript
// Cache-Aside パターン
async function getUser(id: string): Promise<User> {
  // 1. キャッシュ確認
  const cached = await redis.get(`user:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. DB から取得
  const user = await db.user.findUnique({ where: { id } });

  // 3. キャッシュに保存
  if (user) {
    await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 3600);
  }

  return user;
}

// Write-Through パターン
async function updateUser(id: string, data: Partial<User>) {
  // 1. DB を更新
  const user = await db.user.update({ where: { id }, data });

  // 2. キャッシュも更新
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 3600);

  return user;
}
```

## マネージドサービス比較

### PostgreSQL

| サービス        | 特徴                                |
| --------------- | ----------------------------------- |
| Supabase        | 認証・リアルタイム込み、無料枠あり  |
| Vercel Postgres | Vercel 統合、Neon ベース            |
| Neon            | サーバーレス、ブランチング          |
| PlanetScale     | MySQL 互換、Vitess ベース           |
| AWS RDS         | 安定、エンタープライズ              |

### MongoDB

| サービス         | 特徴                           |
| ---------------- | ------------------------------ |
| MongoDB Atlas    | 公式、フル機能、無料枠 512MB   |
| AWS DocumentDB   | MongoDB 互換、AWS 統合         |

### Redis

| サービス      | 特徴                         |
| ------------- | ---------------------------- |
| Upstash       | サーバーレス、REST API       |
| Vercel KV     | Vercel 統合、Upstash ベース  |
| Redis Cloud   | 公式、フル機能               |
| AWS ElastiCache | AWS 統合                   |

## 選択時の注意点

### 1. 将来の拡張性

```
❌ 「今は MongoDB で十分」
   → リレーションが増えて JOIN 地獄に

✓ 要件を見極める
   → 複雑なリレーション予定あり → PostgreSQL
   → 柔軟なスキーマ必須 → MongoDB
```

### 2. チームのスキル

```
❌ 「最新技術だから」DynamoDB を選択
   → 設計パターンが独特で苦戦

✓ チームの経験を考慮
   → SQL 経験あり → PostgreSQL
   → NoSQL 経験あり → MongoDB
```

### 3. 運用コスト

```
❌ セルフホストで複数 DB を運用
   → 運用負荷が高い

✓ マネージドサービスを活用
   → Supabase (PostgreSQL + 認証 + リアルタイム)
   → MongoDB Atlas (フル機能)
```

### 4. ベンダーロックイン

```
❌ DynamoDB に完全依存
   → AWS 以外への移行が困難

✓ 標準的な技術を選択
   → PostgreSQL / MongoDB → 移行しやすい
```

## まとめ

### 迷ったら PostgreSQL

- 最も汎用的
- JSON も扱える
- 拡張機能が豊富
- エコシステムが充実

### MongoDB が活きる場面

- スキーマが頻繁に変わる
- 階層的なデータ構造
- 素早いプロトタイピング
- 水平スケールが必要

### 複数 DB の併用

- メインDB + キャッシュ（Redis）は定番
- それ以上は運用コストを考慮
- マネージドサービスで負荷軽減

## 関連

- [サーバーレス vs サーバー構成](../Architecture/Serverless-vs-Server.md) - インフラ選択ガイド
- [MongoDB 完全ガイド](../../Books/DB/MongoDB-Complete-Guide/README.md)
