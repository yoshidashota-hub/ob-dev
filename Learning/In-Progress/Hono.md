---
created: 2025-11-17
tags:
  - hono
  - typescript
  - web-framework
  - edge-computing
  - cloudflare-workers
  - serverless
status: in-progress
topic: Web Framework
source: https://hono.dev/
---

# Hono - 軽量高速 Web フレームワーク完全ガイド

## 概要

Hono は日本語の「炎」を意味する、軽量で超高速な Web フレームワーク。Cloudflare Workers、Fastly Compute、Deno、Bun、Vercel、AWS Lambda、Node.js など、あらゆる JavaScript ランタイムで動作する。

## 主な特徴

| 特徴                 | 説明                                     |
| -------------------- | ---------------------------------------- |
| **超軽量**           | コアサイズが約 14KB（minified）          |
| **高速**             | ルーターが RegExpRouter で高速マッチング |
| **マルチランタイム** | Cloudflare、Deno、Bun、Node.js 等に対応  |
| **Web 標準**         | Fetch API、Request/Response API ベース   |
| **TypeScript**       | 完全な TypeScript サポート               |
| **ミドルウェア**     | 豊富なビルトインミドルウェア             |

---

## 1. 基本セットアップ

### インストール

```bash
# Node.js
npm create hono@latest my-app

# Bun
bunx create-hono my-app

# Deno
deno run -A npm:create-hono my-app
```

### プロジェクト構成

```
my-hono-app/
├── src/
│   ├── index.ts          # エントリーポイント
│   ├── routes/           # ルート定義
│   │   ├── api.ts
│   │   └── users.ts
│   ├── middleware/       # カスタムミドルウェア
│   │   └── auth.ts
│   └── types/            # 型定義
│       └── index.ts
├── package.json
├── tsconfig.json
└── wrangler.toml         # Cloudflare Workers用
```

### 最小構成

```typescript
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

export default app;
```

---

## 2. ルーティング

### 基本ルーティング

```typescript
import { Hono } from "hono";

const app = new Hono();

// HTTPメソッド
app.get("/users", (c) => c.json({ users: [] }));
app.post("/users", (c) => c.json({ message: "Created" }));
app.put("/users/:id", (c) => c.json({ message: "Updated" }));
app.delete("/users/:id", (c) => c.json({ message: "Deleted" }));

// パスパラメータ
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

// クエリパラメータ
app.get("/search", (c) => {
  const query = c.req.query("q");
  const page = c.req.query("page") || "1";
  return c.json({ query, page });
});

// ワイルドカード
app.get("/files/*", (c) => {
  const path = c.req.param("*");
  return c.text(`File path: ${path}`);
});

// 正規表現パターン
app.get("/post/:date{[0-9]+}/:title{[a-z]+}", (c) => {
  const { date, title } = c.req.param();
  return c.json({ date, title });
});

export default app;
```

### ルートグループ

```typescript
import { Hono } from "hono";

const app = new Hono();

// APIルートグループ
const api = new Hono();

api.get("/users", (c) => c.json({ users: [] }));
api.get("/posts", (c) => c.json({ posts: [] }));

// マウント
app.route("/api/v1", api);

// ベースパス付きHono
const v2 = new Hono().basePath("/api/v2");

v2.get("/users", (c) => c.json({ version: "v2", users: [] }));

app.route("/", v2);

export default app;
```

### チェーンルーティング

```typescript
import { Hono } from "hono";

const app = new Hono();

app
  .get("/endpoint", (c) => c.text("GET"))
  .post((c) => c.text("POST"))
  .put((c) => c.text("PUT"))
  .delete((c) => c.text("DELETE"));

export default app;
```

---

## 3. Context（コンテキスト）

### リクエスト処理

