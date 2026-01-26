# 02 - Router と Procedures

## この章で学ぶこと

- Router の構造と設計
- Query と Mutation の違い
- Procedure の定義方法
- ネストした Router の作成

## Router の基本

Router は tRPC の API エンドポイントをグループ化するためのコンテナです。

### 基本構造

```typescript
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

// router と procedure をエクスポート
export const router = t.router;
export const publicProcedure = t.procedure;
```

### シンプルな Router

```typescript
import { router, publicProcedure } from "./trpc";

const appRouter = router({
  // 各プロパティが API エンドポイント
  hello: publicProcedure.query(() => "Hello World"),
  goodbye: publicProcedure.query(() => "Goodbye World"),
});
```

## Procedure の種類

### Query（読み取り）

Query はデータの取得に使用します。HTTP GET リクエストに相当します。

```typescript
const appRouter = router({
  // シンプルな Query
  getTime: publicProcedure.query(() => {
    return new Date().toISOString();
  }),

  // 入力を受け取る Query
  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({ where: { id: input.id } });
      return user;
    }),

  // 複雑な Query
  searchUsers: publicProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().default(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const { query, page, limit } = input;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        db.user.findMany({
          where: { name: { contains: query } },
          skip,
          take: limit,
        }),
        db.user.count({ where: { name: { contains: query } } }),
      ]);

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),
});
```

### Mutation（書き込み）

Mutation はデータの作成・更新・削除に使用します。HTTP POST/PUT/DELETE に相当します。

```typescript
const appRouter = router({
  // 作成
  createUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await db.user.create({ data: input });
      return user;
    }),

  // 更新
  updateUser: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const user = await db.user.update({
        where: { id },
        data,
      });
      return user;
    }),

  // 削除
  deleteUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.user.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
```

## ネストした Router

大規模なアプリケーションでは Router をネストして整理します。

### 個別の Router ファイル

```typescript
// server/routers/user.ts
import { router, publicProcedure } from "../trpc";
import { z } from "zod";

export const userRouter = router({
  getAll: publicProcedure.query(async () => {
    return db.user.findMany();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.user.findUnique({ where: { id: input.id } });
    }),

  create: publicProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(async ({ input }) => {
      return db.user.create({ data: input });
    }),
});
```

```typescript
// server/routers/post.ts
import { router, publicProcedure } from "../trpc";
import { z } from "zod";

export const postRouter = router({
  getAll: publicProcedure.query(async () => {
    return db.post.findMany({ include: { author: true } });
  }),

  getByAuthor: publicProcedure
    .input(z.object({ authorId: z.string() }))
    .query(async ({ input }) => {
      return db.post.findMany({ where: { authorId: input.authorId } });
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
        authorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return db.post.create({ data: input });
    }),
});
```

### Router の統合

```typescript
// server/routers/_app.ts
import { router } from "../trpc";
import { userRouter } from "./user";
import { postRouter } from "./post";
import { commentRouter } from "./comment";
import { authRouter } from "./auth";

export const appRouter = router({
  user: userRouter,
  post: postRouter,
  comment: commentRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
```

### クライアントでの使用

```tsx
// ネストしたパスでアクセス
const users = trpc.user.getAll.useQuery();
const posts = trpc.post.getByAuthor.useQuery({ authorId: "1" });

// Mutation
const createUser = trpc.user.create.useMutation();
const createPost = trpc.post.create.useMutation();
```

## 深くネストした Router

```typescript
// server/routers/admin/index.ts
import { router } from "../../trpc";
import { adminUserRouter } from "./user";
import { adminSettingsRouter } from "./settings";

export const adminRouter = router({
  user: adminUserRouter,
  settings: adminSettingsRouter,
});

// server/routers/_app.ts
import { adminRouter } from "./admin";

export const appRouter = router({
  user: userRouter,
  post: postRouter,
  admin: adminRouter, // ネストした Router
});

// クライアント
const adminUsers = trpc.admin.user.getAll.useQuery();
const settings = trpc.admin.settings.get.useQuery();
```

