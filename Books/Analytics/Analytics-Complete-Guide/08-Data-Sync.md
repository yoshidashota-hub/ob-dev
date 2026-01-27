# 第8章: データ同期

## データ同期のパターン

```
┌─────────────────────────────────────────────────────┐
│            Data Sync Patterns                        │
│                                                     │
│  1. リアルタイム同期                                 │
│     DB → Webhook/Trigger → Elasticsearch            │
│                                                     │
│  2. バッチ同期                                       │
│     DB → Cron Job → Elasticsearch                   │
│                                                     │
│  3. Change Data Capture (CDC)                       │
│     DB → Debezium → Kafka → Elasticsearch          │
│                                                     │
│  4. Dual Write                                      │
│     App → DB + Elasticsearch (同時書き込み)         │
└─────────────────────────────────────────────────────┘
```

## Prisma + Elasticsearch 同期

### モデル定義

```typescript
// prisma/schema.prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Int
  category    String
  tags        String[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 同期サービス

```typescript
// lib/sync/product-sync.ts
import { PrismaClient, Product } from "@prisma/client";
import client from "@/lib/elasticsearch";

const prisma = new PrismaClient();

// Prisma → Elasticsearch 変換
function toElasticsearchDoc(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    tags: product.tags,
    is_active: product.isActive,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString(),
  };
}

// 単一ドキュメント同期
export async function syncProduct(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    // 削除された場合
    await client
      .delete({
        index: "products",
        id: productId,
        refresh: true,
      })
      .catch(() => {}); // 存在しない場合は無視
    return;
  }

  await client.index({
    index: "products",
    id: product.id,
    body: toElasticsearchDoc(product),
    refresh: true,
  });
}

// 全件同期
export async function syncAllProducts(): Promise<void> {
  const batchSize = 1000;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const products = await prisma.product.findMany({
      skip,
      take: batchSize,
      orderBy: { createdAt: "asc" },
    });

    if (products.length === 0) {
      hasMore = false;
      continue;
    }

    const operations = products.flatMap((product) => [
      { index: { _index: "products", _id: product.id } },
      toElasticsearchDoc(product),
    ]);

    await client.bulk({ body: operations, refresh: false });

    skip += batchSize;
    console.log(`Synced ${skip} products`);
  }

  // 最後にリフレッシュ
  await client.indices.refresh({ index: "products" });
  console.log("Sync completed");
}
```

## Prisma Middleware での自動同期

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { syncProduct } from "./sync/product-sync";

const prisma = new PrismaClient();

// Middleware で自動同期
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Product の変更を検知して同期
  if (params.model === "Product") {
    if (
      params.action === "create" ||
      params.action === "update" ||
      params.action === "delete"
    ) {
      const productId =
        params.action === "delete" ? params.args.where.id : result.id;

      // 非同期で同期（レスポンスをブロックしない）
      syncProduct(productId).catch(console.error);
    }
  }

  return result;
});

export default prisma;
```

## イベント駆動同期

### イベントの発行

```typescript
// lib/events/product-events.ts
import { EventEmitter } from "events";

export const productEvents = new EventEmitter();

export type ProductEvent = {
  type: "created" | "updated" | "deleted";
  productId: string;
  timestamp: Date;
};

export function emitProductEvent(event: ProductEvent): void {
  productEvents.emit("product", event);
}
```

### イベントリスナー

```typescript
// lib/sync/event-listener.ts
import { productEvents, ProductEvent } from "@/lib/events/product-events";
import { syncProduct } from "./product-sync";

// バッファリング
const syncBuffer: Set<string> = new Set();
let flushTimeout: NodeJS.Timeout | null = null;

productEvents.on("product", (event: ProductEvent) => {
  syncBuffer.add(event.productId);

  // デバウンス: 100ms 後にまとめて同期
  if (flushTimeout) clearTimeout(flushTimeout);
  flushTimeout = setTimeout(async () => {
    const productIds = Array.from(syncBuffer);
    syncBuffer.clear();

    await Promise.all(productIds.map(syncProduct));
  }, 100);
});
```

