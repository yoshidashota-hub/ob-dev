# 第10章: フレームワーク統合とベストプラクティス

## Next.js との統合

### シングルトンパターン

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

### Server Actions

```typescript
// app/actions/users.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;

  await prisma.user.create({
    data: { email, name },
  });

  revalidatePath("/users");
}

export async function deleteUser(id: number) {
  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/users");
}
```

### API Routes

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

```typescript
// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(user);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const data = await req.json();

  const user = await prisma.user.update({
    where: { id: parseInt(params.id) },
    data,
  });

  return NextResponse.json(user);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  await prisma.user.delete({
    where: { id: parseInt(params.id) },
  });

  return new NextResponse(null, { status: 204 });
}
```

## NestJS との統合

### Prisma Service

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Prisma Module

```typescript
// src/prisma/prisma.module.ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 使用

```typescript
// src/users/users.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  create(data: { email: string; name?: string }) {
    return this.prisma.user.create({ data });
  }
}
```

## テスト

### ユニットテスト

```typescript
// __tests__/users.test.ts
import { prisma } from "@/lib/prisma";

describe("Users", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create a user", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("test@example.com");
  });

  it("should find users", async () => {
    await prisma.user.createMany({
      data: [
        { email: "user1@example.com" },
        { email: "user2@example.com" },
      ],
    });

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(2);
  });
});
```

### モック

```typescript
// __mocks__/prisma.ts
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

export const prismaMock = mockDeep<PrismaClient>();

jest.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});
```

```typescript
// __tests__/users.service.test.ts
import { prismaMock } from "../__mocks__/prisma";
import { getUser } from "../services/users";

describe("getUser", () => {
  it("should return a user", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      name: "Test",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const user = await getUser(1);
    expect(user).toEqual(mockUser);
  });
});
```

## プロジェクト構成

```
src/
├── lib/
│   └── prisma.ts           # Prisma クライアント
├── prisma/
│   ├── schema.prisma       # スキーマ
│   ├── migrations/         # マイグレーション
│   └── seed.ts             # シードデータ
├── repositories/           # リポジトリパターン
│   ├── user.repository.ts
│   └── post.repository.ts
├── services/               # ビジネスロジック
│   ├── user.service.ts
│   └── post.service.ts
└── types/
    └── prisma.ts           # 型定義
```

## シードデータ

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ユーザー作成
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
    },
  });

  // 投稿作成
  await prisma.post.createMany({
    data: [
      { title: "First Post", authorId: admin.id },
      { title: "Second Post", authorId: admin.id },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed");
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

## ベストプラクティス

### 1. リポジトリパターン

```typescript
// repositories/user.repository.ts
import { prisma } from "@/lib/prisma";
import { Prisma, User } from "@prisma/client";

export const userRepository = {
  findAll: () => prisma.user.findMany(),

  findById: (id: number) =>
    prisma.user.findUnique({ where: { id } }),

  findByEmail: (email: string) =>
    prisma.user.findUnique({ where: { email } }),

  create: (data: Prisma.UserCreateInput) =>
    prisma.user.create({ data }),

  update: (id: number, data: Prisma.UserUpdateInput) =>
    prisma.user.update({ where: { id }, data }),

  delete: (id: number) =>
    prisma.user.delete({ where: { id } }),
};
```

### 2. エラーハンドリング

```typescript
import { Prisma } from "@prisma/client";

async function createUser(data: Prisma.UserCreateInput) {
  try {
    return await prisma.user.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("Email already exists");
      }
    }
    throw error;
  }
}
```

### 3. 環境ごとの設定

```typescript
// lib/prisma.ts
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: getLogConfig(),
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });
};

function getLogConfig() {
  switch (process.env.NODE_ENV) {
    case "development":
      return ["query", "error", "warn"];
    case "test":
      return ["error"];
    default:
      return ["error"];
  }
}
```

## まとめ

### 重要なポイント

1. **シングルトンパターン**: 開発環境でのコネクション管理
2. **型安全性**: 生成された型を活用
3. **テスト**: モックと実際のDBテストを使い分け
4. **マイグレーション**: 本番では `migrate deploy`
5. **パフォーマンス**: N+1 問題、インデックス、キャッシュ

### 参考リンク

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Examples](https://github.com/prisma/prisma-examples)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
