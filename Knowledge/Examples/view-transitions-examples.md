---
created: 2025-11-08
tags: [example, nextjs, view-transitions, animations, css]
status: 完了
related:
  - "[[Next.js-16-Setup]]"
  - "[[use-cache-examples]]"
  - "[[async-params-migration]]"
---

# View Transitions 実装例

## 概要

Next.js 16でのページ遷移アニメーションとCSSアニメーションの実装例。
スムーズなユーザー体験を提供するためのテクニック集。

## 実装場所

```
Projects/next16-sandbox/app/
├── gallery/page.tsx     # 画像ギャラリー（フェードイン + 上昇）
└── dashboard/page.tsx   # ダッシュボード（スライドイン + フェードイン）
```

## CSSアニメーションの基本

### 1. フェードイン + 上昇アニメーション

```typescript
// app/gallery/page.tsx
<div
  className="group"
  style={{
    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
  }}
>
  {/* コンテンツ */}
</div>

<style jsx>{`
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`}</style>
```

**特徴**:
- 下から上にフェードインする効果
- `both`により、アニメーション開始前と終了後のスタイルを維持
- `index * 0.1s`で順次表示（ストagger効果）

### 2. スライドインアニメーション

```typescript
// app/dashboard/page.tsx
<div
  style={{
    animation: "slideIn 0.5s ease-out 0.5s both",
  }}
>
  {/* コンテンツ */}
</div>

<style jsx>{`
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`}</style>
```

**特徴**:
- 左から右にスライドインする効果
- `0.5s`の遅延で順次表示

### 3. シンプルなフェードイン

```typescript
<style jsx>{`
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`}</style>
```

## 実装パターン

### パターン1: グリッドアイテムの順次表示

```typescript
const items = [/* データ */];

return (
  <div className="grid grid-cols-4 gap-6">
    {items.map((item, index) => (
      <div
        key={item.id}
        style={{
          animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
        }}
      >
        {/* アイテムコンテンツ */}
      </div>
    ))}
  </div>
);
```

**効果**:
- 各アイテムが0.1秒ずつずれて表示される
- 4列の場合、1行目が0.0s, 0.1s, 0.2s, 0.3sで表示

### パターン2: セクションの段階的表示

```typescript
return (
  <>
    <div style={{ animation: "fadeIn 0.5s ease-out 0.0s both" }}>
      {/* ヘッダーセクション */}
    </div>

    <div style={{ animation: "fadeIn 0.5s ease-out 0.2s both" }}>
      {/* メインコンテンツ */}
    </div>

    <div style={{ animation: "fadeIn 0.5s ease-out 0.4s both" }}>
      {/* サイドバー */}
    </div>
  </>
);
```

**効果**:
- ページの各セクションが順番に表示される
- より自然な読み込み体験

### パターン3: ホバーアニメーション

```typescript
<div className="transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
  {/* コンテンツ */}
</div>
```

**Tailwind CSSクラス**:
- `transition-all`: すべてのプロパティを遷移対象に
- `duration-300`: 300msの遷移時間
- `hover:-translate-y-2`: ホバー時に8px上に移動
- `hover:shadow-xl`: ホバー時に大きな影

## アニメーションタイミング

### イージング関数の選択

```css
/* 線形 - 均一な速度 */
animation: fadeIn 0.5s linear;

/* イーズアウト - 最初速く、後でゆっくり（推奨） */
animation: fadeIn 0.5s ease-out;

/* イーズイン - 最初ゆっくり、後で速く */
animation: fadeIn 0.5s ease-in;

/* イーズイン-アウト - 両端がゆっくり */
animation: fadeIn 0.5s ease-in-out;

/* カスタムベジェ曲線 */
animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
```

### タイミング一覧

| 要素 | 推奨時間 | 理由 |
|------|---------|------|
| 小さな要素（ボタン、アイコン） | 150-200ms | 即座に反応する感覚 |
| 中程度の要素（カード） | 300-400ms | 自然な動き |
| 大きな要素（モーダル、ページ） | 500-600ms | ダイナミックな効果 |
| ページ遷移 | 400-500ms | スムーズな遷移 |

### ストagger（時間差）効果

```typescript
const STAGGER_DELAY = 0.1; // 100ms

items.map((item, index) => (
  <div
    key={item.id}
    style={{
      animation: `fadeIn 0.5s ease-out ${index * STAGGER_DELAY}s both`,
    }}
  />
));
```

**パフォーマンス考慮**:
- アイテム数が多い場合は、最大遅延時間を設定
- `Math.min(index * STAGGER_DELAY, MAX_DELAY)`

## パフォーマンス最適化

### 1. GPUアクセラレーション

```css
/* ✅ GPUを使用するプロパティ（高速） */
transform: translateX(10px);
transform: translateY(10px);
transform: scale(1.1);
opacity: 0.5;

/* ❌ CPUを使用するプロパティ（低速） */
top: 10px;
left: 10px;
width: 100px;
height: 100px;
```

### 2. will-changeの使用

```css
/* アニメーション前にブラウザに通知 */
.animated-element {
  will-change: transform, opacity;
}

/* アニメーション後は削除 */
.animated-element.done {
  will-change: auto;
}
```

### 3. Tailwind CSSでの実装

```typescript
// ✅ 推奨: GPUアクセラレーションを使用
<div className="transition-transform duration-300 hover:scale-110">

// ❌ 非推奨: レイアウトを変更
<div className="transition-all duration-300 hover:w-full">
```

## 実装例: ギャラリーページ

