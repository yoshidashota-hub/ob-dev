---
created: 2025-11-08
tags: [project, nextjs, typescript, learning-path, extended]
status: 計画中
related:
  - "[[Next.js-16-Learning-Path]]"
---

# Next.js 16 拡張学習プラン

## 📋 概要

Phase 1 完了後、Next.js 16 の残りの重要機能を体系的に学習するための拡張プラン。

## ✅ Phase 1 完了項目（2025-11-08）

- [x] プロジェクトセットアップ & Turbopack
- [x] Cache Components (`use cache`)
- [x] Async Params
- [x] View Transitions

**成果物**: 11 ページ実装、4 ドキュメント作成

---

## 🚀 Phase 1.5: 実践応用（拡張）

### 1. Server Actions & Forms

**実装内容**:

- フォーム送信処理
- データ作成・更新・削除
- Optimistic UI
- `revalidatePath` / `revalidateTag`
- エラーハンドリング

**実装ファイル**:

```
app/
├── forms/
│   ├── create/page.tsx          # 作成フォーム
│   ├── edit/[id]/page.tsx       # 編集フォーム
│   └── delete/page.tsx          # 削除フォーム
├── actions/
│   ├── createPost.ts            # Server Action
│   ├── updatePost.ts
│   └── deletePost.ts
└── components/
    ├── SubmitButton.tsx         # useFormStatus使用
    └── OptimisticList.tsx       # useOptimistic使用
```

**ノート**: `Knowledge/Examples/server-actions-examples.md`

**学習ポイント**:

- Server Actions の基本
- `useFormStatus` / `useFormState` / `useOptimistic`
- Progressive エンハンスメント
- バリデーション（Zod 連携）

---

### 2. Streaming & Suspense

**実装内容**:

- ページの段階的レンダリング
- Suspense 境界の配置
- Loading Skeletons
- 並列データ取得

**実装ファイル**:

```
app/
├── streaming/
│   ├── page.tsx                 # Streamingデモ
│   ├── loading.tsx              # Loading UI
│   └── components/
│       ├── SlowComponent.tsx    # Suspense wrapped
│       └── Skeleton.tsx         # スケルトン
```

**ノート**: `Knowledge/Examples/streaming-suspense-examples.md`

**学習ポイント**:

- Streaming SSR の仕組み
- Suspense の適切な配置
- パフォーマンス最適化
- ユーザー体験向上

---

### 3. Error Handling

**実装内容**:

- エラーページ（`error.tsx`）
- 404 ページ（`not-found.tsx`）
- グローバルエラー（`global-error.tsx`）
- セグメントごとのエラー処理

**実装ファイル**:

```
app/
├── error.tsx                    # ルートエラー
├── global-error.tsx             # グローバルエラー
├── not-found.tsx                # 404ページ
└── products/
    ├── error.tsx                # セグメントエラー
    └── [id]/
        └── not-found.tsx        # 商品404
```

**ノート**: `Knowledge/Examples/error-handling-examples.md`

**学習ポイント**:

- Error Boundary の配置
- エラーリカバリー
- ユーザーフレンドリーなエラー表示
- ログ送信

---

### 4. Loading UI & Skeletons

**実装内容**:

- `loading.tsx`の実装
- スケルトンスクリーン
- プログレスバー
- ローディング状態管理

**実装ファイル**:

```
app/
├── products/
│   ├── loading.tsx              # 商品一覧ローディング
│   └── [id]/
│       └── loading.tsx          # 商品詳細ローディング
└── components/
    ├── LoadingSpinner.tsx
    ├── SkeletonCard.tsx
    └── ProgressBar.tsx
```

**ノート**: `Knowledge/Examples/loading-ui-examples.md`

**学習ポイント**:

- Instant Loading State
- Suspense Fallback
- スケルトンデザイン
- パフォーマンス指標

---

### 5. Route Handlers (API Routes) ✅

**実装内容**:

- GET/POST/PUT/DELETE エンドポイント
- リクエスト/レスポンス処理
- CORS 設定
- 認証サンプル実装

**実装ファイル**:

```
app/
├── api/
│   ├── posts/
│   │   ├── route.ts             # GET /api/posts, POST
│   │   └── [id]/
│   │       └── route.ts         # GET /api/posts/[id], PUT, DELETE
│   ├── auth/
│   │   └── route.ts             # POST /api/auth (login), DELETE (logout)
│   └── lib/
│       └── helpers.ts           # CORS & Error Handling helpers
└── api-demo/
    └── page.tsx                 # API呼び出しデモページ
```

**ノート**: `Knowledge/Examples/route-handlers-examples.md`

**学習ポイント**:

- RESTful API 設計
- リクエストハンドリング
- レスポンス形式の統一
- エラーハンドリング & CORS
- Cookie 操作（認証トークン）

**実装日**: 2025-11-08

---

### 6. Image & Font Optimization

**実装内容**:

- `next/image`コンポーネント
- 画像最適化設定
- Google Fonts 最適化
- カスタムフォント

**実装ファイル**:

```
app/
├── images/
│   ├── page.tsx                 # Imageデモ
│   └── gallery/page.tsx         # 画像ギャラリー
└── fonts/
    └── page.tsx                 # フォントデモ
```

**設定ファイル**:

```typescript
// next.config.ts
images: {
  domains: ['example.com'],
  formats: ['image/avif', 'image/webp'],
}
```

**ノート**: `Knowledge/Examples/optimization-examples.md`

**学習ポイント**:

