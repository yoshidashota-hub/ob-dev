# 02 - App Router Basics

## 概要

この章では、Next.js の App Router の基本概念とファイル規約について学びます。App Router は Next.js 13 で導入された新しいルーティングシステムで、React Server Components をベースにしています。

## App Router とは

### Pages Router との違い

Next.js には 2 つのルーティングシステムがあります:

| 特徴               | Pages Router（旧）    | App Router（新）       |
| ------------------ | --------------------- | ---------------------- |
| ディレクトリ       | `pages/`              | `app/`                 |
| コンポーネント     | Client Components     | Server Components      |
| データフェッチ     | getServerSideProps 等 | async/await で直接     |
| レイアウト         | \_app.tsx             | layout.tsx（ネスト可） |
| ローディング UI    | 手動実装              | loading.tsx            |
| エラーハンドリング | \_error.tsx           | error.tsx（ネスト可）  |

### App Router の特徴

1. **Server Components がデフォルト**: サーバーでレンダリング
2. **ネストされたレイアウト**: 部分的なレンダリングが可能
3. **コロケーション**: 関連ファイルを同じフォルダに配置
4. **React 19 対応**: 最新の React 機能を活用

## ファイル規約

App Router では、特定のファイル名に特別な意味があります。

### 基本的なファイル規約

```
app/
├── layout.tsx      # レイアウト（必須）
├── page.tsx        # ページ（ルートに対応）
├── loading.tsx     # ローディング UI
├── error.tsx       # エラーハンドリング
├── not-found.tsx   # 404 ページ
├── template.tsx    # テンプレート
├── default.tsx     # 並列ルートのデフォルト
├── route.ts        # API ルート
└── global-error.tsx # グローバルエラー
```

### ファイルの役割

| ファイル        | 役割                                    |
| --------------- | --------------------------------------- |
| `layout.tsx`    | 複数ページで共有される UI               |
| `page.tsx`      | ルートの UI（これがないとアクセス不可） |
| `loading.tsx`   | ローディング中の UI（Suspense）         |
| `error.tsx`     | エラー時の UI（Error Boundary）         |
| `not-found.tsx` | 404 エラー時の UI                       |
| `template.tsx`  | 再レンダリングされるレイアウト          |
| `route.ts`      | API エンドポイント                      |

## page.tsx

### 基本的なページ

`page.tsx` はルートを公開するために**必須**のファイルです:

```typescript
// app/page.tsx → /
export default function HomePage() {
  return (
    <main>
      <h1>Home Page</h1>
    </main>
  );
}
```

```typescript
// app/about/page.tsx → /about
export default function AboutPage() {
  return (
    <main>
      <h1>About Page</h1>
    </main>
  );
}
```

### Server Component としてのページ

デフォルトで Server Component なので、async/await が使えます:

```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch("https://api.example.com/posts");
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <main>
      <h1>Posts</h1>
      <ul>
        {posts.map((post: { id: string; title: string }) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </main>
  );
}
```

### ページの Props

```typescript
// app/blog/[slug]/page.tsx
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPost({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;

  return (
    <article>
      <h1>Post: {slug}</h1>
      <p>Page: {page}</p>
    </article>
  );
}
```

**Next.js 15 の変更点**: `params` と `searchParams` は Promise になりました。

## layout.tsx

### ルートレイアウト（必須）

`app/layout.tsx` は**必須**で、`<html>` と `<body>` タグを含む必要があります:

```typescript
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "My awesome app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

### ネストされたレイアウト

レイアウトはネストできます:

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <nav className="w-64 bg-gray-100">
        <ul>
          <li>Overview</li>
          <li>Settings</li>
        </ul>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### レイアウトの重要な特徴

1. **状態が保持される**: ナビゲーション時に再レンダリングされない
2. **データの受け渡し不可**: 親から子へ props を渡せない（代わりに fetch）
3. **Server Component**: デフォルトでサーバーサイド

## loading.tsx

### ローディング UI

`loading.tsx` は React Suspense を使った自動ローディング:

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}
```

### 仕組み

Next.js は自動的に以下のような構造を作成します:

```typescript
<Suspense fallback={<Loading />}>
  <Page />
</Suspense>
```

### スケルトン UI の例

```typescript
// app/posts/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
        </div>
      ))}
    </div>
  );
}
```

