# 16 - Authentication

## 概要

この章では、Next.js での認証実装について学びます。NextAuth.js（Auth.js）を使った認証、JWT、セッション管理などを解説します。

## NextAuth.js（Auth.js）

### インストール

```bash
npm install next-auth@beta
```

### 基本設定

```typescript
// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
});
```

### Route Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

### 環境変数

```bash
# .env.local
AUTH_SECRET=your-secret-key
AUTH_URL=http://localhost:3000

GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

GOOGLE_ID=your-google-id
GOOGLE_SECRET=your-google-secret
```

## セッション管理

### Server Component でセッション取得

```typescript
// app/page.tsx
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return <p>Please sign in</p>;
  }

  return (
    <div>
      <p>Welcome, {session.user?.name}</p>
      <img src={session.user?.image || ""} alt="Avatar" />
    </div>
  );
}
```

### Client Component でセッション取得

```typescript
// components/UserButton.tsx
"use client";

import { useSession } from "next-auth/react";

export function UserButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <a href="/api/auth/signin">Sign in</a>;
  }

  return (
    <div>
      <span>{session.user?.name}</span>
      <a href="/api/auth/signout">Sign out</a>
    </div>
  );
}
```

### SessionProvider

```typescript
// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

```typescript
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## サインイン・サインアウト

### Server Actions

```typescript
// app/actions/auth.ts
"use server";

import { signIn, signOut } from "@/auth";

export async function handleSignIn(provider: string) {
  await signIn(provider, { redirectTo: "/dashboard" });
}

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}
```

### サインインフォーム

```typescript
// components/SignInForm.tsx
import { handleSignIn } from "@/app/actions/auth";

export function SignInForm() {
  return (
    <div className="space-y-4">
      <form action={() => handleSignIn("github")}>
        <button type="submit" className="w-full bg-gray-800 text-white p-2">
          Sign in with GitHub
        </button>
      </form>

      <form action={() => handleSignIn("google")}>
        <button type="submit" className="w-full bg-red-500 text-white p-2">
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
```

## Credentials Provider

### メール/パスワード認証

```typescript
// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
});
```

### ログインフォーム

```typescript
// components/LoginForm.tsx
"use client";

import { useActionState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
    } else {
      window.location.href = "/dashboard";
    }

    setIsPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full border p-2"
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full border p-2"
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-500 text-white p-2"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
```

## ユーザー登録

```typescript
// app/actions/register.ts
"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  // ユーザーが存在するかチェック
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email already registered" };
  }

  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);

  // ユーザーを作成
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { success: true };
}
```

## 保護されたルート

### Middleware での保護

```typescript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnAuth = req.nextUrl.pathname.startsWith("/auth");

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isOnAuth && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
```

### Server Component での保護

```typescript
// app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user?.name}</p>
    </div>
  );
}
```

## カスタムセッション

### セッションの拡張

```typescript
// auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
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
});
```

### 型定義

```typescript
// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
```

## ロールベースアクセス制御

```typescript
// lib/auth.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  return session;
}
```

```typescript
// app/admin/page.tsx
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const session = await requireAdmin();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {session.user.name}</p>
    </div>
  );
}
```

## JWT 認証（カスタム）

### JWT の生成

```typescript
// lib/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signToken(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}
```

### ログイン API

```typescript
// app/api/auth/login/route.ts
import { cookies } from "next/headers";
import { signToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, email: user.email });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7日
  });

  return Response.json({ success: true });
}
```

## まとめ

- **NextAuth.js** で簡単に認証を実装
- **Providers** で OAuth 認証（GitHub, Google など）
- **Credentials** でメール/パスワード認証
- **Session** でユーザー情報を管理
- **Middleware** で保護されたルートを実装
- **JWT** でカスタム認証も可能

## 演習問題

1. GitHub OAuth 認証を実装してください
2. メール/パスワード認証を実装してください
3. ユーザー登録機能を追加してください
4. ロールベースアクセス制御を実装してください

## 次のステップ

次の章では、データベース連携について学びます。

⬅️ 前へ: [15-Middleware.md](./15-Middleware.md)
➡️ 次へ: [17-Database-Integration.md](./17-Database-Integration.md)
