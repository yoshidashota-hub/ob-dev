# 05 - ミドルウェア

## この章で学ぶこと

- ミドルウェアの概念と使い方
- 認証・認可ミドルウェア
- ロギングとパフォーマンス計測
- ミドルウェアの合成

## ミドルウェアの基本

ミドルウェアは Procedure の実行前後に処理を追加する仕組みです。

### 基本構造

```typescript
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  
  const result = await next();
  
  const duration = Date.now() - start;
  console.log(`${type} ${path} - ${duration}ms`);
  
  return result;
});
```

### Procedure への適用

```typescript
// 単一の Procedure に適用
const loggedProcedure = publicProcedure.use(loggerMiddleware);

// Router 全体に適用する場合は各 Procedure で使用
const appRouter = router({
  hello: loggedProcedure.query(() => "Hello"),
  goodbye: loggedProcedure.query(() => "Goodbye"),
});
```

## 認証ミドルウェア

```typescript
// 認証チェック
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  });
});

// ロールチェック
const hasRole = (role: string) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (ctx.user.role !== role) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });

// 使用
export const protectedProcedure = publicProcedure.use(isAuthed);
export const adminProcedure = publicProcedure.use(hasRole("admin"));
```

## ロギングミドルウェア

```typescript
const logger = t.middleware(async ({ path, type, input, ctx, next }) => {
  const requestId = ctx.requestId ?? crypto.randomUUID();
  const start = Date.now();

  console.log(`[${requestId}] -> ${type.toUpperCase()} ${path}`, {
    input,
    user: ctx.user?.id,
  });

  try {
    const result = await next();
    const duration = Date.now() - start;
    
    console.log(`[${requestId}] <- ${type.toUpperCase()} ${path}`, {
      duration: `${duration}ms`,
      ok: result.ok,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[${requestId}] !! ${type.toUpperCase()} ${path}`, {
      duration: `${duration}ms`,
      error,
    });
    throw error;
  }
});
```

## レート制限ミドルウェア

```typescript
const rateLimit = new Map<string, { count: number; resetAt: number }>();

const rateLimiter = (limit: number, windowMs: number) =>
  t.middleware(async ({ ctx, next }) => {
    const key = ctx.user?.id ?? ctx.req.socket.remoteAddress ?? "anonymous";
    const now = Date.now();
    
    const record = rateLimit.get(key);
    
    if (record && record.resetAt > now) {
      if (record.count >= limit) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded",
        });
      }
      record.count++;
    } else {
      rateLimit.set(key, { count: 1, resetAt: now + windowMs });
    }
    
    return next();
  });

// 使用: 1分間に100リクエストまで
export const rateLimitedProcedure = publicProcedure.use(rateLimiter(100, 60000));
```

## ミドルウェアの合成

```typescript
// 複数のミドルウェアを組み合わせ
export const protectedProcedure = publicProcedure
  .use(logger)
  .use(isAuthed)
  .use(rateLimiter(100, 60000));

// 順序: logger -> isAuthed -> rateLimiter -> handler
```

## 実践例

```typescript
// server/middleware/index.ts
export const logger = t.middleware(/* ... */);
export const isAuthed = t.middleware(/* ... */);
export const hasRole = (role: string) => t.middleware(/* ... */);
export const rateLimiter = (limit: number, window: number) => t.middleware(/* ... */);

// server/trpc.ts
export const publicProcedure = t.procedure.use(logger);
export const protectedProcedure = publicProcedure.use(isAuthed);
export const adminProcedure = protectedProcedure.use(hasRole("admin"));
```

## まとめ

- **ミドルウェア** で共通処理を再利用
- **next()** で次の処理に制御を渡す
- **ctx** を拡張して後続処理に情報を渡す
- 複数のミドルウェアを **チェーン** で合成

## 次の章

[06 - エラーハンドリング](./06-Error-Handling.md) では、tRPC でのエラー処理を学びます。
