# 04 - コンテキスト

## この章で学ぶこと

- Context の概念と役割
- Context の作成方法
- リクエスト情報へのアクセス
- 認証情報の管理

## Context とは

Context は各リクエストで共有されるデータを保持するオブジェクトです。データベース接続、認証情報、リクエストヘッダーなどを格納します。

### 基本的な Context

```typescript
// server/context.ts
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { inferAsyncReturnType } from "@trpc/server";

export async function createContext(opts: CreateNextContextOptions) {
  return {
    req: opts.req,
    res: opts.res,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

### tRPC への適用

```typescript
// server/trpc.ts
import { initTRPC } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
```

## 認証付き Context

### セッションベース認証

```typescript
// server/context.ts
import { getSession } from "next-auth/react";
import { prisma } from "./db";

export async function createContext({ req, res }: CreateNextContextOptions) {
  const session = await getSession({ req });
  
  let user = null;
  if (session?.user?.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
  }

  return {
    req,
    res,
    session,
    user,
    prisma,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

### JWT 認証

```typescript
// server/context.ts
import jwt from "jsonwebtoken";

type JWTPayload = {
  userId: string;
  email: string;
};

export async function createContext({ req }: CreateNextContextOptions) {
  // Authorization ヘッダーからトークンを取得
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  let user = null;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
    } catch {
      // トークンが無効な場合は user は null のまま
    }
  }

  return {
    user,
    prisma,
  };
}
```

## Context の使用

### Procedure 内でのアクセス

```typescript
// server/routers/user.ts
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const userRouter = router({
  // Context にアクセス
  getProfile: protectedProcedure.query(({ ctx }) => {
    // ctx.user は認証済みユーザー
    return ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: { posts: true },
    });
  }),

  // リクエスト情報へのアクセス
  getClientInfo: publicProcedure.query(({ ctx }) => {
    return {
      ip: ctx.req.socket.remoteAddress,
      userAgent: ctx.req.headers["user-agent"],
    };
  }),
});
```

### 認証チェック付き Procedure

```typescript
// server/trpc.ts
import { TRPCError } from "@trpc/server";

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // 型が User | null から User に絞り込まれる
    },
  });
});
```

## 動的な Context

### リクエストごとの Context

```typescript
export async function createContext({ req, res }: CreateNextContextOptions) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  return {
    req,
    res,
    requestId,
    startTime,
    log: (message: string) => {
      console.log(`[${requestId}] ${message}`);
    },
  };
}
```

### データベース接続

```typescript
// server/context.ts
import { PrismaClient } from "@prisma/client";

// 開発環境でのホットリロード対策
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

export async function createContext() {
  return {
    prisma,
  };
}
```

## 実践: 完全な認証 Context

```typescript
// server/context.ts
import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { prisma } from "./db";

export async function createContext({ req, res }: CreateNextContextOptions) {
  // NextAuth セッションを取得
  const session = await getServerSession(req, res, authOptions);

  // ユーザー情報を取得（セッションがある場合）
  let user = null;
  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  return {
    session,
    user,
    prisma,
    req,
    res,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

// server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// 認証必須の Procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});

// 管理者専用の Procedure
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});
```

## まとめ

- **Context** はリクエスト間で共有するデータを保持
- **createContext** 関数でリクエストごとに生成
- **認証情報**、**データベース接続**などを格納
- **protectedProcedure** で認証チェックを共通化

## 次の章

[05 - ミドルウェア](./05-Middleware.md) では、Procedure に共通処理を追加する方法を学びます。
