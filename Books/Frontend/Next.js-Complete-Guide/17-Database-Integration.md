# 17 - Database Integration

## 概要

この章では、Next.js でのデータベース連携について学びます。Prisma、Drizzle ORM の使い方、Vercel Postgres、Supabase との統合などを解説します。

## Prisma

### インストール

```bash
npm install prisma @prisma/client
npx prisma init
```

### スキーマ定義

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
  password  String?
  image     String?
  role      String   @default("user")
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### マイグレーション

```bash
# 開発用マイグレーション
npx prisma migrate dev --name init

# 本番用マイグレーション
npx prisma migrate deploy

# クライアント生成
npx prisma generate
```

### Prisma Client

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### CRUD 操作

```typescript
// Create
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
  },
});

// Read
const users = await prisma.user.findMany();
const user = await prisma.user.findUnique({
  where: { id: "user-id" },
});

// Update
const updatedUser = await prisma.user.update({
  where: { id: "user-id" },
  data: { name: "Jane Doe" },
});

// Delete
await prisma.user.delete({
  where: { id: "user-id" },
});
```

### リレーション

```typescript
// ユーザーと投稿を一緒に取得
const userWithPosts = await prisma.user.findUnique({
  where: { id: "user-id" },
  include: {
    posts: true,
  },
});

// 特定のフィールドのみ取得
const userWithPosts = await prisma.user.findUnique({
  where: { id: "user-id" },
  select: {
    name: true,
    email: true,
    posts: {
      select: {
        title: true,
        published: true,
      },
    },
  },
});
```

### フィルタリングとソート

```typescript
// フィルタリング
const publishedPosts = await prisma.post.findMany({
  where: {
    published: true,
    title: {
      contains: "Next.js",
    },
  },
});

// ソート
const posts = await prisma.post.findMany({
  orderBy: {
    createdAt: "desc",
  },
});

// ページネーション
const posts = await prisma.post.findMany({
  skip: 0,
  take: 10,
});
```

## Drizzle ORM

### インストール

```bash
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit
```

### スキーマ定義

```typescript
// lib/schema.ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  password: text("password"),
  image: text("image"),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  published: boolean("published").default(false),
  authorId: text("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Drizzle Client

```typescript
// lib/db.ts
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

export const db = drizzle(sql, { schema });
```

### CRUD 操作

```typescript
import { db } from "@/lib/db";
import { users, posts } from "@/lib/schema";
import { eq, desc, like } from "drizzle-orm";

// Create
await db.insert(users).values({
  id: crypto.randomUUID(),
  email: "user@example.com",
  name: "John Doe",
});

// Read
const allUsers = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.id, "user-id"));

// Update
await db.update(users).set({ name: "Jane Doe" }).where(eq(users.id, "user-id"));

// Delete
await db.delete(users).where(eq(users.id, "user-id"));
```

### Join

```typescript
import { db } from "@/lib/db";
import { users, posts } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Inner Join
const result = await db
  .select({
    postTitle: posts.title,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id));
```

## Vercel Postgres

### セットアップ

```bash
# Vercel CLI でデータベース作成
vercel link
vercel env pull .env.local
```

### 環境変数

```bash
# .env.local
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://...?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://..."
```

### 直接クエリ

```typescript
import { sql } from "@vercel/postgres";

export async function getUsers() {
  const { rows } = await sql`SELECT * FROM users`;
  return rows;
}

export async function createUser(email: string, name: string) {
  await sql`
    INSERT INTO users (email, name)
    VALUES (${email}, ${name})
  `;
}
```

## Supabase

### インストール

```bash
npm install @supabase/supabase-js
```

### Client

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Server Client

```typescript
// lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

### CRUD 操作

```typescript
import { supabase } from "@/lib/supabase";

// Create
const { data, error } = await supabase
  .from("users")
  .insert({ email: "user@example.com", name: "John" });

// Read
const { data: users } = await supabase.from("users").select("*");
const { data: user } = await supabase
  .from("users")
  .select("*")
  .eq("id", "user-id")
  .single();

// Update
await supabase.from("users").update({ name: "Jane" }).eq("id", "user-id");

// Delete
await supabase.from("users").delete().eq("id", "user-id");
```

## Server Actions でのデータベース操作

### Prisma

```typescript
// app/actions/posts.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});

export async function createPost(formData: FormData) {
  const parsed = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  await prisma.post.create({
    data: {
      ...parsed.data,
      authorId: "current-user-id", // 実際は認証から取得
    },
  });

  revalidatePath("/posts");
  return { success: true };
}

export async function deletePost(id: string) {
  await prisma.post.delete({
    where: { id },
  });

  revalidatePath("/posts");
}
```

### フォーム

```typescript
// components/PostForm.tsx
import { createPost } from "@/app/actions/posts";

export function PostForm() {
  return (
    <form action={createPost}>
      <input type="text" name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

## トランザクション

### Prisma

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: "user@example.com", name: "John" },
  });

  await tx.post.create({
    data: {
      title: "First Post",
      authorId: user.id,
    },
  });
});
```

### Drizzle

```typescript
import { db } from "@/lib/db";

await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({ ... }).returning();
  await tx.insert(posts).values({ authorId: user.id, ... });
});
```

## シード

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
    },
  });

  await prisma.post.createMany({
    data: [
      { title: "Post 1", authorId: user.id, published: true },
      { title: "Post 2", authorId: user.id, published: true },
      { title: "Draft", authorId: user.id, published: false },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

```bash
npx prisma db seed
```

## まとめ

- **Prisma** は型安全で使いやすい ORM
- **Drizzle** は軽量で高速な ORM
- **Vercel Postgres** は Vercel とシームレスに統合
- **Supabase** は認証機能も含むバックエンド
- **Server Actions** でデータ操作
- **トランザクション** で複数操作を安全に実行

## 演習問題

1. Prisma でブログのスキーマを定義してください
2. CRUD API を実装してください
3. Server Actions でデータ操作を実装してください
4. ページネーションを実装してください

## 次のステップ

次の章では、Vercel へのデプロイについて学びます。

⬅️ 前へ: [16-Authentication.md](./16-Authentication.md)
➡️ 次へ: [18-Deployment.md](./18-Deployment.md)
