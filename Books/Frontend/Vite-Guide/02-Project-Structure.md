# 02 - Project Structure（プロジェクト構成）

## この章で学ぶこと

- Vite プロジェクトのファイル構成
- エントリーポイントの理解
- 推奨ディレクトリ構成

## 基本的なファイル構成

```
my-app/
├── node_modules/           # 依存パッケージ
├── public/                 # 静的ファイル（そのままコピー）
│   ├── favicon.ico
│   └── robots.txt
├── src/                    # ソースコード
│   ├── assets/             # 処理されるアセット
│   ├── components/         # コンポーネント
│   ├── hooks/              # カスタムフック
│   ├── utils/              # ユーティリティ
│   ├── App.tsx             # メインコンポーネント
│   ├── main.tsx            # エントリーポイント
│   └── vite-env.d.ts       # 型定義
├── index.html              # HTML エントリーポイント
├── package.json            # パッケージ設定
├── tsconfig.json           # TypeScript 設定
├── tsconfig.node.json      # Node.js 用設定
└── vite.config.ts          # Vite 設定
```

## 重要なファイル

### index.html

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <!-- 重要: type="module" で ES モジュールとして読み込み -->
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### src/main.tsx（エントリーポイント）

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### vite-env.d.ts

```typescript
/// <reference types="vite/client" />

// 環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});
```

## public vs src/assets

### public ディレクトリ

```
public/
├── favicon.ico     # そのままコピー
├── robots.txt      # そのままコピー
└── images/
    └── logo.png    # /images/logo.png でアクセス
```

```html
<!-- public のファイルは / から始まるパスでアクセス -->
<img src="/images/logo.png" />
```

特徴：

- ビルド時にそのままコピー
- ハッシュなし
- 動的に参照が必要な場合に使用
- `robots.txt`, `favicon.ico` など

### src/assets ディレクトリ

```
src/assets/
├── images/
│   └── hero.png
├── styles/
│   └── global.css
└── fonts/
    └── custom.woff2
```

```typescript
// import で参照（ビルド時に処理される）
import heroImage from "@/assets/images/hero.png";
import "@/assets/styles/global.css";

function App() {
  return <img src={heroImage} />;
}
```

特徴：

- ビルド時に最適化・バンドル
- ファイル名にハッシュが付与
- 小さいファイルは base64 インライン化
- Tree-shaking で未使用ファイルは除外

## 推奨ディレクトリ構成

### 小規模プロジェクト

```
src/
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Header.tsx
├── hooks/
│   └── useAuth.ts
├── utils/
│   └── format.ts
├── App.tsx
├── main.tsx
└── index.css
```

### 中規模プロジェクト

```
src/
├── components/
│   ├── ui/                 # 汎用UIコンポーネント
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── Card/
│   └── layout/             # レイアウトコンポーネント
│       ├── Header.tsx
│       └── Footer.tsx
├── features/               # 機能別モジュール
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   └── posts/
│       ├── components/
│       ├── hooks/
│       └── api.ts
├── hooks/                  # 共通フック
├── utils/                  # ユーティリティ
├── lib/                    # 外部ライブラリの設定
├── types/                  # 型定義
├── styles/                 # グローバルスタイル
├── App.tsx
└── main.tsx
```

### 大規模プロジェクト（Feature-based）

```
src/
├── app/                    # アプリケーション設定
│   ├── providers.tsx       # プロバイダー
│   ├── routes.tsx          # ルーティング
│   └── store.ts            # 状態管理
├── features/               # 機能モジュール
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── types/
│   │   └── index.ts
│   ├── users/
│   └── posts/
├── shared/                 # 共通モジュール
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── assets/
├── styles/
├── App.tsx
└── main.tsx
```

## インデックスファイルのパターン

### コンポーネントのエクスポート

```typescript
// src/components/ui/Button/index.ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

// src/components/ui/index.ts
export * from "./Button";
export * from "./Card";
export * from "./Input";
```

### 使用例

```typescript
// 簡潔なインポート
import { Button, Card, Input } from "@/components/ui";
```

## 設定ファイル

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## まとめ

- `index.html` がエントリーポイント
- `public/` は静的ファイル、`src/assets/` は処理されるアセット
- 機能ごとにディレクトリを分けると保守性が向上
- インデックスファイルで簡潔なインポートを実現

## 確認問題

1. `public/` と `src/assets/` の違いを説明してください
2. 中規模プロジェクトのディレクトリ構成を設計してください
3. インデックスファイルを使うメリットを説明してください

## 次の章へ

[03 - Dev-Server](./03-Dev-Server.md) では、開発サーバーについて詳しく学びます。
