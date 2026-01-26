# 14 - ベストプラクティス

## この章で学ぶこと

- tRPC 開発のベストプラクティス
- プロジェクト構造の設計
- パフォーマンス最適化
- セキュリティ対策
- 運用・監視

## プロジェクト構造

### 推奨ディレクトリ構成

```
src/
├── server/
│   ├── trpc.ts                 # tRPC 初期化
│   ├── context.ts              # Context 定義
│   ├── router.ts               # メインルーター
│   ├── routers/                # 機能別ルーター
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── auth.ts
│   ├── middlewares/            # 共通ミドルウェア
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── logging.ts
│   └── schemas/                # Zod スキーマ
│       ├── user.ts
│       └── post.ts
├── client/
│   └── trpc.ts                 # クライアント設定
└── types/
    └── index.ts                # 共有型定義
```

### Router の分割

```typescript
// server/routers/user.ts
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { userSchemas } from "../schemas/user";

export const userRouter = router({
  // 認証不要な Procedure
  getById: publicProcedure
    .input(userSchemas.getById)
    .query(async ({ input, ctx }) => {
      return ctx.db.user.findUnique({ where: { id: input.id } });
    }),

  // 認証が必要な Procedure
  updateProfile: protectedProcedure
    .input(userSchemas.updateProfile)
    .mutation(async ({ input, ctx }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    }),
});

// server/router.ts
import { router } from "./trpc";
import { userRouter } from "./routers/user";
import { postRouter } from "./routers/post";
import { authRouter } from "./routers/auth";

export const appRouter = router({
  user: userRouter,
  post: postRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
```

### スキーマの分離

```typescript
// server/schemas/user.ts
import { z } from "zod";

export const userSchemas = {
  getById: z.object({
    id: z.string().uuid(),
  }),

  create: z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8),
  }),

  updateProfile: z.object({
    name: z.string().min(2).max(50).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional(),
  }),
};

// 型を export
export type CreateUserInput = z.infer<typeof userSchemas.create>;
export type UpdateProfileInput = z.infer<typeof userSchemas.updateProfile>;
```

## エラーハンドリング

### カスタムエラークラス

```typescript
// server/errors.ts
import { TRPCError } from "@trpc/server";

export class NotFoundError extends TRPCError {
  constructor(resource: string) {
    super({
      code: "NOT_FOUND",
      message: `${resource} not found`,
    });
  }
}

export class ValidationError extends TRPCError {
  constructor(message: string, field?: string) {
    super({
      code: "BAD_REQUEST",
      message,
      cause: { field },
    });
  }
}

export class PermissionError extends TRPCError {
  constructor(action: string) {
    super({
      code: "FORBIDDEN",
      message: `You don't have permission to ${action}`,
    });
  }
}
```

### グローバルエラーハンドラー

```typescript
// server/trpc.ts
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // 本番環境ではスタックトレースを隠す
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        // カスタムフィールドを追加
        timestamp: new Date().toISOString(),
        requestId: shape.data?.requestId,
      },
    };
  },
});
```

## パフォーマンス最適化

### DataLoader パターン

```typescript
// server/loaders/userLoader.ts
import DataLoader from "dataloader";
import { prisma } from "../db";

export const createUserLoader = () => {
  return new DataLoader<string, User | null>(async (ids) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return ids.map((id) => userMap.get(id) || null);
  });
};

// server/context.ts
export const createContext = async (opts: CreateContextOptions) => {
  return {
    db: prisma,
    loaders: {
      user: createUserLoader(),
    },
  };
};

// server/routers/post.ts
export const postRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany();
    
    // N+1 問題を回避
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        author: await ctx.loaders.user.load(post.authorId),
      }))
    );
    
    return postsWithAuthors;
  }),
});
```

### クエリの最適化

```typescript
// 必要なフィールドのみ取得
const user = await ctx.db.user.findUnique({
  where: { id: input.id },
  select: {
    id: true,
    name: true,
    email: true,
    // password は取得しない
  },
});

// リレーションの事前読み込み
const posts = await ctx.db.post.findMany({
  include: {
    author: {
      select: {
        id: true,
        name: true,
      },
    },
    _count: {
      select: { comments: true },
    },
  },
});
```

### キャッシュ戦略

```typescript
// クライアント側のキャッシュ設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      cacheTime: 1000 * 60 * 30, // 30分
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

