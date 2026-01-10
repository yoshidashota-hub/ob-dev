---
created: 2025-11-10
tags:
  [
    nextjs,
    parallel-routes,
    intercepting-routes,
    modals,
    routing,
    advanced,
    examples,
  ]
status: 完了
related:
  - "[[route-groups-examples]]"
  - "[[Next.js-16-Extended-Learning-Path]]"
---

# Parallel & Intercepting Routes 実装例

Next.js 16 の Parallel Routes と Intercepting Routes を組み合わせた高度なルーティングパターンの実装例。

## 📋 概要

この実装例では、2 つの強力なルーティング機能を組み合わせています。

### Parallel Routes（並列ルート）

- **同時レンダリング** - 複数のページを同じレイアウト内で同時に表示
- **スロット構文** - `@slot` でスロットを定義
- **条件付き表示** - スロットごとに異なるコンテンツ
- **独立したローディング** - 各スロットが独立してロード

### Intercepting Routes（インターセプトルート）

- **クライアント遷移の制御** - Link クリック時に別のページを表示
- **URL の維持** - URL は目的地だが、表示は別のコンポーネント
- **直接アクセスとの分離** - ブラウザの直接アクセスは通常のページ
- **モーダルパターン** - モーダル UI の実装に最適

---

## 🎯 ユースケース

### 1. フォトギャラリー & モーダル

```
ギャラリー画面でサムネイルをクリック
  → モーダルで大きく表示（URL は /photos/photo/1）
  → ブラウザバックでギャラリーに戻る
  → 直接 URL を開くと専用ページ表示
```

### 2. ソーシャルメディア風 UI

```
タイムライン画面で投稿をクリック
  → モーダルで詳細表示（URL は /posts/123）
  → リロードすると投稿の専用ページ
```

### 3. E コマース商品詳細

```
商品一覧で商品をクリック
  → モーダルで簡易詳細表示
  → 「もっと見る」で専用ページへ
```

---

## 📂 ファイル構造

### 基本的な構造

```
app/
├── photos/
│   ├── layout.tsx              # Parallel Routes を使用
│   ├── page.tsx                # メイン: 写真グリッド
│   ├── @modal/                 # モーダル用スロット
│   │   ├── (.)photo/           # Intercepting Routes
│   │   │   └── [id]/
│   │   │       └── page.tsx    # モーダル表示
│   │   └── default.tsx         # フォールバック
│   └── photo/
│       └── [id]/
│           └── page.tsx        # 専用ページ
```

---

## 🔧 実装の詳細

### 1. Layout with Parallel Routes

```typescript
// app/photos/layout.tsx
export default function PhotosLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div>
      {/* メインコンテンツ */}
      {children}

      {/* モーダルスロット */}
      {modal}
    </div>
  );
}
```

**ポイント:**

- `modal` は `@modal` フォルダから自動的に提供される
- `children` は通常のページコンテンツ
- 両方が同時にレンダリングされる

---

### 2. 写真グリッドページ

