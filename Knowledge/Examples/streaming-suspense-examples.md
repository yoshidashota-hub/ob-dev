---
created: 2025-11-08
tags: [example, nextjs, streaming, suspense, performance, ssr]
status: 完了
related:
  - "[[Next.js-16-Setup]]"
  - "[[server-actions-examples]]"
  - "[[use-cache-examples]]"
---

# Streaming & Suspense 実装例

## 概要

Next.js 16 の Streaming SSR と React Suspense を使った、段階的レンダリングとパフォーマンス最適化の実装例。

## 実装場所

```
Projects/next16-sandbox/
├── app/
│   └── streaming/
│       ├── page.tsx                    # メインページ
│       ├── loading.tsx                 # ページ全体のローディングUI
│       └── components/
│           ├── Skeleton.tsx            # スケルトンコンポーネント
│           └── SlowComponent.tsx       # 遅延データフェッチコンポーネント
```

## Streaming SSR とは

### 概念

Streaming SSR（Server-Side Rendering）は、HTML をストリーム形式で段階的にクライアントに送信する技術です。

**従来の SSR**:

```
サーバー: データ取得 → HTML生成 → 一括送信
クライアント: 待機 → 全HTML受信 → 表示
```

**Streaming SSR**:

```
サーバー: 準備できた部分から順次HTML送信
クライアント: 部分的に受信 → すぐ表示 → 追加受信 → 更新
```

### 利点

| 項目                         | 従来の SSR           | Streaming SSR          |
| ---------------------------- | -------------------- | ---------------------- |
| TTFB (Time to First Byte)    | 遅い（全データ待ち） | 速い（即座に送信開始） |
| FCP (First Contentful Paint) | 遅い（全 HTML 待ち） | 速い（部分表示）       |
| ユーザー体験                 | 白画面が長い         | すぐにコンテンツ表示   |
| SEO                          | 良好                 | 良好                   |

## React Suspense の基本

### Suspense とは

非同期処理（データ取得など）が完了するまで、フォールバック UI を表示する仕組み。

```typescript
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### 動作の流れ

1. `<Suspense>` がマウントされる
2. 子コンポーネント `<AsyncComponent>` がレンダリング開始
3. データ取得中は `fallback` を表示
4. データ取得完了後、実際のコンポーネントに置き換え

## 1. スケルトンローディング

### 基本的なスケルトン

```typescript
// app/streaming/components/Skeleton.tsx

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

**ポイント**:

- `animate-pulse` でアニメーション効果
- グレー背景で"読み込み中"を視覚化
- 実際のコンテンツと似た形状にする

### カードスケルトン

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

### リストスケルトン

```typescript
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
```

## 2. 遅延コンポーネント

### データフェッチをシミュレート

```typescript
// app/streaming/components/SlowComponent.tsx

async function fetchSlowData(delay: number = 2000) {
  // 遅延をシミュレート
  await new Promise((resolve) => setTimeout(resolve, delay));

  return {
    title: "遅延データ",
    description: `${delay}ms後に読み込まれました`,
    timestamp: new Date().toISOString(),
  };
}

export async function SlowComponent({ delay = 2000 }: { delay?: number }) {
  const data = await fetchSlowData(delay);

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-xl font-semibold mb-4">{data.title}</h3>
      <p className="text-gray-600">{data.description}</p>
      <div className="text-sm text-gray-500">
        読み込み時刻: {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
```

### Suspense でラップ

```typescript
import { Suspense } from "react";
import { SlowComponent } from "./components/SlowComponent";
import { CardSkeleton } from "./components/Skeleton";

export default function Page() {
  return (
    <div>
      <h1>Streamingデモ</h1>

      {/* Suspenseでラップ */}
      <Suspense fallback={<CardSkeleton />}>
        <SlowComponent delay={2000} />
      </Suspense>
    </div>
  );
}
```

**動作**:

1. ページが即座にレンダリング開始
2. `<SlowComponent>` はデータ取得中
3. その間 `<CardSkeleton>` を表示
4. データ取得完了後、実際のコンポーネントに置き換え

