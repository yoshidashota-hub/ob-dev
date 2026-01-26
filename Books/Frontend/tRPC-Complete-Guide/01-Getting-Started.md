# 01 - はじめかた

## この章で学ぶこと

- tRPC のセットアップ方法
- 基本的なプロジェクト構成
- 最初の API エンドポイント作成
- クライアントからの呼び出し

## tRPC のインストール

### 基本パッケージ

```bash
# サーバー側
npm install @trpc/server zod

# クライアント側（React）
npm install @trpc/client @trpc/react-query @tanstack/react-query
```

### TypeScript の設定

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler"
  }
}
```

## 基本的なセットアップ

### 1. tRPC インスタンスの作成

```typescript
// server/trpc.ts
import { initTRPC } from "@trpc/server";

// tRPC インスタンスを作成
const t = initTRPC.create();

// エクスポート
export const router = t.router;
export const publicProcedure = t.procedure;
```

### 2. Router の定義

```typescript
// server/routers/_app.ts
import { router, publicProcedure } from "../trpc";
import { z } from "zod";

export const appRouter = router({
  // シンプルな Query
  hello: publicProcedure.query(() => {
    return { message: "Hello, tRPC!" };
  }),

  // 入力を受け取る Query
  greeting: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { message: `Hello, ${input.name}!` };
    }),
});

// 型をエクスポート（クライアントで使用）
export type AppRouter = typeof appRouter;
```

### 3. HTTP サーバーのセットアップ

```typescript
// server/index.ts
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./routers/_app";

const server = createHTTPServer({
  router: appRouter,
});

server.listen(3000);
console.log("Server is running on http://localhost:3000");
```

## プロジェクト構成

### 推奨ディレクトリ構造

```
project/
├── src/
│   ├── server/
│   │   ├── trpc.ts          # tRPC インスタンス
│   │   ├── routers/
│   │   │   ├── _app.ts      # ルートルーター
│   │   │   ├── user.ts      # ユーザー関連
│   │   │   └── post.ts      # 投稿関連
│   │   └── index.ts         # サーバーエントリーポイント
│   │
│   ├── client/
│   │   ├── trpc.ts          # クライアント設定
│   │   └── App.tsx
│   │
│   └── shared/
│       └── types.ts         # 共有の型定義
│
├── package.json
└── tsconfig.json
```

### モジュラー Router

```typescript
// server/routers/user.ts
import { router, publicProcedure } from "../trpc";
import { z } from "zod";

export const userRouter = router({
  getAll: publicProcedure.query(async () => {
    // データベースからユーザーを取得
    return [
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
    ];
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // ID でユーザーを取得
      return { id: input.id, name: "Alice", email: "alice@example.com" };
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // ユーザーを作成
      return { id: 3, ...input };
    }),
});
```

```typescript
// server/routers/_app.ts
import { router } from "../trpc";
import { userRouter } from "./user";
import { postRouter } from "./post";

export const appRouter = router({
  user: userRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;
```

## クライアントのセットアップ

### React クライアント

```typescript
// client/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../server/routers/_app";

export const trpc = createTRPCReact<AppRouter>();
```

### Provider の設定

```tsx
// client/App.tsx
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./trpc";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "http://localhost:3000",
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Main />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function Main() {
  // tRPC フックが使用可能
  const hello = trpc.hello.useQuery();

  if (hello.isLoading) return <p>Loading...</p>;
  if (hello.error) return <p>Error: {hello.error.message}</p>;

  return <p>{hello.data?.message}</p>;
}
```

## 最初の API 呼び出し

### Query（データ取得）

```tsx
function UserList() {
  // ユーザー一覧を取得
  const users = trpc.user.getAll.useQuery();

  if (users.isLoading) return <p>Loading...</p>;
  if (users.error) return <p>Error: {users.error.message}</p>;

  return (
    <ul>
      {users.data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// パラメータ付きの Query
function UserDetail({ userId }: { userId: number }) {
  const user = trpc.user.getById.useQuery({ id: userId });

  if (user.isLoading) return <p>Loading...</p>;
  if (user.error) return <p>Error: {user.error.message}</p>;

  return (
    <div>
      <h2>{user.data?.name}</h2>
      <p>{user.data?.email}</p>
    </div>
  );
}
```

### Mutation（データ変更）

```tsx
function CreateUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const utils = trpc.useUtils();
  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      // 成功時にユーザー一覧を再取得
      utils.user.getAll.invalidate();
      setName("");
      setEmail("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
      />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </button>
      {createUser.error && <p>Error: {createUser.error.message}</p>}
    </form>
  );
}
```

## 型安全性の確認

### 自動補完

```tsx
function Demo() {
  // ✅ 入力の型が自動的に推論される
  const user = trpc.user.getById.useQuery({
    id: 1, // number 型が必要
    // name: "test" // ❌ コンパイルエラー：存在しないプロパティ
  });

  // ✅ レスポンスの型も自動推論
  if (user.data) {
    console.log(user.data.name); // string
    console.log(user.data.email); // string
    // console.log(user.data.foo); // ❌ コンパイルエラー
  }
}
```

### 共有型の活用

```typescript
// shared/types.ts
import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof UserSchema>;

// server/routers/user.ts
import { UserSchema } from "../../shared/types";

export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .output(UserSchema) // 出力の型を明示
    .query(async ({ input }) => {
      // ...
    }),
});
```

## 開発ツール

### tRPC Panel

```bash
npm install trpc-panel
```

```typescript
// server/index.ts
import { renderTrpcPanel } from "trpc-panel";

// 開発環境でパネルを表示
if (process.env.NODE_ENV === "development") {
  app.use("/panel", (req, res) => {
    res.send(
      renderTrpcPanel(appRouter, {
        url: "http://localhost:3000",
      })
    );
  });
}
```

### React Query DevTools

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Main />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

## まとめ

- tRPC は **@trpc/server** と **@trpc/client** で構成
- **initTRPC** で tRPC インスタンスを作成
- **router** で API エンドポイントを定義
- **型のエクスポート** でクライアントとの型共有
- React では **@trpc/react-query** と **@tanstack/react-query** を使用
- 完全な **型安全性** を自動的に実現

## 確認問題

1. tRPC の主なパッケージは何ですか？
2. router と procedure の違いは何ですか？
3. クライアントで型安全性を得るために必要なことは？
4. Query と Mutation の違いは何ですか？

## 次の章

[02 - Router と Procedures](./02-Router-Procedures.md) では、Router と Procedure の詳細な使い方を学びます。
