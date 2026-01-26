# 08 - Optimization（最適化）

## この章で学ぶこと

- 開発時の最適化
- ビルド時の最適化
- パフォーマンス改善テクニック

## 開発時の最適化

### 依存関係の事前バンドル

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    // 事前バンドルに含める
    include: [
      "react",
      "react-dom",
      "lodash-es",
      // ネストした依存関係
      "package > nested-dep",
    ],

    // 事前バンドルから除外
    exclude: ["@my-local/package"],

    // エントリーポイント
    entries: ["src/main.tsx", "src/admin.tsx"],

    // esbuild オプション
    esbuildOptions: {
      target: "esnext",
      plugins: [],
    },

    // 強制的に再最適化
    force: true,
  },
});
```

### キャッシュの活用

```bash
# キャッシュディレクトリ
node_modules/.vite/

# キャッシュをクリア
rm -rf node_modules/.vite
```

```typescript
export default defineConfig({
  cacheDir: "node_modules/.vite", // デフォルト
});
```

## ビルド時の最適化

### Tree-shaking

```typescript
// ❌ 全体をインポート（Tree-shaking されない）
import _ from "lodash";
_.map([1, 2, 3], (n) => n * 2);

// ✅ 必要な関数のみインポート
import { map } from "lodash-es";
map([1, 2, 3], (n) => n * 2);
```

### Side Effects の設定

```json
// package.json
{
  "sideEffects": false,
  // または特定のファイルのみ
  "sideEffects": ["*.css", "*.scss"]
}
```

### コード分割

```typescript
// 動的インポートで自動分割
const Component = React.lazy(() => import("./Component"));

// ルートベースの分割
const routes = [
  {
    path: "/",
    component: () => import("./pages/Home"),
  },
  {
    path: "/about",
    component: () => import("./pages/About"),
  },
];
```

## チャンク最適化

### 手動チャンク分割

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // ベンダーライブラリ
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          // UIライブラリ
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],

          // ユーティリティ
          utils: ["lodash-es", "date-fns"],
        },
      },
    },
  },
});
```

### 関数での分割

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // node_modules を vendor に分割
          if (id.includes("node_modules")) {
            // React 関連
            if (id.includes("react")) {
              return "react-vendor";
            }
            // その他
            return "vendor";
          }
        },
      },
    },
  },
});
```

## CSS の最適化

### CSS コード分割

```typescript
export default defineConfig({
  build: {
    cssCodeSplit: true, // デフォルト
  },
});
```

### CSS 圧縮

```typescript
export default defineConfig({
  build: {
    cssMinify: "esbuild", // 'esbuild' | 'lightningcss'
  },
  css: {
    // Lightning CSS（実験的）
    transformer: "lightningcss",
    lightningcss: {
      targets: {
        chrome: 100,
        firefox: 100,
        safari: 15,
      },
    },
  },
});
```

## 画像の最適化

### 圧縮プラグイン

```bash
npm install -D vite-plugin-image-optimizer
```

```typescript
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
  plugins: [
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { quality: 80 },
      avif: { quality: 70 },
    }),
  ],
});
```

### インライン化の閾値

```typescript
export default defineConfig({
  build: {
    assetsInlineLimit: 4096, // 4KB 未満は base64 化
  },
});
```

## Gzip / Brotli 圧縮

```bash
npm install -D vite-plugin-compression
```

```typescript
import compression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    // Gzip
    compression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    // Brotli
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
  ],
});
```

## パフォーマンス計測

### ビルド時間の計測

```bash
# 詳細なログ
DEBUG=vite:* npm run build

# 時間計測
time npm run build
```

### バンドルサイズの分析

```typescript
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    visualizer({
      filename: "stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

## 遅延読み込みパターン

### コンポーネントの遅延読み込み

```typescript
import { lazy, Suspense } from "react";

// 遅延読み込み
const HeavyComponent = lazy(() => import("./HeavyComponent"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 条件付き読み込み

```typescript
// 必要な時だけ読み込み
async function loadChart() {
  const { Chart } = await import("chart.js");
  return new Chart(/* ... */);
}

// ユーザーアクションで読み込み
button.onclick = async () => {
  const module = await import("./heavy-module");
  module.doSomething();
};
```

## プリロード

### モジュールのプリロード

```html
<!-- index.html -->
<link rel="modulepreload" href="/src/main.tsx" />
```

```typescript
// 動的にプリロード
const preloadComponent = () => {
  import("./HeavyComponent");
};

// ホバー時にプリロード
<button onMouseEnter={preloadComponent}>Load</button>;
```

## まとめ

- 依存関係の事前バンドルで開発を高速化
- Tree-shaking で未使用コードを削除
- 手動チャンク分割でバンドルを最適化
- 画像・CSS を圧縮
- 遅延読み込みで初期ロードを軽量化

## 確認問題

1. Tree-shaking が有効になる条件を説明してください
2. 手動チャンク分割を設定してください
3. バンドルサイズを分析する方法を説明してください

## 次の章へ

[09 - Code-Splitting](./09-Code-Splitting.md) では、コード分割について詳しく学びます。
