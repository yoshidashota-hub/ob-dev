# 20 - Best Practices

## 概要

この章では、Next.js アプリケーション開発のベストプラクティスを学びます。プロジェクト構成、コーディング規約、セキュリティ、テストなどを解説します。

## プロジェクト構成

### 推奨ディレクトリ構造

```plaintext
project/
├── app/                    # App Router
│   ├── (auth)/             # 認証ルートグループ
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/        # ダッシュボードグループ
│   │   ├── layout.tsx
│   │   └── settings/
│   ├── api/                # API Routes
│   │   └── [...]/route.ts
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # ホームページ
│   └── globals.css
├── components/             # 共有コンポーネント
│   ├── ui/                 # UI コンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── forms/              # フォームコンポーネント
│   └── layouts/            # レイアウトコンポーネント
├── lib/                    # ユーティリティ
│   ├── db.ts               # データベース接続
│   ├── auth.ts             # 認証ヘルパー
│   └── utils.ts            # 汎用ユーティリティ
├── hooks/                  # カスタムフック
├── types/                  # TypeScript 型定義
├── public/                 # 静的ファイル
├── prisma/                 # Prisma スキーマ
│   └── schema.prisma
└── tests/                  # テストファイル
```

### 機能ベースの構成

```plaintext
app/
├── (features)/
│   ├── posts/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── _components/    # 機能固有のコンポーネント
│   │   │   ├── PostCard.tsx
│   │   │   └── PostForm.tsx
│   │   ├── _actions/       # Server Actions
│   │   │   └── posts.ts
│   │   └── _lib/           # 機能固有のユーティリティ
│   │       └── validation.ts
│   └── users/
│       └── ...
```

### コンポーネントの構成

```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded font-medium transition-colors",
        variants[variant],
        sizes[size],
        loading && "opacity-50 cursor-wait"
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

## Server Components と Client Components

### 使い分けの原則

```typescript
// ✅ Server Component（デフォルト）
// - データフェッチング
// - 機密情報へのアクセス
// - 大きな依存関係を使用
export default async function PostList() {
  const posts = await db.post.findMany();
  return (
    <ul>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </ul>
  );
}

// ✅ Client Component
// - インタラクティブな UI
// - useState, useEffect が必要
// - ブラウザ API を使用
("use client");

export function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>{liked ? "❤️" : "🤍"}</button>
  );
}
```

### コンポーネント境界

```typescript
// ❌ 悪い例: 不要な Client Component
"use client";

export default function Page() {
  // クライアントで実行される
  const data = useQuery(...);

  return <div>{data}</div>;
}

// ✅ 良い例: Server Component + 必要な部分だけ Client
export default async function Page() {
  // サーバーで実行される
  const data = await fetchData();

  return (
    <div>
      <StaticContent data={data} />
      <InteractiveButton />  {/* Client Component */}
    </div>
  );
}
```

## データフェッチング

### Server Component でのフェッチ

```typescript
// ✅ 推奨: 並列フェッチ
async function Dashboard() {
  const [user, posts, analytics] = await Promise.all([
    getUser(),
    getPosts(),
    getAnalytics(),
  ]);

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
      <Analytics data={analytics} />
    </div>
  );
}

// ✅ 推奨: コンポーネントレベルでのフェッチ
async function UserProfile() {
  const user = await getUser();
  return <div>{user.name}</div>;
}

async function PostList() {
  const posts = await getPosts();
  return <ul>{posts.map(...)}</ul>;
}
```

### エラーハンドリング

```typescript
// lib/fetch.ts
export async function fetchWithError<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 使用例
async function Posts() {
  try {
    const posts = await fetchWithError<Post[]>("/api/posts");
    return <PostList posts={posts} />;
  } catch (error) {
    return <ErrorMessage error={error} />;
  }
}
```

## Server Actions

### バリデーション

```typescript
// app/actions/posts.ts
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const createPostSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(100),
  content: z.string().min(10, "内容は10文字以上必要です"),
});

export async function createPost(formData: FormData) {
  // 認証チェック
  const session = await auth();
  if (!session) {
    return { error: "認証が必要です" };
  }

  // バリデーション
  const parsed = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return {
      error: "入力が無効です",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // データベース操作
  try {
    await db.post.create({
      data: {
        ...parsed.data,
        authorId: session.user.id,
      },
    });

    revalidatePath("/posts");
    return { success: true };
  } catch (error) {
    return { error: "投稿の作成に失敗しました" };
  }
}
```

### フォームとの連携

```typescript
// components/PostForm.tsx
"use client";

import { useActionState } from "react";
import { createPost } from "@/app/actions/posts";

export function PostForm() {
  const [state, action, isPending] = useActionState(createPost, null);

  return (
    <form action={action}>
      <div>
        <label htmlFor="title">タイトル</label>
        <input
          id="title"
          name="title"
          required
          aria-describedby={
            state?.fieldErrors?.title ? "title-error" : undefined
          }
        />
        {state?.fieldErrors?.title && (
          <p id="title-error" className="text-red-500">
            {state.fieldErrors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="content">内容</label>
        <textarea id="content" name="content" required />
        {state?.fieldErrors?.content && (
          <p className="text-red-500">{state.fieldErrors.content}</p>
        )}
      </div>

      {state?.error && <p className="text-red-500">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "投稿中..." : "投稿する"}
      </button>
    </form>
  );
}
```

## TypeScript

### 型定義

```typescript
// types/index.ts

// エンティティ型
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  published: boolean;
  authorId: string;
  author?: User;
  createdAt: Date;
  updatedAt: Date;
}

// API レスポンス型
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// コンポーネント Props 型
export interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  showAuthor?: boolean;
}
```

### 型ガード

```typescript
// lib/type-guards.ts
export function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value
  );
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    "statusCode" in value
  );
}

