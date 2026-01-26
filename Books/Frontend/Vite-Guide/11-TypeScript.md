# 11 - TypeScript（TypeScript 統合）

## この章で学ぶこと

- Vite での TypeScript サポート
- tsconfig.json の設定
- 型定義ファイル
- 型チェックの設定

## Vite の TypeScript サポート

### 仕組み

```
TypeScript ファイル
       ↓
   esbuild でトランスパイル（型チェックなし）
       ↓
   JavaScript
```

Vite は esbuild を使って高速にトランスパイルしますが、型チェックは行いません。

### 型チェックの実行

```bash
# 別途 tsc で型チェック
npx tsc --noEmit

# または package.json に追加
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "build": "tsc --noEmit && vite build"
  }
}
```

## tsconfig.json

### 推奨設定（React）

```json
{
  "compilerOptions": {
    // ターゲット
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],

    // モジュール
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,

    // JSX
    "jsx": "react-jsx",

    // 厳格モード
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    // パスエイリアス
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },

    // その他
    "skipLibCheck": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tsconfig.node.json（Vite 設定用）

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

## 型定義ファイル

### vite-env.d.ts

```typescript
/// <reference types="vite/client" />

// 環境変数の型
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// アセットの型
declare module "*.svg" {
  import React from "react";
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// 仮想モジュールの型
declare module "virtual:my-module" {
  export const data: string;
}
```

### グローバル型の拡張

```typescript
// types/global.d.ts

// Window オブジェクトの拡張
interface Window {
  __APP_VERSION__: string;
  dataLayer: any[];
}

// グローバル変数
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
```

## パスエイリアス

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
    },
  },
});
```

### tsconfig.json（同期）

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

## 厳格な型チェック

### strict モード

```json
{
  "compilerOptions": {
    "strict": true,
    // 以下が有効になる:
    // "noImplicitAny": true,
    // "strictNullChecks": true,
    // "strictFunctionTypes": true,
    // "strictBindCallApply": true,
    // "strictPropertyInitialization": true,
    // "noImplicitThis": true,
    // "alwaysStrict": true
  }
}
```

### 追加の厳格オプション

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## エディタ統合

### VS Code 設定

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

### ESLint との統合

```bash
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

```javascript
// .eslintrc.js
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
};
```

## ビルド時の型チェック

### vite-plugin-checker

```bash
npm install -D vite-plugin-checker
```

```typescript
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [
    checker({
      typescript: true,
      // ESLint も同時にチェック
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
    }),
  ],
});
```

### CI での型チェック

```yaml
# .github/workflows/ci.yml
jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run type-check
```

## JSDoc との併用

```typescript
// JSDoc コメントで型を補完
/**
 * ユーザー情報を取得
 * @param {string} id - ユーザーID
 * @returns {Promise<User>} ユーザー情報
 */
async function getUser(id: string): Promise<User> {
  // ...
}
```

## まとめ

- Vite は esbuild でトランスパイル（型チェックなし）
- 型チェックは `tsc --noEmit` で別途実行
- パスエイリアスは vite.config.ts と tsconfig.json の両方に設定
- vite-plugin-checker で開発中に型チェック
- strict モードで型安全性を向上

## 確認問題

1. Vite が型チェックを行わない理由を説明してください
2. パスエイリアスを設定してください
3. 環境変数の型定義を追加してください

## 次の章へ

[12 - CSS](./12-CSS.md) では、CSS とプリプロセッサについて学びます。
