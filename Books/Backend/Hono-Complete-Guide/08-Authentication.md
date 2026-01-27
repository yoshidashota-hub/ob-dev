# 第8章: 認証

## JWT 認証

### 基本実装

```typescript
import { Hono } from "hono";
import { jwt, sign, verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

type Bindings = {
  JWT_SECRET: string;
};

type Variables = {
  jwtPayload: { sub: string; email: string; role: string };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ログイン
app.post("/auth/login", async (c) => {
  const { email, password } = await c.req.json();

  // ユーザー検証（実際はDBから取得）
  const user = await verifyCredentials(email, password);
  if (!user) {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  // JWT 生成
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,  // 1時間
  };

  const token = await sign(payload, c.env.JWT_SECRET);

  return c.json({ token, user: { id: user.id, email: user.email } });
});

// JWT ミドルウェア
app.use("/api/*", jwt({ secret: (c) => c.env.JWT_SECRET }));

// 保護されたルート
app.get("/api/profile", (c) => {
  const payload = c.get("jwtPayload");
  return c.json(payload);
});
```

### カスタム JWT ミドルウェア

```typescript
import { verify } from "hono/jwt";

const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing token" });
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set("user", payload);
    await next();
  } catch {
    throw new HTTPException(401, { message: "Invalid token" });
  }
};

app.use("/api/*", authMiddleware);
```

## ロールベース認可

```typescript
type UserRole = "user" | "admin" | "moderator";

const requireRole = (...roles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user || !roles.includes(user.role)) {
      throw new HTTPException(403, { message: "Forbidden" });
    }

    await next();
  };
};

// 使用
app.get("/api/admin/users", requireRole("admin"), (c) => {
  return c.json({ users: [] });
});

app.get("/api/posts", requireRole("user", "admin"), (c) => {
  return c.json({ posts: [] });
});
```

## Refresh Token

```typescript
interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const generateTokens = async (
  user: User,
  secret: string,
): Promise<Tokens> => {
  const accessToken = await sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 15 * 60,  // 15分
    },
    secret,
  );

  const refreshToken = await sign(
    {
      sub: user.id,
      type: "refresh",
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,  // 7日
    },
    secret,
  );

  return { accessToken, refreshToken };
};

// ログイン
app.post("/auth/login", async (c) => {
  const { email, password } = await c.req.json();
  const user = await verifyCredentials(email, password);

  if (!user) {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  const tokens = await generateTokens(user, c.env.JWT_SECRET);

  // Refresh token をDBに保存
  await saveRefreshToken(user.id, tokens.refreshToken);

  return c.json(tokens);
});

// リフレッシュ
app.post("/auth/refresh", async (c) => {
  const { refreshToken } = await c.req.json();

  try {
    const payload = await verify(refreshToken, c.env.JWT_SECRET);

    if (payload.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    // トークンの有効性確認
    const isValid = await validateRefreshToken(payload.sub, refreshToken);
    if (!isValid) {
      throw new Error("Token revoked");
    }

    const user = await getUserById(payload.sub);
    const tokens = await generateTokens(user, c.env.JWT_SECRET);

    // 古いトークンを無効化、新しいトークンを保存
    await rotateRefreshToken(user.id, refreshToken, tokens.refreshToken);

    return c.json(tokens);
  } catch {
    throw new HTTPException(401, { message: "Invalid refresh token" });
  }
});

// ログアウト
app.post("/auth/logout", async (c) => {
  const user = c.get("user");
  await revokeRefreshTokens(user.sub);
  return c.json({ success: true });
});
```

## API キー認証

```typescript
import { bearerAuth } from "hono/bearer-auth";

// シンプルな API キー認証
app.use(
  "/api/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      const apiKey = await c.env.KV.get(`api_key:${token}`);
      return !!apiKey;
    },
  }),
);

// カスタム API キー認証
const apiKeyAuth = async (c: Context, next: Next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    throw new HTTPException(401, { message: "API key required" });
  }

  const keyData = await c.env.KV.get(`api_key:${apiKey}`);
  if (!keyData) {
    throw new HTTPException(401, { message: "Invalid API key" });
  }

  const data = JSON.parse(keyData);
  c.set("apiKeyOwner", data);
  await next();
};

app.use("/api/*", apiKeyAuth);
```

## OAuth (外部プロバイダー)

```typescript
// GitHub OAuth の例
app.get("/auth/github", (c) => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  const redirectUri = `${c.env.APP_URL}/auth/github/callback`;

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "user:email");

  return c.redirect(url.toString());
});

app.get("/auth/github/callback", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    throw new HTTPException(400, { message: "Code required" });
  }

  // アクセストークン取得
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    },
  );

  const { access_token } = await tokenResponse.json();

  // ユーザー情報取得
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const githubUser = await userResponse.json();

  // ユーザー作成または取得
  let user = await findUserByGithubId(githubUser.id);
  if (!user) {
    user = await createUser({
      githubId: githubUser.id,
      email: githubUser.email,
      name: githubUser.name,
    });
  }

  // JWT 生成
  const tokens = await generateTokens(user, c.env.JWT_SECRET);

  // フロントエンドにリダイレクト
  return c.redirect(
    `${c.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}`,
  );
});
```

## セッション管理 (KV)

```typescript
import { v4 as uuidv4 } from "uuid";

const createSession = async (kv: KVNamespace, userId: string) => {
  const sessionId = uuidv4();
  const session = {
    userId,
    createdAt: Date.now(),
  };

  await kv.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: 24 * 60 * 60,  // 24時間
  });

  return sessionId;
};

const getSession = async (kv: KVNamespace, sessionId: string) => {
  const session = await kv.get(`session:${sessionId}`);
  return session ? JSON.parse(session) : null;
};

// ログイン
app.post("/auth/login", async (c) => {
  const { email, password } = await c.req.json();
  const user = await verifyCredentials(email, password);

  if (!user) {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  const sessionId = await createSession(c.env.KV, user.id);

  // Cookie でセッション ID を返す
  c.header(
    "Set-Cookie",
    `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 60 * 60}`,
  );

  return c.json({ user: { id: user.id, email: user.email } });
});

// セッション認証ミドルウェア
const sessionAuth = async (c: Context, next: Next) => {
  const cookie = c.req.header("Cookie");
  const sessionId = cookie?.match(/session=([^;]+)/)?.[1];

  if (!sessionId) {
    throw new HTTPException(401, { message: "Session required" });
  }

  const session = await getSession(c.env.KV, sessionId);
  if (!session) {
    throw new HTTPException(401, { message: "Invalid session" });
  }

  const user = await getUserById(session.userId);
  c.set("user", user);
  await next();
};
```

## 次のステップ

次章では、テストについて詳しく学びます。
