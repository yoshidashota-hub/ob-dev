# 04 - Objects and Interfaces

## 概要

TypeScript でオブジェクトの型を定義する方法を学びます。インターフェース、型エイリアス、オブジェクト型の詳細な使い方を理解します。

## 学習目標

- [ ] オブジェクト型の定義方法を理解できる
- [ ] interface と type の違いがわかる
- [ ] オプショナルプロパティと readonly を使いこなせる
- [ ] インターフェースの拡張と実装ができる

## オブジェクト型の基本

### インラインオブジェクト型

```typescript
// オブジェクト型をインラインで定義
let user: { name: string; age: number } = {
  name: "Alice",
  age: 25,
};

// 関数のパラメータでも使用可能
function greet(person: { name: string; age: number }): string {
  return `Hello, ${person.name}! You are ${person.age} years old.`;
}
```

### 型エイリアス

```typescript
// type で型に名前を付ける
type User = {
  name: string;
  age: number;
  email: string;
};

const user: User = {
  name: "Bob",
  age: 30,
  email: "bob@example.com",
};
```

## interface

### 基本的な interface

```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

const user: User = {
  name: "Charlie",
  age: 28,
  email: "charlie@example.com",
};

// 関数で使用
function displayUser(user: User): void {
  console.log(`${user.name} (${user.age})`);
}
```

### オプショナルプロパティ

```typescript
interface User {
  name: string;
  age: number;
  email?: string; // オプショナル
  phone?: string; // オプショナル
}

// email と phone は省略可能
const user1: User = {
  name: "Alice",
  age: 25,
};

const user2: User = {
  name: "Bob",
  age: 30,
  email: "bob@example.com",
};
```

### readonly プロパティ

```typescript
interface User {
  readonly id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
};

user.name = "Alicia"; // ✅ OK
// user.id = 2; // ❌ エラー: readonly プロパティは変更不可
```

### インデックスシグネチャ

```typescript
// 任意のキーを許可
interface StringMap {
  [key: string]: string;
}

const translations: StringMap = {
  hello: "こんにちは",
  goodbye: "さようなら",
  thanks: "ありがとう",
};

// 数値キー
interface NumberMap {
  [index: number]: string;
}

const items: NumberMap = {
  0: "first",
  1: "second",
  2: "third",
};
```

### 混合型

```typescript
interface Dictionary {
  [key: string]: string | number;
  length: number; // 固定プロパティ
}

const dict: Dictionary = {
  length: 3,
  name: "Alice",
  age: 25,
  city: "Tokyo",
};
```

## interface vs type

### 主な違い

```typescript
// interface: 拡張可能（宣言のマージ）
interface User {
  name: string;
}

interface User {
  age: number;
}

// 自動的にマージされる
const user: User = {
  name: "Alice",
  age: 25,
};

// type: 宣言のマージは不可
type Product = {
  name: string;
};

// ❌ エラー: 重複した識別子
// type Product = {
//   price: number;
// };
```

### type でできること

```typescript
// ユニオン型
type Status = "pending" | "approved" | "rejected";

// プリミティブ型のエイリアス
type ID = string | number;

// タプル型
type Coordinate = [number, number];

// 条件型
type NonNullable<T> = T extends null | undefined ? never : T;
```

### interface でできること

```typescript
// クラスで実装
interface Printable {
  print(): void;
}

class Document implements Printable {
  print(): void {
    console.log("Printing...");
  }
}

// 拡張（extends）
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}
```

### 使い分けの指針

```typescript
// オブジェクトの形状を定義 → interface を推奨
interface User {
  name: string;
  age: number;
}

// ユニオンや複雑な型の組み合わせ → type を使用
type Result = Success | Error;
type StringOrNumber = string | number;

// 関数型 → type が読みやすい
type Callback = (data: string) => void;
```

## インターフェースの拡張

### 単一継承