```typescript
// app/photos/page.tsx
import Link from "next/link";

export default function PhotosPage() {
  return (
    <div>
      <h1>Photo Gallery</h1>
      <div className="grid">
        {photos.map((photo) => (
          <Link key={photo.id} href={`/photos/photo/${photo.id}`}>
            {/* 写真サムネイル */}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**ポイント:**

- Link で `/photos/photo/[id]` に遷移
- クライアント遷移時にインターセプトされる
- 直接 URL アクセス時はインターセプトされない

---

### 3. Intercepting Route（モーダル）

```typescript
// app/photos/@modal/(.)photo/[id]/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function PhotoModal({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const photo = getPhoto(id);

  return (
    <div className="fixed inset-0 bg-black/80" onClick={() => router.back()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* モーダルコンテンツ */}
        <button onClick={() => router.back()}>閉じる</button>
      </div>
    </div>
  );
}
```

**ポイント:**

- `(.)photo` で同じディレクトリレベルからインターセプト
- `"use client"` が必要（`useRouter` を使用）
- `router.back()` でモーダルを閉じる

---

### 4. 専用ページ

```typescript
// app/photos/photo/[id]/page.tsx
export default function PhotoPage({ params }) {
  const { id } = use(params);
  const photo = getPhoto(id);

  return (
    <div>
      <h1>{photo.title}</h1>
      {/* 専用ページのコンテンツ */}
      <Link href="/photos">← ギャラリーに戻る</Link>
    </div>
  );
}
```

**ポイント:**

- 直接 URL アクセス時に表示
- モーダル内でリロード時にも表示
- より詳細な情報を表示可能

---

### 5. Default Fallback

```typescript
// app/photos/@modal/default.tsx
export default function Default() {
  return null;
}
```

**ポイント:**

- モーダルが表示されていない時のフォールバック
- Parallel Routes では各スロットに `default.tsx` が必要
- `null` を返すことで何も表示しない

---

## 🔀 Intercepting Patterns

### インターセプトマーカー

| パターン   | 意味                   | 使用例                                                      |
| ---------- | ---------------------- | ----------------------------------------------------------- |
| `(.)`      | 同じディレクトリレベル | `/photos` から `/photos/photo/[id]` をインターセプト        |
| `(..)`     | 1 つ上のディレクトリ   | `/photos/detail` から `/photos/photo/[id]` をインターセプト |
| `(..)(..)` | 2 つ上のディレクトリ   | `/a/b/c` から `/a/x` をインターセプト                       |
| `(...)`    | ルート（app）から      | どこからでもルート配下をインターセプト                      |

---

### パターン 1: 同じレベル `(.)`

```
app/
├── photos/
│   ├── @modal/
│   │   └── (.)photo/      # /photos から /photos/photo をインターセプト
│   │       └── [id]/
│   └── photo/
│       └── [id]/
```

---

### パターン 2: 1 つ上 `(..)`

```
app/
├── dashboard/
│   ├── @modal/
│   │   └── (..)posts/     # /dashboard から /posts をインターセプト
│   │       └── [id]/
├── posts/
│   └── [id]/
```

---

### パターン 3: ルートから `(...)`

```
app/
├── feed/
│   ├── @modal/
│   │   └── (...)photo/    # /feed から /photo をインターセプト（ルート基準）
│   │       └── [id]/
├── photo/
│   └── [id]/
```

---

## 🌊 ナビゲーションフロー

### クライアント遷移（Link クリック）

```
1. ユーザーがギャラリーで写真をクリック
   ↓
2. Link が /photos/photo/1 への遷移を開始
   ↓
3. Intercepting Routes が遷移をキャッチ
   ↓
4. @modal/(.)photo/[id]/page.tsx がレンダリング
   ↓
5. URL は /photos/photo/1 に変わるが、モーダル表示
   ↓
6. ブラウザバックでギャラリーに戻る
```

---

### 直接 URL アクセス

```
1. ユーザーが /photos/photo/1 を直接開く
   ↓
2. Intercepting Routes は動作しない
   ↓
3. photo/[id]/page.tsx が通常通りレンダリング
   ↓
4. 専用ページが表示される
```

---

### モーダル内でリロード

```
1. モーダル表示中（URL: /photos/photo/1）
   ↓
2. ユーザーが F5 でリロード
   ↓
3. Intercepting Routes は動作しない
   ↓
4. photo/[id]/page.tsx がレンダリング
   ↓
5. モーダルから専用ページに切り替わる
```

---

## 💡 実装のポイント

### 1. useRouter().back() でモーダルを閉じる

```typescript
"use client";

import { useRouter } from "next/navigation";

