# 10 - Utility Types

## 概要

TypeScript が提供する組み込みのユーティリティ型について学びます。これらを活用することで、より簡潔で表現力豊かな型定義が可能になります。

## 学習目標

- [ ] 主要なユーティリティ型を理解し使用できる
- [ ] ユーティリティ型の内部実装を理解できる
- [ ] カスタムユーティリティ型を作成できる
- [ ] 実践的な場面で適切に活用できる

## オブジェクト操作

### Partial&lt;T&gt;

すべてのプロパティをオプショナルにします。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// {
//   id?: number;
//   name?: string;
//   email?: string;
// }

// 更新関数での使用例
function updateUser(user: User, updates: Partial<User>): User {
  return { ...user, ...updates };
}

const user: User = { id: 1, name: "Alice", email: "alice@example.com" };
const updated = updateUser(user, { name: "Alicia" });
```

### Required&lt;T&gt;

すべてのプロパティを必須にします。

```typescript
interface Config {
  apiUrl?: string;
  timeout?: number;
  debug?: boolean;
}

type RequiredConfig = Required<Config>;
// {
//   apiUrl: string;
//   timeout: number;
//   debug: boolean;
// }

function initializeApp(config: RequiredConfig): void {
  // すべてのプロパティが必須
}
```

### Readonly&lt;T&gt;

すべてのプロパティを readonly にします。

```typescript
interface User {
  id: number;
  name: string;
}

type ReadonlyUser = Readonly<User>;

const user: ReadonlyUser = { id: 1, name: "Alice" };
// user.name = "Bob"; // ❌ エラー: readonly
```

### Record&lt;K, T&gt;

キーの型と値の型を指定してオブジェクト型を作成します。

```typescript
type Status = "pending" | "approved" | "rejected";

type StatusMessages = Record<Status, string>;

const messages: StatusMessages = {
  pending: "審査中です",
  approved: "承認されました",
  rejected: "却下されました",
};

// インデックスシグネチャとして
type StringMap = Record<string, number>;
const scores: StringMap = {
  math: 85,
  english: 92,
};
```

### Pick&lt;T, K&gt;

指定したプロパティのみを抽出します。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type PublicUser = Pick<User, "id" | "name" | "email">;
// {
//   id: number;
//   name: string;
//   email: string;
// }

function getPublicProfile(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
```

### Omit&lt;T, K&gt;

指定したプロパティを除外します。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type SafeUser = Omit<User, "password">;
// {
//   id: number;
//   name: string;
//   email: string;
// }

// 複数のプロパティを除外
type UserInput = Omit<User, "id" | "createdAt">;
```

## ユニオン操作

### Exclude&lt;T, U&gt;

ユニオン型から特定の型を除外します。

```typescript
type Status = "pending" | "approved" | "rejected" | "cancelled";

type ActiveStatus = Exclude<Status, "cancelled">;
// "pending" | "approved" | "rejected"

type PrimitiveExcludingString = Exclude<string | number | boolean, string>;
// number | boolean
```

### Extract&lt;T, U&gt;

ユニオン型から特定の型のみを抽出します。

```typescript
type Status = "pending" | "approved" | "rejected" | "cancelled";

type FinalStatus = Extract<Status, "approved" | "rejected">;
// "approved" | "rejected"

type StringOrNumber = Extract<
  string | number | boolean | object,
  string | number
>;
// string | number
```

### NonNullable&lt;T&gt;

null と undefined を除外します。

```typescript
type MaybeString = string | null | undefined;

type DefiniteString = NonNullable<MaybeString>;
// string

function processValue(value: NonNullable<string | null>): string {
  return value.toUpperCase(); // null チェック不要
}
```

## 関数操作

### Parameters&lt;T&gt;

関数のパラメータ型をタプルとして取得します。

```typescript
function greet(name: string, age: number): string {
  return `Hello, ${name}! You are ${age} years old.`;
}

type GreetParams = Parameters<typeof greet>;
// [string, number]

// スプレッド演算子と組み合わせ
function callGreet(...args: Parameters<typeof greet>): string {
  return greet(...args);
}
```

### ReturnType&lt;T&gt;

関数の戻り値の型を取得します。

```typescript
function createUser(name: string, email: string) {
  return {
    id: Math.random(),
    name,
    email,
    createdAt: new Date(),
  };
}

type User = ReturnType<typeof createUser>;
// {
//   id: number;
//   name: string;
//   email: string;
//   createdAt: Date;
// }
```

### ConstructorParameters&lt;T&gt;

クラスコンストラクタのパラメータ型を取得します。

```typescript
class User {
  constructor(public name: string, public age: number) {}
}

type UserConstructorParams = ConstructorParameters<typeof User>;
// [string, number]

function createUserFromParams(params: UserConstructorParams): User {
  return new User(...params);
}
```

### InstanceType&lt;T&gt;

クラスのインスタンス型を取得します。

```typescript
class User {
  constructor(public name: string) {}
}

type UserInstance = InstanceType<typeof User>;
// User

function createInstance<T extends new (...args: any[]) => any>(
  ctor: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  return new ctor(...args);
}

const user = createInstance(User, "Alice");
```

## 文字列操作

### Uppercase&lt;S&gt; / Lowercase&lt;S&gt;

```typescript
type Upper = Uppercase<"hello">; // "HELLO"
type Lower = Lowercase<"HELLO">; // "hello"

type Method = "get" | "post" | "put" | "delete";
type UpperMethod = Uppercase<Method>;
// "GET" | "POST" | "PUT" | "DELETE"
```

### Capitalize&lt;S&gt; / Uncapitalize&lt;S&gt;

```typescript
type Cap = Capitalize<"hello">; // "Hello"
type Uncap = Uncapitalize<"Hello">; // "hello"

