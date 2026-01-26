# 05 - Environment Variables（環境変数）

## この章で学ぶこと

- 環境変数ファイルの使い方
- VITE\_ プレフィックス
- TypeScript での型定義
- モードと環境変数

## 環境変数ファイル

### ファイルの種類

```
.env                # 全環境で読み込み
.env.local          # 全環境（gitignore）
.env.[mode]         # 特定モード
.env.[mode].local   # 特定モード（gitignore）
```

### 読み込み優先順位

```
# mode=development の場合
.env.development.local  # 最優先
.env.development
.env.local
.env                    # 最低優先
```

## 環境変数の定義

### .env

```bash
# 全環境共通
VITE_APP_TITLE=My App
VITE_API_URL=https://api.example.com
```

### .env.development

```bash
# 開発環境
VITE_API_URL=http://localhost:8080
VITE_DEBUG=true
```

### .env.production

```bash
# 本番環境
VITE_API_URL=https://api.example.com
VITE_DEBUG=false
```

### .env.local

```bash
# ローカル環境（gitignore に追加）
VITE_API_KEY=my-secret-key
```

## VITE\_ プレフィックス

### クライアントに公開される変数

```bash
# ✅ VITE_ プレフィックスはクライアントに公開
VITE_API_URL=https://api.example.com
VITE_PUBLIC_KEY=pk_123

# ❌ プレフィックスなしはクライアントに公開されない
DATABASE_URL=postgres://...
SECRET_KEY=secret
```

### 使用方法

```typescript
// アクセス方法
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_PUBLIC_KEY);

// ビルトイン変数
console.log(import.meta.env.MODE); // 'development' | 'production'
console.log(import.meta.env.BASE_URL); // base 設定の値
console.log(import.meta.env.PROD); // true（本番モード）
console.log(import.meta.env.DEV); // true（開発モード）
console.log(import.meta.env.SSR); // true（SSR時）
```

## TypeScript での型定義

### vite-env.d.ts

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_URL: string;
  readonly VITE_DEBUG: string;
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### 使用例

```typescript
// 型安全なアクセス
const apiUrl: string = import.meta.env.VITE_API_URL;
const isDebug: boolean = import.meta.env.VITE_DEBUG === "true";

// 環境に応じた処理
if (import.meta.env.DEV) {
  console.log("Development mode");
}

if (import.meta.env.PROD) {
  // 本番のみの処理
}
```

## モードの使い方

### 組み込みモード

```bash
# development モード（デフォルト）
vite
vite --mode development

# production モード
vite build
vite build --mode production
```

### カスタムモード

```bash
# staging モード
vite build --mode staging
```

```bash
# .env.staging
VITE_API_URL=https://staging-api.example.com
VITE_ENV=staging
```

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
  if (mode === "staging") {
    return {
      // staging 用の設定
    };
  }
  return {
    // デフォルト設定
  };
});
```

## 設定ファイルでの環境変数

### loadEnv の使用

```typescript
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // 環境変数を読み込み
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      // グローバル定数として定義
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
```

### プレフィックスのカスタマイズ

```typescript
// VITE_ 以外のプレフィックスも読み込む
const env = loadEnv(mode, process.cwd(), "MYAPP_");
```

## define オプション

### グローバル定数の定義

```typescript
export default defineConfig({
  define: {
    // 文字列として置換
    __APP_VERSION__: JSON.stringify("1.0.0"),

    // process.env の置換
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),

    // オブジェクト
    __CONFIG__: JSON.stringify({
      api: "https://api.example.com",
    }),
  },
});
```

### 使用例

```typescript
// コード内で直接使用
console.log(__APP_VERSION__); // "1.0.0"
console.log(__CONFIG__.api); // "https://api.example.com"
```

## セキュリティ

### .gitignore

```gitignore
# 環境変数ファイル
.env.local
.env.*.local
.env.development.local
.env.production.local
```

### 機密情報の取り扱い

```bash
# ❌ クライアントに公開される（危険）
VITE_API_SECRET=secret-key

# ✅ サーバーサイドでのみ使用（vite.config.ts内で）
API_SECRET=secret-key
```

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // サーバーサイドでのみ使用
  // API_SECRET はクライアントには公開されない
  console.log(env.API_SECRET); // 設定ファイル内でのみ使用

  return {
    // ...
  };
});
```

## 実践的なパターン

### API クライアントの設定

```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const api = {
  baseURL: API_URL,
  headers: {
    "X-API-Key": API_KEY,
  },
};
```

### 環境に応じたロギング

```typescript
// src/lib/logger.ts
const isDebug = import.meta.env.VITE_DEBUG === "true";

export const logger = {
  log: (...args: any[]) => {
    if (isDebug || import.meta.env.DEV) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};
```

## まとめ

- `.env` ファイルで環境変数を管理
- `VITE_` プレフィックスでクライアントに公開
- TypeScript で型定義を追加
- `loadEnv` で設定ファイル内で環境変数を使用
- 機密情報は `VITE_` プレフィックスを付けない

## 確認問題

1. VITE\_ プレフィックスの役割を説明してください
2. 環境変数の型定義を追加してください
3. 開発/本番で API URL を切り替えてください

## 次の章へ

[06 - Assets](./06-Assets.md) では、静的アセットの取り扱いについて学びます。
