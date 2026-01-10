# 13 - Configuration

## 概要

TypeScript のコンパイラ設定（tsconfig.json）について詳しく学びます。プロジェクトに適した設定を選択し、型安全性とビルドパフォーマンスを最適化する方法を理解します。

## 学習目標

- [ ] tsconfig.json の基本構造を理解できる
- [ ] 主要なコンパイラオプションを使いこなせる
- [ ] プロジェクトの種類に応じた設定ができる
- [ ] モノレポでの設定管理ができる

## tsconfig.json の基本

### 初期化

```bash
# tsconfig.json を生成
npx tsc --init

# 特定のテンプレートを使用
npx tsc --init --strict
```

### 基本構造

```json
{
  "compilerOptions": {
    // コンパイラの設定
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"],
  "files": ["src/index.ts"],
  "extends": "./tsconfig.base.json",
  "references": [{ "path": "./packages/core" }]
}
```

## コンパイラオプション

### 基本オプション

```json
{
  "compilerOptions": {
    // 出力する JavaScript のバージョン
    "target": "ES2022",

    // モジュールシステム
    "module": "NodeNext",

    // 出力ディレクトリ
    "outDir": "./dist",

    // ソースディレクトリ
    "rootDir": "./src",

    // 宣言ファイルを生成
    "declaration": true,

    // ソースマップを生成
    "sourceMap": true
  }
}
```

### target オプション

```json
{
  "compilerOptions": {
    // ES3, ES5, ES6/ES2015, ES2016, ES2017, ES2018, ES2019, ES2020, ES2021, ES2022, ESNext
    "target": "ES2022"
  }
}
```

```typescript
// ES2022 の機能
class MyClass {
  // クラスフィールド
  private name = "default";

  // プライベートフィールド
  #privateField = "secret";

  // 静的ブロック
  static {
    console.log("Static initialization");
  }
}

// Top-level await
const data = await fetch("/api/data");
```

### module オプション

```json
{
  "compilerOptions": {
    // CommonJS, AMD, UMD, ES6/ES2015, ES2020, ES2022, ESNext, NodeNext, Node16
    "module": "NodeNext",

    // モジュール解決戦略
    "moduleResolution": "NodeNext"
  }
}
```

### lib オプション

```json
{
  "compilerOptions": {
    // 使用する型定義ライブラリ
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

```typescript
// DOM 型が必要な場合
const element = document.getElementById("app");
element?.addEventListener("click", (e) => {
  console.log(e.target);
});

// ES2022 の機能
const arr = [1, 2, 3];
const last = arr.at(-1); // Array.at()
```

## 厳格性オプション

### strict モード

```json
{
  "compilerOptions": {
    // すべての厳格オプションを有効化
    "strict": true

    // 個別に設定する場合
    // "noImplicitAny": true,
    // "strictNullChecks": true,
    // "strictFunctionTypes": true,
    // "strictBindCallApply": true,
    // "strictPropertyInitialization": true,
    // "noImplicitThis": true,
    // "useUnknownInCatchVariables": true,
    // "alwaysStrict": true
  }
}
```

### noImplicitAny

```typescript
// ❌ noImplicitAny: true の場合エラー
function greet(name) {
  // Parameter 'name' implicitly has an 'any' type
  return `Hello, ${name}`;
}

// ✅ 型を明示
function greet(name: string): string {
  return `Hello, ${name}`;
}
```

### strictNullChecks

```typescript
// strictNullChecks: true の場合

function getLength(str: string | null): number {
  // ❌ エラー: 'str' is possibly 'null'
  // return str.length;

  // ✅ null チェックが必要
  if (str === null) {
    return 0;
  }
  return str.length;
}
```

### strictPropertyInitialization

```typescript
class User {
  // ❌ エラー: Property 'name' has no initializer
  // name: string;

  // ✅ 初期化が必要
  name: string = "";

  // または definite assignment assertion
  email!: string;

  constructor() {
    this.initEmail();
  }

  private initEmail() {
    this.email = "default@example.com";
  }
}
```

### noUncheckedIndexedAccess

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}
```

```typescript
const arr = [1, 2, 3];

// noUncheckedIndexedAccess: true の場合
const first = arr[0]; // number | undefined

// undefined チェックが必要
if (first !== undefined) {
  console.log(first.toFixed(2));
}

// オブジェクトも同様
const obj: Record<string, number> = { a: 1 };
const value = obj["a"]; // number | undefined
```

## モジュール解決

### paths オプション

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

```typescript
// パスエイリアスを使用
import { Button } from "@components/Button";
import { formatDate } from "@utils/date";
import type { User } from "@types/user";
```

### moduleResolution

```json
{
  "compilerOptions": {
    // Node.js 16+ 用
    "moduleResolution": "NodeNext",

    // または Bundler 用（Vite, esbuild など）
    "moduleResolution": "Bundler"
  }
}
```

### resolveJsonModule

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

```typescript
// JSON ファイルをインポート
import config from "./config.json";

console.log(config.apiUrl);
```

## 出力オプション

### 宣言ファイル

```json
{
  "compilerOptions": {
    // .d.ts ファイルを生成
    "declaration": true,

    // 宣言ファイルの出力先
    "declarationDir": "./types",

    // 宣言マップを生成（デバッグ用）
    "declarationMap": true,

    // 宣言ファイルのみ生成（.js は生成しない）
    "emitDeclarationOnly": true
  }
}
```

### ソースマップ

```json
{
  "compilerOptions": {
    // ソースマップを生成
    "sourceMap": true,

    // インラインソースマップ
    "inlineSourceMap": false,

    // ソースマップにソースコードを含める
    "inlineSources": true,

    // ソースルートの指定
    "sourceRoot": "/"
  }
}
```

