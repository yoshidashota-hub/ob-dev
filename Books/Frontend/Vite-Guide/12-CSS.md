# 12 - CSS（CSS とプリプロセッサ）

## この章で学ぶこと

- CSS のインポート
- CSS Modules
- PostCSS
- プリプロセッサ（Sass, Less）

## CSS のインポート

### 基本的なインポート

```typescript
// グローバル CSS
import "./styles/global.css";

// コンポーネント CSS
import "./Button.css";
```

### CSS Modules

```css
/* Button.module.css */
.button {
  background: blue;
  color: white;
}

.primary {
  background: #3b82f6;
}

.secondary {
  background: #6b7280;
}
```

```typescript
// Button.tsx
import styles from "./Button.module.css";

function Button({ variant = "primary" }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>Click me</button>
  );
}
```

### CSS Modules の設定

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    modules: {
      // クラス名の命名規則
      localsConvention: "camelCase", // 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly'

      // スコープの動作
      scopeBehaviour: "local", // 'local' | 'global'

      // クラス名の生成パターン
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
  },
});
```

## PostCSS

### 設定

```bash
npm install -D postcss autoprefixer
```

```javascript
// postcss.config.js
export default {
  plugins: {
    autoprefixer: {},
  },
};
```

### Tailwind CSS との統合

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### その他の PostCSS プラグイン

```bash
npm install -D postcss-nesting postcss-import
```

```javascript
// postcss.config.js
export default {
  plugins: {
    "postcss-import": {},
    "postcss-nesting": {},
    autoprefixer: {},
  },
};
```

## プリプロセッサ

### Sass

```bash
npm install -D sass
```

```scss
// styles/variables.scss
$primary: #3b82f6;
$secondary: #6b7280;

// styles/mixins.scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

```scss
// Button.scss
@import "./variables";
@import "./mixins";

.button {
  @include flex-center;
  background: $primary;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;

  &:hover {
    background: darken($primary, 10%);
  }

  &.secondary {
    background: $secondary;
  }
}
```

### グローバル変数の注入

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
        `,
      },
    },
  },
});
```

### Less

```bash
npm install -D less
```

```less
// variables.less
@primary: #3b82f6;

// Button.less
@import "./variables.less";

.button {
  background: @primary;

  &:hover {
    background: darken(@primary, 10%);
  }
}
```

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        math: "always",
        globalVars: {
          primary: "#3b82f6",
        },
      },
    },
  },
});
```

### Stylus

```bash
npm install -D stylus
```

```stylus
// Button.styl
primary = #3B82F6

.button
  background primary
  padding 0.5rem 1rem

  &:hover
    background darken(primary, 10%)
```

## CSS-in-JS

### styled-components

```bash
npm install styled-components
npm install -D @types/styled-components
```

```typescript
import styled from "styled-components";

const Button = styled.button`
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;

  &:hover {
    background: #2563eb;
  }
`;
```

### Emotion

```bash
npm install @emotion/react @emotion/styled
```

```typescript
// vite.config.ts
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
  ],
});
```

```typescript
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";

const buttonStyle = css`
  background: #3b82f6;
  color: white;
`;

function Button() {
  return <button css={buttonStyle}>Click me</button>;
}
```

## Lightning CSS（実験的）

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    transformer: "lightningcss",
    lightningcss: {
      targets: {
        chrome: 100,
        firefox: 100,
        safari: 15,
      },
      drafts: {
        nesting: true,
        customMedia: true,
      },
    },
  },
  build: {
    cssMinify: "lightningcss",
  },
});
```

## ソースマップ

```typescript
export default defineConfig({
  css: {
    devSourcemap: true, // 開発時のソースマップ
  },
  build: {
    sourcemap: true, // ビルド時のソースマップ
  },
});
```

## まとめ

- CSS はそのままインポート可能
- CSS Modules で スコープを限定
- PostCSS で変換処理（Tailwind, Autoprefixer）
- Sass/Less/Stylus はパッケージを追加するだけで使用可能
- CSS-in-JS も設定次第でサポート

## 確認問題

1. CSS Modules の利点を説明してください
2. Sass でグローバル変数を注入してください
3. PostCSS で Tailwind CSS を設定してください

## 次の章へ

[13 - Testing](./13-Testing.md) では、Vitest を使ったテストについて学びます。
