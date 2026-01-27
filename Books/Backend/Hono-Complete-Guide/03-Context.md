# 第3章: Context

## Context (c) とは

Hono の中心的なオブジェクト。リクエスト情報の取得とレスポンス生成を担当。

```typescript
app.get("/", (c) => {
  // c: Context
  // c.req: リクエスト情報
  // c.res: レスポンス情報
  return c.text("Hello");
});
```

## リクエスト (c.req)

### 基本情報

```typescript
app.get("/info", (c) => {
  return c.json({
    method: c.req.method,         // GET, POST, etc.
    url: c.req.url,               // 完全な URL
    path: c.req.path,             // パス部分
    raw: c.req.raw,               // 生の Request オブジェクト
  });
});
```

### ヘッダー

```typescript
app.get("/headers", (c) => {
  // 単一ヘッダー
  const contentType = c.req.header("Content-Type");
  const auth = c.req.header("Authorization");

  // 大文字小文字を区別しない
  const userAgent = c.req.header("user-agent");

  return c.json({ contentType, auth, userAgent });
});
```

### パラメータ

```typescript
// パスパラメータ
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

// すべてのパラメータ
app.get("/users/:userId/posts/:postId", (c) => {
  const params = c.req.param();
  // { userId: '1', postId: '2' }
  return c.json(params);
});
```

### クエリ

```typescript
app.get("/search", (c) => {
  // 単一値
  const q = c.req.query("q");
  const page = c.req.query("page");

  // すべて取得
  const allQueries = c.req.query();

  // 複数値
  const tags = c.req.queries("tag");

  return c.json({ q, page, tags });
});
```

### ボディ

```typescript
// JSON
app.post("/json", async (c) => {
  const data = await c.req.json();
  return c.json(data);
});

// フォーム
app.post("/form", async (c) => {
  const data = await c.req.parseBody();
  return c.json(data);
});

// テキスト
app.post("/text", async (c) => {
  const text = await c.req.text();
  return c.text(text);
});

// バイナリ
app.post("/binary", async (c) => {
  const buffer = await c.req.arrayBuffer();
  return new Response(buffer);
});
```

### 検証済みデータ

```typescript
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

app.post("/users", zValidator("json", schema), (c) => {
  const data = c.req.valid("json");  // 型安全
  return c.json(data);
});
```

## レスポンス

### テキスト

```typescript
app.get("/text", (c) => {
  return c.text("Hello, World!");
});

// ステータス付き
app.get("/text", (c) => {
  return c.text("Not Found", 404);
});

// ヘッダー付き
app.get("/text", (c) => {
  return c.text("Hello", 200, {
    "X-Custom": "value",
  });
});
```

### JSON

```typescript
app.get("/json", (c) => {
  return c.json({ message: "Hello" });
});

// ステータス付き
app.get("/json", (c) => {
  return c.json({ error: "Not found" }, 404);
});
```

### HTML

```typescript
app.get("/html", (c) => {
  return c.html("<h1>Hello</h1>");
});

// JSX（hono/jsx）
import { jsx } from "hono/jsx";

app.get("/", (c) => {
  return c.html(
    <html>
      <body>
        <h1>Hello</h1>
      </body>
    </html>,
  );
});
```

### リダイレクト

```typescript
app.get("/redirect", (c) => {
  return c.redirect("/new-location");
});

// 永久リダイレクト
app.get("/permanent", (c) => {
  return c.redirect("/new-location", 301);
});
```

### ストリーミング

```typescript
app.get("/stream", (c) => {
  return c.streamText(async (stream) => {
    await stream.write("Hello ");
    await stream.sleep(1000);
    await stream.write("World!");
  });
});

// SSE (Server-Sent Events)
app.get("/sse", (c) => {
  return c.stream(async (stream) => {
    for (let i = 0; i < 10; i++) {
      await stream.write(`data: ${JSON.stringify({ count: i })}\n\n`);
      await stream.sleep(1000);
    }
  }, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});
```

### Body

```typescript
app.get("/body", (c) => {
  return c.body("Raw body content");
});

// バイナリ
app.get("/binary", (c) => {
  const buffer = new Uint8Array([1, 2, 3]);
  return c.body(buffer, 200, {
    "Content-Type": "application/octet-stream",
  });
});
```

### ヘッダー設定

```typescript
app.get("/", (c) => {
  // 単一ヘッダー
  c.header("X-Custom", "value");

  // 複数ヘッダー（append）
  c.header("Set-Cookie", "a=1", { append: true });
  c.header("Set-Cookie", "b=2", { append: true });

  return c.text("Hello");
});
```

### ステータス

```typescript
app.post("/users", (c) => {
  c.status(201);
  return c.json({ id: 1 });
});
```

## 変数の共有 (c.set / c.get)

```typescript
// ミドルウェアで設定
app.use("*", async (c, next) => {
  const user = await getUser(c.req.header("Authorization"));
  c.set("user", user);
  c.set("startTime", Date.now());
  await next();
});

// ルートで取得
app.get("/profile", (c) => {
  const user = c.get("user");
  const startTime = c.get("startTime");
  return c.json({ user, processingTime: Date.now() - startTime });
});
```

### 型安全な変数

```typescript
type Variables = {
  user: { id: string; name: string };
  requestId: string;
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", async (c, next) => {
  c.set("user", { id: "1", name: "John" });  // 型チェックされる
  c.set("requestId", crypto.randomUUID());
  await next();
});

app.get("/", (c) => {
  const user = c.get("user");  // { id: string; name: string }
  return c.json(user);
});
```

## 環境変数 (c.env)

```typescript
// Cloudflare Workers
type Bindings = {
  DATABASE: D1Database;
  KV: KVNamespace;
  API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  const apiKey = c.env.API_KEY;
  return c.text(`API Key: ${apiKey}`);
});
```

## 実行コンテキスト (c.executionCtx)

```typescript
// Cloudflare Workers
app.get("/", (c) => {
  // バックグラウンド処理
  c.executionCtx.waitUntil(
    fetch("https://example.com/analytics", {
      method: "POST",
      body: JSON.stringify({ event: "page_view" }),
    }),
  );

  return c.text("Hello");
});
```

## エラーハンドリング

```typescript
app.get("/error", (c) => {
  try {
    throw new Error("Something went wrong");
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

// グローバルエラーハンドラー
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: err.message }, 500);
});
```

## 次のステップ

次章では、バリデーションについて詳しく学びます。
