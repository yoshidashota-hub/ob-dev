# 14 - Best Practices

## 概要

TypeScript を効果的に使用するためのベストプラクティスを学びます。コードの品質、保守性、パフォーマンスを向上させるための実践的なガイドラインを理解します。

## 学習目標

- [ ] 型安全性を最大化するパターンを理解できる
- [ ] 保守しやすいコードの書き方を習得できる
- [ ] パフォーマンスを考慮した設計ができる
- [ ] チーム開発でのベストプラクティスを適用できる

## 型定義のベストプラクティス

### any を避ける

```typescript
// ❌ any を使用
function processData(data: any): any {
  return data.value;
}

// ✅ 適切な型を定義
interface Data {
  value: string;
  timestamp: Date;
}

function processData(data: Data): string {
  return data.value;
}

// ✅ unknown を使用して安全に処理
function processUnknown(data: unknown): string {
  if (typeof data === "object" && data !== null && "value" in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error("Invalid data");
}
```

### 型推論を活用する

```typescript
// ❌ 不要な型注釈
const name: string = "Alice";
const numbers: number[] = [1, 2, 3];
const user: { name: string; age: number } = { name: "Alice", age: 25 };

// ✅ 型推論に任せる
const name = "Alice";
const numbers = [1, 2, 3];
const user = { name: "Alice", age: 25 };

// ✅ 必要な場合のみ型注釈を追加
const result: User[] = await fetchUsers();
```

### リテラル型を活用する

```typescript
// ❌ 広い型
function setStatus(status: string): void {
  // status は何でも受け入れる
}

// ✅ リテラル型で制限
type Status = "pending" | "approved" | "rejected";

function setStatus(status: Status): void {
  // status は3つの値のみ
}

// ✅ as const でリテラル型を保持
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
} as const;
```

### interface vs type

```typescript
// ✅ オブジェクトの形状には interface
interface User {
  id: number;
  name: string;
  email: string;
}

// ✅ 拡張が必要な場合も interface
interface Admin extends User {
  permissions: string[];
}

// ✅ ユニオン型や複雑な型には type
type Status = "pending" | "approved" | "rejected";
type Result<T> = { success: true; data: T } | { success: false; error: string };

// ✅ プリミティブのエイリアスには type
type UserId = string;
type Timestamp = number;
```

## 関数のベストプラクティス

### 明示的な戻り値の型

```typescript
// ❌ 戻り値の型が不明確
function fetchUser(id: string) {
  return fetch(`/users/${id}`).then((res) => res.json());
}

// ✅ 戻り値の型を明示
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/users/${id}`);
  return response.json();
}

// ✅ 型ガード関数
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}
```

### オプショナルパラメータ

```typescript
// ❌ undefined を明示的に渡す必要がある
function greet(name: string, greeting: string | undefined): string {
  return `${greeting ?? "Hello"}, ${name}!`;
}
greet("Alice", undefined);

// ✅ オプショナルパラメータを使用
function greet(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}!`;
}
greet("Alice");

// ✅ デフォルト値を使用
function greet(name: string, greeting = "Hello"): string {
  return `${greeting}, ${name}!`;
}
```

### オブジェクトパラメータ

```typescript
// ❌ 多すぎるパラメータ
function createUser(
  name: string,
  email: string,
  age: number,
  role: string,
  department: string
): User {
  // ...
}

// ✅ オブジェクトパラメータを使用
interface CreateUserParams {
  name: string;
  email: string;
  age: number;
  role?: string;
  department?: string;
}

function createUser(params: CreateUserParams): User {
  const { name, email, age, role = "user", department = "general" } = params;
  // ...
}

createUser({
  name: "Alice",
  email: "alice@example.com",
  age: 25,
});
```

## null と undefined の扱い

### Null チェック

```typescript
// ❌ 安全でないアクセス
function getName(user: User | null): string {
  return user.name; // エラーの可能性
}

// ✅ 早期リターン
function getName(user: User | null): string {
  if (user === null) {
    return "Unknown";
  }
  return user.name;
}

// ✅ オプショナルチェーン
function getName(user: User | null): string {
  return user?.name ?? "Unknown";
}

// ✅ Nullish coalescing
const name = user?.name ?? "Default Name";
```

### Non-null assertion の使用

```typescript
// ❌ 過度な non-null assertion
function process(data: Data | null): void {
  console.log(data!.value); // 危険
}

// ✅ 適切なチェック
function process(data: Data | null): void {
  if (data === null) {
    throw new Error("Data is required");
  }
  console.log(data.value);
}

// ✅ 限定的な使用（確実にわかる場合のみ）
const element = document.getElementById("app")!;
// 本当に存在することが確実な場合のみ
```

## エラーハンドリング

### Result 型パターン

```typescript
// Result 型の定義
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// ✅ Result 型を使用
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const response = await fetch(`/users/${id}`);
    if (!response.ok) {
      return {
        success: false,
        error: new Error(`HTTP ${response.status}`),
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// 使用例
const result = await fetchUser("123");
if (result.success) {
  console.log(result.data.name);
} else {
  console.error(result.error.message);
}
```

### カスタムエラー

```typescript
// ✅ カスタムエラークラス
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = "NotFoundError";
  }
}

// 使用例
function validateUser(data: unknown): User {
  if (!isValidUser(data)) {
    throw new ValidationError("Invalid user data", "user");
  }
  return data;
}
```

