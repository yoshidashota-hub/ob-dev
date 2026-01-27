# 第9章: パフォーマンス最適化

## クエリログ

### ログの有効化

```typescript
const prisma = new PrismaClient({
  log: [
    { level: "query", emit: "event" },
    { level: "info", emit: "stdout" },
    { level: "warn", emit: "stdout" },
    { level: "error", emit: "stdout" },
  ],
});

// クエリイベントをリッスン
prisma.$on("query", (e) => {
  console.log("Query:", e.query);
  console.log("Params:", e.params);
  console.log("Duration:", e.duration, "ms");
});
```

### 開発環境のみ

```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"],
});
```

## N+1 問題の解決

### 問題のあるコード

```typescript
// ❌ N+1 問題
const users = await prisma.user.findMany();

for (const user of users) {
  // 各ユーザーごとにクエリが実行される
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
  });
}
```

### 解決策

```typescript
// ✅ include を使用
const users = await prisma.user.findMany({
  include: { posts: true },
});

// ✅ または別のクエリでバッチ取得
const users = await prisma.user.findMany();
const userIds = users.map((u) => u.id);

const posts = await prisma.post.findMany({
  where: { authorId: { in: userIds } },
});

// マップに変換
const postsByUser = posts.reduce((acc, post) => {
  if (!acc[post.authorId]) acc[post.authorId] = [];
  acc[post.authorId].push(post);
  return acc;
}, {} as Record<number, Post[]>);
```

## select vs include

### 必要なフィールドのみ取得

```typescript
// ❌ 全フィールドを取得
const users = await prisma.user.findMany({
  include: { posts: true },
});

// ✅ 必要なフィールドのみ
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    posts: {
      select: {
        id: true,
        title: true,
      },
    },
  },
});
```

## インデックス

### スキーマでの定義

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  authorId  Int
  status    Status
  createdAt DateTime @default(now())

  // 単一インデックス
  @@index([authorId])

  // 複合インデックス
  @@index([status, createdAt])

  // ユニークインデックス
  @@unique([authorId, title])
}
```

### クエリに合わせたインデックス

```typescript
// このクエリに対して
const posts = await prisma.post.findMany({
  where: {
    authorId: 1,
    status: "PUBLISHED",
  },
  orderBy: { createdAt: "desc" },
});

// 適切なインデックス
// @@index([authorId, status, createdAt])
```

## ページネーション

### カーソルベースが高速

```typescript
// オフセットベース（大量データで遅い）
const users = await prisma.user.findMany({
  skip: 10000,
  take: 10,
});

// カーソルベース（高速）
const users = await prisma.user.findMany({
  take: 10,
  cursor: { id: lastId },
  skip: 1,
});
```

## バッチ処理

### createMany

```typescript
// ❌ ループで作成
for (const data of items) {
  await prisma.item.create({ data });
}

// ✅ バッチ作成
await prisma.item.createMany({
  data: items,
  skipDuplicates: true,
});
```

### 大量データの処理

```typescript
// チャンクに分割
async function processInBatches<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);
  }
}

// 使用
await processInBatches(users, 1000, async (batch) => {
  await prisma.user.createMany({ data: batch });
});
```

## コネクションプール

### 設定

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?connection_limit=20&pool_timeout=10"
```

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### 接続管理

```typescript
// アプリケーション終了時に接続を閉じる
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// 明示的に接続
await prisma.$connect();
```

## Raw Query

### パフォーマンスが重要な場合

```typescript
// 生の SQL を実行
const users = await prisma.$queryRaw<User[]>`
  SELECT * FROM users
  WHERE email LIKE ${`%${search}%`}
  LIMIT ${limit}
`;

// 複雑な集計
const stats = await prisma.$queryRaw`
  SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as count
  FROM posts
  WHERE created_at > ${startDate}
  GROUP BY DATE_TRUNC('day', created_at)
  ORDER BY date
`;
```

### 型付け

```typescript
interface DailyStats {
  date: Date;
  count: bigint;
}

const stats = await prisma.$queryRaw<DailyStats[]>`
  SELECT ...
`;
```

## キャッシュ

### Redis との組み合わせ

```typescript
import Redis from "ioredis";

const redis = new Redis();

async function getCachedUser(id: number): Promise<User | null> {
  const cacheKey = `user:${id}`;

  // キャッシュ確認
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // DB から取得
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (user) {
    // キャッシュに保存（1時間）
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
  }

  return user;
}
```

## クエリの分析

### EXPLAIN

```typescript
// PostgreSQL
const explain = await prisma.$queryRaw`
  EXPLAIN ANALYZE
  SELECT * FROM posts
  WHERE author_id = 1
  ORDER BY created_at DESC
  LIMIT 10
`;

console.log(explain);
```

## ベストプラクティス

1. **必要なデータのみ取得**: `select` で限定
2. **N+1 を避ける**: `include` または一括取得
3. **適切なインデックス**: クエリパターンに合わせて
4. **カーソルページネーション**: 大量データに有効
5. **バッチ処理**: `createMany`、`updateMany` を活用
6. **キャッシュ**: 頻繁にアクセスするデータ
7. **接続プール**: 適切なサイズ設定

## 次のステップ

次章では、フレームワーク統合とベストプラクティスについて学びます。
