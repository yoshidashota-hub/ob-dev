---
created: 2025-11-08
tags: [example, nextjs, error-handling, error-boundary, recovery]
status: 完了
related:
  - "[[Next.js-16-Setup]]"
  - "[[server-actions-examples]]"
  - "[[streaming-suspense-examples]]"
---

# Error Handling 実装例

## 概要

Next.js 16 のエラーハンドリング機能を使った、堅牢なエラー処理とユーザーフレンドリーなエラー表示の実装例。

## 実装場所

```
Projects/next16-sandbox/
├── app/
│   ├── error.tsx                     # ルートレベルエラー
│   ├── global-error.tsx              # グローバルエラー
│   ├── not-found.tsx                 # 404ページ
│   └── error-demo/
│       ├── page.tsx                  # デモページ
│       └── segment/
│           ├── page.tsx              # セグメントページ
│           └── error.tsx             # セグメント専用エラー
```

## Next.js のエラーハンドリングの仕組み

### Error Boundary の階層構造

Next.js は React の Error Boundary を自動的に適用し、階層的なエラーハンドリングを提供します。

```
app/
├── global-error.tsx       ← 最後の砦（ルートレイアウトエラーも処理）
├── layout.tsx
├── error.tsx             ← ルートエラー
├── page.tsx
└── products/
    ├── error.tsx        ← 製品セグメントエラー
    ├── page.tsx
    └── [id]/
        ├── error.tsx   ← 製品詳細エラー
        └── page.tsx
```

### エラー伝播の流れ

1. **最も近い error.tsx でキャッチ**
   ```
   app/products/[id]/page.tsx → エラー発生
   → app/products/[id]/error.tsx で処理
   ```

2. **親のエラーハンドラーへ伝播**
   ```
   error.tsx が存在しない場合
   → 親ディレクトリの error.tsx へ
   → ルートの error.tsx へ
   → global-error.tsx へ
   ```

3. **最後の砦: global-error.tsx**
   - ルートレイアウトのエラーもキャッチ
   - html, body タグを含める必要がある

## 1. error.tsx - 基本的なエラーページ

### 実装例

```typescript
// app/error.tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログを送信
    console.error("Application error:", error);

    // 本番環境ではエラー監視サービスへ送信
    // if (typeof window !== 'undefined') {
    //   Sentry.captureException(error);
    // }
  }, [error]);

  return (
    <div className="error-container">
      <h1>エラーが発生しました</h1>
      <p>{error.message}</p>

      {/* リトライボタン */}
      <button onClick={reset}>もう一度試す</button>

      {/* ホームに戻る */}
      <a href="/">ホームに戻る</a>
    </div>
  );
}
```

### 重要なポイント

1. **"use client" ディレクティブが必須**
   - Error Boundary は Client Component である必要がある

2. **props の型定義**
   ```typescript
   {
     error: Error & { digest?: string };  // エラーオブジェクト
     reset: () => void;                   // リセット関数
   }
   ```

3. **digest プロパティ**
   - Next.js が生成するエラーID
   - ログ追跡に使用

4. **reset 関数**
   - エラーが発生したコンポーネントを再レンダリング
   - 一時的なエラーからの復帰に有効

### 使用例

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  // データ取得でエラーが発生する可能性
  const products = await fetchProducts(); // エラー発生！

  return <ProductList products={products} />;
}

// エラーは app/products/error.tsx または app/error.tsx でキャッチ
```

## 2. global-error.tsx - グローバルエラー

### 実装例

```typescript
// app/global-error.tsx
"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div>
          <h1>重大なエラー</h1>
          <p>アプリケーションで予期しない問題が発生しました</p>
          <button onClick={reset}>アプリケーションを再起動</button>
        </div>
      </body>
    </html>
  );
}
```

### error.tsx との違い

| 項目 | error.tsx | global-error.tsx |
|------|-----------|------------------|
| 対象 | 通常のページエラー | ルートレイアウトエラー含む |
| html/body | 不要 | **必須** |
| 発動頻度 | 高い | 低い（最後の砦） |
| 本番環境 | 通常使用 | 重大なエラーのみ |

### 使用ケース

- ルートレイアウト (`app/layout.tsx`) でエラーが発生
- error.tsx が正常に機能しない
- React自体の初期化エラー

## 3. not-found.tsx - 404 ページ

### 実装例

```typescript
// app/not-found.tsx

export default function NotFound() {
  return (
    <div>
      <h1>404</h1>
      <h2>ページが見つかりません</h2>
      <p>お探しのページは存在しないか、移動または削除された可能性があります。</p>

      <a href="/">ホームに戻る</a>
    </div>
  );
}
```

### トリガー方法

#### 1. 存在しないルートへのアクセス

```
https://example.com/non-existent-page
→ not-found.tsx が表示される
```

#### 2. notFound() 関数を呼び出し

```typescript
// app/products/[id]/page.tsx
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);

  // 商品が見つからない場合
  if (!product) {
    notFound(); // not-found.tsx を表示
  }

  return <ProductDetail product={product} />;
}
```

### セグメント別の not-found

```
app/
├── not-found.tsx              ← ルートの404
└── products/
    └── [id]/
        └── not-found.tsx     ← 商品の404（カスタマイズ可能）
