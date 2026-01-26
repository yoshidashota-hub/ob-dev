# 01 - Setup（セットアップ）

## この章で学ぶこと

- 各種フレームワークでのセットアップ
- 設定ファイルの構成
- VS Code 拡張機能
- 開発環境の最適化

## Vite + React でのセットアップ

### 1. プロジェクト作成

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
```

### 2. Tailwind CSS インストール

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. 設定ファイルの編集

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### 4. CSS ファイルの設定

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. 動作確認

```tsx
// src/App.tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600">Hello Tailwind!</h1>
    </div>
  );
}

export default App;
```

## Next.js でのセットアップ

### 1. プロジェクト作成（自動セットアップ）

```bash
npx create-next-app@latest my-app --typescript --tailwind
cd my-app
```

### 2. 手動セットアップの場合

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Tailwind CSS v4 (最新)

Tailwind CSS v4 では設定方法が変わりました：

```bash
npm install tailwindcss @tailwindcss/vite
```

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

```css
/* src/index.css */
@import "tailwindcss";
```

## VS Code 拡張機能

### 必須: Tailwind CSS IntelliSense

```json
// .vscode/extensions.json
{
  "recommendations": ["bradlc.vscode-tailwindcss"]
}
```

機能：

- クラス名の自動補完
- ホバーで CSS プレビュー
- リンティング
- カラープレビュー

### 推奨設定

```json
// .vscode/settings.json
{
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "editor.quickSuggestions": {
    "strings": true
  },
  "tailwindCSS.classAttributes": ["class", "className", "ngClass", "class:list"]
}
```

## Prettier プラグイン

クラスの自動ソート：

```bash
npm install -D prettier prettier-plugin-tailwindcss
```

```json
// .prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "./tailwind.config.js"
}
```

ソート前：

```html
<div class="p-4 flex bg-white items-center justify-between"></div>
```

ソート後：

```html
<div class="flex items-center justify-between bg-white p-4"></div>
```

## ESLint 設定

```bash
npm install -D eslint-plugin-tailwindcss
```

```javascript
// .eslintrc.js
module.exports = {
  extends: ["plugin:tailwindcss/recommended"],
  rules: {
    "tailwindcss/no-custom-classname": "warn",
    "tailwindcss/classnames-order": "warn",
  },
};
```

## 基本的なディレクトリ構成

```
src/
├── components/
│   ├── ui/           # 基本UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   └── layout/       # レイアウトコンポーネント
│       ├── Header.tsx
│       └── Footer.tsx
├── styles/
│   └── globals.css   # Tailwind ディレクティブ
├── App.tsx
└── main.tsx
```

## まとめ

- Vite/Next.js で簡単にセットアップ可能
- `tailwind.config.js` で content パスを正しく設定
- VS Code 拡張機能で開発効率を向上
- Prettier プラグインでクラス順を自動整理

## 確認問題

1. `content` 設定の役割を説明してください
2. Tailwind CSS IntelliSense の主な機能を挙げてください
3. Prettier プラグインを使うメリットを説明してください

## 次の章へ

[02 - Utility-First](./02-Utility-First.md) では、ユーティリティファーストの考え方を詳しく学びます。
