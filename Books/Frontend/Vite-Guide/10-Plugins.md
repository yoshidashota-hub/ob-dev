# 10 - Plugins（プラグイン）

## この章で学ぶこと

- 公式プラグイン
- コミュニティプラグイン
- カスタムプラグインの作成

## 公式プラグイン

### @vitejs/plugin-react

```bash
npm install -D @vitejs/plugin-react
```

```typescript
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      // Babel プラグイン
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
      // JSX ランタイム
      jsxRuntime: "automatic",
    }),
  ],
});
```

### @vitejs/plugin-react-swc

```bash
npm install -D @vitejs/plugin-react-swc
```

```typescript
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [
    react({
      // SWC オプション
    }),
  ],
});
```

### @vitejs/plugin-vue

```bash
npm install -D @vitejs/plugin-vue
```

```typescript
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
});
```

### @vitejs/plugin-legacy

```bash
npm install -D @vitejs/plugin-legacy terser
```

```typescript
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
  ],
});
```

## よく使うコミュニティプラグイン

### vite-plugin-svgr（SVG を React コンポーネントに）

```bash
npm install -D vite-plugin-svgr
```

```typescript
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [svgr()],
});
```

```typescript
import { ReactComponent as Logo } from "./logo.svg";

function App() {
  return <Logo className="logo" />;
}
```

### vite-plugin-pwa（PWA サポート）

```bash
npm install -D vite-plugin-pwa
```

```typescript
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "My App",
        short_name: "App",
        theme_color: "#ffffff",
      },
    }),
  ],
});
```

### unplugin-auto-import（自動インポート）

```bash
npm install -D unplugin-auto-import
```

```typescript
import AutoImport from "unplugin-auto-import/vite";

export default defineConfig({
  plugins: [
    AutoImport({
      imports: ["react", "react-router-dom"],
      dts: "src/auto-imports.d.ts",
    }),
  ],
});
```

### vite-plugin-compression（圧縮）

```bash
npm install -D vite-plugin-compression
```

```typescript
import compression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    compression({ algorithm: "gzip" }),
    compression({ algorithm: "brotliCompress", ext: ".br" }),
  ],
});
```

### rollup-plugin-visualizer（バンドル分析）

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
    }),
  ],
});
```

## カスタムプラグインの作成

### 基本構造

```typescript
// my-plugin.ts
import type { Plugin } from "vite";

export function myPlugin(): Plugin {
  return {
    name: "my-plugin",

    // Vite 固有のフック
    configResolved(config) {
      console.log("Config resolved:", config);
    },

    // Rollup フック
    buildStart() {
      console.log("Build started");
    },

    transform(code, id) {
      if (id.endsWith(".custom")) {
        return {
          code: transformCode(code),
          map: null,
        };
      }
    },

    buildEnd() {
      console.log("Build ended");
    },
  };
}
```

### Vite 固有のフック

```typescript
export function myPlugin(): Plugin {
  return {
    name: "my-plugin",

    // 設定の変更
    config(config, { command, mode }) {
      if (command === "build") {
        return {
          define: {
            __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
          },
        };
      }
    },

    // 設定解決後
    configResolved(config) {
      // 最終的な設定にアクセス
    },

    // 開発サーバー設定
    configureServer(server) {
      // カスタムミドルウェアを追加
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/custom") {
          res.end("Custom response");
          return;
        }
        next();
      });
    },

    // プレビューサーバー設定
    configurePreviewServer(server) {
      // プレビュー用のミドルウェア
    },

    // HTML 変換
    transformIndexHtml(html) {
      return html.replace(
        "</head>",
        '<script>console.log("Injected!")</script></head>',
      );
    },

    // HMR 処理
    handleHotUpdate({ file, server }) {
      if (file.endsWith(".custom")) {
        server.ws.send({
          type: "full-reload",
        });
        return [];
      }
    },
  };
}
```

### 仮想モジュール

```typescript
const virtualModuleId = "virtual:my-module";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

export function virtualPlugin(): Plugin {
  return {
    name: "virtual-plugin",

    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export const msg = "Hello from virtual module!"`;
      }
    },
  };
}
```

```typescript
// 使用
import { msg } from "virtual:my-module";
console.log(msg); // "Hello from virtual module!"
```

### ファイル監視

```typescript
export function watchPlugin(): Plugin {
  return {
    name: "watch-plugin",

    configureServer(server) {
      server.watcher.add("./config/**");
      server.watcher.on("change", (file) => {
        if (file.includes("config")) {
          console.log("Config file changed:", file);
          server.restart();
        }
      });
    },
  };
}
```

## プラグインの順序

```typescript
export default defineConfig({
  plugins: [
    // 順番が重要
    plugin1(), // 最初に実行
    plugin2(),
    plugin3(), // 最後に実行
  ],
});
```

### enforce オプション

```typescript
export function myPlugin(): Plugin {
  return {
    name: "my-plugin",
    enforce: "pre", // 'pre' | 'post'
    // pre: 他のプラグインより先に実行
    // post: 他のプラグインより後に実行
  };
}
```

## まとめ

- 公式プラグインで主要フレームワークをサポート
- コミュニティプラグインで機能を拡張
- カスタムプラグインで独自の処理を追加
- 仮想モジュールでランタイムデータを提供

## 確認問題

1. React プロジェクトに必要なプラグインを説明してください
2. SVG をコンポーネントとして使うプラグインを設定してください
3. カスタムプラグインを作成してください

## 次の章へ

[11 - TypeScript](./11-TypeScript.md) では、TypeScript 統合について学びます。
