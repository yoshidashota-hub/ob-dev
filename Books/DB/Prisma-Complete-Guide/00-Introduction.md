# 第0章: はじめに

## Prisma とは

Prisma は、TypeScript と Node.js のための次世代 ORM（Object-Relational Mapping）です。

## Prisma の構成要素

```
┌─────────────────────────────────────────────────────┐
│                 Prisma Ecosystem                     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              Prisma Client                   │   │
│  │        型安全なデータベースアクセス           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              Prisma Migrate                  │   │
│  │          スキーママイグレーション             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              Prisma Studio                   │   │
│  │             データ確認 GUI                   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## セットアップ

```bash
# インストール
npm install prisma @prisma/client

# 初期化
npx prisma init
```

### 生成されるファイル

```
prisma/
└── schema.prisma   # スキーマ定義

.env                # 環境変数
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
}
```

## 基本操作

### マイグレーション

```bash
# 開発用マイグレーション作成・適用
npx prisma migrate dev --name init

# クライアント生成
npx prisma generate

# Prisma Studio 起動
npx prisma studio
```

### CRUD 操作

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John',
  },
})

// Read
const users = await prisma.user.findMany({
  where: { name: { contains: 'John' } },
  include: { posts: true },
})

// Update
const updated = await prisma.user.update({
  where: { id: user.id },
  data: { name: 'Jane' },
})

// Delete
await prisma.user.delete({
  where: { id: user.id },
})
```

## 他の ORM との比較

| 項目 | Prisma | TypeORM | Drizzle |
|------|--------|---------|---------|
| 型安全 | ◎ 自動生成 | △ デコレータ | ◎ |
| 学習曲線 | 低 | 中 | 低 |
| パフォーマンス | 良 | 普通 | 最高 |
| SQL 可視性 | 低 | 中 | 高 |

## Next.js での使用

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

```typescript
// app/users/page.tsx
import { prisma } from '@/lib/prisma'

export default async function UsersPage() {
  const users = await prisma.user.findMany()
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

## 次のステップ

次章では、スキーマ設計のベストプラクティスを学びます。
