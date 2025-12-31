# 03 - Functions

## 概要

TypeScript での関数の型定義について学びます。パラメータ、戻り値、オーバーロード、ジェネリック関数など、関数に関する型システムを理解します。

## 学習目標

- [ ] 関数のパラメータと戻り値に型を定義できる
- [ ] オプショナルパラメータとデフォルト値を理解できる
- [ ] 関数オーバーロードを使いこなせる
- [ ] 関数型の定義方法を理解できる

## 基本的な関数の型定義

### パラメータと戻り値の型

```typescript
// 関数宣言
function add(a: number, b: number): number {
  return a + b;
}

// アロー関数
const multiply = (a: number, b: number): number => {
  return a * b;
};

// 簡潔なアロー関数
const divide = (a: number, b: number): number => a / b;

// 使用例
console.log(add(5, 3)); // 8
console.log(multiply(4, 2)); // 8
console.log(divide(10, 2)); // 5
```

### 戻り値の型推論

```typescript
// 戻り値の型は推論される
function subtract(a: number, b: number) {
  return a - b; // number と推論
}

// 明示的に指定することも可能（推奨）
function subtractExplicit(a: number, b: number): number {
  return a - b;
}
```

## void と undefined

### void を返す関数

```typescript
// void: 戻り値がないことを示す
function logMessage(message: string): void {
  console.log(message);
}

// void 関数でも return は使える
function greet(name: string): void {
  if (!name) return;
  console.log(`Hello, ${name}!`);
}
```

### void と undefined の違い

```typescript
// void: 戻り値を無視することを意味
function noReturn(): void {
  console.log("No return");
}

// undefined: 明示的に undefined を返す
function returnsUndefined(): undefined {
  return undefined;
}

// コールバックでの void
const callback: () => void = () => {
  return "ignored"; // 戻り値は無視される
};
```

## オプショナルパラメータ

### ? でオプショナルに

```typescript
function greet(name: string, greeting?: string): string {
  if (greeting) {
    return `${greeting}, ${name}!`;
  }
  return `Hello, ${name}!`;
}

console.log(greet("Alice")); // "Hello, Alice!"
console.log(greet("Bob", "Hi")); // "Hi, Bob!"
```

### オプショナルパラメータの位置

```typescript
// ✅ オプショナルは必須の後に
function createUser(name: string, age?: number): void {
  // ...
}

// ❌ エラー: 必須パラメータの前にオプショナルは置けない
// function createUser(age?: number, name: string): void {}
```

## デフォルトパラメータ

### デフォルト値の設定

```typescript
function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}

console.log(greet("Alice")); // "Hello, Alice!"
console.log(greet("Bob", "Hi")); // "Hi, Bob!"

// デフォルト値を持つパラメータは任意の位置に置ける
function createUrl(
  path: string,
  protocol: string = "https",
  domain: string
): string {
  return `${protocol}://${domain}/${path}`;
}
```

### 型推論

```typescript
// デフォルト値から型が推論される
function increment(value: number, step = 1) {
  return value + step; // step は number と推論
}
```

## Rest パラメータ

### 可変長引数

```typescript
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + curr, 0);
}

console.log(sum(1, 2, 3)); // 6
console.log(sum(1, 2, 3, 4, 5)); // 15
```

### 固定パラメータと組み合わせ

```typescript
function format(template: string, ...values: (string | number)[]): string {
  return values.reduce<string>(
    (acc, val, i) => acc.replace(`{${i}}`, String(val)),
    template
  );
}

console.log(format("Hello, {0}! You are {1} years old.", "Alice", 25));
// "Hello, Alice! You are 25 years old."
```

## 関数型の定義

### 関数型の構文

```typescript
// 関数型の定義
type BinaryOperation = (a: number, b: number) => number;

// 関数型を使用
const add: BinaryOperation = (a, b) => a + b;
const subtract: BinaryOperation = (a, b) => a - b;

