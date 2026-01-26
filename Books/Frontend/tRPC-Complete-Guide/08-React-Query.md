# 08 - React Query 統合

## この章で学ぶこと

- tRPC と React Query の関係性
- React Query のキャッシュ戦略
- 高度なクエリパターン
- Infinite Query と Pagination

## tRPC と React Query

tRPC の React クライアントは内部で React Query（TanStack Query）を使用しています。React Query の知識を活かして、より高度なデータ取得パターンを実装できます。

## クエリオプションの活用

### staleTime と cacheTime

```typescript
// グローバル設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間はstaleにならない
      cacheTime: 1000 * 60 * 30, // 30分間キャッシュを保持
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

// 個別のクエリで上書き
const { data } = trpc.user.list.useQuery(undefined, {
  staleTime: 1000 * 60, // 1分
  cacheTime: 1000 * 60 * 10, // 10分
});
```

### refetch 戦略

```typescript
const { data, refetch } = trpc.post.list.useQuery(undefined, {
  refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得
  refetchOnReconnect: true, // ネットワーク再接続時に再取得
  refetchInterval: 30000, // 30秒ごとに自動再取得
  refetchIntervalInBackground: false, // バックグラウンドでは再取得しない
});

// 手動で再取得
const handleRefresh = () => {
  refetch();
};
```

## 複数クエリの並列実行

### useQueries の代替

```typescript
// tRPC では複数のクエリを個別に呼び出す
export function Dashboard() {
  const users = trpc.user.list.useQuery();
  const posts = trpc.post.list.useQuery();
  const stats = trpc.stats.getSummary.useQuery();

  const isLoading = users.isLoading || posts.isLoading || stats.isLoading;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <UserList users={users.data} />
      <PostList posts={posts.data} />
      <Stats stats={stats.data} />
    </div>
  );
}
```

### Suspense モードでの並列実行

```typescript
// React Suspense を使用
export function DashboardWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  // Suspense モードではデータは常に存在する
  const [users] = trpc.user.list.useSuspenseQuery();
  const [posts] = trpc.post.list.useSuspenseQuery();

  return (
    <div>
      <UserList users={users} />
      <PostList posts={posts} />
    </div>
  );
}
```

## 依存クエリ

### enabled オプションの活用

```typescript
export function UserPosts({ userId }: { userId: string | null }) {
  // ユーザー情報を取得
  const { data: user } = trpc.user.getById.useQuery(
    { id: userId! },
    { enabled: !!userId }
  );

  // ユーザーの投稿を取得（ユーザーが存在する場合のみ）
  const { data: posts } = trpc.post.getByUserId.useQuery(
    { userId: user?.id! },
    { enabled: !!user?.id }
  );

  if (!userId) return <div>Select a user</div>;
  if (!user) return <div>Loading user...</div>;
  if (!posts) return <div>Loading posts...</div>;

  return (
    <div>
      <h2>{user.name}'s Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Infinite Query（無限スクロール）

### サーバー側の実装

```typescript
// server/routers/post.ts
export const postRouter = router({
  infiniteList: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor } = input;

      const posts = await ctx.db.post.findMany({
        take: limit + 1, // 次のページがあるか確認用に1つ多く取得
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: posts,
        nextCursor,
      };
    }),
});
```

### クライアント側の実装

```typescript
// components/InfinitePostList.tsx
"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { trpc } from "../utils/trpc";

export function InfinitePostList() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = trpc.post.infiniteList.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // 要素が表示されたら次のページを取得
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.pages.map((page, pageIndex) => (
        <div key={pageIndex}>
          {page.items.map((post) => (
            <article key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </article>
          ))}
        </div>
      ))}

      {/* 監視対象の要素 */}
      <div ref={ref}>
        {isFetchingNextPage ? (
          <div>Loading more...</div>
        ) : hasNextPage ? (
          <div>Scroll for more</div>
        ) : (
          <div>No more posts</div>
        )}
      </div>
    </div>
  );
}
```

## ページネーション

### オフセットベースのページネーション

```typescript
// server/routers/post.ts
export const postRouter = router({
  paginatedList: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, perPage } = input;
      const skip = (page - 1) * perPage;

      const [posts, total] = await Promise.all([
        ctx.db.post.findMany({
          skip,
          take: perPage,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.post.count(),
      ]);

      return {
        items: posts,
        pagination: {
          page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
      };
    }),
});

// components/PaginatedPostList.tsx
"use client";

import { useState } from "react";
import { trpc } from "../utils/trpc";

export function PaginatedPostList() {
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data, isLoading } = trpc.post.paginatedList.useQuery(
    { page, perPage },
    { keepPreviousData: true }
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <ul>
        {data?.items.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>

      <div>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>
          Page {data?.pagination.page} of {data?.pagination.totalPages}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page === data?.pagination.totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## プリフェッチ

### ホバー時のプリフェッチ

```typescript
export function PostLink({ postId, title }: { postId: string; title: string }) {
  const utils = trpc.useUtils();

  const handleMouseEnter = () => {
    // ホバー時にプリフェッチ
    utils.post.getById.prefetch({ id: postId });
  };

  return (
    <Link
      href={`/posts/${postId}`}
      onMouseEnter={handleMouseEnter}
    >
      {title}
    </Link>
  );
}
```

### 初期データの設定

```typescript
// ページコンポーネントで初期データを設定
export function PostPage({ initialData }: { initialData: Post }) {
  const { data: post } = trpc.post.getById.useQuery(
    { id: initialData.id },
    {
      initialData, // サーバーから渡された初期データ
      staleTime: 1000 * 60, // 1分間は再取得しない
    }
  );

  return (
    <article>
      <h1>{post?.title}</h1>
      <p>{post?.content}</p>
    </article>
  );
}
```

## Select による変換

```typescript
// 必要なフィールドのみを抽出
const { data: userNames } = trpc.user.list.useQuery(undefined, {
  select: (users) => users.map((u) => u.name),
});

// 特定の条件でフィルタリング
const { data: activeUsers } = trpc.user.list.useQuery(undefined, {
  select: (users) => users.filter((u) => u.isActive),
});

// 集計
const { data: userCount } = trpc.user.list.useQuery(undefined, {
  select: (users) => users.length,
});
```

## まとめ

- tRPC は内部で React Query を使用
- staleTime と cacheTime でキャッシュを制御
- enabled オプションで依存クエリを実装
- useInfiniteQuery で無限スクロールを実装
- プリフェッチでユーザー体験を向上
- select で必要なデータのみを抽出

## 確認問題

1. staleTime と cacheTime の違いを説明してください
2. 無限スクロールの実装に必要なサーバーとクライアントの処理を説明してください
3. 依存クエリを実装する方法を説明してください
4. プリフェッチの利点と実装方法を説明してください

## 次の章へ

[09 - Subscriptions](./09-Subscriptions.md) では、WebSocket を使ったリアルタイム通信について学びます。
