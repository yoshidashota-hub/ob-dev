# 第6章: マルチランタイム

## 対応ランタイム

```
┌─────────────────────────────────────────────────────┐
│                 Hono Runtimes                        │
│                                                     │
│  Edge                         Server                 │
│  ├── Cloudflare Workers       ├── Node.js           │
│  ├── Vercel Edge Functions    ├── Bun               │
│  ├── Deno Deploy              └── Deno              │
│  └── Fastly Compute                                 │
│                                                     │
│  Serverless                                         │
│  ├── AWS Lambda                                     │
│  └── Lambda@Edge                                    │
└─────────────────────────────────────────────────────┘
```

## Cloudflare Workers

### プロジェクト作成

```bash
npm create hono@latest my-app
# template: cloudflare-workers
```

### 設定

```typescript
// src/index.ts
import { Hono } from "hono";

type Bindings = {
  KV: KVNamespace;
  DB: D1Database;
  BUCKET: R2Bucket;
  API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Cloudflare Workers!");
});

// KV の使用
app.get("/kv/:key", async (c) => {
  const key = c.req.param("key");
  const value = await c.env.KV.get(key);
  return c.json({ key, value });
});

// D1 の使用
app.get("/users", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM users").all();
  return c.json(results);
});

// R2 の使用
app.get("/files/:key", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.BUCKET.get(key);
  if (!object) return c.notFound();
  return new Response(object.body);
});

export default app;
```

### wrangler.toml

```toml
name = "my-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
API_KEY = "your-api-key"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-id"

[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "your-db-id"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-bucket"
```

### デプロイ

```bash
npm run deploy
# または
npx wrangler deploy
```

## Vercel Edge Functions

### プロジェクト作成

```bash
npm create hono@latest my-app
# template: vercel
```

### 設定

```typescript
// api/index.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.get("/hello", (c) => {
  return c.json({ message: "Hello from Vercel!" });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
```

### vercel.json

```json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api" }]
}
```

## Node.js

### プロジェクト作成

```bash
npm create hono@latest my-app
# template: nodejs
```

### 設定

```typescript
// src/index.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Node.js!");
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
```

### package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

## Bun

### プロジェクト作成

```bash
npm create hono@latest my-app
# template: bun
```

### 設定

```typescript
// src/index.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Bun!");
});

export default {
  port: 3000,
  fetch: app.fetch,
};
```

### 実行

```bash
bun run src/index.ts
```

## Deno

### プロジェクト作成

```bash
npm create hono@latest my-app
# template: deno
```

### 設定

```typescript
// main.ts
import { Hono } from "https://deno.land/x/hono/mod.ts";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Deno!");
});

Deno.serve(app.fetch);
```

### 実行

```bash
deno run --allow-net main.ts
```

## AWS Lambda

### プロジェクト作成

```bash
npm create hono@latest my-app
# template: aws-lambda
```

### 設定

```typescript
// src/index.ts
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Lambda!");
});

export const handler = handle(app);
```

### serverless.yml

```yaml
service: my-hono-app

provider:
  name: aws
  runtime: nodejs18.x

functions:
  api:
    handler: dist/index.handler
    events:
      - httpApi: "*"
```

## 環境変数のハンドリング

### 型定義

```typescript
// env.d.ts
type Bindings = {
  // Cloudflare Workers
  KV: KVNamespace;
  DB: D1Database;
  // 環境変数
  API_KEY: string;
  DATABASE_URL: string;
};

type Variables = {
  user: { id: string; name: string };
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();
```

### 各ランタイムでの取得方法

```typescript
// Cloudflare Workers
app.get("/", (c) => {
  const apiKey = c.env.API_KEY;
});

// Node.js / Bun
app.get("/", (c) => {
  const apiKey = process.env.API_KEY;
});

// Deno
app.get("/", (c) => {
  const apiKey = Deno.env.get("API_KEY");
});
```

## ランタイム別の注意点

### Cloudflare Workers

```
制限:
- 実行時間: 30秒（有料プランは拡張可能）
- メモリ: 128MB
- リクエストサイズ: 100MB

利点:
- グローバル分散
- 超低レイテンシ
- D1, KV, R2 などの統合サービス
```

### Vercel Edge Functions

```
制限:
- 実行時間: 30秒
- コードサイズ: 1MB

利点:
- Next.js との統合
- 簡単なデプロイ
```

### Node.js

```
利点:
- フルNode.jsエコシステム
- 長時間実行可能
- ファイルシステムアクセス

注意:
- 自前でサーバー管理
```

## 次のステップ

次章では、データベース連携について詳しく学びます。