export default function Modal() {
  const router = useRouter();

  return <div onClick={() => router.back()}>{/* モーダル背景 */}</div>;
}
```

**重要:**

- `router.back()` はブラウザの「戻る」と同じ
- 履歴スタックをポップしてギャラリーに戻る
- URL も元に戻る

---

### 2. イベントバブリングの制御

```typescript
<div onClick={() => router.back()}>
  {/* 背景クリックでモーダルを閉じる */}
  <div onClick={(e) => e.stopPropagation()}>
    {/* モーダル内容はクリックしても閉じない */}
  </div>
</div>
```

---

### 3. default.tsx は必須

```typescript
// app/photos/@modal/default.tsx
export default function Default() {
  return null;
}
```

**理由:**

- Parallel Routes の各スロットにはフォールバックが必要
- モーダルが表示されていない時に `null` を返す
- これがないとエラーになる

---

### 4. Server Component vs Client Component

**モーダル（Intercepting Route）:**

```typescript
"use client"; // useRouter を使うため Client Component
```

**専用ページ:**

```typescript
// "use client" なし - Server Component でOK
// データフェッチングに有利
```

---

## 🎨 UI パターン

### パターン 1: フルスクリーンモーダル

```typescript
<div className="fixed inset-0 z-50 bg-black/80">
  <div className="h-full flex items-center justify-center">
    {/* コンテンツ */}
  </div>
</div>
```

---

### パターン 2: センターモーダル

```typescript
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
  <div className="bg-white rounded-lg max-w-2xl w-full">{/* コンテンツ */}</div>
</div>
```

---

### パターン 3: スライドインパネル

```typescript
<div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl">
  {/* サイドパネル */}
</div>
```

---

## 🔍 デバッグ

### レンダリング確認

```typescript
// layout.tsx
export default function PhotosLayout({ children, modal }) {
  console.log("Layout rendered", {
    hasChildren: !!children,
    hasModal: !!modal,
  });

  return (
    <div>
      {children}
      {modal}
    </div>
  );
}
```

---

### インターセプト確認

```typescript
// @modal/(.)photo/[id]/page.tsx
export default function PhotoModal({ params }) {
  console.log("Modal intercepted!", params);
  // ...
}

// photo/[id]/page.tsx
export default function PhotoPage({ params }) {
  console.log("Direct page rendered!", params);
  // ...
}
```

**確認方法:**

- Link クリック時 → "Modal intercepted!" が表示
- 直接 URL → "Direct page rendered!" が表示

---

## 🚀 実装済みファイル

### プロジェクト内の実装

```
next16-sandbox/
├── app/
│   └── photos/
│       ├── layout.tsx                          # Parallel Routes レイアウト
│       ├── page.tsx                            # 写真グリッド
│       ├── @modal/
│       │   ├── (.)photo/
│       │   │   └── [id]/
│       │   │       └── page.tsx                # モーダル表示
│       │   └── default.tsx                     # モーダルフォールバック
│       └── photo/
│           └── [id]/
│               └── page.tsx                    # 専用ページ
```

### アクセス方法

- **ギャラリー**: http://localhost:3000/photos
- **写真クリック**: モーダル表示（URL は /photos/photo/1 など）
- **直接 URL**: http://localhost:3000/photos/photo/1 → 専用ページ表示

---

## 🎯 ベストプラクティス

### 1. モーダルは Client Component

```typescript
// ✅ 正しい
"use client";

import { useRouter } from "next/navigation";

export default function Modal() {
  const router = useRouter();
  // ...
}
```

```typescript
// ❌ 間違い
// "use client" なしで useRouter は使えない
export default function Modal() {
  const router = useRouter(); // エラー!
}
```

---

### 2. 専用ページは Server Component

```typescript
// ✅ 正しい - デフォルトで Server Component
export default async function PhotoPage({ params }) {
  const photo = await fetchPhoto(params.id);
  return <div>{photo.title}</div>;
}
```

---

### 3. default.tsx を忘れずに

```typescript
// ✅ すべての Parallel Route スロットに必要
// app/photos/@modal/default.tsx
export default function Default() {
  return null;
}
```

---

### 4. インターセプトパスは正確に

```typescript
// ✅ 正しい
// /photos から /photos/photo/[id] をインターセプト
app/photos/@modal/(.)photo/[id]/page.tsx

