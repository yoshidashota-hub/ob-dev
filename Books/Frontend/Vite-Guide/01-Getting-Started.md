# 01 - Getting Started（はじめかた）

## この章で学ぶこと

- Vite プロジェクトの作成
- 各テンプレートの選択
- 開発サーバーの起動
- 基本的なコマンド

## プロジェクトの作成

### npm

```bash
npm create vite@latest
```

### yarn

```bash
yarn create vite
```

### pnpm

```bash
pnpm create vite
```

### bun

```bash
bun create vite
```

## テンプレートの指定

### 対話形式

```bash
npm create vite@latest my-app
# ✔ Select a framework: › React
# ✔ Select a variant: › TypeScript + SWC
```

### コマンドで直接指定

```bash
# React + TypeScript
npm create vite@latest my-app -- --template react-ts

# React + TypeScript + SWC
npm create vite@latest my-app -- --template react-swc-ts

# Vue + TypeScript
npm create vite@latest my-app -- --template vue-ts

# Vanilla + TypeScript
npm create vite@latest my-app -- --template vanilla-ts
```

### 利用可能なテンプレート

| テンプレート     | 説明                    |
| ---------------- | ----------------------- |
| `vanilla`        | Vanilla JavaScript      |
| `vanilla-ts`     | Vanilla TypeScript      |
| `vue`            | Vue                     |
| `vue-ts`         | Vue + TypeScript        |
| `react`          | React                   |
| `react-ts`       | React + TypeScript      |
| `react-swc`      | React + SWC             |
| `react-swc-ts`   | React + TypeScript + SWC |
| `preact`         | Preact                  |
| `preact-ts`      | Preact + TypeScript     |
| `lit`            | Lit                     |
| `lit-ts`         | Lit + TypeScript        |
| `svelte`         | Svelte                  |
| `svelte-ts`      | Svelte + TypeScript     |
| `solid`          | Solid                   |
| `solid-ts`       | Solid + TypeScript      |
| `qwik`           | Qwik                    |
| `qwik-ts`        | Qwik + TypeScript       |

## プロジェクトのセットアップ

```bash
# プロジェクト作成
npm create vite@latest my-app -- --template react-ts

# ディレクトリに移動
cd my-app

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 基本的なコマンド

```bash
# 開発サーバー（デフォルト: http://localhost:5173）
npm run dev

# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# TypeScript の型チェック
npm run type-check  # package.json に設定が必要
```

## 初期ディレクトリ構成

```
my-app/
├── node_modules/
├── public/              # 静的ファイル（そのままコピー）
│   └── vite.svg
├── src/
│   ├── assets/          # 処理される静的アセット
│   │   └── react.svg
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx         # エントリーポイント
│   └── vite-env.d.ts    # Vite の型定義
├── .gitignore
├── index.html           # HTMLエントリーポイント
├── package.json
├── tsconfig.json        # TypeScript 設定
├── tsconfig.node.json   # Node.js 用 TypeScript 設定
└── vite.config.ts       # Vite 設定
```

## 開発サーバーのオプション

```bash
# ポートを指定
npm run dev -- --port 3000

# ホストを公開（LAN からアクセス可能に）
npm run dev -- --host

# ブラウザを自動で開く
npm run dev -- --open

# HTTPS を有効化
npm run dev -- --https
```

## package.json のスクリプト

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

## エイリアスの設定

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

### 使用例

```typescript
// 相対パスの代わりにエイリアスを使用
import { Button } from "@/components/Button";
import { useAuth } from "@hooks/useAuth";
import { formatDate } from "@utils/date";
```

## まとめ

- `npm create vite@latest` でプロジェクト作成
- テンプレートでフレームワークを選択
- `npm run dev` で開発サーバー起動
- エイリアスで import を簡潔に

## 確認問題

1. React + TypeScript + SWC のテンプレートを作成するコマンドを書いてください
2. 開発サーバーをポート 3000 で起動するコマンドを書いてください
3. エイリアスを設定する利点を説明してください

## 次の章へ

[02 - Project-Structure](./02-Project-Structure.md) では、プロジェクト構成について詳しく学びます。
