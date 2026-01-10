# 05 - Server Components

## 概要

この章では、React Server Components（RSC）について詳しく学びます。Server Components は Next.js App Router の中核となる概念で、サーバーでのみレンダリングされるコンポーネントです。

## Server Components とは

### 定義

Server Components はサーバーでレンダリングされ、クライアントに HTML として送信されるコンポーネントです。JavaScript バンドルには含まれません。

```typescript
// app/page.tsx - これは Server Component
export default async function HomePage() {
  // サーバーでのみ実行される
  const data = await fetch("https://api.example.com/data");
  const json = await data.json();

  return (
    <main>
      <h1>{json.title}</h1>
    </main>
  );
}
```

### Server Components の特徴

| 特徴                     | 説明                                    |
| ------------------------ | --------------------------------------- |
| デフォルト               | App Router ではすべてのコンポーネントがデフォルトで SC |
| async/await              | コンポーネント内で直接データフェッチ可能 |
| バンドルサイズ           | クライアントに JavaScript を送信しない  |
| サーバーリソース         | DB、ファイルシステムに直接アクセス可能   |
| セキュリティ             | 機密情報がクライアントに漏れない        |

### Client Components との違い

```typescript
// Server Component（デフォルト）
// - サーバーでレンダリング
// - async/await が使える
// - useState, useEffect は使えない
export default async function ServerComponent() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Client Component
// - クライアントでレンダリング
// - useState, useEffect が使える
// - async/await は使えない（コンポーネント自体では）
"use client";
import { useState } from "react";

export default function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

## Server Components のメリット

### 1. パフォーマンス

#### バンドルサイズの削減

```typescript
// Server Component - クライアントバンドルに含まれない
import { marked } from "marked"; // 大きなライブラリ
import hljs from "highlight.js";

export default async function BlogPost({ slug }: { slug: string }) {
  const post = await getPost(slug);
  const html = marked(post.content, {
    highlight: (code, lang) => hljs.highlight(lang, code).value,
  });

  return <article dangerouslySetInnerHTML={{ __html: html }} />;
}
```

#### 初期ロードの高速化

```typescript
// 重い処理もサーバーで実行
import { analyzeData } from "@/lib/analytics"; // 重いライブラリ

export default async function AnalyticsPage() {
  const data = await fetchAnalytics();
  const insights = analyzeData(data); // サーバーで実行

  return (
    <div>
      {insights.map((insight) => (
        <div key={insight.id}>{insight.summary}</div>
      ))}
    </div>
  );
}
```

### 2. セキュリティ

```typescript
// 機密情報はサーバーに留まる
import { db } from "@/lib/db";

export default async function SecurePage() {
  // データベースに直接アクセス
  const users = await db.user.findMany({
    where: { role: "admin" },
  });

  // 機密情報を除外してからレンダリング
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
        // user.password はクライアントに送信されない
      ))}
    </ul>
  );
}
```

### 3. データフェッチングの簡素化

```typescript
// コンポーネント内で直接フェッチ
export default async function ProductList() {
  const products = await fetch("https://api.example.com/products").then((r) =>
    r.json()
  );

  return (
    <ul>
      {products.map((product: { id: string; name: string; price: number }) => (
        <li key={product.id}>
          {product.name} - ${product.price}
        </li>
      ))}
    </ul>
  );
}
```

## データフェッチング

### 基本的なデータフェッチ

```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    cache: "force-cache", // デフォルト: 静的データ
  });

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

### キャッシュオプション

```typescript
// 静的データ（デフォルト）- ビルド時にキャッシュ
await fetch("https://api.example.com/posts", {
  cache: "force-cache",
});

// 動的データ - 毎回フェッチ
await fetch("https://api.example.com/posts", {
  cache: "no-store",
});

// 再検証 - 一定時間ごとに再フェッチ
await fetch("https://api.example.com/posts", {
  next: { revalidate: 3600 }, // 1時間
});

// タグベースの再検証
await fetch("https://api.example.com/posts", {
  next: { tags: ["posts"] },
});
```

### データベース直接アクセス

```typescript
// Prisma を使用
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 並列データフェッチ

```typescript
// 並列でフェッチ（高速）
async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}