## Procedure チェーン

Procedure にはチェーンでさまざまな機能を追加できます。

### 基本チェーン

```typescript
publicProcedure
  .input(schema)      // 入力バリデーション
  .output(schema)     // 出力バリデーション
  .meta({ ... })      // メタデータ
  .use(middleware)    // ミドルウェア
  .query(handler)     // または .mutation(handler)
```

### 入力と出力のバリデーション

```typescript
import { z } from "zod";

const UserInputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
});

const UserOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.date(),
});

const userRouter = router({
  create: publicProcedure
    .input(UserInputSchema)
    .output(UserOutputSchema)
    .mutation(async ({ input }) => {
      const user = await db.user.create({ data: input });
      return user; // 出力も検証される
    }),
});
```

### メタデータ

```typescript
const t = initTRPC.meta<{ description: string; example?: unknown }>().create();

const userRouter = router({
  getAll: t.procedure
    .meta({
      description: "Get all users",
      example: [{ id: "1", name: "Alice" }],
    })
    .query(async () => {
      return db.user.findMany();
    }),
});
```

## Procedure の再利用

### 基本の Procedure をカスタマイズ

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// 認証済みユーザー用の Procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user が必ず存在することを保証
    },
  });
});

// 管理者用の Procedure
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});
```

### 使用例

```typescript
// server/routers/user.ts
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc";

export const userRouter = router({
  // 誰でもアクセス可能
  getAll: publicProcedure.query(async () => {
    return db.user.findMany();
  }),

  // 認証済みユーザーのみ
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.user.findUnique({ where: { id: ctx.user.id } });
  }),

  // 管理者のみ
  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.user.delete({ where: { id: input.id } });
    }),
});
```

## 実践: 完全な CRUD Router

```typescript
// server/routers/todo.ts
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CreateTodoSchema = z.object({
  title: z.string().min(1).max(200),
});

const UpdateTodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

export const todoRouter = router({
  // 一覧取得（認証必要）
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.todo.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // 単一取得
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const todo = await db.todo.findUnique({ where: { id: input.id } });

      if (!todo || todo.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return todo;
    }),

  // 作成
  create: protectedProcedure
    .input(CreateTodoSchema)
    .output(TodoSchema)
    .mutation(async ({ ctx, input }) => {
      return db.todo.create({
        data: {
          ...input,
          completed: false,
          userId: ctx.user.id,
        },
      });
    }),

  // 更新
  update: protectedProcedure
    .input(UpdateTodoSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await db.todo.findUnique({ where: { id } });
      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return db.todo.update({ where: { id }, data });
    }),

  // 削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.todo.findUnique({ where: { id: input.id } });
      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await db.todo.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // 完了状態の切り替え
  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.todo.findUnique({ where: { id: input.id } });
      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return db.todo.update({
        where: { id: input.id },
        data: { completed: !existing.completed },
      });
    }),

  // 完了済みを一括削除
  clearCompleted: protectedProcedure.mutation(async ({ ctx }) => {
    await db.todo.deleteMany({
      where: {
        userId: ctx.user.id,
        completed: true,
      },
    });
    return { success: true };
  }),
});
```

## まとめ

- **Router** は Procedure をグループ化するコンテナ
- **Query** はデータ取得、**Mutation** はデータ変更
- **ネスト** で大規模なアプリを整理
- **Procedure チェーン** で input/output/middleware を追加
- **カスタム Procedure** で認証などの共通ロジックを再利用

## 確認問題

1. Query と Mutation の使い分けの基準は？
2. ネストした Router のメリットは何ですか？
3. protectedProcedure を作成する方法は？
4. output バリデーションの目的は？

## 次の章

[03 - 入力バリデーション](./03-Input-Validation.md) では、Zod を使った詳細な入力バリデーションを学びます。
