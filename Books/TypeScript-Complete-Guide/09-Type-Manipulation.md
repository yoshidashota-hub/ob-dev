# 09 - Type Manipulation

## 概要

TypeScript での型操作の詳細について学びます。keyof、typeof、indexed access types など、型を操作するための様々な演算子と技法を理解します。

## 学習目標

- [ ] keyof 演算子を理解し活用できる
- [ ] typeof 型演算子を使いこなせる
- [ ] Indexed Access Types を理解できる
- [ ] 複雑な型変換を実装できる

## keyof 演算子

### 基本的な使い方

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// オブジェクト型のキーをユニオン型として取得
type UserKeys = keyof User;
// "id" | "name" | "email"

// 使用例
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user: User = { id: 1, name: "Alice", email: "alice@example.com" };
const name = getProperty(user, "name"); // string
const id = getProperty(user, "id"); // number
// getProperty(user, "password"); // ❌ エラー
```

### 数値・シンボルキー

```typescript
// 数値キー
type ArrayKeys = keyof number[];
// number | "length" | "push" | "pop" | ...

// インデックスシグネチャ
type StringMap = { [key: string]: number };
type StringMapKeys = keyof StringMap; // string | number

// シンボルキー
const sym = Symbol("sym");
interface WithSymbol {
  [sym]: string;
  name: string;
}
type WithSymbolKeys = keyof WithSymbol; // typeof sym | "name"
```

## typeof 型演算子

### 変数から型を取得

```typescript
const user = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
};

// 変数から型を推論
type UserType = typeof user;
// {
//   id: number;
//   name: string;
//   email: string;
// }

// 配列から型を取得
const colors = ["red", "green", "blue"] as const;
type Colors = typeof colors; // readonly ["red", "green", "blue"]
type Color = (typeof colors)[number]; // "red" | "green" | "blue"
```

### 関数から型を取得

```typescript
function createUser(name: string, age: number) {
  return { name, age, createdAt: new Date() };
}

// 関数の型
type CreateUserFn = typeof createUser;
// (name: string, age: number) => { name: string; age: number; createdAt: Date }

// 戻り値の型
type UserResult = ReturnType<typeof createUser>;
// { name: string; age: number; createdAt: Date }

// パラメータの型
type UserParams = Parameters<typeof createUser>;
// [string, number]
```

### as const との組み合わせ

```typescript
// 通常の配列
const numbers = [1, 2, 3];
type Numbers = typeof numbers; // number[]

// as const で readonly タプルに
const tuple = [1, 2, 3] as const;
type Tuple = typeof tuple; // readonly [1, 2, 3]

// オブジェクトでも有効
const config = {
  api: {
    url: "https://api.example.com",
    timeout: 5000,
  },
} as const;

type Config = typeof config;
// {
//   readonly api: {
//     readonly url: "https://api.example.com";
//     readonly timeout: 5000;
//   };
// }
```

## Indexed Access Types

### 基本的な使い方

```typescript
interface User {
  id: number;
  name: string;
  address: {
    city: string;
    country: string;
  };
}

// プロパティの型にアクセス
type UserId = User["id"]; // number
type UserName = User["name"]; // string
type UserAddress = User["address"]; // { city: string; country: string }

// ネストしたプロパティ
type City = User["address"]["city"]; // string
```

### ユニオン型でのアクセス

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// 複数のプロパティを取得
type IdOrName = User["id" | "name"];
// number | string

// keyof との組み合わせ
type AllValues = User[keyof User];
// number | string
```

### 配列要素の型

```typescript
// 配列型から要素型を取得
type StringArrayElement = string[][number]; // string

// タプル型から要素型を取得
type Point = [number, number, string];
type PointX = Point[0]; // number
type PointLabel = Point[2]; // string
type PointElement = Point[number]; // number | string
```

## Mapped Types の応用

### キーのフィルタリング

```typescript
// 特定の型のプロパティのみ抽出
type FilterKeys<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

interface Mixed {
  name: string;
  age: number;
  email: string;
  active: boolean;
}

type StringKeys = FilterKeys<Mixed, string>;
// "name" | "email"

type NumberKeys = FilterKeys<Mixed, number>;
// "age"
```

### 値の変換

```typescript
// すべてのプロパティを Promise でラップ
type Async<T> = {
  [K in keyof T]: Promise<T[K]>;
};

interface User {
  id: number;
  name: string;
}

type AsyncUser = Async<User>;
// {
//   id: Promise<number>;
//   name: Promise<string>;
// }

// ゲッター関数に変換
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// {
//   getId: () => number;
//   getName: () => string;
// }
```

### 条件付きマッピング

```typescript
// null 許容型に変換
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// 関数型のプロパティのみ抽出
type FunctionProps<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

interface Component {
  name: string;
  onClick: () => void;
  onHover: (x: number, y: number) => void;
}

type ComponentHandlers = FunctionProps<Component>;
// {
//   onClick: () => void;
//   onHover: (x: number, y: number) => void;
// }
```

## 型の分解と再構築

### パスによるアクセス

```typescript
// ドット区切りのパスで型にアクセス
type DeepGet<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? DeepGet<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

interface Config {
  api: {
    url: string;
    timeout: number;
  };
  db: {
    host: string;
    port: number;
  };
}

type ApiUrl = DeepGet<Config, "api.url">; // string
type DbPort = DeepGet<Config, "db.port">; // number
```

### フラット化

