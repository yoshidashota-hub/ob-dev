# Hono サンプル集

## 基本的な CRUD

```typescript
// src/index.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

// メモリストア（実際はDBを使用）
let users: User[] = [];

// 型定義
interface User {
  id: string;
  email: string;
  name: string;
}

// バリデーションスキーマ
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const updateUserSchema = createUserSchema.partial();

// Routes
app.get("/users", (c) => {
  return c.json({ data: users });
});

app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  const user = users.find((u) => u.id === id);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json({ data: user });
});

app.post("/users", zValidator("json", createUserSchema), (c) => {
  const data = c.req.valid("json");
  const user: User = { id: crypto.randomUUID(), ...data };
  users.push(user);
  return c.json({ data: user }, 201);
});

app.put("/users/:id", zValidator("json", updateUserSchema), (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return c.json({ error: "User not found" }, 404);
  }
  users[index] = { ...users[index], ...data };
  return c.json({ data: users[index] });
});

app.delete("/users/:id", (c) => {
  const id = c.req.param("id");
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return c.json({ error: "User not found" }, 404);
  }
  users.splice(index, 1);
  return c.body(null, 204);
});

export default app;
```

## ミドルウェア

### ロギング

```typescript
import { Hono } from "hono";
import { logger } from "hono/logger";
import { timing } from "hono/timing";

const app = new Hono();

// ビルトインミドルウェア
app.use("*", logger());
app.use("*", timing());

// カスタムミドルウェア
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  c.header("X-Response-Time", `${duration}ms`);
});
```

### CORS

```typescript
import { cors } from "hono/cors";

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);
```

### 認証

```typescript
import { jwt } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

// JWT 認証
app.use(
  "/api/*",
  jwt({
    secret: process.env.JWT_SECRET!,
  }),
);

// カスタム認証
app.use("/api/*", async (c, next) => {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const payload = await verifyToken(token);
  c.set("user", payload);
  await next();
});

// 認証済みルート
app.get("/api/profile", (c) => {
  const user = c.get("user");
  return c.json({ user });
});
```

## エラーハンドリング

```typescript
import { HTTPException } from "hono/http-exception";

// グローバルエラーハンドラ
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      { error: { code: err.status, message: err.message } },
      err.status,
    );
  }

  console.error(err);
  return c.json(
    { error: { code: 500, message: "Internal Server Error" } },
    500,
  );
});

// Not Found ハンドラ
app.notFound((c) => {
  return c.json({ error: { code: 404, message: "Not Found" } }, 404);
});

// HTTPException の使用
app.get("/users/:id", async (c) => {
  const user = await findUser(c.req.param("id"));
  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }
  return c.json({ data: user });
});
```

## Prisma 統合

```typescript
import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = new Hono();

app.get("/users", async (c) => {
  const users = await prisma.user.findMany();
  return c.json({ data: users });
});

app.post("/users", zValidator("json", createUserSchema), async (c) => {
  const data = c.req.valid("json");
  const user = await prisma.user.create({ data });
  return c.json({ data: user }, 201);
});
```

## Next.js 統合

```typescript
// app/api/[[...route]]/route.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.get("/hello", (c) => c.json({ message: "Hello from Hono!" }));

app.get("/users", async (c) => {
  const users = await prisma.user.findMany();
  return c.json({ data: users });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
```

## OpenAPI / Swagger

```typescript
import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono();

// OpenAPI スキーマ定義
const getUserRoute = createRoute({
  method: "get",
  path: "/users/{id}",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: UserSchema } },
      description: "User found",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "User not found",
    },
  },
});

app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid("param");
  const user = await findUser(id);
  if (!user) return c.json({ error: "Not found" }, 404);
  return c.json(user, 200);
});

// Swagger UI
app.get("/docs", swaggerUI({ url: "/api/openapi" }));
app.doc("/api/openapi", {
  openapi: "3.0.0",
  info: { title: "My API", version: "1.0" },
});
```
