---
created: 2025-11-07
tags: [learning, typescript, nextjs, react, web-development]
status: 進行中
topic: Next.js 16
source: https://nextjs.org/blog/next-16
---

# Next.js 16

## 概要

Next.js 16は2025年10月にリリースされた最新バージョン。Turbopackの安定化、新しいキャッシュシステム、React 19.2統合など、パフォーマンスと開発体験の大幅な改善が含まれている。

## 学んだこと

### 🚀 Turbopack（安定版）

- **すべての新規プロジェクトでデフォルト**のバンドラーに
- **2〜5倍高速な本番ビルド**
- **最大10倍高速なFast Refresh**
- `next dev`と`next build`の両方でデフォルト使用
- 設定不要で動作

**パフォーマンス:**
```
従来のWebpack:
- Fast Refresh: 遅い
- ビルド: 基準

Turbopack:
- Fast Refresh: 5〜10倍高速
- ビルド: 2〜5倍高速
```

### 📦 Cache Components（キャッシュコンポーネント）

新しい`use cache`ディレクティブによる**明示的なキャッシュ制御**。

**特徴:**
- ページ、コンポーネント、関数をキャッシュ可能
- **完全なオプトイン方式**（従来の暗黙的キャッシュと異なる）
- コンパイラが自動的にキャッシュキーを生成
- デフォルトではすべてリクエスト時に実行

**従来との違い:**
| 項目 | Next.js 15以前 | Next.js 16 |
|------|---------------|-----------|
| キャッシュ方式 | 暗黙的（自動） | 明示的（opt-in） |
| デフォルト動作 | 静的キャッシュ | リクエスト時実行 |
| 制御の柔軟性 | 低い | 高い |

**使用例:**
```typescript
'use cache'

export default async function CachedComponent() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

### 🔄 proxy.ts の導入

**middleware.tsの後継**として`proxy.ts`が導入。

**目的:**
- ネットワーク境界の明確化
- より分かりやすい命名

**移行方法:**
```typescript
// 旧: middleware.ts
export function middleware(req) { ... }

// 新: proxy.ts
export function proxy(req) { ... }
```

### ⚛️ React 19.2 統合

App Routerが**React 19.2の最新機能**を使用。

**主要機能:**
- **View Transitions**: トランジション内の要素アニメーション
- **useEffectEvent**: Effect内の非リアクティブロジックの再利用
- **Activity Component**: UI非表示時の状態保持とEffectsのクリーンアップ

```typescript
// View Transitions例
function MyComponent() {
  return (
    <div style={{ viewTransitionName: 'my-element' }}>
      {/* アニメーション対象 */}
    </div>
  )
}
```

### 🧠 React Compiler（安定版）

**ゼロコード変更で自動最適化**。

**機能:**
- コンポーネントを自動メモ化
- 不要な再レンダリングを削減
- 手動での`useMemo`、`useCallback`が不要に

**従来の手動最適化:**
```typescript
// 手動メモ化が必要だった
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])
const memoizedCallback = useCallback(() => { doSomething() }, [])
```

**React Compiler使用時:**
```typescript
// コンパイラが自動で最適化
const value = computeExpensiveValue(a, b)
const callback = () => { doSomething() }
```

### 🛠️ Next.js DevTools MCP

**AI支援デバッグ**のためのModel Context Protocol統合。

**機能:**
- アプリケーションのコンテキストに基づくインサイト
- AIエージェントによる問題診断
- 動作説明と修正提案
- 開発ワークフロー内での直接統合

### ⚡ ルーティングの改善

**ページ遷移の大幅な最適化**。

**改善点:**
- 共有レイアウトの重複ダウンロード削減
- 複数URLのプリフェッチ時、レイアウトは1回のみダウンロード

**例:**
```
従来: 50個の製品リンク → 共有レイアウトを50回ダウンロード
Next.js 16: 50個の製品リンク → 共有レイアウトを1回のみダウンロード
```

### 🔨 破壊的変更: 非同期パラメータ

**同期アクセスが完全削除**。

**影響を受けるAPI:**
- `layout.js`の`params`
- `page.js`の`params`
- `route.js`の`params`
- `default.js`の`params`
- `opengraph-image`
- `twitter-image`
- `icon`
- `apple-icon`

**移行例:**
```typescript
// 旧: 同期アクセス
export default function Page({ params }) {
  const { id } = params  // ❌ エラー
  return <div>{id}</div>
}

// 新: 非同期アクセス
export default async function Page({ params }) {
  const { id } = await params  // ✅ 正しい
  return <div>{id}</div>
}
```

### 📊 開発体験の改善

- **改善されたログ出力**: ビルドと開発リクエスト
- **拡張された開発リクエストログ**: 時間消費の可視化
- より詳細なデバッグ情報

## 実例・サンプルコード

### Cache Components の実装

```typescript
// app/products/page.tsx
'use cache'

async function getProducts() {
  const res = await fetch('https://api.example.com/products')
  return res.json()
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### 非同期paramsへの移行

```typescript
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  // paramsをawaitする
  const { slug } = await params

  const post = await getPost(slug)

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}
```

### proxy.ts の設定

```typescript
// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // カスタムヘッダーの追加
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-custom-header', 'value')

  // 認証チェック
  const token = request.cookies.get('auth-token')
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### React Compiler の有効化

```javascript
// next.config.js
module.exports = {
  experimental: {
    reactCompiler: true,
  },
}
```

## 疑問点・次にやること

- [ ] Cache Componentsの詳細なキャッシュ戦略を実践
- [ ] Turbopackと従来のWebpackのベンチマーク比較
- [ ] React 19.2のView Transitionsを使ったアニメーション実装
- [ ] Next.js DevTools MCPの具体的な使用方法を調査
- [ ] 既存プロジェクトのNext.js 16へのマイグレーション計画
- [ ] 非同期paramsへの移行でのエラーハンドリング方法

## 関連リンク

- [Next.js 16 公式ブログ](https://nextjs.org/blog/next-16)
- [Next.js 16 Beta 発表](https://nextjs.org/blog/next-16-beta)
- [バージョン16へのアップグレードガイド](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [React 19.2 リリースノート](https://react.dev)
- [Turbopack 公式サイト](https://turbo.build/pack)

## メモ

### パフォーマンスへの影響

Next.js 16は特に大規模アプリケーションで顕著なパフォーマンス向上が期待できる：
- ビルド時間の短縮により開発サイクルが高速化
- Fast Refreshの高速化で開発体験が大幅改善
- ルーティング最適化により、多数のリンクがあるページでの体験向上

### 移行の注意点

1. **非同期params**: すべての`params`アクセスを`await`に変更する必要がある
2. **middleware → proxy**: ファイル名と関数名の変更が必要
3. **キャッシュ戦略**: 従来の暗黙的キャッシュに依存していた場合、明示的に`use cache`を追加する必要がある

### 実務での採用判断

**推奨:**
- 新規プロジェクト: 積極的に採用すべき
- 既存プロジェクト: 破壊的変更を確認した上で段階的に移行

**メリット:**
- パフォーマンス向上
- 開発体験の改善
- より明確なキャッシュ制御

**デメリット:**
- 非同期paramsへの移行コスト
- middleware.ts → proxy.tsの変更
- チームメンバーの学習コスト

---

*最終更新: 2025-11-07*
