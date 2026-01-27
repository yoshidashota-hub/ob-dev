# 第9章: ベストプラクティス

## プロジェクト構成

### 推奨ディレクトリ構造

```
src/
├── domain/                  # ドメイン層（最内層）
│   ├── entities/            # エンティティ
│   │   ├── User.ts
│   │   └── Order.ts
│   ├── value-objects/       # 値オブジェクト
│   │   ├── Email.ts
│   │   ├── Money.ts
│   │   └── UserId.ts
│   ├── events/              # ドメインイベント
│   │   └── UserCreatedEvent.ts
│   ├── services/            # ドメインサービス
│   │   └── TransferService.ts
│   └── errors/              # ドメインエラー
│       └── DomainError.ts
│
├── application/             # アプリケーション層
│   ├── use-cases/           # ユースケース
│   │   ├── CreateUser.ts
│   │   └── GetUser.ts
│   ├── ports/               # ポート（インターフェース）
│   │   ├── input/           # 入力ポート
│   │   │   └── CreateUserPort.ts
│   │   └── output/          # 出力ポート
│   │       ├── UserRepository.ts
│   │       └── PasswordHasher.ts
│   └── errors/              # アプリケーションエラー
│       └── ApplicationError.ts
│
├── adapters/                # インターフェースアダプター層
│   ├── controllers/         # コントローラー
│   │   └── UserController.ts
│   ├── presenters/          # プレゼンター
│   │   └── UserPresenter.ts
│   ├── gateways/            # ゲートウェイ（リポジトリ実装）
│   │   └── PrismaUserRepository.ts
│   └── mappers/             # マッパー
│       └── UserMapper.ts
│
├── infrastructure/          # フレームワーク・ドライバー層
│   ├── database/            # データベース
│   │   ├── prisma.ts
│   │   └── migrations/
│   ├── web/                 # Web フレームワーク
│   │   └── routes.ts
│   ├── cache/               # キャッシュ
│   │   └── RedisCache.ts
│   ├── messaging/           # メッセージング
│   │   └── EventPublisher.ts
│   ├── security/            # セキュリティ
│   │   └── BcryptPasswordHasher.ts
│   └── container.ts         # DI コンテナ
│
└── shared/                  # 共有ユーティリティ
    ├── types/               # 型定義
    └── utils/               # ユーティリティ
```

## DO: 推奨事項

### 1. 依存性のルールを厳守

```typescript
// ✅ 内側から外側への依存は禁止
// domain/ → application/ への依存はNG
// application/ → adapters/ への依存はNG

// ✅ インターフェースを通じて依存性を逆転
// application/ports/output/UserRepository.ts
export interface UserRepository {
  save(user: User): Promise<void>;
}

// adapters/gateways/PrismaUserRepository.ts
export class PrismaUserRepository implements UserRepository {
  // 実装
}
```

### 2. エンティティを純粋に保つ

```typescript
// ✅ フレームワーク非依存
export class User {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    private _name: string,
  ) {}

  changeName(name: string): void {
    if (name.length < 1) throw new InvalidNameError(name);
    this._name = name;
  }
}

// ❌ フレームワーク依存
import { Entity, Column } from "typeorm";

@Entity()
export class User {
  @Column()
  name: string;
}
```

### 3. ユースケースは単一責任

```typescript
// ✅ 1つのユースケースは1つのことだけ
export class CreateUserUseCase { /* ... */ }
export class UpdateUserUseCase { /* ... */ }
export class DeleteUserUseCase { /* ... */ }

// ❌ 複数の責任
export class UserUseCase {
  create() { /* ... */ }
  update() { /* ... */ }
  delete() { /* ... */ }
}
```

### 4. 値オブジェクトを積極的に使用

```typescript
// ✅ 値オブジェクトでバリデーションを集約
const email = Email.create("test@example.com");
const money = Money.create(1000, Currency.JPY);

// ❌ プリミティブ型を直接使用
function createUser(email: string) {
  if (!email.includes("@")) throw new Error("Invalid email");
  // ...
}
```

