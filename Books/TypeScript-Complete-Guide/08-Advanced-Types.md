# 08 - Advanced Types

## 概要

TypeScript の高度な型機能について学びます。Conditional Types、Mapped Types、Template Literal Types などの強力な型システムを理解します。

## 学習目標

- [ ] Conditional Types を理解し使用できる
- [ ] Mapped Types でプロパティを変換できる
- [ ] Template Literal Types を活用できる
- [ ] 型レベルのプログラミングができる

## Conditional Types

### 基本的な構文

```typescript
// T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
type C = IsString<"hello">; // true
```

### 実用例

```typescript
// Null を除外
type NonNullable<T> = T extends null | undefined ? never : T;

type A = NonNullable<string | null>; // string
type B = NonNullable<number | undefined>; // number

// 配列の要素型を取得
type ElementType<T> = T extends (infer E)[] ? E : never;

type C = ElementType<string[]>; // string
type D = ElementType<number[]>; // number
```

### infer キーワード

```typescript
// 関数の戻り値の型を取得
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(): string {
  return "Hello";
}

type GreetReturn = ReturnType<typeof greet>; // string

// 関数のパラメータの型を取得
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

function add(a: number, b: number): number {
  return a + b;
}

type AddParams = Parameters<typeof add>; // [number, number]
```

### Distributive Conditional Types

```typescript
// ユニオン型の各要素に適用される
type ToArray<T> = T extends any ? T[] : never;

type A = ToArray<string | number>;
// string[] | number[]

// 分配を防ぐ
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type B = ToArrayNonDist<string | number>;
// (string | number)[]
```

## Mapped Types

### 基本的な Mapped Types

```typescript
// すべてのプロパティをオプショナルに
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// すべてのプロパティを必須に
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// すべてのプロパティを readonly に
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

interface User {
  name: string;
  age?: number;
}

type PartialUser = Partial<User>;
// { name?: string; age?: number; }

type RequiredUser = Required<User>;
// { name: string; age: number; }

type ReadonlyUser = Readonly<User>;
// { readonly name: string; readonly age?: number; }
```

### キーのリマッピング

```typescript
// プロパティ名を変換
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// {
//   getName: () => string;
//   getAge: () => number;
// }
```

### プロパティのフィルタリング

```typescript
// 特定の型のプロパティのみ抽出
type FilterByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

interface Mixed {
  name: string;
  age: number;
  active: boolean;
  email: string;
}

type StringProps = FilterByType<Mixed, string>;
// { name: string; email: string; }

type NumberProps = FilterByType<Mixed, number>;
// { age: number; }
```

### Record 型

```typescript
// キーと値の型を指定
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

type PageInfo = {
  title: string;
  url: string;
};

type Pages = Record<"home" | "about" | "contact", PageInfo>;

const pages: Pages = {
  home: { title: "Home", url: "/" },
  about: { title: "About", url: "/about" },
  contact: { title: "Contact", url: "/contact" },
};
```

## Template Literal Types

### 基本的な使い方

```typescript
type Greeting = `Hello, ${string}!`;

const greeting1: Greeting = "Hello, World!"; // ✅
const greeting2: Greeting = "Hello, TypeScript!"; // ✅
// const greeting3: Greeting = "Hi, World!"; // ❌ エラー
```

### ユニオン型との組み合わせ

```typescript
type Color = "red" | "green" | "blue";
type Size = "small" | "medium" | "large";

type ColorSize = `${Color}-${Size}`;
// "red-small" | "red-medium" | "red-large" |
// "green-small" | "green-medium" | "green-large" |
// "blue-small" | "blue-medium" | "blue-large"

const variant: ColorSize = "red-small"; // ✅
```

### 文字列操作型

```typescript
// 組み込みの文字列操作型
type Upper = Uppercase<"hello">; // "HELLO"
type Lower = Lowercase<"HELLO">; // "hello"
type Cap = Capitalize<"hello">; // "Hello"
type Uncap = Uncapitalize<"Hello">; // "hello"

// イベント名の変換
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<"click">; // "onClick"
type SubmitEvent = EventName<"submit">; // "onSubmit"
```

### 動的プロパティ名

```typescript
type PropEventSource<T> = {
  on<K extends string & keyof T>(
    eventName: `${K}Changed`,
    callback: (newValue: T[K]) => void
  ): void;
};

interface Person {
  name: string;
  age: number;
}

declare function makeWatchedObject<T>(obj: T): T & PropEventSource<T>;

const person = makeWatchedObject({
  name: "Alice",
  age: 25,
});

person.on("nameChanged", (newName) => {
  console.log(`Name changed to ${newName}`); // newName は string
});

person.on("ageChanged", (newAge) => {
  console.log(`Age changed to ${newAge}`); // newAge は number
});
```

## 型の抽出と除外

### Extract と Exclude

```typescript
// Extract: 条件に一致する型を抽出
type Extract<T, U> = T extends U ? T : never;

type A = Extract<"a" | "b" | "c", "a" | "c">; // "a" | "c"
type B = Extract<string | number | boolean, number>; // number

// Exclude: 条件に一致する型を除外
type Exclude<T, U> = T extends U ? never : T;

type C = Exclude<"a" | "b" | "c", "a">; // "b" | "c"
type D = Exclude<string | number | boolean, boolean>; // string | number
```

### Pick と Omit

```typescript
// Pick: 指定したプロパティのみ抽出
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit: 指定したプロパティを除外
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type PublicUser = Omit<User, "password">;
// { id: number; name: string; email: string; }

type Credentials = Pick<User, "email" | "password">;
// { email: string; password: string; }
```

## 再帰的な型

### 深いネストの処理

