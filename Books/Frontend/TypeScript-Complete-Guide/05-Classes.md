# 05 - Classes

## 概要

TypeScript でのクラスとオブジェクト指向プログラミングについて学びます。アクセス修飾子、継承、抽象クラス、インターフェースの実装などを理解します。

## 学習目標

- [ ] クラスの基本的な定義方法を理解できる
- [ ] アクセス修飾子（public, private, protected）を使い分けられる
- [ ] 継承と抽象クラスを理解できる
- [ ] インターフェースの実装ができる

## クラスの基本

### クラスの定義

```typescript
class User {
  // プロパティ
  name: string;
  age: number;

  // コンストラクタ
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // メソッド
  greet(): string {
    return `Hello, I'm ${this.name}`;
  }
}

// インスタンス化
const user = new User("Alice", 25);
console.log(user.greet()); // "Hello, I'm Alice"
```

### 簡略化されたコンストラクタ

```typescript
class User {
  // パラメータプロパティ（自動的にプロパティとして定義）
  constructor(public name: string, public age: number) {}

  greet(): string {
    return `Hello, I'm ${this.name}`;
  }
}

const user = new User("Bob", 30);
console.log(user.name); // "Bob"
```

## アクセス修飾子

### public（デフォルト）

```typescript
class User {
  public name: string; // どこからでもアクセス可能

  constructor(name: string) {
    this.name = name;
  }

  public greet(): void {
    console.log(`Hello, ${this.name}`);
  }
}

const user = new User("Alice");
console.log(user.name); // ✅ OK
user.greet(); // ✅ OK
```

### private

```typescript
class User {
  private password: string; // クラス内のみアクセス可能

  constructor(public name: string, password: string) {
    this.password = password;
  }

  validatePassword(input: string): boolean {
    return this.password === input; // クラス内からはアクセス可能
  }
}

const user = new User("Alice", "secret123");
// console.log(user.password); // ❌ エラー: private
console.log(user.validatePassword("secret123")); // ✅ true
```

### protected

```typescript
class Animal {
  protected name: string; // このクラスとサブクラスからアクセス可能

  constructor(name: string) {
    this.name = name;
  }

  protected makeSound(): void {
    console.log(`${this.name} makes a sound`);
  }
}

class Dog extends Animal {
  bark(): void {
    console.log(`${this.name} barks`); // ✅ OK: protected にアクセス可能
    this.makeSound(); // ✅ OK
  }
}

const dog = new Dog("Buddy");
dog.bark(); // ✅ OK
// console.log(dog.name); // ❌ エラー: protected
```

### # を使った private

```typescript
class BankAccount {
  // JavaScript のプライベートフィールド
  #balance: number = 0;

  deposit(amount: number): void {
    this.#balance += amount;
  }

  getBalance(): number {
    return this.#balance;
  }
}

const account = new BankAccount();
account.deposit(100);
console.log(account.getBalance()); // 100
// console.log(account.#balance); // ❌ エラー
```

## readonly プロパティ

```typescript
class User {
  readonly id: number;
  name: string;

  constructor(id: number, name: string) {
    this.id = id; // コンストラクタでのみ設定可能
    this.name = name;
  }

  updateName(name: string): void {
    this.name = name; // ✅ OK
    // this.id = 2; // ❌ エラー: readonly
  }
}
```

## 静的メンバー

### static プロパティとメソッド

```typescript
class Counter {
  static count: number = 0;

  static increment(): void {
    Counter.count++;
  }

  static getCount(): number {
    return Counter.count;
  }
}

Counter.increment();
Counter.increment();
console.log(Counter.getCount()); // 2
```

### static ブロック

```typescript
class Config {
  static readonly API_URL: string;
  static readonly VERSION: string;

  static {
    // 静的初期化ブロック
    this.API_URL = process.env.API_URL || "http://localhost:3000";
    this.VERSION = "1.0.0";
  }
}

console.log(Config.API_URL);
console.log(Config.VERSION);
```

## ゲッターとセッター

```typescript
class User {
  private _age: number = 0;

  get age(): number {
    return this._age;
  }

  set age(value: number) {
    if (value < 0) {
      throw new Error("Age cannot be negative");
    }
    this._age = value;
  }

