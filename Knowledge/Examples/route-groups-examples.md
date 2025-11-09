---
created: 2025-11-08
tags: [nextjs, route-groups, layouts, routing, organization, examples]
status: 完了
related:
  - "[[middleware-examples]]"
  - "[[Next.js-16-Extended-Learning-Path]]"
---

# Route Groups & Layouts 実装例

Next.js 16 の Route Groups を使ったルート整理と複数レイアウトの実装例。

## 📋 概要

Route Groups は、URL 構造に影響を与えずにルートを論理的にグループ化できる機能です。

### 主な特徴

- **URL に影響しない** - `(group)` はURL に含まれない
- **レイアウトの分離** - グループごとに異なるレイアウト
- **コードの整理** - 関連ルートをグループ化
- **複数のルートレイアウト** - 1つのアプリで複数のレイアウト
- **柔軟な構成** - ネスト可能なグループ構造

---

## 📂 基本的な使い方

### 1. Route Groups の作成

フォルダ名を括弧 `()` で囲むと、Route Group になります。

```
app/
├── (marketing)/
│   ├── layout.tsx       # マーケティング用レイアウト
│   ├── about/
│   │   └── page.tsx     # URL: /about
│   └── contact/
│       └── page.tsx     # URL: /contact
├── (shop)/
│   ├── layout.tsx       # ショップ用レイアウト
│   ├── products/
│   │   └── page.tsx     # URL: /products
│   └── cart/
│       └── page.tsx     # URL: /cart
└── page.tsx             # URL: /
```

**ポイント:**
- `(marketing)` と `(shop)` は URL に含まれない
- `/about` は `/(marketing)/about` ではない
- 各グループに独自の `layout.tsx` を配置可能

---

## 🎨 複数レイアウトの実装

### 1. マーケティングレイアウト

```typescript
// app/(marketing)/layout.tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* マーケティング用ヘッダー */}
      <header className="bg-purple-900 text-white">
        <nav>
          <a href="/">ホーム</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        {children}
      </main>

      {/* マーケティング用フッター */}
      <footer className="bg-purple-900 text-white">
        <p>© 2025 Marketing Hub</p>
      </footer>
    </div>
  );
}
```

---

### 2. ショップレイアウト

```typescript
// app/(shop)/layout.tsx
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ショップ用ヘッダー */}
      <header className="bg-blue-900 text-white">
        <nav>
          <a href="/">ホーム</a>
          <a href="/products">商品一覧</a>
          <a href="/cart">🛒 カート</a>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        {children}
      </main>

      {/* ショップ用フッター */}
      <footer className="bg-blue-900 text-white">
        <p>© 2025 Shop Hub</p>
      </footer>
    </div>
  );
}
```

---

## 🔄 レイアウト継承

### ルートレイアウトとの併用

```typescript
// app/layout.tsx（ルートレイアウト）
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {/* すべてのページに適用される */}
        {children}
      </body>
    </html>
  );
}

// app/(marketing)/layout.tsx（グループレイアウト）
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* マーケティングページにのみ適用 */}
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
```

**レイアウトの適用順序:**
```
app/layout.tsx
  └── app/(marketing)/layout.tsx
      └── app/(marketing)/about/page.tsx
```

---

## 💡 実用的なパターン

### パターン 1: 認証状態で分ける

```
app/
├── (public)/            # 未認証でもアクセス可能
│   ├── layout.tsx       # シンプルなレイアウト
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (dashboard)/         # 認証必須
│   ├── layout.tsx       # ダッシュボードレイアウト
│   ├── profile/
│   ├── settings/
│   └── analytics/
└── (admin)/             # 管理者のみ
    ├── layout.tsx       # 管理者レイアウト
    ├── users/
    └── reports/
```

---

### パターン 2: 言語で分ける

```
app/
├── (ja)/                # 日本語
│   ├── layout.tsx       # 日本語用レイアウト
│   └── about/
├── (en)/                # 英語
│   ├── layout.tsx       # 英語用レイアウト
│   └── about/
└── page.tsx             # 言語選択ページ
```

---

### パターン 3: 機能で分ける

```
app/
├── (marketing)/
│   ├── about/
│   ├── pricing/
│   └── contact/
├── (app)/
│   ├── dashboard/
│   ├── projects/
│   └── team/
└── (docs)/
    ├── getting-started/
    ├── api-reference/
    └── examples/
```

---

## 🚫 Route Groups を使わない場合

### 問題点

```
app/
├── layout.tsx           # 全体に適用される
├── about/
│   └── page.tsx         # このレイアウトを変えたい...
├── products/
│   └── page.tsx         # こちらも別のレイアウトにしたい...
└── cart/
    └── page.tsx
```

**制約:**
- すべてのページに同じレイアウト
- ページごとにレイアウトを変えるのが困難
- コードの整理がしにくい

