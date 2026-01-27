# 第4章: データベース最適化

## クエリ最適化

### EXPLAIN ANALYZE

```sql
-- クエリ実行計画を確認
EXPLAIN ANALYZE
SELECT o.*, u.name as user_name
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at > '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 100;

-- 結果の読み方
-- Seq Scan: フルテーブルスキャン（避けたい）
-- Index Scan: インデックス使用（良い）
-- Nested Loop: 小さいテーブルの結合に最適
-- Hash Join: 大きいテーブルの結合に最適
```

### インデックス設計

```sql
-- 基本的なインデックス
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 複合インデックス（カラムの順序が重要）
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 部分インデックス（特定条件のみ）
CREATE INDEX idx_orders_pending ON orders(created_at)
WHERE status = 'pending';

-- カバリングインデックス（INCLUDE）
CREATE INDEX idx_orders_user ON orders(user_id)
INCLUDE (total_amount, status);
```

### Prisma でのインデックス

```prisma
// prisma/schema.prisma
model Order {
  id        String   @id @default(cuid())
  userId    String
  status    String
  amount    Int
  createdAt DateTime @default(now())

  // 単一カラムインデックス
  @@index([userId])
  @@index([createdAt])

  // 複合インデックス
  @@index([userId, status])
  @@index([status, createdAt])
}
```

## 遅いクエリの特定

### PostgreSQL スロークエリログ

```sql
-- postgresql.conf
log_min_duration_statement = 100  -- 100ms以上のクエリをログ

-- クエリ統計を確認
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
  calls,
  total_exec_time / calls as avg_time,
  query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

### Prisma クエリログ

```typescript
const prisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }],
});

prisma.$on("query", (e) => {
  if (e.duration > 100) {
    // 100ms以上
    console.warn("Slow query:", {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  }
});
```

## クエリパターン最適化

### バッチ処理

```typescript
// ❌ 1件ずつ処理
for (const item of items) {
  await prisma.item.create({ data: item });
}

// ✅ バッチ挿入
await prisma.item.createMany({
  data: items,
  skipDuplicates: true,
});

// ❌ 1件ずつ更新
for (const item of items) {
  await prisma.item.update({
    where: { id: item.id },
    data: { status: "processed" },
  });
}

// ✅ バッチ更新
await prisma.item.updateMany({
  where: { id: { in: items.map((i) => i.id) } },
  data: { status: "processed" },
});
```

### 集計クエリ

```typescript
// ❌ アプリケーションで集計
const orders = await prisma.order.findMany();
const total = orders.reduce((sum, o) => sum + o.amount, 0);

// ✅ データベースで集計
const result = await prisma.order.aggregate({
  _sum: { amount: true },
  _avg: { amount: true },
  _count: true,
});
```

### サブクエリの活用

```typescript
// 最新の注文がある顧客を取得
const customersWithRecentOrders = await prisma.$queryRaw`
  SELECT c.*
  FROM customers c
  WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.id
    AND o.created_at > NOW() - INTERVAL '30 days'
  )
`;
```

## DynamoDB 最適化

### パーティション設計

```
┌────────────────────────────────────────────────────────────┐
│              DynamoDB パーティション設計                      │
│                                                            │
│  アクセスパターンを先に定義:                                 │
│  1. ユーザーの注文一覧を取得                                 │
│  2. 日付範囲で注文を検索                                    │
│  3. ステータス別に注文を取得                                 │
│                                                            │
│  設計例:                                                    │
│  PK: USER#<userId>                                         │
│  SK: ORDER#<timestamp>#<orderId>                           │
│                                                            │
│  GSI1:                                                      │
│  GSI1PK: STATUS#<status>                                   │
│  GSI1SK: <timestamp>                                       │
└────────────────────────────────────────────────────────────┘
```

### クエリ最適化

```typescript
// ❌ Scan（フルスキャン）
const result = await dynamodb.send(
  new ScanCommand({
    TableName: "Orders",
    FilterExpression: "userId = :userId",
    ExpressionAttributeValues: { ":userId": { S: userId } },
  }),
);

// ✅ Query（パーティションキー指定）
const result = await dynamodb.send(
  new QueryCommand({
    TableName: "Orders",
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": { S: `USER#${userId}` },
      ":sk": { S: "ORDER#" },
    },
    ScanIndexForward: false, // 降順
    Limit: 20,
  }),
);
```

### 読み込みキャパシティ最適化

```typescript
// プロジェクション（必要な属性のみ）
const result = await dynamodb.send(
  new QueryCommand({
    TableName: "Orders",
    KeyConditionExpression: "PK = :pk",
    ProjectionExpression: "orderId, #status, amount",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":pk": { S: `USER#${userId}` } },
  }),
);

// Eventually Consistent Read（デフォルト、安い）
// vs Strongly Consistent Read（2倍のRCU）
const result = await dynamodb.send(
  new QueryCommand({
    TableName: "Orders",
    ConsistentRead: false, // Eventually Consistent（推奨）
    // ...
  }),
);
```

## キャッシュ層

### DAX（DynamoDB Accelerator）

```typescript
// DAX クライアント
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

// 本番環境では DAX エンドポイントを使用
const client = process.env.DAX_ENDPOINT
  ? new DaxClient({ endpoints: [process.env.DAX_ENDPOINT] })
  : new DynamoDB({ region: "ap-northeast-1" });

const docClient = DynamoDBDocument.from(client);
```

### アプリケーションキャッシュ

```typescript
// キャッシュアサイドパターン
async function getUser(userId: string): Promise<User> {
  const cacheKey = `user:${userId}`;

  // 1. キャッシュを確認
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. キャッシュミス時はDBから取得
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // 3. キャッシュに保存
  if (user) {
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
  }

  return user;
}

// ライトスルーパターン
async function updateUser(userId: string, data: Partial<User>) {
  // 1. DBを更新
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  // 2. キャッシュも更新
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));

  return user;
}
```

## 接続プール最適化

```
┌────────────────────────────────────────────────────────────┐
│              コネクションプール設定                          │
│                                                            │
│  PostgreSQL:                                               │
│  • connection_limit: 同時接続数（Lambda数 × 2程度）        │
│  • pool_timeout: 接続待ちタイムアウト                       │
│  • idle_timeout: アイドル接続のタイムアウト                  │
│                                                            │
│  Lambda環境での推奨設定:                                    │
│  DATABASE_URL="...?connection_limit=3&pool_timeout=10"     │
│                                                            │
│  PgBouncer 使用時:                                         │
│  • Transaction mode で接続を効率的に再利用                  │
│  • max_client_conn: クライアント最大接続                    │
│  • default_pool_size: プールサイズ                         │
└────────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、インフラレベルの最適化を学びます。
