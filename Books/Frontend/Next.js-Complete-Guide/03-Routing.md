# 03 - Routing

## 概要

この章では、Next.js App Router のルーティングシステムを詳しく学びます。動的ルート、並列ルート、インターセプトルートなど、高度なルーティングパターンも解説します。

## ファイルベースルーティング

### 基本的なルーティング

フォルダ構造が URL に直接マッピングされます:

```plaintext
app/
├── page.tsx              → /
├── about/
│   └── page.tsx          → /about
├── blog/
│   └── page.tsx          → /blog
└── contact/
    └── page.tsx          → /contact
```

### ネストされたルート

```plaintext
app/
└── blog/
    ├── page.tsx          → /blog
    └── posts/
        ├── page.tsx      → /blog/posts
        └── drafts/
            └── page.tsx  → /blog/posts/drafts
```

## 動的ルート

### 基本的な動的セグメント

`[param]` でパラメータを受け取ります:

```plaintext
app/
└── blog/
    └── [slug]/
        └── page.tsx      → /blog/:slug
```

```typescript
// app/blog/[slug]/page.tsx
interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;

  return (
    <article>
      <h1>Post: {slug}</h1>
    </article>
  );
}
```

### 複数の動的セグメント

```plaintext
app/
└── shop/
    └── [category]/
        └── [product]/
            └── page.tsx  → /shop/:category/:product
```

```typescript
// app/shop/[category]/[product]/page.tsx
interface Props {
  params: Promise<{ category: string; product: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { category, product } = await params;

  return (
    <div>
      <h1>Category: {category}</h1>
      <h2>Product: {product}</h2>
    </div>
  );
}
```

### Catch-all セグメント

`[...param]` で任意の深さのパスをキャッチ:

```plaintext
app/
└── docs/
    └── [...slug]/
        └── page.tsx      → /docs/*
```

```typescript
// app/docs/[...slug]/page.tsx
interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  // /docs/a/b/c → slug = ['a', 'b', 'c']

  return (
    <div>
      <h1>Docs: {slug.join(" / ")}</h1>
    </div>
  );
}
```

### Optional Catch-all セグメント

`[[...param]]` でルート自体もマッチ:

```plaintext
app/
└── docs/
    └── [[...slug]]/
        └── page.tsx      → /docs, /docs/a, /docs/a/b, ...
```

```typescript
// app/docs/[[...slug]]/page.tsx
interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  // /docs → slug = undefined
  // /docs/a/b → slug = ['a', 'b']

  if (!slug) {
    return <h1>Docs Home</h1>;
  }

  return <h1>Docs: {slug.join(" / ")}</h1>;
}
```

## ナビゲーション

### Link コンポーネント

クライアントサイドナビゲーション用:

```typescript
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog">Blog</Link>

      {/* 動的ルート */}
      <Link href="/blog/hello-world">Hello World</Link>

      {/* オブジェクト形式 */}
      <Link
        href={{
          pathname: "/blog/[slug]",
          query: { slug: "hello-world" },
        }}
      >
        Hello World
      </Link>
    </nav>
  );
}
```

### Link の Props

```typescript
<Link
  href="/about"
  replace // 履歴を置き換え（戻るボタンで前のページに戻らない）
  scroll={false} // スクロール位置を維持
  prefetch={false} // プリフェッチを無効化
>
  About
</Link>
```

### プリフェッチ

Link は自動的にプリフェッチします:

- **静的ルート**: ビューポートに入ると全体をプリフェッチ
- **動的ルート**: `loading.tsx` までプリフェッチ

```typescript
// プリフェッチを無効化（大量のリンクがある場合）
<Link href="/heavy-page" prefetch={false}>
  Heavy Page
</Link>
```

### useRouter フック

プログラムによるナビゲーション:

```typescript
"use client";

import { useRouter } from "next/navigation";

export default function LoginButton() {
  const router = useRouter();

  const handleLogin = async () => {
    // ログイン処理
    await login();

    // プログラムでナビゲート
    router.push("/dashboard");
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

### useRouter のメソッド

```typescript
"use client";

import { useRouter } from "next/navigation";

export default function NavigationExample() {
  const router = useRouter();

  return (
    <div>
      {/* 指定ページへ移動 */}
      <button onClick={() => router.push("/about")}>Go to About</button>

      {/* 履歴を置き換えて移動 */}
      <button onClick={() => router.replace("/login")}>Replace to Login</button>

      {/* 戻る */}
      <button onClick={() => router.back()}>Go Back</button>

      {/* 進む */}
      <button onClick={() => router.forward()}>Go Forward</button>

      {/* ページをリフレッシュ */}
      <button onClick={() => router.refresh()}>Refresh</button>
    </div>
  );
}
```

### redirect 関数

Server Component でのリダイレクト:

```typescript
import { redirect } from "next/navigation";

async function getUser() {
  const user = await fetchUser();
  if (!user) {
    redirect("/login"); // Server Side Redirect
  }
  return user;
}

export default async function DashboardPage() {
  const user = await getUser();
  return <div>Welcome, {user.name}</div>;
}
```

### permanentRedirect 関数

恒久的なリダイレクト（308）:

```typescript
import { permanentRedirect } from "next/navigation";

export default async function OldPage() {
  permanentRedirect("/new-page");
}
```

## usePathname と useSearchParams

### usePathname

現在のパスを取得:

```typescript
"use client";

import { usePathname } from "next/navigation";