## 3. 並列データフェッチング

### 複数の Suspense を並列実行

```typescript
export default function Page() {
  return (
    <div className="space-y-8">
      {/* ヘッダー: 即座に表示 */}
      <h1>ダッシュボード</h1>

      {/* 3つのセクションを並列で読み込み */}
      <Suspense fallback={<StatsSkeleton />}>
        <UserStatsComponent />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <RecentPostsComponent />
      </Suspense>

      <Suspense fallback={<ListSkeleton />}>
        <PopularItemsComponent />
      </Suspense>
    </div>
  );
}
```

**利点**:

- 各セクションが独立して読み込まれる
- 遅い API が他のセクションをブロックしない
- ユーザーは準備できた部分から閲覧開始

### Promise.all で並列フェッチ

```typescript
export async function ParallelFetchDemo() {
  // 複数のAPIを並列で呼び出し
  const [users, posts, stats] = await Promise.all([
    fetchUsers(), // 1秒
    fetchPosts(), // 1.5秒
    fetchStats(), // 0.5秒
  ]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <UserCard users={users} />
      <PostCard posts={posts} />
      <StatsCard stats={stats} />
    </div>
  );
}

// 使用
<Suspense fallback={<div>読み込み中...</div>}>
  <ParallelFetchDemo />
</Suspense>;
```

**実行時間**:

- 逐次実行: 1 秒 + 1.5 秒 + 0.5 秒 = 3 秒
- 並列実行: max(1 秒, 1.5 秒, 0.5 秒) = **1.5 秒**

## 4. ネストした Suspense

### 細かい粒度での制御

```typescript
export default function Page() {
  return (
    <div>
      {/* 外側のSuspense: ページ全体 */}
      <Suspense fallback={<PageSkeleton />}>
        <div>
          <h1>ダッシュボード</h1>

          {/* 内側のSuspense1: 統計情報 */}
          <Suspense fallback={<StatsSkeleton />}>
            <StatsSection />
          </Suspense>

          {/* 内側のSuspense2: コンテンツ */}
          <Suspense fallback={<ContentSkeleton />}>
            <ContentSection />
          </Suspense>
        </div>
      </Suspense>
    </div>
  );
}
```

**動作**:

1. 外側の Suspense が最初に評価される
2. 子要素が準備できたら、内側の Suspense が個別に評価
3. より細かい制御が可能

### ネストの適切な使い方

```typescript
// ✅ 良い例: 独立したセクション
<div>
  <Suspense fallback={<Skeleton1 />}>
    <Section1 />
  </Suspense>

  <Suspense fallback={<Skeleton2 />}>
    <Section2 />
  </Suspense>
</div>

// ❌ 悪い例: 過度なネスト
<Suspense>
  <Suspense>
    <Suspense>
      <Suspense>
        <Component />
      </Suspense>
    </Suspense>
  </Suspense>
</Suspense>
```

## 5. loading.tsx - ページ全体のローディング

### Next.js の loading.tsx

```typescript
// app/streaming/loading.tsx

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ヘッダースケルトン */}
        <div className="bg-white rounded-lg p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* コンテンツスケルトン */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**自動適用**:

- Next.js は `loading.tsx` を自動的に Suspense 境界として使用
- ページ全体のナビゲーション時に表示される

### loading.tsx の適用範囲

```
app/
├── layout.tsx
├── page.tsx
└── dashboard/
    ├── loading.tsx          ← /dashboard にアクセス時に表示
    ├── page.tsx
    └── settings/
        ├── loading.tsx      ← /dashboard/settings にアクセス時に表示
        └── page.tsx