  constructor(public name: string, age: number) {
    this.age = age; // セッターを使用
  }
}

const user = new User("Alice", 25);
console.log(user.age); // 25（ゲッター）
user.age = 30; // セッター
// user.age = -5; // ❌ エラー
```

### 計算プロパティ

```typescript
class Rectangle {
  constructor(public width: number, public height: number) {}

  get area(): number {
    return this.width * this.height;
  }

  get perimeter(): number {
    return 2 * (this.width + this.height);
  }
}

const rect = new Rectangle(10, 5);
console.log(rect.area); // 50
console.log(rect.perimeter); // 30
```

## 継承

### extends による継承

```typescript
class Animal {
  constructor(public name: string) {}

  move(distance: number): void {
    console.log(`${this.name} moved ${distance}m`);
  }
}

class Dog extends Animal {
  constructor(name: string) {
    super(name); // 親クラスのコンストラクタを呼ぶ
  }

  bark(): void {
    console.log(`${this.name} barks`);
  }

  // メソッドのオーバーライド
  move(distance: number): void {
    console.log(`${this.name} runs`);
    super.move(distance); // 親のメソッドを呼ぶ
  }
}

const dog = new Dog("Buddy");
dog.bark(); // "Buddy barks"
dog.move(10); // "Buddy runs" + "Buddy moved 10m"
```

### override キーワード

```typescript
class Animal {
  move(): void {
    console.log("Moving...");
  }
}

class Bird extends Animal {
  override move(): void {
    console.log("Flying...");
  }

  // ❌ エラー: 親クラスに存在しないメソッドを override できない
  // override swim(): void {}
}
```

## 抽象クラス

### abstract クラスとメソッド

```typescript
abstract class Shape {
  abstract getArea(): number;
  abstract getPerimeter(): number;

  // 具象メソッド
  describe(): void {
    console.log(`Area: ${this.getArea()}, Perimeter: ${this.getPerimeter()}`);
  }
}

class Circle extends Shape {
  constructor(public radius: number) {
    super();
  }

  getArea(): number {
    return Math.PI * this.radius ** 2;
  }

  getPerimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class Rectangle extends Shape {
  constructor(public width: number, public height: number) {
    super();
  }

  getArea(): number {
    return this.width * this.height;
  }

  getPerimeter(): number {
    return 2 * (this.width + this.height);
  }
}

// const shape = new Shape(); // ❌ エラー: 抽象クラスはインスタンス化不可
const circle = new Circle(5);
circle.describe(); // "Area: 78.54, Perimeter: 31.42"
```

## インターフェースの実装

### implements

```typescript
interface Printable {
  print(): void;
}

interface Saveable {
  save(): Promise<void>;
}

class Document implements Printable, Saveable {
  constructor(public content: string) {}

  print(): void {
    console.log(this.content);
  }

  async save(): Promise<void> {
    // 保存処理
    console.log("Saved!");
  }
}

const doc = new Document("Hello, World!");
doc.print();
doc.save();
```

### インターフェースと抽象クラスの違い

```typescript
// インターフェース: 契約（何をするか）
interface Flyable {
  fly(): void;
}

// 抽象クラス: 部分的な実装を提供（どうやるか）
abstract class Bird {
  abstract makeSound(): void;

  fly(): void {
    console.log("Flapping wings...");
  }
}

class Sparrow extends Bird implements Flyable {
  makeSound(): void {
    console.log("Chirp!");
  }
}
```

## ジェネリッククラス

### 基本的なジェネリッククラス

```typescript
class Container<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  getAll(): T[] {
    return [...this.items];
  }
}

const numberContainer = new Container<number>();
numberContainer.add(1);
numberContainer.add(2);
console.log(numberContainer.getAll()); // [1, 2]

const stringContainer = new Container<string>();
stringContainer.add("hello");
stringContainer.add("world");
console.log(stringContainer.getAll()); // ["hello", "world"]
```

### 型制約付きジェネリック

```typescript
interface HasId {
  id: number;
}

class Repository<T extends HasId> {
  private items: Map<number, T> = new Map();

  add(item: T): void {
    this.items.set(item.id, item);
  }

  get(id: number): T | undefined {
    return this.items.get(id);
  }

  delete(id: number): boolean {
    return this.items.delete(id);
  }
}