```

## 4. セグメント別エラーハンドリング

### ファイル構造

```
app/
├── error.tsx                    # ルートエラー
└── products/
    ├── error.tsx               # 製品セグメントエラー
    ├── page.tsx
    └── [id]/
        ├── error.tsx          # 製品詳細エラー
        └── page.tsx
```

### 実装例

```typescript
// app/products/[id]/error.tsx
"use client";

export default function ProductError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>商品の読み込みに失敗しました</h2>
      <p>{error.message}</p>

      {/* カスタマイズされたメッセージ */}
      <p>商品が削除されたか、一時的にアクセスできない可能性があります。</p>

      <button onClick={reset}>再読み込み</button>
      <a href="/products">商品一覧に戻る</a>
    </div>
  );
}
```

### 利点

1. **影響範囲の限定**
   - エラーが発生してもセグメント内に留まる
   - 他のページは正常動作

2. **カスタマイズ可能**
   - セグメントごとに異なるUI
   - セグメント固有のエラーメッセージ

3. **部分的なリカバリー**
   - エラーが発生したセグメントのみをリセット

## 5. エラーリカバリー

### reset 関数の使い方

```typescript
"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>エラーが発生しました</h2>

      {/* リトライボタン */}
      <button onClick={reset}>
        もう一度試す
      </button>
    </div>
  );
}
```

### reset 関数の動作

1. エラーが発生したコンポーネントツリーを再マウント
2. Server Component も再実行される
3. 新しいデータ取得が試行される

### 使用シナリオ

```typescript
// 一時的なネットワークエラーからの復帰
export default async function Page() {
  const data = await fetch('https://api.example.com/data'); // 失敗
  return <div>{data}</div>;
}

// ユーザーがresetボタンをクリック
// → Server Componentが再実行
// → fetchが再試行
// → 成功すれば正常表示
```

## 6. エラーログと監視

### エラーログの送信

```typescript
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    // 開発環境
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", error);
    }

    // 本番環境: エラー監視サービスへ送信
    if (process.env.NODE_ENV === "production") {
      Sentry.captureException(error, {
        tags: {
          section: "products",
        },
        extra: {
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
      });
    }
  }, [error]);

  return <div>エラーが発生しました</div>;
}
```

### 推奨エラー監視サービス

- **Sentry**: 最も人気のあるエラー追跡サービス
- **Datadog**: 総合的な監視プラットフォーム
- **LogRocket**: セッション再生機能付き
- **Rollbar**: リアルタイムエラー追跡

## 7. ベストプラクティス

### ✅ DO: 推奨される使い方

#### 1. ユーザーフレンドリーなメッセージ

```typescript
// ✅ 良い例
<div>
  <h2>エラーが発生しました</h2>
  <p>データの読み込みに失敗しました。しばらくしてから再度お試しください。</p>
</div>

// ❌ 悪い例
<div>
  <p>{error.message}</p> {/* 技術的すぎる */}
</div>
```

#### 2. リカバリーオプションの提供

```typescript
// ✅ 良い例
<div>
  <button onClick={reset}>再読み込み</button>
  <a href="/">ホームに戻る</a>
  <a href="/support">サポートに連絡</a>
</div>
```

#### 3. エラーログの適切な送信

```typescript
// ✅ 良い例
useEffect(() => {
  if (process.env.NODE_ENV === "production") {
    trackError(error);
  } else {
    console.error(error);
  }
}, [error]);
```

#### 4. セグメント別のエラーページ

```typescript
// ✅ 良い例: 重要なセグメントには専用エラーページ
app/
├── checkout/
│   └── error.tsx    ← チェックアウト専用（重要）
└── blog/
    └── [slug]/
        └── error.tsx ← ブログ記事専用
```

### ❌ DON'T: 避けるべき使い方

#### 1. エラー詳細の過度な露出

```typescript
// ❌ 避ける: 本番環境でスタックトレース表示
<pre>{error.stack}</pre> // セキュリティリスク
```

#### 2. エラーを握りつぶす

```typescript
// ❌ 避ける: エラーを無視
export default function Error() {
  return null; // エラーを隠蔽
}
```

#### 3. "use client" の忘れ

```typescript
// ❌ これはエラー
export default function Error({ error, reset }) {
  // "use client" がないとビルドエラー
}
```

## 8. 実践的なパターン

### パターン1: データフェッチエラー

```typescript
// app/products/[id]/error.tsx
"use client";

