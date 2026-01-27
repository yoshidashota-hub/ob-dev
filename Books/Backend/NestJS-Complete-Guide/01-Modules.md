# 第1章: モジュール

## モジュールとは

NestJS のモジュールは、アプリケーションを機能単位で整理するための仕組み。

```
┌─────────────────────────────────────────────────────┐
│                   AppModule                          │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ UsersModule │  │ PostsModule │  │ AuthModule  │ │
│  │             │  │             │  │             │ │
│  │ Controller  │  │ Controller  │  │ Controller  │ │
│  │ Service     │  │ Service     │  │ Service     │ │
│  │ Repository  │  │ Repository  │  │ Guard       │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 基本構造

```typescript
// users/users.module.ts
import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [],           // 他のモジュールをインポート
  controllers: [UsersController],  // コントローラー
  providers: [UsersService],       // サービス、リポジトリ等
  exports: [UsersService],         // 他のモジュールに公開
})
export class UsersModule {}
```

## モジュールの種類

### Feature Module（機能モジュール）

```typescript
// users/users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### Shared Module（共有モジュール）

```typescript
// shared/shared.module.ts
@Module({
  providers: [HelperService, LoggerService],
  exports: [HelperService, LoggerService],
})
export class SharedModule {}

// 使用側
@Module({
  imports: [SharedModule],
  // HelperService, LoggerService が利用可能
})
export class UsersModule {}
```

### Global Module（グローバルモジュール）

```typescript
// config/config.module.ts
import { Global, Module } from "@nestjs/common";

@Global()  // 一度インポートすればどこでも使える
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

### Dynamic Module（動的モジュール）

```typescript
// database/database.module.ts
import { DynamicModule, Module } from "@nestjs/common";

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: "DATABASE_OPTIONS",
          useValue: options,
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}

// 使用側
@Module({
  imports: [
    DatabaseModule.forRoot({
      host: "localhost",
      port: 5432,
    }),
  ],
})
export class AppModule {}
```

## モジュールのインポート/エクスポート

### 基本パターン

```typescript
// posts/posts.module.ts
@Module({
  imports: [UsersModule],  // UsersModule の exports を利用可能
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}

// posts/posts.service.ts
@Injectable()
export class PostsService {
  // UsersModule が UsersService を export しているため利用可能
  constructor(private usersService: UsersService) {}
}
```

### 再エクスポート

```typescript
// core/core.module.ts
@Module({
  imports: [DatabaseModule, CacheModule],
  exports: [DatabaseModule, CacheModule],  // 再エクスポート
})
export class CoreModule {}

// CoreModule をインポートすると DatabaseModule, CacheModule も利用可能
```

## モジュール参照

### forwardRef（循環参照の解決）

```typescript
// users/users.module.ts
@Module({
  imports: [forwardRef(() => PostsModule)],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

// posts/posts.module.ts
@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
```

### ModuleRef（動的なプロバイダー取得）

```typescript
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";

@Injectable()
export class AppService implements OnModuleInit {
  private usersService: UsersService;

  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    this.usersService = this.moduleRef.get(UsersService);
  }
}
```

## モジュール構成パターン

### 標準的な構成

```
src/
├── app.module.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── entities/
│       └── user.entity.ts
├── posts/
│   ├── posts.module.ts
│   └── ...
└── common/
    ├── common.module.ts
    ├── decorators/
    ├── filters/
    ├── guards/
    └── interceptors/
```

### モジュール自動生成

```bash
# モジュール生成
nest generate module users

# リソース一式生成（module, controller, service, dto, entity）
nest generate resource users
```

## ベストプラクティス

```
✓ 機能単位でモジュールを分割
✓ 共通機能は SharedModule にまとめる
✓ 設定系は Global Module にする
✓ 循環参照は forwardRef で解決
✓ モジュール間の依存は最小限に

✗ 1つのモジュールに多くの機能を詰め込まない
✗ 不要な exports をしない
✗ 循環参照を乱用しない
```

## 次のステップ

次章では、コントローラーについて詳しく学びます。
