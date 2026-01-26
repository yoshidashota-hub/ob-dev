# 06 - エラーハンドリング

## この章で学ぶこと

- tRPC のエラー体系
- TRPCError の使い方
- カスタムエラー
- クライアントでのエラー処理

## TRPCError

tRPC は `TRPCError` クラスでエラーを表現します。

### エラーコード

```typescript
import { TRPCError } from "@trpc/server";

// 利用可能なエラーコード
type TRPC_ERROR_CODE =
  | "PARSE_ERROR"           // 400 - リクエストのパースに失敗
  | "BAD_REQUEST"           // 400 - 不正なリクエスト
  | "UNAUTHORIZED"          // 401 - 認証が必要
  | "FORBIDDEN"             // 403 - アクセス禁止
  | "NOT_FOUND"             // 404 - リソースが見つからない
  | "METHOD_NOT_SUPPORTED"  // 405 - メソッドがサポートされていない
  | "TIMEOUT"               // 408 - タイムアウト
  | "CONFLICT"              // 409 - コンフリクト
  | "PRECONDITION_FAILED"   // 412 - 前提条件が満たされていない
  | "PAYLOAD_TOO_LARGE"     // 413 - ペイロードが大きすぎる
  | "UNPROCESSABLE_CONTENT" // 422 - 処理できないコンテンツ
  | "TOO_MANY_REQUESTS"     // 429 - リクエスト過多
  | "CLIENT_CLOSED_REQUEST" // 499 - クライアントがリクエストを閉じた
  | "INTERNAL_SERVER_ERROR" // 500 - サーバー内部エラー
```

### 基本的な使用

```typescript
const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({ where: { id: input.id } });
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      
      return user;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id !== input.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own account",
        });
      }
      
      await db.user.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
```

### 追加情報の付与

```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Validation failed",
  cause: originalError, // 元のエラーを保持
});
```

## エラーフォーマット

### カスタムエラーフォーマッター

```typescript
// server/trpc.ts
import { ZodError } from "zod";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Zod エラーの詳細を追加
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
        // カスタムフィールドを追加
        timestamp: new Date().toISOString(),
      },
    };
  },
});
```

## クライアントでのエラー処理

### useQuery でのエラー

```tsx
function UserProfile({ userId }: { userId: string }) {
  const user = trpc.user.getById.useQuery(
    { id: userId },
    {
      retry: (failureCount, error) => {
        // 404 や 403 はリトライしない
        if (error.data?.code === "NOT_FOUND" || error.data?.code === "FORBIDDEN") {
          return false;
        }
        return failureCount < 3;
      },
    }
  );

  if (user.isLoading) return <Loading />;
  
  if (user.error) {
    switch (user.error.data?.code) {
      case "NOT_FOUND":
        return <NotFound message="User not found" />;
      case "UNAUTHORIZED":
        return <Redirect to="/login" />;
      default:
        return <ErrorDisplay error={user.error} />;
    }
  }

  return <div>{user.data.name}</div>;
}
```

### useMutation でのエラー

```tsx
function CreateUserForm() {
  const createUser = trpc.user.create.useMutation({
    onError: (error) => {
      if (error.data?.zodError) {
        // バリデーションエラー
        const fieldErrors = error.data.zodError.fieldErrors;
        setErrors(fieldErrors);
      } else if (error.data?.code === "CONFLICT") {
        toast.error("User with this email already exists");
      } else {
        toast.error("Something went wrong");
      }
    },
    onSuccess: () => {
      toast.success("User created!");
    },
  });

  return (
    <form onSubmit={/* ... */}>
      {/* フォーム内容 */}
    </form>
  );
}
```

## グローバルエラーハンドリング

```tsx
// クライアント設定でグローバルハンドラーを設定
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      fetch: async (url, options) => {
        const response = await fetch(url, options);
        
        if (response.status === 401) {
          // 認証エラーをグローバルに処理
          window.location.href = "/login";
        }
        
        return response;
      },
    }),
  ],
});
```

## まとめ

- **TRPCError** で適切なエラーコードを使用
- **errorFormatter** でエラー形式をカスタマイズ
- クライアントでは **error.data.code** でエラー種別を判定
- **onError** コールバックでエラーを処理

## 次の章

[07 - React クライアント](./07-React-Client.md) では、React での tRPC クライアントの詳細を学びます。