- 画像の自動最適化
- レスポンシブ画像
- フォントのサブセット化
- パフォーマンス向上

---

### 7. Metadata API (SEO)

**実装内容**:

- 静的メタデータ
- 動的メタデータ
- Open Graph 画像
- Sitemap/Robots.txt

**実装ファイル**:

```
app/
├── layout.tsx                   # ルートメタデータ
├── blog/
│   └── [slug]/
│       └── page.tsx             # 動的OG画像
├── sitemap.ts                   # Sitemap生成
└── robots.ts                    # Robots.txt
```

**ノート**: `Knowledge/Examples/metadata-seo-examples.md`

**学習ポイント**:

- SEO 最適化
- ソーシャルシェア対応
- 検索エンジン対策
- メタデータ継承

---

### 8. Middleware

**実装内容**:

- 認証チェック
- リダイレクト処理
- ヘッダー追加
- A/B テスト

**実装ファイル**:

```
middleware.ts                    # ルートミドルウェア
app/
└── admin/
    └── middleware.ts            # 管理画面ミドルウェア
```

**ノート**: `Knowledge/Examples/middleware-examples.md`

**学習ポイント**:

- Edge Runtime
- リクエストインターセプト
- 認証フロー
- パフォーマンス考慮

---

### 9. Route Groups & Layouts

**実装内容**:

- Route Groups `(group)`
- 複数レイアウト
- ネストしたレイアウト
- レイアウト継承

**実装ファイル**:

```
app/
├── (marketing)/
│   ├── layout.tsx               # マーケティングレイアウト
│   ├── about/page.tsx
│   └── contact/page.tsx
├── (shop)/
│   ├── layout.tsx               # ショップレイアウト
│   ├── products/page.tsx
│   └── cart/page.tsx
└── (admin)/
    ├── layout.tsx               # 管理画面レイアウト
    └── dashboard/page.tsx
```

**ノート**: `Knowledge/Examples/route-groups-examples.md`

**学習ポイント**:

- URL に影響しないグループ化
- レイアウトの使い分け
- コード整理
- 保守性向上

---

### 10. Parallel & Intercepting Routes

**実装内容**:

- Parallel Routes `@slot`
- Intercepting Routes `(.)`
- モーダル実装
- 複雑なレイアウト

**実装ファイル**:

```
app/
├── @modal/
│   └── (.)photos/[id]/page.tsx  # モーダル
├── @team/
│   └── page.tsx                 # チームスロット
├── @analytics/
│   └── page.tsx                 # 分析スロット
└── layout.tsx                   # Parallel Routes使用
```

**ノート**: `Knowledge/Examples/advanced-routing-examples.md`

**学習ポイント**:

- 複雑な UI 構成
- モーダルパターン
- 並列レンダリング
- ルートインターセプト

---

## 📅 推奨スケジュール（Phase 1.5）

### Week 1: Forms & Data

- Day 1-2: Server Actions 基礎
- Day 3-4: フォーム実装
- Day 5-7: Optimistic UI

### Week 2: UI States

- Day 1-2: Streaming & Suspense
- Day 3-4: Error Handling
- Day 5-7: Loading UI

### Week 3: API & Optimization

- Day 1-2: Route Handlers
- Day 3-4: Image & Font 最適化
- Day 5-7: Metadata & SEO

### Week 4: Advanced Routing

- Day 1-2: Middleware
- Day 3-4: Route Groups
- Day 5-7: Parallel & Intercepting Routes

---

## 🎯 学習優先度

### 🔥 最優先（すぐに使う）

1. **Server Actions** - フォーム処理の基本
2. **Error Handling** - 本番環境必須
3. **Loading UI** - UX 向上
4. **Metadata API** - SEO 対策

### ⭐ 重要（プロジェクトで頻繁に使用）

5. **Route Handlers** - API 構築
6. **Image Optimization** - パフォーマンス
7. **Streaming & Suspense** - UX 向上
8. **Middleware** - 認証・セキュリティ

### 📚 応用（大規模アプリで使用）

9. **Route Groups** - コード整理
10. **Parallel Routes** - 複雑な UI

---

## 📊 全体の進捗

```
Phase 1: 基礎機能 ✅ 完了 (4/4)
├── ✅ Turbopack & Setup
├── ✅ Cache Components
├── ✅ Async Params
└── ✅ View Transitions

Phase 1.5: 応用機能 ⏳ 計画中 (0/10)
├── ⏹️ Server Actions
├── ⏹️ Streaming & Suspense
├── ⏹️ Error Handling
├── ⏹️ Loading UI
├── ⏹️ Route Handlers
├── ⏹️ Image & Font Optimization
├── ⏹️ Metadata API
├── ⏹️ Middleware
├── ⏹️ Route Groups
└── ⏹️ Parallel Routes

Phase 2: 理論深掘り ⏹️ 未着手
Phase 3: 横展開・比較 ⏹️ 未着手
```

---

## 🚀 次のアクション

### オプション 1: 優先度順に実装

最優先の**Server Actions**から開始

### オプション 2: カテゴリ別に実装

**Forms & Data**カテゴリから順番に

### オプション 3: 興味のある機能から

好きな機能を選んで実装

---

どのアプローチで進めますか？

**推奨**: Server Actions から始めると、実践的なアプリケーション構築スキルが身につきます！

---

**作成日**: 2025-11-08
**Phase 1 完了日**: 2025-11-08
**次の目標**: Phase 1.5 - Server Actions 実装