// イベントハンドラ名の生成
type EventName = "click" | "submit" | "focus";
type HandlerName = `on${Capitalize<EventName>}`;
// "onClick" | "onSubmit" | "onFocus"
```

## Promise 操作

### Awaited&lt;T&gt;

Promise の解決された型を取得します。

```typescript
type PromiseString = Promise<string>;
type ResolvedString = Awaited<PromiseString>; // string

type NestedPromise = Promise<Promise<number>>;
type ResolvedNumber = Awaited<NestedPromise>; // number

async function fetchData(): Promise<{ name: string }> {
  return { name: "Alice" };
}

type Data = Awaited<ReturnType<typeof fetchData>>;
// { name: string }
```

## this 関連

### ThisParameterType&lt;T&gt;

関数の this パラメータの型を取得します。

```typescript
function greet(this: { name: string }) {
  return `Hello, ${this.name}`;
}

type GreetThis = ThisParameterType<typeof greet>;
// { name: string }
```

### OmitThisParameter&lt;T&gt;

関数から this パラメータを除外した型を取得します。

```typescript
function greet(this: { name: string }): string {
  return `Hello, ${this.name}`;
}

type GreetWithoutThis = OmitThisParameter<typeof greet>;
// () => string
```

### ThisType&lt;T&gt;

メソッド内の this の型を指定します。

```typescript
interface HelperContext {
  logError: (error: string) => void;
  logMessage: (message: string) => void;
}

type ObjectDescriptor<D, M> = {
  data?: D;
  methods?: M & ThisType<D & M>;
};

function makeObject<D, M>(desc: ObjectDescriptor<D, M>): D & M {
  const data: object = desc.data || {};
  const methods: object = desc.methods || {};
  return { ...data, ...methods } as D & M;
}

const obj = makeObject({
  data: { x: 0, y: 0 },
  methods: {
    moveBy(dx: number, dy: number) {
      this.x += dx; // this.x は number
      this.y += dy; // this.y は number
    },
  },
});
```

## 組み込み実装の理解

### Partial の実装

```typescript
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};
```

### Required の実装

```typescript
type MyRequired<T> = {
  [P in keyof T]-?: T[P];
};
```

### Readonly の実装

```typescript
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

### Pick の実装

```typescript
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

### Omit の実装

```typescript
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// または
type MyOmit2<T, K extends keyof any> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};
```

### Record の実装

```typescript
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};
```

## カスタムユーティリティ型

### DeepPartial

```typescript
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

interface Config {
  api: {
    url: string;
    timeout: number;
  };
  features: {
    enabled: boolean;
  };
}

type PartialConfig = DeepPartial<Config>;
// すべてのプロパティが再帰的にオプショナル
```

### DeepReadonly

```typescript
type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;
```

### Mutable

```typescript
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface ReadonlyUser {
  readonly id: number;
  readonly name: string;
}

type MutableUser = Mutable<ReadonlyUser>;
// {
//   id: number;
//   name: string;
// }
```

### OptionalKeys / RequiredKeys

```typescript
type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

type UserOptionalKeys = OptionalKeys<User>; // "email" | "phone"
type UserRequiredKeys = RequiredKeys<User>; // "id" | "name"
```

### FunctionKeys

```typescript
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

interface Component {
  name: string;
  render: () => void;
  onClick: (e: Event) => void;
}

type ComponentMethods = FunctionKeys<Component>;
// "render" | "onClick"
```

## 実践例

### API レスポンス型

```typescript
// 基本のレスポンス型
type ApiResponse<T> = {
  data: T;
  status: number;
  timestamp: Date;
};

// ページネーション付きレスポンス
type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

// エラーレスポンス
type ErrorResponse = {
  error: string;
  message: string;
  statusCode: number;
};

// 結果型
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: ErrorResponse };

// 使用例
async function fetchUser(id: number): Promise<Result<User>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return {
        success: false,
        error: {
          error: "NotFound",
          message: "User not found",
          statusCode: 404,
        },
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: {
        error: "NetworkError",
        message: "Failed to fetch",
        statusCode: 0,
      },
    };
  }
}
```

### フォーム状態管理

```typescript
type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
};

type FormActions<T> = {
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  setTouched: <K extends keyof T>(field: K) => void;
  reset: () => void;
  submit: () => Promise<void>;
};

interface LoginForm {
  email: string;
  password: string;
}

type LoginFormState = FormState<LoginForm>;
type LoginFormActions = FormActions<LoginForm>;
```

## まとめ

- **Partial/Required**: オプショナル/必須の切り替え
- **Readonly**: 読み取り専用に
- **Record**: キーと値の型でオブジェクト型を作成
- **Pick/Omit**: プロパティの選択/除外
- **Exclude/Extract**: ユニオン型のフィルタリング
- **Parameters/ReturnType**: 関数の型を取得
- **Awaited**: Promise の解決型を取得
- **文字列操作**: 大文字/小文字変換

## 演習問題

1. **Partial**: 更新関数で Partial を使用してください
2. **Pick/Omit**: API レスポンスから必要なプロパティのみ抽出してください
3. **ReturnType**: 関数の戻り値の型を再利用してください
4. **カスタム型**: DeepRequired 型を実装してください

## 次のステップ

次の章では、デコレータについて学びます。

⬅️ 前へ: [09-Type-Manipulation.md](./09-Type-Manipulation.md)
➡️ 次へ: [11-Decorators.md](./11-Decorators.md)