### 使用例

```typescript
// app/api/products/route.ts
import prisma from "@/lib/prisma";
import { emitProductEvent } from "@/lib/events/product-events";

export async function POST(req: Request) {
  const data = await req.json();

  const product = await prisma.product.create({
    data,
  });

  // イベント発行
  emitProductEvent({
    type: "created",
    productId: product.id,
    timestamp: new Date(),
  });

  return Response.json(product);
}
```

## Webhook での同期

```typescript
// app/api/webhooks/database/route.ts
import { syncProduct } from "@/lib/sync/product-sync";

export async function POST(req: Request) {
  const { table, action, id } = await req.json();

  // 署名検証
  const signature = req.headers.get("x-webhook-signature");
  if (!verifySignature(signature, await req.text())) {
    return new Response("Invalid signature", { status: 401 });
  }

  if (table === "products") {
    await syncProduct(id);
  }

  return new Response("OK");
}
```

## バッチ同期（Cron Job）

```typescript
// scripts/sync-products.ts
import { syncAllProducts } from "@/lib/sync/product-sync";

async function main() {
  console.log("Starting product sync...");
  const start = Date.now();

  await syncAllProducts();

  console.log(`Sync completed in ${Date.now() - start}ms`);
}

main().catch(console.error);
```

```yaml
# vercel.json
{ "crons": [{ "path": "/api/cron/sync-products", "schedule": "0 */6 * * *" }] }
```

```typescript
// app/api/cron/sync-products/route.ts
import { syncAllProducts } from "@/lib/sync/product-sync";

export async function GET(req: Request) {
  // Vercel Cron の認証
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  await syncAllProducts();

  return new Response("OK");
}
```

## 差分同期

```typescript
// lib/sync/incremental-sync.ts
import prisma from "@/lib/prisma";
import client from "@/lib/elasticsearch";

export async function syncProductsIncremental(since: Date): Promise<void> {
  const products = await prisma.product.findMany({
    where: {
      updatedAt: { gte: since },
    },
  });

  if (products.length === 0) return;

  const operations = products.flatMap((product) => [
    { index: { _index: "products", _id: product.id } },
    toElasticsearchDoc(product),
  ]);

  await client.bulk({ body: operations, refresh: true });

  console.log(`Synced ${products.length} products since ${since}`);
}

// 最終同期時刻を管理
async function getLastSyncTime(): Promise<Date> {
  // Redis や DB から取得
  const value = await redis.get("last_product_sync");
  return value ? new Date(value) : new Date(0);
}

async function setLastSyncTime(time: Date): Promise<void> {
  await redis.set("last_product_sync", time.toISOString());
}
```

## 整合性チェック

```typescript
// scripts/verify-sync.ts
import prisma from "@/lib/prisma";
import client from "@/lib/elasticsearch";

async function verifySyncIntegrity(): Promise<void> {
  // DB の件数
  const dbCount = await prisma.product.count();

  // Elasticsearch の件数
  const esResult = await client.count({ index: "products" });
  const esCount = esResult.count;

  console.log(`DB: ${dbCount}, ES: ${esCount}`);

  if (dbCount !== esCount) {
    console.warn("Count mismatch! Running full sync...");
    // await syncAllProducts();
  }

  // サンプルデータの検証
  const sampleProducts = await prisma.product.findMany({
    take: 100,
    orderBy: { updatedAt: "desc" },
  });

  for (const product of sampleProducts) {
    try {
      const esDoc = await client.get({
        index: "products",
        id: product.id,
      });

      if (esDoc._source.updated_at !== product.updatedAt.toISOString()) {
        console.warn(`Stale document: ${product.id}`);
      }
    } catch (error) {
      console.warn(`Missing document: ${product.id}`);
    }
  }
}
```

## 次のステップ

次章では、ベストプラクティスについて学びます。
