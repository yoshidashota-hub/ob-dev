# 第8章: 例外フィルター

## 例外フィルターとは

例外をキャッチしてクライアントへのレスポンスを整形する機能。

```
┌─────────────────────────────────────────────────────┐
│               Exception Filter                       │
│                                                     │
│  Exception thrown                                   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────────────────────────────────────┐   │
│  │         Exception Filter                     │   │
│  │                                             │   │
│  │   ・例外の種類を判定                         │   │
│  │   ・レスポンス形式を整形                     │   │
│  │   ・ロギング                                │   │
│  └─────────────────────────────────────────────┘   │
│     │                                               │
│     ▼                                               │
│  Formatted Error Response                           │
└─────────────────────────────────────────────────────┘
```

## 組み込み例外

```typescript
import {
  BadRequestException,         // 400
  UnauthorizedException,        // 401
  ForbiddenException,          // 403
  NotFoundException,           // 404
  MethodNotAllowedException,   // 405
  NotAcceptableException,      // 406
  RequestTimeoutException,     // 408
  ConflictException,           // 409
  GoneException,               // 410
  PayloadTooLargeException,    // 413
  UnsupportedMediaTypeException, // 415
  UnprocessableEntityException, // 422
  InternalServerErrorException, // 500
  NotImplementedException,     // 501
  BadGatewayException,         // 502
  ServiceUnavailableException, // 503
  GatewayTimeoutException,     // 504
} from "@nestjs/common";
```

### 使用例

```typescript
@Injectable()
export class UsersService {
  async findOne(id: string) {
    const user = await this.usersRepository.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(createUserDto.email);

    if (existing) {
      throw new ConflictException("Email already exists");
    }

    return this.usersRepository.create(createUserDto);
  }
}
```

### オプション付きの例外

```typescript
// 詳細メッセージ
throw new BadRequestException({
  message: "Validation failed",
  errors: ["email is required", "password is too short"],
});

// カスタムステータス
throw new HttpException("Custom error", HttpStatus.FORBIDDEN);

// カスタムレスポンス
throw new HttpException(
  {
    status: HttpStatus.FORBIDDEN,
    error: "Access denied",
    code: "ACCESS_DENIED",
  },
  HttpStatus.FORBIDDEN,
);
```

## カスタム例外フィルター

### 基本構造

```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message,
    };

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${exception.message}`,
    );

    response.status(status).json(errorResponse);
  }
}
```

### 全例外キャッチ

```typescript
// common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : "Internal server error";

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    // 500エラーはスタックトレースもログ出力
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        exception instanceof Error ? exception.stack : "Unknown error",
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} ${status} - ${message}`);
    }

    response.status(status).json(errorResponse);
  }
}
```

### バリデーションエラー専用

```typescript
// common/filters/validation-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from "@nestjs/common";
import { Response } from "express";

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      error: "Validation Error",
      message: "The provided data is invalid",
      details:
        typeof exceptionResponse.message === "string"
          ? [exceptionResponse.message]
          : exceptionResponse.message,
    };

    response.status(status).json(errorResponse);
  }
}
```

## 例外フィルターの適用

### メソッドレベル

```typescript
@UseFilters(HttpExceptionFilter)
@Get()
findAll() {}
```

### コントローラーレベル

```typescript
@Controller("users")
@UseFilters(HttpExceptionFilter)
export class UsersController {}
```

### グローバルレベル

```typescript
// main.ts
app.useGlobalFilters(new AllExceptionsFilter());

// または モジュールで登録（DI対応）
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
```

## カスタム例外クラス

```typescript
// common/exceptions/business.exception.ts
import { HttpException, HttpStatus } from "@nestjs/common";

export class BusinessException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}

export class UserNotFoundException extends BusinessException {
  constructor(userId: string) {
    super("USER_NOT_FOUND", `User with ID ${userId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class EmailAlreadyExistsException extends BusinessException {
  constructor(email: string) {
    super("EMAIL_EXISTS", `Email ${email} is already registered`, HttpStatus.CONFLICT);
  }
}

export class InsufficientBalanceException extends BusinessException {
  constructor(required: number, available: number) {
    super(
      "INSUFFICIENT_BALANCE",
      `Insufficient balance. Required: ${required}, Available: ${available}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
```

```typescript
// 使用
@Injectable()
export class UsersService {
  async findOne(id: string) {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
  }
}
```

### カスタム例外用フィルター

```typescript
// common/filters/business-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost } from "@nestjs/common";
import { Response } from "express";
import { BusinessException } from "../exceptions/business.exception";

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      code: exception.code,
      message: exception.message,
    });
  }
}
```

## 複数フィルターの優先順位

```typescript
// 特定の例外 → 一般的な例外 の順で設定
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,  // 最後にキャッチ
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,  // HttpException をキャッチ
    },
    {
      provide: APP_FILTER,
      useClass: BusinessExceptionFilter,  // BusinessException をキャッチ
    },
  ],
})
export class AppModule {}
```

## 本番環境での考慮事項

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 本番環境では内部エラーの詳細を隠す
    const isProduction = process.env.NODE_ENV === "production";

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR && isProduction
          ? "Internal server error"
          : exception instanceof Error
            ? exception.message
            : "Unknown error",
      // 開発環境のみスタックトレースを含める
      ...(isProduction
        ? {}
        : { stack: exception instanceof Error ? exception.stack : undefined }),
    };

    response.status(status).json(errorResponse);
  }
}
```

## 次のステップ

次章では、データベース統合について詳しく学びます。
