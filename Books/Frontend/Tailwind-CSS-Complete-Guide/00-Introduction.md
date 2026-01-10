# 00 - Introduction

## Tailwind CSS とは

Tailwind CSS は、ユーティリティファーストの CSS フレームワークです。事前定義されたクラスを HTML に直接適用してスタイリングを行います。

### 従来の CSS との違い

```text
従来の CSS
┌─────────────────────────────────────────┐
│  .card {                                │
│    padding: 1rem;                       │
│    background: white;                   │
│    border-radius: 0.5rem;               │
│    box-shadow: 0 1px 3px rgba(0,0,0,0.1)│
│  }                                      │
│  <div class="card">...</div>            │
└─────────────────────────────────────────┘

Tailwind CSS
┌─────────────────────────────────────────┐
│  <div class="p-4 bg-white rounded-lg    │
│              shadow-md">                │
│    ...                                  │
│  </div>                                 │
└─────────────────────────────────────────┘
```

## Tailwind CSS の主な特徴

### 1. ユーティリティファースト

```html
<!-- 各プロパティに対応するクラス -->
<div
  class="
  flex          /* display: flex */
  items-center  /* align-items: center */
  gap-4         /* gap: 1rem */
  p-6           /* padding: 1.5rem */
  bg-blue-500   /* background-color: #3b82f6 */
  text-white    /* color: white */
  rounded-xl    /* border-radius: 0.75rem */
"
>
  Content
</div>
```

### 2. レスポンシブデザイン

```html
<!-- ブレークポイントプレフィックス -->
<div
  class="
  w-full        /* デフォルト: 100% */
  md:w-1/2      /* 768px以上: 50% */
  lg:w-1/3      /* 1024px以上: 33.33% */
"
>
  Responsive Box
</div>
```

### 3. 状態バリアント

```html
<!-- hover, focus, active などの状態 -->
<button
  class="
  bg-blue-500
  hover:bg-blue-600    /* ホバー時 */
  focus:ring-2         /* フォーカス時 */
  active:bg-blue-700   /* クリック時 */
  disabled:opacity-50  /* 無効時 */
"
>
  Button
</button>
```

### 4. ダークモード

```html
<!-- dark: プレフィックスでダークモード対応 -->
<div
  class="
  bg-white dark:bg-gray-800
  text-gray-900 dark:text-white
"
>
  Light/Dark Content
</div>
```

## なぜ Tailwind CSS を学ぶのか

| 観点 | 従来の CSS | CSS-in-JS | Tailwind CSS |
|------|-----------|-----------|--------------|
| 学習コスト | 低 | 中 | 中 |
| 開発速度 | 遅い | 中程度 | 速い |
| バンドルサイズ | 大きくなりがち | 中程度 | 小さい（PurgeCSS） |
| カスタマイズ | 自由 | 自由 | 設定ベース |
| 一貫性 | 難しい | 中程度 | 高い |

## Tailwind CSS のエコシステム

```text
Tailwind CSS
├── Tailwind UI        # 有料コンポーネント集
├── Headless UI        # アクセシブルなコンポーネント
├── Heroicons          # SVG アイコン
└── Tailwind Typography # prose クラス
    └── @tailwindcss/forms    # フォームスタイル
    └── @tailwindcss/aspect-ratio
    └── @tailwindcss/container-queries
```

## このガイドで学ぶこと

### Part 1: 基礎編

- セットアップと基本的な使い方
- ユーティリティクラスの体系
- レスポンシブデザイン

### Part 2: レイアウト編

- Flexbox と Grid
- スペーシングとサイジング

### Part 3: スタイリング編

- カラーシステム
- タイポグラフィ
- ボーダー、シャドウ、背景

### Part 4: インタラクション編

- 状態バリアント
- ダークモード
- アニメーション

### Part 5: カスタマイズ編

- tailwind.config.js
- カスタムテーマ
- プラグイン

### Part 6: 実践編

- コンポーネントパターン
- ベストプラクティス

## クイックスタート

### 基本的なカード

```html
<div class="max-w-sm rounded-xl bg-white p-6 shadow-lg">
  <h2 class="mb-2 text-xl font-bold text-gray-900">Card Title</h2>
  <p class="text-gray-600">
    This is a simple card component built with Tailwind CSS utility classes.
  </p>
  <button
    class="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
  >
    Learn More
  </button>
</div>
```

### レスポンシブグリッド

```html
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  <div class="rounded-lg bg-gray-100 p-4">Item 1</div>
  <div class="rounded-lg bg-gray-100 p-4">Item 2</div>
  <div class="rounded-lg bg-gray-100 p-4">Item 3</div>
</div>
```

### ダークモード対応ナビゲーション

```html
<nav class="bg-white p-4 shadow dark:bg-gray-900">
  <div class="flex items-center justify-between">
    <span class="text-xl font-bold text-gray-900 dark:text-white"> Logo </span>
    <div class="flex gap-4">
      <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-300">
        Home
      </a>
      <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-300">
        About
      </a>
    </div>
  </div>
</nav>
```

## よく使うクラス一覧

### スペーシング

| クラス | 値 |
|--------|-----|
| p-4 | padding: 1rem |
| m-4 | margin: 1rem |
| gap-4 | gap: 1rem |
| space-x-4 | 水平方向の間隔 |

### サイズ

| クラス | 値 |
|--------|-----|
| w-full | width: 100% |
| h-screen | height: 100vh |
| max-w-md | max-width: 28rem |
| min-h-0 | min-height: 0 |

### Flexbox

| クラス | 値 |
|--------|-----|
| flex | display: flex |
| items-center | align-items: center |
| justify-between | justify-content: space-between |
| flex-col | flex-direction: column |

## まとめ

- Tailwind CSS はユーティリティファーストの CSS フレームワーク
- HTML 内でクラスを組み合わせてスタイリング
- レスポンシブ、ダークモード、状態が簡単に実装可能
- PurgeCSS で未使用クラスを削除し、小さなバンドルサイズを実現

## 次のステップ

➡️ 次へ: [01 - Getting-Started](./01-Getting-Started.md)
