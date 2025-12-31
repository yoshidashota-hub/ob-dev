# 12 - Modules and Namespaces

## 概要

TypeScript でのモジュールシステムと名前空間について学びます。コードの整理、再利用、依存関係の管理方法を理解します。

## 学習目標

- [ ] ES Modules の使い方を理解できる
- [ ] export と import のパターンを使いこなせる
- [ ] 名前空間の概念と使用方法を理解できる
- [ ] モジュール解決の仕組みを理解できる

## ES Modules

### エクスポート

```typescript
// 名前付きエクスポート
export const PI = 3.14159;

export function add(a: number, b: number): number {
  return a + b;
}

export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

export interface User {
  id: number;
  name: string;
}

export type Status = "pending" | "approved" | "rejected";
```

### 別名でエクスポート

```typescript
const internalName = "InternalValue";

function internalFunction() {
  return "Internal";
}

// 別名でエクスポート
export { internalName as publicName, internalFunction as publicFunction };
```

### デフォルトエクスポート

```typescript
// デフォルトエクスポート（1モジュールに1つのみ）
export default class User {
  constructor(public name: string) {}
}

// または
class User {
  constructor(public name: string) {}
}

export default User;
```

### 再エクスポート

```typescript
// 別のモジュールから再エクスポート
export { User } from "./user";
export { Product, type ProductType } from "./product";

// すべてを再エクスポート
export * from "./utils";

// 名前を変更して再エクスポート
export { User as UserModel } from "./user";

// デフォルトエクスポートを再エクスポート
export { default as User } from "./user";
```

## インポート

### 名前付きインポート

```typescript
// 名前付きインポート
import { User, Product } from "./models";

// 別名でインポート
import { User as UserModel } from "./models";

// 型のみインポート
import type { User, Product } from "./models";
import { type User, type Product } from "./models";
```

### デフォルトインポート

```typescript
// デフォルトインポート
import User from "./user";

// デフォルトと名前付きの組み合わせ
import User, { UserType, createUser } from "./user";
```

### 名前空間インポート

```typescript
// すべてを名前空間としてインポート
import * as Models from "./models";

const user: Models.User = { id: 1, name: "Alice" };
const product: Models.Product = { id: 1, name: "Widget" };
```

### 動的インポート

```typescript
// 動的インポート（コード分割に有効）
async function loadModule() {
  const { User } = await import("./user");
  return new User("Alice");
}

// 条件付きインポート
async function getModule(type: string) {
  if (type === "admin") {
    const { AdminModule } = await import("./admin");
    return AdminModule;
  } else {
    const { UserModule } = await import("./user");
    return UserModule;
  }
}
```

## 型のエクスポートとインポート

### type キーワード

```typescript
// 型のみのエクスポート
export type { User, Product };

// 型のみのインポート（実行時に削除される）
import type { User, Product } from "./models";

// 混在
import { createUser, type User, type UserConfig } from "./user";
```

### インターフェースのエクスポート

```typescript
// interfaces.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
}

// 型エイリアス
export type ID = string | number;
export type Status = "active" | "inactive";
```

## モジュール解決

### 相対パス

```typescript
// 同じディレクトリ
import { User } from "./user";

// 親ディレクトリ
import { Config } from "../config";

// サブディレクトリ
import { Utils } from "./utils/helpers";
```

### 非相対パス（モジュール）

```typescript
// node_modules から
import React from "react";
import { useState } from "react";

// パスエイリアス（tsconfig.json で設定）
import { User } from "@/models/user";
import { db } from "@lib/database";
```