```typescript
import { Hono } from "hono";

const app = new Hono();

app.post("/users", async (c) => {
  // JSONボディ
  const body = await c.req.json();

  // フォームデータ
  const formData = await c.req.formData();

  // ヘッダー
  const authHeader = c.req.header("Authorization");
  const contentType = c.req.header("Content-Type");

  // クエリパラメータ（複数取得）
  const queries = c.req.queries("tag");

  // パスパラメータ（複数）
  const params = c.req.param();

  // URLオブジェクト
  const url = new URL(c.req.url);

  // メソッド
  const method = c.req.method;

  return c.json({ body, method });
});

export default app;
```

### レスポンス生成

```typescript
import { Hono } from "hono";

const app = new Hono();

// テキスト
app.get("/text", (c) => c.text("Hello"));

// JSON
app.get("/json", (c) => c.json({ message: "Hello" }));

// HTML
app.get("/html", (c) => c.html("<h1>Hello</h1>"));

// カスタムステータス
app.get("/created", (c) => c.json({ id: 1 }, 201));

// リダイレクト
app.get("/redirect", (c) => c.redirect("/new-location"));
app.get("/redirect-permanent", (c) => c.redirect("/new-location", 301));

// カスタムヘッダー
app.get("/custom-header", (c) => {
  c.header("X-Custom", "value");
  c.header("Cache-Control", "no-cache");
  return c.json({ data: "test" });
});

// ストリーミング
app.get("/stream", (c) => {
  return c.streamText(async (stream) => {
    for (let i = 0; i < 3; i++) {
      await stream.write(`data: ${i}\n\n`);
      await stream.sleep(1000);
    }
  });
});

// Not Found
app.get("/notfound", (c) => c.notFound());

// バイナリ
app.get("/binary", (c) => {
  const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  return c.body(data, {
    headers: { "Content-Type": "application/octet-stream" },
  });
});

export default app;
```

### 変数の設定と取得

```typescript
import { Hono } from "hono";

type Variables = {
  user: { id: string; name: string };
  requestId: string;
};

const app = new Hono<{ Variables: Variables }>();

// ミドルウェアで設定
app.use(async (c, next) => {
  c.set("requestId", crypto.randomUUID());
  await next();
});

// ルートで取得
app.get("/request-id", (c) => {
  const requestId = c.get("requestId");
  return c.json({ requestId });
});

export default app;
```

---

## 4. ミドルウェア

### ビルトインミドルウェア

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { compress } from "hono/compress";
import { etag } from "hono/etag";
import { basicAuth } from "hono/basic-auth";
import { bearerAuth } from "hono/bearer-auth";
import { jwt } from "hono/jwt";
import { cache } from "hono/cache";

const app = new Hono();

// ロガー
app.use("*", logger());

// CORS
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "https://example.com"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["X-Custom-Header"],
    maxAge: 600,
    credentials: true,
  })
);

// セキュリティヘッダー
app.use("*", secureHeaders());

// 圧縮
app.use("*", compress());

// ETag
app.use("/static/*", etag());

// Pretty JSON（開発用）
app.use("*", prettyJSON());

// Basic認証
app.use(
  "/admin/*",
  basicAuth({
    username: "admin",
    password: "secret",
  })
);

// Bearer認証
app.use(
  "/api/*",
  bearerAuth({
    token: "your-token",
  })
);

// JWT認証
app.use(
  "/protected/*",
  jwt({
    secret: "your-secret-key",
  })
);

// キャッシュ（Cloudflare Workers用）
app.get(
  "/cached",
  cache({
    cacheName: "my-cache",
    cacheControl: "max-age=3600",
  })
);

export default app;
```

### カスタムミドルウェア

```typescript
import { Hono, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

// シンプルなロギング
const customLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  console.log(`--> ${c.req.method} ${c.req.url}`);

  await next();

  const ms = Date.now() - start;
  console.log(`<-- ${c.req.method} ${c.req.url} ${c.res.status} ${ms}ms`);
};

