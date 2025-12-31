# 16 - Migration Guide

## 概要

JavaScript プロジェクトから TypeScript への移行方法を学びます。段階的な移行戦略、よくある問題の解決方法、チームでの導入プロセスを理解します。

## 学習目標

- [ ] 段階的な移行戦略を立てられる
- [ ] JavaScript から TypeScript への変換ができる
- [ ] 移行時のよくある問題を解決できる
- [ ] チームでの TypeScript 導入を進められる

## 移行の準備

### プロジェクト評価

```bash
# プロジェクトの規模を確認
find src -name "*.js" | wc -l

# 依存関係の確認
npm ls --depth=0

# 型定義の利用可能性を確認
npm info @types/express
npm info @types/lodash
```

### 移行戦略の選択

```text
1. 一括移行（Big Bang）
   - 小規模プロジェクト向け
   - 一度にすべてを変換
   - リスク: 高、期間: 短

2. 段階的移行（Incremental）
   - 中〜大規模プロジェクト向け
   - ファイル単位で変換
   - リスク: 低、期間: 長

3. ハイブリッドアプローチ
   - 新規コードは TypeScript
   - 既存コードは徐々に変換
   - バランス型
```

## 環境設定

### TypeScript のインストール

```bash
# TypeScript と関連ツールをインストール
npm install --save-dev typescript @types/node

# tsconfig.json を生成
npx tsc --init
```

### 初期設定（緩め）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",

    // 移行初期は緩めに設定
    "strict": false,
    "allowJs": true,
    "checkJs": false,
    "skipLibCheck": true,

    // エラーがあっても出力
    "noEmitOnError": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 徐々に厳格化

```json
// Phase 1: 基本的な型チェック
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false
  }
}

// Phase 2: noImplicitAny を有効化
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,
    "strictNullChecks": false
  }
}

// Phase 3: strictNullChecks を有効化
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// Phase 4: 完全な strict モード
{
  "compilerOptions": {
    "strict": true
  }
}
```

## ファイルの変換

### 基本的な変換手順

```javascript
// 変換前: user.js
function createUser(name, email) {
  return {
    id: Date.now(),
    name: name,
    email: email,
    createdAt: new Date(),
  };
}

function getFullName(user) {
  return user.firstName + " " + user.lastName;
}

module.exports = { createUser, getFullName };
```

```typescript
// 変換後: user.ts

// 1. 型を定義
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

interface UserWithName {
  firstName: string;
  lastName: string;
}

// 2. 関数に型を追加
function createUser(name: string, email: string): User {
  return {
    id: Date.now(),
    name: name,
    email: email,
    createdAt: new Date(),
  };
}

function getFullName(user: UserWithName): string {
  return user.firstName + " " + user.lastName;
}

// 3. ES Modules に変換
export { createUser, getFullName };
export type { User, UserWithName };
```

### JSDoc からの変換

```javascript
// 変換前: api.js
/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} email
 */

/**
 * Fetch a user by ID
 * @param {number} id - User ID
 * @returns {Promise<User>}
 */
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

```typescript
// 変換後: api.ts
interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

export { fetchUser };
export type { User };
```

### クラスの変換

```javascript
// 変換前: UserService.js
class UserService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.cache = new Map();
  }

  async getUser(id) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    const user = await this.apiClient.get(`/users/${id}`);
    this.cache.set(id, user);
    return user;
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = UserService;
```

```typescript
// 変換後: UserService.ts
import type { ApiClient } from "./ApiClient";

interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private cache: Map<number, User> = new Map();

  constructor(private apiClient: ApiClient) {}

  async getUser(id: number): Promise<User> {
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }
    const user = await this.apiClient.get<User>(`/users/${id}`);
    this.cache.set(id, user);
    return user;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export { UserService };
export type { User };
```

## 型定義の追加

### 外部ライブラリの型

```bash
# DefinitelyTyped から型をインストール
npm install --save-dev @types/express @types/lodash @types/node

# 型が存在しない場合
npm info @types/some-library
# 存在しない場合は自分で作成
```

### カスタム型定義

```typescript
// types/some-library.d.ts
declare module "some-library" {
  export interface Config {
    apiKey: string;
    timeout?: number;
  }