```typescript
// ネストしたオブジェクトをフラット化
type Flatten<T, Prefix extends string = ""> = {
  [K in keyof T as T[K] extends object
    ? never
    : Prefix extends ""
    ? K & string
    : `${Prefix}.${K & string}`]: T[K];
} & (T extends object
  ? {
      [K in keyof T as T[K] extends object ? K : never]: Flatten<
        T[K],
        Prefix extends "" ? K & string : `${Prefix}.${K & string}`
      >;
    }[keyof T & string]
  : never);

// 簡略化版
type FlattenObject<T, P extends string = ""> = T extends object
  ? {
      [K in keyof T]-?: T[K] extends object
        ? FlattenObject<T[K], P extends "" ? K & string : `${P}.${K & string}`>
        : { [Key in P extends "" ? K : `${P}.${K & string}`]: T[K] };
    }[keyof T]
  : never;
```

## 再帰的型操作

### 深いマージ

```typescript
type DeepMerge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? K extends keyof T
      ? T[K] extends object
        ? U[K] extends object
          ? DeepMerge<T[K], U[K]>
          : U[K]
        : U[K]
      : U[K]
    : K extends keyof T
    ? T[K]
    : never;
};

interface Base {
  api: {
    url: string;
    timeout: number;
  };
  debug: boolean;
}

interface Override {
  api: {
    timeout: number;
    retries: number;
  };
  version: string;
}

type Merged = DeepMerge<Base, Override>;
// {
//   api: {
//     url: string;
//     timeout: number;
//     retries: number;
//   };
//   debug: boolean;
//   version: string;
// }
```

### パスの抽出

```typescript
// オブジェクトのすべてのパスを取得
type Paths<T, P extends string = ""> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? Paths<T[K], P extends "" ? K : `${P}.${K}`>
          : P extends ""
          ? K
          : `${P}.${K}`
        : never;
    }[keyof T]
  : never;

interface Config {
  api: {
    url: string;
    port: number;
  };
  debug: boolean;
}

type ConfigPaths = Paths<Config>;
// "api.url" | "api.port" | "debug"
```

## 実践例: 型安全なオブジェクト操作

```typescript
// Pick の拡張版（ネストしたプロパティも指定可能）
type DeepPick<T, K extends string> = K extends `${infer First}.${infer Rest}`
  ? First extends keyof T
    ? { [P in First]: DeepPick<T[First], Rest> }
    : never
  : K extends keyof T
  ? { [P in K]: T[P] }
  : never;

interface User {
  id: number;
  profile: {
    name: string;
    email: string;
    address: {
      city: string;
      country: string;
    };
  };
}

type PickedUser = DeepPick<User, "profile.name" | "profile.address.city">;
// {
//   profile: {
//     name: string;
//     address: {
//       city: string;
//     };
//   };
// }
```

## 実践例: 型安全なイベントシステム

```typescript
// イベント名からハンドラ名を生成
type EventHandlerName<T extends string> = `on${Capitalize<T>}`;

// イベントハンドラの型を生成
type EventHandlers<Events extends Record<string, any>> = {
  [K in keyof Events as EventHandlerName<K & string>]?: (
    event: Events[K]
  ) => void;
};

interface Events {
  click: { x: number; y: number };
  keypress: { key: string };
  submit: { data: FormData };
}

type Handlers = EventHandlers<Events>;
// {
//   onClick?: (event: { x: number; y: number }) => void;
//   onKeypress?: (event: { key: string }) => void;
//   onSubmit?: (event: { data: FormData }) => void;
// }
```

## 実践例: フォームスキーマ

```typescript
// フォームフィールドの型から検証ルールを生成
type ValidationRules<T> = {
  [K in keyof T]?: T[K] extends string
    ? {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
      }
    : T[K] extends number
    ? { required?: boolean; min?: number; max?: number }
    : T[K] extends boolean
    ? { required?: boolean }
    : never;
};

interface LoginForm {
  username: string;
  password: string;
  rememberMe: boolean;
}

const loginValidation: ValidationRules<LoginForm> = {
  username: { required: true, minLength: 3, maxLength: 20 },
  password: { required: true, minLength: 8 },
  rememberMe: { required: false },
};

// フォームエラーの型
type FormErrors<T> = {
  [K in keyof T]?: string;
};

type LoginErrors = FormErrors<LoginForm>;
// {
//   username?: string;
//   password?: string;
//   rememberMe?: string;
// }
```

## まとめ

- **keyof**: オブジェクト型のキーをユニオン型として取得
- **typeof**: 変数から型を取得
- **Indexed Access**: `T[K]` でプロパティの型にアクセス
- **as const**: リテラル型を保持
- **Mapped Types**: プロパティを変換
- **再帰的型**: 深いネストを処理
- **条件付きマッピング**: 条件に基づいてプロパティを変換

## 演習問題

1. **keyof**: オブジェクトのすべてのプロパティ名を取得する型を作成してください
2. **typeof**: 既存の変数から型を推論して使用してください
3. **Indexed Access**: ネストしたプロパティの型を取得してください
4. **Mapped Types**: オブジェクトのすべてのプロパティを配列型に変換してください

## 次のステップ

次の章では、ユーティリティ型について詳しく学びます。

⬅️ 前へ: [08-Advanced-Types.md](./08-Advanced-Types.md)
➡️ 次へ: [10-Utility-Types.md](./10-Utility-Types.md)