```typescript
interface Person {
  name: string;
  age: number;
}

interface Employee extends Person {
  employeeId: string;
  department: string;
}

const employee: Employee = {
  name: "Alice",
  age: 30,
  employeeId: "E001",
  department: "Engineering",
};
```

### 複数継承

```typescript
interface HasName {
  name: string;
}

interface HasAge {
  age: number;
}

interface HasEmail {
  email: string;
}

// 複数のインターフェースを拡張
interface User extends HasName, HasAge, HasEmail {
  id: number;
}

const user: User = {
  id: 1,
  name: "Bob",
  age: 25,
  email: "bob@example.com",
};
```

### インターフェースと型の組み合わせ

```typescript
type Address = {
  street: string;
  city: string;
  country: string;
};

interface Company {
  name: string;
  address: Address; // type を含める
}

// interface を type で拡張
type ExtendedCompany = Company & {
  employees: number;
};
```

## メソッドの定義

### メソッドシグネチャ

```typescript
interface Calculator {
  // メソッドシグネチャ
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;

  // プロパティとしての関数
  multiply: (a: number, b: number) => number;
}

const calc: Calculator = {
  add(a, b) {
    return a + b;
  },
  subtract(a, b) {
    return a - b;
  },
  multiply: (a, b) => a * b,
};
```

### コール可能インターフェース

```typescript
// 関数として呼び出し可能なオブジェクト
interface Formatter {
  (value: string): string;
  locale: string;
}

const formatter: Formatter = Object.assign(
  (value: string) => value.toUpperCase(),
  { locale: "en-US" }
);

console.log(formatter("hello")); // "HELLO"
console.log(formatter.locale); // "en-US"
```

### コンストラクタシグネチャ

```typescript
interface UserConstructor {
  new (name: string, age: number): User;
}

interface User {
  name: string;
  age: number;
}

class UserImpl implements User {
  constructor(public name: string, public age: number) {}
}

function createUser(ctor: UserConstructor, name: string, age: number): User {
  return new ctor(name, age);
}

const user = createUser(UserImpl, "Alice", 25);
```

## 型の互換性

### 構造的型付け

```typescript
interface Point {
  x: number;
  y: number;
}

interface Coordinate {
  x: number;
  y: number;
}

// 構造が同じなら互換性がある
const point: Point = { x: 10, y: 20 };
const coord: Coordinate = point; // ✅ OK
```

### 余剰プロパティチェック

```typescript
interface User {
  name: string;
  age: number;
}

// オブジェクトリテラルでは余剰プロパティがチェックされる
// const user: User = {
//   name: "Alice",
//   age: 25,
//   email: "alice@example.com", // ❌ エラー
// };

// 変数経由なら許可される
const userData = {
  name: "Alice",
  age: 25,
  email: "alice@example.com",
};
const user: User = userData; // ✅ OK
```

## Record 型

### 基本的な使い方

```typescript
// キーと値の型を指定
type UserRoles = Record<string, string[]>;

const roles: UserRoles = {
  admin: ["read", "write", "delete"],
  editor: ["read", "write"],
  viewer: ["read"],
};
```

### ユニオン型と組み合わせ

```typescript
type Status = "pending" | "approved" | "rejected";

// すべてのステータスにメッセージが必要
type StatusMessages = Record<Status, string>;

const messages: StatusMessages = {
  pending: "審査中です",
  approved: "承認されました",
  rejected: "却下されました",
};
```

## Readonly と必須/オプショナル

### Readonly

```typescript
interface User {
  name: string;
  age: number;
}

// すべてのプロパティを readonly に
type ReadonlyUser = Readonly<User>;

const user: ReadonlyUser = {
  name: "Alice",
  age: 25,
};

// user.name = "Alicia"; // ❌ エラー
```

### Partial と Required