interface User extends HasId {
  id: number;
  name: string;
}

const userRepo = new Repository<User>();
userRepo.add({ id: 1, name: "Alice" });
console.log(userRepo.get(1)); // { id: 1, name: "Alice" }
```

## ミックスイン

### ミックスインパターン

```typescript
// ミックスイン用の型
type Constructor<T = {}> = new (...args: any[]) => T;

// タイムスタンプ機能を追加
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
    updatedAt = new Date();

    touch(): void {
      this.updatedAt = new Date();
    }
  };
}

// アクティブ状態機能を追加
function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = true;

    activate(): void {
      this.isActive = true;
    }

    deactivate(): void {
      this.isActive = false;
    }
  };
}

// 基本クラス
class User {
  constructor(public name: string) {}
}

// ミックスインを適用
const TimestampedUser = Timestamped(User);
const ActiveTimestampedUser = Activatable(Timestamped(User));

const user = new ActiveTimestampedUser("Alice");
console.log(user.name); // "Alice"
console.log(user.createdAt); // Date
console.log(user.isActive); // true
user.deactivate();
console.log(user.isActive); // false
```

## 実践例: リポジトリパターン

```typescript
// エンティティのベースインターフェース
interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// リポジトリのインターフェース
interface Repository<T extends Entity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

// ユーザーエンティティ
interface User extends Entity {
  name: string;
  email: string;
}

// メモリ内リポジトリの実装
class InMemoryRepository<T extends Entity> implements Repository<T> {
  protected items: Map<string, T> = new Map();

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) || null;
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.items.values());
  }

  async save(entity: T): Promise<T> {
    const now = new Date();
    const savedEntity = {
      ...entity,
      updatedAt: now,
      createdAt: entity.createdAt || now,
    };
    this.items.set(entity.id, savedEntity);
    return savedEntity;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

// ユーザーリポジトリ
class UserRepository extends InMemoryRepository<User> {
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find((user) => user.email === email) || null;
  }
}

// 使用例
async function main() {
  const userRepo = new UserRepository();

  await userRepo.save({
    id: "1",
    name: "Alice",
    email: "alice@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const user = await userRepo.findByEmail("alice@example.com");
  console.log(user); // User オブジェクト
}
```

## 実践例: ビルダーパターン

```typescript
class UserBuilder {
  private user: Partial<User> = {};

  setId(id: string): this {
    this.user.id = id;
    return this;
  }

  setName(name: string): this {
    this.user.name = name;
    return this;
  }

  setEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  setAge(age: number): this {
    this.user.age = age;
    return this;
  }

  build(): User {
    if (!this.user.id || !this.user.name || !this.user.email) {
      throw new Error("id, name, email は必須です");
    }

    return {
      id: this.user.id,
      name: this.user.name,
      email: this.user.email,
      age: this.user.age,
    } as User;
  }
}

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
}

// 使用例
const user = new UserBuilder()
  .setId("1")
  .setName("Alice")
  .setEmail("alice@example.com")
  .setAge(25)
  .build();

console.log(user);
```

## まとめ

- **クラス**: `class` でクラスを定義
- **アクセス修飾子**: `public`, `private`, `protected`
- **readonly**: 変更不可のプロパティ
- **static**: クラスレベルのメンバー
- **ゲッター/セッター**: `get`/`set` でアクセサを定義
- **継承**: `extends` でクラスを継承
- **抽象クラス**: `abstract` で抽象クラス・メソッドを定義
- **インターフェース実装**: `implements` でインターフェースを実装
- **ジェネリック**: `class Container<T>` で型パラメータを使用

## 演習問題

1. **基本**: 書籍を表すクラス（タイトル、著者、ISBN）を作成してください
2. **アクセス修飾子**: 銀行口座クラス（残高は private）を作成してください
3. **継承**: 動物クラスを継承した犬・猫クラスを作成してください
4. **抽象クラス**: 図形の抽象クラスと具象クラスを作成してください

## 次のステップ

次の章では、ジェネリクスについて詳しく学びます。

⬅️ 前へ: [04-Objects-and-Interfaces.md](./04-Objects-and-Interfaces.md)
➡️ 次へ: [06-Generics.md](./06-Generics.md)
