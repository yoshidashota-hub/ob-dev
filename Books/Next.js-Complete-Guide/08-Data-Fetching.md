# 08 - Data Fetching

## 概要

この章では、Next.js App Router でのデータフェッチングについて学びます。Server Components での直接フェッチ、並列・順次フェッチ、データベースアクセスなど、様々なパターンを解説します。

## Server Components でのデータフェッチ

### 基本的なフェッチ

Server Components では `async/await` を使って直接データをフェッチできます:

```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch("https://api.example.com/posts");

  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }

  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <ul>
      {posts.map((post: { id: string; title: string }) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### 動的ルートでのフェッチ

```typescript
// app/posts/[id]/page.tsx
interface Props {
  params: Promise<{ id: string }>;
}

async function getPost(id: string) {
  const res = await fetch(`https://api.example.com/posts/${id}`);

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

## fetch オプション

### キャッシュ設定

```typescript
// 静的データ（デフォルト）- ビルド時にキャッシュ
const res = await fetch("https://api.example.com/data", {
  cache: "force-cache",
});

// 動的データ - 毎回フェッチ
const res = await fetch("https://api.example.com/data", {
  cache: "no-store",
});

// 時間ベースの再検証
const res = await fetch("https://api.example.com/data", {
  next: { revalidate: 3600 }, // 1時間ごとに再検証
});

// タグベースの再検証
const res = await fetch("https://api.example.com/data", {
  next: { tags: ["posts"] },
});
```

### リクエストオプション

```typescript
// POST リクエスト
const res = await fetch("https://api.example.com/posts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: "New Post",
    content: "Content here",
  }),
});

// カスタムヘッダー
const res = await fetch("https://api.example.com/data", {
  headers: {
    "X-Custom-Header": "value",
  },
});
```

## 並列データフェッチ

### Promise.all

複数のリクエストを並列で実行:

```typescript
// app/dashboard/page.tsx
async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}

async function getPosts(userId: string) {
  const res = await fetch(`https://api.example.com/users/${userId}/posts`);
  return res.json();
}

async function getNotifications(userId: string) {
  const res = await fetch(
    `https://api.example.com/users/${userId}/notifications`
  );
  return res.json();
}

export default async function DashboardPage() {
  const userId = "1";

  // 並列実行 - 最も効率的
  const [user, posts, notifications] = await Promise.all([
    getUser(userId),
    getPosts(userId),
    getNotifications(userId),
  ]);

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <section>
        <h2>Your Posts ({posts.length})</h2>
        {/* ... */}
      </section>
      <section>
        <h2>Notifications ({notifications.length})</h2>
        {/* ... */}
      </section>
    </div>
  );
}
```

### 並列 vs 順次

```typescript
// ❌ 順次（遅い）- 各リクエストが前のリクエストを待つ
async function SequentialFetch() {
  const user = await getUser("1"); // 200ms
  const posts = await getPosts("1"); // 300ms
  const comments = await getComments("1"); // 250ms
  // 合計: 750ms
}

// ✅ 並列（速い）- すべて同時に開始
async function ParallelFetch() {
  const [user, posts, comments] = await Promise.all([
    getUser("1"), // 200ms
    getPosts("1"), // 300ms
    getComments("1"), // 250ms
  ]);
  // 合計: 300ms（最も遅いリクエストの時間）
}
```

## 順次データフェッチ

依存関係がある場合は順次フェッチ:

```typescript
// app/posts/[id]/page.tsx
export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 投稿を取得
  const post = await getPost(id);

  // 投稿の作者を取得（post.authorId に依存）
  const author = await getUser(post.authorId);

  // 作者の他の投稿を取得
  const otherPosts = await getPostsByUser(author.id);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {author.name}</p>
      <div>{post.content}</div>
      <aside>
        <h3>Other posts by {author.name}</h3>
        {/* ... */}
      </aside>
    </article>
  );
}
```

## コンポーネントレベルのフェッチ

### 各コンポーネントでフェッチ

```typescript
// components/UserProfile.tsx
async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}

export async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);

  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
    </div>
  );
}
```

```typescript
// components/UserPosts.tsx
async function getPosts(userId: string) {
  const res = await fetch(`https://api.example.com/users/${userId}/posts`);
  return res.json();
}

