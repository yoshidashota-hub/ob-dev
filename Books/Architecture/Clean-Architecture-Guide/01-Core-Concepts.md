# 第1章: 核心概念

## Clean Architecture とは

Robert C. Martin（Uncle Bob）が提唱したソフトウェアアーキテクチャ。

```
┌─────────────────────────────────────────────────────┐
│                 Clean Architecture                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │            Frameworks & Drivers              │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │        Interface Adapters            │   │   │
│  │  │  ┌─────────────────────────────┐   │   │   │
│  │  │  │        Use Cases            │   │   │   │
│  │  │  │  ┌─────────────────────┐   │   │   │   │
│  │  │  │  │     Entities        │   │   │   │   │
│  │  │  │  │  (Business Rules)   │   │   │   │   │
│  │  │  │  └─────────────────────┘   │   │   │   │
│  │  │  └─────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│              依存は内側に向かう ←←←                  │
└─────────────────────────────────────────────────────┘
```

## 依存性のルール

**依存は常に内側に向かう**

- 外側の円は内側の円に依存できる
- 内側の円は外側の円を知らない
- ビジネスルールは技術的詳細に依存しない

```typescript
// ❌ 悪い例: エンティティがフレームワークに依存
import { Entity, Column } from "typeorm";

@Entity()
class User {
  @Column()
  name: string;
}

// ✅ 良い例: 純粋なエンティティ
class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
  ) {}

  changeName(newName: string): User {
    return new User(this.id, newName, this.email);
  }
}
```

## 4つの層

### 1. Entities（エンティティ）

最も内側。ビジネスルールをカプセル化。

```typescript
// domain/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    private readonly passwordHash: string,
  ) {}

  verifyPassword(password: string): boolean {
    // ビジネスルール
    return hashPassword(password) === this.passwordHash;
  }
}
```

### 2. Use Cases（ユースケース）

アプリケーション固有のビジネスルール。

```typescript
// application/use-cases/CreateUser.ts
export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(input.email);
    }

    const user = new User(
      generateId(),
      input.email,
      input.name,
      hashPassword(input.password),
    );

    return await this.userRepository.save(user);
  }
}
```

### 3. Interface Adapters（インターフェースアダプター）

外部と内部の変換。コントローラー、プレゼンター、ゲートウェイ。

```typescript
// adapters/controllers/UserController.ts
export class UserController {
  constructor(private createUser: CreateUserUseCase) {}

  async create(req: Request): Promise<Response> {
    // 外部形式 → 内部形式
    const input: CreateUserInput = {
      email: req.body.email,
      name: req.body.name,
      password: req.body.password,
    };

    const user = await this.createUser.execute(input);

    // 内部形式 → 外部形式
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
```

### 4. Frameworks & Drivers（フレームワーク・ドライバー）

最も外側。DB、Web フレームワーク、UI。

```typescript
// infrastructure/repositories/PrismaUserRepository.ts
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!record) return null;

    return new User(record.id, record.email, record.name, record.passwordHash);
  }

  async save(user: User): Promise<User> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
      },
    });
    return user;
  }
}
```

## SOLID 原則

### Single Responsibility（単一責任）

```typescript
// ❌ 複数の責任
class User {
  save() { /* DB保存 */ }
  sendEmail() { /* メール送信 */ }
  validate() { /* バリデーション */ }
}

// ✅ 単一の責任
class User { /* ビジネスロジックのみ */ }
class UserRepository { /* 永続化 */ }
class EmailService { /* メール送信 */ }
```

### Open/Closed（開放閉鎖）

```typescript
// 拡張に開かれ、修正に閉じている
interface PaymentMethod {
  pay(amount: number): Promise<void>;
}

class CreditCardPayment implements PaymentMethod { /* ... */ }
class BankTransferPayment implements PaymentMethod { /* ... */ }
// 新しい支払い方法を追加しても既存コードは変更不要
```

### Liskov Substitution（リスコフの置換）

```typescript
// 親クラスを子クラスで置き換え可能
class Bird {
  fly(): void { /* ... */ }
}

// ❌ ペンギンは飛べない
class Penguin extends Bird {
  fly(): void { throw new Error("Can't fly"); }
}

// ✅ インターフェースで分離
interface Flyable { fly(): void; }
interface Swimmable { swim(): void; }
```

### Interface Segregation（インターフェース分離）

```typescript
// ❌ 大きすぎるインターフェース
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

// ✅ 分離されたインターフェース
interface Workable { work(): void; }
interface Eatable { eat(): void; }
interface Sleepable { sleep(): void; }
```

### Dependency Inversion（依存性逆転）

```typescript
// ❌ 具体に依存
class UserService {
  private repository = new MySQLUserRepository();
}

// ✅ 抽象に依存
class UserService {
  constructor(private repository: UserRepository) {}
}
```

## 境界を越える

```
┌─────────────────────────────────────────────────────┐
│            Crossing Boundaries                       │
│                                                     │
│  Controller ──▶ Use Case ──▶ Entity                 │
│      │              │                               │
│      │              ▼                               │
│      │         Repository                           │
│      │           (Interface)                        │
│      │              ▲                               │
│      │              │                               │
│      └─────▶ RepositoryImpl                         │
│               (Concrete)                            │
└─────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、エンティティについて詳しく学びます。
