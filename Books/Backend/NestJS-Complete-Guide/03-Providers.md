# 第3章: プロバイダー（サービス）

## プロバイダーとは

依存性注入（DI）によって管理されるクラス。ビジネスロジックを実装する。

```
┌─────────────────────────────────────────────────────┐
│                   Providers                          │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Services   │  │ Repositories│  │  Factories  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Helpers   │  │  Gateways   │  │    etc...   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 基本的なサービス

```typescript
// users/users.service.ts
import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()  // DI コンテナに登録
export class UsersService {
  private users: User[] = [];

  create(createUserDto: CreateUserDto) {
    const user = {
      id: crypto.randomUUID(),
      ...createUserDto,
    };
    this.users.push(user);
    return user;
  }

  findAll() {
    return this.users;
  }

  findOne(id: string) {
    return this.users.find((user) => user.id === id);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    this.users[index] = { ...this.users[index], ...updateUserDto };
    return this.users[index];
  }

  remove(id: string) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    return this.users.splice(index, 1)[0];
  }
}
```

## 依存性注入（DI）

### コンストラクタ注入

```typescript
// users/users.controller.ts
@Controller("users")
export class UsersController {
  // コンストラクタで注入（推奨）
  constructor(private readonly usersService: UsersService) {}
}
```

### プロパティ注入

```typescript
import { Inject } from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Inject(UsersService)
  private readonly usersService: UsersService;
}
```

## プロバイダーの登録

### 標準パターン

```typescript
@Module({
  providers: [UsersService],  // 省略形
  // 以下と同じ
  // providers: [{ provide: UsersService, useClass: UsersService }],
})
export class UsersModule {}
```

### カスタムプロバイダー

#### useValue（値の注入）

```typescript
const configValue = {
  apiKey: "xxx",
  timeout: 3000,
};

@Module({
  providers: [
    {
      provide: "CONFIG",
      useValue: configValue,
    },
  ],
})
export class AppModule {}

// 使用側
@Injectable()
export class AppService {
  constructor(@Inject("CONFIG") private config: typeof configValue) {}
}
```

#### useClass（クラスの切り替え）

```typescript
const mockService = {
  provide: UsersService,
  useClass:
    process.env.NODE_ENV === "test"
      ? MockUsersService
      : UsersService,
};

@Module({
  providers: [mockService],
})
export class UsersModule {}
```

#### useFactory（ファクトリ関数）

```typescript
@Module({
  providers: [
    {
      provide: "DATABASE_CONNECTION",
      useFactory: async (configService: ConfigService) => {
        const options = configService.get("database");
        return createConnection(options);
      },
      inject: [ConfigService],  // ファクトリの引数に注入
    },
  ],
})
export class DatabaseModule {}
```

#### useExisting（エイリアス）

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: "AliasedUsersService",
      useExisting: UsersService,
    },
  ],
})
export class UsersModule {}
```

## スコープ

### デフォルト（Singleton）

```typescript
@Injectable()  // 全リクエストで同一インスタンス
export class UsersService {}
```

### リクエストスコープ

```typescript
@Injectable({ scope: Scope.REQUEST })  // リクエストごとに新規インスタンス
export class UsersService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

### トランジェントスコープ

```typescript
@Injectable({ scope: Scope.TRANSIENT })  // 注入されるたびに新規インスタンス
export class HelperService {}
```

## オプショナル注入

```typescript
@Injectable()
export class HttpService {
  constructor(
    @Optional() @Inject("HTTP_OPTIONS")
    private options?: HttpOptions,
  ) {
    this.options = options ?? { timeout: 3000 };
  }
}
```

## 循環依存の解決

```typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => PostsService))
    private postsService: PostsService,
  ) {}
}

// posts.service.ts
@Injectable()
export class PostsService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}
}
```

## リポジトリパターン

```typescript
// users/users.repository.ts
import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.find({ where: { isActive: true } });
  }
}

// users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }
}
```

## 非同期プロバイダー

```typescript
@Module({
  providers: [
    {
      provide: "ASYNC_CONNECTION",
      useFactory: async () => {
        const connection = await createConnection();
        return connection;
      },
    },
  ],
})
export class DatabaseModule {}
```

## ライフサイクルフック

```typescript
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";

@Injectable()
export class UsersService
  implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap, OnApplicationShutdown
{
  // モジュール初期化時
  onModuleInit() {
    console.log("Module initialized");
  }

  // アプリケーション起動完了時
  onApplicationBootstrap() {
    console.log("Application bootstrapped");
  }

  // モジュール破棄時
  onModuleDestroy() {
    console.log("Module destroyed");
  }

  // アプリケーション終了時
  async onApplicationShutdown(signal?: string) {
    console.log(`Application shutdown: ${signal}`);
    // クリーンアップ処理
  }
}
```

## テスト

```typescript
// users/users.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";

describe("UsersService", () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return an array of users", async () => {
      const users = [{ id: "1", name: "Test" }];
      mockRepository.find.mockResolvedValue(users);

      expect(await service.findAll()).toEqual(users);
    });
  });
});
```

## 次のステップ

次章では、ミドルウェアについて詳しく学びます。
