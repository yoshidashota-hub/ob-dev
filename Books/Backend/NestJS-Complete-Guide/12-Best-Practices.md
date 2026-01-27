# 第12章: ベストプラクティス

## プロジェクト構成

### 推奨ディレクトリ構成

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── config.module.ts
│   └── configuration.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── middleware/
├── modules/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   ├── entities/
│   │   └── __tests__/
│   ├── auth/
│   └── posts/
└── shared/
    ├── database/
    └── utils/
```

### モジュール構成

```typescript
// users/users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],  // 必要なものだけ export
})
export class UsersModule {}
```

## 設定管理

### ConfigModule の活用

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
});

// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "production", "test"),
        PORT: Joi.number().default(3000),
        DB_HOST: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

### 型安全な設定取得

```typescript
// config/config.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>("port");
  }

  get databaseConfig() {
    return {
      host: this.configService.get<string>("database.host"),
      port: this.configService.get<number>("database.port"),
      name: this.configService.get<string>("database.name"),
    };
  }

  get jwtSecret(): string {
    return this.configService.get<string>("jwt.secret");
  }
}
```

## エラーハンドリング

### 統一されたエラーレスポンス

```typescript
// common/filters/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, code } = this.getErrorDetails(exception);

    const errorResponse = {
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(`${request.method} ${request.url}`, {
      error: errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json(errorResponse);
  }

  private getErrorDetails(exception: unknown) {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: exception.message,
        code: "HTTP_ERROR",
      };
    }

    return {
      status: 500,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    };
  }
}
```

## バリデーション

### DTO のベストプラクティス

```typescript
// common/dto/pagination.dto.ts
export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

// users/dto/find-users.dto.ts
export class FindUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

### カスタムバリデータ

```typescript
// common/validators/match.validator.ts
export function Match(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "match",
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must match ${args.constraints[0]}`;
        },
      },
    });
  };
}

// 使用
export class RegisterDto {
  @IsString()
  @MinLength(8)
  password: string;

  @Match("password", { message: "Passwords do not match" })
  confirmPassword: string;
}
```

## ロギング

### カスタムロガー

```typescript
// common/logger/logger.service.ts
import { Injectable, LoggerService, Scope } from "@nestjs/common";
import * as winston from "winston";

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "logs/combined.log" }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context: context || this.context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }
}
```

## パフォーマンス

### キャッシング

```typescript
// common/interceptors/cache.interceptor.ts
import { CacheInterceptor, CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,  // 60秒
      max: 100, // 最大100エントリ
    }),
  ],
})
export class AppModule {}

// 使用
@Controller("users")
@UseInterceptors(CacheInterceptor)
export class UsersController {
  @Get()
  @CacheTTL(30)
  findAll() {
    return this.usersService.findAll();
  }
}
```

### 圧縮

```typescript
// main.ts
import * as compression from "compression";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  await app.listen(3000);
}
```

## セキュリティ

### ヘルメット

```typescript
import helmet from "helmet";

app.use(helmet());
```

### レート制限

```typescript
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1分
      limit: 100,  // 100リクエスト
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### CORS

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: true,
});
```

## API ドキュメント

### Swagger

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

const config = new DocumentBuilder()
  .setTitle("My API")
  .setDescription("API description")
  .setVersion("1.0")
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("api", app, document);
```

```typescript
// users/users.controller.ts
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "Returns all users" })
  @Get()
  findAll() {}
}

// users/dto/create-user.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "John Doe", minLength: 2 })
  @IsString()
  @MinLength(2)
  name: string;
}
```

## チェックリスト

### 開発時

```
✓ ConfigModule で環境変数を管理
✓ ValidationPipe をグローバルに設定
✓ 統一されたエラーレスポンス形式
✓ 適切なロギング設定
✓ Swagger ドキュメント
✓ ユニットテストのカバレッジ 80%+
```

### 本番環境

```
✓ helmet でセキュリティヘッダー
✓ CORS 設定
✓ レート制限
✓ 圧縮
✓ 環境変数のバリデーション
✓ エラー詳細を隠す
✓ ヘルスチェックエンドポイント
```

## まとめ

```
┌─────────────────────────────────────────────────────┐
│             NestJS Best Practices                    │
│                                                     │
│  構成: 機能単位のモジュール分割                      │
│  設定: ConfigModule + バリデーション                 │
│  認証: Passport + JWT + Guards                       │
│  バリデーション: class-validator + Pipes             │
│  エラー: 統一された Exception Filters                │
│  ロギング: Winston または組み込みLogger              │
│  セキュリティ: Helmet + CORS + Rate Limiting         │
│  ドキュメント: Swagger                               │
│  テスト: Jest + E2E                                  │
└─────────────────────────────────────────────────────┘
```