## error.tsx

### エラーハンドリング

`error.tsx` は React Error Boundary をラップします:

```typescript
"use client"; // Error components must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログを送信
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

**重要**: `error.tsx` は **Client Component** でなければなりません（`"use client"` が必須）。

### global-error.tsx

ルートレイアウトのエラーをキャッチ:

```typescript
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

## not-found.tsx

### 404 ページ

```typescript
// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-gray-600 mt-2">Page not found</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Go Home
      </Link>
    </div>
  );
}
```

### プログラムで 404 を発生させる

```typescript
import { notFound } from "next/navigation";

async function getPost(id: string) {
  const res = await fetch(`https://api.example.com/posts/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound(); // 404 ページを表示
  }

  return <article>{post.title}</article>;
}
```

## template.tsx

### テンプレートとレイアウトの違い

| 特徴           | layout.tsx | template.tsx                 |
| -------------- | ---------- | ---------------------------- |
| 状態の保持     | 保持される | 保持されない                 |
| 再レンダリング | されない   | ナビゲーション時に毎回       |
| useEffect      | 初回のみ   | 毎回実行                     |
| 用途           | 共通 UI    | アニメーション、状態リセット |

### 使用例

```typescript
// app/dashboard/template.tsx
"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

## フォルダ構造のパターン

### コロケーション

関連ファイルを同じフォルダに配置:

```
app/
└── dashboard/
    ├── page.tsx         # メインページ
    ├── layout.tsx       # レイアウト
    ├── loading.tsx      # ローディング
    ├── error.tsx        # エラー
    ├── _components/     # プライベートコンポーネント
    │   ├── Chart.tsx
    │   └── Stats.tsx
    ├── _lib/            # ユーティリティ
    │   └── utils.ts
    └── _styles/         # スタイル
        └── dashboard.module.css
```

### プライベートフォルダ

`_` で始まるフォルダはルーティングから除外:

```
app/
├── _components/    # 共有コンポーネント
├── _lib/          # ユーティリティ
├── _types/        # 型定義
└── page.tsx
```

### ルートグループ

`()` でグループ化（URL に影響しない）:

```
app/
├── (marketing)/
│   ├── about/page.tsx    # /about
│   └── contact/page.tsx  # /contact
├── (shop)/
│   ├── products/page.tsx # /products
│   └── cart/page.tsx     # /cart
└── page.tsx              # /
```

異なるレイアウトを適用する場合に便利:

```
app/
├── (marketing)/
│   ├── layout.tsx        # マーケティング用レイアウト
│   ├── about/page.tsx
│   └── pricing/page.tsx
├── (dashboard)/
│   ├── layout.tsx        # ダッシュボード用レイアウト
│   ├── overview/page.tsx
│   └── settings/page.tsx
└── layout.tsx            # ルートレイアウト
```

## コンポーネントの階層

App Router でのコンポーネントの階層構造:

```
<RootLayout>
  <NestedLayout>
    <Template>
      <ErrorBoundary fallback={<Error />}>
        <Suspense fallback={<Loading />}>
          <Page />
        </Suspense>
      </ErrorBoundary>
    </Template>
  </NestedLayout>
</RootLayout>
```

## メタデータ

### 静的メタデータ

```typescript
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "Welcome to my app",
};
```

### 動的メタデータ

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
  };
}
```

## まとめ

- **App Router** は `app/` ディレクトリを使用
- **ファイル規約**で特別な機能を自動適用
- **page.tsx** がルートを公開する
- **layout.tsx** は状態を保持する共有 UI
- **loading.tsx** で自動ローディング UI
- **error.tsx** でエラーハンドリング
- **コロケーション**で関連ファイルをまとめる
- **ルートグループ**で URL に影響なく整理

## 演習問題

1. `app/about/page.tsx` を作成して `/about` ページを追加してください
2. `app/dashboard/layout.tsx` を作成してサイドバー付きレイアウトを実装してください
3. `app/dashboard/loading.tsx` でスケルトン UI を作成してください
4. `app/not-found.tsx` をカスタマイズしてください

## 次のステップ

次の章では、動的ルーティングとナビゲーションについて詳しく学びます。

⬅️ 前へ: [01-Getting-Started.md](./01-Getting-Started.md)
➡️ 次へ: [03-Routing.md](./03-Routing.md)
