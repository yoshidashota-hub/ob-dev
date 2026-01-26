# 13 - Testing

## この章で学ぶこと

- tRPC アプリケーションのテスト戦略
- ユニットテストの実装
- 統合テストの実装
- E2E テストの実装

## テスト環境のセットアップ

### インストール

```bash
npm install -D vitest @testing-library/react @testing-library/user-event msw
```

### Vitest 設定

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### テストセットアップ

```typescript
// tests/setup.ts
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

// MSW サーバーの起動
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// 各テスト後のクリーンアップ
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// テスト終了後にサーバーを停止
afterAll(() => server.close());
```

## ユニットテスト

### Procedure のテスト

```typescript
// tests/unit/routers/user.test.ts
import { describe, it, expect, vi } from "vitest";
import { createCaller } from "@/server/router";
import { createInnerTRPCContext } from "@/server/trpc";

// モックデータベース
const mockDb = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

// コンテキストの作成
const createTestContext = (overrides = {}) => {
  return createInnerTRPCContext({
    db: mockDb as any,
    session: null,
    ...overrides,
  });
};

describe("userRouter", () => {
  describe("list", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { id: "1", name: "Alice", email: "alice@example.com" },
        { id: "2", name: "Bob", email: "bob@example.com" },
      ];
      mockDb.user.findMany.mockResolvedValue(mockUsers);

      const ctx = createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.user.list();

      expect(result).toEqual(mockUsers);
      expect(mockDb.user.findMany).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return a user by id", async () => {
      const mockUser = { id: "1", name: "Alice", email: "alice@example.com" };
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const ctx = createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.user.getById({ id: "1" });

      expect(result).toEqual(mockUser);
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should throw NOT_FOUND when user does not exist", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const ctx = createTestContext();
      const caller = createCaller(ctx);

      await expect(caller.user.getById({ id: "999" })).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const input = { name: "Charlie", email: "charlie@example.com" };
      const mockUser = { id: "3", ...input };
      mockDb.user.create.mockResolvedValue(mockUser);

      const ctx = createTestContext();
      const caller = createCaller(ctx);

      const result = await caller.user.create(input);

      expect(result).toEqual(mockUser);
      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: input,
      });
    });
  });
});
```

### 認証が必要な Procedure のテスト

```typescript
// tests/unit/routers/protected.test.ts
import { describe, it, expect, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { createCaller } from "@/server/router";
import { createInnerTRPCContext } from "@/server/trpc";

describe("protectedProcedure", () => {
  it("should throw UNAUTHORIZED when not authenticated", async () => {
    const ctx = createInnerTRPCContext({
      db: {} as any,
      session: null,
    });
    const caller = createCaller(ctx);

    await expect(caller.user.me()).rejects.toThrow(TRPCError);
    await expect(caller.user.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("should return user data when authenticated", async () => {
    const mockUser = { id: "1", name: "Alice", email: "alice@example.com" };
    const ctx = createInnerTRPCContext({
      db: {} as any,
      session: { user: mockUser },
    });
    const caller = createCaller(ctx);

    const result = await caller.user.me();

    expect(result).toEqual(mockUser);
  });
});
```

### 入力バリデーションのテスト

```typescript
// tests/unit/routers/validation.test.ts
import { describe, it, expect } from "vitest";
import { createCaller } from "@/server/router";
import { createInnerTRPCContext } from "@/server/trpc";

describe("input validation", () => {
  const ctx = createInnerTRPCContext({ db: {} as any, session: null });
  const caller = createCaller(ctx);

  it("should reject invalid email", async () => {
    await expect(
      caller.user.create({ name: "Test", email: "invalid-email" })
    ).rejects.toThrow();
  });

  it("should reject empty name", async () => {
    await expect(
      caller.user.create({ name: "", email: "test@example.com" })
    ).rejects.toThrow();
  });

  it("should accept valid input", async () => {
    // モックを設定
    vi.mocked(mockDb.user.create).mockResolvedValue({
      id: "1",
      name: "Valid Name",
      email: "valid@example.com",
    });

    const result = await caller.user.create({
      name: "Valid Name",
      email: "valid@example.com",
    });

    expect(result).toBeDefined();
  });
});
```

## 統合テスト

### React コンポーネントのテスト

