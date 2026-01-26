# 04 - Configuration（vite.config.ts）

## この章で学ぶこと

- 設定ファイルの構造
- 主要な設定オプション
- 条件付き設定
- TypeScript での設定

## 基本的な設定

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

### IntelliSense

```typescript
// defineConfig を使うと型補完が効く
import { defineConfig } from "vite";

export default defineConfig({
  // ここで Ctrl+Space で候補が表示される
});
```

## 主要な設定オプション

### root（プロジェクトルート）

```typescript
export default defineConfig({
  // デフォルトは process.cwd()
  root: "src",
});
```

### base（ベースパス）

```typescript
export default defineConfig({
  // CDN やサブディレクトリにデプロイする場合
  base: "/my-app/",

  // 環境変数で切り替え
  base: process.env.BASE_URL || "/",
});
```

### publicDir（静的ファイル）

```typescript
export default defineConfig({
  // デフォルトは 'public'
  publicDir: "static",

  // 無効化
  publicDir: false,
});
```

### resolve（解決オプション）

```typescript
import path from "path";

export default defineConfig({
  resolve: {
    // エイリアス
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },

    // 拡張子の解決順序
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],

    // 条件付きエクスポート
    conditions: ["import", "module", "browser", "default"],
  },
});
```

### css（CSS オプション）

```typescript
export default defineConfig({
  css: {
    // CSS Modules
    modules: {
      localsConvention: "camelCase",
      scopeBehaviour: "local",
    },

    // PostCSS
    postcss: "./postcss.config.js",

    // プリプロセッサオプション
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
      less: {
        javascriptEnabled: true,
      },
    },

    // DevSourcemap
    devSourcemap: true,
  },
});
```

### json（JSON オプション）

```typescript
export default defineConfig({
  json: {
    // 名前付きインポートを有効化
    namedExports: true,

    // JSON の文字列化（Tree-shaking）
    stringify: true,
  },
});
```

### esbuild（esbuild オプション）

```typescript
export default defineConfig({
  esbuild: {
    // JSX のランタイム
    jsxFactory: "h",
    jsxFragment: "Fragment",
    jsxInject: `import { h, Fragment } from 'preact'`,

    // console.log を削除
    drop: ["console", "debugger"],

    // ターゲット
    target: "esnext",
  },
});
```

### build（ビルドオプション）

```typescript
export default defineConfig({
  build: {
    // 出力ディレクトリ
    outDir: "dist",

    // アセットディレクトリ
    assetsDir: "assets",

    // インライン化の閾値（バイト）
    assetsInlineLimit: 4096,

    // CSS コード分割
    cssCodeSplit: true,

    // ソースマップ
    sourcemap: true, // または 'inline' | 'hidden'

    // Rollup オプション
    rollupOptions: {
      input: {
        main: "index.html",
        admin: "admin.html",
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },

    // 圧縮
    minify: "terser", // 'esbuild' | 'terser' | false

    // ターゲット
    target: "es2015",

    // レポート
    reportCompressedSize: false, // ビルド高速化
  },
});
```

## 条件付き設定

### コマンドとモードで分岐

```typescript
import { defineConfig } from "vite";

export default defineConfig(({ command, mode }) => {
  // command: 'serve' (dev) または 'build'
  // mode: 'development' | 'production' | カスタム

  if (command === "serve") {
    return {
      // 開発時の設定
      server: {
        port: 3000,
      },
    };
  } else {
    return {
      // ビルド時の設定
      build: {
        sourcemap: mode !== "production",
      },
    };
  }
});
```

### 環境変数で分岐

```typescript
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // 環境変数を読み込み
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      __APP_VERSION__: JSON.stringify(env.APP_VERSION),
    },
    server: {
      proxy: {
        "/api": env.API_URL,
      },
    },
  };
});
```

### 非同期設定

```typescript
export default defineConfig(async ({ command, mode }) => {
  const data = await fetchSomething();

  return {
    // 設定
  };
});
```

## 複数の設定ファイル

### ファイル名の規則

```
vite.config.js      # デフォルト
vite.config.ts      # TypeScript
vite.config.mjs     # ESM
vite.config.cjs     # CommonJS
```

### カスタム設定ファイル

```bash
# 別の設定ファイルを使用
vite --config vite.config.custom.ts
vite build --config vite.config.prod.ts
```

## 設定の共有

### 共通設定の抽出

```typescript
// vite.config.shared.ts
import { defineConfig } from "vite";

export const sharedConfig = defineConfig({
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});

// vite.config.ts
import { defineConfig, mergeConfig } from "vite";
import { sharedConfig } from "./vite.config.shared";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    // 追加の設定
  }),
);
```

## まとめ

- `defineConfig` で型安全な設定
- `resolve.alias` でパスエイリアス
- `build` でビルドオプションを設定
- 関数形式で条件付き設定
- `loadEnv` で環境変数を読み込み

## 確認問題

1. パスエイリアスを設定してください
2. 開発時とビルド時で設定を分けてください
3. 環境変数を設定に反映してください

## 次の章へ

[05 - Environment-Variables](./05-Environment-Variables.md) では、環境変数の管理について学びます。
