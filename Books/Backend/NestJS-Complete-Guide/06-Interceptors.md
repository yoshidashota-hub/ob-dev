# 第6章: インターセプター

## インターセプターとは

リクエスト/レスポンスを横断的に処理する機能。AOP（Aspect Oriented Programming）パターン。

```
┌─────────────────────────────────────────────────────┐
│                  Interceptor                         │
│                                                     │
│  Request                                            │
│     │                                               │
│     ▼                                               │
│  ┌─────────────────────────────────────────────┐   │
│  │          Before Handler (前処理)             │   │
│  └─────────────────────────────────────────────┘   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────────────────────────────────────┐   │
│  │             Route Handler                    │   │
│  └─────────────────────────────────────────────┘   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────────────────────────────────────┐   │
│  │          After Handler (後処理)              │   │
│  └─────────────────────────────────────────────┘   │
│     │                                               │
│     ▼                                               │
│  Response                                           │
└─────────────────────────────────────────────────────┘
```

## 基本構造

```typescript
// common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log("Before...");
    const now = Date.now();

    return next
      .handle()
      .pipe(tap(() => console.log(`After... ${Date.now() - now}ms`)));
  }
}
```

## インターセプターの適用

### メソッドレベル

```typescript
@Controller("users")
export class UsersController {
  @UseInterceptors(LoggingInterceptor)
  @Get()
  findAll() {
    return [];
  }
}
```

### コントローラーレベル

```typescript
@Controller("users")
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  @Get()
  findAll() {}

  @Get(":id")
  findOne() {}
}
```

### グローバルレベル

```typescript
// main.ts
app.useGlobalInterceptors(new LoggingInterceptor());

// または モジュールで登録
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

## 実践的なインターセプター

### レスポンス変換

```typescript
// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        statusCode: context.switchToHttp().getResponse().statusCode,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 例外マッピング

```typescript
// common/interceptors/errors.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadGatewayException,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => new BadGatewayException("External service error")),
      ),
    );
  }
}
```

### キャッシュ

```typescript
// common/interceptors/cache.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = request.url;

    if (this.cache.has(key)) {
      console.log("Cache hit:", key);
      return of(this.cache.get(key));
    }

    return next.handle().pipe(
      tap((data) => {
        console.log("Cache set:", key);
        this.cache.set(key, data);
        // 5分後にキャッシュクリア
        setTimeout(() => this.cache.delete(key), 5 * 60 * 1000);
      }),
    );
  }
}
```

### タイムアウト

```typescript
// common/interceptors/timeout.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from "@nestjs/common";
import { Observable, throwError, TimeoutError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  }
}
```

### ロギング（詳細版）

```typescript
// common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const now = Date.now();

    this.logger.log(
      `[Request] ${method} ${url} - User: ${user?.id || "anonymous"}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          this.logger.log(
            `[Response] ${method} ${url} ${response.statusCode} - ${Date.now() - now}ms`,
          );
        },
        error: (error) => {
          this.logger.error(
            `[Error] ${method} ${url} - ${error.message} - ${Date.now() - now}ms`,
          );
        },
      }),
    );
  }
}
```

### データ除外（パスワード等）

```typescript
// common/interceptors/exclude-null.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

function excludeFields(obj: any, fields: string[]): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => excludeFields(item, fields));
  }
  if (obj !== null && typeof obj === "object") {
    const result = { ...obj };
    for (const field of fields) {
      delete result[field];
    }
    return result;
  }
  return obj;
}

@Injectable()
export class ExcludeFieldsInterceptor implements NestInterceptor {
  constructor(private fields: string[] = ["password", "passwordHash"]) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => excludeFields(data, this.fields)),
    );
  }
}
```

### シリアライゼーション

```typescript
// common/interceptors/serialize.interceptor.ts
import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { plainToInstance } from "class-transformer";

interface ClassConstructor {
  new (...args: any[]): {};
}

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: ClassConstructor) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) =>
        plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        }),
      ),
    );
  }
}
```

```typescript
// 使用例
import { Expose } from "class-transformer";

export class UserDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  // password は @Expose() がないので除外される
}

@Controller("users")
export class UsersController {
  @Serialize(UserDto)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }
}
```

## 複数インターセプターの実行順序

```typescript
@UseInterceptors(InterceptorA, InterceptorB, InterceptorC)
@Get()
findAll() {}

// 実行順序:
// Request:  A → B → C → Handler
// Response: C → B → A → Client
```

## RxJS オペレータの活用

```typescript
import { map, tap, catchError, timeout, retry } from "rxjs/operators";

@Injectable()
export class AdvancedInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      // リトライ
      retry(3),
      // タイムアウト
      timeout(5000),
      // ログ
      tap((data) => console.log("Response:", data)),
      // 変換
      map((data) => ({ success: true, data })),
      // エラーハンドリング
      catchError((err) => throwError(() => new Error("Failed"))),
    );
  }
}
```

## 次のステップ

次章では、パイプについて詳しく学びます。