// 認証チェック
const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  // トークン検証ロジック
  const user = await verifyToken(token);
  if (!user) {
    throw new HTTPException(403, { message: "Invalid token" });
  }

  c.set("user", user);
  await next();
};

// レート制限
const rateLimiter = (limit: number, window: number): MiddlewareHandler => {
  const requests = new Map<string, number[]>();

  return async (c, next) => {
    const ip = c.req.header("CF-Connecting-IP") || "unknown";
    const now = Date.now();
    const windowStart = now - window;

    const userRequests = requests.get(ip) || [];
    const recentRequests = userRequests.filter((time) => time > windowStart);

    if (recentRequests.length >= limit) {
      throw new HTTPException(429, { message: "Too many requests" });
    }

    recentRequests.push(now);
    requests.set(ip, recentRequests);

    await next();
  };
};

// タイミングヘッダー
const timing: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const end = performance.now();
  c.res.headers.set("Server-Timing", `total;dur=${end - start}`);
};

app.use("*", customLogger);
app.use("*", timing);
app.use("/api/*", rateLimiter(100, 60000)); // 100 requests per minute
app.use("/protected/*", authMiddleware);

async function verifyToken(token: string) {
  // トークン検証ロジック
  return { id: "1", name: "User" };
}

export default app;
```

### エラーハンドリング

```typescript
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

// カスタムエラーハンドラー
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
    },
    500
  );
});

// Not Foundハンドラー
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      path: c.req.url,
    },
    404
  );
});

// HTTPExceptionの使用
app.get("/error", (c) => {
  throw new HTTPException(400, { message: "Bad Request" });
});