async function getPosts(userId: string) {
  const res = await fetch(`https://api.example.com/users/${userId}/posts`);
  return res.json();
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 並列実行
  const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);

  return (
    <div>
      <h1>{user.name}</h1>
      <ul>
        {posts.map((post: { id: string; title: string }) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 順次データフェッチ

```typescript
// 依存関係がある場合は順次フェッチ
export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 最初にチームを取得
  const team = await getTeam(id);

  // チームのメンバーを取得（team.id に依存）
  const members = await getMembers(team.id);

  return (
    <div>
      <h1>{team.name}</h1>
      <ul>
        {members.map((member: { id: string; name: string }) => (
          <li key={member.id}>{member.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## エラーハンドリング

### try-catch

```typescript
export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const post = await getPost(id);
    return <article>{post.content}</article>;
  } catch (error) {
    return <div>Failed to load post</div>;
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
    notFound(); // app/not-found.tsx を表示
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

## Server Components のパターン

### コンポーネントごとのデータフェッチ

```typescript
// components/UserCard.tsx
async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}

export async function UserCard({ userId }: { userId: string }) {
  const user = await getUser(userId);

  return (
    <div className="p-4 border rounded">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

```typescript
// app/page.tsx
import { UserCard } from "@/components/UserCard";

export default function HomePage() {
  return (
    <div>
      <h1>Users</h1>
      <UserCard userId="1" />
      <UserCard userId="2" />
      <UserCard userId="3" />
    </div>
  );
}
```

### リクエストのメモ化

同じリクエストは自動的にメモ化されます:

```typescript
// lib/data.ts
export async function getUser(id: string) {
  // 同じリクエストは1回だけ実行される
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}
```

```typescript
// 複数のコンポーネントで同じ関数を呼んでも1回だけフェッチ
// components/Header.tsx
import { getUser } from "@/lib/data";

export async function Header({ userId }: { userId: string }) {
  const user = await getUser(userId); // フェッチ
  return <header>Welcome, {user.name}</header>;
}

// components/Sidebar.tsx
import { getUser } from "@/lib/data";

export async function Sidebar({ userId }: { userId: string }) {
  const user = await getUser(userId); // メモ化されたデータを使用
  return <aside>{user.email}</aside>;
}
```

### cache() を使ったメモ化

```typescript
import { cache } from "react";

// 手動でメモ化
export const getUser = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
});
```

## 制限事項

### 使えない機能

Server Components では以下が使えません:

```typescript
// ❌ useState - 状態管理
import { useState } from "react";

// ❌ useEffect - 副作用
import { useEffect } from "react";

// ❌ useRef - DOM 参照
import { useRef } from "react";

// ❌ useContext - コンテキスト
import { useContext } from "react";

// ❌ イベントハンドラ
<button onClick={() => {}}>Click</button>

// ❌ ブラウザ API
window.localStorage.getItem("key");
```

### 解決策

インタラクティブな機能が必要な場合は Client Component を使用:

```typescript
// components/Counter.tsx
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

```typescript
// app/page.tsx - Server Component
import { Counter } from "@/components/Counter";

export default async function HomePage() {
  const data = await fetchData();

  return (
    <div>
      <h1>{data.title}</h1>
      <Counter /> {/* Client Component を埋め込む */}
    </div>
  );
}
```

## 実践例

### ブログ記事ページ

```typescript
// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import { marked } from "marked";
import { getPost, getRelatedPosts } from "@/lib/posts";
import { CommentSection } from "@/components/CommentSection";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [post, relatedPosts] = await Promise.all([
    getPost(slug),
    getRelatedPosts(slug),
  ]);

  if (!post) {
    notFound();
  }

  const html = marked(post.content);

  return (
    <article className="max-w-3xl mx-auto py-8">
      <header>
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <time className="text-gray-500">{post.publishedAt}</time>
      </header>

      <div
        className="prose prose-lg mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <aside className="mt-12">
        <h2 className="text-2xl font-bold">Related Posts</h2>
        <ul className="mt-4 space-y-2">
          {relatedPosts.map((related) => (
            <li key={related.slug}>
              <a href={`/blog/${related.slug}`}>{related.title}</a>
            </li>
          ))}
        </ul>
      </aside>

      {/* Client Component for interactivity */}
      <CommentSection postId={post.id} />
    </article>
  );
}
```

### ダッシュボード

```typescript
// app/dashboard/page.tsx
import { getStats, getRecentActivity, getNotifications } from "@/lib/dashboard";
import { StatsCard } from "@/components/StatsCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { NotificationBell } from "@/components/NotificationBell";

export default async function DashboardPage() {
  // 並列データフェッチ
  const [stats, activity, notifications] = await Promise.all([
    getStats(),
    getRecentActivity(),
    getNotifications(),
  ]);

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <NotificationBell initialCount={notifications.unread} />
      </header>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <ActivityFeed activities={activity} />
      </section>
    </div>
  );
}
```

## まとめ

- **Server Components** はサーバーでのみレンダリング
- **デフォルト**で App Router のすべてのコンポーネントは SC
- **async/await** でデータフェッチが可能
- **バンドルサイズ削減**と**セキュリティ向上**
- **useState/useEffect** は使えない（Client Component を使用）
- **fetch** は自動的にメモ化・キャッシュ

## 演習問題

1. API からデータをフェッチする Server Component を作成してください
2. 並列データフェッチを実装してください
3. `notFound()` を使ったエラーハンドリングを実装してください
4. Server Component と Client Component を組み合わせてください

## 次のステップ

次の章では、Client Components について詳しく学びます。

⬅️ 前へ: [04-Layouts-and-Templates.md](./04-Layouts-and-Templates.md)
➡️ 次へ: [06-Client-Components.md](./06-Client-Components.md)