```typescript
// 深い Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

interface Config {
  api: {
    url: string;
    timeout: number;
  };
  features: {
    enabled: boolean;
  };
}

type ReadonlyConfig = DeepReadonly<Config>;
// すべてのプロパティが再帰的に readonly になる
```

### 深い Partial

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepPartial<T[P]>
    : T[P];
};

interface Settings {
  theme: {
    primary: string;
    secondary: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
  };
}

type PartialSettings = DeepPartial<Settings>;
// すべてのプロパティが再帰的にオプショナルになる

const settings: PartialSettings = {
  theme: {
    primary: "blue",
    // secondary は省略可能
  },
  // notifications は省略可能
};
```

## 型レベルプログラミング

### 型レベルの条件分岐

```typescript
type If<C extends boolean, T, F> = C extends true ? T : F;

type A = If<true, "yes", "no">; // "yes"
type B = If<false, "yes", "no">; // "no"
```

### 型レベルの等価性チェック

```typescript
type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

type A = Equals<string, string>; // true
type B = Equals<string, number>; // false
type C = Equals<{ a: 1 }, { a: 1 }>; // true
```

### タプルの操作

```typescript
// タプルの最初の要素
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;

type A = Head<[1, 2, 3]>; // 1
type B = Head<[string, number]>; // string

// タプルの残りの要素
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

type C = Tail<[1, 2, 3]>; // [2, 3]
type D = Tail<[string, number, boolean]>; // [number, boolean]

// タプルの長さ
type Length<T extends any[]> = T["length"];

type E = Length<[1, 2, 3]>; // 3
type F = Length<[]>; // 0
```

## 実践例: 型安全な API クライアント

```typescript
// API エンドポイントの定義
interface ApiEndpoints {
  "/users": {
    GET: { response: User[] };
    POST: { body: CreateUserInput; response: User };
  };
  "/users/:id": {
    GET: { response: User };
    PUT: { body: UpdateUserInput; response: User };
    DELETE: { response: void };
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUserInput {
  name: string;
  email: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
}

// 型安全なクライアント
type ApiClient = {
  [Path in keyof ApiEndpoints]: {
    [Method in keyof ApiEndpoints[Path]]: ApiEndpoints[Path][Method] extends {
      body: infer B;
      response: infer R;
    }
      ? (body: B) => Promise<R>
      : ApiEndpoints[Path][Method] extends { response: infer R }
      ? () => Promise<R>
      : never;
  };
};

// 使用例（実装は省略）
declare const api: ApiClient;

// 型安全な API 呼び出し
const users = await api["/users"].GET(); // User[]
const user = await api["/users"].POST({
  name: "Alice",
  email: "alice@example.com",
}); // User
```

## 実践例: 型安全なイベントシステム

```typescript
// イベントマップ
interface EventMap {
  userLogin: { userId: string; timestamp: Date };
  userLogout: { userId: string };
  pageView: { path: string; title: string };
  error: { message: string; code: number };
}

// 型安全なイベントエミッター
type TypedEventEmitter<Events extends Record<string, any>> = {
  on<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): void;
  off<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
};

// 実装
function createEventEmitter<
  Events extends Record<string, any>
>(): TypedEventEmitter<Events> {
  const handlers: Map<keyof Events, Set<Function>> = new Map();

  return {
    on(event, handler) {
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }
      handlers.get(event)!.add(handler);
    },
    off(event, handler) {
      handlers.get(event)?.delete(handler);
    },
    emit(event, data) {
      handlers.get(event)?.forEach((handler) => handler(data));
    },
  };
}

// 使用例
const emitter = createEventEmitter<EventMap>();

emitter.on("userLogin", ({ userId, timestamp }) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

emitter.emit("userLogin", {
  userId: "123",
  timestamp: new Date(),
});
```

## 実践例: Builder パターンの型

```typescript
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type Builder<T, Built extends Partial<T> = {}> = {
  [K in keyof T as K extends keyof Built
    ? never
    : `set${Capitalize<string & K>}`]: (
    value: T[K]
  ) => Builder<T, Built & Pick<T, K>>;
} & (keyof Omit<T, keyof Built> extends never
  ? { build: () => Prettify<Built> }
  : {});

interface UserConfig {
  name: string;
  email: string;
  age: number;
}

// 型安全なビルダー（全プロパティが設定されるまで build が使えない）
declare function createBuilder<T>(): Builder<T>;

const builder = createBuilder<UserConfig>();

// すべてのプロパティを設定
const config = builder
  .setName("Alice")
  .setEmail("alice@example.com")
  .setAge(25)
  .build(); // ✅ build が使える

// 一部のプロパティだけでは build が使えない
// builder.setName("Alice").build(); // ❌ エラー
```

## まとめ

- **Conditional Types**: `T extends U ? X : Y` で条件分岐
- **infer**: 型を抽出
- **Mapped Types**: `{ [P in K]: T }` でプロパティを変換
- **Template Literal Types**: `` `prefix${T}suffix` `` で文字列型を操作
- **Extract/Exclude**: 型のフィルタリング
- **Pick/Omit**: プロパティの選択と除外
- **再帰的な型**: 深いネストを処理
- **型レベルプログラミング**: 型で計算を表現

## 演習問題

1. **Conditional Types**: 配列型から要素型を抽出する型を作成してください
2. **Mapped Types**: すべてのプロパティを関数にラップする型を作成してください
3. **Template Literal Types**: HTTP メソッドとパスを組み合わせたルート型を作成してください
4. **再帰的な型**: ネストしたオブジェクトのすべてのキーを取得する型を作成してください

## 次のステップ

次の章では、型操作のさらなる詳細について学びます。

⬅️ 前へ: [07-Type-Aliases-and-Union-Types.md](./07-Type-Aliases-and-Union-Types.md)
➡️ 次へ: [09-Type-Manipulation.md](./09-Type-Manipulation.md)
