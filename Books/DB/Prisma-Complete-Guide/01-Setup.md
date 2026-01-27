# 第1章: セットアップ

## Prisma とは

TypeScript / JavaScript 向けの次世代 ORM。

```
┌─────────────────────────────────────────────────────┐
│                  Prisma Stack                        │
│                                                     │
│  ┌─────────────┐   ┌─────────────┐                 │
│  │ Prisma      │   │ Prisma      │                 │
│  │ Client      │   │ Studio      │                 │
│  │ (Query)     │   │ (GUI)       │                 │
│  └──────┬──────┘   └──────┬──────┘                 │
│         │                 │                         │
│         ▼                 ▼                         │
│  ┌─────────────────────────────┐                   │
│  │      Prisma Engine          │                   │
│  │   (Rust, Query Builder)     │                   │
│  └──────────────┬──────────────┘                   │
│                 │                                   │
│                 ▼                                   │
│  ┌─────────────────────────────┐                   │
│  │        Database             │                   │
│  │  PostgreSQL / MySQL / etc.  │                   │
│  └─────────────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

## インストール

```bash
# Prisma CLI をインストール
npm install -D prisma

# Prisma Client をインストール
npm install @prisma/client
```

## 初期化

```bash
# PostgreSQL の場合
npx prisma init --datasource-provider postgresql

# MySQL の場合
npx prisma init --datasource-provider mysql

# SQLite の場合（開発用）
npx prisma init --datasource-provider sqlite
```

生成されるファイル:

```
prisma/
└── schema.prisma   # スキーマ定義
.env                # 環境変数
```

## データベース接続

### 環境変数

```env
# .env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# SQLite
DATABASE_URL="file:./dev.db"
```

### スキーマ設定

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 最初のモデル

```prisma
// prisma/schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## マイグレーション

```bash
# マイグレーション作成と適用
npx prisma migrate dev --name init

# 本番環境でのマイグレーション
npx prisma migrate deploy
```

## Prisma Client 生成

```bash
# クライアント生成（migrate dev で自動実行される）
npx prisma generate
```

## Prisma Client の使用

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### 基本的な CRUD

```typescript
import { prisma } from "@/lib/prisma";

// Create
const user = await prisma.user.create({
  data: {
    email: "test@example.com",
    name: "Test User",
  },
});

// Read
const users = await prisma.user.findMany();
const user = await prisma.user.findUnique({
  where: { email: "test@example.com" },
});

// Update
const updated = await prisma.user.update({
  where: { id: 1 },
  data: { name: "Updated Name" },
});

// Delete
const deleted = await prisma.user.delete({
  where: { id: 1 },
});
```

## Prisma Studio

```bash
# GUI でデータを閲覧・編集
npx prisma studio
```

## 便利なコマンド

```bash
# スキーマのフォーマット
npx prisma format

# データベースをスキーマに同期（開発用、マイグレーション履歴なし）
npx prisma db push

# 既存のデータベースからスキーマを生成
npx prisma db pull

# データベースをリセット
npx prisma migrate reset

# マイグレーション状態の確認
npx prisma migrate status
```

## Next.js との統合

```typescript
// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const data = await req.json();

  const user = await prisma.user.create({ data });

  return NextResponse.json(user, { status: 201 });
}
```

## 次のステップ

次章では、スキーマ定義について詳しく学びます。