### 完全なコード例

```typescript
// app/gallery/page.tsx
export default function GalleryPage() {
  const images = [/* データ */];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1
          className="text-4xl font-bold mb-8"
          style={{ animation: "fadeIn 0.5s ease-out 0s both" }}
        >
          Image Gallery
        </h1>

        <div className="grid grid-cols-4 gap-6">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="group"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden
                            transition-all duration-300
                            hover:shadow-xl hover:-translate-y-2">
                <div className={`aspect-square bg-gradient-to-br ${image.color}`}>
                  {/* 画像 */}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{image.title}</h3>
                  <p className="text-sm text-gray-600">{image.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
```

## 実装例: ダッシュボードページ

### 統計カードの実装

```typescript
// app/dashboard/page.tsx
const stats = [/* 統計データ */];

return (
  <div className="grid grid-cols-4 gap-6">
    {stats.map((stat, index) => (
      <div
        key={stat.id}
        className="bg-white rounded-lg shadow-md overflow-hidden
                   hover:shadow-lg transition-all duration-300"
        style={{
          animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
        }}
      >
        <div className={`h-2 bg-gradient-to-r ${stat.color}`} />
        <div className="p-6">
          <div className="text-4xl mb-2">{stat.icon}</div>
          <div className="text-sm text-gray-600">{stat.label}</div>
          <div className="text-3xl font-bold">{stat.value}</div>
          <div className="text-sm text-green-600">{stat.change}</div>
        </div>
      </div>
    ))}
  </div>
);
```

## CSSモジュールでの実装

### styles.module.cssを作成

```css
/* app/gallery/styles.module.css */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeInUp 0.5s ease-out both;
}

.card:nth-child(1) { animation-delay: 0.0s; }
.card:nth-child(2) { animation-delay: 0.1s; }
.card:nth-child(3) { animation-delay: 0.2s; }
/* ... */
```

### コンポーネントで使用

```typescript
import styles from './styles.module.css';

export default function Page() {
  return (
    <div className={styles.card}>
      {/* コンテンツ */}
    </div>
  );
}
```

## アクセシビリティ考慮

### prefers-reduced-motionへの対応

```css
/* ユーザーが動きの軽減を選択している場合 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### TypeScriptでの実装

```typescript
"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div
      style={{
        animation: prefersReducedMotion
          ? "none"
          : "fadeIn 0.5s ease-out both",
      }}
    >
      {/* コンテンツ */}
    </div>
  );
}
```

## トラブルシューティング

### 問題1: アニメーションが動作しない

```typescript
// ❌ 間違い: styleタグがコンポーネント外
export default function Page() {
  return <div style={{ animation: "fadeIn 0.5s" }}>...</div>;
}
// ここにstyleタグがない！

// ✅ 正しい: styleタグをコンポーネント内に
export default function Page() {
  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
      ...
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
```

### 問題2: Server Componentでのスタイル

```typescript
// ❌ エラー: Server Componentでは<style jsx>は使えない
export default async function Page() {
  return (
    <div>
      <style jsx>{`...`}</style> {/* エラー */}
    </div>
  );
}

// ✅ 解決策1: CSS Modules
import styles from './page.module.css';

// ✅ 解決策2: グローバルCSS
// globals.cssに定義

// ✅ 解決策3: インラインスタイルのみ使用
<div style={{ animation: "fadeIn 0.5s" }}>
```

### 問題3: Tailwindのtransitionが効かない

```typescript
// ❌ 間違い: transitionクラスがない
<div className="hover:bg-blue-500">

// ✅ 正しい: transition系クラスを追加
<div className="transition-colors duration-300 hover:bg-blue-500">
```

## ベストプラクティス

### 1. アニメーションは控えめに

```typescript
// ✅ 適度なアニメーション
animation: fadeIn 0.3s ease-out;

// ❌ 過度なアニメーション
animation: spin 2s linear infinite, pulse 1s ease-in-out infinite;
```

### 2. 一貫性のあるタイミング

```typescript
// ✅ プロジェクト全体で統一
const ANIMATION_DURATION = {
  fast: "150ms",
  normal: "300ms",
  slow: "500ms",
};

// 使用例
<div style={{ animation: `fadeIn ${ANIMATION_DURATION.normal} ease-out` }}>
```

### 3. パフォーマンスを意識

```typescript
// ✅ GPUアクセラレーションを使用
transform: translateY(10px);
opacity: 0.5;

// ❌ レイアウト変更を避ける
top: 10px;
width: 100%;
```

## まとめ

### アニメーション手法

| 手法 | 用途 | メリット |
|------|------|---------|
| CSS Keyframes | ページ読み込み時 | 柔軟性が高い |
| Tailwind Transition | ホバー、状態変化 | 簡潔で保守しやすい |
| Inline Styles | 動的なアニメーション | コンポーネント単位で完結 |
| CSS Modules | 大規模プロジェクト | スコープが限定される |

### パフォーマンスのポイント

- ✅ `transform`と`opacity`を優先
- ✅ `will-change`で最適化
- ✅ `prefers-reduced-motion`に対応
- ❌ レイアウト変更は避ける
- ❌ 過度なアニメーションは避ける

### 実装の流れ

1. アニメーションの目的を明確に
2. 適切なタイミングと速度を設定
3. GPUアクセラレーションを活用
4. アクセシビリティに配慮
5. パフォーマンスをテスト

---

**実装日**: 2025-11-08
**プロジェクト**: `Projects/next16-sandbox/`
**Next.js**: 16.0.1
