# 12 - Express / Fastify 統合

## この章で学ぶこと

- Express での tRPC セットアップ
- Fastify での tRPC セットアップ
- スタンドアロンサーバーの構築
- CORS とセキュリティ設定

## Express との統合

### インストール

```bash
npm install express @trpc/server cors
npm install -D @types/express @types/cors
```

### 基本的なセットアップ

```typescript
// server/index.ts
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import { createContext } from "./context";

const app = express();

// CORS 設定
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// JSON パーサー
app.use(express.json());

// tRPC ミドルウェア
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`tRPC Error on '${path}':`, error);
    },
  })
);

// ヘルスチェック
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Context の作成

```typescript
// server/context.ts
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { prisma } from "./db";
import { verifyToken } from "./auth";

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  // 認証トークンの検証
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? await verifyToken(token) : null;

  return {
    req,
    res,
    db: prisma,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### 既存の Express アプリへの追加

```typescript
// 既存の Express アプリ
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";

const app = express();

// 既存のルート
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/webhook", express.json(), (req, res) => {
  // Webhook 処理
});

// tRPC を特定のパスにマウント
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// 静的ファイル
app.use(express.static("public"));

app.listen(3000);
```

## Fastify との統合

### インストール

```bash
npm install fastify @trpc/server @fastify/cors @fastify/websocket
```

### 基本的なセットアップ

```typescript
// server/index.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { appRouter, AppRouter } from "./router";
import { createContext } from "./context";

const server = Fastify({
  logger: true,
  maxParamLength: 5000,
});

// CORS 設定
server.register(cors, {
  origin: "http://localhost:3000",
  credentials: true,
});

// tRPC プラグイン
server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      console.error(`tRPC Error on '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

// ヘルスチェック
server.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    await server.listen({ port: 4000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

### Context の作成

```typescript
// server/context.ts
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { prisma } from "./db";

export const createContext = async ({
  req,
  res,
}: CreateFastifyContextOptions) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? await verifyToken(token) : null;

  return {
    req,
    res,
    db: prisma,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### WebSocket サポート（Subscriptions）

```typescript
// server/index.ts
import Fastify from "fastify";
import ws from "@fastify/websocket";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter } from "./router";
import { createContext } from "./context";

const server = Fastify();

// WebSocket プラグイン
server.register(ws);

// tRPC HTTP
server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  useWSS: true, // WebSocket サポートを有効化
  trpcOptions: {
    router: appRouter,
    createContext,
  },
});

server.listen({ port: 4000 });
```

## スタンドアロン HTTP サーバー

### Node.js の http モジュールを使用

```typescript
// server/standalone.ts
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./router";
import { createContext } from "./context";

const server = createHTTPServer({
  router: appRouter,
  createContext,
});

server.listen(4000);
console.log("Server listening on http://localhost:4000");
```

### WebSocket サーバーの追加

```typescript
// server/standalone-ws.ts
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { appRouter } from "./router";
import { createContext } from "./context";

// HTTP サーバー
const server = createHTTPServer({
  router: appRouter,
  createContext,
});

// WebSocket サーバー
const wss = new WebSocketServer({ server });

applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
});

server.listen(4000);
```

## CORS 設定

### Express での詳細設定

```typescript
import cors from "cors";

app.use(cors({
  // 許可するオリジン
  origin: [
    "http://localhost:3000",
    "https://your-domain.com",
  ],
  // または関数で動的に判定
  // origin: (origin, callback) => {
  //   if (allowedOrigins.includes(origin)) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error("Not allowed"));
  //   }
  // },
  
  // 認証情報を含むリクエストを許可
  credentials: true,
  
  // 許可するメソッド
  methods: ["GET", "POST", "OPTIONS"],
  
  // 許可するヘッダー
  allowedHeaders: ["Content-Type", "Authorization"],
  
  // プリフライトのキャッシュ時間
  maxAge: 86400,
}));
```

### Fastify での詳細設定

```typescript
import cors from "@fastify/cors";

server.register(cors, {
  origin: ["http://localhost:3000", "https://your-domain.com"],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
});
```

## セキュリティ設定

### Helmet の使用（Express）

```typescript
import helmet from "helmet";

app.use(helmet());

// CSP の設定
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws://localhost:4000"],
    },
  })
);
```

### Rate Limiting

```typescript
// Express
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: "Too many requests",
});

app.use("/trpc", limiter);

// Fastify
import fastifyRateLimit from "@fastify/rate-limit";

server.register(fastifyRateLimit, {
  max: 100,
  timeWindow: "15 minutes",
});
```

## クライアント設定

### バックエンドサーバー用クライアント

```typescript
// client/trpc.ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server/router";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:4000/trpc",
      headers() {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

// 使用例
const users = await trpc.user.list.query();
await trpc.user.create.mutate({ name: "John", email: "john@example.com" });
```

## Docker での運用

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## まとめ

- Express: `createExpressMiddleware` を使用
- Fastify: `fastifyTRPCPlugin` を使用
- スタンドアロン: `createHTTPServer` を使用
- WebSocket は別途サーバーを作成
- CORS と Rate Limiting でセキュリティを強化
- Docker で本番環境にデプロイ

## 確認問題

1. Express と Fastify での tRPC セットアップの違いを説明してください
2. CORS の credentials オプションの役割は何ですか？
3. Rate Limiting を実装する理由を説明してください
4. WebSocket サーバーを追加する手順を説明してください

## 次の章へ

[13 - Testing](./13-Testing.md) では、tRPC アプリケーションのテスト方法について学びます。
