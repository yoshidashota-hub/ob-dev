# 10 - Streaming and Suspense

## 概要

この章では、Next.js のストリーミングと React Suspense について学びます。これらの機能を使うことで、段階的な UI レンダリングが可能になり、ユーザー体験が向上します。

## ストリーミングとは

### 従来のレンダリング

```plaintext
従来の SSR:
1. サーバーですべてのデータをフェッチ
2. すべての HTML をレンダリング
3. 完全な HTML をクライアントに送信
4. クライアントで全体を表示

問題: データフェッチが遅いと、全体が遅延
```

### ストリーミング

```plaintext
ストリーミング:
1. 即座にシェル（レイアウト）を送信
2. データが準備できた部分から順次送信
3. クライアントで段階的に表示

利点: ユーザーは早く UI を見れる
```

## loading.tsx

### 基本的な使い方

`loading.tsx` は自動的に Suspense でラップされます:

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

```typescript
// app/dashboard/page.tsx
async function getData() {
  // 時間のかかる処理
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { message: "Hello" };
}

export default async function DashboardPage() {
  const data = await getData();
  return <div>{data.message}</div>;
}
```

### フォルダ構造

```plaintext
app/
└── dashboard/
    ├── loading.tsx   # ローディング UI
    ├── page.tsx      # メインコンテンツ
    └── settings/
        ├── loading.tsx   # settings 専用のローディング
        └── page.tsx
```

### スケルトン UI

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      {/* ヘッダースケルトン */}
      <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />

      {/* カードグリッドスケルトン */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>

      {/* テーブルスケルトン */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
```

## Suspense

### 基本的な使い方

```typescript
import { Suspense } from "react";

// 遅いコンポーネント
async function SlowComponent() {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const data = await fetchData();
  return <div>{data}</div>;
}

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}
```

### 複数の Suspense 境界

```typescript
import { Suspense } from "react";

async function UserProfile() {
  const user = await fetchUser();
  return <div>{user.name}</div>;
}

async function UserPosts() {
  const posts = await fetchPosts();
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

async function UserComments() {
  const comments = await fetchComments();
  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>{comment.text}</li>
      ))}
    </ul>
  );
}

export default function UserPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Suspense fallback={<ProfileSkeleton />}>
        <UserProfile />
      </Suspense>

      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts />
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <UserComments />
      </Suspense>
    </div>
  );
}
```

### ネストされた Suspense

```typescript
import { Suspense } from "react";

async function Dashboard() {
  const stats = await fetchStats();

  return (
    <div>
      <h1>Dashboard</h1>
      <Stats data={stats} />

      {/* ネストされた Suspense */}
      <Suspense fallback={<ChartSkeleton />}>
        <ChartSection />
      </Suspense>
    </div>
  );
}

