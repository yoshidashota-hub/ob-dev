# 16 - Best Practices（ベストプラクティス）

## この章で学ぶこと

- Tailwind CSS のベストプラクティス
- パフォーマンス最適化
- 保守性の高いコード
- チーム開発のガイドライン

## クラスの整理

### 論理的な順序

```html
<!-- 推奨: レイアウト → ボックス → タイポグラフィ → 色 → エフェクト -->
<button
  class="
    flex items-center gap-2
    px-4 py-2
    text-sm font-medium
    bg-blue-500 text-white
    rounded-lg shadow
    hover:bg-blue-600
    transition-colors
  "
>
  ボタン
</button>
```

### Prettier プラグインを使用

```json
// .prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## コンポーネント化の判断

### いつユーティリティのまま使うか

```html
<!-- ✅ 一度しか使わない、シンプルなスタイル -->
<h1 class="text-4xl font-bold text-center mb-8">ページタイトル</h1>
```

### いつコンポーネント化するか

```tsx
// ✅ 繰り返し使う、複雑なスタイル
function Button({ children, variant = "primary" }) {
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
  };

  return <button className={`${baseStyles} ${variants[variant]}`}>{children}</button>;
}
```

## @apply の使い方

### 適切な使用例

```css
/* ✅ 頻繁に使う、複雑なパターン */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
}
```

### 避けるべき使用例

```css
/* ❌ シンプルすぎる、一度しか使わない */
.title {
  @apply text-2xl font-bold;
}

/* ❌ コンポーネント化すべき複雑なスタイル */
.complex-card {
  @apply bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow;
  @apply border border-gray-100 dark:border-gray-700;
  @apply dark:bg-gray-800;
}
```

## パフォーマンス最適化

### content の最適化

```javascript
// tailwind.config.js
module.exports = {
  content: [
    // ✅ 必要なファイルのみ
    "./src/**/*.{js,ts,jsx,tsx}",

    // ❌ 広すぎる
    "./**/*.{js,ts,jsx,tsx}",
  ],
};
```

### プロダクションビルド

```bash
# 使用していないCSSは自動的に除去される
npm run build
```

### 動的クラス名の注意

```tsx
// ❌ 動的クラス名はPurge対象にならない
<div className={`bg-${color}-500`}>

// ✅ 完全なクラス名を使用
const colorClasses = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
}
<div className={colorClasses[color]}>
```

### safelist の使用

```javascript
// tailwind.config.js
module.exports = {
  safelist: [
    // 動的に使用するクラス
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    // パターン
    {
      pattern: /bg-(red|blue|green)-500/,
    },
  ],
};
```

## デザインシステムとの統合

### カスタムカラーの定義

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // セマンティックカラー
        primary: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          light: "#EFF6FF",
        },
        secondary: {
          DEFAULT: "#6B7280",
          hover: "#4B5563",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      },
    },
  },
};
```

### CSS 変数との連携

```css
/* globals.css */
@layer base {
  :root {
    --color-primary: 59 130 246;
    --color-secondary: 107 114 128;
  }

  .dark {
    --color-primary: 96 165 250;
    --color-secondary: 156 163 175;
  }
}
```

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
      },
    },
  },
};
```

## アクセシビリティ

### フォーカス状態

```html
<!-- ✅ 視認性の高いフォーカスリング -->
<button
  class="
    focus:outline-none
    focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    focus-visible:ring-2 focus-visible:ring-blue-500
  "
>
  ボタン
</button>
```

### コントラスト比

```html
<!-- ✅ 十分なコントラスト -->
<p class="text-gray-700">読みやすいテキスト</p>

<!-- ❌ コントラスト不足 -->
<p class="text-gray-400">読みにくいテキスト</p>
```

### スクリーンリーダー対応

```html
<!-- 視覚的に非表示、スクリーンリーダーには読み上げ -->
<span class="sr-only">メニューを開く</span>

<!-- 視覚的に非表示、スクリーンリーダーにも非表示 -->
<span aria-hidden="true">装飾アイコン</span>
```

## チーム開発のガイドライン

### ESLint 設定

```javascript
// .eslintrc.js
module.exports = {
  extends: ["plugin:tailwindcss/recommended"],
  rules: {
    "tailwindcss/classnames-order": "warn",
    "tailwindcss/no-custom-classname": "warn",
  },
};
```

### コーディング規約

```markdown
# Tailwind CSS コーディング規約

## クラスの順序

1. レイアウト (flex, grid, position)
2. ボックスモデル (p, m, w, h)
3. タイポグラフィ (text, font)
4. 色 (bg, text, border)
5. エフェクト (shadow, rounded, opacity)
6. 状態 (hover, focus, active)
7. レスポンシブ (sm, md, lg)

## 命名規則

- コンポーネントは PascalCase
- カスタムクラスは kebab-case
- ユーティリティクラスはそのまま使用

## 禁止事項

- インラインスタイルの使用
- 動的クラス名の文字列結合
- @apply の過度な使用
```

## トラブルシューティング

### クラスが効かない

```javascript
// 1. content の確認
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // パスが正しいか
  ],
};

// 2. 動的クラスの確認
// ❌
`bg-${color}-500`;
// ✅
colorClasses[color];

// 3. 優先度の確認
// より詳細なセレクタが必要な場合
<div class="!bg-red-500">強制的に赤背景</div>
```

### ビルドサイズが大きい

```javascript
// 1. content を絞る
// 2. safelist を最小限に
// 3. プラグインを必要なものだけに
```

## チェックリスト

### 開発時

- [ ] Tailwind CSS IntelliSense をインストール
- [ ] Prettier プラグインを設定
- [ ] ESLint プラグインを設定
- [ ] content パスを正しく設定

### レビュー時

- [ ] クラスの順序は統一されているか
- [ ] 重複したスタイルがないか
- [ ] 動的クラスは safelist に追加されているか
- [ ] アクセシビリティは考慮されているか

### デプロイ前

- [ ] プロダクションビルドでサイズを確認
- [ ] 使用していないクラスが除去されているか
- [ ] ダークモードは正しく動作するか
- [ ] レスポンシブは全サイズで確認したか

## まとめ

このガイドで学んだこと：

1. **基礎**: ユーティリティファースト、デザイントークン
2. **レイアウト**: Flexbox、Grid、スペーシング
3. **スタイリング**: タイポグラフィ、カラー、背景
4. **レスポンシブ**: モバイルファースト、ブレークポイント
5. **状態管理**: ホバー、フォーカス、ダークモード
6. **カスタマイズ**: 設定、プラグイン、カスタムユーティリティ
7. **実践**: コンポーネントパターン、ベストプラクティス

Tailwind CSS を使いこなすことで、高速で保守性の高い UI 開発が可能になります。

## 参考リンク

- [Tailwind CSS 公式ドキュメント](https://tailwindcss.com/docs)
- [Tailwind UI](https://tailwindui.com)
- [Headless UI](https://headlessui.com)
- [Heroicons](https://heroicons.com)

---

**おめでとうございます！Tailwind CSS Complete Guide を完了しました！**
