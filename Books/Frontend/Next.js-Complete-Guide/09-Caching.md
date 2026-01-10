# 09 - Caching

## 概要

この章では、Next.js のキャッシング戦略について学びます。Next.js 15 ではキャッシングの動作が大きく変更され、デフォルトでキャッシュが無効になりました。

## Next.js 15 のキャッシング変更

### 重要な変更点

Next.js 15 では以下の変更がありました:

| 項目                | Next.js 14       | Next.js 15     |
| ------------------- | ---------------- | -------------- |
| fetch キャッシュ    | デフォルト有効   | デフォルト無効 |
| Route Handlers      | GET がキャッシュ | キャッシュなし |
| Client Router Cache | 5 分間キャッシュ | 0 秒（無効）   |

```typescript
// Next.js 15 - デフォルトでキャッシュなし
const res = await fetch("https://api.example.com/data");
// cache: 'no-store' と同等

// キャッシュを有効にする場合は明示的に指定
const res = await fetch("https://api.example.com/data", {
  cache: "force-cache",
});
```

## キャッシュの種類

### 1. Request Memoization（リクエストメモ化）

同一レンダリング中の同じリクエストをメモ化:

```typescript
// lib/data.ts
export async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
}

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

**特徴**:

- 同一リクエスト中のみ有効
- 自動的に適用
- React Server Components のレンダリング中のみ

### 2. Data Cache（データキャッシュ）

fetch リクエストの結果をサーバーに保存:

```typescript
// キャッシュを有効化
const res = await fetch("https://api.example.com/posts", {
  cache: "force-cache", // 明示的にキャッシュを有効化
});

// 時間ベースの再検証
const res = await fetch("https://api.example.com/posts", {
  next: { revalidate: 3600 }, // 1時間ごとに再検証
});

// タグベースの再検証
const res = await fetch("https://api.example.com/posts", {
  next: { tags: ["posts"] },
});
```

### 3. Full Route Cache（フルルートキャッシュ）

ビルド時に静的ルートを HTML としてキャッシュ:

```typescript
// 静的ページ（ビルド時にキャッシュ）
// app/about/page.tsx
export default function AboutPage() {
  return <h1>About Us</h1>;
}

// 動的ページ（毎回レンダリング）
// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getRealtimeData();
  return <Dashboard data={data} />;
}
```

### 4. Router Cache（ルーターキャッシュ）

クライアントサイドでのナビゲーションキャッシュ:

```typescript
// Next.js 15 ではデフォルトで無効
// next.config.ts で有効化可能
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // 動的ページを30秒キャッシュ
      static: 180, // 静的ページを180秒キャッシュ
    },
  },
};

export default nextConfig;
```

## fetch のキャッシュオプション

### cache オプション

```typescript
// キャッシュなし（Next.js 15 のデフォルト）
await fetch("https://api.example.com/data", {
  cache: "no-store",
});

// 強制キャッシュ
await fetch("https://api.example.com/data", {
  cache: "force-cache",
});

// デフォルト（ブラウザと同じ動作）
await fetch("https://api.example.com/data", {
  cache: "default",
});
```

### next.revalidate オプション

```typescript
// 時間ベースの再検証（ISR）
await fetch("https://api.example.com/posts", {
  next: { revalidate: 3600 }, // 1時間
});

// 0 = キャッシュなし
await fetch("https://api.example.com/posts", {
  next: { revalidate: 0 },
});

// false = 永久にキャッシュ
await fetch("https://api.example.com/posts", {
  next: { revalidate: false },
});
```

### next.tags オプション

```typescript
// タグ付きキャッシュ
await fetch("https://api.example.com/posts", {
  next: { tags: ["posts"] },
});

await fetch("https://api.example.com/posts/1", {
  next: { tags: ["posts", "post-1"] },
});
```

## 再検証（Revalidation）

### 時間ベースの再検証（Time-based）

```typescript
// ページレベル
// app/posts/page.tsx
export const revalidate = 3600; // 1時間

export default async function PostsPage() {
  const posts = await getPosts();
  return <PostList posts={posts} />;
}

// レイアウトレベル
// app/posts/layout.tsx
export const revalidate = 3600;

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
```

### オンデマンド再検証（On-demand）

#### revalidatePath

```typescript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  // 投稿を作成
  await db.post.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    },
  });

  // パスを再検証
  revalidatePath("/posts");

  // 特定のページタイプを再検証
  revalidatePath("/posts", "page");

  // レイアウトを含めて再検証
  revalidatePath("/posts", "layout");
}
```

#### revalidateTag

```typescript
// lib/data.ts
export async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { tags: ["posts"] },
  });
  return res.json();
}

// app/actions.ts
("use server");

import { revalidateTag } from "next/cache";