// カスタムエラーレスポンス
app.get("/custom-error", (c) => {
  const errorResponse = new Response(
    JSON.stringify({ error: "Custom Error", code: "E001" }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
  throw new HTTPException(400, { res: errorResponse });
});

export default app;
```

---

## 5. バリデーション

### Zod を使用したバリデーション

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

// スキーマ定義
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive()),
  limit: z.string().transform(Number).pipe(z.number().max(100)),
});

const paramSchema = z.object({
  id: z.string().uuid(),
});

// JSONボディのバリデーション
app.post("/users", zValidator("json", userSchema), (c) => {
  const data = c.req.valid("json");
  return c.json({ user: data });
});

// クエリパラメータのバリデーション
app.get("/users", zValidator("query", querySchema), (c) => {
  const { page, limit } = c.req.valid("query");
  return c.json({ page, limit });
});

// パスパラメータのバリデーション
app.get("/users/:id", zValidator("param", paramSchema), (c) => {
  const { id } = c.req.valid("param");
  return c.json({ id });
});

// カスタムエラーハンドリング
const customValidator = zValidator("json", userSchema, (result, c) => {
  if (!result.success) {
    return c.json(
      {
        error: "Validation failed",
        details: result.error.issues,
      },
      400
    );
  }
});

app.post("/users/custom", customValidator, (c) => {
  const data = c.req.valid("json");
  return c.json({ user: data });
});

export default app;
```

### Valibot を使用したバリデーション

```typescript
import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import * as v from "valibot";

const app = new Hono();

const userSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
});

app.post("/users", vValidator("json", userSchema), (c) => {
  const data = c.req.valid("json");
  return c.json({ user: data });
});

export default app;
```

---

## 6. 型安全な API

### 型定義付きアプリケーション

```typescript
import { Hono } from "hono";

// 環境変数の型
type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  SECRET: string;
};

// コンテキスト変数の型
type Variables = {
  user: {
    id: string;
    email: string;
    role: "admin" | "user";
  };
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// 環境変数へのアクセス
app.get("/config", (c) => {
  const secret = c.env.SECRET; // 型安全
  return c.json({ hasSecret: !!secret });
});

// D1データベースへのアクセス
app.get("/users", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM users").all();
  return c.json(result);
});

// KVストアへのアクセス
app.get("/cache/:key", async (c) => {
  const key = c.req.param("key");
  const value = await c.env.KV.get(key);
  return c.json({ key, value });
});

export default app;
```

### RPC クライアント

```typescript
// server.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono()
  .get("/users", (c) => c.json({ users: [{ id: "1", name: "John" }] }))
  .post(
    "/users",
    zValidator(
      "json",
      z.object({
        name: z.string(),
        email: z.string().email(),
      })
    ),
    (c) => {
      const data = c.req.valid("json");
      return c.json({ user: { id: "2", ...data } }, 201);
    }
  )
  .get("/users/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ user: { id, name: "John" } });
  });

export type AppType = typeof app;
export default app;
```

```typescript
// client.ts
import { hc } from "hono/client";
import type { AppType } from "./server";

const client = hc<AppType>("http://localhost:3000");

// 型安全なAPIコール
async function main() {
  // GET /users
  const usersRes = await client.users.$get();
  const { users } = await usersRes.json();
  // users は { id: string; name: string }[] 型

  // POST /users
  const createRes = await client.users.$post({
    json: {
      name: "Jane",
      email: "jane@example.com",
    },
  });
  const { user } = await createRes.json();

  // GET /users/:id
  const userRes = await client.users[":id"].$get({
    param: { id: "1" },
  });
  const userData = await userRes.json();
}
```

---

## 7. テスト

### 基本的なテスト

```typescript
// app.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello"));
app.get("/json", (c) => c.json({ message: "Hello" }));
app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json({ user: body }, 201);
});

export default app;
```

```typescript
// app.test.ts
import { describe, it, expect } from "vitest";
import app from "./app";

describe("Hono App", () => {
  it("GET / returns text", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello");
  });

  it("GET /json returns JSON", async () => {
    const res = await app.request("/json");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    const data = await res.json();
    expect(data).toEqual({ message: "Hello" });
  });

  it("POST /users creates user", async () => {
    const res = await app.request("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John", email: "john@example.com" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user.name).toBe("John");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await app.request("/unknown");
    expect(res.status).toBe(404);
  });
});
```

### ミドルウェアのテスト

```typescript
// middleware.test.ts
import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const authMiddleware = async (c: any, next: any) => {
  const token = c.req.header("Authorization");
  if (!token) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  c.set("userId", "123");
  await next();
};

describe("Auth Middleware", () => {
  const app = new Hono();
  app.use("/protected/*", authMiddleware);
  app.get("/protected/data", (c) => {
    const userId = c.get("userId");
    return c.json({ userId });
  });

  it("allows request with token", async () => {
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Bearer token" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userId).toBe("123");
  });

  it("rejects request without token", async () => {
    const res = await app.request("/protected/data");
    expect(res.status).toBe(401);
  });
});
```

---

## 8. デプロイメント

### Cloudflare Workers

```toml
# wrangler.toml
name = "my-hono-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
API_KEY = "your-api-key"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"
```

```typescript
// src/index.ts
import { Hono } from "hono";

type Bindings = {
  CACHE: KVNamespace;
  DB: D1Database;
  API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Hello from Workers!"));

export default app;
```

```bash
# デプロイ
npx wrangler deploy

# ローカル開発
npx wrangler dev
```

### Vercel

```json
// package.json
{
  "scripts": {
    "build": "esbuild --bundle src/index.ts --outdir=dist --platform=node --format=esm"
  }
}
```

```typescript
// src/index.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.get("/hello", (c) => c.json({ message: "Hello from Vercel!" }));

export const GET = handle(app);
export const POST = handle(app);
```

### Node.js

```typescript
// src/index.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Node.js!"));

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Listening on http://localhost:${info.port}`);
  }
);
```

### Bun

```typescript
// src/index.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Bun!"));

export default {
  port: 3000,
  fetch: app.fetch,
};
```

```bash
bun run src/index.ts
```

### Deno

```typescript
// main.ts
import { Hono } from "npm:hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Deno!"));