// インターフェースでも定義可能
interface Calculator {
  (a: number, b: number): number;
}

const multiply: Calculator = (a, b) => a * b;
```

### コールバック関数

```typescript
// コールバック関数の型定義
type Callback<T> = (error: Error | null, result: T | null) => void;

function fetchData(url: string, callback: Callback<string>): void {
  try {
    const data = "fetched data";
    callback(null, data);
  } catch (error) {
    callback(error as Error, null);
  }
}

// 使用例
fetchData("https://api.example.com", (error, data) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log(data);
});
```

### 高階関数

```typescript
// 関数を返す関数
function createMultiplier(factor: number): (value: number) => number {
  return (value) => value * factor;
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15

// 関数を引数に取る関数
function applyOperation(
  value: number,
  operation: (n: number) => number
): number {
  return operation(value);
}

console.log(applyOperation(10, double)); // 20
```

## 関数オーバーロード

### オーバーロードシグネチャ

```typescript
// オーバーロードシグネチャ（実装なし）
function format(value: string): string;
function format(value: number): string;
function format(value: Date): string;

// 実装シグネチャ（実装あり）
function format(value: string | number | Date): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  } else if (typeof value === "number") {
    return value.toFixed(2);
  } else {
    return value.toISOString();
  }
}

// 使用例
console.log(format("hello")); // "HELLO"
console.log(format(3.14159)); // "3.14"
console.log(format(new Date())); // "2024-01-15T..."
```

### 複雑なオーバーロード

```typescript
// 引数の数によるオーバーロード
function createElement(tag: string): HTMLElement;
function createElement(tag: string, content: string): HTMLElement;
function createElement(
  tag: string,
  attributes: Record<string, string>
): HTMLElement;
function createElement(
  tag: string,
  content: string,
  attributes: Record<string, string>
): HTMLElement;

