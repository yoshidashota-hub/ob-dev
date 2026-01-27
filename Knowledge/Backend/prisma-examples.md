# Prisma サンプル集

## スキーマ定義

### 基本的なモデル

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
  role      Role     @default(USER)
  posts     Post[]
  comments  Comment[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Profile {
  id     String  @id @default(cuid())
  bio    String?
  avatar String?
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String  @unique
}

model Post {
  id        String    @id @default(cuid())
  title     String
  content   String?
  published Boolean   @default(false)
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  tags      Tag[]
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([authorId])
  @@index([published])
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

enum Role {
  USER
  ADMIN
}
```

## CRUD 操作

### Create

```typescript
// 単一作成
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John",
    password: hashedPassword,
  },
});

// リレーション込みで作成
const userWithProfile = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John",
    password: hashedPassword,
    profile: {
      create: { bio: "Hello!" },
    },
  },
  include: { profile: true },
});

// 複数作成
const users = await prisma.user.createMany({
  data: [
    { email: "user1@example.com", password: "hash1" },
    { email: "user2@example.com", password: "hash2" },
  ],
  skipDuplicates: true,
});
```

### Read

```typescript
// 単一取得
const user = await prisma.user.findUnique({
  where: { id: "xxx" },
});

const userByEmail = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});

// 複数取得
const users = await prisma.user.findMany({
  where: {
    role: "USER",
    createdAt: { gte: new Date("2024-01-01") },
  },
  orderBy: { createdAt: "desc" },
  skip: 0,
  take: 10,
});

// リレーション込み
const userWithPosts = await prisma.user.findUnique({
  where: { id: "xxx" },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: "desc" },
    },
    profile: true,
  },
});

// フィールド選択
const userNames = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

### Update

```typescript
// 単一更新
const updated = await prisma.user.update({
  where: { id: "xxx" },
  data: { name: "New Name" },
});

// Upsert
const user = await prisma.user.upsert({
  where: { email: "user@example.com" },
  update: { name: "Updated Name" },
  create: { email: "user@example.com", name: "New User", password: "hash" },
});

// 複数更新
await prisma.post.updateMany({
  where: { authorId: "xxx", published: false },
  data: { published: true },
});

// リレーションの更新
await prisma.user.update({
  where: { id: "xxx" },
  data: {
    posts: {
      connect: { id: "postId" }, // 既存を関連付け
      disconnect: { id: "postId" }, // 関連解除
      create: { title: "New Post" }, // 新規作成
    },
  },
});
```

### Delete

```typescript
// 単一削除
await prisma.user.delete({
  where: { id: "xxx" },
});

// 複数削除
await prisma.post.deleteMany({
  where: { published: false },
});
```

## 高度なクエリ

### フィルタリング

```typescript
// OR 条件
const users = await prisma.user.findMany({
  where: {
    OR: [{ name: { contains: "John" } }, { email: { contains: "john" } }],
  },
});

// NOT 条件
const users = await prisma.user.findMany({
  where: {
    NOT: { role: "ADMIN" },
  },
});

// 文字列フィルタ
const users = await prisma.user.findMany({
  where: {
    name: {
      contains: "John", // 部分一致
      startsWith: "J", // 前方一致
      endsWith: "n", // 後方一致
      mode: "insensitive", // 大文字小文字無視
    },
  },
});
```

### トランザクション

```typescript
// 順次トランザクション
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { email: "user@example.com", password: "hash" } }),
  prisma.post.create({ data: { title: "Post", authorId: "xxx" } }),
]);

// インタラクティブトランザクション
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id: "xxx" } });
  if (!user) throw new Error("User not found");

  await tx.post.create({ data: { title: "Post", authorId: user.id } });
  await tx.user.update({
    where: { id: user.id },
    data: { postsCount: { increment: 1 } },
  });
});
```

### 集計

```typescript
// カウント
const count = await prisma.user.count({
  where: { role: "USER" },
});

// 集計
const stats = await prisma.post.aggregate({
  _count: { id: true },
  _avg: { views: true },
  where: { published: true },
});

// グループ化
const postsByUser = await prisma.post.groupBy({
  by: ["authorId"],
  _count: { id: true },
  having: {
    id: { _count: { gt: 5 } },
  },
});
```

## Next.js パターン

### シングルトン

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

### Server Action

```typescript
// app/actions/posts.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await prisma.post.create({
    data: { title, content, authorId: "xxx" },
  });

  revalidatePath("/posts");
}
```
