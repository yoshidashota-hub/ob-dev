# 12 - Configuration（tailwind.config.js）

## この章で学ぶこと

- 設定ファイルの構造
- theme の拡張とカスタマイズ
- content の設定
- プリセットの利用

## 設定ファイルの基本構造

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // スキャンするファイル
  content: ["./src/**/*.{js,ts,jsx,tsx}"],

  // テーマのカスタマイズ
  theme: {
    // デフォルトを完全に上書き
    colors: {},

    // デフォルトを拡張
    extend: {
      colors: {},
    },
  },

  // プラグイン
  plugins: [],

  // ダークモード設定
  darkMode: "class",

  // カスタムプレフィックス
  prefix: "",

  // important 設定
  important: false,
};
```

## content の設定

```javascript
module.exports = {
  content: [
    // 相対パス
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",

    // node_modules 内のライブラリ
    "./node_modules/@heroicons/**/*.js",

    // HTML ファイル
    "./public/**/*.html",
  ],
};
```

## theme の拡張

### extend を使った拡張

```javascript
module.exports = {
  theme: {
    extend: {
      // 既存のカラーに追加
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
      },

      // フォントファミリー
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Poppins", "sans-serif"],
      },

      // スペーシング
      spacing: {
        18: "4.5rem",
        112: "28rem",
        128: "32rem",
      },

      // ボーダー半径
      borderRadius: {
        "4xl": "2rem",
      },

      // シャドウ
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07)",
      },

      // アニメーション
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
};
```

### デフォルトの上書き

```javascript
module.exports = {
  theme: {
    // extend の外に書くと完全に上書き
    colors: {
      // デフォルトの色が全て消え、これだけになる
      white: "#ffffff",
      black: "#000000",
      gray: {
        100: "#f5f5f5",
        500: "#737373",
        900: "#171717",
      },
      blue: {
        500: "#3b82f6",
      },
    },

    // フォントサイズを完全にカスタマイズ
    fontSize: {
      sm: ["14px", "20px"],
      base: ["16px", "24px"],
      lg: ["18px", "28px"],
      xl: ["20px", "28px"],
      "2xl": ["24px", "32px"],
    },

    // ブレークポイントのカスタマイズ
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
  },
};
```

## カスタムブレークポイント

```javascript
module.exports = {
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",

      // 最大幅（max-width）
      "max-md": { max: "767px" },

      // 範囲
      "md-lg": { min: "768px", max: "1023px" },

      // 生のメディアクエリ
      print: { raw: "print" },
      portrait: { raw: "(orientation: portrait)" },
    },
  },
};
```

## 複雑なカスタマイズ例

```javascript
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  theme: {
    extend: {
      // デフォルトのフォントを先頭に追加
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },

      // 動的な値
      spacing: ({ theme }) => ({
        ...theme("spacing"),
        "screen-1/2": "50vh",
      }),

      // 色の参照
      backgroundColor: ({ theme }) => ({
        ...theme("colors"),
        "surface-primary": theme("colors.white"),
        "surface-secondary": theme("colors.gray.50"),
      }),
    },
  },
};
```

## プラグインの追加

```javascript
module.exports = {
  plugins: [
    // 公式プラグイン
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/container-queries"),

    // カスタムプラグイン
    function ({ addUtilities, addComponents, theme }) {
      addUtilities({
        ".text-shadow": {
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
        },
        ".text-shadow-lg": {
          textShadow: "0 4px 8px rgba(0,0,0,0.12)",
        },
      });

      addComponents({
        ".btn": {
          padding: `${theme("spacing.2")} ${theme("spacing.4")}`,
          borderRadius: theme("borderRadius.lg"),
          fontWeight: theme("fontWeight.medium"),
        },
        ".btn-primary": {
          backgroundColor: theme("colors.blue.500"),
          color: theme("colors.white"),
          "&:hover": {
            backgroundColor: theme("colors.blue.600"),
          },
        },
      });
    },
  ],
};
```

## プリセット

```javascript
// tailwind.preset.js（共有設定）
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#0ea5e9",
          600: "#0284c7",
        },
      },
    },
  },
};

// tailwind.config.js
module.exports = {
  presets: [require("./tailwind.preset.js")],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
};
```

## Safelist（常に含めるクラス）

```javascript
module.exports = {
  safelist: [
    // 特定のクラス
    "bg-red-500",
    "text-3xl",

    // パターン
    {
      pattern: /bg-(red|green|blue)-(100|500|900)/,
      variants: ["hover", "dark"],
    },

    // すべての色のバリエーション
    {
      pattern: /text-(red|green|blue)-./,
    },
  ],
};
```

## important の設定

```javascript
module.exports = {
  // すべてのユーティリティに !important を付与
  important: true,

  // 特定のセレクタ内でのみ important
  important: "#app",
};
```

## TypeScript での設定

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#0ea5e9",
      },
    },
  },
  plugins: [],
};

export default config;
```

## まとめ

- `content` でスキャンするファイルを指定
- `theme.extend` で既存を拡張
- `theme` 直下で完全に上書き
- `plugins` でカスタム機能を追加
- `safelist` で動的クラスを保護

## 確認問題

1. `extend` を使う場合と使わない場合の違いを説明してください
2. カスタムカラーパレットを追加してください
3. カスタムアニメーションを定義してください

## 次の章へ

[13 - Custom-Utilities](./13-Custom-Utilities.md) では、カスタムユーティリティの作成を学びます。