// 使用例
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  if (isApiError(data)) {
    throw new Error(data.message);
  }

  if (!isUser(data)) {
    throw new Error("Invalid response");
  }

  return data;
}
```

### Generics の活用

```typescript
// lib/api.ts
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "API request failed");
  }

  return response.json();
}

// 使用例
const posts = await apiRequest<Post[]>("/posts");
const user = await apiRequest<User>("/users/123");
```

## エラーハンドリング

### error.tsx

```typescript
// app/error.tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログサービスに送信
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        もう一度試す
      </button>
    </div>
  );
}
```

### not-found.tsx

```typescript
// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">ページが見つかりません</h2>
      <p className="text-gray-600 mb-4">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link href="/" className="text-blue-500 hover:underline">
        ホームに戻る
      </Link>
    </div>
  );
}
```

### カスタムエラー

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fieldErrors?: Record<string, string[]>) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}
```

## セキュリティ

### 入力のサニタイズ

```typescript
// lib/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href", "target"],
  });
}

// 使用例
export function RichContent({ html }: { html: string }) {
  const sanitized = sanitizeHtml(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### CSRF 対策

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CSRF トークンの設定
  if (request.method === "GET") {
    const csrfToken = crypto.randomUUID();
    response.cookies.set("csrf-token", csrfToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
```

### セキュリティヘッダー

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
```

### 環境変数の保護

```typescript
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_API_URL: z.string().url(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
```

## テスト

### Unit テスト（Vitest）

```typescript
// __tests__/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatDate, truncate } from "@/lib/utils";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("2024年1月15日");
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    const text = "This is a very long text that should be truncated";
    expect(truncate(text, 20)).toBe("This is a very long...");
  });

  it("returns original text if short", () => {
    const text = "Short";
    expect(truncate(text, 20)).toBe("Short");
  });
});
```

### コンポーネントテスト

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when loading", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### E2E テスト（Playwright）

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("ダッシュボード");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrong");
    await page.click('button[type="submit"]');

    await expect(page.locator(".error")).toContainText("認証に失敗しました");
  });
});
```

### API テスト

```typescript
// __tests__/api/posts.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { testClient } from "@/lib/test-utils";

describe("POST /api/posts", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates a new post", async () => {
    const response = await testClient.post("/api/posts", {
      body: { title: "Test Post", content: "Test content" },
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "Test Post",
      content: "Test content",
    });
  });

  it("returns 400 for invalid data", async () => {
    const response = await testClient.post("/api/posts", {
      body: { title: "" },
    });

    expect(response.status).toBe(400);
  });
});
```

## アクセシビリティ

### セマンティック HTML

```typescript
// ✅ 良い例
export function Article({ post }: { post: Post }) {
  return (
    <article>
      <header>
        <h1>{post.title}</h1>
        <time dateTime={post.createdAt.toISOString()}>
          {formatDate(post.createdAt)}
        </time>
      </header>
      <main>
        <p>{post.content}</p>
      </main>
      <footer>
        <address>
          By <a href={`/users/${post.author.id}`}>{post.author.name}</a>
        </address>
      </footer>
    </article>
  );
}
```

### ARIA 属性

```typescript
// components/Modal.tsx
"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      onClose={onClose}
      className="rounded-lg p-6"
    >
      <header className="flex justify-between items-center">
        <h2 id="modal-title">{title}</h2>
        <button onClick={onClose} aria-label="閉じる" className="p-2">
          ✕
        </button>
      </header>
      <div role="document">{children}</div>
    </dialog>
  );
}
```

### キーボードナビゲーション

```typescript
// components/Dropdown.tsx
"use client";

import { useState, useRef } from "react";

export function Dropdown({ items }: { items: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        if (activeIndex >= 0) {
          selectItem(items[activeIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <button
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        選択してください
      </button>
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          aria-activedescendant={items[activeIndex]}
        >
          {items.map((item, index) => (
            <li
              key={item}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "bg-blue-100" : ""}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## コード品質

### ESLint 設定

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:@typescript-eslint/recommended"
  ),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/jsx-no-leaked-render": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
```

### Prettier 設定

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### Husky + lint-staged

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

## まとめ

- **プロジェクト構成** は機能ベースで整理
- **Server/Client Components** を適切に使い分け
- **TypeScript** で型安全に
- **Server Actions** でバリデーションを徹底
- **セキュリティ** を常に意識
- **テスト** で品質を担保
- **アクセシビリティ** を考慮

## 演習問題

1. 機能ベースのディレクトリ構造に移行してください
2. 全ての Server Actions にバリデーションを追加してください
3. E2E テストを実装してください
4. アクセシビリティ監査を実施してください

## 終わりに

Next.js Complete Guide をお読みいただきありがとうございました。

この本で学んだことを活かして、パフォーマンスが高く、セキュアで、ユーザーフレンドリーなアプリケーションを構築してください。

Next.js は進化を続けています。公式ドキュメントやコミュニティをフォローして、最新の機能やベストプラクティスを学び続けてください。

Happy coding! 🚀

⬅️ 前へ: [19-Performance-Optimization.md](./19-Performance-Optimization.md)
📖 目次へ: [README.md](./README.md)
