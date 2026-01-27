# 第2章: ミドルウェア

## ミドルウェアの基本

```typescript
import { Hono, Next } from "hono";
import { Context } from "hono";

const app = new Hono();

// 基本的なミドルウェア
app.use("*", async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  await next();
  console.log(`Response status: ${c.res.status}`);
});
```

## 実行順序

```
Request
   │
   ▼
┌──────────────────────────────────────┐
│ Middleware 1 (before next)          │
│ ┌────────────────────────────────┐  │
│ │ Middleware 2 (before next)    │  │
│ │ ┌──────────────────────────┐  │  │
│ │ │      Route Handler       │  │  │
│ │ └──────────────────────────┘  │  │
│ │ Middleware 2 (after next)     │  │
│ └────────────────────────────────┘  │
│ Middleware 1 (after next)           │
└──────────────────────────────────────┘
   │
   ▼
Response
```

## パス指定

```typescript
// すべてのリクエスト
app.use("*", middleware);

// 特定のパス
app.use("/api/*", middleware);

// 特定のパス（完全一致）
app.use("/api/users", middleware);

// メソッド指定
app.use("/api/*", async (c, next) => {
  if (c.req.method === "POST") {
    // POST のみ処理
  }
  await next();
});
```

## 組み込みミドルウェア

### Logger

```typescript
import { logger } from "hono/logger";

app.use("*", logger());
// 出力: --> GET /users
//        <-- GET /users 200 15ms
```

### CORS

```typescript
import { cors } from "hono/cors";

app.use("/api/*", cors());

// オプション付き
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "https://example.com"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["X-Custom-Header"],
    maxAge: 600,
    credentials: true,
  }),
);
```

### Basic Auth

```typescript
import { basicAuth } from "hono/basic-auth";

app.use(
  "/admin/*",
  basicAuth({
    username: "admin",
    password: "secret",
  }),
);

// 複数ユーザー
app.use(
  "/admin/*",
  basicAuth({
    verifyUser: (username, password) => {
      return username === "admin" && password === "secret";
    },
  }),
);
```

### Bearer Auth

```typescript
import { bearerAuth } from "hono/bearer-auth";

app.use(
  "/api/*",
  bearerAuth({
    token: "my-secret-token",
  }),
);

// カスタム検証
app.use(
  "/api/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      // トークン検証ロジック
      return token === "valid-token";
    },
  }),
);
```

### JWT

```typescript
import { jwt } from "hono/jwt";

app.use(
  "/api/*",
  jwt({
    secret: "my-secret-key",
  }),
);

// ペイロードにアクセス
app.get("/api/profile", (c) => {
  const payload = c.get("jwtPayload");
  return c.json(payload);
});
```

### Compress

```typescript
import { compress } from "hono/compress";

app.use("*", compress());
```

### ETag

```typescript
import { etag } from "hono/etag";

app.use("*", etag());
```

### Pretty JSON

```typescript
import { prettyJSON } from "hono/pretty-json";

app.use("*", prettyJSON());
// ?pretty でフォーマット済み JSON
```

### Secure Headers

```typescript
import { secureHeaders } from "hono/secure-headers";

app.use("*", secureHeaders());
// X-Frame-Options, X-Content-Type-Options, etc.
```

### Timeout

```typescript
import { timeout } from "hono/timeout";

app.use("/api/*", timeout(5000));  // 5秒
```

### Cache

```typescript
import { cache } from "hono/cache";

app.use(
  "/static/*",
  cache({
    cacheName: "my-cache",
    cacheControl: "max-age=3600",
  }),
);
```

## カスタムミドルウェア

### 基本パターン

```typescript
const myMiddleware = async (c: Context, next: Next) => {
  // 前処理
  console.log("Before");

  await next();

  // 後処理
  console.log("After");
};

app.use("*", myMiddleware);
```

### 設定可能なミドルウェア

```typescript
interface LoggerOptions {
  format?: string;
  skip?: (c: Context) => boolean;
}

const customLogger = (options: LoggerOptions = {}) => {
  return async (c: Context, next: Next) => {
    if (options.skip?.(c)) {
      return next();
    }

    const start = Date.now();
    await next();
    const duration = Date.now() - start;

    console.log(`${c.req.method} ${c.req.path} - ${duration}ms`);
  };
};

app.use("*", customLogger({ skip: (c) => c.req.path === "/health" }));
```

### 認証ミドルウェア

```typescript
import { HTTPException } from "hono/http-exception";

const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  try {
    const payload = await verifyToken(token);
    c.set("user", payload);
    await next();
  } catch {
    throw new HTTPException(401, { message: "Invalid token" });
  }
};

app.use("/api/*", authMiddleware);

// ルートでユーザー情報にアクセス
app.get("/api/profile", (c) => {
  const user = c.get("user");
  return c.json(user);
});
```

### レート制限ミドルウェア

```typescript
const rateLimit = (limit: number, window: number) => {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for") || "unknown";
    const now = Date.now();
    const record = requests.get(ip);

    if (!record || now > record.resetAt) {
      requests.set(ip, { count: 1, resetAt: now + window });
    } else if (record.count >= limit) {
      return c.json({ error: "Too many requests" }, 429);
    } else {
      record.count++;
    }

    await next();
  };
};

app.use("/api/*", rateLimit(100, 60000));  // 1分間に100リクエスト
```

### リクエストID ミドルウェア

```typescript
import { v4 as uuidv4 } from "uuid";

const requestId = async (c: Context, next: Next) => {
  const id = c.req.header("X-Request-ID") || uuidv4();
  c.set("requestId", id);
  c.header("X-Request-ID", id);
  await next();
};

app.use("*", requestId);
```

### タイミングミドルウェア

```typescript
const timing = async (c: Context, next: Next) => {
  const start = performance.now();
  await next();
  const duration = performance.now() - start;
  c.header("X-Response-Time", `${duration.toFixed(2)}ms`);
};

app.use("*", timing);
```

## ミドルウェアの組み合わせ

```typescript
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { compress } from "hono/compress";

const app = new Hono();

// 順番が重要
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", compress());
app.use("/api/*", cors());
app.use("/api/*", authMiddleware);
```

## 次のステップ

次章では、Context について詳しく学びます。