export default function ActiveLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <a
      href={href}
      className={isActive ? "text-blue-500 font-bold" : "text-gray-500"}
    >
      {children}
    </a>
  );
}
```

### useSearchParams

クエリパラメータを取得:

```typescript
"use client";

import { useSearchParams } from "next/navigation";

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const page = searchParams.get("page") || "1";

  return (
    <div>
      <p>Search: {query}</p>
      <p>Page: {page}</p>
    </div>
  );
}
```

### クエリパラメータの更新

```typescript
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export default function Pagination() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div>
      <button
        onClick={() => {
          router.push(pathname + "?" + createQueryString("page", "2"));
        }}
      >
        Page 2
      </button>
    </div>
  );
}
```

## 並列ルート

### 基本的な並列ルート

`@folder` で並列ルートを定義:

```plaintext
app/
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    ├── @analytics/
    │   └── page.tsx
    └── @team/
        └── page.tsx
```

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div>
      <main>{children}</main>
      <aside>
        <div>{analytics}</div>
        <div>{team}</div>
      </aside>
    </div>
  );
}
```

### 条件付きルート

認証状態に応じて異なるコンテンツ:

```typescript
// app/dashboard/layout.tsx
import { getUser } from "@/lib/auth";

export default async function Layout({
  children,
  user,
  guest,
}: {
  children: React.ReactNode;
  user: React.ReactNode;
  guest: React.ReactNode;
}) {
  const currentUser = await getUser();

  return (
    <div>
      {currentUser ? user : guest}
      {children}
    </div>
  );
}
```

### default.tsx

並列ルートにマッチしない場合のフォールバック:

```typescript
// app/dashboard/@analytics/default.tsx
export default function DefaultAnalytics() {
  return <div>Analytics not available</div>;
}
```

## インターセプトルート

### モーダルパターン

`(.)`, `(..)`, `(...)` でルートをインターセプト:

```plaintext
app/
├── photo/
│   └── [id]/
│       └── page.tsx         # 直接アクセス: /photo/123
├── @modal/
│   └── (.)photo/
│       └── [id]/
│           └── page.tsx     # インターセプト: モーダルで表示
└── layout.tsx
```

### インターセプトの記法

| 記法       | 説明           |
| ---------- | -------------- |
| `(.)`      | 同じレベル     |
| `(..)`     | 1 つ上のレベル |
| `(..)(..)` | 2 つ上のレベル |
| `(...)`    | app ルートから |

### モーダル実装例

```typescript
// app/@modal/(.)photo/[id]/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function PhotoModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-4 rounded">
        <button onClick={() => router.back()}>Close</button>
        {/* Photo content */}
      </div>
    </div>
  );
}
```

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
```

## Route Groups

### 基本的なグループ化

`()` で URL に影響せずに整理:

```plaintext
app/
├── (marketing)/
│   ├── about/page.tsx      # /about
│   └── pricing/page.tsx    # /pricing
├── (shop)/
│   ├── products/page.tsx   # /products
│   └── cart/page.tsx       # /cart
└── page.tsx                # /
```

### グループごとのレイアウト

```plaintext
app/
├── (marketing)/
│   ├── layout.tsx          # マーケティング用レイアウト
│   ├── about/page.tsx
│   └── contact/page.tsx
├── (app)/
│   ├── layout.tsx          # アプリ用レイアウト
│   ├── dashboard/page.tsx
│   └── settings/page.tsx
└── layout.tsx              # ルートレイアウト
```

### 複数のルートレイアウト

```plaintext
app/
├── (marketing)/
│   ├── layout.tsx          # html, body を含む
│   └── ...
├── (app)/
│   ├── layout.tsx          # html, body を含む
│   └── ...
└── page.tsx                # ルートレイアウトなし
```

## 静的・動的レンダリング

### 静的ルート（デフォルト）

ビルド時に生成:

```typescript
// app/about/page.tsx
export default function AboutPage() {
  return <h1>About Us</h1>;
}
```

### generateStaticParams

動的ルートを静的に生成:

```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
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

### 動的ルート

リクエスト時に生成:

```typescript
// app/api/user/route.ts
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json(user);
}
```

### revalidate

定期的に再生成:

```typescript
// app/blog/page.tsx
export const revalidate = 3600; // 1時間ごとに再生成

export default async function BlogPage() {
  const posts = await getPosts();
  return <PostList posts={posts} />;
}
```

## まとめ

- **ファイルベースルーティング**: フォルダ構造が URL に対応
- **動的ルート**: `[param]`, `[...param]`, `[[...param]]`
- **Link コンポーネント**: クライアントサイドナビゲーション
- **useRouter**: プログラムによるナビゲーション
- **並列ルート**: `@folder` で複数のページを同時表示
- **インターセプトルート**: モーダルパターン
- **Route Groups**: URL に影響せず整理
- **静的/動的レンダリング**: `generateStaticParams`, `revalidate`

## 演習問題

1. ブログの動的ルート `/blog/[slug]` を作成してください
2. ナビゲーションバーで現在のページをハイライトしてください
3. 検索機能で `useSearchParams` を使ってください
4. モーダルパターンを実装してください

## 次のステップ

次の章では、レイアウトとテンプレートについてさらに詳しく学びます。

⬅️ 前へ: [02-App-Router-Basics.md](./02-App-Router-Basics.md)
➡️ 次へ: [04-Layouts-and-Templates.md](./04-Layouts-and-Templates.md)
