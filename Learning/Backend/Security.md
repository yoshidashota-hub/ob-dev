# Web セキュリティ 学習ノート

## 概要

Web アプリケーションのセキュリティは開発の必須要件。OWASP Top 10 を中心に主要な脅威と対策を学ぶ。

## OWASP Top 10 (2021)

1. **Broken Access Control** - アクセス制御の不備
2. **Cryptographic Failures** - 暗号化の失敗
3. **Injection** - インジェクション
4. **Insecure Design** - 安全でない設計
5. **Security Misconfiguration** - セキュリティ設定ミス
6. **Vulnerable Components** - 脆弱なコンポーネント
7. **Authentication Failures** - 認証の失敗
8. **Software/Data Integrity Failures** - 整合性の失敗
9. **Security Logging Failures** - ログ・監視の不備
10. **SSRF** - サーバーサイドリクエストフォージェリ

## XSS (Cross-Site Scripting)

### 脆弱なコード

```typescript
// ❌ 危険
const html = `<div>${userInput}</div>`;
element.innerHTML = html;

// ❌ React でも dangerouslySetInnerHTML は危険
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 対策

```typescript
// ✅ React はデフォルトでエスケープ
return <div>{userInput}</div>;

// ✅ サニタイズが必要な場合
import DOMPurify from "dompurify";
const clean = DOMPurify.sanitize(userInput);

// ✅ CSP ヘッダー設定
// next.config.js
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
  }
];
```

## SQL インジェクション

### 脆弱なコード

```typescript
// ❌ 危険
const query = `SELECT * FROM users WHERE id = '${userId}'`;
await db.query(query);
```

### 対策

```typescript
// ✅ プリペアドステートメント
const user = await prisma.user.findUnique({
  where: { id: userId },
});

// ✅ パラメータバインディング
await db.query("SELECT * FROM users WHERE id = $1", [userId]);
```

## CSRF (Cross-Site Request Forgery)

### 対策

```typescript
// Next.js Server Action は自動的に CSRF 保護あり
"use server";

export async function updateProfile(formData: FormData) {
  // 安全
}

// API Route では手動で対策
// middleware.ts
import { csrf } from "@/lib/csrf";

export async function middleware(request: NextRequest) {
  if (request.method !== "GET") {
    const token = request.headers.get("x-csrf-token");
    if (!csrf.verify(token)) {
      return new Response("Invalid CSRF token", { status: 403 });
    }
  }
}
```

## 認証・認可

### パスワードハッシュ化

```typescript
import bcrypt from "bcrypt";

// ハッシュ化
const hash = await bcrypt.hash(password, 12);

// 検証
const isValid = await bcrypt.compare(password, hash);
```

### JWT

```typescript
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// 署名
const token = await new SignJWT({ userId: user.id })
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("1h")
  .sign(secret);

// 検証
const { payload } = await jwtVerify(token, secret);
```

### NextAuth.js

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await verifyUser(credentials);
        return user ?? null;
      },
    }),
  ],
  session: { strategy: "jwt" },
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## セキュリティヘッダー

```typescript
// next.config.js
const headers = async () => [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=()" },
    ],
  },
];
```

## 入力バリデーション

```typescript
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(50),
});

// バリデーション
const result = userSchema.safeParse(input);
if (!result.success) {
  throw new Error("Invalid input");
}
```

## レート制限

```typescript
// Vercel Edge での例
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too many requests", { status: 429 });
  }
}
```

## ベストプラクティス

1. **最小権限の原則**
2. **深層防御**
3. **入力は常に検証**
4. **出力は常にエスケープ**
5. **依存関係を最新に保つ**
6. **機密情報は環境変数で管理**

## 参考リソース

- [OWASP](https://owasp.org/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