```

## 6. 実践的なパターン

### パターン 1: ヘッダーは即座、コンテンツは段階的

```typescript
export default function Page() {
  return (
    <div>
      {/* 即座に表示 */}
      <header>
        <h1>ダッシュボード</h1>
        <nav>{/* ナビゲーション */}</nav>
      </header>

      {/* 段階的に表示 */}
      <main className="space-y-8">
        <Suspense fallback={<StatsSkeleton />}>
          <StatsSection />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <ChartsSection />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <DataTable />
        </Suspense>
      </main>
    </div>
  );
}
```

### パターン 2: 重要度による優先順位

```typescript
export default async function Page() {
  // 重要なデータは直接 await（優先度高）
  const criticalData = await fetchCriticalData();

  return (
    <div>
      {/* 即座に表示: 重要データ */}
      <CriticalSection data={criticalData} />

      {/* 遅延表示: 重要度低 */}
      <Suspense fallback={<Skeleton />}>
        <NonCriticalSection />
      </Suspense>
    </div>
  );
}
```

### パターン 3: 段階的な詳細度

```typescript
export default function Page() {
  return (
    <div>
      {/* レベル1: 概要（即座） */}
      <h1>商品一覧</h1>
      <p>全100件の商品</p>

      {/* レベル2: 一覧（1秒後） */}
      <Suspense fallback={<GridSkeleton />}>
        <ProductGrid />
      </Suspense>

      {/* レベル3: 詳細（2秒後） */}
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetails />
      </Suspense>
    </div>
  );
}
```

## 7. パフォーマンス最適化

### 測定指標

| 指標 | 説明                     | 目標値  |
| ---- | ------------------------ | ------- |
| TTFB | Time to First Byte       | < 600ms |
| FCP  | First Contentful Paint   | < 1.8s  |
| LCP  | Largest Contentful Paint | < 2.5s  |
| TTI  | Time to Interactive      | < 3.8s  |

### Streaming による改善

```typescript
// ❌ 従来のSSR: 全データ待ち
export default async function Page() {
  const [data1, data2, data3] = await Promise.all([
    fetchData1(), // 2秒
    fetchData2(), // 3秒
    fetchData3(), // 1秒
  ]);

  // 3秒後にようやくHTMLが送信される
  return <div>{/* 全データ */}</div>;
}

// ✅ Streaming SSR: 段階的表示
export default function Page() {
  return (
    <div>
      {/* 即座にHTMLが送信される */}
      <h1>ページタイトル</h1>

      {/* 各セクションが準備でき次第表示 */}
      <Suspense fallback={<Skeleton />}>
        <Section1 /> {/* 2秒後 */}
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <Section2 /> {/* 3秒後 */}
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <Section3 /> {/* 1秒後 */}
      </Suspense>
    </div>
  );
}
```

**結果**:

- TTFB: 3 秒 → **即座**
- FCP: 3 秒 → **即座**
- ユーザー体験: 待機時間なし

### データフェッチの最適化

```typescript
// ✅ キャッシュと組み合わせ
import { unstable_cache } from "next/cache";

const getCachedData = unstable_cache(
  async () => {
    const res = await fetch("https://api.example.com/data");
    return res.json();
  },
  ["data-key"],
  { tags: ["data"], revalidate: 3600 }
);

export async function DataComponent() {
  // キャッシュがあれば即座に返る
  const data = await getCachedData();

  return <div>{/* データ表示 */}</div>;
}
```

## 8. エラーハンドリング

### Error Boundary との組み合わせ

```typescript
// app/streaming/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="border-2 border-red-500 rounded p-6">
      <h2 className="text-xl font-bold text-red-600 mb-4">
        エラーが発生しました
      </h2>
      <p className="text-gray-700 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        再試行
      </button>
    </div>
  );
}
```

### Suspense 内でのエラー

```typescript
export async function DataComponent() {
  try {
    const data = await fetchData();
    return <div>{data.title}</div>;
  } catch (error) {
    // エラーはError Boundaryでキャッチされる
    throw new Error("データ取得に失敗しました");
  }
}

