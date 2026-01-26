# 13 - Custom Utilities（カスタムユーティリティ）

## この章で学ぶこと

- @layer ディレクティブ
- @apply の使い方
- カスタムユーティリティの作成
- CSS 変数との連携

## @layer ディレクティブ

Tailwind には 3 つのレイヤーがあります：

```css
/* globals.css */
@tailwind base; /* リセット、デフォルトスタイル */
@tailwind components; /* コンポーネントクラス */
@tailwind utilities; /* ユーティリティクラス */
```

### base レイヤー

```css
@layer base {
  /* HTML要素のデフォルトスタイル */
  h1 {
    @apply text-4xl font-bold;
  }

  h2 {
    @apply text-3xl font-semibold;
  }

  a {
    @apply text-blue-600 hover:text-blue-800;
  }

  /* フォントの設定 */
  html {
    font-family: "Inter", sans-serif;
  }
}
```

### components レイヤー

```css
@layer components {
  /* 再利用可能なコンポーネント */
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }

  .btn-primary {
    @apply btn bg-blue-500 text-white hover:bg-blue-600;
  }

  .btn-secondary {
    @apply btn bg-gray-200 text-gray-800 hover:bg-gray-300;
  }

  .btn-outline {
    @apply btn border border-gray-300 hover:bg-gray-100;
  }

  .card {
    @apply bg-white rounded-lg shadow p-6;
  }

  .input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  }
}
```

### utilities レイヤー

```css
@layer utilities {
  /* カスタムユーティリティ */
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .text-shadow-lg {
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* レスポンシブ対応のカスタムユーティリティ */
  .content-auto {
    content-visibility: auto;
  }
}
```

## @apply の使い方

### 基本的な使い方

```css
@layer components {
  .btn {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg;
    @apply hover:bg-blue-600;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
}
```

### 注意点

```css
/* ❌ @apply でカスタムCSSプロパティは使えない */
.btn {
  @apply custom-property: value; /* エラー */
}

/* ✅ 通常のCSSと@applyを組み合わせる */
.btn {
  @apply px-4 py-2 rounded-lg;
  custom-property: value;
}
```

## カスタムユーティリティの実践例

### テキストユーティリティ

```css
@layer utilities {
  /* グラデーションテキスト */
  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r;
  }

  .text-gradient-blue {
    @apply text-gradient from-blue-500 to-purple-500;
  }

  /* テキストバランス */
  .text-balance {
    text-wrap: balance;
  }

  /* テキストトランケート（複数行） */
  .line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
}
```

### レイアウトユーティリティ

```css
@layer utilities {
  /* 中央配置 */
  .center {
    @apply flex items-center justify-center;
  }

  /* フルスクリーン */
  .fullscreen {
    @apply fixed inset-0;
  }

  /* アスペクト比（古いブラウザ対応） */
  .aspect-video {
    aspect-ratio: 16 / 9;
  }

  .aspect-square {
    aspect-ratio: 1 / 1;
  }
}
```

### アニメーションユーティリティ

```css
@layer utilities {
  /* フェードイン */
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* スライドアップ */
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* スピン（ローディング） */
  .animate-spin-slow {
    animation: spin 2s linear infinite;
  }
}
```

## CSS 変数との連携

### テーマ変数の定義

```css
@layer base {
  :root {
    --color-primary: 59 130 246; /* blue-500 */
    --color-secondary: 107 114 128; /* gray-500 */
    --color-background: 255 255 255;
    --color-foreground: 17 24 39;

    --radius: 0.5rem;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  .dark {
    --color-background: 17 24 39;
    --color-foreground: 249 250 251;
  }
}
```

### tailwind.config.js での使用

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      boxShadow: {
        DEFAULT: "var(--shadow)",
      },
    },
  },
};
```

### 使用例

```html
<!-- 自動でダークモード対応 -->
<div class="bg-background text-foreground">
  <button class="bg-primary text-white">ボタン</button>
</div>
```

## コンポーネントパターン

### ボタンバリエーション

```css
@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2;
    @apply px-4 py-2 rounded-lg font-medium;
    @apply transition-colors duration-200;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  /* サイズ */
  .btn-sm {
    @apply px-3 py-1.5 text-sm;
  }

  .btn-lg {
    @apply px-6 py-3 text-lg;
  }

  /* バリアント */
  .btn-primary {
    @apply bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500;
  }

  .btn-danger {
    @apply bg-red-500 text-white hover:bg-red-600 focus:ring-red-500;
  }

  .btn-ghost {
    @apply bg-transparent hover:bg-gray-100 focus:ring-gray-500;
  }
}
```

### カードコンポーネント

```css
@layer components {
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow;
  }

  .card-header {
    @apply px-6 py-4 border-b border-gray-200 dark:border-gray-700;
  }

  .card-body {
    @apply p-6;
  }

  .card-footer {
    @apply px-6 py-4 border-t border-gray-200 dark:border-gray-700;
  }
}
```

### フォームコンポーネント

```css
@layer components {
  .form-group {
    @apply space-y-1;
  }

  .form-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
  }

  .form-input {
    @apply w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg;
    @apply bg-white dark:bg-gray-800;
    @apply text-gray-900 dark:text-white;
    @apply placeholder-gray-400 dark:placeholder-gray-500;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  }

  .form-error {
    @apply text-sm text-red-500;
  }

  .form-hint {
    @apply text-sm text-gray-500;
  }
}
```

## @apply vs ユーティリティ

### いつ @apply を使うか

```css
/* ✅ 良い例: 頻繁に再利用するパターン */
.btn {
  @apply px-4 py-2 rounded-lg font-medium;
}

/* ❌ 悪い例: 一度しか使わないスタイル */
.hero-title {
  @apply text-4xl font-bold text-center mt-8 mb-4;
}
```

### 推奨アプローチ

1. **ユーティリティファースト**: まずユーティリティクラスで実装
2. **パターンの抽出**: 繰り返しが多い場合に @apply で抽出
3. **コンポーネント化**: React/Vue などでコンポーネントにする

## まとめ

- `@layer base`: HTML 要素のデフォルトスタイル
- `@layer components`: 再利用可能なコンポーネント
- `@layer utilities`: カスタムユーティリティ
- `@apply`: ユーティリティをまとめる
- CSS 変数でテーマを柔軟に管理

## 確認問題

1. 3 つのレイヤーの違いを説明してください
2. @apply を使うべき場面と使わないべき場面を説明してください
3. ダークモード対応のカスタムカラーを実装してください

## 次の章へ

[14 - Plugins](./14-Plugins.md) では、Tailwind プラグインについて学びます。
