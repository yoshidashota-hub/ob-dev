# 02 - Basic Types

## 概要

TypeScript の基本的な型について学びます。これらの型は、TypeScript プログラミングの基礎となります。

## 学習目標

- [ ] プリミティブ型を理解し使用できる
- [ ] 配列とタプルの違いがわかる
- [ ] enum の使い方を理解できる
- [ ] any、unknown、void、never の違いがわかる

## プリミティブ型

### string（文字列）

```typescript
let message: string = "Hello TypeScript";
let name: string = "John";
let template: string = `Hello, ${name}`;

// ❌ エラー
message = 123; // Type 'number' is not assignable to type 'string'
```

### number（数値）

```typescript
let decimal: number = 10;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;
let big: bigint = 100n;

// すべての数値は浮動小数点
let pi: number = 3.14;
```

### boolean（真偽値）

```typescript
let isActive: boolean = true;
let isCompleted: boolean = false;

// ❌ エラー
isActive = "true"; // Type 'string' is not assignable to type 'boolean'
```

## 配列

### 配列の型定義

```typescript
// 方法1: Type[]
let numbers: number[] = [1, 2, 3, 4, 5];
let names: string[] = ["Alice", "Bob", "Charlie"];

// 方法2: Array<Type>
let scores: Array<number> = [85, 90, 78];
let fruits: Array<string> = ["apple", "banana"];

// ❌ エラー
numbers.push("six"); // Argument of type 'string' is not assignable
```

### 多次元配列

```typescript
// 2次元配列
let matrix: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

// 文字列の配列の配列
let groups: string[][] = [
  ["Alice", "Bob"],
  ["Charlie", "David"],
];
```

## タプル

タプルは固定長・固定型の配列です。

```typescript
// [型1, 型2, ...]
let user: [string, number] = ["Alice", 25];
let point: [number, number] = [10, 20];

// アクセス
console.log(user[0]); // "Alice"
console.log(user[1]); // 25

// ❌ エラー
user = [25, "Alice"]; // 型の順序が違う
user = ["Alice"]; // 要素数が足りない
```

### オプショナル要素

```typescript
// 3番目の要素はオプショナル
let person: [string, number, boolean?] = ["Bob", 30];
person = ["Alice", 25, true]; // OK
```

### 可変長タプル

```typescript
// 最初の2つは固定、残りは可変
let data: [string, number, ...boolean[]] = ["test", 1, true, false, true];
```

## Enum（列挙型）

### 数値 Enum

```typescript
enum Direction {
  Up, // 0
  Down, // 1
  Left, // 2
  Right, // 3
}

let dir: Direction = Direction.Up;
console.log(dir); // 0

// カスタム開始値
enum Status {
  Pending = 1,
  InProgress = 2,
  Done = 3,
}
```

### 文字列 Enum

```typescript
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

let favoriteColor: Color = Color.Red;
console.log(favoriteColor); // "RED"
```

### 実用例

```typescript
enum HttpStatus {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
  ServerError = 500,
}

function handleResponse(status: HttpStatus): void {
  if (status === HttpStatus.OK) {
    console.log("Success!");
  } else if (status === HttpStatus.NotFound) {
    console.log("Resource not found");
  }
}
```

## any 型

型チェックを無効化します（使用は最小限に）。

```typescript
let anything: any = "Hello";
anything = 123; // OK
anything = true; // OK
anything = []; // OK

// any は何でも許可する
anything.foo.bar.baz; // エラーにならない（危険!）
```

### any の使用を避けるべき理由

```typescript
// ❌ 悪い例
function processData(data: any): any {
  return data.value; // data に value があるか不明
}

// ✅ 良い例
interface Data {
  value: string;
}

function processData(data: Data): string {
  return data.value; // 型安全
}
```

## unknown 型

より安全な any の代替です。

```typescript
let value: unknown = "Hello";
value = 123; // OK
value = true; // OK

// ❌ エラー: そのままでは使用できない
console.log(value.toUpperCase());

// ✅ OK: 型チェック後に使用
if (typeof value === "string") {
  console.log(value.toUpperCase());
}
```

### unknown vs any

```typescript
// any: 型チェックなし
let a: any = "test";
a.foo(); // コンパイルは通るが実行時エラー

// unknown: 型チェック必須
let u: unknown = "test";
u.foo(); // ❌ コンパイルエラー

if (typeof u === "string") {
  u.toUpperCase(); // ✅ OK
}
```

## void 型

関数が値を返さないことを示します。

```typescript
function log(message: string): void {
  console.log(message);
  // return は省略可能、または return; のみ
}

function displayError(error: string): void {
  console.error(error);
}

// ❌ エラー
function getValue(): void {
  return "value"; // Type 'string' is not assignable to type 'void'
}
```