```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

// すべてのプロパティをオプショナルに
type PartialUser = Partial<User>;

const partialUser: PartialUser = {
  name: "Alice",
  // age と email は省略可能
};

// すべてのプロパティを必須に
interface OptionalUser {
  name?: string;
  age?: number;
}

type RequiredUser = Required<OptionalUser>;

const requiredUser: RequiredUser = {
  name: "Bob",
  age: 30,
  // すべて必須
};
```

## 実践例: API レスポンス型

```typescript
// 基本的なレスポンス構造
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: number;
}

// ユーザー型
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

// ページネーション
interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// リスト型レスポンス
interface ListResponse<T> {
  items: T[];
  pagination: Pagination;
}

// 具体的な型
type UserResponse = ApiResponse<User>;
type UserListResponse = ApiResponse<ListResponse<User>>;

// 使用例
async function fetchUser(id: number): Promise<UserResponse> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

async function fetchUsers(page: number): Promise<UserListResponse> {
  const response = await fetch(`/api/users?page=${page}`);
  return response.json();
}
```

## 実践例: フォームデータ型

```typescript
// フォームフィールドの状態
interface FieldState<T> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

// フォーム全体の状態
interface FormState<T> {
  fields: {
    [K in keyof T]: FieldState<T[K]>;
  };
  isValid: boolean;
  isSubmitting: boolean;
}

// ユーザー登録フォーム
interface UserFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// フォーム状態の型
type UserFormState = FormState<UserFormData>;

// 初期状態を作成
function createInitialFormState<T>(defaultValues: T): FormState<T> {
  const fields = {} as FormState<T>["fields"];

  for (const key in defaultValues) {
    fields[key] = {
      value: defaultValues[key],
      error: null,
      touched: false,
      dirty: false,
    };
  }

  return {
    fields,
    isValid: false,
    isSubmitting: false,
  };
}

// 使用例
const initialState = createInitialFormState<UserFormData>({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});
```

## 実践例: 設定オブジェクト

```typescript
// アプリケーション設定
interface AppConfig {
  readonly appName: string;
  readonly version: string;
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    darkMode: boolean;
    notifications: boolean;
    analytics: boolean;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

// 環境別の設定
const developmentConfig: AppConfig = {
  appName: "MyApp",
  version: "1.0.0",
  api: {
    baseUrl: "http://localhost:3000",
    timeout: 5000,
    retries: 3,
  },
  features: {
    darkMode: true,
    notifications: false,
    analytics: false,
  },
};

const productionConfig: AppConfig = {
  appName: "MyApp",
  version: "1.0.0",
  api: {
    baseUrl: "https://api.example.com",
    timeout: 10000,
    retries: 5,
  },
  features: {
    darkMode: true,
    notifications: true,
    analytics: true,
  },
  cache: {
    enabled: true,
    ttl: 3600,
  },
};

// 設定を取得
function getConfig(env: "development" | "production"): AppConfig {
  return env === "production" ? productionConfig : developmentConfig;
}
```

## まとめ

- **オブジェクト型**: インラインまたは型エイリアスで定義
- **interface**: オブジェクトの形状を定義、拡張可能
- **type**: ユニオン型など複雑な型の組み合わせに適している
- **オプショナル**: `?` でオプショナルプロパティ
- **readonly**: 変更不可のプロパティ
- **インデックスシグネチャ**: 動的なキーを許可
- **拡張**: `extends` でインターフェースを継承
- **構造的型付け**: 構造が同じなら互換性がある

## 演習問題

1. **基本**: ユーザー情報を表す interface を定義してください
2. **オプショナル**: 住所情報（一部オプショナル）の interface を作成してください
3. **拡張**: 基本ユーザーを拡張して管理者ユーザーの interface を作成してください
4. **Record**: HTTP メソッドとパス文字列のマッピングを型定義してください

## 次のステップ

次の章では、クラスとオブジェクト指向について学びます。

⬅️ 前へ: [03-Functions.md](./03-Functions.md)
➡️ 次へ: [05-Classes.md](./05-Classes.md)
