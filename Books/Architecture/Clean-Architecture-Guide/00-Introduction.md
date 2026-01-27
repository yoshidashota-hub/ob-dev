# 第0章: はじめに

## Clean Architecture の概要

Clean Architecture は、ソフトウェアの保守性・テスト容易性・柔軟性を高めるためのアーキテクチャパターンです。

## 同心円モデル

```
┌─────────────────────────────────────────────────────┐
│                    Frameworks & Drivers              │
│   ┌─────────────────────────────────────────────┐   │
│   │            Interface Adapters                │   │
│   │   ┌─────────────────────────────────────┐   │   │
│   │   │          Application Business Rules  │   │   │
│   │   │   ┌─────────────────────────────┐   │   │   │
│   │   │   │    Enterprise Business Rules │   │   │   │
│   │   │   │         (Entities)           │   │   │   │
│   │   │   └─────────────────────────────┘   │   │   │
│   │   │          (Use Cases)                 │   │   │
│   │   └─────────────────────────────────────┘   │   │
│   │      (Controllers, Presenters, Gateways)    │   │
│   └─────────────────────────────────────────────┘   │
│        (Web, UI, DB, External Interfaces)           │
└─────────────────────────────────────────────────────┘
```

## 依存関係のルール

**「外側の層は内側の層に依存してよいが、内側は外側を知らない」**

```typescript
// ❌ 悪い例: Entity が Repository を直接使う
class User {
  async save() {
    await prisma.user.create({ data: this })  // DBに依存
  }
}

// ✅ 良い例: Use Case が Repository インターフェースに依存
interface UserRepository {
  save(user: User): Promise<void>
}

class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}
  
  async execute(input: CreateUserInput): Promise<User> {
    const user = new User(input.name, input.email)
    await this.userRepository.save(user)
    return user
  }
}
```

## 各層の責務

### 1. Entities（エンティティ）

ビジネスルールをカプセル化したドメインオブジェクト。

```typescript
// domain/entities/User.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public name: string
  ) {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email')
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  changeName(newName: string): void {
    if (newName.length < 1) throw new Error('Name required')
    this.name = newName
  }
}
```

### 2. Use Cases（ユースケース）

アプリケーション固有のビジネスルール。

```typescript
// application/use-cases/CreateUser.ts
export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const existingUser = await this.userRepository.findByEmail(input.email)
    if (existingUser) throw new UserAlreadyExistsError()

    const hashedPassword = await this.hashService.hash(input.password)
    const user = new User(generateId(), input.email, input.name)
    
    await this.userRepository.save(user, hashedPassword)
    
    return { id: user.id, email: user.email, name: user.name }
  }
}
```

### 3. Interface Adapters（インターフェースアダプター）

データの変換と外部とのインターフェース。

```typescript
// adapters/controllers/UserController.ts
export class UserController {
  constructor(private createUser: CreateUserUseCase) {}

  async create(req: Request): Promise<Response> {
    const input = await req.json()
    const result = await this.createUser.execute(input)
    return Response.json(result, { status: 201 })
  }
}
```

### 4. Frameworks & Drivers

フレームワーク、DB、外部サービスとの連携。

```typescript
// infrastructure/repositories/PrismaUserRepository.ts
export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ where: { email } })
    return data ? new User(data.id, data.email, data.name) : null
  }

  async save(user: User, hashedPassword: string): Promise<void> {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: hashedPassword
      }
    })
  }
}
```

## なぜ Clean Architecture か

### メリット

1. **テスト容易性**: ビジネスロジックを独立してテスト
2. **フレームワーク非依存**: 技術の変更が容易
3. **保守性**: 変更の影響範囲を限定
4. **理解しやすさ**: 明確な責務分離

### トレードオフ

1. **コード量増加**: ボイラープレートが増える
2. **学習コスト**: パターンの理解が必要
3. **小規模には過剰**: シンプルなアプリには向かない

## 次のステップ

次章では、各レイヤーの詳細な責務と実装パターンを学びます。