### tsconfig.json でのパス設定

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@lib/*": ["src/lib/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

## バレルエクスポート

### index.ts パターン

```typescript
// models/user.ts
export interface User {
  id: number;
  name: string;
}

export function createUser(name: string): User {
  return { id: Date.now(), name };
}

// models/product.ts
export interface Product {
  id: number;
  name: string;
  price: number;
}

// models/index.ts（バレルファイル）
export * from "./user";
export * from "./product";
export * from "./order";

// 使用側
import { User, Product, Order, createUser } from "./models";
```

### 選択的なエクスポート

```typescript
// models/index.ts
export { User, createUser } from "./user";
export { Product } from "./product";
export type { Order, OrderStatus } from "./order";
// 内部的なものはエクスポートしない
```

## 名前空間

### 基本的な名前空間

```typescript
namespace Validation {
  export interface StringValidator {
    isValid(s: string): boolean;
  }

  export class EmailValidator implements StringValidator {
    isValid(s: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(s);
    }
  }

  export class PhoneValidator implements StringValidator {
    isValid(s: string): boolean {
      const phoneRegex = /^\d{10,}$/;
      return phoneRegex.test(s);
    }
  }
}

// 使用
const emailValidator = new Validation.EmailValidator();
console.log(emailValidator.isValid("test@example.com")); // true
```

### ネストした名前空間

```typescript
namespace App {
  export namespace Models {
    export interface User {
      id: number;
      name: string;
    }

    export interface Product {
      id: number;
      name: string;
    }
  }

  export namespace Services {
    export class UserService {
      getUser(id: number): Models.User {
        return { id, name: "User" };
      }
    }
  }
}

const user: App.Models.User = { id: 1, name: "Alice" };
const service = new App.Services.UserService();
```

### 名前空間のマージ

```typescript
// validation.ts
namespace Validation {
  export class EmailValidator {
    isValid(s: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }
  }
}

// validation-phone.ts
namespace Validation {
  export class PhoneValidator {
    isValid(s: string): boolean {
      return /^\d{10,}$/.test(s);
    }
  }
}

// 両方のクラスが Validation 名前空間で利用可能
const email = new Validation.EmailValidator();
const phone = new Validation.PhoneValidator();
```

## 名前空間 vs モジュール

### 名前空間を使う場面

```typescript
// グローバルスコープでの型定義
// 例: ブラウザAPI の拡張
declare namespace MyApp {
  interface Config {
    apiUrl: string;
    debug: boolean;
  }

  function initialize(config: Config): void;
}
```

### モジュールを使う場面（推奨）

```typescript
// 現代的なプロジェクトではモジュールを推奨
// models/user.ts
export interface User {
  id: number;
  name: string;
}

// services/user-service.ts
import { User } from "../models/user";

export class UserService {
  getUser(id: number): User {
    return { id, name: "User" };
  }
}
```

## 宣言のマージ

### インターフェースのマージ

```typescript
interface User {
  id: number;
  name: string;
}

interface User {
  email: string;
}

// マージされた結果
// interface User {
//   id: number;
//   name: string;
//   email: string;
// }

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
};
```

### 名前空間と関数のマージ

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

namespace greet {
  export const defaultName = "World";
  export function loud(name: string): string {
    return `HELLO, ${name.toUpperCase()}!`;
  }
}

console.log(greet("Alice")); // "Hello, Alice!"
console.log(greet.loud("Bob")); // "HELLO, BOB!"
console.log(greet.defaultName); // "World"
```

### 名前空間とクラスのマージ

```typescript
class Album {
  label: Album.AlbumLabel;

  constructor(label: Album.AlbumLabel) {
    this.label = label;
  }
}

namespace Album {
  export interface AlbumLabel {
    name: string;
    year: number;
  }
}

const album = new Album({ name: "Awesome Album", year: 2024 });
```

## 型定義ファイル

### .d.ts ファイル

```typescript
// types/custom.d.ts
declare module "my-library" {
  export interface Options {
    debug: boolean;
    timeout: number;
  }

  export function initialize(options: Options): void;
  export function process(data: string): Promise<string>;
}

// 使用
import { initialize, process } from "my-library";
```

### グローバル型の拡張

```typescript
// types/global.d.ts
declare global {
  interface Window {
    myApp: {
      version: string;
      config: Record<string, any>;
    };
  }

  interface Array<T> {
    first(): T | undefined;
    last(): T | undefined;
  }
}

export {}; // モジュールとして認識させる

// 使用
window.myApp.version;
[1, 2, 3].first();
```

## 実践例: プロジェクト構造

```plaintext
src/
├── index.ts              # エントリーポイント
├── models/
│   ├── index.ts          # バレルエクスポート
│   ├── user.ts
│   └── product.ts
├── services/
│   ├── index.ts
│   ├── user-service.ts
│   └── product-service.ts
├── utils/
│   ├── index.ts
│   ├── validation.ts
│   └── formatting.ts
├── types/
│   ├── index.ts
│   └── api.ts
└── config/
    ├── index.ts
    └── database.ts
```

```typescript
// models/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export function createUser(input: CreateUserInput): User {
  return {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date(),
  };
}

// models/index.ts
export * from "./user";
export * from "./product";

// services/user-service.ts
import { User, CreateUserInput, createUser } from "../models";

export class UserService {
  private users: Map<string, User> = new Map();

  create(input: CreateUserInput): User {
    const user = createUser(input);
    this.users.set(user.id, user);
    return user;
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findAll(): User[] {
    return Array.from(this.users.values());
  }
}

// services/index.ts
export { UserService } from "./user-service";
export { ProductService } from "./product-service";

// index.ts
import { UserService } from "./services";
import { User } from "./models";

const userService = new UserService();
const user = userService.create({ name: "Alice", email: "alice@example.com" });
console.log(user);
```

## まとめ

- **ES Modules**: `export`/`import` でモジュールを定義
- **名前付きエクスポート**: 複数の値をエクスポート
- **デフォルトエクスポート**: 1 つのメインエクスポート
- **type インポート**: 型のみをインポート（実行時に削除）
- **バレルファイル**: `index.ts` でまとめてエクスポート
- **名前空間**: グローバルスコープでの型整理（レガシー）
- **モジュール解決**: 相対パスと非相対パス
- **型定義ファイル**: `.d.ts` で型情報を提供

## 演習問題

1. **モジュール構造**: 複数のモデルをバレルファイルでエクスポートしてください
2. **型のインポート**: `type` キーワードを使って型のみをインポートしてください
3. **動的インポート**: 条件に応じてモジュールを動的にロードしてください
4. **パスエイリアス**: tsconfig.json でパスエイリアスを設定してください

## 次のステップ

次の章では、tsconfig.json の設定について詳しく学びます。

⬅️ 前へ: [11-Decorators.md](./11-Decorators.md)
➡️ 次へ: [13-Configuration.md](./13-Configuration.md)