## null と undefined

```typescript
let n: null = null;
let u: undefined = undefined;

// strictNullChecks が有効な場合
let name: string = null; // ❌ エラー
let age: number = undefined; // ❌ エラー

// 明示的に許可
let name: string | null = null; // ✅ OK
let age: number | undefined = undefined; // ✅ OK
```

## never 型

決して値を返さない関数に使用します。

```typescript
// 例外を投げる関数
function throwError(message: string): never {
  throw new Error(message);
}

// 無限ループ
function infiniteLoop(): never {
  while (true) {
    // ...
  }
}

// 網羅性チェック
type Shape = "circle" | "square";

function getArea(shape: Shape): number {
  switch (shape) {
    case "circle":
      return Math.PI * 10 * 10;
    case "square":
      return 10 * 10;
    default:
      const _exhaustive: never = shape; // すべてのケースを処理
      return _exhaustive;
  }
}
```

## 型アサーション

型を手動で指定します。

```typescript
// as 構文
let someValue: unknown = "this is a string";
let strLength: number = (someValue as string).length;

// <>構文（JSX では使用不可）
let strLength2: number = (<string>someValue).length;
```

### 実用例

```typescript
// DOM 操作
const inputElement = document.getElementById("username") as HTMLInputElement;
inputElement.value = "John";

// API レスポンス
interface User {
  id: number;
  name: string;
}

const response: unknown = await fetch("/api/user");
const user = response as User;
```

## リテラル型

特定の値のみを許可します。

```typescript
// 文字列リテラル
let direction: "up" | "down" | "left" | "right";
direction = "up"; // ✅ OK
direction = "north"; // ❌ エラー

// 数値リテラル
let diceRoll: 1 | 2 | 3 | 4 | 5 | 6;
diceRoll = 3; // ✅ OK
diceRoll = 7; // ❌ エラー

// 真偽値リテラル
let isTrue: true = true;
isTrue = false; // ❌ エラー
```

### 実用例

```typescript
type ButtonSize = "small" | "medium" | "large";
type Theme = "light" | "dark";

interface ButtonProps {
  size: ButtonSize;
  theme: Theme;
  disabled: boolean;
}

const button: ButtonProps = {
  size: "medium",
  theme: "dark",
  disabled: false,
};
```

## 型推論

TypeScript は型を自動的に推論します。

```typescript
// 型が推論される
let message = "Hello"; // string
let count = 42; // number
let isActive = true; // boolean

// 配列の型も推論される
let numbers = [1, 2, 3]; // number[]
let mixed = [1, "two", true]; // (string | number | boolean)[]

// 関数の戻り値も推論される
function add(a: number, b: number) {
  return a + b; // 戻り値の型は number と推論される
}
```

## 実践例: ユーザー管理システム

```typescript
// ユーザーの役割
enum UserRole {
  Admin = "ADMIN",
  Editor = "EDITOR",
  Viewer = "VIEWER",
}

// ユーザー情報
interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  metadata?: Record<string, unknown>;
}

// ユーザー作成
function createUser(
  username: string,
  email: string,
  role: UserRole = UserRole.Viewer
): User {
  return {
    id: Date.now(),
    username,
    email,
    role,
    isActive: true,
    lastLogin: null,
  };
}

// 使用例
const admin = createUser("john_admin", "john@example.com", UserRole.Admin);
const viewer = createUser("alice_viewer", "alice@example.com");

console.log(admin.role); // "ADMIN"
console.log(viewer.role); // "VIEWER"
```

## まとめ

- **プリミティブ型**: string, number, boolean の基本型
- **配列**: `Type[]` または `Array<Type>`
- **タプル**: 固定長・固定型の配列 `[Type1, Type2]`
- **Enum**: 名前付き定数のセット
- **any**: 型チェックなし（避けるべき）
- **unknown**: 安全な any（型ガード必須）
- **void**: 戻り値なし
- **never**: 決して値を返さない
- **型アサーション**: `as Type` で型を手動指定
- **リテラル型**: 特定の値のみ許可

## 演習問題

1. **基本型**: 文字列、数値、真偽値を使った変数を定義してください
2. **配列とタプル**: ユーザー情報（名前、年齢、メールアドレス）をタプルで表現してください
3. **Enum**: 曜日を表す Enum を作成してください
4. **型アサーション**: `unknown` 型の値を適切に型アサーションして使用してください

## 次のステップ

次の章では、関数の型定義について詳しく学びます。

⬅️ 前へ: [01-Getting-Started.md](./01-Getting-Started.md)
➡️ 次へ: [03-Functions.md](./03-Functions.md)