Deno.serve(app.fetch);
```

```bash
deno run --allow-net main.ts
```

---

## 9. 実践パターン

### RESTful API

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

// 型定義
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// スキーマ
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const updateUserSchema = createUserSchema.partial();

// サービス層
class UserService {
  private users: Map<string, User> = new Map();

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async create(data: z.infer<typeof createUserSchema>): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(
    id: string,
    data: z.infer<typeof updateUserSchema>
  ): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
}

// コントローラー
const userService = new UserService();

const usersApp = new Hono()
  // GET /users
  .get("/", async (c) => {
    const users = await userService.findAll();
    return c.json({ users });
  })
  // GET /users/:id
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const user = await userService.findById(id);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ user });
  })
  // POST /users
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const data = c.req.valid("json");
    const user = await userService.create(data);
    return c.json({ user }, 201);
  })
  // PUT /users/:id
  .put("/:id", zValidator("json", updateUserSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = await userService.update(id, data);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ user });
  })
  // DELETE /users/:id
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const deleted = await userService.delete(id);
    if (!deleted) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ message: "Deleted" });
  });

export default usersApp;
```

### 認証システム

```typescript
import { Hono } from "hono";
import { jwt, sign, verify } from "hono/jwt";
import { setCookie, getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

const JWT_SECRET = "your-secret-key";

// ユーザー認証
app.post("/auth/login", async (c) => {
  const { email, password } = await c.req.json();

  // ユーザー検証（実際にはDBから取得）
  const user = await validateUser(email, password);
  if (!user) {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  // JWTトークン生成
  const token = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24時間
    },
    JWT_SECRET
  );

  // HttpOnly Cookieに設定
  setCookie(c, "token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return c.json({
    message: "Logged in",
    user: { id: user.id, email: user.email },
  });
});

// ログアウト
app.post("/auth/logout", (c) => {
  setCookie(c, "token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 0,
    path: "/",
  });
  return c.json({ message: "Logged out" });
});

// JWT認証ミドルウェア（Cookieから）
const cookieAuth = async (c: any, next: any) => {
  const token = getCookie(c, "token");
  if (!token) {
    throw new HTTPException(401, { message: "Not authenticated" });
  }

  try {
    const payload = await verify(token, JWT_SECRET);
    c.set("jwtPayload", payload);
  } catch (e) {
    throw new HTTPException(401, { message: "Invalid token" });
  }

  await next();
};

// 保護されたルート
app.use("/api/*", cookieAuth);

app.get("/api/me", (c) => {
  const payload = c.get("jwtPayload");
  return c.json({ user: payload });
});

// ロールベースアクセス制御
const requireRole = (role: string) => async (c: any, next: any) => {
  const payload = c.get("jwtPayload");
  if (payload.role !== role) {
    throw new HTTPException(403, { message: "Forbidden" });
  }
  await next();
};

app.get("/api/admin", requireRole("admin"), (c) => {
  return c.json({ message: "Admin area" });
});

async function validateUser(email: string, password: string) {
  // 実際にはDBで検証
  if (email === "admin@example.com" && password === "password") {
    return { id: "1", email, role: "admin" };
  }
  return null;
}

export default app;
```

### ファイルアップロード

```typescript
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

app.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    throw new HTTPException(400, { message: "No file provided" });
  }

  // ファイル情報
  const { name, size, type } = file;

  // サイズ制限チェック
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (size > maxSize) {
    throw new HTTPException(400, { message: "File too large" });
  }

  // MIMEタイプチェック
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(type)) {
    throw new HTTPException(400, { message: "Invalid file type" });
  }

  // ファイル内容を取得
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // ストレージに保存（例：Cloudflare R2）
  // await c.env.BUCKET.put(name, buffer)

  return c.json({
    message: "File uploaded",
    file: { name, size, type },
  });
});

// 複数ファイルアップロード
app.post("/upload-multiple", async (c) => {
  const body = await c.req.parseBody({ all: true });
  const files = body["files"];

  if (!files) {
    throw new HTTPException(400, { message: "No files provided" });
  }

  const fileArray = Array.isArray(files) ? files : [files];
  const uploadedFiles = [];

  for (const file of fileArray) {
    if (file instanceof File) {
      uploadedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
  }

  return c.json({ files: uploadedFiles });
});

export default app;
```

