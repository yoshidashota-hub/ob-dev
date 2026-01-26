# 14 - Plugins（プラグイン）

## この章で学ぶこと

- 公式プラグインの使い方
- カスタムプラグインの作成
- サードパーティプラグイン

## 公式プラグイン

### @tailwindcss/typography

長文コンテンツ（ブログ記事など）のスタイリング：

```bash
npm install @tailwindcss/typography
```

```javascript
// tailwind.config.js
module.exports = {
  plugins: [require("@tailwindcss/typography")],
};
```

```html
<article class="prose lg:prose-xl">
  <h1>タイトル</h1>
  <p>
    これは段落です。<code>コード</code>も含まれます。
  </p>
  <ul>
    <li>リスト項目1</li>
    <li>リスト項目2</li>
  </ul>
  <blockquote>引用文</blockquote>
</article>

<!-- ダークモード -->
<article class="prose dark:prose-invert">...</article>

<!-- カスタマイズ -->
<article class="prose prose-blue">青いリンク</article>
```

### @tailwindcss/forms

フォーム要素のリセットとスタイリング：

```bash
npm install @tailwindcss/forms
```

```javascript
module.exports = {
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class", // または 'base'
    }),
  ],
};
```

```html
<!-- strategy: 'base' の場合、自動的にスタイルされる -->
<input type="text" class="..." />
<select class="...">
  ...
</select>
<textarea class="..."></textarea>

<!-- strategy: 'class' の場合、クラスを追加 -->
<input type="text" class="form-input" />
<select class="form-select">
  ...
</select>
<input type="checkbox" class="form-checkbox" />
<input type="radio" class="form-radio" />
<textarea class="form-textarea"></textarea>
```

### @tailwindcss/aspect-ratio

アスペクト比のユーティリティ：

```bash
npm install @tailwindcss/aspect-ratio
```

```javascript
module.exports = {
  plugins: [require("@tailwindcss/aspect-ratio")],
};
```

```html
<div class="aspect-w-16 aspect-h-9">
  <iframe src="..." class="w-full h-full"></iframe>
</div>

<div class="aspect-w-4 aspect-h-3">
  <img src="..." class="object-cover" />
</div>
```

### @tailwindcss/container-queries

コンテナクエリのサポート：

```bash
npm install @tailwindcss/container-queries
```

```javascript
module.exports = {
  plugins: [require("@tailwindcss/container-queries")],
};
```

```html
<div class="@container">
  <div class="@lg:flex @lg:items-center">
    <!-- コンテナが lg サイズ以上のとき flex -->
    <div class="@md:text-lg">コンテンツ</div>
  </div>
</div>
```

## カスタムプラグインの作成

### 基本構造

```javascript
// tailwind.config.js
const plugin = require("tailwindcss/plugin");

module.exports = {
  plugins: [
    plugin(function ({ addUtilities, addComponents, addBase, theme, e }) {
      // ユーティリティを追加
      addUtilities({
        ".rotate-y-180": {
          transform: "rotateY(180deg)",
        },
      });

      // コンポーネントを追加
      addComponents({
        ".card": {
          backgroundColor: theme("colors.white"),
          borderRadius: theme("borderRadius.lg"),
          padding: theme("spacing.6"),
          boxShadow: theme("boxShadow.md"),
        },
      });

      // ベーススタイルを追加
      addBase({
        h1: { fontSize: theme("fontSize.2xl") },
      });
    }),
  ],
};
```

### ユーティリティの追加

```javascript
plugin(function ({ addUtilities }) {
  addUtilities({
    // 基本的なユーティリティ
    ".text-shadow": {
      textShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    ".text-shadow-md": {
      textShadow: "0 4px 8px rgba(0,0,0,0.12)",
    },
    ".text-shadow-lg": {
      textShadow: "0 8px 16px rgba(0,0,0,0.15)",
    },
    ".text-shadow-none": {
      textShadow: "none",
    },

    // バリアント対応
    ".flip-x": {
      transform: "scaleX(-1)",
    },
    ".flip-y": {
      transform: "scaleY(-1)",
    },
  });
});
```

### matchUtilities（動的な値）

