---
created: 2025-11-08
tags: [nextjs, loading-ui, skeleton, ux, examples]
status: 完了
related:
  - "[[streaming-suspense-examples]]"
  - "[[Next.js-16-Extended-Learning-Path]]"
---

# Loading UI & Skeletons 実装例

Next.js 16 の Loading UI とスケルトンスクリーンの実装例とベストプラクティス。

## 📋 概要

Loading UI は、データ取得中やページ遷移中にユーザーに待ち時間を示す重要な機能。

### 主な特徴

- **loading.tsx による自動表示**
- **Suspense との統合**
- **スケルトンスクリーン**
- **プログレスインジケーター**
- **UX 向上**

---

## 🎯 基本構造

### loading.tsx ファイル

Next.js は各ルートセグメントで `loading.tsx` を自動的に検出し、ページ読み込み中に表示します。

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="p-8">
      <p>読み込み中...</p>
    </div>
  );
}
```

### ファイル配置

```
app/
├── loading.tsx                 # ルート全体
├── dashboard/
│   └── loading.tsx             # /dashboard
├── products/
│   ├── loading.tsx             # /products
│   └── [id]/
│       └── loading.tsx         # /products/[id]
└── components/
    ├── skeletons.tsx           # 共通スケルトン
    └── ProgressBar.tsx         # プログレスバー
```

---

## 📖 実装パターン

### 1. スケルトンスクリーン基本

```typescript
export function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}
```

**ポイント:**

- `animate-pulse` でアニメーション
- `bg-gray-200` で薄いグレー背景
- 幅を調整して実際のコンテンツに近い見た目に

---

### 2. カードスケルトン

```typescript
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 bg-white animate-pulse">
      {/* タイトル */}
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>

      {/* コンテンツ */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>

      {/* ボタン */}
      <div className="mt-4 h-10 bg-gray-200 rounded w-1/3"></div>
    </div>
  );
}
```

---

### 3. グリッドレイアウト

```typescript
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

---

### 4. loading.tsx の実装例

#### 商品一覧ページ

```typescript
// app/products/loading.tsx
import { GridSkeleton, HeaderSkeleton } from "@/app/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <HeaderSkeleton />
        <GridSkeleton count={6} />
      </div>
    </div>
  );
}
```

#### 商品詳細ページ

```typescript
// app/products/[id]/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
          <div className="grid md:grid-cols-2 gap-8">
            {/* 画像 */}
            <div className="h-96 bg-gray-200 rounded-lg"></div>

            {/* 詳細 */}
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### ダッシュボード

```typescript
// app/dashboard/loading.tsx
import { DashboardSkeleton } from "@/app/components/skeletons";

export default function Loading() {
  return <DashboardSkeleton />;
}
```

---

## 🎨 プログレスインジケーター

### 1. トップバープログレス

```typescript
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-50"
      style={{ width: `${progress}%` }}
    />
  );
}
```

### 2. スピナー

```typescript
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}
    />
  );
}
```

### 3. ボタンローディング

```typescript
export function ButtonLoader({ text = "処理中..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Spinner size="sm" />
      <span>{text}</span>
    </div>
  );
}
```

### 4. ドットアニメーション

```typescript
export function DotLoader() {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
    </div>
  );
}
```

---

## 🔄 Suspense との統合

### 基本的な使い方

```typescript
import { Suspense } from "react";
import { CardSkeleton } from "@/app/components/skeletons";

export default function Page() {
  return (
    <div>
      <h1>商品一覧</h1>
      <Suspense fallback={<CardSkeleton />}>
        <Products />
      </Suspense>
    </div>
  );
}
```

### 並列レンダリング

```typescript
export default function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
```

---

## 💡 ベストプラクティス

### 1. スケルトンは実際のコンテンツに近づける

```typescript
// ❌ 悪い例
export function BadSkeleton() {
  return <div className="h-20 bg-gray-200"></div>;
}

// ✅ 良い例
export function GoodSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}
```

### 2. 適切な粒度で Suspense を使う

```typescript
// ✅ 各セクションで Suspense を使う
export default function Page() {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <Suspense fallback={<ContentSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
```

### 3. animate-pulse で視覚的フィードバック

```typescript
// すべてのスケルトンに animate-pulse を適用
<div className="animate-pulse">{/* スケルトンコンテンツ */}</div>
```

### 4. アクセシビリティ

```typescript
export function AccessibleSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="読み込み中">
      <div className="h-4 bg-gray-200 rounded"></div>
      <span className="sr-only">コンテンツを読み込んでいます...</span>
    </div>
  );
}
```

---

## 📊 パフォーマンス考慮

### Instant Loading State

Next.js は自動的に `loading.tsx` を使って Instant Loading State を提供します。

**利点:**

- **即座のフィードバック** - ナビゲーション直後に表示
- **ユーザー体験向上** - 待ち時間の認識を減らす
- **自動的** - 手動実装不要

### Streaming SSR

```typescript
// loading.tsx と Suspense を組み合わせる
export default function Page() {
  return (
    <>
      {/* 即座に表示 */}
      <Header />

      {/* ストリーミング */}
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </>
  );
}
```

---

## 🚀 実装済みファイル

### プロジェクト内の実装

```
next16-sandbox/
├── app/
│   ├── components/
│   │   ├── skeletons.tsx        # 共通スケルトン
│   │   └── ProgressBar.tsx      # プログレスバー
│   ├── dashboard/
│   │   └── loading.tsx          # ダッシュボード
│   ├── products/
│   │   ├── loading.tsx          # 商品一覧
│   │   └── [id]/
│   │       └── loading.tsx      # 商品詳細
│   └── streaming/
│       ├── loading.tsx          # Streamingデモ
│       └── components/
│           └── Skeleton.tsx     # 元のスケルトン
```

---

## 📚 参考リンク

- [Next.js Loading UI 公式ドキュメント](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [Tailwind CSS animate-pulse](https://tailwindcss.com/docs/animation#pulse)

---

## 🎓 学習のポイント

1. **loading.tsx の配置** - ルートセグメントごとに配置
2. **Suspense との使い分け** - ページ全体 vs コンポーネント単位
3. **スケルトンデザイン** - 実際のコンテンツに近い見た目
4. **パフォーマンス** - Streaming SSR の活用
5. **UX** - 適切なローディング状態の表示

---

**作成日**: 2025-11-08
**Phase 1.5**: Loading UI & Skeletons 実装完了
