# 第6章: 依存性注入

## 依存性注入とは

依存関係を外部から注入し、疎結合を実現する手法。

```
┌─────────────────────────────────────────────────────┐
│            Dependency Injection                      │
│                                                     │
│  Without DI:                                        │
│  ┌─────────────┐                                    │
│  │  UseCase    │───creates───▶ Repository          │
│  └─────────────┘              (concrete)           │
│                                                     │
│  With DI:                                           │
│  ┌─────────────┐              ┌─────────────┐      │
│  │  UseCase    │───depends───▶│ Repository  │      │
│  └─────────────┘    on        │ (interface) │      │
│        ▲                      └──────▲──────┘      │
│        │                             │              │
│        │         ┌───────────────────┘              │
│        │         │                                  │
│  ┌─────┴─────────┴─────┐                           │
│  │     DI Container     │                           │
│  │  - UseCase           │                           │
│  │  - RepositoryImpl    │                           │
│  └──────────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

## 手動 DI

### コンストラクタインジェクション

```typescript
// application/use-cases/CreateUser.ts
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    // 注入された依存関係を使用
    const hashedPassword = await this.passwordHasher.hash(input.password);
    // ...
  }
}
```

### ファクトリー関数

```typescript
// infrastructure/factories/createUserUseCase.ts
import { prisma } from "@/infrastructure/database/prisma";
import { CreateUserUseCase } from "@/application/use-cases/CreateUser";
import { PrismaUserRepository } from "@/adapters/gateways/PrismaUserRepository";
import { BcryptPasswordHasher } from "@/infrastructure/security/BcryptPasswordHasher";
import { EventPublisher } from "@/infrastructure/messaging/EventPublisher";

export function createUserUseCase(): CreateUserUseCase {
  const userRepository = new PrismaUserRepository(prisma);
  const passwordHasher = new BcryptPasswordHasher();
  const eventPublisher = new EventPublisher();

  return new CreateUserUseCase(userRepository, passwordHasher, eventPublisher);
}
```

### コンポジションルート

```typescript
// infrastructure/composition-root.ts
import { prisma } from "./database/prisma";
import { PrismaUserRepository } from "@/adapters/gateways/PrismaUserRepository";
import { BcryptPasswordHasher } from "./security/BcryptPasswordHasher";
import { InMemoryEventPublisher } from "./messaging/EventPublisher";
import { CreateUserUseCase } from "@/application/use-cases/CreateUser";
import { GetUserUseCase } from "@/application/use-cases/GetUser";
import { UserController } from "@/adapters/controllers/UserController";

// リポジトリ
const userRepository = new PrismaUserRepository(prisma);

// サービス
const passwordHasher = new BcryptPasswordHasher();
const eventPublisher = new InMemoryEventPublisher();

// ユースケース
const createUserUseCase = new CreateUserUseCase(
  userRepository,
  passwordHasher,
  eventPublisher,
);
const getUserUseCase = new GetUserUseCase(userRepository);

// コントローラー
export const userController = new UserController(
  createUserUseCase,
  getUserUseCase,
);
```

## DI コンテナ（TSyringe）

### セットアップ

```bash
npm install tsyringe reflect-metadata
```

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### コンテナの設定

```typescript
// infrastructure/container.ts
import "reflect-metadata";
import { container } from "tsyringe";
import { prisma } from "./database/prisma";
import { PrismaUserRepository } from "@/adapters/gateways/PrismaUserRepository";
import { BcryptPasswordHasher } from "./security/BcryptPasswordHasher";
import { InMemoryEventPublisher } from "./messaging/EventPublisher";

// Prisma Client
container.register("PrismaClient", { useValue: prisma });

// リポジトリ
container.register("UserRepository", {
  useClass: PrismaUserRepository,
});

// サービス
container.register("PasswordHasher", {
  useClass: BcryptPasswordHasher,
});

container.register("EventPublisher", {
  useClass: InMemoryEventPublisher,
});