export async function UserPosts({ userId }: { userId: string }) {
  const posts = await getPosts(userId);

  return (
    <ul>
      {posts.map((post: { id: string; title: string }) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

```typescript
// app/users/[id]/page.tsx
import { Suspense } from "react";
import { UserProfile } from "@/components/UserProfile";
import { UserPosts } from "@/components/UserPosts";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <Suspense fallback={<div>Loading profile...</div>}>
        <UserProfile userId={id} />
      </Suspense>
      <Suspense fallback={<div>Loading posts...</div>}>
        <UserPosts userId={id} />
      </Suspense>
    </div>
  );
}
```

## データベースアクセス

### Prisma

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

```typescript
// app/users/page.tsx
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.name} ({user.email})
        </li>
      ))}
    </ul>
  );
}
```

### Drizzle

```typescript
// lib/db.ts
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

export const db = drizzle(sql, { schema });
```

```typescript
// app/posts/page.tsx
import { db } from "@/lib/db";
import { posts } from "@/lib/schema";

export default async function PostsPage() {
  const allPosts = await db.select().from(posts).orderBy(posts.createdAt);

  return (
    <ul>
      {allPosts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## リクエストのメモ化

### 自動メモ化

同じリクエストは自動的にメモ化されます:

```typescript
// lib/data.ts
export async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}

// 複数のコンポーネントで同じ関数を呼んでも1回だけフェッチ
// components/Header.tsx
export async function Header() {
  const user = await getUser("1"); // フェッチ
  return <header>{user.name}</header>;
}

// components/Sidebar.tsx
export async function Sidebar() {
  const user = await getUser("1"); // メモ化されたデータを使用
  return <aside>{user.email}</aside>;
}
```

### cache() による手動メモ化

```typescript
import { cache } from "react";

// cache() でラップ
export const getUser = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
});

// データベースクエリもメモ化
export const getPost = cache(async (id: string) => {
  return prisma.post.findUnique({
    where: { id },
    include: { author: true },
  });
});
```

## エラーハンドリング

### try-catch

```typescript
export default async function PostsPage() {
  try {
    const posts = await getPosts();
    return <PostList posts={posts} />;
  } catch (error) {
    return <div>Failed to load posts</div>;
  }
}
```

### notFound()

```typescript
import { notFound } from "next/navigation";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return <article>{post.content}</article>;
}
```

### error.tsx

```typescript
// app/posts/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## 外部サービスとの連携

### ヘッダーの転送

```typescript
import { headers } from "next/headers";

export default async function Page() {
  const headersList = await headers();
  const authorization = headersList.get("authorization");

  const res = await fetch("https://api.example.com/protected", {
    headers: {
      Authorization: authorization || "",
    },
  });

  // ...
}
```

### Cookie の使用

```typescript
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  const res = await fetch("https://api.example.com/user", {
    headers: {
      Cookie: `session=${token}`,
    },
  });

  // ...
}
```

## 環境変数

```typescript
// .env.local
API_URL=https://api.example.com
API_KEY=your-secret-key
```

```typescript
// app/page.tsx
export default async function Page() {
  const res = await fetch(`${process.env.API_URL}/data`, {
    headers: {
      "X-API-Key": process.env.API_KEY || "",
    },
  });

  // ...
}
```

## ベストプラクティス

### 1. データ関数を分離

```typescript
// lib/data/posts.ts
export async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function getPost(id: string) {
  const res = await fetch(`https://api.example.com/posts/${id}`);
  if (!res.ok) return null;
  return res.json();
}
```

### 2. 型定義

```typescript
// types/post.ts
export interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
}

// lib/data/posts.ts
import type { Post } from "@/types/post";

export async function getPosts(): Promise<Post[]> {
  const res = await fetch("https://api.example.com/posts");
  return res.json();
}
```

### 3. エラーハンドリングの共通化

```typescript
// lib/fetch.ts
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      return { data: null, error: `HTTP error: ${res.status}` };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

## まとめ

- **Server Components** で直接 `async/await` でフェッチ
- **並列フェッチ** は `Promise.all` で効率化
- **依存関係** がある場合のみ順次フェッチ
- **コンポーネントレベル** でフェッチして Suspense で包む
- **自動メモ化** で同じリクエストは 1 回だけ
- **cache()** で手動メモ化も可能
- **データベース** に直接アクセス可能

## 演習問題

1. 外部 API からデータをフェッチして表示してください
2. `Promise.all` を使って複数のデータを並列フェッチしてください
3. Prisma を使ってデータベースからデータを取得してください
4. `cache()` を使ってメモ化を実装してください

## 次のステップ

次の章では、キャッシング戦略について詳しく学びます。

⬅️ 前へ: [07-Composition-Patterns.md](./07-Composition-Patterns.md)
➡️ 次へ: [09-Caching.md](./09-Caching.md)