### 5. エラーは具体的に

```typescript
// ✅ 具体的なエラークラス
export class UserNotFoundError extends ApplicationError {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
  }
}

export class UserAlreadyExistsError extends ApplicationError {
  constructor(email: string) {
    super(`User already exists: ${email}`);
  }
}

// ❌ 汎用的なエラー
throw new Error("User error");
```

## DON'T: アンチパターン

### 1. 層を飛び越えない

```typescript
// ❌ コントローラーから直接リポジトリを呼ぶ
export class UserController {
  constructor(private userRepository: UserRepository) {}

  async create(req: Request) {
    const user = await this.userRepository.save(/*...*/);
  }
}

// ✅ ユースケースを経由
export class UserController {
  constructor(private createUser: CreateUserUseCase) {}

  async create(req: Request) {
    const result = await this.createUser.execute(/*...*/);
  }
}
```

### 2. ドメインロジックを外に漏らさない

```typescript
// ❌ コントローラーにドメインロジック
export class UserController {
  async updateUser(req: Request) {
    const user = await this.userRepository.findById(req.params.id);
    if (user.status === "inactive") {
      throw new Error("Cannot update inactive user");
    }
    // ...
  }
}

// ✅ ドメインにロジックを置く
export class User {
  update(data: UpdateData): void {
    if (!this.isActive) {
      throw new InactiveUserCannotBeUpdatedError();
    }
    // ...
  }
}
```

### 3. 過度な抽象化を避ける

```typescript
// ❌ 不要な抽象化
interface IUserServiceInterface {
  createUser(data: ICreateUserData): Promise<IUser>;
}

class UserServiceImplementation implements IUserServiceInterface {
  // ...
}

// ✅ シンプルに
export class CreateUserUseCase {
  async execute(input: CreateUserInput): Promise<UserOutput> {
    // ...
  }
}
```

### 4. 循環参照を避ける

```typescript
// ❌ 循環参照
// User.ts
import { Order } from "./Order";
export class User {
  orders: Order[];
}

// Order.ts
import { User } from "./User";
export class Order {
  user: User;
}

// ✅ ID参照を使用
export class Order {
  customerId: CustomerId;
}
```

## テスタビリティ

### 依存関係を注入可能に

```typescript
// ✅ テスタブル
export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
  ) {}
}

// テストでモックを注入
const useCase = new CreateUserUseCase(
  mockUserRepository,
  mockPasswordHasher,
);
```

### 時間を抽象化

```typescript
// ✅ 時間を注入可能に
export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class User {
  static create(props: CreateUserProps, clock: Clock): User {
    return new User(
      props.id,
      props.email,
      clock.now(),
    );
  }
}

// テスト
const fixedClock = { now: () => new Date("2024-01-01") };
const user = User.create(props, fixedClock);
```

## パフォーマンス考慮

### 遅延読み込み

```typescript
// 必要な時だけ関連データを取得
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByIdWithOrders(id: UserId): Promise<UserWithOrders | null>;
}
```

### クエリの最適化

```typescript
// 読み取り専用モデル（CQRS）
export interface UserReadRepository {
  findForList(pagination: Pagination): Promise<UserListItem[]>;
  findForDetail(id: string): Promise<UserDetail | null>;
}
```

## まとめ

### 重要なポイント

1. **依存性は内側に向かう**
2. **ビジネスルールをドメイン層に集約**
3. **インターフェースで疎結合を実現**
4. **各層の責任を明確に**
5. **テスタビリティを常に意識**

### 参考資料

- [Clean Architecture（書籍）](https://www.amazon.co.jp/dp/4048930656)
- [Domain-Driven Design（書籍）](https://www.amazon.co.jp/dp/4798126438)
- [Implementing Domain-Driven Design（書籍）](https://www.amazon.co.jp/dp/479813161X)