---

## 10. JSX レンダリング

### Hono JSX

```typescript
import { Hono } from "hono";
import { html } from "hono/html";

const app = new Hono();

// テンプレートリテラル
app.get("/html", (c) => {
  const name = "World";
  return c.html(html`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hono App</title>
      </head>
      <body>
        <h1>Hello ${name}!</h1>
      </body>
    </html>
  `);
});

export default app;
```

```tsx
// JSXコンポーネント
/** @jsx jsx */
import { Hono } from "hono";
import { jsx } from "hono/jsx";

const app = new Hono();

const Layout = ({ children, title }: { children: any; title: string }) => (
  <html>
    <head>
      <title>{title}</title>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body>{children}</body>
  </html>
);

const UserCard = ({ user }: { user: { name: string; email: string } }) => (
  <div class="user-card">
    <h2>{user.name}</h2>
    <p>{user.email}</p>
  </div>
);

app.get("/", (c) => {
  const users = [
    { name: "John", email: "john@example.com" },
    { name: "Jane", email: "jane@example.com" },
  ];

  return c.html(
    <Layout title="Users">
      <h1>User List</h1>
      {users.map((user) => (
        <UserCard user={user} />
      ))}
    </Layout>
  );
});

export default app;
```

---

## 11. パフォーマンス最適化

### ルーターの選択

```typescript
import { Hono } from "hono";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { TrieRouter } from "hono/router/trie-router";
import { SmartRouter } from "hono/router/smart-router";
import { LinearRouter } from "hono/router/linear-router";
import { PatternRouter } from "hono/router/pattern-router";

// デフォルト（SmartRouter）
const app1 = new Hono();

// RegExpRouter（最速、パターンマッチング）
const app2 = new Hono({ router: new RegExpRouter() });

// TrieRouter（動的ルート向け）
const app3 = new Hono({ router: new TrieRouter() });

// LinearRouter（少ないルート向け）
const app4 = new Hono({ router: new LinearRouter() });
```

### キャッシング戦略

```typescript
import { Hono } from "hono";

type Bindings = {
  CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// インメモリキャッシュ
const cache = new Map<string, { data: any; expires: number }>();

const cacheMiddleware = (ttl: number) => async (c: any, next: any) => {
  const key = c.req.url;
  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return c.json(cached.data);
  }

  await next();

  // レスポンスをキャッシュ
  const body = await c.res.clone().json();
  cache.set(key, {
    data: body,
    expires: Date.now() + ttl,
  });
};

app.get("/cached-data", cacheMiddleware(60000), async (c) => {
  // 重い処理
  const data = await heavyComputation();
  return c.json(data);
});

// KVを使用したキャッシュ
app.get("/kv-cached/:key", async (c) => {
  const key = c.req.param("key");
  const cacheKey = `cache:${key}`;

  // KVからチェック
  const cached = await c.env.CACHE.get(cacheKey, "json");
  if (cached) {
    c.header("X-Cache", "HIT");
    return c.json(cached);
  }

  // データ取得
  const data = await fetchData(key);

  // KVに保存（1時間TTL）
  await c.env.CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: 3600,
  });

  c.header("X-Cache", "MISS");
  return c.json(data);
});

async function heavyComputation() {
  return { result: "computed" };
}

async function fetchData(key: string) {
  return { key, data: "fetched" };
}

export default app;
```

---

## 12. 開発ツール

### 開発サーバー

```json
// package.json
{
  "scripts": {
    "dev": "wrangler dev",
    "dev:node": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

### OpenAPI/Swagger

```typescript
import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";