export async function createPost(formData: FormData) {
  await db.post.create({
    data: {
      title: formData.get("title") as string,
    },
  });

  // タグを再検証
  revalidateTag("posts");
}
```

### Route Handler での再検証

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { path, tag, secret } = await request.json();

  // 認証チェック
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ message: "Invalid secret" }, { status: 401 });
  }

  if (path) {
    revalidatePath(path);
    return Response.json({ revalidated: true, path });
  }

  if (tag) {
    revalidateTag(tag);
    return Response.json({ revalidated: true, tag });
  }

  return Response.json({ message: "Missing path or tag" }, { status: 400 });
}
```

## unstable_cache

データベースクエリなど、fetch 以外のデータをキャッシュ:

```typescript
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// キャッシュされたデータベースクエリ
const getCachedPosts = unstable_cache(
  async () => {
    return prisma.post.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
  ["posts"], // キャッシュキー
  {
    revalidate: 3600, // 1時間
    tags: ["posts"], // タグ
  }
);

export default async function PostsPage() {
  const posts = await getCachedPosts();
  return <PostList posts={posts} />;
}
```

### 動的なキャッシュキー

```typescript
const getCachedUser = unstable_cache(
  async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
    });
  },
  ["user"], // ベースキー
  {
    revalidate: 3600,
    tags: ["users"],
  }
);

// 使用時にキーが動的に生成される
const user = await getCachedUser("user-123");
```

## キャッシュの無効化

### 動的関数

以下の関数を使うと自動的にキャッシュが無効化されます:

```typescript
import { cookies, headers } from "next/headers";

export default async function Page() {
  // cookies() を使うと動的になる
  const cookieStore = await cookies();
  const token = cookieStore.get("session");

  // headers() を使うと動的になる
  const headersList = await headers();
  const auth = headersList.get("authorization");

  // ...
}
```

### 動的レンダリングの強制

```typescript
// セグメント設定
export const dynamic = "force-dynamic";
export const revalidate = 0;

// または fetchCache
export const fetchCache = "force-no-store";
```

## キャッシュ戦略のパターン

### パターン 1: 静的サイト

```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  return <article>{post.content}</article>;
}
```

### パターン 2: ISR（Incremental Static Regeneration）

```typescript
// app/products/page.tsx
export const revalidate = 3600; // 1時間ごとに再生成

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductList products={products} />;
}
```

### パターン 3: リアルタイムデータ

```typescript
// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getRealtimeStats();
  return <Dashboard stats={stats} />;
}
```

### パターン 4: ハイブリッド

```typescript
// app/product/[id]/page.tsx
import { Suspense } from "react";

// 商品情報は ISR
async function ProductInfo({ id }: { id: string }) {
  const product = await fetch(`https://api.example.com/products/${id}`, {
    next: { revalidate: 3600 },
  }).then((r) => r.json());

  return <div>{product.name}</div>;
}

// 在庫はリアルタイム
async function Stock({ id }: { id: string }) {
  const stock = await fetch(`https://api.example.com/products/${id}/stock`, {
    cache: "no-store",
  }).then((r) => r.json());

  return <div>Stock: {stock.quantity}</div>;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <ProductInfo id={id} />
      </Suspense>
      <Suspense fallback={<div>Checking stock...</div>}>
        <Stock id={id} />
      </Suspense>
    </div>
  );
}
```

## キャッシュのデバッグ

### ログの有効化

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
```

### キャッシュヘッダーの確認

```typescript
// 開発中にキャッシュ状態を確認
export default async function Page() {
  const res = await fetch("https://api.example.com/data", {
    cache: "force-cache",
  });

  console.log("Cache status:", res.headers.get("x-cache"));
  console.log("Cache control:", res.headers.get("cache-control"));

  // ...
}
```

## まとめ

- **Next.js 15** ではデフォルトでキャッシュが無効
- **force-cache** で明示的にキャッシュを有効化
- **revalidate** で時間ベースの再検証
- **revalidatePath/revalidateTag** でオンデマンド再検証
- **unstable_cache** でデータベースクエリをキャッシュ
- **動的関数** (cookies, headers) を使うと自動的に動的に

## 演習問題

1. ISR を使って 1 時間ごとに再生成されるページを作成してください
2. Server Action で revalidatePath を使ってキャッシュを無効化してください
3. unstable_cache を使ってデータベースクエリをキャッシュしてください
4. ハイブリッドキャッシング（一部静的、一部動的）を実装してください

## 次のステップ

次の章では、ストリーミングと Suspense について学びます。

⬅️ 前へ: [08-Data-Fetching.md](./08-Data-Fetching.md)
➡️ 次へ: [10-Streaming-and-Suspense.md](./10-Streaming-and-Suspense.md)
