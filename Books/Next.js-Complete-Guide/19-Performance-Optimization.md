# 19 - Performance Optimization

## 概要

この章では、Next.js アプリケーションのパフォーマンス最適化について学びます。Core Web Vitals、バンドル最適化、レンダリング戦略などを解説します。

## Core Web Vitals

### LCP（Largest Contentful Paint）

最大コンテンツの描画時間。2.5 秒以内が目標。

```typescript
// 画像の最適化
import Image from "next/image";

export function HeroImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority // LCP 画像は priority を付ける
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### FID/INP（First Input Delay / Interaction to Next Paint）

インタラクションの応答性。100ms 以内が目標。

```typescript
// 重い処理を分離
"use client";

import { useTransition } from "react";

export function SearchForm() {
  const [isPending, startTransition] = useTransition();

  const handleSearch = (query: string) => {
    startTransition(() => {
      // 重い検索処理
      performSearch(query);
    });
  };

  return (
    <div>
      <input
        type="text"
        onChange={(e) => handleSearch(e.target.value)}
        disabled={isPending}
      />
      {isPending && <span>検索中...</span>}
    </div>
  );
}
```

### CLS（Cumulative Layout Shift）

レイアウトのずれ。0.1 以下が目標。

```typescript
// 画像のサイズを明示
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  style={{ width: "100%", height: "auto" }}
/>;

// スケルトンで領域を確保
function PostCard({ post }: { post?: Post }) {
  if (!post) {
    return <div className="h-48 w-full animate-pulse bg-gray-200 rounded" />;
  }

  return (
    <div className="h-48">
      <h2>{post.title}</h2>
      <p>{post.content}</p>
    </div>
  );
}
```

## バンドル最適化

### 動的インポート

```typescript
import dynamic from "next/dynamic";

// クライアントコンポーネントの遅延読み込み
const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // クライアントのみ
});

// 条件付き読み込み
const AdminPanel = dynamic(() => import("./AdminPanel"), {
  loading: () => <p>Loading...</p>,
});

export function Dashboard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div>
      <HeavyChart />
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### React.lazy と Suspense

```typescript
"use client";

import { lazy, Suspense } from "react";

const LazyComponent = lazy(() => import("./LazyComponent"));

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### Tree Shaking

```typescript
// ❌ 悪い例: 全てインポート
import _ from "lodash";
const result = _.debounce(fn, 300);

// ✅ 良い例: 必要な関数のみ
import debounce from "lodash/debounce";
const result = debounce(fn, 300);

// ✅ もっと良い例: 軽量な代替ライブラリ
import { debounce } from "lodash-es";
```

### バンドル分析

```bash
# @next/bundle-analyzer のインストール
npm install @next/bundle-analyzer
```

```typescript
// next.config.ts
import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // 設定
};

export default withBundleAnalyzer(nextConfig);
```

```bash
# バンドル分析を実行
ANALYZE=true npm run build
```

## レンダリング最適化

### Server Components の活用

```typescript
// サーバーでデータを取得（バンドルサイズに影響しない）
import { prisma } from "@/lib/prisma";

export default async function PostList() {
  const posts = await prisma.post.findMany();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Streaming と Suspense

```typescript
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      {/* すぐに表示 */}
      <Header />

      {/* 遅延読み込み */}
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>

      {/* 並行して読み込み */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />
      ))}
    </div>
  );
}
```

### Partial Prerendering（PPR）

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
};
```

```typescript
// app/page.tsx
import { Suspense } from "react";

// 静的部分
function StaticHeader() {
  return <header>Static Content</header>;
}

// 動的部分
async function DynamicContent() {
  const data = await fetchDynamicData();
  return <div>{data}</div>;
}

export default function Page() {
  return (
    <div>
      <StaticHeader />
      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

## キャッシュ戦略

### データキャッシュ

```typescript
// キャッシュあり（1時間）
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 3600 },
});

// キャッシュなし
const data = await fetch("https://api.example.com/data", {
  cache: "no-store",
});

// タグ付きキャッシュ
const posts = await fetch("https://api.example.com/posts", {
  next: { tags: ["posts"] },
});

// 再検証
import { revalidateTag } from "next/cache";
revalidateTag("posts");
```

### unstable_cache

```typescript
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const getCachedPosts = unstable_cache(
  async () => {
    return prisma.post.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
  ["posts"],
  {
    revalidate: 3600,
    tags: ["posts"],
  }
);

export default async function PostList() {
  const posts = await getCachedPosts();
  return <div>{/* ... */}</div>;
}
```

### React cache

```typescript
import { cache } from "react";
import { prisma } from "@/lib/prisma";

// リクエスト内でメモ化
export const getUser = cache(async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
});

// 複数のコンポーネントで呼び出しても1回のみ実行
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <div>{user?.name}</div>;
}

async function UserPosts({ userId }: { userId: string }) {
  const user = await getUser(userId); // キャッシュされた結果を使用
  return <div>{user?.posts.length} posts</div>;
}
```

## 画像最適化

### next/image の活用

```typescript
import Image from "next/image";

export function OptimizedImage() {
  return (
    <Image
      src="/large-image.jpg"
      alt="Description"
      width={1200}
      height={800}
      // 遅延読み込み（デフォルト）
      loading="lazy"
      // 品質
      quality={80}
      // レスポンシブ
      sizes="(max-width: 768px) 100vw, 50vw"
      // プレースホルダー
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### レスポンシブ画像

```typescript
import Image from "next/image";

export function ResponsiveImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      fill
      sizes="(max-width: 640px) 100vw,
             (max-width: 1024px) 75vw,
             50vw"
      style={{ objectFit: "cover" }}
      priority
    />
  );
}
```

### 画像フォーマット

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

## フォント最適化

### next/font の使用

```typescript
import { Inter, Noto_Sans_JP } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### CSS でのフォント設定