// サーバー側のキャッシュ（Redis）
import { createClient } from "redis";

const redis = createClient();

export const cachedProcedure = publicProcedure.use(async ({ ctx, next, path }) => {
  const cacheKey = `trpc:${path}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const result = await next();
  
  await redis.setEx(cacheKey, 300, JSON.stringify(result)); // 5分キャッシュ
  
  return result;
});
```

## セキュリティ

### 入力のサニタイズ

```typescript
// server/middlewares/sanitize.ts
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

// HTML サニタイズ用のカスタムスキーマ
const sanitizedString = z.string().transform((val) => DOMPurify.sanitize(val));

// 使用例
const postSchemas = {
  create: z.object({
    title: z.string().min(1).max(200),
    content: sanitizedString, // HTMLをサニタイズ
  }),
};
```

### レート制限

```typescript
// server/middlewares/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10秒間に10リクエスト
  analytics: true,
});

export const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const identifier = ctx.user?.id || ctx.req.headers.get("x-forwarded-for");
  
  const { success, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      rateLimitRemaining: remaining,
    },
  });
});
```

### 権限チェック

```typescript
// server/middlewares/permissions.ts
type Permission = "read:users" | "write:users" | "delete:users";

const checkPermission = (permission: Permission) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    
    const hasPermission = ctx.user.permissions.includes(permission);
    
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing permission: ${permission}`,
      });
    }
    
    return next();
  });
};

// 使用例
export const adminProcedure = protectedProcedure.use(checkPermission("write:users"));
```

## ロギングと監視

### 構造化ログ

```typescript
// server/middlewares/logging.ts
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export const loggingMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  logger.info({
    requestId,
    path,
    type,
    userId: ctx.user?.id,
    message: "Request started",
  });
  
  try {
    const result = await next();
    
    logger.info({
      requestId,
      path,
      type,
      duration: Date.now() - start,
      message: "Request completed",
    });
    
    return result;
  } catch (error) {
    logger.error({
      requestId,
      path,
      type,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Request failed",
    });
    throw error;
  }
});
```

### メトリクス収集

```typescript
// server/middlewares/metrics.ts
import { Counter, Histogram } from "prom-client";

const requestCounter = new Counter({
  name: "trpc_requests_total",
  help: "Total number of tRPC requests",
  labelNames: ["path", "type", "status"],
});

const requestDuration = new Histogram({
  name: "trpc_request_duration_seconds",
  help: "Duration of tRPC requests",
  labelNames: ["path", "type"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const metricsMiddleware = t.middleware(async ({ next, path, type }) => {
  const end = requestDuration.startTimer({ path, type });
  
  try {
    const result = await next();
    requestCounter.inc({ path, type, status: "success" });
    return result;
  } catch (error) {
    requestCounter.inc({ path, type, status: "error" });
    throw error;
  } finally {
    end();
  }
});
```

## 型安全性

### 型の再利用

```typescript
// types/index.ts
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/router";

// Router の入出力型
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// 個別の型
export type User = RouterOutputs["user"]["getById"];
export type CreateUserInput = RouterInputs["user"]["create"];

// クライアントで使用
import type { User, CreateUserInput } from "@/types";

const user: User = await trpc.user.getById.query({ id: "1" });
```

## まとめ

- **構造**: 機能別に Router とスキーマを分離
- **エラー**: カスタムエラークラスとグローバルハンドラー
- **パフォーマンス**: DataLoader、キャッシュ、クエリ最適化
- **セキュリティ**: サニタイズ、レート制限、権限チェック
- **監視**: 構造化ログとメトリクス収集
- **型**: Router から型を推論して再利用

## 確認問題

1. tRPC プロジェクトの推奨ディレクトリ構成を説明してください
2. N+1 問題を解決する方法を説明してください
3. レート制限を実装する理由と方法を説明してください
4. 構造化ログの利点を説明してください

## おわりに

この tRPC Complete Guide を通じて、tRPC の基礎から実践的なパターンまでを学びました。tRPC を使うことで、型安全な API を簡単に構築でき、フロントエンドとバックエンドの開発体験を大幅に向上させることができます。

実際のプロジェクトで活用し、さらに理解を深めてください。
