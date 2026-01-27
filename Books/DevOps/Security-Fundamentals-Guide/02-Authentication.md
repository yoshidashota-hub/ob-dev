# 第2章: 認証・認可

## 認証 vs 認可

```
┌────────────────────────────────────────────────────────────┐
│              認証 (Authentication)                          │
│                                                            │
│  「あなたは誰ですか？」                                     │
│  • ユーザー名/パスワード                                    │
│  • OAuth/OpenID Connect                                    │
│  • 生体認証                                                 │
│  • MFA（多要素認証）                                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              認可 (Authorization)                           │
│                                                            │
│  「あなたは何ができますか？」                                │
│  • ロールベースアクセス制御（RBAC）                         │
│  • 属性ベースアクセス制御（ABAC）                           │
│  • リソースベースアクセス制御                                │
└────────────────────────────────────────────────────────────┘
```

## NextAuth.js の実装

### 基本設定

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // OAuth プロバイダー
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 認証情報プロバイダー
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 認証ミドルウェア

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // 管理者ページは admin ロールのみ
      if (req.nextUrl.pathname.startsWith("/admin")) {
        return token?.role === "admin";
      }
      // その他の保護されたページはログインのみ必要
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/settings/:path*"],
};
```

## JWT の安全な実装

### トークン生成

```typescript
// lib/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function createToken(payload: Record<string, any>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h") // 短い有効期限
    .setIssuer("https://example.com")
    .setAudience("https://example.com")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: "https://example.com",
      audience: "https://example.com",
    });
    return payload;
  } catch {
    return null;
  }
}
```

### リフレッシュトークン

```typescript
// アクセストークン + リフレッシュトークンパターン
interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function createTokenPair(userId: string): Promise<TokenPair> {
  const accessToken = await createToken({
    sub: userId,
    type: "access",
  });

  // リフレッシュトークンは長い有効期限
  const refreshToken = await new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  // リフレッシュトークンをDBに保存（無効化のため）
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const payload = await verifyToken(refreshToken);

  if (!payload || payload.type !== "refresh") {
    return null;
  }

  // DBでトークンの有効性を確認
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    return null;
  }

  return createToken({ sub: payload.sub, type: "access" });
}
```

## MFA（多要素認証）

### TOTP 実装

```typescript
// lib/mfa.ts
import { authenticator } from "otplib";
import QRCode from "qrcode";

// シークレット生成
export function generateMFASecret(): string {
  return authenticator.generateSecret();
}

// QRコード生成
export async function generateMFAQRCode(
  email: string,
  secret: string
): Promise<string> {
  const otpauth = authenticator.keyuri(email, "MyApp", secret);
  return QRCode.toDataURL(otpauth);
}

// コード検証
export function verifyMFACode(secret: string, code: string): boolean {
  return authenticator.verify({ token: code, secret });
}
```

```typescript
// API: MFA セットアップ
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = generateMFASecret();
  const qrCode = await generateMFAQRCode(session.user.email, secret);

  // 仮保存（検証後に確定）
  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaSecretTemp: secret },
  });

  return Response.json({ qrCode, secret });
}

// API: MFA 検証
export async function POST(req: Request) {
  const session = await getSession();
  const { code } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.mfaSecretTemp) {
    return Response.json({ error: "MFA not set up" }, { status: 400 });
  }

  if (!verifyMFACode(user.mfaSecretTemp, code)) {
    return Response.json({ error: "Invalid code" }, { status: 400 });
  }

  // MFA を有効化
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      mfaSecret: user.mfaSecretTemp,
      mfaSecretTemp: null,
      mfaEnabled: true,
    },
  });

  return Response.json({ success: true });
}
```

## ロールベースアクセス制御（RBAC）

```typescript
// lib/rbac.ts
type Permission =
  | "user:read"
  | "user:create"
  | "user:update"
  | "user:delete"
  | "order:read"
  | "order:create"
  | "admin:access";

type Role = "user" | "editor" | "admin";

const rolePermissions: Record<Role, Permission[]> = {
  user: ["order:read", "order:create"],
  editor: ["order:read", "order:create", "user:read", "user:update"],
  admin: [
    "user:read",
    "user:create",
    "user:update",
    "user:delete",
    "order:read",
    "order:create",
    "admin:access",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

// 使用例
export function requirePermission(permission: Permission) {
  return async function (req: Request) {
    const session = await getSession();

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role as Role, permission)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
  };
}
```

## パスワードポリシー

```typescript
// lib/password.ts
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(12, "パスワードは12文字以上必要です")
  .regex(/[a-z]/, "小文字を含む必要があります")
  .regex(/[A-Z]/, "大文字を含む必要があります")
  .regex(/[0-9]/, "数字を含む必要があります")
  .regex(/[^a-zA-Z0-9]/, "特殊文字を含む必要があります");

// 漏洩パスワードチェック（Have I Been Pwned API）
export async function isPasswordBreached(password: string): Promise<boolean> {
  const crypto = await import("crypto");
  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = hash.substring(0, 5);
  const suffix = hash.substring(5);

  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`
  );
  const text = await response.text();

  return text.includes(suffix);
}
```

## 次のステップ

次章では、データ保護と暗号化について学びます。