export { container };
```

### デコレーターによる注入

```typescript
// application/use-cases/CreateUser.ts
import { injectable, inject } from "tsyringe";

@injectable()
export class CreateUserUseCase {
  constructor(
    @inject("UserRepository") private userRepository: UserRepository,
    @inject("PasswordHasher") private passwordHasher: PasswordHasher,
    @inject("EventPublisher") private eventPublisher: EventPublisher,
  ) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    // ...
  }
}
```

### 使用

```typescript
// API ルート
import { container } from "@/infrastructure/container";
import { CreateUserUseCase } from "@/application/use-cases/CreateUser";

export async function POST(request: Request) {
  const useCase = container.resolve(CreateUserUseCase);
  const body = await request.json();
  return await useCase.execute(body);
}
```

## スコープ

### シングルトン

```typescript
import { singleton } from "tsyringe";

@singleton()
export class CacheService {
  private cache = new Map<string, any>();

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: any) {
    this.cache.set(key, value);
  }
}
```

### リクエストスコープ

```typescript
// infrastructure/container.ts
import { container, Lifecycle } from "tsyringe";

// リクエストごとに新しいインスタンス
container.register("RequestContext", {
  useClass: RequestContext,
}, { lifecycle: Lifecycle.ContainerScoped });

// 子コンテナでリクエストスコープを実現
export function createRequestContainer() {
  return container.createChildContainer();
}
```

## インターフェースとトークン

### シンボルトークン

```typescript
// infrastructure/tokens.ts
export const TOKENS = {
  UserRepository: Symbol.for("UserRepository"),
  PasswordHasher: Symbol.for("PasswordHasher"),
  EventPublisher: Symbol.for("EventPublisher"),
  CacheService: Symbol.for("CacheService"),
} as const;
```

```typescript
// infrastructure/container.ts
import { TOKENS } from "./tokens";

container.register(TOKENS.UserRepository, {
  useClass: PrismaUserRepository,
});

container.register(TOKENS.PasswordHasher, {
  useClass: BcryptPasswordHasher,
});
```

```typescript
// application/use-cases/CreateUser.ts
import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/infrastructure/tokens";

@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: UserRepository,
    @inject(TOKENS.PasswordHasher) private passwordHasher: PasswordHasher,
  ) {}
}
```

## テストでのモック注入

```typescript
// __tests__/use-cases/CreateUser.test.ts
import "reflect-metadata";
import { container } from "tsyringe";
import { CreateUserUseCase } from "@/application/use-cases/CreateUser";
import { TOKENS } from "@/infrastructure/tokens";

describe("CreateUserUseCase", () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPasswordHasher: jest.Mocked<PasswordHasher>;

  beforeEach(() => {
    // モックを作成
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
    };

    mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    // コンテナにモックを登録
    container.register(TOKENS.UserRepository, { useValue: mockUserRepository });
    container.register(TOKENS.PasswordHasher, { useValue: mockPasswordHasher });
    container.register(TOKENS.EventPublisher, { useValue: { publish: jest.fn() } });

    useCase = container.resolve(CreateUserUseCase);
  });

  afterEach(() => {
    container.clearInstances();
  });

  it("should create a user", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockPasswordHasher.hash.mockResolvedValue("hashed_password");
    mockUserRepository.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    });

    expect(result.email).toBe("test@example.com");
    expect(mockUserRepository.save).toHaveBeenCalled();
  });
});
```

## 環境ごとの設定

```typescript
// infrastructure/container.ts
import { container } from "tsyringe";

function registerDependencies() {
  if (process.env.NODE_ENV === "production") {
    // 本番環境
    container.register("CacheService", { useClass: RedisCache });
    container.register("EmailService", { useClass: SendGridEmailService });
  } else {
    // 開発・テスト環境
    container.register("CacheService", { useClass: InMemoryCache });
    container.register("EmailService", { useClass: MockEmailService });
  }
}

registerDependencies();
export { container };
```

## 次のステップ

次章では、テスト戦略について詳しく学びます。