---

## ✅ Route Groups を使った場合

### 解決策

```
app/
├── layout.tsx           # ルートレイアウト（共通）
├── (marketing)/
│   ├── layout.tsx       # マーケティング用
│   ├── about/
│   │   └── page.tsx
│   └── contact/
│       └── page.tsx
└── (shop)/
    ├── layout.tsx       # ショップ用
    ├── products/
    │   └── page.tsx
    └── cart/
        └── page.tsx
```

**メリット:**
- グループごとに異なるレイアウト
- URL 構造はシンプルに保てる
- コードが整理されて保守しやすい

---

## 🔧 実装のポイント

### 1. URL 構造の設計

**悪い例:**
```
app/
├── marketing-about/     # URL: /marketing-about
└── marketing-contact/   # URL: /marketing-contact
```

**良い例:**
```
app/
└── (marketing)/
    ├── about/           # URL: /about
    └── contact/         # URL: /contact
```

---

### 2. レイアウトの共通化

```typescript
// app/(marketing)/layout.tsx
import { MarketingHeader } from "@/components/marketing/Header";
import { MarketingFooter } from "@/components/marketing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
```

**ポイント:**
- ヘッダー・フッターはコンポーネント化
- レイアウトファイルはシンプルに
- スタイルはグループごとに統一

---

### 3. メタデータの設定

```typescript
// app/(marketing)/about/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "会社概要",
};

export default function AboutPage() {
  return <div>About Content</div>;
}
```

---

## 📊 Route Groups の使い分け

### 使うべき場合

✅ **異なるレイアウトが必要**
```
(marketing) → シンプルなレイアウト
(app) → ダッシュボードレイアウト
```

✅ **論理的なグループ化**
```
(docs) → ドキュメント関連
(blog) → ブログ関連
```

✅ **コードの整理**
```
(admin) → 管理画面機能
(api) → API関連
```

---

### 使わなくても良い場合

❌ **単純なネスト**
```
app/
└── products/
    └── [id]/page.tsx    # Route Groupsは不要
```

❌ **URL構造を変えたい場合**
```
# Route Groupsでは URL は変わらない
# 代わりに rewrites を使用
```

---

## 🚀 実装済みファイル

### プロジェクト内の実装

```
next16-sandbox/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx       # マーケティングレイアウト
│   │   ├── about/
│   │   │   └── page.tsx     # About ページ
│   │   └── contact/
│   │       └── page.tsx     # Contact ページ
│   └── (shop)/
│       ├── layout.tsx       # ショップレイアウト
│       └── cart/
│           └── page.tsx     # カートページ
```

### アクセス方法

- **About**: http://localhost:3000/about （マーケティングレイアウト）
- **Contact**: http://localhost:3000/contact （マーケティングレイアウト）
- **Cart**: http://localhost:3000/cart （ショップレイアウト）
- **Products**: http://localhost:3000/products （既存の products ページ）

---

## 💡 ベストプラクティス

### 1. グループ名は小文字で統一

```
✅ (marketing)
✅ (shop)
✅ (admin)

❌ (Marketing)
❌ (SHOP)
```

---

### 2. グループは必要最小限に

```typescript
// 悪い例: 過度な分割
(page1)/
(page2)/
(page3)/

// 良い例: 論理的なグループ
(public)/
(dashboard)/
(admin)/
```

---

### 3. レイアウトの一貫性

```typescript
// すべてのグループレイアウトで同じ構造
export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

---

### 4. 共通コンポーネントの活用

```typescript
// components/layouts/BaseLayout.tsx
export function BaseLayout({
  header,
  children,
  footer
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}

// app/(marketing)/layout.tsx
import { BaseLayout } from "@/components/layouts/BaseLayout";

export default function MarketingLayout({ children }) {
  return (
    <BaseLayout
      header={<MarketingHeader />}
      footer={<MarketingFooter />}
    >
      {children}
    </BaseLayout>
  );
}
```

---

## 🔍 デバッグ

### レイアウトが適用されているか確認

```typescript
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }) {
  console.log("Marketing Layout Rendered");

  return (
    <div data-layout="marketing">
      {children}
    </div>
  );
}
```

ブラウザの開発者ツールで `data-layout` 属性を確認できます。

---

## 📚 参考リンク

- [Next.js Route Groups Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js Layouts Documentation](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)

---

## 🎓 学習のポイント

1. **URL に影響しない** - `(group)` は URL パスに含まれない
2. **レイアウトの分離** - グループごとに異なるレイアウト
3. **コードの整理** - 関連ルートを論理的にグループ化
4. **柔軟な構成** - 複数のレイアウトを1つのアプリで使用
5. **保守性向上** - 機能ごとにファイルを整理

---

**作成日**: 2025-11-08
**Phase 1.5**: Route Groups & Layouts 実装完了
