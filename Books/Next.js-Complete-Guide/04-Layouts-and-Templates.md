# 04 - Layouts and Templates

## 概要

この章では、Next.js のレイアウトシステムについて詳しく学びます。レイアウトとテンプレートの違い、ネストされたレイアウト、そして実践的なパターンを解説します。

## レイアウトの基本

### layout.tsx とは

`layout.tsx` は複数のページで共有される UI です:

- ナビゲーションバー
- サイドバー
- フッター
- 認証状態の管理
- テーマプロバイダー

### ルートレイアウト（必須）

`app/layout.tsx` は**必須**で、`<html>` と `<body>` を含む必要があります:

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | My App",
    default: "My App",
  },
  description: "My awesome application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <header>
          <nav>{/* Navigation */}</nav>
        </header>
        <main>{children}</main>
        <footer>{/* Footer */}</footer>
      </body>
    </html>
  );
}
```

### ネストされたレイアウト

レイアウトは階層的にネストできます:

```plaintext
app/
├── layout.tsx            # ルートレイアウト
├── page.tsx              # / ページ
└── dashboard/
    ├── layout.tsx        # ダッシュボードレイアウト
    ├── page.tsx          # /dashboard
    ├── settings/
    │   └── page.tsx      # /dashboard/settings
    └── analytics/
        └── page.tsx      # /dashboard/analytics
```

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <aside className="w-64 bg-gray-100 min-h-screen p-4">
        <nav>
          <ul className="space-y-2">
            <li>
              <a href="/dashboard">Overview</a>
            </li>
            <li>
              <a href="/dashboard/analytics">Analytics</a>
            </li>
            <li>
              <a href="/dashboard/settings">Settings</a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

## レイアウトの特徴

### 1. 状態の保持

レイアウトはナビゲーション時に**再レンダリングされません**:

```typescript
// app/dashboard/layout.tsx
"use client";

import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // この状態はページ遷移しても保持される
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex">
      {sidebarOpen && (
        <aside className="w-64 bg-gray-100">{/* Sidebar content */}</aside>
      )}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>
        Toggle Sidebar
      </button>
      <main>{children}</main>
    </div>
  );
}
```

### 2. 親子間でのデータ共有不可

レイアウトから子コンポーネントへ props を渡すことはできません:

```typescript
// ❌ これはできない
export default function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  // children に props を渡すことはできない
  return <div>{children}</div>;
}
```

代わりに、以下の方法を使用:

```typescript
// ✅ Context を使用
// app/providers.tsx
"use client";

import { createContext, useContext } from "react";

const UserContext = createContext<User | null>(null);

export function UserProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
```

```typescript
// app/layout.tsx
import { UserProvider } from "./providers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <html lang="ja">
      <body>
        <UserProvider user={user}>{children}</UserProvider>
      </body>
    </html>
  );
}
```

### 3. Server Component がデフォルト

レイアウトはデフォルトで Server Component です:

```typescript
// app/layout.tsx - Server Component
import { getUser } from "@/lib/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser(); // サーバーで実行

  return (
    <html lang="ja">
      <body>
        <header>
          {user ? (
            <span>Welcome, {user.name}</span>
          ) : (
            <a href="/login">Login</a>
          )}
        </header>
        {children}
      </body>
    </html>
  );
}
```

## テンプレート

### template.tsx とは

`template.tsx` はレイアウトに似ていますが、ナビゲーション時に**新しいインスタンスが作成**されます:

| 特徴           | layout.tsx | template.tsx           |
| -------------- | ---------- | ---------------------- |
| 状態の保持     | 保持される | 保持されない           |
| 再レンダリング | されない   | ナビゲーション時に毎回 |
| useEffect      | 初回のみ   | 毎回実行               |
| DOM 要素       | 再利用     | 新規作成               |

### テンプレートの使用例

#### ページ遷移アニメーション

```typescript
// app/template.tsx
"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

#### ページビューの記録

```typescript
// app/template.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // ページ遷移のたびに実行される
    trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
```

#### フォームのリセット

```typescript
// app/form/template.tsx
"use client";

export default function FormTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  // ページ遷移のたびにフォームの状態がリセットされる
  return <>{children}</>;
}
```

## 実践的なレイアウトパターン

### 1. 認証レイアウト

```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {children}
      </div>
    </div>
  );
}
```

### 2. ダッシュボードレイアウト

```typescript
// app/dashboard/layout.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <span>{session.user.email}</span>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 rounded hover:bg-gray-100"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/projects"
                  className="block px-4 py-2 rounded hover:bg-gray-100"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 rounded hover:bg-gray-100"
                >
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 3. マーケティングレイアウト

```typescript
// app/(marketing)/layout.tsx
import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Logo
          </Link>
          <nav className="flex gap-6">
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About</Link>
            <Link
              href="/login"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features">Features</Link>
                </li>
                <li>
                  <Link href="/pricing">Pricing</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about">About</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

## プロバイダーの配置

### クライアントプロバイダー

```typescript
// app/providers.tsx
"use client";

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
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
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## メタデータの継承

### 静的メタデータ

```typescript
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | My App",
    default: "My App",
  },
  description: "My awesome application",
  metadataBase: new URL("https://myapp.com"),
};
```

```typescript
// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About", // → "About | My App"
};
```

### 動的メタデータ

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}
```

## レスポンシブレイアウト

### Tailwind CSS を使用

```typescript
// app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-white rounded shadow"
        >
          Menu
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-64 bg-white shadow transform
          lg:translate-x-0 lg:static
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          transition-transform duration-300 ease-in-out
          z-40
        `}
      >
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/dashboard/settings">Settings</Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 p-6">{children}</main>
    </div>
  );
}
```

## コンポーネントの分離

### レイアウトコンポーネント

```typescript
// components/layouts/Header.tsx
import Link from "next/link";
import { getSession } from "@/lib/auth";

export async function Header() {
  const session = await getSession();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
        <Link href="/" className="font-bold">
          My App
        </Link>
        <nav>
          {session ? (
            <span>{session.user.email}</span>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
```

```typescript
// components/layouts/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-100 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  block px-4 py-2 rounded
                  ${
                    pathname === item.href
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-200"
                  }
                `}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

```typescript
// app/dashboard/layout.tsx
import { Header } from "@/components/layouts/Header";
import { Sidebar } from "@/components/layouts/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

## まとめ

- **layout.tsx** は状態を保持する共有 UI
- **template.tsx** はナビゲーション時に再マウント
- **ルートレイアウト**は `<html>` と `<body>` を含む必須ファイル
- **ネストされたレイアウト**で階層的な UI を構築
- **Context** を使ってレイアウトからデータを共有
- **メタデータ**はレイアウトで定義して継承

## 演習問題

1. 認証用のレイアウト（中央配置）を作成してください
2. ダッシュボード用のサイドバーレイアウトを作成してください
3. ページ遷移アニメーションを template.tsx で実装してください
4. レスポンシブなナビゲーションを実装してください

## 次のステップ

次の章では、Server Components について詳しく学びます。

⬅️ 前へ: [03-Routing.md](./03-Routing.md)
➡️ 次へ: [05-Server-Components.md](./05-Server-Components.md)
