# 07 - Type Aliases and Union Types

## 概要

型エイリアス（type）とユニオン型について学びます。これらを組み合わせることで、柔軟で表現力豊かな型定義が可能になります。

## 学習目標

- [ ] 型エイリアスを効果的に使用できる
- [ ] ユニオン型とインターセクション型を理解できる
- [ ] リテラル型を活用できる
- [ ] 型ガードでユニオン型を絞り込める

## 型エイリアス

### 基本的な型エイリアス

```typescript
// プリミティブ型のエイリアス
type ID = string | number;
type Email = string;
type Age = number;

// オブジェクト型のエイリアス
type User = {
  id: ID;
  email: Email;
  age: Age;
};

const user: User = {
  id: 1,
  email: "alice@example.com",
  age: 25,
};
```

### 関数型のエイリアス

```typescript
// 関数型
type Callback = (data: string) => void;
type AsyncCallback<T> = (data: T) => Promise<void>;
type Comparator<T> = (a: T, b: T) => number;

// 使用例
const logger: Callback = (data) => console.log(data);

const numberComparator: Comparator<number> = (a, b) => a - b;
[3, 1, 2].sort(numberComparator); // [1, 2, 3]
```

### 配列とタプル

```typescript
// 配列
type StringArray = string[];
type NumberList = Array<number>;

// タプル
type Point = [number, number];
type RGB = [number, number, number];
type NamedPoint = [string, number, number];

const origin: Point = [0, 0];
const red: RGB = [255, 0, 0];
const location: NamedPoint = ["Tokyo", 35.6762, 139.6503];
```

## ユニオン型

### 基本的なユニオン型

```typescript
// 複数の型のいずれか
type StringOrNumber = string | number;

let value: StringOrNumber;
value = "hello"; // ✅ OK
value = 42; // ✅ OK
// value = true; // ❌ エラー

// 関数の引数で使用
function formatValue(value: string | number): string {
  return String(value);
}
```

### リテラル型とのユニオン

```typescript
// 特定の値のみ許可
type Direction = "up" | "down" | "left" | "right";
type Status = "pending" | "approved" | "rejected";
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

function move(direction: Direction): void {
  console.log(`Moving ${direction}`);
}

move("up"); // ✅ OK
// move("forward"); // ❌ エラー
```

### 数値リテラル型

```typescript
type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

function rollDice(): DiceValue {
  return Math.ceil(Math.random() * 6) as DiceValue;
}

function getMonthName(month: Month): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[month - 1];
}
```

## 型ガード

### typeof による型ガード

```typescript
function processValue(value: string | number): string {
  if (typeof value === "string") {
    // この中では value は string
    return value.toUpperCase();
  } else {
    // この中では value は number
    return value.toFixed(2);
  }
}
```

### instanceof による型ガード

```typescript
class Dog {
  bark(): void {
    console.log("Woof!");
  }
}

class Cat {
  meow(): void {
    console.log("Meow!");
  }
}

function makeSound(animal: Dog | Cat): void {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}
```

### in による型ガード

```typescript
interface Bird {
  fly(): void;
}

interface Fish {
  swim(): void;
}

function move(animal: Bird | Fish): void {
  if ("fly" in animal) {
    animal.fly();
  } else {
    animal.swim();
  }
}
```

### カスタム型ガード

```typescript
interface User {
  type: "user";
  name: string;
}

interface Admin {
  type: "admin";
  name: string;
  permissions: string[];
}

// 型述語（type predicate）
function isAdmin(person: User | Admin): person is Admin {
  return person.type === "admin";
}

function greet(person: User | Admin): void {
  if (isAdmin(person)) {
    console.log(`Admin: ${person.name}, Permissions: ${person.permissions}`);
  } else {
    console.log(`User: ${person.name}`);
  }
}
```

## 判別可能なユニオン型

### 共通プロパティによる判別

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
  }
}

const circle: Circle = { kind: "circle", radius: 5 };
console.log(getArea(circle)); // 78.54...
```

### 網羅性チェック

```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // すべてのケースが処理されていることを保証
      return assertNever(shape);
  }
}
```

## インターセクション型

### 基本的なインターセクション

```typescript
type HasName = {
  name: string;
};

type HasAge = {
  age: number;
};

type HasEmail = {
  email: string;
};

// すべてのプロパティを持つ
type Person = HasName & HasAge & HasEmail;

const person: Person = {
  name: "Alice",
  age: 25,
  email: "alice@example.com",
};
```

### インターフェースとの組み合わせ

```typescript
interface Identifiable {
  id: string;
}

interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  name: string;
  email: string;
}

// 複数の特性を組み合わせる
type TimestampedUser = User & Identifiable & Timestamped;

const user: TimestampedUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### 関数型のインターセクション

```typescript
type Logger = {
  log(message: string): void;
};

type ErrorReporter = {
  reportError(error: Error): void;
};

type DiagnosticsTool = Logger & ErrorReporter;

const diagnostics: DiagnosticsTool = {
  log(message) {
    console.log(`[LOG] ${message}`);
  },
  reportError(error) {
    console.error(`[ERROR] ${error.message}`);
  },
};
```

## Nullable 型

### null と undefined

```typescript
// strictNullChecks が有効な場合
type NullableString = string | null;
type OptionalNumber = number | undefined;
type Nullable<T> = T | null;
type Optional<T> = T | undefined;

function greet(name: string | null): string {
  if (name === null) {
    return "Hello, Guest!";
  }
  return `Hello, ${name}!`;
}
```

### オプショナルチェーン