## 型ガード

### ユーザー定義型ガード

```typescript
// ✅ 型ガード関数
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as User).id === "number" &&
    "name" in value &&
    typeof (value as User).name === "string"
  );
}

// ✅ 配列の型ガード
function isArrayOfUsers(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser);
}

// 使用例
function processData(data: unknown): void {
  if (isUser(data)) {
    console.log(data.name); // data は User 型
  }
}
```

### Discriminated Unions

```typescript
// ✅ Discriminated Union
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
  }
}

// ✅ exhaustiveness チェック
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape);
  }
}
```

## イミュータビリティ

### Readonly の活用

```typescript
// ✅ Readonly で不変性を保証
interface User {
  readonly id: number;
  readonly name: string;
  email: string;
}

// ✅ Readonly ユーティリティ型
type ImmutableUser = Readonly<User>;

// ✅ 深い不変性
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// ✅ as const で完全な不変性
const config = {
  apiUrl: "https://api.example.com",
  features: {
    darkMode: true,
    notifications: false,
  },
} as const;
```

### 配列の不変操作

```typescript
// ❌ 配列を直接変更
function addItem(items: string[], item: string): void {
  items.push(item);
}

// ✅ 新しい配列を返す
function addItem(items: readonly string[], item: string): string[] {
  return [...items, item];
}

// ✅ 不変の更新
function updateItem(
  items: readonly User[],
  id: number,
  updates: Partial<User>
): User[] {
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item));
}

// ✅ 不変の削除
function removeItem(items: readonly User[], id: number): User[] {
  return items.filter((item) => item.id !== id);
}
```

## ジェネリクスのベストプラクティス

### 適切な制約

```typescript
// ❌ 制約なしのジェネリック
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 }; // エラー: スプレッドはオブジェクトのみ
}

// ✅ 適切な制約を追加
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

// ✅ keyof 制約
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### デフォルト型パラメータ

```typescript
// ✅ デフォルト型パラメータ
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  timestamp: Date;
}

// 型パラメータを省略可能
const response: ApiResponse = {
  data: null,
  status: 200,
  timestamp: new Date(),
};

// 型パラメータを指定
const userResponse: ApiResponse<User> = {
  data: { id: 1, name: "Alice" },
  status: 200,
  timestamp: new Date(),
};
```

## コード構造

### バレルエクスポート

```typescript
// ✅ index.ts でまとめてエクスポート
// models/index.ts
export { User } from "./user";
export { Product } from "./product";
export { Order } from "./order";
export type { UserRole, ProductCategory } from "./types";

// 使用側
import { User, Product, Order } from "./models";
```

### 型と実装の分離

```typescript
// ✅ 型定義ファイル
// types/user.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

// 実装ファイル
// services/user-service.ts
import type { User, CreateUserInput } from "../types/user";

export class UserService {
  async create(input: CreateUserInput): Promise<User> {
    // 実装
  }
}
```

## パフォーマンス

### 型のシンプル化

```typescript
// ❌ 複雑すぎる型
type DeepNestedType<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends object
        ? DeepNestedType<T[K]>
        : T[K] extends (infer U)[]
        ? DeepNestedType<U>[]
        : T[K];
    }
  : T;

// ✅ シンプルな型
type SimplePartial<T> = {
  [K in keyof T]?: T[K];
};

// ✅ 必要に応じて段階的に
type ShallowPartial<T> = Partial<T>;
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

### 条件付きインポート

```typescript
// ✅ 型のみのインポート
import type { User, Product } from "./models";

// ✅ 値と型を分離
import { createUser } from "./services";
import type { CreateUserInput } from "./services";
```

## テスト

### テスト用のヘルパー型

```typescript
// ✅ テスト用のモック型
type MockFn<T extends (...args: any[]) => any> = jest.Mock<
  ReturnType<T>,
  Parameters<T>
>;

// ✅ Partial を使ったテストデータ
function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    ...overrides,
  };
}

// ✅ ファクトリパターン
class UserFactory {
  private static nextId = 1;

  static create(overrides: Partial<User> = {}): User {
    return {
      id: this.nextId++,
      name: `User ${this.nextId}`,
      email: `user${this.nextId}@example.com`,
      ...overrides,
    };
  }
}
```

## まとめ

- **any を避ける**: unknown や適切な型を使用
- **型推論を活用**: 不要な型注釈を避ける
- **リテラル型**: 値の範囲を制限
- **明示的な戻り値**: 関数の戻り値の型を明示
- **Result パターン**: エラーハンドリングを型安全に
- **型ガード**: 実行時の型チェックを型システムに反映
- **イミュータビリティ**: Readonly と新しいオブジェクトの返却
- **シンプルな型**: 複雑すぎる型を避ける

## 演習問題

1. **型定義**: any を使用しない安全な JSON パーサーを実装してください
2. **Result 型**: API クライアントを Result 型パターンで実装してください
3. **型ガード**: ネストしたオブジェクトを検証する型ガードを作成してください
4. **イミュータブル更新**: 深いネストを持つオブジェクトの更新関数を実装してください

## 次のステップ

次の章では、実際のプロジェクトでの TypeScript の使用例について学びます。

⬅️ 前へ: [13-Configuration.md](./13-Configuration.md)
➡️ 次へ: [15-Real-World-Examples.md](./15-Real-World-Examples.md)