const app = new Hono();

// OpenAPI仕様
const openAPISpec = {
  openapi: "3.0.0",
  info: {
    title: "My API",
    version: "1.0.0",
  },
  paths: {
    "/users": {
      get: {
        summary: "Get all users",
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// OpenAPI仕様を提供
app.get("/openapi", (c) => c.json(openAPISpec));

// Swagger UIを提供
app.get("/docs", swaggerUI({ url: "/openapi" }));

export default app;
```

---

## 学習リソース

### 公式ドキュメント

| リソース   | URL                                  | 内容                 |
| ---------- | ------------------------------------ | -------------------- |
| 公式サイト | https://hono.dev/                    | ドキュメント、ガイド |
| GitHub     | https://github.com/honojs/hono       | ソースコード         |
| Examples   | https://github.com/honojs/examples   | 実装例               |
| Middleware | https://github.com/honojs/middleware | 公式ミドルウェア     |

### 推奨学習パス

#### 初級（1-2 週間）

1. **環境構築**

   - Node.js、Bun、または Cloudflare Workers でプロジェクト作成
   - TypeScript 設定

2. **基本概念**

   - ルーティング（GET、POST、PUT、DELETE）
   - コンテキスト（Request、Response）
   - 基本的なミドルウェア（logger、cors）

3. **実践課題**
   - シンプルな CRUD API
   - JSON レスポンス
   - エラーハンドリング

#### 中級（2-3 週間）

1. **高度なルーティング**

   - グループ化とマウント
   - パラメータバリデーション
   - ワイルドカードルート

2. **ミドルウェア深掘り**

   - カスタムミドルウェア作成
   - 認証（JWT、Basic）
   - レート制限

3. **バリデーション**

   - Zod との統合
   - 型安全なリクエスト/レスポンス
   - カスタムエラーハンドリング

4. **実践課題**
   - 認証付き API
   - ファイルアップロード
   - WebSocket（サポートされる環境で）

#### 上級（3-4 週間）

1. **マルチランタイム展開**

   - Cloudflare Workers（KV、D1、R2）
   - Vercel Edge Functions
   - AWS Lambda

2. **パフォーマンス最適化**

   - ルーター選択
   - キャッシング戦略
   - ストリーミングレスポンス

3. **本番運用**

   - モニタリング
   - ログ集約
   - エラートラッキング

4. **高度な機能**
   - RPC クライアント生成
   - OpenAPI 統合
   - マイクロサービス構成

---

## NestJS との比較

| 特徴               | Hono                | NestJS           |
| ------------------ | ------------------- | ---------------- |
| **サイズ**         | ~14KB               | 数 MB            |
| **パラダイム**     | 関数型              | OOP/DI           |
| **学習曲線**       | 緩やか              | 急峻             |
| **ランタイム**     | マルチ（Edge 対応） | Node.js 中心     |
| **型安全**         | 軽量な型付け        | デコレータベース |
| **ユースケース**   | API、Edge Functions | エンタープライズ |
| **パフォーマンス** | 超高速              | 中程度           |
| **エコシステム**   | 成長中              | 成熟             |

### いつ Hono を選ぶか

- エッジコンピューティング（Cloudflare Workers 等）
- 軽量で高速な API が必要
- シンプルな構成を好む
- マルチランタイム対応が必要

### いつ NestJS を選ぶか

- 大規模エンタープライズアプリケーション
- 複雑な DI 構造が必要
- GraphQL、Microservices の統合
- 厳格なアーキテクチャパターン

---

## 次のステップ

1. **プロジェクト作成**

   ```bash
   npm create hono@latest my-api
   ```

2. **基本的な CRUD API を実装**

3. **Cloudflare Workers にデプロイ**

4. **バリデーションとエラーハンドリングを追加**

5. **RPC クライアントで型安全なフロントエンド連携**