// ❌ 間違い
app/photos/@modal/photo/[id]/page.tsx  // インターセプトしない
```

---

### 5. アクセシビリティ

```typescript
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">{photo.title}</h2>
  <button onClick={() => router.back()} aria-label="モーダルを閉じる">
    ×
  </button>
</div>
```

---

## ⚠️ よくある問題

### 問題 1: モーダルが表示されない

**原因:**

- `default.tsx` がない
- インターセプトパスが間違っている

**解決策:**

```typescript
// @modal/default.tsx を作成
export default function Default() {
  return null;
}
```

---

### 問題 2: 直接アクセスでもモーダルが表示される

**原因:**

- インターセプトパターンの誤用

**解決策:**

- Intercepting Routes は**クライアント遷移のみ**動作
- 直接 URL アクセスでは通常のページが表示されるのが正常

---

### 問題 3: router.back() が動作しない

**原因:**

- Server Component で `useRouter` を使用

**解決策:**

```typescript
"use client"; // これを追加

import { useRouter } from "next/navigation";
```

---

## 🔄 他のパターンとの組み合わせ

### Parallel Routes + Loading UI

```typescript
// app/photos/@modal/loading.tsx
export default function ModalLoading() {
  return <div className="fixed inset-0 bg-black/50">Loading...</div>;
}
```

---

### Parallel Routes + Error Handling

```typescript
// app/photos/@modal/error.tsx
"use client";

export default function ModalError({ error, reset }) {
  return (
    <div className="fixed inset-0 bg-black/80">
      <div className="modal">
        <h2>エラーが発生しました</h2>
        <p>{error.message}</p>
        <button onClick={reset}>再試行</button>
      </div>
    </div>
  );
}
```

---

### Multiple Parallel Routes

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  notifications,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  notifications: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <aside>
        {analytics}
        {notifications}
      </aside>
    </div>
  );
}
```

構造:

```
app/dashboard/
├── @analytics/
│   └── page.tsx
├── @notifications/
│   └── page.tsx
└── page.tsx
```

---

## 📊 パフォーマンス

### メリット

✅ **URL ベースのルーティング**

- ブラウザ履歴が適切に管理される
- 共有可能な URL

✅ **Code Splitting**

- モーダルと専用ページで別々のチャンク
- 必要なコードのみロード

✅ **Streaming**

- Parallel Routes は独立してストリーミング可能

---

### 注意点

⚠️ **重複コンポーネント**

- モーダルと専用ページで同じコンポーネントを使用する場合は共通化

```typescript
// components/PhotoDetail.tsx
export function PhotoDetail({ photo }) {
  return <div>{/* 共通UI */}</div>;
}

// モーダルと専用ページ両方で使用
import { PhotoDetail } from "@/components/PhotoDetail";
```

---

## 📚 参考リンク

- [Next.js Parallel Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [Next.js Intercepting Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)

---

## 🎓 学習のポイント

1. **Parallel Routes** - `@slot` で複数のページを同時にレンダリング
2. **Intercepting Routes** - `(.)`, `(..)`, `(...)` でルートをインターセプト
3. **モーダルパターン** - URL を変更しつつモーダル表示
4. **default.tsx** - 各 Parallel Route スロットに必須
5. **クライアント遷移** - Intercepting Routes はクライアント遷移のみ動作
6. **直接アクセス** - 直接 URL アクセスは通常のページ表示
7. **router.back()** - モーダルを閉じて履歴を戻す

---

**作成日**: 2025-11-10
**Phase 1.5**: Parallel & Intercepting Routes 実装完了
