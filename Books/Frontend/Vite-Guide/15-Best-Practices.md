# 15 - Best Practices（ベストプラクティス）

## この章で学ぶこと

- プロジェクト構成
- パフォーマンス最適化
- 開発効率化
- セキュリティ

## プロジェクト構成

### 推奨ディレクトリ構造

```
my-vite-app/
├── public/                 # 静的アセット（変換なし）
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/             # 変換されるアセット
│   │   ├── images/
│   │   └── fonts/
│   ├── components/         # 共通コンポーネント
│   │   ├── ui/             # UIコンポーネント
│   │   └── layout/         # レイアウトコンポーネント
│   ├── features/           # 機能別モジュール
│   │   ├── auth/
│   │   └── dashboard/
│   ├── hooks/              # カスタムフック
│   ├── lib/                # ユーティリティ
│   ├── pages/              # ページコンポーネント
│   ├── services/           # API クライアント
│   ├── stores/             # 状態管理
│   ├── styles/             # グローバルスタイル
│   ├── types/              # 型定義
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/                  # テスト
│   ├── unit/
│   └── e2e/
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

### パスエイリアスの設定

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@stores": path.resolve(__dirname, "./src/stores"),
      "@types": path.resolve(__dirname, "./src/types"),
    },
  },
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@features/*": ["src/features/*"],
      "@hooks/*": ["src/hooks/*"],
      "@lib/*": ["src/lib/*"],
      "@services/*": ["src/services/*"],
      "@stores/*": ["src/stores/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

## パフォーマンス最適化

### 1. コード分割

```typescript
// ルートベースの分割
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Settings = lazy(() => import("@/pages/Settings"));

// 条件付き読み込み
const AdminPanel = lazy(() =>
  user.isAdmin ? import("@/features/admin/AdminPanel") : Promise.resolve(null),
);
```

### 2. ベンダー分割

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
    },
  },
});
```

### 3. 画像の最適化

```typescript
// 画像のインポート
import heroImage from "@/assets/images/hero.webp";

// レスポンシブ画像
<picture>
  <source srcSet={heroImageWebp} type="image/webp" />
  <source srcSet={heroImageJpg} type="image/jpeg" />
  <img src={heroImageJpg} alt="Hero" loading="lazy" />
</picture>
```

### 4. プリロード

```typescript
// クリティカルアセットのプリロード
// index.html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

// コンポーネントのプリロード
const prefetchComponent = () => {
  import('@/pages/Dashboard');
};

<button onMouseEnter={prefetchComponent}>
  Dashboard
</button>
```

### 5. ビルド最適化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // ターゲット
    target: "es2020",

    // 圧縮
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // チャンクサイズ警告
    chunkSizeWarningLimit: 500,

    // CSS コード分割
    cssCodeSplit: true,

    // ソースマップ（本番では無効推奨）
    sourcemap: false,

    // Rollup オプション
    rollupOptions: {
      output: {
        // ファイル名にハッシュ
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
```

## 開発効率化

### 1. 開発サーバーの最適化

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    // HMR の最適化
    hmr: {
      overlay: true,
    },

    // 依存関係の事前バンドル
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx"],
    },
  },

  // 依存関係の最適化
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
    exclude: ["@vite/client"],
  },
});
```

### 2. ESLint + Prettier

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
};
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### 3. Git Hooks（husky + lint-staged）

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

### 4. VSCode 設定

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "antfu.vite"
  ]
}
```

## セキュリティ

### 1. 環境変数の管理

```typescript
// 公開される変数は VITE_ プレフィックス
// .env
VITE_API_URL=https://api.example.com
VITE_PUBLIC_KEY=pk_live_xxx

// サーバー側でのみ使用する変数は VITE_ なし
// これらはクライアントには公開されない
DATABASE_URL=postgresql://...
SECRET_KEY=xxx
```

```typescript
// 型安全な環境変数
// src/vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PUBLIC_KEY: string;
}
```

### 2. CSP（Content Security Policy）

```html
<!-- index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.example.com;
  "
/>
```

### 3. 依存関係の監査

```bash
# セキュリティ監査
npm audit

# 脆弱性の修正
npm audit fix

# 依存関係の更新
npm update
npx npm-check-updates
```

### 4. サニタイズ

```typescript
// ユーザー入力のサニタイズ
import DOMPurify from "dompurify";

function SafeHTML({ html }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html),
      }}
    />
  );
}
```

## テスト戦略

### 1. テスト構成

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    // グローバル API
    globals: true,

    // テスト環境
    environment: "jsdom",

    // セットアップ
    setupFiles: ["./src/test/setup.ts"],

    // カバレッジ
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

### 2. テストの書き方

```typescript
// コンポーネントテスト
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick handler", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## デバッグ

### 1. デバッグ設定

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Vite App",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

### 2. ロギング

```typescript
// lib/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log("[LOG]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn("[WARN]", ...args);
  },
};
```

## チェックリスト

### 開発開始時

- [ ] パスエイリアスの設定
- [ ] ESLint + Prettier の設定
- [ ] Git Hooks の設定
- [ ] 環境変数の設定
- [ ] TypeScript strict モード

### ビルド前

- [ ] コンソールログの削除
- [ ] 未使用のインポート削除
- [ ] バンドルサイズの確認
- [ ] 画像の最適化

### デプロイ前

- [ ] 環境変数の確認
- [ ] セキュリティ監査
- [ ] パフォーマンステスト
- [ ] ブラウザ互換性テスト

## まとめ

- **プロジェクト構成**: 一貫したディレクトリ構造とパスエイリアス
- **パフォーマンス**: コード分割、画像最適化、プリロード
- **開発効率**: ESLint、Prettier、Git Hooks、VSCode 設定
- **セキュリティ**: 環境変数管理、CSP、依存関係監査
- **テスト**: Vitest + Testing Library で品質担保

## 確認問題

1. パフォーマンス最適化の手法を 3 つ挙げてください
2. セキュリティのベストプラクティスを説明してください
3. CI/CD パイプラインに含めるべきステップを列挙してください

## おわりに

本ガイドでは Vite の基本から実践的なテクニックまでを学びました。

- Vite の仕組みと高速な開発体験
- 設定のカスタマイズ
- 本番環境へのデプロイ

Vite を活用して、快適なフロントエンド開発を実現してください。
