# 第5章: フレームワークとドライバー

## フレームワーク層とは

最も外側の層。具体的な技術の詳細。

```
┌─────────────────────────────────────────────────────┐
│            Frameworks & Drivers                      │
│                                                     │
│  ┌───────────────┐  ┌───────────────┐              │
│  │  Web Server   │  │   Database    │              │
│  │  (Express,    │  │  (PostgreSQL, │              │
│  │   Next.js)    │  │   MongoDB)    │              │
│  └───────────────┘  └───────────────┘              │
│                                                     │
│  ┌───────────────┐  ┌───────────────┐              │
│  │  External     │  │    Cache      │              │
│  │  APIs         │  │   (Redis)     │              │
│  └───────────────┘  └───────────────┘              │
│                                                     │
│  ┌───────────────┐  ┌───────────────┐              │
│  │  Message      │  │   File        │              │
│  │  Queue        │  │   Storage     │              │
│  └───────────────┘  └───────────────┘              │
└─────────────────────────────────────────────────────┘
```

## Web フレームワーク

### Next.js との統合

```typescript
// infrastructure/web/nextjs/routes.ts
import { container } from "@/infrastructure/container";
import { UserController } from "@/adapters/controllers/UserController";

// API ルートハンドラー
export function createUserHandler() {
  return container.resolve(UserController);
}
```

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createUserHandler } from "@/infrastructure/web/nextjs/routes";

const controller = createUserHandler();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const result = await controller.list({ page, pageSize });

  return NextResponse.json(result.body, { status: result.statusCode });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await controller.create({ body });

  return NextResponse.json(result.body, { status: result.statusCode });
}
```

### NestJS との統合

```typescript
// infrastructure/web/nestjs/users.module.ts
import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { CreateUserUseCase } from "@/application/use-cases/CreateUser";
import { PrismaUserRepository } from "@/adapters/gateways/PrismaUserRepository";
import { PrismaModule } from "@/infrastructure/database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    {
      provide: "UserRepository",
      useClass: PrismaUserRepository,
    },
    {
      provide: CreateUserUseCase,
      useFactory: (repo: UserRepository) => new CreateUserUseCase(repo),
      inject: ["UserRepository"],
    },
  ],
})
export class UsersModule {}
```

```typescript
// infrastructure/web/nestjs/users.controller.ts
import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { CreateUserUseCase } from "@/application/use-cases/CreateUser";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return await this.createUser.execute(dto);
  }
}
```

## データベース

### Prisma インフラストラクチャ

```typescript
// infrastructure/database/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### Unit of Work 実装

```typescript
// infrastructure/database/PrismaUnitOfWork.ts
import { PrismaClient } from "@prisma/client";
import { UnitOfWork } from "@/application/ports/output/UnitOfWork";

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private prisma: PrismaClient) {}

  async execute<T>(work: () => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      // トランザクション内でのリポジトリを提供
      return await work();
    });
  }
}
```

## キャッシュ

### Redis 実装

```typescript
// infrastructure/cache/RedisCache.ts
import Redis from "ioredis";
import { CacheService } from "@/application/ports/output/CacheService";

export class RedisCache implements CacheService {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
```

## メッセージキュー

### イベントパブリッシャー

```typescript
// infrastructure/messaging/EventPublisher.ts
import { EventPublisher } from "@/application/ports/output/EventPublisher";
import { DomainEvent } from "@/domain/events/DomainEvent";

export class InMemoryEventPublisher implements EventPublisher {
  private handlers: Map<string, ((event: DomainEvent) => Promise<void>)[]> = new Map();

  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const eventType = event.constructor.name;
      const handlers = this.handlers.get(eventType) || [];

      for (const handler of handlers) {
        await handler(event);
      }
    }
  }
}
```

### Redis Pub/Sub

```typescript
// infrastructure/messaging/RedisEventPublisher.ts
import Redis from "ioredis";
import { EventPublisher } from "@/application/ports/output/EventPublisher";
import { DomainEvent } from "@/domain/events/DomainEvent";

export class RedisEventPublisher implements EventPublisher {
  private publisher: Redis;

  constructor() {
    this.publisher = new Redis(process.env.REDIS_URL);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const channel = `events:${event.constructor.name}`;
      await this.publisher.publish(channel, JSON.stringify(event));
    }
  }
}
```

## ファイルストレージ

```typescript
// infrastructure/storage/S3Storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { FileStorage } from "@/application/ports/output/FileStorage";

export class S3Storage implements FileStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({ region: process.env.AWS_REGION });
    this.bucket = process.env.S3_BUCKET!;
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );

    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return Buffer.from(await response.Body!.transformToByteArray());
  }
}
```

## 設定管理

```typescript
// infrastructure/config/index.ts
export const config = {
  app: {
    port: parseInt(process.env.PORT || "3000"),
    env: process.env.NODE_ENV || "development",
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  aws: {
    region: process.env.AWS_REGION || "ap-northeast-1",
    s3Bucket: process.env.S3_BUCKET!,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  },
} as const;
```

## 次のステップ

次章では、依存性注入について詳しく学びます。
