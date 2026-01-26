# 13 - Testing（テスト）

## この章で学ぶこと

- Vitest の概要
- ユニットテスト
- コンポーネントテスト
- カバレッジ

## Vitest とは

Vitest は Vite ネイティブのテストフレームワークです。

### 特徴

- Vite と同じ設定を共有
- Jest 互換の API
- 高速な実行
- HMR 対応（テストのホットリロード）

## セットアップ

```bash
npm install -D vitest
```

```typescript
// vite.config.ts
/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    // Vitest 設定
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

### package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## ユニットテスト

### 基本的なテスト

```typescript
// sum.ts
export function sum(a: number, b: number): number {
  return a + b;
}

// sum.test.ts
import { describe, it, expect } from "vitest";
import { sum } from "./sum";

describe("sum", () => {
  it("1 + 2 = 3", () => {
    expect(sum(1, 2)).toBe(3);
  });

  it("負の数も計算できる", () => {
    expect(sum(-1, -2)).toBe(-3);
  });
});
```

### マッチャー

```typescript
import { expect, it } from "vitest";

it("various matchers", () => {
  // 等価性
  expect(1 + 1).toBe(2);
  expect({ a: 1 }).toEqual({ a: 1 });

  // 真偽値
  expect(true).toBeTruthy();
  expect(false).toBeFalsy();
  expect(null).toBeNull();
  expect(undefined).toBeUndefined();

  // 数値
  expect(10).toBeGreaterThan(5);
  expect(10).toBeLessThan(20);
  expect(0.1 + 0.2).toBeCloseTo(0.3);

  // 文字列
  expect("hello world").toContain("world");
  expect("hello").toMatch(/^he/);

  // 配列
  expect([1, 2, 3]).toContain(2);
  expect([1, 2, 3]).toHaveLength(3);

  // 例外
  expect(() => {
    throw new Error("error");
  }).toThrow("error");
});
```

### モック

```typescript
import { describe, it, expect, vi } from "vitest";

describe("mocking", () => {
  it("関数のモック", () => {
    const fn = vi.fn();
    fn("hello");

    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith("hello");
  });

  it("戻り値のモック", () => {
    const fn = vi.fn().mockReturnValue(42);
    expect(fn()).toBe(42);
  });

  it("モジュールのモック", async () => {
    vi.mock("./api", () => ({
      fetchUser: vi.fn().mockResolvedValue({ name: "John" }),
    }));

    const { fetchUser } = await import("./api");
    const user = await fetchUser();
    expect(user.name).toBe("John");
  });
});
```

## コンポーネントテスト

### セットアップ

```bash
npm install -D @testing-library/react @testing-library/jest-dom jsdom
```

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
```

### テスト例

```typescript
// Button.tsx
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({ onClick, children, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("テキストを表示する", () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("クリックでハンドラーが呼ばれる", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disabled の場合はクリックできない", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click
      </Button>,
    );

    fireEvent.click(screen.getByText("Click"));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

### 非同期コンポーネント

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

describe("UserProfile", () => {
  it("ユーザー情報を表示する", async () => {
    vi.mock("./api", () => ({
      fetchUser: vi.fn().mockResolvedValue({ name: "John" }),
    }));

    render(<UserProfile userId="1" />);

    // ローディング状態
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // データ取得後
    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
    });
  });
});
```

## カバレッジ

```bash
npm install -D @vitest/coverage-v8
```

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/"],
    },
  },
});
```

```bash
# カバレッジレポートを生成
npm run test:coverage
```

## スナップショットテスト

```typescript
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

describe("Component Snapshot", () => {
  it("スナップショットと一致する", () => {
    const { container } = render(<MyComponent />);
    expect(container).toMatchSnapshot();
  });

  it("インラインスナップショット", () => {
    const result = formatDate(new Date("2024-01-01"));
    expect(result).toMatchInlineSnapshot(`"2024年1月1日"`);
  });
});
```

## Watch モード

```bash
# ファイル変更を監視
npm run test

# 特定のファイルのみ
npm run test -- Button

# パターン指定
npm run test -- --filter="Button"
```

## 設定オプション

```typescript
// vite.config.ts
export default defineConfig({
  test: {
    // グローバル API（describe, it, expect）
    globals: true,

    // テスト環境
    environment: "jsdom", // 'node' | 'jsdom' | 'happy-dom'

    // セットアップファイル
    setupFiles: ["./src/test/setup.ts"],

    // インクルード/エクスクルード
    include: ["**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],

    // タイムアウト
    testTimeout: 5000,

    // 並列実行
    maxConcurrency: 5,

    // レポーター
    reporters: ["verbose"],
  },
});
```

## まとめ

- Vitest は Vite ネイティブのテストフレームワーク
- Jest 互換の API で学習コストが低い
- Testing Library でコンポーネントテスト
- カバレッジレポートで品質を可視化

## 確認問題

1. Vitest と Jest の違いを説明してください
2. コンポーネントのテストを書いてください
3. モックの使い方を説明してください

## 次の章へ

[14 - Deployment](./14-Deployment.md) では、デプロイについて学びます。