```typescript
// tests/integration/UserList.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { UserList } from "@/components/UserList";

// tRPC クライアントのモック
vi.mock("@/utils/trpc", () => ({
  trpc: {
    user: {
      list: {
        useQuery: vi.fn(),
      },
      create: {
        useMutation: vi.fn(),
      },
    },
    useUtils: vi.fn(() => ({
      user: {
        list: {
          invalidate: vi.fn(),
        },
      },
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("UserList", () => {
  it("should display loading state", () => {
    vi.mocked(trpc.user.list.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<UserList />, { wrapper: createWrapper() });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should display users", async () => {
    const mockUsers = [
      { id: "1", name: "Alice", email: "alice@example.com" },
      { id: "2", name: "Bob", email: "bob@example.com" },
    ];

    vi.mocked(trpc.user.list.useQuery).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    } as any);

    render(<UserList />, { wrapper: createWrapper() });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("should display error message", () => {
    vi.mocked(trpc.user.list.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to fetch users"),
    } as any);

    render(<UserList />, { wrapper: createWrapper() });

    expect(screen.getByText(/Failed to fetch users/)).toBeInTheDocument();
  });
});
```

### MSW を使った API モック

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

const mockUsers = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
];

export const handlers = [
  // tRPC のバッチリクエストをモック
  http.post("/api/trpc/user.list", () => {
    return HttpResponse.json({
      result: {
        data: mockUsers,
      },
    });
  }),

  http.post("/api/trpc/user.getById", async ({ request }) => {
    const body = await request.json();
    const { input } = body as { input: { id: string } };
    const user = mockUsers.find((u) => u.id === input.id);

    if (!user) {
      return HttpResponse.json({
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      });
    }

    return HttpResponse.json({
      result: {
        data: user,
      },
    });
  }),

  http.post("/api/trpc/user.create", async ({ request }) => {
    const body = await request.json();
    const { input } = body as { input: { name: string; email: string } };
    const newUser = {
      id: String(mockUsers.length + 1),
      ...input,
    };

    return HttpResponse.json({
      result: {
        data: newUser,
      },
    });
  }),
];

// tests/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

## E2E テスト

### Playwright のセットアップ

```bash
npm install -D @playwright/test
npx playwright install
```

### Playwright 設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E テストの実装

```typescript
// tests/e2e/users.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Users Page", () => {
  test("should display user list", async ({ page }) => {
    await page.goto("/users");

    // ローディング状態の確認
    await expect(page.getByText("Loading...")).toBeVisible();

    // ユーザーリストの表示を待つ
    await expect(page.getByRole("list")).toBeVisible();

    // ユーザーが表示されることを確認
    const userItems = page.getByRole("listitem");
    await expect(userItems).toHaveCount(2);
  });

  test("should create a new user", async ({ page }) => {
    await page.goto("/users/new");

    // フォームに入力
    await page.getByPlaceholder("Name").fill("Test User");
    await page.getByPlaceholder("Email").fill("test@example.com");

    // 送信
    await page.getByRole("button", { name: "Create" }).click();

    // リダイレクトの確認
    await expect(page).toHaveURL("/users");

    // 新しいユーザーが表示されることを確認
    await expect(page.getByText("Test User")).toBeVisible();
  });

  test("should show error for invalid input", async ({ page }) => {
    await page.goto("/users/new");

    // 無効なメールアドレスを入力
    await page.getByPlaceholder("Name").fill("Test");
    await page.getByPlaceholder("Email").fill("invalid-email");

    // 送信
    await page.getByRole("button", { name: "Create" }).click();

    // エラーメッセージの確認
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });
});
```

### 認証フローのテスト

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("user@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign In" }).click();

    // ダッシュボードにリダイレクト
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Welcome")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
});
```

## テストユーティリティ

### テスト用 tRPC クライアント

```typescript
// tests/utils/trpc.ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/router";
import superjson from "superjson";

export const createTestClient = (headers: Record<string, string> = {}) => {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3000/api/trpc",
        headers: () => headers,
        transformer: superjson,
      }),
    ],
  });
};
```

## まとめ

- ユニットテスト: Procedure を直接テスト
- 統合テスト: コンポーネントと tRPC の連携をテスト
- E2E テスト: 実際のブラウザでの動作をテスト
- MSW でネットワークリクエストをモック
- 認証・バリデーションも網羅的にテスト

## 確認問題

1. ユニットテストで tRPC Procedure をテストする方法を説明してください
2. MSW を使う利点は何ですか？
3. E2E テストと統合テストの違いを説明してください
4. 認証が必要な Procedure のテスト方法を説明してください

## 次の章へ

[14 - Best-Practices](./14-Best-Practices.md) では、tRPC 開発のベストプラクティスについて学びます。