// 使用
<ErrorBoundary>
  <Suspense fallback={<Skeleton />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>;
```

## 9. ベストプラクティス

### ✅ DO: 推奨される使い方

1. **重要なコンテンツは即座に表示**

   ```typescript
   export default function Page() {
     return (
       <div>
         <h1>タイトル</h1> {/* 即座に */}
         <Suspense fallback={<Skeleton />}>
           <SlowContent /> {/* 遅延OK */}
         </Suspense>
       </div>
     );
   }
   ```

2. **スケルトンは実際のコンテンツと似た形状に**

   ```typescript
   // ✅ 良い例
   <Suspense fallback={<CardSkeleton />}>
     <Card />
   </Suspense>

   // ❌ 悪い例
   <Suspense fallback={<div>Loading...</div>}>
     <ComplexCard />
   </Suspense>
   ```

3. **並列データ取得を活用**

   ```typescript
   // ✅ 並列
   const [data1, data2] = await Promise.all([fetch1(), fetch2()]);

   // ❌ 逐次
   const data1 = await fetch1();
   const data2 = await fetch2();
   ```

### ❌ DON'T: 避けるべき使い方

1. **すべてを Suspense でラップしない**

   ```typescript
   // ❌ 過度なSuspense
   <Suspense>
     <Suspense>
       <Suspense>
         <Suspense>
           <Component />
         </Suspense>
       </Suspense>
     </Suspense>
   </Suspense>
   ```

2. **静的コンテンツを Suspense でラップしない**

   ```typescript
   // ❌ 不要なSuspense
   <Suspense fallback={<Skeleton />}>
     <h1>固定タイトル</h1>
   </Suspense>
   ```

3. **Suspense なしで await しない（Server Component 外）**
   ```typescript
   // ❌ Client Componentで直接await
   "use client";
   export default function Component() {
     const data = await fetchData(); // エラー！
     return <div>{data}</div>;
   }
   ```

## 10. トラブルシューティング

### 問題 1: Suspense が動作しない

**症状**: フォールバックが表示されない

**原因**: コンポーネントが非同期ではない

```typescript
// ❌ 同期コンポーネント
export function Component() {
  return <div>Content</div>;
}

// ✅ 非同期コンポーネント
export async function Component() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### 問題 2: "use client" で await できない

**症状**: クライアントコンポーネントで非同期処理

**解決策**: Server Component に分離

```typescript
// ❌ 間違い
"use client";
export default async function Page() {
  const data = await fetchData(); // エラー
  return <div>{data}</div>;
}

// ✅ 正しい
// Server Component
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// Client Component
("use client");
export function ClientComponent({ data }) {
  return <div>{data}</div>;
}
```

### 問題 3: ローディングが表示されない

**症状**: loading.tsx が適用されない

**原因**: ファイル配置の誤り

```
✅ 正しい配置:
app/
└── dashboard/
    ├── loading.tsx      ← /dashboard で動作
    └── page.tsx

❌ 間違った配置:
app/
├── dashboard/
│   └── page.tsx
└── loading.tsx          ← /dashboard では動作しない
```

## まとめ

### Streaming & Suspense の利点

- ✅ TTFB・FCP の大幅改善
- ✅ ユーザー体験の向上（即座にコンテンツ表示）
- ✅ SEO への影響最小化
- ✅ 並列データ取得による高速化
- ✅ 段階的なハイドレーション

### 実装チェックリスト

- [ ] 重要なコンテンツは即座に表示
- [ ] Suspense で遅延コンテンツを分離
- [ ] スケルトンローディングを実装
- [ ] 並列データ取得を活用
- [ ] loading.tsx でページローディング UI
- [ ] error.tsx でエラーハンドリング
- [ ] パフォーマンス測定（TTFB, FCP, LCP）

### パフォーマンス改善の例

| 手法             | 改善前 | 改善後 | 改善率 |
| ---------------- | ------ | ------ | ------ | --- |
| TTFB             | 2.5 秒 | 即座   | 100%   |
| FCP              | 2.5 秒 | 即座   | 100%   |
| 並列フェッチ     | 3 秒   | 1.5 秒 | 50%    | y   |
| ユーザー待機時間 | 2.5 秒 | 0 秒   | 100%   |

---

**実装日**: 2025-11-08
**プロジェクト**: `Projects/next16-sandbox/`
**Next.js**: 16.0.1
**参考**: `app/streaming/`, `app/streaming/components/`