  export function initialize(config: Config): void;
  export function process(data: string): Promise<string>;

  export default class Client {
    constructor(config: Config);
    send(message: string): Promise<void>;
    close(): void;
  }
}
```

### グローバル型の拡張

```typescript
// types/global.d.ts
declare global {
  interface Window {
    analytics: {
      track(event: string, data?: Record<string, unknown>): void;
      page(name: string): void;
    };
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      API_URL: string;
      DATABASE_URL: string;
    }
  }
}

export {};
```

## よくある問題と解決策

### any の一時的な使用

```typescript
// 移行中は any を許容
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function legacyFunction(data: any): any {
  // TODO: 型を追加
  return data.process();
}

// より安全な代替: unknown
function safeFunction(data: unknown): unknown {
  if (typeof data === "object" && data !== null && "process" in data) {
    return (data as { process: () => unknown }).process();
  }
  throw new Error("Invalid data");
}
```

### null/undefined の処理

```javascript
// 変換前
function getLength(str) {
  return str.length;
}
```

```typescript
// 変換後: strictNullChecks 対応
function getLength(str: string | null | undefined): number {
  if (str == null) {
    return 0;
  }
  return str.length;
}

// または optional chaining
function getLength(str: string | null | undefined): number {
  return str?.length ?? 0;
}
```

### 動的プロパティアクセス

```javascript
// 変換前
function getProperty(obj, key) {
  return obj[key];
}
```

```typescript
// 変換後: ジェネリクスで型安全に
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// または Record 型
function getProperty(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}
```

### this のバインディング

```javascript
// 変換前
function Counter() {
  this.count = 0;
  this.increment = function () {
    this.count++;
  };
}
```

```typescript
// 変換後: クラスに変換
class Counter {
  count = 0;

  increment = (): void => {
    this.count++;
  };
}

// または this 型を明示
interface Counter {
  count: number;
  increment(this: Counter): void;
}
```

### コールバック関数

```javascript
// 変換前
function fetchData(callback) {
  fetch("/api/data")
    .then((res) => res.json())
    .then((data) => callback(null, data))
    .catch((err) => callback(err, null));
}
```

```typescript
// 変換後: Promise ベースに
interface Data {
  id: number;
  value: string;
}

