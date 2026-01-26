# 03 - Dev Server（開発サーバー）

## この章で学ぶこと

- Vite 開発サーバーの仕組み
- Hot Module Replacement (HMR)
- 開発サーバーの設定
- プロキシの設定

## 開発サーバーの仕組み

### ES モジュールベースの配信

```
ブラウザ                     Vite サーバー
   │                            │
   │  GET /src/main.tsx         │
   │ ──────────────────────────>│
   │                            │ TypeScript → JavaScript 変換
   │  <script type="module">    │
   │ <──────────────────────────│
   │                            │
   │  GET /src/App.tsx          │
   │ ──────────────────────────>│
   │                            │ 必要な時に変換
   │  JavaScript               │
   │ <──────────────────────────│
```

### 依存関係の事前バンドル

```bash
# 初回起動時
Vite: Pre-bundling dependencies:
  react
  react-dom
  react-router-dom
  ...
```

```
node_modules/               node_modules/.vite/
├── react/          →      ├── react.js (ESM)
├── react-dom/      →      └── react-dom.js (ESM)
└── lodash-es/             # CommonJS を ESM に変換
```

## Hot Module Replacement (HMR)

### 仕組み

```
ファイル変更
    ↓
Vite が検知
    ↓
変更されたモジュールのみ更新
    ↓
ブラウザがホットリロード（状態を維持）
```

### React での HMR

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()], // React Fast Refresh を有効化
});
```

### 手動 HMR API

```typescript
// カスタム HMR 処理
if (import.meta.hot) {
  import.meta.hot.accept("./module.ts", (newModule) => {
    // モジュールが更新された時の処理
    console.log("Module updated:", newModule);
  });

  // モジュールが破棄される時のクリーンアップ
  import.meta.hot.dispose((data) => {
    // 状態を保存
    data.savedState = currentState;
  });
}
```

## 開発サーバーの設定

### vite.config.ts

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // ポート番号
    port: 3000,

    // ポートが使用中の場合の動作
    strictPort: true, // エラーで終了
    // strictPort: false, // 次の空きポートを使用

    // ホスト
    host: true, // 0.0.0.0（LAN からアクセス可能）
    // host: 'localhost', // localhost のみ

    // 自動でブラウザを開く
    open: true,
    // open: '/admin', // 特定のパスを開く

    // HTTPS
    https: {
      key: "./certs/key.pem",
      cert: "./certs/cert.pem",
    },

    // CORS
    cors: true,

    // ヘッダー
    headers: {
      "X-Custom-Header": "value",
    },

    // HMR
    hmr: {
      overlay: true, // エラーオーバーレイ
    },

    // ファイル監視
    watch: {
      usePolling: true, // Docker 環境などで必要
    },
  },
});
```

## プロキシの設定

### API プロキシ

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      // /api へのリクエストを別サーバーに転送
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },

      // パスの書き換え
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },

      // WebSocket プロキシ
      "/socket.io": {
        target: "ws://localhost:8080",
        ws: true,
      },

      // 複数パターン
      "^/api/.*": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
```

### 使用例

```typescript
// フロントエンド
fetch("/api/users"); // → http://localhost:8080/users に転送
```

## プレビューサーバー

```bash
# プロダクションビルドをプレビュー
npm run build
npm run preview
```

```typescript
// vite.config.ts
export default defineConfig({
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
    open: true,
  },
});
```

## デバッグ

### Vite のログ

```bash
# 詳細ログを有効化
DEBUG=vite:* npm run dev

# 特定のモジュールのみ
DEBUG=vite:deps npm run dev
```

### vite.config.ts でのログ設定

```typescript
export default defineConfig({
  logLevel: "info", // 'info' | 'warn' | 'error' | 'silent'

  clearScreen: false, // コンソールをクリアしない
});
```

## パフォーマンス最適化

### 依存関係の最適化

```typescript
export default defineConfig({
  optimizeDeps: {
    // 事前バンドルに含める
    include: ["lodash-es", "axios"],

    // 事前バンドルから除外
    exclude: ["@my-local/package"],

    // esbuild オプション
    esbuildOptions: {
      target: "esnext",
    },
  },
});
```

### ファイル監視の最適化

```typescript
export default defineConfig({
  server: {
    watch: {
      // 監視から除外
      ignored: ["**/node_modules/**", "**/.git/**"],
    },
  },
});
```

## まとめ

- ES モジュールで高速な開発サーバー
- HMR で状態を維持しながら更新
- プロキシで API サーバーと連携
- 設定で柔軟にカスタマイズ可能

## 確認問題

1. Vite の開発サーバーが高速な理由を説明してください
2. API プロキシを設定してください
3. HMR が有効な場合と無効な場合の違いを説明してください

## 次の章へ

[04 - Configuration](./04-Configuration.md) では、Vite の設定ファイルについて詳しく学びます。