function createElement(
  tag: string,
  contentOrAttrs?: string | Record<string, string>,
  attributes?: Record<string, string>
): HTMLElement {
  const element = document.createElement(tag);

  if (typeof contentOrAttrs === "string") {
    element.textContent = contentOrAttrs;
  } else if (contentOrAttrs) {
    Object.entries(contentOrAttrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  return element;
}
```

## ジェネリック関数

### 基本的なジェネリック関数

```typescript
// 型パラメータ T を使用
function identity<T>(value: T): T {
  return value;
}

// 使用例（型が推論される）
const str = identity("hello"); // string
const num = identity(42); // number

// 明示的に型を指定
const bool = identity<boolean>(true);
```

### 複数の型パラメータ

```typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result = pair("name", 42); // [string, number]
console.log(result[0]); // "name"
console.log(result[1]); // 42
```

### 型制約

```typescript
// T は length プロパティを持つ型に制限
function logLength<T extends { length: number }>(value: T): void {
  console.log(value.length);
}

logLength("hello"); // 5
logLength([1, 2, 3]); // 3
logLength({ length: 10 }); // 10
// logLength(123); // ❌ エラー: number に length プロパティはない
```

## this パラメータ

### this の型定義

```typescript
interface User {
  name: string;
  greet(this: User): void;
}

const user: User = {
  name: "Alice",
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  },
};

user.greet(); // "Hello, I'm Alice"

// ❌ this のコンテキストが失われる
// const greet = user.greet;
// greet(); // エラー
```

### メソッドチェーン

```typescript
class Builder {
  private value: string = "";

  append(this: Builder, text: string): this {
    this.value += text;
    return this;
  }

  prepend(this: Builder, text: string): this {
    this.value = text + this.value;
    return this;
  }

  build(): string {
    return this.value;
  }
}

const result = new Builder()
  .append("Hello")
  .append(" ")
  .append("World")
  .prepend(">>> ")
  .build();

console.log(result); // ">>> Hello World"
```

## 非同期関数

### Promise を返す関数

```typescript
// Promise<T> で戻り値の型を指定
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// 使用例
fetchUser(1).then((user) => {
  console.log(user.name);
});

// async/await で使用
async function displayUser() {
  const user = await fetchUser(1);
  console.log(user.name);
}
```

### 非同期コールバック

```typescript
type AsyncCallback<T> = () => Promise<T>;

async function retry<T>(
  fn: AsyncCallback<T>,
  attempts: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw lastError;
}

// 使用例
const data = await retry(async () => {
  const response = await fetch("/api/data");
  return response.json();
});
```

## 実践例: バリデーション関数

```typescript
// バリデーション結果の型
type ValidationResult = { valid: true } | { valid: false; errors: string[] };

// バリデータ関数の型
type Validator<T> = (value: T) => ValidationResult;

// バリデータの作成
function createValidator<T>(
  ...validators: ((value: T) => string | null)[]
): Validator<T> {
  return (value: T): ValidationResult => {
    const errors = validators
      .map((v) => v(value))
      .filter((e): e is string => e !== null);

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  };
}

// 具体的なバリデータ
const minLength =
  (min: number) =>
  (value: string): string | null =>
    value.length >= min ? null : `最低${min}文字必要です`;

const maxLength =
  (max: number) =>
  (value: string): string | null =>
    value.length <= max ? null : `最大${max}文字までです`;

const pattern =
  (regex: RegExp, message: string) =>
  (value: string): string | null =>
    regex.test(value) ? null : message;

// バリデータの組み合わせ
const validateUsername = createValidator<string>(
  minLength(3),
  maxLength(20),
  pattern(/^[a-zA-Z0-9_]+$/, "英数字とアンダースコアのみ使用可能です")
);

// 使用例
console.log(validateUsername("alice123")); // { valid: true }
console.log(validateUsername("a!")); // { valid: false, errors: [...] }
```

## 実践例: イベントハンドラ

```typescript
// イベントの型定義
interface EventMap {
  click: { x: number; y: number };
  keypress: { key: string };
  load: { timestamp: number };
}

// イベントハンドラの型
type EventHandler<K extends keyof EventMap> = (event: EventMap[K]) => void;

// イベントエミッタ
class EventEmitter {
  private handlers: {
    [K in keyof EventMap]?: EventHandler<K>[];
  } = {};

  on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event]!.push(handler);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const handlers = this.handlers[event];
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
}

// 使用例
const emitter = new EventEmitter();

emitter.on("click", ({ x, y }) => {
  console.log(`Clicked at (${x}, ${y})`);
});

emitter.on("keypress", ({ key }) => {
  console.log(`Key pressed: ${key}`);
});

emitter.emit("click", { x: 100, y: 200 });
emitter.emit("keypress", { key: "Enter" });
```

## まとめ

- **基本**: パラメータと戻り値に型を定義
- **オプショナル**: `?` でオプショナルパラメータ
- **デフォルト**: `= value` でデフォルト値
- **Rest**: `...args: Type[]` で可変長引数
- **関数型**: `type Fn = (arg: Type) => ReturnType`
- **オーバーロード**: 複数のシグネチャで柔軟な API
- **ジェネリック**: `<T>` で型パラメータ
- **this**: `this: Type` で this の型を指定
- **非同期**: `Promise<T>` で非同期関数の型

## 演習問題

1. **基本**: 2 つの数値を受け取り、その合計を返す関数を定義してください
2. **オプショナル**: ユーザー名と挨拶文（オプション）を受け取る関数を作成してください
3. **オーバーロード**: 文字列または数値配列を受け取り、結合または合計を返す関数を作成してください
4. **ジェネリック**: 配列の最初の要素を返すジェネリック関数を作成してください

## 次のステップ

次の章では、オブジェクトとインターフェースについて詳しく学びます。

⬅️ 前へ: [02-Basic-Types.md](./02-Basic-Types.md)
➡️ 次へ: [04-Objects-and-Interfaces.md](./04-Objects-and-Interfaces.md)
