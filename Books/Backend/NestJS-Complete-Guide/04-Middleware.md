# 第4章: ミドルウェア

## ミドルウェアとは

リクエストがルートハンドラに到達する前に実行される関数。

```
┌─────────────────────────────────────────────────────┐
│                Request Pipeline                      │
│                                                     │
│  Request                                            │
│     │                                               │
│     ▼                                               │
│  ┌─────────────┐                                   │
│  │ Middleware  │ → ログ、認証チェック等            │
│  └─────────────┘                                   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────┐                                   │
│  │   Guards    │ → 認可チェック                    │
│  └─────────────┘                                   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────┐                                   │
│  │Interceptors │ → 前処理                          │
│  └─────────────┘                                   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────┐                                   │
│  │   Pipes     │ → バリデーション/変換              │
│  └─────────────┘                                   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────┐                                   │
│  │  Handler    │ → コントローラーメソッド           │
│  └─────────────┘                                   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────┐                                   │
│  │Interceptors │ → 後処理                          │
│  └─────────────┘                                   │
│     │                                               │
│     ▼                                               │
│  ┌─────────────┐                                   │
│  │  Filters    │ → 例外処理                        │
│  └─────────────┘                                   │
│     │                                               │
│     ▼                                               │
│  Response                                           │
└─────────────────────────────────────────────────────┘
```

## 関数ミドルウェア

```typescript
// common/middleware/logger.middleware.ts
import { Request, Response, NextFunction } from "express";

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}
```

## クラスミドルウェア

```typescript
// common/middleware/logger.middleware.ts
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  }
}
```

## ミドルウェアの適用

### モジュールでの設定

```typescript
// app.module.ts
import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [UsersModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes("users");  // /users/* に適用
  }
}
```

### 詳細なルート指定

```typescript
import { RequestMethod } from "@nestjs/common";

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(
        { path: "users", method: RequestMethod.GET },
        { path: "users", method: RequestMethod.POST },
      );
  }
}
```

### コントローラー指定

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(UsersController);  // UsersController のすべてのルート
  }
}
```

### 除外ルート

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude(
        { path: "users/health", method: RequestMethod.GET },
        "users/(.*)/internal",
      )
      .forRoutes(UsersController);
  }
}
```

### 複数ミドルウェア

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, AuthMiddleware, CorsMiddleware)
      .forRoutes("*");
  }
}
```

## グローバルミドルウェア

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { logger } from "./common/middleware/logger.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // グローバル適用（関数ミドルウェアのみ）
  app.use(logger);

  await app.listen(3000);
}
bootstrap();
```

## 実践的なミドルウェア例

### リクエストロギング

```typescript
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get("user-agent") || "";
    const start = Date.now();

    res.on("finish", () => {
      const { statusCode } = res;
      const contentLength = res.get("content-length");
      const duration = Date.now() - start;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${duration}ms`,
      );
    });

    next();
  }
}
```

### 認証チェック

```typescript
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedException("Token not provided");
    }

    try {
      const user = await this.authService.validateToken(token);
      req["user"] = user;
      next();
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
```

### レート制限

```typescript
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly limit = 100;
  private readonly windowMs = 60000; // 1分

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const now = Date.now();
    const record = this.requests.get(ip);

    if (!record || now > record.resetTime) {
      this.requests.set(ip, { count: 1, resetTime: now + this.windowMs });
      return next();
    }

    if (record.count >= this.limit) {
      res.status(429).json({ message: "Too many requests" });
      return;
    }

    record.count++;
    next();
  }
}
```

### CORS 設定

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ["http://localhost:3000", "https://example.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  });

  await app.listen(3000);
}
```

### ヘルメット（セキュリティヘッダー）

```typescript
// main.ts
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  await app.listen(3000);
}
```

### リクエストボディのサイズ制限

```typescript
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  await app.listen(3000);
}
```

## サードパーティミドルウェア

```bash
# よく使うパッケージ
npm install helmet cors compression cookie-parser
```

```typescript
import helmet from "helmet";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  await app.listen(3000);
}
```

## ミドルウェア vs ガード vs インターセプター

| 機能 | ミドルウェア | ガード | インターセプター |
|------|-------------|--------|-----------------|
| 実行タイミング | 最初 | ミドルウェア後 | ガード後 |
| DI サポート | クラス版のみ | ○ | ○ |
| 実行コンテキスト | Request/Response | ExecutionContext | ExecutionContext |
| 主な用途 | ロギング、CORS | 認可 | ロギング、変換 |

## 次のステップ

次章では、ガードについて詳しく学びます。