```javascript
plugin(function ({ matchUtilities, theme }) {
  matchUtilities(
    {
      "text-shadow": (value) => ({
        textShadow: value,
      }),
    },
    {
      values: theme("textShadow"),
    },
  );
});

// tailwind.config.js の theme
module.exports = {
  theme: {
    textShadow: {
      sm: "0 1px 2px rgba(0,0,0,0.1)",
      DEFAULT: "0 2px 4px rgba(0,0,0,0.1)",
      lg: "0 8px 16px rgba(0,0,0,0.15)",
    },
  },
};

// 使用: text-shadow, text-shadow-sm, text-shadow-lg
```

### コンポーネントの追加

```javascript
plugin(function ({ addComponents, theme }) {
  addComponents({
    ".btn": {
      padding: `${theme("spacing.2")} ${theme("spacing.4")}`,
      borderRadius: theme("borderRadius.lg"),
      fontWeight: theme("fontWeight.medium"),
      transition: "all 0.2s",
    },
    ".btn-primary": {
      backgroundColor: theme("colors.blue.500"),
      color: theme("colors.white"),
      "&:hover": {
        backgroundColor: theme("colors.blue.600"),
      },
    },
    ".btn-outline": {
      backgroundColor: "transparent",
      border: `1px solid ${theme("colors.gray.300")}`,
      "&:hover": {
        backgroundColor: theme("colors.gray.100"),
      },
    },
  });
});
```

### バリアントの追加

```javascript
plugin(function ({ addVariant }) {
  // カスタムバリアント
  addVariant("hocus", ["&:hover", "&:focus"]);
  addVariant("not-first", "&:not(:first-child)");
  addVariant("not-last", "&:not(:last-child)");

  // 親要素の状態
  addVariant("group-active", ":merge(.group):active &");

  // データ属性
  addVariant("data-active", '&[data-active="true"]');
});

// 使用
// hocus:bg-blue-500
// not-first:mt-4
// data-active:bg-blue-500
```

## 実践的なプラグイン例

### スクロールバーカスタマイズ

```javascript
plugin(function ({ addUtilities }) {
  addUtilities({
    ".scrollbar-thin": {
      scrollbarWidth: "thin",
      "&::-webkit-scrollbar": {
        width: "8px",
        height: "8px",
      },
    },
    ".scrollbar-hide": {
      "-ms-overflow-style": "none",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": {
        display: "none",
      },
    },
    ".scrollbar-default": {
      "-ms-overflow-style": "auto",
      scrollbarWidth: "auto",
      "&::-webkit-scrollbar": {
        display: "block",
      },
    },
  });
});
```

### グラスモーフィズム

```javascript
plugin(function ({ addComponents, theme }) {
  addComponents({
    ".glass": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    },
    ".glass-dark": {
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
  });
});
```

### デバッグユーティリティ

```javascript
plugin(function ({ addUtilities }) {
  addUtilities({
    ".debug": {
      outline: "1px solid red",
    },
    ".debug-blue": {
      outline: "1px solid blue",
    },
    ".debug-green": {
      outline: "1px solid green",
    },
    ".debug *": {
      outline: "1px solid red",
    },
  });
});
```

## サードパーティプラグイン

### daisyUI

```bash
npm install daisyui
```

```javascript
module.exports = {
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark", "cupcake"],
  },
};
```

```html
<button class="btn btn-primary">daisyUI ボタン</button>
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">カード</h2>
  </div>
</div>
```

### tailwind-scrollbar

```bash
npm install tailwind-scrollbar
```

```javascript
module.exports = {
  plugins: [require("tailwind-scrollbar")],
};
```

```html
<div class="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
  スクロール可能なコンテンツ
</div>
```

## まとめ

- 公式プラグインで typography, forms, aspect-ratio を拡張
- `addUtilities` でカスタムユーティリティを追加
- `addComponents` でコンポーネントクラスを追加
- `addVariant` でカスタムバリアントを追加
- サードパーティプラグインで機能を拡張

## 確認問題

1. @tailwindcss/typography の用途を説明してください
2. カスタムユーティリティプラグインを作成してください
3. hocus バリアントを実装してください

## 次の章へ

[15 - Components](./15-Components.md) では、実践的なコンポーネントパターンを学びます。
