# 06 - Generics

## 概要

TypeScript のジェネリクスについて学びます。再利用可能で型安全なコードを書くための強力な機能です。

## 学習目標

- [ ] ジェネリクスの基本概念を理解できる
- [ ] ジェネリック関数・クラス・インターフェースを作成できる
- [ ] 型制約（extends）を使いこなせる
- [ ] 複数の型パラメータを扱える

## ジェネリクスとは

### なぜジェネリクスが必要か

```typescript
// ❌ any を使うと型安全性がなくなる
function identityAny(value: any): any {
  return value;
}

const resultAny = identityAny("hello");
resultAny.toUpperCase(); // 型チェックされない

// ✅ ジェネリクスで型を保持
function identity<T>(value: T): T {
  return value;
}

const resultGeneric = identity("hello");
resultGeneric.toUpperCase(); // ✅ string として型チェックされる
```

### 基本的な構文

```typescript
// <T> で型パラメータを定義
function identity<T>(value: T): T {
  return value;
}

// 使用時に型が推論される
const str = identity("hello"); // string
const num = identity(42); // number

// 明示的に型を指定することも可能
const bool = identity<boolean>(true);
```

## ジェネリック関数

### 単一の型パラメータ

```typescript
// 配列の最初の要素を返す
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const firstNumber = first([1, 2, 3]); // number | undefined
const firstName = first(["a", "b", "c"]); // string | undefined
```

### 複数の型パラメータ

```typescript
// 2つの値をペアにする
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result = pair("name", 42); // [string, number]
console.log(result[0]); // "name"
console.log(result[1]); // 42
```

### 型パラメータのデフォルト

```typescript
// デフォルトの型を指定
function createArray<T = string>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

const strings = createArray(3, "hello"); // string[]
const numbers = createArray<number>(3, 42); // number[]
```

## 型制約

### extends による制約

```typescript
// T は length プロパティを持つ型に制限
function logLength<T extends { length: number }>(value: T): void {
  console.log(value.length);
}

logLength("hello"); // 5
logLength([1, 2, 3]); // 3
logLength({ length: 10 }); // 10
// logLength(123); // ❌ エラー: number に length がない
```

### インターフェースによる制約

```typescript
interface HasId {
  id: number;
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}

interface User extends HasId {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const user = findById(users, 1);
console.log(user?.name); // "Alice"
```

### keyof との組み合わせ

```typescript
// オブジェクトのプロパティを取得
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Alice", age: 25 };
const name = getProperty(user, "name"); // string
const age = getProperty(user, "age"); // number
// getProperty(user, "email"); // ❌ エラー: "email" は存在しない
```

## ジェネリックインターフェース

### 基本的な定義

```typescript
interface Container<T> {
  value: T;
  getValue(): T;
  setValue(value: T): void;
}

class Box<T> implements Container<T> {
  constructor(public value: T) {}

  getValue(): T {
    return this.value;
  }

  setValue(value: T): void {
    this.value = value;
  }
}

const numberBox = new Box(42);
console.log(numberBox.getValue()); // 42

const stringBox = new Box("hello");
console.log(stringBox.getValue()); // "hello"
```

### ジェネリック API レスポンス

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: number;
}

interface User {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
}

// 型安全な API レスポンス
const userResponse: ApiResponse<User> = {
  success: true,
  data: { id: 1, name: "Alice" },
  timestamp: Date.now(),
};

const postResponse: ApiResponse<Post[]> = {
  success: true,
  data: [{ id: 1, title: "Hello", content: "World" }],
  timestamp: Date.now(),
};
```

## ジェネリッククラス

### 基本的なジェネリッククラス

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
console.log(numberStack.pop()); // 2
console.log(numberStack.peek()); // 1
```

### 複数の型パラメータを持つクラス