async function fetchData(): Promise<Data> {
  const response = await fetch("/api/data");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

// レガシーコールバックのサポートが必要な場合
type Callback<T> = (error: Error | null, data: T | null) => void;

function fetchDataWithCallback(callback: Callback<Data>): void {
  fetchData()
    .then((data) => callback(null, data))
    .catch((err) => callback(err, null));
}
```

## React コンポーネントの移行

### 関数コンポーネント

```jsx
// 変換前: Button.jsx
import React from "react";
import PropTypes from "prop-types";

function Button({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

Button.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  disabled: false,
};

export default Button;
```

```tsx
// 変換後: Button.tsx
import { ReactNode, FC } from "react";

interface ButtonProps {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}

const Button: FC<ButtonProps> = ({ onClick, children, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
```

### クラスコンポーネント

```jsx
// 変換前: Counter.jsx
import React, { Component } from "react";

class Counter extends Component {
  state = {
    count: 0,
  };

  increment = () => {
    this.setState((prev) => ({ count: prev.count + 1 }));
  };

  render() {
    return (
      <div>
        <span>{this.state.count}</span>
        <button onClick={this.increment}>+</button>
      </div>
    );
  }
}

export default Counter;
```

```tsx
// 変換後: Counter.tsx
import React, { Component } from "react";

interface CounterProps {
  initialCount?: number;
}

interface CounterState {
  count: number;
}

class Counter extends Component<CounterProps, CounterState> {
  state: CounterState = {
    count: this.props.initialCount ?? 0,
  };

  increment = (): void => {
    this.setState((prev) => ({ count: prev.count + 1 }));
  };

  render(): React.ReactNode {
    return (
      <div>
        <span>{this.state.count}</span>
        <button onClick={this.increment}>+</button>
      </div>
    );
  }
}

export default Counter;
```

## 移行のベストプラクティス

### ファイル単位の移行

```bash
# 1. 依存関係のないファイルから開始
src/utils/helpers.js → src/utils/helpers.ts

# 2. 型定義を作成
src/types/index.ts

# 3. 共有モジュールを変換
src/models/user.js → src/models/user.ts

# 4. サービス層を変換
src/services/userService.js → src/services/userService.ts

# 5. コンポーネントを変換
src/components/Button.jsx → src/components/Button.tsx
```

### CI/CD の設定

```yaml
# .github/workflows/type-check.yml
name: Type Check

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci
      - run: npx tsc --noEmit
```

### ESLint の設定

```javascript
// eslint.config.js
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      // 移行中は警告のみ
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",

      // 移行完了後は厳格に
      // "@typescript-eslint/no-explicit-any": "error",
      // "@typescript-eslint/explicit-function-return-type": "error",
    },
  }
);
```

## チームでの導入

### 段階的な導入計画

```text
Week 1-2: 準備
- TypeScript 環境のセットアップ
- チームへのトレーニング
- コーディングガイドラインの作成

Week 3-4: パイロット
- 小さなモジュールで試験導入
- 問題点の洗い出し
- ガイドラインの調整

Week 5-8: 本格移行
- 優先度の高いモジュールから移行
- コードレビューでの型チェック
- 定期的な進捗確認

Week 9+: 完了と最適化
- strict モードの有効化
- 残りのファイルの移行
- 型定義の改善
```

### コーディングガイドライン

```markdown
# TypeScript コーディングガイドライン

## 必須ルール

1. `any` は原則禁止。必要な場合は `unknown` を使用
2. 関数の戻り値は明示的に型注釈
3. インターフェースは I プレフィックスなし（例: User, not IUser）
4. 型エイリアスはユニオン型や複雑な型に使用

## 推奨ルール

1. オブジェクトの形状には interface を優先
2. 可能な限り型推論を活用
3. as による型アサーションは最小限に
4. null チェックは optional chaining を活用

## ファイル構成

- 型定義は `types/` ディレクトリに集約
- 共有型は `types/index.ts` からエクスポート
- コンポーネント固有の型はコンポーネントファイル内に
```

### 移行の追跡

```typescript
// scripts/migration-status.ts
import { glob } from "glob";

async function checkMigrationStatus() {
  const jsFiles = await glob("src/**/*.js");
  const tsFiles = await glob("src/**/*.ts");
  const jsxFiles = await glob("src/**/*.jsx");
  const tsxFiles = await glob("src/**/*.tsx");

  const jsCount = jsFiles.length + jsxFiles.length;
  const tsCount = tsFiles.length + tsxFiles.length;
  const total = jsCount + tsCount;
  const progress = ((tsCount / total) * 100).toFixed(1);

  console.log(`Migration Progress: ${progress}%`);
  console.log(`JavaScript files: ${jsCount}`);
  console.log(`TypeScript files: ${tsCount}`);

  if (jsCount > 0) {
    console.log("\nRemaining JS files:");
    [...jsFiles, ...jsxFiles].forEach((file) => console.log(`  - ${file}`));
  }
}

checkMigrationStatus();
```

## 移行完了後

### strict モードの有効化

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 継続的な改善

```bash
# 型カバレッジの確認
npx type-coverage

# 未使用の型定義を検出
npx ts-prune

# 型の複雑さを分析
npx tsc --extendedDiagnostics
```

## まとめ

- **段階的移行**: 一度にすべてを変換しない
- **緩い設定から開始**: strict は最後に有効化
- **allowJs**: JavaScript と TypeScript の共存
- **型定義の追加**: @types パッケージまたはカスタム定義
- **チーム導入**: トレーニングとガイドラインが重要
- **CI/CD 統合**: 型チェックを自動化

## 演習問題

1. **基本変換**: JavaScript ファイルを TypeScript に変換してください
2. **型定義作成**: 型定義がないライブラリの型を作成してください
3. **strict 対応**: noImplicitAny エラーを修正してください
4. **移行計画**: 実際のプロジェクトの移行計画を立ててください

## 完了

おめでとうございます！TypeScript Complete Guide のすべての章を完了しました。

⬅️ 前へ: [15-Real-World-Examples.md](./15-Real-World-Examples.md)
🏠 トップ: [README.md](./README.md)
