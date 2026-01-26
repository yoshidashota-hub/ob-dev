# 07 - React Client

## この章で学ぶこと

- tRPC React クライアントのセットアップ
- `@trpc/react-query` の使い方
- Provider パターンの実装
- クライアントサイドでの型安全な API 呼び出し

## tRPC React クライアントの概要

tRPC は React Query をベースにした React クライアントを提供し、サーバーとの型安全な通信を実現します。

## セットアップ

### インストール

```bash
npm install @trpc/client @trpc/react-query @tanstack/react-query
```

### クライアントの作成

```typescript
// src/utils/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../server/router";

export const trpc = createTRPCReact<AppRouter>();
```

### Provider の設定

```typescript
// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "../utils/trpc";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              // カスタムヘッダー
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### ルートレイアウトでの使用

```typescript
// src/app/layout.tsx
import { TRPCProvider } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

## Query の使用

### 基本的な Query

```typescript
// src/components/UserList.tsx
"use client";

import { trpc } from "../utils/trpc";

export function UserList() {
  const { data, isLoading, error } = trpc.user.list.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### パラメータ付き Query

```typescript
// src/components/UserDetail.tsx
"use client";

import { trpc } from "../utils/trpc";

interface UserDetailProps {
  userId: string;
}

export function UserDetail({ userId }: UserDetailProps) {
  const { data: user, isLoading } = trpc.user.getById.useQuery(
    { id: userId },
    {
      enabled: !!userId, // userId がある場合のみ実行
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### 条件付き Query

```typescript
export function ConditionalQuery({ searchTerm }: { searchTerm: string }) {
  const { data } = trpc.user.search.useQuery(
    { query: searchTerm },
    {
      enabled: searchTerm.length >= 3, // 3文字以上で検索
      keepPreviousData: true, // 新しいデータ取得中も前のデータを表示
    }
  );

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Mutation の使用

### 基本的な Mutation

```typescript
// src/components/CreateUserForm.tsx
"use client";

import { useState } from "react";
import { trpc } from "../utils/trpc";

export function CreateUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const utils = trpc.useUtils();
  
  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      // キャッシュを無効化して再取得
      utils.user.list.invalidate();
      setName("");
      setEmail("");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

### Optimistic Updates

```typescript
export function TodoItem({ todo }: { todo: Todo }) {
  const utils = trpc.useUtils();

  const toggleComplete = trpc.todo.toggleComplete.useMutation({
    // 楽観的更新
    onMutate: async ({ id }) => {
      // 進行中の refetch をキャンセル
      await utils.todo.list.cancel();

      // 現在のデータを取得
      const previousTodos = utils.todo.list.getData();

      // 楽観的に更新
      utils.todo.list.setData(undefined, (old) =>
        old?.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );

      // ロールバック用に前のデータを返す
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      // エラー時にロールバック
      if (context?.previousTodos) {
        utils.todo.list.setData(undefined, context.previousTodos);
      }
    },
    onSettled: () => {
      // 成功・失敗に関わらずキャッシュを再検証
      utils.todo.list.invalidate();
    },
  });

  return (
    <div onClick={() => toggleComplete.mutate({ id: todo.id })}>
      <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
        {todo.title}
      </span>
    </div>
  );
}
```

## useUtils の活用

### キャッシュ操作

```typescript
export function CacheManagement() {
  const utils = trpc.useUtils();

  // キャッシュの無効化
  const invalidateUsers = () => {
    utils.user.list.invalidate();
  };

  // 特定のキャッシュを無効化
  const invalidateUser = (id: string) => {
    utils.user.getById.invalidate({ id });
  };

  // すべてのキャッシュを無効化
  const invalidateAll = () => {
    utils.invalidate();
  };

  // キャッシュデータの取得
  const getCachedUsers = () => {
    return utils.user.list.getData();
  };

  // キャッシュデータの設定
  const setCachedUser = (user: User) => {
    utils.user.getById.setData({ id: user.id }, user);
  };

  // プリフェッチ
  const prefetchUser = (id: string) => {
    utils.user.getById.prefetch({ id });
  };

  return (
    <div>
      <button onClick={invalidateUsers}>Refresh Users</button>
      <button onClick={invalidateAll}>Refresh All</button>
    </div>
  );
}
```

## 認証付きクライアント

### トークンの設定

```typescript
// src/utils/trpc.ts
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          headers() {
            const token = localStorage.getItem("token");
            return token
              ? { Authorization: `Bearer ${token}` }
              : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 認証エラーのハンドリング

```typescript
import { TRPCClientError } from "@trpc/client";

export function useAuthenticatedQuery() {
  const router = useRouter();

  const { data, error } = trpc.user.me.useQuery(undefined, {
    retry: (failureCount, error) => {
      // 認証エラーの場合はリトライしない
      if (error instanceof TRPCClientError) {
        if (error.data?.code === "UNAUTHORIZED") {
          return false;
        }
      }
      return failureCount < 3;
    },
    onError: (error) => {
      if (error instanceof TRPCClientError) {
        if (error.data?.code === "UNAUTHORIZED") {
          router.push("/login");
        }
      }
    },
  });

  return { data, error };
}
```

## まとめ

- `createTRPCReact` で型安全な React クライアントを作成
- Provider パターンで QueryClient と trpcClient を設定
- `useQuery` で型安全なデータ取得
- `useMutation` で型安全なデータ更新
- `useUtils` でキャッシュを直接操作
- Optimistic Updates でユーザー体験を向上

## 確認問題

1. tRPC React クライアントのセットアップ手順を説明してください
2. Query と Mutation の違いは何ですか？
3. Optimistic Updates の実装方法を説明してください
4. useUtils でできることを3つ挙げてください

## 次の章へ

[08 - React Query](./08-React-Query.md) では、React Query との統合について詳しく学びます。