### 出力制御

```json
{
  "compilerOptions": {
    // 出力ディレクトリ
    "outDir": "./dist",

    // 単一ファイルに出力（AMD, System のみ）
    "outFile": "./dist/bundle.js",

    // ヘルパー関数をインポート
    "importHelpers": true,

    // BOM を出力しない
    "emitBOM": false,

    // 改行コード
    "newLine": "lf",

    // コメントを削除
    "removeComments": true
  }
}
```

## JavaScript サポート

### allowJs と checkJs

```json
{
  "compilerOptions": {
    // JavaScript ファイルを許可
    "allowJs": true,

    // JavaScript ファイルも型チェック
    "checkJs": true,

    // JavaScript の最大許容エラー数
    "maxNodeModuleJsDepth": 0
  }
}
```

```javascript
// @ts-check を使用（ファイル単位）
// @ts-check

/** @type {string} */
const name = "Alice";

/** @param {number} a @param {number} b @returns {number} */
function add(a, b) {
  return a + b;
}
```

### JSX サポート

```json
{
  "compilerOptions": {
    // React 17+ の新しい JSX トランスフォーム
    "jsx": "react-jsx",

    // または preserve（Babel などで処理する場合）
    // "jsx": "preserve",

    // JSX ファクトリ関数
    "jsxFactory": "React.createElement",

    // フラグメントファクトリ
    "jsxFragmentFactory": "React.Fragment",

    // JSX インポートソース
    "jsxImportSource": "react"
  }
}
```

## プロジェクト参照

### 基本的な設定

```json
// tsconfig.json (ルート)
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/ui" }
  ],
  "files": []
}
```

```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### composite オプション

```json
{
  "compilerOptions": {
    // プロジェクト参照を有効化
    "composite": true,

    // インクリメンタルビルド
    "incremental": true,

    // ビルド情報ファイル
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

### ビルドコマンド

```bash
# すべてのプロジェクトをビルド
npx tsc --build

# クリーンビルド
npx tsc --build --clean

# 監視モード
npx tsc --build --watch

# 詳細ログ
npx tsc --build --verbose
```

## 設定の継承

### extends の使用

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

```json
// tsconfig.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### 公開テンプレート

```json
// @tsconfig/node20 を使用
{
  "extends": "@tsconfig/node20/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

```bash
# テンプレートをインストール
npm install --save-dev @tsconfig/node20
```

## 環境別設定

### 開発環境

```json
// tsconfig.dev.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "sourceMap": true,
    "declaration": false,
    "noEmit": true
  }
}
```

### 本番環境

```json
// tsconfig.prod.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "sourceMap": false,
    "declaration": true,
    "removeComments": true,
    "outDir": "./dist"
  }
}
```

### テスト環境

```json
// tsconfig.test.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": ["jest", "node"],
    "esModuleInterop": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

## フレームワーク別設定

### React プロジェクト

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src"]
}
```

### Node.js プロジェクト

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### ライブラリプロジェクト

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## パフォーマンス最適化

### インクリメンタルビルド

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

### skipLibCheck

```json
{
  "compilerOptions": {
    // node_modules の型チェックをスキップ
    "skipLibCheck": true
  }
}
```

### isolatedModules

```json
{
  "compilerOptions": {
    // 各ファイルを独立してトランスパイル可能に
    "isolatedModules": true
  }
}
```

```typescript
// isolatedModules: true の制約

// ❌ 型のみの再エクスポートは不可
// export { User } from "./types";

// ✅ type キーワードを使用
export type { User } from "./types";
export { type User } from "./types";

// ❌ const enum は使用不可
// const enum Color { Red, Green, Blue }

// ✅ 通常の enum を使用
enum Color {
  Red,
  Green,
  Blue,
}
```

## デバッグとトラブルシューティング

### 診断オプション

```json
{
  "compilerOptions": {
    // 詳細なエラーメッセージ
    "extendedDiagnostics": true,

    // トレース情報
    "traceResolution": true,

    // 使用されていないローカル変数をエラー
    "noUnusedLocals": true,

    // 使用されていないパラメータをエラー
    "noUnusedParameters": true,

    // 暗黙的な戻り値をエラー
    "noImplicitReturns": true,

    // switch の fallthrough をエラー
    "noFallthroughCasesInSwitch": true
  }
}
```

### 型チェックのみ

```json
{
  "compilerOptions": {
    // 出力しない（型チェックのみ）
    "noEmit": true
  }
}
```

```bash
# 型チェックのみ実行
npx tsc --noEmit
```

## まとめ

- **target**: 出力する JavaScript のバージョン
- **module**: モジュールシステムの指定
- **strict**: 厳格な型チェックを有効化
- **paths**: パスエイリアスの設定
- **declaration**: 型定義ファイルの生成
- **composite**: プロジェクト参照の有効化
- **extends**: 設定の継承
- **incremental**: インクリメンタルビルド

## 演習問題

1. **基本設定**: 新しい Node.js プロジェクト用の tsconfig.json を作成してください
2. **パスエイリアス**: src ディレクトリへのエイリアスを設定してください
3. **プロジェクト参照**: モノレポ構成で複数のパッケージを参照する設定を作成してください
4. **環境別設定**: 開発・本番・テスト用の設定ファイルを作成してください

## 次のステップ

次の章では、TypeScript のベストプラクティスについて学びます。

⬅️ 前へ: [12-Modules-and-Namespaces.md](./12-Modules-and-Namespaces.md)
➡️ 次へ: [14-Best-Practices.md](./14-Best-Practices.md)
