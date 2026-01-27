# 第3章: バックエンド最適化

## API レスポンス最適化

### 圧縮

```typescript
// Next.js では自動で gzip/brotli 圧縮
// next.config.js
module.exports = {
  compress: true,
};

// Express の場合
import compression from "compression";

app.use(
  compression({
    level: 6, // 圧縮レベル（1-9）
    threshold: 1024, // 1KB 以上を圧縮
    filter: (req, res) => {
      // JSON と HTML を圧縮
      const contentType = res.getHeader("Content-Type");
      return /json|text|javascript|css|html/.test(contentType as string);
    },
  }),
);
```

### ページネーション

```typescript
// ❌ 全件取得
const users = await prisma.user.findMany();

// ✅ ページネーション
interface PaginationParams {
  page: number;
  limit: number;
}

async function getUsers({ page, limit }: PaginationParams) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// カーソルベースページネーション（大量データ向け）
async function getUsersCursor(cursor?: string, limit: number = 20) {
  const users = await prisma.user.findMany({
    take: limit + 1, // 次ページ判定用に +1
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: "desc" },
  });

  const hasNextPage = users.length > limit;
  const data = hasNextPage ? users.slice(0, -1) : users;
  const nextCursor = hasNextPage ? data[data.length - 1].id : null;

  return {
    data,
    nextCursor,
    hasNextPage,
  };
}
```

### フィールド選択

```typescript
// ❌ 全フィールド取得
const user = await prisma.user.findUnique({ where: { id } });

// ✅ 必要なフィールドのみ
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    // password や内部データは除外
  },
});

// GraphQL の場合は自動的にフィールド選択
```

## N+1 問題の解決

### Prisma Include

```typescript
// ❌ N+1 問題
const posts = await prisma.post.findMany();
for (const post of posts) {
  const author = await prisma.user.findUnique({
    where: { id: post.authorId },
  });
  // N回のクエリが発生
}

// ✅ Include で一括取得
const posts = await prisma.post.findMany({
  include: {
    author: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});
```

### DataLoader パターン

```typescript
// lib/loaders.ts
import DataLoader from "dataloader";
import { prisma } from "./db";

// ユーザーローダー
export function createUserLoader() {
  return new DataLoader<string, User>(async (userIds) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] } },
    });

    // ID 順に並び替えて返す
    const userMap = new Map(users.map((u) => [u.id, u]));
    return userIds.map((id) => userMap.get(id) || null);
  });
}

// リクエストごとにローダーを作成
export function createLoaders() {
  return {
    userLoader: createUserLoader(),
    postLoader: createPostLoader(),
  };
}

// 使用例
const user = await loaders.userLoader.load(userId);
```

## キャッシュ戦略

### インメモリキャッシュ

```typescript
// lib/cache.ts
import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, any>({
  max: 500, // 最大エントリ数
  ttl: 1000 * 60 * 5, // 5分
});

export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number,
): Promise<T> {
  const cachedValue = cache.get(key);
  if (cachedValue !== undefined) {
    return cachedValue as T;
  }

  const value = await fn();
  cache.set(key, value, { ttl });
  return value;
}

// 使用例
const products = await cached(
  "products:featured",
  () => prisma.product.findMany({ where: { featured: true } }),
  60000, // 1分
);
```

### Redis キャッシュ

```typescript
// lib/redis-cache.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function cachedRedis<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300,
): Promise<T> {
  // キャッシュから取得
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // キャッシュミス時は計算して保存
  const value = await fn();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
  return value;
}

// キャッシュ無効化
export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// 使用例
const user = await cachedRedis(
  `user:${userId}`,
  () => prisma.user.findUnique({ where: { id: userId } }),
  3600, // 1時間
);

// 更新時にキャッシュ無効化
await prisma.user.update({ where: { id: userId }, data });
await invalidateCache(`user:${userId}`);
```

## 非同期処理

### バックグラウンドジョブ

```typescript
// SQS を使った非同期処理
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: "ap-northeast-1" });

// API: 即座にレスポンスを返す
export async function createOrder(req: Request) {
  const order = await prisma.order.create({ data: req.body });

  // 重い処理はキューに投入
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: process.env.ORDER_QUEUE_URL,
      MessageBody: JSON.stringify({
        type: "process_order",
        orderId: order.id,
      }),
    }),
  );

  // 即座にレスポンス
  return Response.json({ id: order.id, status: "processing" });
}

// ワーカー: バックグラウンドで処理
export async function processOrderWorker(event: SQSEvent) {
  for (const record of event.Records) {
    const { orderId } = JSON.parse(record.body);

    // 重い処理を実行
    await processPayment(orderId);
    await sendConfirmationEmail(orderId);
    await updateInventory(orderId);
  }
}
```

### ストリーミングレスポンス

```typescript
// app/api/stream/route.ts
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        const data = await fetchData(i);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        await new Promise((r) => setTimeout(r, 100));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

## コネクション管理

### コネクションプーリング

```typescript
// Prisma コネクションプール設定
// .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"

// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Lambda でのコネクション再利用

```typescript
// グローバルスコープで初期化（再利用される）
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
```

## 次のステップ

次章では、データベースの最適化手法を学びます。