```typescript
interface User {
  name: string;
  address?: {
    city: string;
    street?: string;
  };
}

function getCity(user: User): string | undefined {
  return user.address?.city;
}

function getStreet(user: User): string | undefined {
  return user.address?.street;
}
```

### Null 合体演算子

```typescript
function getUsername(name: string | null | undefined): string {
  return name ?? "Anonymous";
}

console.log(getUsername("Alice")); // "Alice"
console.log(getUsername(null)); // "Anonymous"
console.log(getUsername(undefined)); // "Anonymous"
```

## 実践例: API レスポンス

```typescript
// 成功・失敗を判別可能なレスポンス型
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: string }
  | { status: "loading" };

function handleResponse<T>(response: ApiResponse<T>): void {
  switch (response.status) {
    case "success":
      console.log("Data:", response.data);
      break;
    case "error":
      console.error("Error:", response.error);
      break;
    case "loading":
      console.log("Loading...");
      break;
  }
}

// 使用例
const successResponse: ApiResponse<{ name: string }> = {
  status: "success",
  data: { name: "Alice" },
};

handleResponse(successResponse);
```

## 実践例: フォームフィールド

```typescript
// 入力フィールドの型
type TextField = {
  type: "text";
  value: string;
  placeholder?: string;
};

type NumberField = {
  type: "number";
  value: number;
  min?: number;
  max?: number;
};

type SelectField = {
  type: "select";
  value: string;
  options: { label: string; value: string }[];
};

type CheckboxField = {
  type: "checkbox";
  checked: boolean;
  label: string;
};

type FormField = TextField | NumberField | SelectField | CheckboxField;

function renderField(field: FormField): string {
  switch (field.type) {
    case "text":
      return `<input type="text" value="${field.value}" placeholder="${
        field.placeholder || ""
      }">`;
    case "number":
      return `<input type="number" value="${field.value}" min="${field.min}" max="${field.max}">`;
    case "select":
      const options = field.options
        .map((o) => `<option value="${o.value}">${o.label}</option>`)
        .join("");
      return `<select>${options}</select>`;
    case "checkbox":
      return `<label><input type="checkbox" ${
        field.checked ? "checked" : ""
      }> ${field.label}</label>`;
  }
}

// 使用例
const fields: FormField[] = [
  { type: "text", value: "", placeholder: "Name" },
  { type: "number", value: 0, min: 0, max: 100 },
  {
    type: "select",
    value: "a",
    options: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
    ],
  },
  { type: "checkbox", checked: false, label: "Agree to terms" },
];
```

## 実践例: アクション型

```typescript
// Redux スタイルのアクション
type AddTodoAction = {
  type: "ADD_TODO";
  payload: { text: string };
};

type ToggleTodoAction = {
  type: "TOGGLE_TODO";
  payload: { id: number };
};

type RemoveTodoAction = {
  type: "REMOVE_TODO";
  payload: { id: number };
};

type ClearCompletedAction = {
  type: "CLEAR_COMPLETED";
};

type TodoAction =
  | AddTodoAction
  | ToggleTodoAction
  | RemoveTodoAction
  | ClearCompletedAction;

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case "ADD_TODO":
      return [
        ...state,
        {
          id: Date.now(),
          text: action.payload.text,
          completed: false,
        },
      ];
    case "TOGGLE_TODO":
      return state.map((todo) =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    case "REMOVE_TODO":
      return state.filter((todo) => todo.id !== action.payload.id);
    case "CLEAR_COMPLETED":
      return state.filter((todo) => !todo.completed);
  }
}

// アクションクリエイター
const addTodo = (text: string): AddTodoAction => ({
  type: "ADD_TODO",
  payload: { text },
});

const toggleTodo = (id: number): ToggleTodoAction => ({
  type: "TOGGLE_TODO",
  payload: { id },
});
```

## 実践例: 結果型

```typescript
// Result 型（Rust の Result に類似）
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// ヘルパー関数
function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// 使用例
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Division by zero");
  }
  return ok(a / b);
}

function parseJSON<T>(json: string): Result<T, SyntaxError> {
  try {
    return ok(JSON.parse(json));
  } catch (e) {
    return err(e as SyntaxError);
  }
}

// チェーン処理
function processData(data: string): Result<number, string> {
  const parsed = parseJSON<{ value: number }>(data);

  if (!parsed.ok) {
    return err(`Parse error: ${parsed.error.message}`);
  }

  const divided = divide(parsed.value.value, 2);

  if (!divided.ok) {
    return err(divided.error);
  }

  return ok(divided.value * 10);
}
```

## まとめ

- **型エイリアス**: `type` で型に名前を付ける
- **ユニオン型**: `A | B` でいずれかの型
- **リテラル型**: 特定の値のみ許可
- **型ガード**: `typeof`, `instanceof`, `in`, カスタム型ガード
- **判別可能なユニオン**: 共通プロパティで型を区別
- **インターセクション**: `A & B` で両方の型を持つ
- **Nullable**: `T | null | undefined`
- **網羅性チェック**: `never` で全ケース処理を保証

## 演習問題

1. **ユニオン型**: 成功・エラー・ローディングの 3 状態を表す型を作成してください
2. **型ガード**: ユニオン型を絞り込むカスタム型ガードを作成してください
3. **判別可能なユニオン**: 異なる図形（円、正方形、三角形）の面積を計算する関数を作成してください
4. **インターセクション**: 複数の特性を組み合わせたエンティティ型を作成してください

## 次のステップ

次の章では、高度な型（Conditional Types、Mapped Types）について学びます。

⬅️ 前へ: [06-Generics.md](./06-Generics.md)
➡️ 次へ: [08-Advanced-Types.md](./08-Advanced-Types.md)
