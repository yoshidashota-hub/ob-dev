# 09 - Code Splitting（コード分割）

## この章で学ぶこと

- コード分割の仕組み
- 動的インポート
- ルートベースの分割
- ベンダー分割

## コード分割の基本

### なぜ必要か

```
単一バンドル（悪い例）
├── index.js (500KB)
└── すべてのコードが1つのファイル
    → 初期ロードが遅い

コード分割（良い例）
├── index.js (50KB)      # 初期ロード
├── vendor.js (100KB)    # ライブラリ
├── about.js (30KB)      # /about ページ
└── admin.js (80KB)      # /admin ページ
    → 必要な時に必要なコードだけロード
```

### Vite の自動分割

```typescript
// 動的インポートは自動的に別チャンクに
const Component = await import("./Component");

// ビルド結果
// index.js + Component-abc123.js
```

## 動的インポート

### 基本的な使い方

```typescript
// 静的インポート（バンドルに含まれる）
import { something } from "./module";

// 動的インポート（別チャンクに分割）
const module = await import("./module");
const { something } = module;
```

### React での遅延読み込み

```typescript
import { lazy, Suspense } from "react";

// 遅延読み込みコンポーネント
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

### チャンク名の指定

```typescript
// webpackChunkName コメント（Vite でも動作）
const Component = lazy(
  () => import(/* webpackChunkName: "my-component" */ "./Component"),
);

// Rollup のマジックコメント
const Component = lazy(
  () => import(/* @vite-ignore */ dynamicPath),
);
```

## ルートベースの分割

### React Router での実装

```typescript
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ページコンポーネントを遅延読み込み
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Contact = lazy(() => import("./pages/Contact"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog/*" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### ネストしたルートの分割

```typescript
// pages/Blog.tsx
const BlogPost = lazy(() => import("./BlogPost"));
const BlogList = lazy(() => import("./BlogList"));

function Blog() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route index element={<BlogList />} />
        <Route path=":id" element={<BlogPost />} />
      </Routes>
    </Suspense>
  );
}
```

## ベンダー分割

### 設定

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 関連
          react: ["react", "react-dom"],

          // ルーティング
          router: ["react-router-dom"],

          // UI ライブラリ
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],

          // ユーティリティ
          utils: ["lodash-es", "date-fns", "axios"],
        },
      },
    },
  },
});
```

### 動的なベンダー分割

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // パッケージ名を取得
            const packageName = id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0];

            // 大きいパッケージは個別に分割
            const bigPackages = ["lodash", "moment", "chart.js"];
            if (bigPackages.some((pkg) => id.includes(pkg))) {
              return `vendor-${packageName}`;
            }

            // その他は vendor にまとめる
            return "vendor";
          }
        },
      },
    },
  },
});
```

## 条件付き読み込み

### 機能フラグによる分割

```typescript
async function loadFeature() {
  if (featureFlags.newDashboard) {
    return import("./features/NewDashboard");
  }
  return import("./features/OldDashboard");
}
```

### ユーザー権限による分割

```typescript
async function loadAdminPanel(user) {
  if (user.role === "admin") {
    const { AdminPanel } = await import("./admin/AdminPanel");
    return AdminPanel;
  }
  return null;
}
```

## プリロード戦略

### リンクホバーでプリロード

```typescript
function NavLink({ to, children }) {
  const preload = () => {
    // ホバー時にコンポーネントをプリロード
    if (to === "/dashboard") {
      import("./pages/Dashboard");
    } else if (to === "/settings") {
      import("./pages/Settings");
    }
  };

  return (
    <Link to={to} onMouseEnter={preload}>
      {children}
    </Link>
  );
}
```

### Intersection Observer でプリロード

```typescript
function LazySection({ importFn, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          importFn(); // ビューポートに入ったらプリロード
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }, // 200px 手前でプリロード
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [importFn]);

  return <div ref={ref}>{children}</div>;
}
```

## エラーハンドリング

### Error Boundary

```typescript
class ChunkErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // チャンク読み込みエラーの場合はリロード
    if (error.name === "ChunkLoadError") {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return <div>読み込みに失敗しました。</div>;
    }
    return this.props.children;
  }
}
```

### リトライロジック

```typescript
function lazyWithRetry(importFn, retries = 3) {
  return lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  });
}

const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
```

## まとめ

- 動的インポートで自動的にコード分割
- ルートベースの分割で初期ロードを軽量化
- ベンダー分割でキャッシュ効率を向上
- プリロードでユーザー体験を改善
- Error Boundary でエラーハンドリング

## 確認問題

1. コード分割のメリットを説明してください
2. ルートベースの分割を実装してください
3. プリロード戦略を実装してください

## 次の章へ

[10 - Plugins](./10-Plugins.md) では、Vite プラグインについて学びます。
