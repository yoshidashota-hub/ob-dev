# 11 - Suspense と Concurrent 機能

## この章で学ぶこと

- Suspense の基本概念
- データフェッチングとの統合
- Concurrent Features（並行機能）
- useTransition と useDeferredValue
- Streaming SSR

## Suspense とは

Suspense は、コンポーネントが「準備中」の状態を宣言的に扱うための機能です。

### 基本的な使い方

```tsx
import { Suspense } from "react";

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <SlowComponent />
    </Suspense>
  );
}

function Loading() {
  return <div className="spinner">Loading...</div>;
}
```

### 遅延読み込み（Lazy Loading）

```tsx
import { lazy, Suspense } from "react";

// 動的インポート
const Dashboard = lazy(() => import("./Dashboard"));
const Settings = lazy(() => import("./Settings"));
const Profile = lazy(() => import("./Profile"));

function App() {
  const [page, setPage] = useState<"dashboard" | "settings" | "profile">("dashboard");

  return (
    <div>
      <nav>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("settings")}>Settings</button>
        <button onClick={() => setPage("profile")}>Profile</button>
      </nav>

      <Suspense fallback={<PageLoader />}>
        {page === "dashboard" && <Dashboard />}
        {page === "settings" && <Settings />}
        {page === "profile" && <Profile />}
      </Suspense>
    </div>
  );
}
```

### ネストした Suspense

```tsx
function App() {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <Header />

      <main>
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>

        <Suspense fallback={<ContentSkeleton />}>
          <MainContent />
        </Suspense>
      </main>
    </Suspense>
  );
}
```

## データフェッチングと Suspense

### React の Suspense 対応ライブラリ

React 自体はまだ公式のデータフェッチング Suspense API を提供していませんが、以下のライブラリが対応しています：

- **TanStack Query** (React Query)
- **SWR**
- **Relay**
- **Next.js** (App Router)

### TanStack Query での使用

```tsx
import { QueryClient, QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

const queryClient = new QueryClient();

// useSuspenseQuery を使用
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  // data は常に存在することが保証される
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile userId="1" />
      </Suspense>
    </QueryClientProvider>
  );
}
```

### SWR での使用

```tsx
import useSWR from "swr";
import { Suspense } from "react";

// suspense: true を指定
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useSWR(`/api/users/${userId}`, fetcher, {
    suspense: true,
  });

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

## useTransition

`useTransition` は、状態更新の優先度を下げ、UI の応答性を維持するためのフックです。

### 基本的な使い方

```tsx
import { useState, useTransition } from "react";

function TabContainer() {
  const [tab, setTab] = useState("about");
  const [isPending, startTransition] = useTransition();

  const selectTab = (nextTab: string) => {
    // 優先度の低い更新としてマーク
    startTransition(() => {
      setTab(nextTab);
    });
  };

  return (
    <div>
      <nav>
        {["about", "posts", "contact"].map((t) => (
          <button
            key={t}
            onClick={() => selectTab(t)}
            style={{
              fontWeight: tab === t ? "bold" : "normal",
              opacity: isPending ? 0.5 : 1,
            }}
          >
            {t}
          </button>
        ))}
      </nav>

      {isPending && <div className="spinner" />}

      {tab === "about" && <AboutTab />}
      {tab === "posts" && <PostsTab />}
      {tab === "contact" && <ContactTab />}
    </div>
  );
}
```

### 検索フィルターでの使用

```tsx
import { useState, useTransition, useMemo } from "react";

function ProductList({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // 入力は即座に更新
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  // フィルタリングは低優先度
  const [filteredProducts, setFilteredProducts] = useState(products);

  const handleFilter = (q: string) => {
    startTransition(() => {
      const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase())
      );
      setFilteredProducts(filtered);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          handleChange(e);
          handleFilter(e.target.value);
        }}
        placeholder="Search products..."
      />

      {isPending && <p>Updating list...</p>}

      <ul>
        {filteredProducts.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## useDeferredValue

`useDeferredValue` は、値の更新を遅延させるフックです。

### 基本的な使い方

```tsx
import { useState, useDeferredValue } from "react";

function SearchResults() {
  const [query, setQuery] = useState("");

  // query の遅延バージョン
  const deferredQuery = useDeferredValue(query);

  // 入力中かどうか
  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />

      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <SearchResultsList query={deferredQuery} />
      </div>
    </div>
  );
}

function SearchResultsList({ query }: { query: string }) {
  // 重い検索処理
  const results = useMemo(() => {
    return searchItems(query); // 時間がかかる処理
  }, [query]);

  return (
    <ul>
      {results.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Suspense との組み合わせ

```tsx
import { Suspense, useState, useDeferredValue } from "react";

function App() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />

      <Suspense fallback={<Loading />}>
        {/* deferredQuery が更新されるまで前の結果を表示し続ける */}
        <SearchResults query={deferredQuery} />
      </Suspense>
    </div>
  );
}
```

## useTransition vs useDeferredValue

| 特徴         | useTransition                | useDeferredValue           |
| ------------ | ---------------------------- | -------------------------- |
| 対象         | 状態更新をラップ             | 値をラップ                 |
| 制御         | 更新タイミングを制御         | 値の反映を遅延             |
| isPending    | あり                         | なし（手動で判定）         |
| 使用場面     | 状態を直接更新する場合       | Props として受け取る場合   |

```tsx
// useTransition: 自分で状態を更新する場合
const [isPending, startTransition] = useTransition();
startTransition(() => {
  setTab(nextTab);
});

