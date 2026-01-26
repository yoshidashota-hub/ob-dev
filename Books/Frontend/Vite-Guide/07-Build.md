# 07 - Build（プロダクションビルド）

## この章で学ぶこと

- ビルドの仕組み
- ビルドオプション
- 出力の分析
- マルチページビルド

## ビルドの基本

### コマンド

```bash
# プロダクションビルド
npm run build

# プレビュー
npm run preview
```

### ビルドプロセス

```
ソースコード
    ↓
TypeScript 変換（tsc）
    ↓
Rollup バンドル
    ↓
圧縮・最適化
    ↓
dist/
```

## 出力構造

```
dist/
├── index.html
├── assets/
│   ├── index-abc123.js      # メインバンドル
│   ├── index-def456.css     # CSS
│   ├── vendor-ghi789.js     # ベンダーチャンク
│   └── logo-jkl012.png      # アセット
└── (public のファイル)
```

## ビルドオプション

### vite.config.ts

```typescript
export default defineConfig({
  build: {
    // 出力ディレクトリ
    outDir: "dist",

    // アセットディレクトリ
    assetsDir: "assets",

    // 空のディレクトリを削除
    emptyOutDir: true,

    // ソースマップ
    sourcemap: false, // 'inline' | 'hidden' | true | false

    // 圧縮
    minify: "esbuild", // 'esbuild' | 'terser' | false

    // ターゲット
    target: "es2015",

    // CSS コード分割
    cssCodeSplit: true,

    // CSS 圧縮ターゲット
    cssTarget: "chrome80",

    // マニフェスト生成
    manifest: true,

    // SSR ビルド
    ssr: false,

    // ライブラリモード
    lib: undefined,

    // 圧縮サイズのレポート
    reportCompressedSize: true,

    // チャンクサイズ警告の閾値
    chunkSizeWarningLimit: 500,
  },
});
```

### Rollup オプション

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      // 入力
      input: {
        main: "index.html",
        admin: "admin.html",
      },

      // 出力
      output: {
        // エントリーチャンクの命名
        entryFileNames: "js/[name]-[hash].js",

        // チャンクの命名
        chunkFileNames: "js/[name]-[hash].js",

        // アセットの命名
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },

        // 手動チャンク分割
        manualChunks: {
          vendor: ["react", "react-dom"],
          utils: ["lodash-es", "date-fns"],
        },
      },

      // 外部モジュール
      external: ["react", "react-dom"],
    },
  },
});
```

## ターゲットの設定

### ブラウザターゲット

```typescript
export default defineConfig({
  build: {
    // モダンブラウザ
    target: "esnext",

    // 特定のブラウザ
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],

    // レガシーブラウザ（別途プラグイン必要）
    target: "es2015",
  },
});
```

### レガシーブラウザ対応

```bash
npm install -D @vitejs/plugin-legacy
```

```typescript
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
});
```

## ライブラリモード

### ライブラリとしてビルド

```typescript
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "MyLib",
      fileName: (format) => `my-lib.${format}.js`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      // 外部依存を除外
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
```

### package.json の設定

```json
{
  "name": "my-lib",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/my-lib.umd.js",
  "module": "./dist/my-lib.es.js",
  "exports": {
    ".": {
      "import": "./dist/my-lib.es.js",
      "require": "./dist/my-lib.umd.js"
    }
  }
}
```

## マルチページアプリケーション

### ディレクトリ構成

```
project/
├── index.html
├── admin.html
├── src/
│   ├── main.ts
│   └── admin.ts
└── vite.config.ts
```

### 設定

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        admin: "admin.html",
      },
    },
  },
});
```

## ビルド分析

### バンドルサイズの確認

```bash
npm install -D rollup-plugin-visualizer
```

```typescript
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

### ビルド後のサイズ確認

```bash
# ビルド時に表示
dist/assets/index-abc123.js    150.25 kB │ gzip: 48.12 kB
dist/assets/vendor-def456.js    80.50 kB │ gzip: 26.30 kB
```

## 圧縮オプション

### esbuild（デフォルト）

```typescript
export default defineConfig({
  build: {
    minify: "esbuild",
  },
  esbuild: {
    drop: ["console", "debugger"], // console.log を削除
  },
});
```

### Terser（より高度な圧縮）

```bash
npm install -D terser
```

```typescript
export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

## まとめ

- Rollup ベースのプロダクションビルド
- `build` オプションでカスタマイズ
- チャンク分割でパフォーマンス最適化
- ライブラリモードで npm パッケージを作成
- マルチページアプリケーションに対応

## 確認問題

1. ビルド時のチャンク分割を設定してください
2. レガシーブラウザ対応を有効化してください
3. ビルドサイズを分析する方法を説明してください

## 次の章へ

[08 - Optimization](./08-Optimization.md) では、パフォーマンス最適化について学びます。
