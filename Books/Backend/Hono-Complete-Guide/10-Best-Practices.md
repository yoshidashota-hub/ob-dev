# 第10章: ベストプラクティス

## プロジェクト構成

### 推奨構成

```
src/
├── index.ts          # エントリーポイント
├── app.ts            # Hono アプリケーション
├── routes/
│   ├── index.ts      # ルート集約
│   ├── users.ts
│   ├── posts.ts
│   └── auth.ts
├── middleware/
│   ├── auth.ts
│   ├── logger.ts
│   └── error-handler.ts
├── services/
│   ├── user.service.ts
│   └── post.service.ts
├── validators/
│   ├── user.validator.ts
│   └── post.validator.ts
├── types/
│   ├── env.d.ts
│   └── index.ts
├── utils/
│   └── helpers.ts
└── db/
    └── schema.ts
```

### ルートの分割

```typescript
// routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createUserSchema, updateUserSchema } from "../validators/user.validator";
import { UserService } from "../services/user.service";

const users = new Hono();

users.get("/", async (c) => {
  const userService = new UserService(c.env.DB);
  const users = await userService.findAll();
  return c.json(users);
});

users.post("/", zValidator("json", createUserSchema), async (c) => {
  const data = c.req.valid("json");
  const userService = new UserService(c.env.DB);
  const user = await userService.create(data);
  return c.json(user, 201);
});

export default users;
```

```typescript
// routes/index.ts
import { Hono } from "hono";
import users from "./users";
import posts from "./posts";
import auth from "./auth";

const routes = new Hono();

routes.route("/users", users);
routes.route("/posts", posts);
routes.route("/auth", auth);

export default routes;
```

```typescript
// app.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import routes from "./routes";
import { errorHandler } from "./middleware/error-handler";

const app = new Hono();

// ミドルウェア
app.use("*", logger());
app.use("*", cors());

// ルート
app.route("/api", routes);

// エラーハンドラー
app.onError(errorHandler);
app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
```

## 型安全性

### 環境変数の型定義

```typescript
// types/env.d.ts
type Bindings = {
  // Cloudflare
  DB: D1Database;
  KV: KVNamespace;
  BUCKET: R2Bucket;

  // 環境変数
  JWT_SECRET: string;
  DATABASE_URL: string;
  API_KEY: string;
};

type Variables = {
  user: { id: string; email: string; role: string };
  requestId: string;
};

// アプリ全体で使用
export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
```

```typescript
// app.ts
import { Hono } from "hono";
import type { AppEnv } from "./types/env";

const app = new Hono<AppEnv>();
```

### リクエスト/レスポンスの型

```typescript
// types/api.ts
interface ApiResponse<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

type ApiResult<T> = ApiResponse<T> | ApiError;

// ヘルパー
const success = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

const error = (code: string, message: string): ApiError => ({
  success: false,
  error: { code, message },
});
```

## エラーハンドリング

### 統一されたエラーレスポンス

```typescript
// middleware/error-handler.ts
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { AppError } from "../errors";

export const errorHandler = (err: Error, c: Context) => {
  console.error(err);

  // HTTPException
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: { code: "HTTP_ERROR", message: err.message },
      },
      err.status,
    );
  }

  // Zod バリデーションエラー
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: err.flatten().fieldErrors,
        },
      },
      400,
    );
  }

  // カスタムエラー
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: { code: err.code, message: err.message },
      },
      err.statusCode,
    );
  }

  // 予期しないエラー
  return c.json(
    {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
    },
    500,
  );
};
```

## バリデーション

### 再利用可能なスキーマ

```typescript
// validators/common.ts
import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// validators/user.validator.ts
export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

## サービス層

```typescript
// services/user.service.ts
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { NotFoundError, ConflictError } from "../errors";

export class UserService {
  private db;

  constructor(d1: D1Database) {
    this.db = drizzle(d1);
  }

  async findAll(options?: { page: number; limit: number }) {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    return this.db.select().from(users).limit(limit).offset(offset);
  }

  async findById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));

    if (!user) {
      throw new NotFoundError("User", id);
    }

    return user;
  }

  async create(data: CreateUserInput) {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.email, data.email));

    if (existing.length > 0) {
      throw new ConflictError("Email already exists");
    }

    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async update(id: string, data: UpdateUserInput) {
    await this.findById(id);  // 存在確認
    const [user] = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async delete(id: string) {
    await this.findById(id);
    await this.db.delete(users).where(eq(users.id, id));
  }
}
```

## パフォーマンス

### キャッシング

```typescript
// middleware/cache.ts
const cache = async <T>(
  key: string,
  kv: KVNamespace,
  fetcher: () => Promise<T>,
  ttl = 3600,
): Promise<T> => {
  const cached = await kv.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const data = await fetcher();
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
  return data;
};

// 使用
app.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await cache(
    `user:${id}`,
    c.env.KV,
    () => userService.findById(id),
    300,
  );
  return c.json(user);
});
```

### レスポンス圧縮

```typescript
import { compress } from "hono/compress";

app.use("*", compress());
```

## セキュリティ

### セキュアヘッダー

```typescript
import { secureHeaders } from "hono/secure-headers";

app.use("*", secureHeaders());
```

### レート制限

```typescript
// middleware/rate-limit.ts
const rateLimit = (limit: number, window: number) => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const key = `rate:${ip}`;

    const current = await c.env.KV.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) {
      return c.json({ error: "Too many requests" }, 429);
    }

    await c.env.KV.put(key, String(count + 1), {
      expirationTtl: window,
    });

    await next();
  };
};

app.use("/api/*", rateLimit(100, 60));  // 1分間に100リクエスト
```

## ログ

```typescript
// middleware/logger.ts
const customLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);

  console.log({
    type: "request",
    requestId,
    method: c.req.method,
    path: c.req.path,
    timestamp: new Date().toISOString(),
  });

  await next();

  console.log({
    type: "response",
    requestId,
    status: c.res.status,
    duration: Date.now() - start,
  });
};
```

## チェックリスト

```
開発時:
✓ 型定義を適切に設定
✓ バリデーションスキーマを定義
✓ エラーハンドリングを統一
✓ テストを書く

本番環境:
✓ セキュアヘッダーを設定
✓ CORSを適切に設定
✓ レート制限を設定
✓ ログを適切に出力
✓ エラー詳細を隠す
```

## まとめ

```
┌─────────────────────────────────────────────────────┐
│              Hono Best Practices                     │
│                                                     │
│  構成: 機能単位でファイルを分割                      │
│  型: Bindings と Variables を定義                   │
│  バリデーション: Zod でスキーマ定義                  │
│  エラー: 統一されたエラーレスポンス                  │
│  セキュリティ: secureHeaders + CORS + Rate Limit    │
│  パフォーマンス: キャッシュ + 圧縮                   │
│  テスト: app.request() でシンプルにテスト           │
└─────────────────────────────────────────────────────┘
```
