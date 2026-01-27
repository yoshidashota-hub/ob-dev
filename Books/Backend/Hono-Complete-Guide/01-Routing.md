# 第1章: ルーティング

## 基本ルーティング

```typescript
import { Hono } from "hono";

const app = new Hono();

// HTTP メソッド
app.get("/", (c) => c.text("GET /"));
app.post("/", (c) => c.text("POST /"));
app.put("/", (c) => c.text("PUT /"));
app.delete("/", (c) => c.text("DELETE /"));
app.patch("/", (c) => c.text("PATCH /"));
app.options("/", (c) => c.text("OPTIONS /"));

// すべてのメソッド
app.all("/all", (c) => c.text(`Method: ${c.req.method}`));

export default app;
```

## パスパラメータ

```typescript
// 単一パラメータ
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

// 複数パラメータ
app.get("/users/:userId/posts/:postId", (c) => {
  const { userId, postId } = c.req.param();
  return c.json({ userId, postId });
});

// オプショナルパラメータ
app.get("/posts/:id?", (c) => {
  const id = c.req.param("id");
  if (id) {
    return c.json({ post: id });
  }
  return c.json({ posts: "all" });
});

// ワイルドカード
app.get("/files/*", (c) => {
  const path = c.req.param("*");
  return c.text(`File path: ${path}`);
});
```

## クエリパラメータ

```typescript
// GET /search?q=hono&page=1
app.get("/search", (c) => {
  const q = c.req.query("q");
  const page = c.req.query("page");
  return c.json({ q, page });
});

// すべてのクエリを取得
app.get("/search", (c) => {
  const queries = c.req.queries();  // { q: ['hono'], page: ['1'] }
  return c.json(queries);
});

// 複数値
// GET /filter?tag=js&tag=ts
app.get("/filter", (c) => {
  const tags = c.req.queries("tag");  // ['js', 'ts']
  return c.json({ tags });
});
```

## リクエストボディ

```typescript
// JSON
app.post("/json", async (c) => {
  const body = await c.req.json();
  return c.json(body);
});

// フォームデータ
app.post("/form", async (c) => {
  const body = await c.req.parseBody();
  return c.json(body);
});

// テキスト
app.post("/text", async (c) => {
  const text = await c.req.text();
  return c.text(text);
});

// ArrayBuffer
app.post("/binary", async (c) => {
  const buffer = await c.req.arrayBuffer();
  return c.body(buffer);
});
```

## ルートグループ

```typescript
const app = new Hono();

// グループ化
const api = new Hono();
api.get("/users", (c) => c.json({ users: [] }));
api.get("/posts", (c) => c.json({ posts: [] }));

app.route("/api", api);
// → /api/users, /api/posts

// basePath
const app = new Hono().basePath("/api/v1");
app.get("/users", (c) => c.json([]));  // /api/v1/users
```

## チェーンメソッド

```typescript
app
  .get("/", (c) => c.text("GET /"))
  .post("/", (c) => c.text("POST /"))
  .put("/", (c) => c.text("PUT /"));

// on メソッド
app.on("GET", "/", (c) => c.text("GET /"));
app.on(["GET", "POST"], "/both", (c) => c.text(c.req.method));
```

## レスポンス

### テキスト

```typescript
app.get("/text", (c) => c.text("Hello, World!"));

// ステータス付き
app.get("/text", (c) => c.text("Not Found", 404));
```

### JSON

```typescript
app.get("/json", (c) => c.json({ message: "Hello" }));

// ステータス付き
app.get("/json", (c) => c.json({ error: "Not Found" }, 404));
```

### HTML

```typescript
app.get("/html", (c) => c.html("<h1>Hello</h1>"));
```

### リダイレクト

```typescript
app.get("/old", (c) => c.redirect("/new"));
app.get("/old", (c) => c.redirect("/new", 301));  // 永久リダイレクト
```

### ヘッダー設定

```typescript
app.get("/", (c) => {
  c.header("X-Custom-Header", "value");
  c.header("Cache-Control", "no-cache");
  return c.text("Hello");
});

// 複数ヘッダー
app.get("/", (c) => {
  return c.text("Hello", 200, {
    "X-Custom": "value",
    "Cache-Control": "no-cache",
  });
});
```

### ステータスコード

```typescript
app.post("/users", (c) => {
  c.status(201);
  return c.json({ id: 1, name: "John" });
});

// または
app.post("/users", (c) => {
  return c.json({ id: 1 }, 201);
});
```

## 正規表現ルート

```typescript
// 数字のみ
app.get("/users/:id{[0-9]+}", (c) => {
  const id = c.req.param("id");
  return c.json({ id: parseInt(id) });
});

// 拡張子マッチ
app.get("/files/:name{.+\\.png$}", (c) => {
  const name = c.req.param("name");
  return c.text(`PNG file: ${name}`);
});
```

## 優先度

```typescript
// 具体的なルートが先に評価される
app.get("/users/me", (c) => c.text("Current user"));
app.get("/users/:id", (c) => c.text(`User ${c.req.param("id")}`));

// 順序も重要
app.get("*", (c) => c.text("Fallback"));  // 最後に定義
```

## Not Found ハンドラー

```typescript
app.notFound((c) => {
  return c.json({ message: "Not Found", path: c.req.path }, 404);
});
```

## 次のステップ

次章では、ミドルウェアについて詳しく学びます。
