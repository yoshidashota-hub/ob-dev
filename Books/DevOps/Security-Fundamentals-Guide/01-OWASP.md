# 第1章: OWASP Top 10

## OWASP Top 10 (2021)

```
┌────────────────────────────────────────────────────────────┐
│                    OWASP Top 10 2021                        │
│                                                            │
│  A01: アクセス制御の不備                                    │
│  A02: 暗号化の失敗                                         │
│  A03: インジェクション                                      │
│  A04: 安全でない設計                                       │
│  A05: セキュリティの設定ミス                                │
│  A06: 脆弱で古いコンポーネント                              │
│  A07: 識別と認証の失敗                                     │
│  A08: ソフトウェアとデータの整合性の問題                    │
│  A09: セキュリティログとモニタリングの失敗                  │
│  A10: サーバーサイドリクエストフォージェリ (SSRF)           │
└────────────────────────────────────────────────────────────┘
```

## A03: インジェクション

### SQL インジェクション

```typescript
// ❌ 脆弱なコード
async function getUser(userId: string) {
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  return await db.query(query);
  // userId = "'; DROP TABLE users; --" で攻撃可能
}

// ✅ パラメータ化クエリ
async function getUser(userId: string) {
  return await db.query("SELECT * FROM users WHERE id = $1", [userId]);
}

// ✅ Prisma（ORM）
async function getUser(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}
```

### XSS（Cross-Site Scripting）

```typescript
// ❌ 脆弱なコード
function UserComment({ comment }: { comment: string }) {
  return <div dangerouslySetInnerHTML={{ __html: comment }} />;
}

// ✅ 自動エスケープ（React のデフォルト）
function UserComment({ comment }: { comment: string }) {
  return <div>{comment}</div>;
}

// ✅ サニタイズが必要な場合
import DOMPurify from "dompurify";

function SafeHTML({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a"],
    ALLOWED_ATTR: ["href"],
  });
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### コマンドインジェクション

```typescript
// ❌ 脆弱なコード
import { exec } from "child_process";

function processFile(filename: string) {
  exec(`convert ${filename} output.pdf`);
  // filename = "test.jpg; rm -rf /" で攻撃可能
}

// ✅ 引数を配列で渡す
import { execFile } from "child_process";

function processFile(filename: string) {
  // バリデーション
  if (!/^[\w.-]+$/.test(filename)) {
    throw new Error("Invalid filename");
  }

  execFile("convert", [filename, "output.pdf"]);
}
```

## A01: アクセス制御の不備

### IDOR（Insecure Direct Object Reference）

```typescript
// ❌ 脆弱なコード（誰でも任意のユーザーの注文を見れる）
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  return Response.json(order);
}

// ✅ 所有権チェック
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id");

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      userId: session.user.id, // 所有権チェック
    },
  });

  if (!order) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(order);
}
```

### 権限チェック

```typescript
// lib/auth.ts
export function requireRole(allowedRoles: string[]) {
  return async function middleware(req: Request) {
    const session = await getSession();

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!allowedRoles.includes(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return null; // 続行
  };
}

// 使用例
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const authError = await requireRole(["admin"])(req);
  if (authError) return authError;

  await prisma.user.delete({ where: { id: params.id } });
  return Response.json({ success: true });
}
```

## A02: 暗号化の失敗

### パスワードのハッシュ化

```typescript
// ❌ 平文保存（絶対にダメ）
await prisma.user.create({
  data: { email, password },
});

// ❌ 弱いハッシュ（MD5, SHA1）
import crypto from "crypto";
const hash = crypto.createHash("md5").update(password).digest("hex");

// ✅ bcrypt を使用
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 機密データの暗号化

```typescript
// lib/encryption.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

## A05: セキュリティの設定ミス

### セキュリティヘッダー

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};
```

### エラーメッセージ

```typescript
// ❌ 詳細すぎるエラー
catch (error) {
  return Response.json({
    error: error.message,
    stack: error.stack,
    query: sql,
  }, { status: 500 });
}

// ✅ 本番環境では一般的なメッセージ
catch (error) {
  console.error("Internal error:", error); // ログには記録

  return Response.json({
    error: process.env.NODE_ENV === "development"
      ? error.message
      : "Internal server error",
  }, { status: 500 });
}
```

## A08: CSRF（Cross-Site Request Forgery）

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Origin/Referer チェック
  const origin = request.headers.get("origin");
  const allowedOrigins = ["https://example.com"];

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (!origin || !allowedOrigins.includes(origin)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return NextResponse.next();
}
```

```typescript
// CSRF トークンを使用
import { createHash, randomBytes } from "crypto";

export function generateCSRFToken(sessionId: string): string {
  const secret = process.env.CSRF_SECRET!;
  const token = randomBytes(32).toString("hex");

  return createHash("sha256")
    .update(`${sessionId}${secret}${token}`)
    .digest("hex");
}

export function validateCSRFToken(token: string, sessionId: string): boolean {
  const expected = generateCSRFToken(sessionId);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
```

## 次のステップ

次章では、認証・認可の実装について詳しく学びます。