```typescript
class KeyValuePair<K, V> {
  constructor(public key: K, public value: V) {}

  toString(): string {
    return `${this.key}: ${this.value}`;
  }
}

const pair1 = new KeyValuePair("name", "Alice");
const pair2 = new KeyValuePair(1, { active: true });

console.log(pair1.toString()); // "name: Alice"
console.log(pair2.key); // 1
console.log(pair2.value); // { active: true }
```

## ジェネリック型エイリアス

### 基本的な型エイリアス

```typescript
// 結果型
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { success: false, error: "Division by zero" };
  }
  return { success: true, value: a / b };
}

const result = divide(10, 2);
if (result.success) {
  console.log(result.value); // 5
} else {
  console.log(result.error);
}
```

### ユーティリティ型の定義

```typescript
// Nullable 型
type Nullable<T> = T | null;

// Optional 型
type Optional<T> = T | undefined;

// 配列またはシングル
type ArrayOrSingle<T> = T | T[];

// 使用例
let name: Nullable<string> = null;
name = "Alice";

let age: Optional<number> = undefined;
age = 25;

function processItems<T>(items: ArrayOrSingle<T>): T[] {
  return Array.isArray(items) ? items : [items];
}

console.log(processItems(1)); // [1]
console.log(processItems([1, 2, 3])); // [1, 2, 3]
```

## 条件型とジェネリクス

### 基本的な条件型

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
```

### infer キーワード

```typescript
// 関数の戻り値の型を抽出
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(): string {
  return "Hello";
}

type GreetReturn = ReturnType<typeof greet>; // string

// 配列の要素型を抽出
type ElementType<T> = T extends (infer E)[] ? E : never;

type NumberArrayElement = ElementType<number[]>; // number
type StringArrayElement = ElementType<string[]>; // string
```

### Distributive Conditional Types

```typescript
// T がユニオン型の場合、各要素に対して適用される
type ToArray<T> = T extends any ? T[] : never;

type NumberOrStringArray = ToArray<number | string>;
// number[] | string[]

// 分配を防ぐ
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type Combined = ToArrayNonDist<number | string>;
// (number | string)[]
```

## 実践例: データ構造

### ジェネリック LinkedList

```typescript
class ListNode<T> {
  constructor(public value: T, public next: ListNode<T> | null = null) {}
}

class LinkedList<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private length: number = 0;

  append(value: T): void {
    const node = new ListNode(value);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(value: T): void {
    const node = new ListNode(value, this.head);
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
    this.length++;
  }

  find(predicate: (value: T) => boolean): T | undefined {
    let current = this.head;
    while (current) {
      if (predicate(current.value)) {
        return current.value;
      }
      current = current.next;
    }
    return undefined;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  get size(): number {
    return this.length;
  }
}

// 使用例
const list = new LinkedList<number>();
list.append(1);
list.append(2);
list.append(3);
console.log(list.toArray()); // [1, 2, 3]
console.log(list.find((n) => n > 1)); // 2
```

### ジェネリック Map

```typescript
class TypedMap<K, V> {
  private items = new Map<K, V>();

  set(key: K, value: V): void {
    this.items.set(key, value);
  }

  get(key: K): V | undefined {
    return this.items.get(key);
  }

  has(key: K): boolean {
    return this.items.has(key);
  }

  delete(key: K): boolean {
    return this.items.delete(key);
  }

  clear(): void {
    this.items.clear();
  }

  get size(): number {
    return this.items.size;
  }

  forEach(callback: (value: V, key: K) => void): void {
    this.items.forEach(callback);
  }

  keys(): K[] {
    return Array.from(this.items.keys());
  }

  values(): V[] {
    return Array.from(this.items.values());
  }
}

// 使用例
const userMap = new TypedMap<string, { name: string; age: number }>();
userMap.set("user1", { name: "Alice", age: 25 });
userMap.set("user2", { name: "Bob", age: 30 });

console.log(userMap.get("user1")); // { name: "Alice", age: 25 }
console.log(userMap.keys()); // ["user1", "user2"]
```

## 実践例: イベントエミッター

```typescript
type EventMap = {
  [key: string]: any;
};

type EventHandler<T> = (data: T) => void;

class TypedEventEmitter<Events extends EventMap> {
  private handlers: {
    [K in keyof Events]?: EventHandler<Events[K]>[];
  } = {};

  on<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event]!.push(handler);

    // 解除関数を返す
    return () => {
      this.off(event, handler);
    };
  }

  off<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): void {
    const handlers = this.handlers[event];
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const handlers = this.handlers[event];
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
}

