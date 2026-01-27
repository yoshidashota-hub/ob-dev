# テスト 学習ノート

## 概要

テストは品質保証の基盤。単体テスト、統合テスト、E2Eテストを組み合わせて網羅的にカバー。

## テストピラミッド

```
        /\
       /  \      E2E テスト（少）
      /----\     - 実際のブラウザ操作
     /      \
    /--------\   統合テスト（中）
   /          \  - API/DB連携
  /------------\
 /              \ 単体テスト（多）
/________________\- ロジック検証
```

## Vitest（単体テスト）

### セットアップ

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
```

```typescript
// vitest.setup.ts
import "@testing-library/jest-dom";
```

### 基本的なテスト

```typescript
// utils/format.test.ts
import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate } from "./format";

describe("formatCurrency", () => {
  it("formats number as JPY", () => {
    expect(formatCurrency(1000)).toBe("¥1,000");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("¥0");
  });
});
```

### コンポーネントテスト

```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
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

### モック

```typescript
// サービスのモック
import { vi } from "vitest";
import { fetchUser } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  fetchUser: vi.fn(),
}));

it("displays user data", async () => {
  vi.mocked(fetchUser).mockResolvedValue({
    id: "1",
    name: "John",
  });

  render(<UserProfile userId="1" />);

  expect(await screen.findByText("John")).toBeInTheDocument();
});
```

## Playwright（E2Eテスト）

### セットアップ

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
});
```

### E2Eテスト

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("user can login", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "user@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome");
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrong");
    await page.click('button[type="submit"]');

    await expect(page.locator(".error")).toContainText("Invalid credentials");
  });
});
```

## API テスト

```typescript
// api/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "http";
import { app } from "@/server";

describe("Users API", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://localhost:${server.address().port}`;
  });

  afterAll(() => server.close());

  it("GET /api/users returns users", async () => {
    const response = await fetch(`${baseUrl}/api/users`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});
```

## テストカバレッジ

```bash
npx vitest run --coverage
```

## ベストプラクティス

1. **AAA パターン**: Arrange, Act, Assert
2. **テストは独立**: 他のテストに依存しない
3. **意味のある名前**: 何をテストしているか明確に
4. **実装ではなく振る舞いをテスト**
5. **CI で自動実行**

## 参考リソース

- [Vitest ドキュメント](https://vitest.dev/)
- [Playwright ドキュメント](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