export default function ProductError({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  // エラータイプに応じた処理
  const is404 = error.message.includes("404");
  const isNetworkError = error.message.includes("network");

  if (is404) {
    return (
      <div>
        <h2>商品が見つかりません</h2>
        <a href="/products">商品一覧に戻る</a>
      </div>
    );
  }

  if (isNetworkError) {
    return (
      <div>
        <h2>接続エラー</h2>
        <p>インターネット接続を確認してください</p>
        <button onClick={reset}>再試行</button>
      </div>
    );
  }

  return (
    <div>
      <h2>エラーが発生しました</h2>
      <button onClick={reset}>再読み込み</button>
    </div>
  );
}
```

### パターン2: 認証エラー

```typescript
// app/dashboard/error.tsx
"use client";

export default function DashboardError({ error }: { error: Error }) {
  const isAuthError = error.message.includes("Unauthorized");

  if (isAuthError) {
    return (
      <div>
        <h2>認証が必要です</h2>
        <p>このページを表示するにはログインが必要です。</p>
        <a href="/login">ログインページへ</a>
      </div>
    );
  }

  return <div>エラーが発生しました</div>;
}
```

### パターン3: メンテナンスモード

```typescript
// app/error.tsx
"use client";

export default function Error({ error }: { error: Error }) {
  const isMaintenanceMode = error.message.includes("Maintenance");

  if (isMaintenanceMode) {
    return (
      <div>
        <h1>メンテナンス中</h1>
        <p>現在メンテナンス作業を行っています。しばらくお待ちください。</p>
        <p>完了予定: 2025年11月8日 15:00</p>
      </div>
    );
  }

  return <div>エラーが発生しました</div>;
}
```

## 9. トラブルシューティング

### 問題1: error.tsx が動作しない

**症状**: エラーが発生しても error.tsx が表示されない

**原因と解決策**:

```typescript
// ❌ 原因: "use client" が欠けている
export default function Error({ error, reset }) {
  return <div>Error</div>;
}

// ✅ 解決: "use client" を追加
"use client";
export default function Error({ error, reset }) {
  return <div>Error</div>;
}
```

### 問題2: global-error.tsx が必要なケース

**症状**: ルートレイアウトでエラー発生時に白画面

**解決策**: global-error.tsx を作成

```typescript
// app/global-error.tsx
"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html>  {/* 必須 */}
      <body>  {/* 必須 */}
        <h1>重大なエラー</h1>
        <button onClick={reset}>再起動</button>
      </body>
    </html>
  );
}
```

### 問題3: notFound() が効かない

**症状**: notFound() を呼んでも not-found.tsx が表示されない

**原因**: not-found.tsx が存在しない

```
// ✅ 正しい配置
app/
├── not-found.tsx        ← 必要
└── products/
    └── [id]/
        ├── page.tsx     ← notFound() を呼ぶ
        └── not-found.tsx ← オプション（カスタム404）
```

### 問題4: リダイレクトがエラーとして扱われる

**症状**: redirect() がエラーとしてキャッチされる

**解決策**: redirect は Error Boundary でキャッチしない

```typescript
// app/page.tsx
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect("/login"); // これは正常な動作（エラーではない）
  }

  return <div>Dashboard</div>;
}
```

## 10. テスト

### エラーページのテスト

```typescript
// app/test-error/page.tsx
"use client";

export default function TestErrorPage() {
  function triggerError() {
    throw new Error("This is a test error");
  }

  return (
    <div>
      <button onClick={triggerError}>
        エラーをトリガー
      </button>
    </div>
  );
}
```

### ユニットテスト

```typescript
// __tests__/error.test.tsx
import { render, screen } from "@testing-library/react";
import Error from "@/app/error";

describe("Error Component", () => {
  it("エラーメッセージを表示", () => {
    const error = new Error("Test error");
    const reset = jest.fn();

    render(<Error error={error} reset={reset} />);

    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it("リセットボタンをクリック", () => {
    const error = new Error("Test error");
    const reset = jest.fn();

    render(<Error error={error} reset={reset} />);

    const button = screen.getByRole("button", { name: /もう一度試す/i });
    button.click();

    expect(reset).toHaveBeenCalled();
  });
});
```

## まとめ

### エラーハンドリングの階層

```
global-error.tsx        ← 最後の砦
    ↑
app/error.tsx          ← ルートエラー
    ↑
segment/error.tsx      ← セグメントエラー
    ↑
segment/[id]/error.tsx ← 詳細エラー
```

### 実装チェックリスト

- [ ] `error.tsx` をルートレベルに配置
- [ ] `global-error.tsx` を配置（html, body を含む）
- [ ] `not-found.tsx` を配置
- [ ] 重要なセグメントに専用 error.tsx を配置
- [ ] "use client" ディレクティブを追加
- [ ] reset 関数を実装
- [ ] ユーザーフレンドリーなメッセージ
- [ ] エラーログを外部サービスに送信
- [ ] リカバリーオプションを提供
- [ ] 開発環境と本番環境で表示を分ける

### Next.js エラーハンドリングの利点

- ✅ 自動的な Error Boundary
- ✅ 階層的なエラー処理
- ✅ 簡単なリカバリー（reset関数）
- ✅ セグメント別のカスタマイズ
- ✅ Server Component との統合
- ✅ 型安全性

---

**実装日**: 2025-11-08
**プロジェクト**: `Projects/next16-sandbox/`
**Next.js**: 16.0.1
**参考**: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/error-demo/`