// useDeferredValue: 値を受け取る場合（親から props として）
function Child({ value }: { value: string }) {
  const deferredValue = useDeferredValue(value);
}
```

## Streaming SSR

Next.js App Router では、Suspense を使った Streaming SSR が可能です。

### 基本的な構造

```tsx
// app/page.tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>

      {/* すぐにストリーミング */}
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile />
      </Suspense>

      {/* データ取得完了後にストリーミング */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </div>
  );
}

// 非同期 Server Component
async function UserProfile() {
  const user = await fetchUser();
  return <div>{user.name}</div>;
}

async function Recommendations() {
  const items = await fetchRecommendations();
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### loading.tsx による自動 Suspense

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}

// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchDashboardData();
  return <Dashboard data={data} />;
}
```

## スケルトン UI のパターン

### 基本的なスケルトン

```tsx
function Skeleton({ width = "100%", height = "20px" }: { width?: string; height?: string }) {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#e0e0e0",
        borderRadius: "4px",
        animation: "pulse 1.5s infinite",
      }}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="card">
      <Skeleton width="60%" height="24px" />
      <Skeleton height="16px" />
      <Skeleton height="16px" />
      <Skeleton width="40%" height="16px" />
    </div>
  );
}
```

### CSS アニメーション

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## 実践: ダッシュボードアプリケーション

```tsx
import { Suspense, useState, useTransition, lazy } from "react";

// 遅延読み込みコンポーネント
const AnalyticsChart = lazy(() => import("./AnalyticsChart"));
const RecentOrders = lazy(() => import("./RecentOrders"));
const UserActivity = lazy(() => import("./UserActivity"));

// スケルトンコンポーネント
function ChartSkeleton() {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-chart" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="table-skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  );
}

// 期間選択タブ
type Period = "day" | "week" | "month" | "year";

function PeriodTabs({
  period,
  onChange,
  isPending,
}: {
  period: Period;
  onChange: (p: Period) => void;
  isPending: boolean;
}) {
  const periods: Period[] = ["day", "week", "month", "year"];

  return (
    <div className="period-tabs" style={{ opacity: isPending ? 0.7 : 1 }}>
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={period === p ? "active" : ""}
          disabled={isPending}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}

// メインダッシュボード
function Dashboard() {
  const [period, setPeriod] = useState<Period>("week");
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (newPeriod: Period) => {
    startTransition(() => {
      setPeriod(newPeriod);
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <PeriodTabs
          period={period}
          onChange={handlePeriodChange}
          isPending={isPending}
        />
      </header>

      <div className="dashboard-grid">
        {/* 分析チャート */}
        <section className="chart-section">
          <h2>Analytics</h2>
          <Suspense fallback={<ChartSkeleton />}>
            <AnalyticsChart period={period} />
          </Suspense>
        </section>

        {/* 最近の注文 */}
        <section className="orders-section">
          <h2>Recent Orders</h2>
          <Suspense fallback={<TableSkeleton />}>
            <RecentOrders period={period} />
          </Suspense>
        </section>

        {/* ユーザーアクティビティ */}
        <section className="activity-section">
          <h2>User Activity</h2>
          <Suspense fallback={<TableSkeleton />}>
            <UserActivity period={period} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

// アプリケーションのエントリーポイント
function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Suspense fallback={<AppLoader />}>
        <Dashboard />
      </Suspense>
    </ErrorBoundary>
  );
}

// エラーページ
function ErrorPage() {
  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}

// アプリローダー
function AppLoader() {
  return (
    <div className="app-loader">
      <div className="spinner" />
      <p>Loading dashboard...</p>
    </div>
  );
}

export default App;
```

## まとめ

- **Suspense** は非同期処理の「待機状態」を宣言的に扱う
- **lazy** と組み合わせてコード分割を実現
- **useTransition** は状態更新の優先度を下げる
- **useDeferredValue** は値の反映を遅延させる
- **Streaming SSR** で段階的なページ読み込みが可能
- **スケルトン UI** でユーザー体験を向上

## 確認問題

1. Suspense の fallback はいつ表示されますか？
2. useTransition と useDeferredValue の使い分けは？
3. Streaming SSR の利点は何ですか？
4. isPending フラグはどのように活用できますか？

## 次の章

[12 - テスト](./12-Testing.md) では、React コンポーネントのテスト方法について学びます。
