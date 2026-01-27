# Prisma 学習ノート

## 概要

Prisma は TypeScript/Node.js 向けの次世代 ORM。型安全なデータベースアクセスを提供。

## セットアップ

```bash
npm install prisma @prisma/client
npx prisma init
```

## スキーマ定義

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
  password  String
  posts     Post[]
  comments  Comment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id        String    @id @default(cuid())
  title     String
  content   String?
  published Boolean   @default(false)
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  comments  Comment[]
  tags      Tag[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([authorId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  createdAt DateTime @default(now())
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}
```

## マイグレーション

```bash
# 開発用マイグレーション
npx prisma migrate dev --name init

# 本番デプロイ
npx prisma migrate deploy

# スキーマをDBに直接反映（開発用）
npx prisma db push

# Prisma Studio 起動
npx prisma studio
```

## CRUD 操作

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John",
    posts: {
      create: { title: "First Post" },
    },
  },
  include: { posts: true },
});

// Read
const users = await prisma.user.findMany({
  where: { email: { contains: "@example.com" } },
  include: { posts: true },
  orderBy: { createdAt: "desc" },
  take: 10,
  skip: 0,
});

const user = await prisma.user.findUnique({
  where: { id: "..." },
});

// Update
const updated = await prisma.user.update({
  where: { id: "..." },
  data: { name: "New Name" },
});

// Upsert
const upserted = await prisma.user.upsert({
  where: { email: "user@example.com" },
  update: { name: "Updated" },
  create: { email: "user@example.com", name: "New" },
});

// Delete
await prisma.user.delete({ where: { id: "..." } });

// 複数削除
await prisma.post.deleteMany({
  where: { published: false },
});
```

## 高度なクエリ

```typescript
// トランザクション
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { email: "new@example.com" } }),
  prisma.post.create({ data: { title: "Post", authorId: "..." } }),
]);

// インタラクティブトランザクション
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: "..." } });
  if (!user) throw new Error("User not found");
  await tx.post.create({ data: { title: "Post", authorId: user.id } });
});

// 集計
const stats = await prisma.post.aggregate({
  _count: true,
  _avg: { views: true },
  where: { published: true },
});

// グループ化
const postsByUser = await prisma.post.groupBy({
  by: ["authorId"],
  _count: { id: true },
});
```

## Next.js での使用

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Server Action での使用
// app/actions/posts.ts
("use server");

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;

  await prisma.post.create({
    data: { title, authorId: "..." },
  });

  revalidatePath("/posts");
}
```

## ベストプラクティス

1. **シングルトンパターン** でクライアントインスタンス管理
2. **select** で必要なフィールドのみ取得
3. **インデックス** を適切に設定
4. **ソフトデリート** の検討
5. **Prisma Accelerate** でコネクションプーリング

## 参考リソース

- [Prisma 公式ドキュメント](https://www.prisma.io/docs)
- [Prisma + Next.js ガイド](https://www.prisma.io/nextjs)