// イベントの型定義
interface AppEvents {
  userLogin: { userId: string; timestamp: Date };
  userLogout: { userId: string };
  message: { from: string; content: string };
}

// 使用例
const emitter = new TypedEventEmitter<AppEvents>();

// 型安全なイベントハンドラ
emitter.on("userLogin", ({ userId, timestamp }) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

emitter.on("message", ({ from, content }) => {
  console.log(`Message from ${from}: ${content}`);
});

// 型安全なイベント発火
emitter.emit("userLogin", { userId: "123", timestamp: new Date() });
emitter.emit("message", { from: "Alice", content: "Hello!" });
```

## 実践例: バリデーター

```typescript
type Validator<T> = (value: T) => string | null;

class ValidationBuilder<T> {
  private validators: Validator<T>[] = [];

  addValidator(validator: Validator<T>): this {
    this.validators.push(validator);
    return this;
  }

  validate(value: T): { valid: boolean; errors: string[] } {
    const errors = this.validators
      .map((v) => v(value))
      .filter((e): e is string => e !== null);

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ジェネリック バリデータファクトリ
function minLength(min: number): Validator<string> {
  return (value) => (value.length >= min ? null : `最低${min}文字必要です`);
}

function maxLength(max: number): Validator<string> {
  return (value) => (value.length <= max ? null : `最大${max}文字までです`);
}

function pattern(regex: RegExp, message: string): Validator<string> {
  return (value) => (regex.test(value) ? null : message);
}

function min(minValue: number): Validator<number> {
  return (value) =>
    value >= minValue ? null : `${minValue}以上の値が必要です`;
}

function max(maxValue: number): Validator<number> {
  return (value) =>
    value <= maxValue ? null : `${maxValue}以下の値が必要です`;
}

// 使用例
const usernameValidator = new ValidationBuilder<string>()
  .addValidator(minLength(3))
  .addValidator(maxLength(20))
  .addValidator(pattern(/^[a-zA-Z0-9_]+$/, "英数字のみ"));

console.log(usernameValidator.validate("alice123"));
// { valid: true, errors: [] }

console.log(usernameValidator.validate("ab"));
// { valid: false, errors: ["最低3文字必要です"] }

const ageValidator = new ValidationBuilder<number>()
  .addValidator(min(0))
  .addValidator(max(120));

console.log(ageValidator.validate(25)); // { valid: true, errors: [] }
console.log(ageValidator.validate(-5)); // { valid: false, errors: [...] }
```

## まとめ

- **ジェネリクス**: `<T>` で型パラメータを定義
- **型制約**: `<T extends Type>` で型を制限
- **keyof**: `<K extends keyof T>` でプロパティキーを制限
- **複数パラメータ**: `<T, U, V>` で複数の型を扱う
- **デフォルト型**: `<T = string>` でデフォルト値
- **条件型**: `T extends U ? X : Y` で条件分岐
- **infer**: 型を抽出

## 演習問題

1. **基本**: 配列の最後の要素を返すジェネリック関数を作成してください
2. **型制約**: `toString()` メソッドを持つ型に制限されたジェネリック関数を作成してください
3. **クラス**: ジェネリックなキューを実装してください
4. **条件型**: 配列型からその要素型を抽出する型を作成してください

## 次のステップ

次の章では、型エイリアスとユニオン型について詳しく学びます。

⬅️ 前へ: [05-Classes.md](./05-Classes.md)
➡️ 次へ: [07-Type-Aliases-and-Union-Types.md](./07-Type-Aliases-and-Union-Types.md)
