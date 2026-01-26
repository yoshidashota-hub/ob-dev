# 10 - Next.js App Router 統合

## この章で学ぶこと

- Next.js App Router での tRPC セットアップ
- Server Components でのデータ取得
- Server Actions との組み合わせ
- RSC (React Server Components) パターン

## プロジェクト構造

```
app/
├── api/
│   └── trpc/
│       └── [trpc]/
│           └── route.ts    # tRPC API ルート
├── _trpc/
│   ├── client.ts           # クライアント設定
│   └── server.ts           # サーバー設定
├── providers.tsx           # Provider コンポーネント
├── layout.tsx
└── page.tsx
server/
├── router.ts               # メインルーター
├── trpc.ts                 # tRPC 初期化
└── routers/
    └── ...
```

## サーバー側のセットアップ

### tRPC 初期化

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const { req } = opts;
  
  // 認証情報を取得
  const session = await getSession(req);

  return {
    session,
    db: prisma,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});
```

### API ルートの作成

```typescript
// app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/router";
import { createContext } from "@/server/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

## クライアント側のセットアップ

### tRPC クライアント

```typescript
// app/_trpc/client.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/router";

export const trpc = createTRPCReact<AppRouter>();
```

### サーバーサイドクライアント

```typescript
// app/_trpc/server.ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";
import superjson from "superjson";
import type { AppRouter } from "@/server/router";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const serverClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      headers: async () => {
        const heads = await headers();
        return {
          cookie: heads.get("cookie") ?? "",
        };
      },
      transformer: superjson,
    }),
  ],
});
```

### Provider の設定

```typescript
// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./_trpc/client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
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

### レイアウトでの使用

```typescript
// app/layout.tsx
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

## Server Components でのデータ取得

### 直接的なサーバー呼び出し

```typescript
// app/users/page.tsx
import { serverClient } from "../_trpc/server";

export default async function UsersPage() {
  // Server Component で直接 tRPC を呼び出す
  const users = await serverClient.user.list.query();

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 動的ルートでの使用

```typescript
// app/users/[id]/page.tsx
import { serverClient } from "../../_trpc/server";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export default async function UserPage({ params }: Props) {
  const user = await serverClient.user.getById.query({ id: params.id });

  if (!user) {
    notFound();
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// 静的生成のためのパラメータを生成
export async function generateStaticParams() {
  const users = await serverClient.user.list.query();
  return users.map((user) => ({ id: user.id }));
}
```

## Client Components との組み合わせ

### サーバーからの初期データを渡す

```typescript
// app/posts/page.tsx
import { serverClient } from "../_trpc/server";
import { PostList } from "./PostList";

export default async function PostsPage() {
  // サーバーで初期データを取得
  const initialPosts = await serverClient.post.list.query();

  return (
    <div>
      <h1>Posts</h1>
      {/* Client Component に初期データを渡す */}
      <PostList initialData={initialPosts} />
    </div>
  );
}

// app/posts/PostList.tsx
"use client";

import { trpc } from "../_trpc/client";
import type { Post } from "@/server/types";

interface PostListProps {
  initialData: Post[];
}

export function PostList({ initialData }: PostListProps) {
  // クライアントでデータを管理（リアルタイム更新用）
  const { data: posts } = trpc.post.list.useQuery(undefined, {
    initialData,
    refetchInterval: 30000, // 30秒ごとに更新
  });

  return (
    <ul>
      {posts?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## Server Actions との統合

### Server Actions から tRPC を呼び出す

```typescript
// app/actions.ts
"use server";

import { serverClient } from "./_trpc/server";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // tRPC を使ってデータを作成
  await serverClient.post.create.mutate({ title, content });

  // キャッシュを再検証
  revalidatePath("/posts");
}

export async function deletePost(id: string) {
  await serverClient.post.delete.mutate({ id });
  revalidatePath("/posts");
}
```

### フォームでの使用

```typescript
// app/posts/CreatePostForm.tsx
"use client";

import { useFormStatus } from "react-dom";
import { createPost } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create Post"}
    </button>
  );
}

export function CreatePostForm() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <SubmitButton />
    </form>
  );
}
```

## ストリーミングとサスペンス

### Suspense での使用

```typescript
// app/dashboard/page.tsx
import { Suspense } from "react";
import { UserStats } from "./UserStats";
import { RecentPosts } from "./RecentPosts";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <Suspense fallback={<div>Loading stats...</div>}>
        <UserStats />
      </Suspense>

      <Suspense fallback={<div>Loading posts...</div>}>
        <RecentPosts />
      </Suspense>
    </div>
  );
}

// app/dashboard/UserStats.tsx
import { serverClient } from "../_trpc/server";

export async function UserStats() {
  const stats = await serverClient.stats.getUserStats.query();

  return (
    <div>
      <p>Total Users: {stats.totalUsers}</p>
      <p>Active Users: {stats.activeUsers}</p>
    </div>
  );
}

// app/dashboard/RecentPosts.tsx
import { serverClient } from "../_trpc/server";

export async function RecentPosts() {
  const posts = await serverClient.post.recent.query({ limit: 5 });

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## キャッシュと再検証

### 静的生成との組み合わせ

```typescript
// app/blog/[slug]/page.tsx
import { serverClient } from "../../_trpc/server";

interface Props {
  params: { slug: string };
}

// ISR: 60秒ごとに再検証
export const revalidate = 60;

export default async function BlogPost({ params }: Props) {
  const post = await serverClient.blog.getBySlug.query({ slug: params.slug });

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

### オンデマンド再検証

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { path, tag, secret } = await req.json();

  // シークレットを検証
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (path) {
    revalidatePath(path);
  }

  if (tag) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: true });
}
```

## まとめ

- App Router では fetch adapter を使用
- Server Components で直接 tRPC を呼び出せる
- Client Components は通常の React Query パターンを使用
- 初期データをサーバーで取得しクライアントに渡すパターン
- Server Actions と組み合わせて使用可能
- Suspense でストリーミングレンダリングを活用

## 確認問題

1. Server Components と Client Components での tRPC の使い方の違いを説明してください
2. Server Actions から tRPC を呼び出す利点は何ですか？
3. 初期データをサーバーで取得するパターンの利点を説明してください
4. キャッシュ再検証の方法を2つ説明してください

## 次の章へ

[11 - NextJS-Pages-Router](./11-NextJS-Pages-Router.md) では、Pages Router での tRPC 統合について学びます。
