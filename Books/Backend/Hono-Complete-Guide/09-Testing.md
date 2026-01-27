# 第9章: テスト

## テスト環境のセットアップ

### Vitest

```bash
npm install -D vitest
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "miniflare",  // Cloudflare Workers
  },
});
```

### Jest

```bash
npm install -D jest @types/jest ts-jest
```

```javascript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
};
```

## 基本的なテスト

### Hono の testClient

```typescript
// src/index.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello!"));
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id, name: "John" });
});
app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json(body, 201);
});

export default app;
```

```typescript
// src/index.test.ts
import { describe, it, expect } from "vitest";
import app from "./index";

describe("Basic routes", () => {
  it("GET / should return Hello!", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello!");
  });

  it("GET /users/:id should return user", async () => {
    const res = await app.request("/users/1");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ id: "1", name: "John" });
  });

  it("POST /users should create user", async () => {
    const res = await app.request("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane", email: "jane@example.com" }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.name).toBe("Jane");
  });
});
```

## ヘッダーと認証のテスト

```typescript
describe("Authentication", () => {
  it("should return 401 without auth header", async () => {
    const res = await app.request("/api/protected");
    expect(res.status).toBe(401);
  });

  it("should return 200 with valid token", async () => {
    const res = await app.request("/api/protected", {
      headers: {
        Authorization: "Bearer valid-token",
      },
    });
    expect(res.status).toBe(200);
  });

  it("should return 403 for unauthorized role", async () => {
    const res = await app.request("/api/admin", {
      headers: {
        Authorization: "Bearer user-token",
      },
    });
    expect(res.status).toBe(403);
  });
});
```

## モック

### 環境変数のモック

```typescript
import { Hono } from "hono";

type Bindings = {
  API_KEY: string;
  KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text(`API Key: ${c.env.API_KEY}`);
});

// テスト
describe("With mocked env", () => {
  it("should use mocked API_KEY", async () => {
    const mockEnv = {
      API_KEY: "test-api-key",
    };

    const res = await app.request("/", {}, mockEnv);
    expect(await res.text()).toBe("API Key: test-api-key");
  });
});
```

### KV のモック

```typescript
const createMockKV = () => {
  const store = new Map<string, string>();

  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({
      keys: Array.from(store.keys()).map((name) => ({ name })),
    }),
  } as unknown as KVNamespace;
};

describe("KV operations", () => {
  it("should store and retrieve data", async () => {
    const mockKV = createMockKV();
    const mockEnv = { KV: mockKV };

    // PUT
    const putRes = await app.request(
      "/cache/test-key",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "test" }),
      },
      mockEnv,
    );
    expect(putRes.status).toBe(200);

    // GET
    const getRes = await app.request("/cache/test-key", {}, mockEnv);
    expect(getRes.status).toBe(200);
    expect(await getRes.json()).toEqual({ data: "test" });
  });
});
```

### D1 のモック

```typescript
const createMockD1 = () => {
  const data: Record<string, any[]> = {
    users: [],
  };

  return {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        all: async () => ({ results: data.users }),
        first: async () => data.users[0] || null,
        run: async () => {
          if (sql.includes("INSERT")) {
            const id = data.users.length + 1;
            data.users.push({ id, ...params });
            return { meta: { last_row_id: id } };
          }
          return {};
        },
      }),
    }),
  } as unknown as D1Database;
};
```

## 統合テスト

```typescript
describe("User API Integration", () => {
  let userId: string;

  it("should create a user", async () => {
    const res = await app.request("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
      }),
    });

    expect(res.status).toBe(201);
    const user = await res.json();
    expect(user).toHaveProperty("id");
    userId = user.id;
  });

  it("should get the created user", async () => {
    const res = await app.request(`/users/${userId}`);
    expect(res.status).toBe(200);
    const user = await res.json();
    expect(user.name).toBe("Test User");
  });

  it("should update the user", async () => {
    const res = await app.request(`/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated User" }),
    });

    expect(res.status).toBe(200);
  });

  it("should delete the user", async () => {
    const res = await app.request(`/users/${userId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
  });

  it("should return 404 for deleted user", async () => {
    const res = await app.request(`/users/${userId}`);
    expect(res.status).toBe(404);
  });
});
```

## バリデーションのテスト

```typescript
describe("Validation", () => {
  it("should reject invalid email", async () => {
    const res = await app.request("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test",
        email: "invalid-email",
      }),
    });

    expect(res.status).toBe(400);
    const error = await res.json();
    expect(error.errors).toBeDefined();
  });

  it("should reject missing required fields", async () => {
    const res = await app.request("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
```

## ミドルウェアのテスト

```typescript
import { Hono, Next, Context } from "hono";

const loggingMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  c.header("X-Response-Time", `${duration}ms`);
};

describe("Middleware", () => {
  const app = new Hono();
  app.use("*", loggingMiddleware);
  app.get("/", (c) => c.text("OK"));

  it("should add X-Response-Time header", async () => {
    const res = await app.request("/");
    expect(res.headers.get("X-Response-Time")).toMatch(/\d+ms/);
  });
});
```

## テストユーティリティ

```typescript
// test/helpers.ts
export const createTestApp = (bindings?: Partial<Bindings>) => {
  const mockEnv = {
    API_KEY: "test-key",
    KV: createMockKV(),
    DB: createMockD1(),
    ...bindings,
  };

  return {
    request: (path: string, init?: RequestInit) =>
      app.request(path, init, mockEnv),
    env: mockEnv,
  };
};

// 使用
describe("With test helper", () => {
  const { request } = createTestApp();

  it("should work", async () => {
    const res = await request("/");
    expect(res.status).toBe(200);
  });
});
```

## 次のステップ

次章では、ベストプラクティスについて詳しく学びます。
