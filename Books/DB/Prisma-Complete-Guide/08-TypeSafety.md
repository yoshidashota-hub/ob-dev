# 第8章: 型安全性

## 生成される型

Prisma Client は スキーマから TypeScript 型を自動生成。

```bash
npx prisma generate
```

```typescript
// node_modules/.prisma/client/index.d.ts に生成される

// モデルの型
type User = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

// Enum
type Role = "USER" | "ADMIN" | "MODERATOR";
```

## 型のインポート

```typescript
import { Prisma, User, Post, Role } from "@prisma/client";

// または
import type { User, Post } from "@prisma/client";
```

## モデル型の使用

### 基本の型

```typescript
import { User, Post } from "@prisma/client";

async function getUser(id: number): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
  });
}
```

### リレーションを含む型

```typescript
import { Prisma } from "@prisma/client";

// include/select を使った型を定義
type UserWithPosts = Prisma.UserGetPayload<{
  include: { posts: true };
}>;

// 使用
async function getUserWithPosts(id: number): Promise<UserWithPosts | null> {
  return await prisma.user.findUnique({
    where: { id },
    include: { posts: true },
  });
}
```

### 複雑な型

```typescript
// select を使った型
type UserSelect = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    posts: {
      select: {
        title: true;
        createdAt: true;
      };
    };
  };
}>;

// ネストした include
type UserWithPostsAndTags = Prisma.UserGetPayload<{
  include: {
    posts: {
      include: {
        tags: true;
      };
    };
  };
}>;
```

## 入力型

### Create 入力

```typescript
import { Prisma } from "@prisma/client";

type UserCreateInput = Prisma.UserCreateInput;

async function createUser(data: UserCreateInput): Promise<User> {
  return await prisma.user.create({ data });
}

// 使用
const user = await createUser({
  email: "test@example.com",
  name: "Test User",
  posts: {
    create: [{ title: "First Post" }],
  },
});
```

### Update 入力

```typescript
type UserUpdateInput = Prisma.UserUpdateInput;

async function updateUser(
  id: number,
  data: UserUpdateInput,
): Promise<User> {
  return await prisma.user.update({
    where: { id },
    data,
  });
}
```

### Where 条件

```typescript
type UserWhereInput = Prisma.UserWhereInput;

async function findUsers(where: UserWhereInput): Promise<User[]> {
  return await prisma.user.findMany({ where });
}

// 使用
const admins = await findUsers({
  role: "ADMIN",
  isActive: true,
});
```

## Validator

入力データの検証に使用。

```typescript
import { Prisma } from "@prisma/client";

// 型チェックのみ（ランタイムでは検証しない）
function createUserData(
  data: Prisma.UserCreateInput,
): Prisma.UserCreateInput {
  return data;
}

// satisfies を使用
const userData = {
  email: "test@example.com",
  name: "Test",
} satisfies Prisma.UserCreateInput;
```

## カスタム型の定義

### Branded Types

```typescript
// ID の型を厳密に
type UserId = number & { __brand: "UserId" };
type PostId = number & { __brand: "PostId" };

function createUserId(id: number): UserId {
  return id as UserId;
}

async function getUser(id: UserId): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
  });
}
```

### DTO パターン

```typescript
// API レスポンス用の型
interface UserDTO {
  id: number;
  email: string;
  name: string | null;
  postCount: number;
}

function toUserDTO(
  user: Prisma.UserGetPayload<{
    include: { _count: { select: { posts: true } } };
  }>,
): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    postCount: user._count.posts,
  };
}
```

## 動的なクエリ

### 条件付き include/select

```typescript
// 型安全な動的クエリ
async function getUsers<T extends Prisma.UserFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>,
): Promise<Prisma.UserGetPayload<T>[]> {
  return await prisma.user.findMany(args);
}

// 使用
const users = await getUsers({
  include: { posts: true },
});
// users は UserWithPosts[] 型
```

### 条件付きフィールド

```typescript
async function findUsers(options: {
  includePosts?: boolean;
  includeProfile?: boolean;
}) {
  return await prisma.user.findMany({
    include: {
      posts: options.includePosts ?? false,
      profile: options.includeProfile ?? false,
    },
  });
}
```

## Utility Types

### Partial / Required

```typescript
// 部分的な更新
type PartialUser = Partial<User>;

// 必須フィールドのみ
type RequiredUserFields = Pick<User, "id" | "email">;
```

### Omit / Pick

```typescript
// 特定のフィールドを除外
type UserWithoutPassword = Omit<User, "password">;

// 特定のフィールドのみ
type UserSummary = Pick<User, "id" | "name" | "email">;
```

## Zod との統合

```typescript
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Zod スキーマ
const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
}) satisfies z.ZodType<Prisma.UserCreateInput>;

// 検証して作成
async function createUser(input: unknown): Promise<User> {
  const data = userCreateSchema.parse(input);
  return await prisma.user.create({ data });
}
```

## 型のエクスポート

```typescript
// types/prisma.ts
import { Prisma, User, Post } from "@prisma/client";

// 再エクスポート
export type { User, Post };

// カスタム型
export type UserWithPosts = Prisma.UserGetPayload<{
  include: { posts: true };
}>;

export type UserCreateData = Prisma.UserCreateInput;
export type UserUpdateData = Prisma.UserUpdateInput;
export type UserWhereInput = Prisma.UserWhereInput;
```

## 次のステップ

次章では、パフォーマンス最適化について学びます。
