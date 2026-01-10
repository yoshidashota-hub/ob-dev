# 01 - Getting Started

## 概要

この章では、TypeScript の開発環境を構築し、最初のプログラムを作成します。

## 学習目標

- [ ] TypeScript の開発環境をセットアップできる
- [ ] tsc コマンドを使ってコンパイルできる
- [ ] tsconfig.json の基本的な設定がわかる
- [ ] TypeScript のプロジェクト構造を理解できる

## 環境構築

### 1. Node.js のインストール

TypeScript を使用するには、まず Node.js が必要です。

```bash
# バージョン確認
node --version  # v18 以上推奨
npm --version
```

まだインストールしていない場合は、[Node.js 公式サイト](https://nodejs.org/)からダウンロードしてください。

### 2. TypeScript のインストール

#### グローバルインストール

```bash
# グローバルにインストール
npm install -g typescript

# バージョン確認
tsc --version
```

#### プロジェクトごとのインストール（推奨）

```bash
# プロジェクトディレクトリを作成
mkdir my-typescript-project
cd my-typescript-project

# package.json を初期化
npm init -y

# TypeScript をインストール
npm install --save-dev typescript

# バージョン確認
npx tsc --version
```

## Hello TypeScript

### 最初のプログラム

```typescript
// hello.ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}

const message = greet("TypeScript");
console.log(message);
```

### コンパイルと実行

```bash
# TypeScript を JavaScript にコンパイル
npx tsc hello.ts

# 生成された JavaScript ファイルを実行
node hello.js
```

生成される JavaScript:

```javascript
// hello.js
function greet(name) {
  return "Hello, " + name + "!";
}
var message = greet("TypeScript");
console.log(message);
```

## tsconfig.json の作成

### 設定ファイルの生成

```bash
# tsconfig.json を生成
npx tsc --init
```

これにより、コメント付きの `tsconfig.json` が作成されます。

### 基本的な設定

```json
{
  "compilerOptions": {
    /* 言語とモジュール */
    "target": "ES2020", // コンパイル後の JavaScript バージョン
    "module": "commonjs", // モジュールシステム
    "lib": ["ES2020"], // 使用する標準ライブラリ

    /* 厳格性 */
    "strict": true, // すべての厳格な型チェックを有効化

    /* 出力 */
    "outDir": "./dist", // 出力ディレクトリ
    "rootDir": "./src", // ソースディレクトリ

    /* インターフェース */
    "esModuleInterop": true, // CommonJS と ES Module の相互運用
    "forceConsistentCasingInFileNames": true, // ファイル名の大文字小文字を厳密にチェック
    "skipLibCheck": true // .d.ts ファイルの型チェックをスキップ
  },
  "include": ["src/**/*"], // コンパイル対象
  "exclude": ["node_modules", "dist"] // 除外対象
}
```

## プロジェクト構造

### 推奨ディレクトリ構成

```
my-typescript-project/
├── src/                    # TypeScript ソースコード
│   ├── index.ts
│   └── utils/
│       └── helper.ts
├── dist/                   # コンパイル後の JavaScript（.gitignore に追加）
├── node_modules/
├── package.json
├── tsconfig.json
└── .gitignore
```

### package.json の設定

```json
{
  "name": "my-typescript-project",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### 使用方法

```bash
# 開発モード（ファイル監視）
npm run dev

# ビルド
npm run build

# 実行
npm start
```

## Watch モード

ファイルの変更を監視して自動コンパイル:

```bash
# Watch モードで起動
npx tsc --watch
# または
npm run dev
```

ファイルを保存するたびに自動的にコンパイルされます。

## ts-node の使用

TypeScript を直接実行できるツール:

```bash
# ts-node をインストール
npm install --save-dev ts-node @types/node

# TypeScript ファイルを直接実行
npx ts-node src/index.ts
```

package.json に追加:

```json
{
  "scripts": {
    "dev": "ts-node src/index.ts"
  }
}
```

## 型定義ファイル

JavaScript ライブラリを TypeScript で使用する場合、型定義が必要です。

### @types パッケージ

```bash
# Node.js の型定義
npm install --save-dev @types/node

# Express の型定義
npm install --save-dev @types/express

# Lodash の型定義
npm install --save-dev @types/lodash
```

使用例:

```typescript
// Node.js の型定義を使用
import { readFileSync } from "fs";

const content: string = readFileSync("file.txt", "utf-8");
```

## 実践: 簡単な電卓プログラム

### プロジェクトのセットアップ

```bash
mkdir calculator-app
cd calculator-app
npm init -y
npm install --save-dev typescript @types/node
npx tsc --init
mkdir src
```

### コードの作成

```typescript
// src/calculator.ts
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error("Division by zero");
    }
    return a / b;
  }
}
```

```typescript
// src/index.ts
import { Calculator } from "./calculator";

const calc = new Calculator();

console.log("Addition: 10 + 5 =", calc.add(10, 5));
console.log("Subtraction: 10 - 5 =", calc.subtract(10, 5));
console.log("Multiplication: 10 * 5 =", calc.multiply(10, 5));
console.log("Division: 10 / 5 =", calc.divide(10, 5));
```

### tsconfig.json の設定

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### ビルドと実行

```bash
# コンパイル
npx tsc

# 実行
node dist/index.js
```

## エディタのセットアップ

### VS Code（推奨）

VS Code は TypeScript をネイティブサポートしています:

1. **自動補完**: 型情報に基づく強力な補完
2. **エラー表示**: リアルタイムで型エラーを表示
3. **リファクタリング**: 安全な名前変更など
4. **型定義へのジャンプ**: F12 で定義元に移動

### 推奨拡張機能

- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマッター
- **Path Intellisense**: パス補完

### VS Code 設定

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## よくあるエラーと解決方法

### エラー 1: "Cannot find module"

```typescript
import { something } from "some-module";
// ❌ Cannot find module 'some-module'
```

**解決方法**:

```bash
# モジュールをインストール
npm install some-module

# 型定義をインストール
npm install --save-dev @types/some-module
```

### エラー 2: "Compilation complete. Watching for file changes."

これはエラーではなく、Watch モードが正常に動作している状態です。

### エラー 3: tsconfig.json が無視される

```bash
# プロジェクトルートで実行していることを確認
pwd

# tsconfig.json の位置を確認
ls -la tsconfig.json
```

## まとめ

- TypeScript は `tsc` コマンドでコンパイルできる
- `tsconfig.json` でコンパイラの動作を設定する
- Watch モードでファイル変更を自動的にコンパイル
- `@types/*` パッケージで JavaScript ライブラリに型を追加
- VS Code が TypeScript 開発に最適

## 演習問題

1. **環境構築**: 自分の環境に TypeScript をインストールし、バージョンを確認してください
2. **Hello World**: 名前を受け取って挨拶を返す関数を TypeScript で書いてください
3. **プロジェクト作成**: tsconfig.json を含む TypeScript プロジェクトを作成してください
4. **Watch モード**: Watch モードでファイルの変更を監視してください

## 次のステップ

次の章では、TypeScript の基本的な型について詳しく学びます。

⬅️ 前へ: [00-Introduction.md](./00-Introduction.md)
➡️ 次へ: [02-Basic-Types.md](./02-Basic-Types.md)