async function ChartSection() {
  const chartData = await fetchChartData();

  return (
    <div>
      <Chart data={chartData} />

      {/* さらにネスト */}
      <Suspense fallback={<DetailsSkeleton />}>
        <ChartDetails />
      </Suspense>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
```

## 段階的なローディング

### 優先順位に基づくローディング

```typescript
import { Suspense } from "react";

// 優先度高: 即座に表示
function Header() {
  return <header>My App</header>;
}

// 優先度中: 少し待つ
async function MainContent() {
  const data = await fetchMainData();
  return <main>{data.content}</main>;
}

// 優先度低: 最後に表示
async function Sidebar() {
  const recommendations = await fetchRecommendations();
  return <aside>{/* ... */}</aside>;
}

export default function Page() {
  return (
    <div className="grid grid-cols-4">
      {/* 即座に表示 */}
      <Header />

      {/* メインコンテンツを優先 */}
      <Suspense fallback={<MainSkeleton />}>
        <MainContent />
      </Suspense>

      {/* サイドバーは後から */}
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </div>
  );
}
```

### プログレッシブエンハンスメント

```typescript
import { Suspense } from "react";

// 基本情報（高速）
async function ProductBasicInfo({ id }: { id: string }) {
  const product = await fetchProduct(id);
  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
    </div>
  );
}

// レビュー（中速）
async function ProductReviews({ id }: { id: string }) {
  const reviews = await fetchReviews(id);
  return (
    <div>
      <h2>Reviews ({reviews.length})</h2>
      {/* ... */}
    </div>
  );
}

// 関連商品（低速）
async function RelatedProducts({ id }: { id: string }) {
  const related = await fetchRelatedProducts(id);
  return (
    <div>
      <h2>Related Products</h2>
      {/* ... */}
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      {/* 基本情報を最初に表示 */}
      <Suspense fallback={<BasicSkeleton />}>
        <ProductBasicInfo id={id} />
      </Suspense>

      {/* レビューを次に表示 */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews id={id} />
      </Suspense>

      {/* 関連商品を最後に表示 */}
      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedProducts id={id} />
      </Suspense>
    </div>
  );
}
```

## useTransition と useDeferredValue

### useTransition

低優先度の更新をマーク:

```typescript
"use client";

import { useState, useTransition } from "react";

export function SearchWithTransition() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value);

    // 検索結果の更新は低優先度
    startTransition(async () => {
      const data = await searchAPI(value);
      setResults(data);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />

      {isPending ? (
        <div>Searching...</div>
      ) : (
        <ul>
          {results.map((result, i) => (
            <li key={i}>{result}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### useDeferredValue

値の更新を遅延:

```typescript
"use client";

import { useState, useDeferredValue, useMemo } from "react";

function ExpensiveList({ filter }: { filter: string }) {
  // 重い計算
  const items = useMemo(() => {
    return Array.from({ length: 10000 }, (_, i) => `Item ${i}`).filter((item) =>
      item.toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter]);

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function FilterableList() {
  const [filter, setFilter] = useState("");
  const deferredFilter = useDeferredValue(filter);

  const isStale = filter !== deferredFilter;

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter..."
      />

      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <ExpensiveList filter={deferredFilter} />
      </div>
    </div>
  );
}
```

## エラーバウンダリとの組み合わせ

### error.tsx と loading.tsx

```typescript
// app/dashboard/error.tsx
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
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>;
}
```

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchDashboardData(); // エラーの可能性あり
  return <Dashboard data={data} />;
}
```

### コンポーネントレベルのエラーハンドリング

```typescript
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// 使用例
import { Suspense } from "react";

export default function Page() {
  return (
    <ErrorBoundary fallback={<div>Error loading widget</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncWidget />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Partial Prerendering (PPR)

### 実験的機能

Next.js 15 で実験的に導入された PPR:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
};

export default nextConfig;
```

```typescript
// app/product/[id]/page.tsx
import { Suspense } from "react";

// 静的シェル - プリレンダリング
function ProductShell() {
  return (
    <div>
      <nav>Navigation</nav>
      <footer>Footer</footer>
    </div>
  );
}

// 動的コンテンツ - ストリーミング
async function ProductDetails({ id }: { id: string }) {
  const product = await fetchProduct(id);
  return <div>{product.name}</div>;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProductShell>
      <Suspense fallback={<Skeleton />}>
        <ProductDetails id={id} />
      </Suspense>
    </ProductShell>
  );
}
```

## ベストプラクティス

### 1. 適切な粒度で Suspense を配置

```typescript
// ❌ 悪い例 - 粒度が粗すぎる
<Suspense fallback={<FullPageLoader />}>
  <EntirePage />
</Suspense>

// ✅ 良い例 - 適切な粒度
<div>
  <Header /> {/* 即座に表示 */}
  <Suspense fallback={<MainSkeleton />}>
    <MainContent />
  </Suspense>
  <Suspense fallback={<SidebarSkeleton />}>
    <Sidebar />
  </Suspense>
</div>
```

### 2. スケルトンはレイアウトを維持

```typescript
// ❌ 悪い例 - レイアウトシフト
function BadSkeleton() {
  return <div>Loading...</div>;
}

// ✅ 良い例 - レイアウトを維持
function GoodSkeleton() {
  return <div className="h-48 w-full bg-gray-200 rounded animate-pulse" />;
}
```

### 3. 意味のあるフォールバック

```typescript
// ❌ 悪い例 - 汎用的すぎる
<Suspense fallback={<div>Loading...</div>}>

// ✅ 良い例 - コンテンツに合わせたスケルトン
<Suspense fallback={<ProductCardSkeleton />}>
  <ProductCard />
</Suspense>
```

## まとめ

- **loading.tsx** で自動的にローディング UI を表示
- **Suspense** で細かい粒度のローディングを制御
- **段階的なローディング** でユーザー体験を向上
- **useTransition** で低優先度の更新をマーク
- **useDeferredValue** で値の更新を遅延
- **スケルトン UI** でレイアウトシフトを防止

## 演習問題

1. loading.tsx を使ったスケルトン UI を作成してください
2. 複数の Suspense 境界で段階的なローディングを実装してください
3. useTransition を使った検索機能を実装してください
4. エラーバウンダリと Suspense を組み合わせてください

## 次のステップ

次の章では、Server Actions によるデータ変更について学びます。

⬅️ 前へ: [09-Caching.md](./09-Caching.md)
➡️ 次へ: [11-Server-Actions.md](./11-Server-Actions.md)
