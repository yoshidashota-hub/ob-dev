# 第7章: データベース連携

## Cloudflare D1

### 設定

```typescript
// src/index.ts
import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// 全件取得
app.get("/users", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM users").all();
  return c.json(results);
});

// 1件取得
app.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE id = ?")
    .bind(id)
    .first();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json(user);
});

// 作成
app.post("/users", async (c) => {
  const { name, email } = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO users (name, email) VALUES (?, ?)",
  )
    .bind(name, email)
    .run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

// 更新
app.put("/users/:id", async (c) => {
  const id = c.req.param("id");
  const { name, email } = await c.req.json();

  await c.env.DB.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?")
    .bind(name, email, id)
    .run();

  return c.json({ success: true });
});

// 削除
app.delete("/users/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

export default app;
```

### マイグレーション

```bash
# スキーマ作成
npx wrangler d1 execute my-db --local --file=./schema.sql

# 本番環境
npx wrangler d1 execute my-db --file=./schema.sql
```

## Drizzle ORM

### セットアップ

```bash
npm install drizzle-orm
npm install -D drizzle-kit
```

### スキーマ定義

```typescript
// db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  authorId: integer("author_id").references(() => users.id),
});
```

### Hono との統合

```typescript
// src/index.ts
import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users, posts } from "../db/schema";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/users", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(users);
  return c.json(result);
});

app.get("/users/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = parseInt(c.req.param("id"));

  const [user] = await db.select().from(users).where(eq(users.id, id));

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json(user);
});

app.post("/users", async (c) => {
  const db = drizzle(c.env.DB);
  const { name, email } = await c.req.json();

  const result = await db.insert(users).values({ name, email }).returning();
  return c.json(result[0], 201);
});

// リレーション
app.get("/users/:id/posts", async (c) => {
  const db = drizzle(c.env.DB);
  const authorId = parseInt(c.req.param("id"));

  const result = await db
    .select()
    .from(posts)
    .where(eq(posts.authorId, authorId));

  return c.json(result);
});

export default app;
```

## Prisma

### セットアップ

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

### スキーマ

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}
```

### Node.js での使用

```typescript
// src/index.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = new Hono();

app.get("/users", async (c) => {
  const users = await prisma.user.findMany({
    include: { posts: true },
  });
  return c.json(users);
});

app.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await prisma.user.findUnique({
    where: { id },
    include: { posts: true },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json(user);
});

app.post("/users", async (c) => {
  const data = await c.req.json();
  const user = await prisma.user.create({ data });
  return c.json(user, 201);
});

serve({ fetch: app.fetch, port: 3000 });
```

## Cloudflare KV

```typescript
type Bindings = {
  CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// 取得
app.get("/cache/:key", async (c) => {
  const key = c.req.param("key");
  const value = await c.env.CACHE.get(key);

  if (!value) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(JSON.parse(value));
});

// 保存
app.put("/cache/:key", async (c) => {
  const key = c.req.param("key");
  const value = await c.req.json();

  await c.env.CACHE.put(key, JSON.stringify(value), {
    expirationTtl: 3600,  // 1時間
  });

  return c.json({ success: true });
});

// 削除
app.delete("/cache/:key", async (c) => {
  const key = c.req.param("key");
  await c.env.CACHE.delete(key);
  return c.json({ success: true });
});
```

## Upstash Redis

```typescript
import { Redis } from "@upstash/redis";

type Bindings = {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/redis/:key", async (c) => {
  const redis = new Redis({
    url: c.env.UPSTASH_REDIS_REST_URL,
    token: c.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const key = c.req.param("key");
  const value = await redis.get(key);
  return c.json({ value });
});

app.post("/redis/:key", async (c) => {
  const redis = new Redis({
    url: c.env.UPSTASH_REDIS_REST_URL,
    token: c.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const key = c.req.param("key");
  const { value, ttl } = await c.req.json();

  if (ttl) {
    await redis.set(key, value, { ex: ttl });
  } else {
    await redis.set(key, value);
  }

  return c.json({ success: true });
});
```

## キャッシュパターン

```typescript
const getWithCache = async <T>(
  key: string,
  kv: KVNamespace,
  fetcher: () => Promise<T>,
  ttl = 3600,
): Promise<T> => {
  // キャッシュ確認
  const cached = await kv.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // データ取得
  const data = await fetcher();

  // キャッシュ保存
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });

  return data;
};

app.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await getWithCache(
    `user:${id}`,
    c.env.KV,
    () => fetchUserFromDB(id),
    3600,
  );

  return c.json(user);
});
```

## 次のステップ

次章では、認証について詳しく学びます。