```css
/* globals.css */
:root {
  --font-sans: var(--font-inter), var(--font-noto-sans-jp), system-ui,
    sans-serif;
}

body {
  font-family: var(--font-sans);
}
```

## JavaScript 最適化

### コード分割

```typescript
// ページ単位で自動分割
// app/about/page.tsx → about.js

// コンポーネント単位で手動分割
const HeavyComponent = dynamic(() => import("./HeavyComponent"));
```

### 不要な JavaScript の削除

```typescript
// third-party スクリプトの最適化
import Script from "next/script";

export default function Page() {
  return (
    <>
      {/* 遅延読み込み */}
      <Script
        src="https://analytics.example.com/script.js"
        strategy="lazyOnload"
      />

      {/* インタラクティブ後に読み込み */}
      <Script
        src="https://widget.example.com/widget.js"
        strategy="afterInteractive"
      />

      {/* 最初に読み込み（重要なスクリプトのみ） */}
      <Script
        src="https://critical.example.com/critical.js"
        strategy="beforeInteractive"
      />
    </>
  );
}
```

### Web Workers

```typescript
"use client";

import { useEffect, useState } from "react";

export function HeavyComputation() {
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/compute.worker.ts", import.meta.url)
    );

    worker.postMessage({ data: [1, 2, 3, 4, 5] });

    worker.onmessage = (e) => {
      setResult(e.data);
    };

    return () => worker.terminate();
  }, []);

  return <div>Result: {result}</div>;
}
```

```typescript
// workers/compute.worker.ts
self.onmessage = (e) => {
  const { data } = e.data;
  // 重い計算
  const result = data.reduce((a: number, b: number) => a + b, 0);
  self.postMessage(result);
};
```

## データベース最適化

### 効率的なクエリ

```typescript
// ❌ N+1 問題
const posts = await prisma.post.findMany();
for (const post of posts) {
  const author = await prisma.user.findUnique({
    where: { id: post.authorId },
  });
}

// ✅ Include で解決
const posts = await prisma.post.findMany({
  include: {
    author: true,
  },
});
```

### Select で必要なフィールドのみ

```typescript
// ❌ 全フィールド取得
const users = await prisma.user.findMany();

// ✅ 必要なフィールドのみ
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

### ページネーション

```typescript
// Offset ページネーション
const posts = await prisma.post.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: "desc" },
});

// Cursor ページネーション（大量データ向け）
const posts = await prisma.post.findMany({
  take: limit,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  orderBy: { createdAt: "desc" },
});
```

### コネクションプーリング

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

## パフォーマンス計測

### Web Vitals

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### カスタム計測

```typescript
// components/WebVitals.tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric);

    // アナリティクスに送信
    switch (metric.name) {
      case "FCP":
      case "LCP":
      case "CLS":
      case "FID":
      case "TTFB":
      case "INP":
        sendToAnalytics(metric);
        break;
    }
  });

  return null;
}

function sendToAnalytics(metric: any) {
  // Google Analytics や他のサービスに送信
  fetch("/api/analytics", {
    method: "POST",
    body: JSON.stringify(metric),
  });
}
```

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      url: ["http://localhost:3000/"],
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
```

## まとめ

- **Core Web Vitals** を意識した最適化
- **動的インポート** でバンドルサイズを削減
- **Server Components** でクライアント JavaScript を削減
- **Streaming** と **Suspense** で体感速度を向上
- **キャッシュ** を適切に活用
- **画像とフォント** を next/image、next/font で最適化
- **データベースクエリ** を効率化
- **計測** して継続的に改善

## 演習問題

1. Lighthouse スコアを 90 以上に改善してください
2. 動的インポートでバンドルサイズを削減してください
3. Suspense を使ってストリーミングを実装してください
4. Core Web Vitals を計測するダッシュボードを作成してください

## 次のステップ

次の章では、ベストプラクティスについて学びます。

⬅️ 前へ: [18-Deployment.md](./18-Deployment.md)
➡️ 次へ: [20-Best-Practices.md](./20-Best-Practices.md)
