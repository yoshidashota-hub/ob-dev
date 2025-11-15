# Vercel Edge Config 実装例

Feature Flags と動的設定をデプロイなしで変更する完全ガイド。

---

## 📋 目次

1. [概要](#概要)
2. [セットアップ](#セットアップ)
3. [基本的な使い方](#基本的な使い方)
4. [Feature Flags の実装](#feature-flags-の実装)
5. [A/B テストの実装](#ab-テストの実装)
6. [高度な使用例](#高度な使用例)
7. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### Vercel Edge Config とは

デプロイなしで設定を変更できるグローバル設定ストア：

- **高速**: エッジから数ミリ秒で読み取り
- **グローバル**: 世界中のエッジロケーションで利用可能
- **リアルタイム**: 変更が即座に反映
- **型安全**: TypeScript の型定義をサポート

### 主なユースケース

- Feature Flags（機能フラグ）
- A/B テスト
- メンテナンスモード
- リダイレクト設定
- 動的なコンテンツ設定

---

## セットアップ

### 1. Edge Config の作成

```bash
# Vercel ダッシュボードで:
# 1. プロジェクトを選択
# 2. Storage → Edge Config
# 3. "Create" をクリック
# 4. 名前を入力 (例: "next16-sandbox-config")
```

### 2. パッケージのインストール

```bash
npm install @vercel/edge-config
```

### 3. 環境変数の設定

**ファイル**: `.env.local`

```bash
# Vercel ダッシュボードから取得
EDGE_CONFIG="https://edge-config.vercel.com/xxxx?token=xxxx"
```

### 4. 初期値の設定

Vercel ダッシュボードで初期値を設定：

```json
{
  "features": {
    "newUI": false,
    "betaFeatures": false,
    "aiChat": true,
    "darkMode": true
  },
  "maintenance": {
    "enabled": false,
    "message": "We are currently under maintenance. Please check back later."
  },
  "abTests": {
    "homepageVariant": "A"
  }
}
```

---

## 基本的な使い方

### Edge Config クライアントの作成

**ファイル**: `lib/edge-config.ts`

```typescript
import { get, getAll } from "@vercel/edge-config";

// 単一の値を取得
export async function getFeatureFlag(key: string): Promise<boolean> {
  try {
    return (await get(key)) ?? false;
  } catch (error) {
    console.error("Failed to get feature flag:", error);
    return false;
  }
}

// すべての値を取得
export async function getAllConfig() {
  try {
    return await getAll();
  } catch (error) {
    console.error("Failed to get all config:", error);
    return {};
  }
}

// ネストされた値を取得
export async function getNestedValue<T>(path: string): Promise<T | null> {
  try {
    const config = await getAll();
    const keys = path.split(".");
    let value: any = config;

    for (const key of keys) {
      value = value?.[key];
    }

    return value ?? null;
  } catch (error) {
    console.error("Failed to get nested value:", error);
    return null;
  }
}
```

### Server Component での使用

```typescript
import { get } from "@vercel/edge-config";

export default async function HomePage() {
  const showNewUI = await get("features.newUI");

  return <div>{showNewUI ? <NewUI /> : <OldUI />}</div>;
}
```

### Middleware での使用

```typescript
import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/edge-config";

export async function middleware(request: NextRequest) {
  const maintenanceMode = await get<boolean>("maintenance.enabled");

  if (maintenanceMode && !request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  return NextResponse.next();
}
```

---

## Feature Flags の実装

### Feature Flags ヘルパー

**ファイル**: `lib/feature-flags.ts`

```typescript
import { get, getAll } from "@vercel/edge-config";

interface FeatureFlags {
  newUI: boolean;
  betaFeatures: boolean;
  aiChat: boolean;
  darkMode: boolean;
}

// 単一のフラグを取得
export async function isFeatureEnabled(
  feature: keyof FeatureFlags
): Promise<boolean> {
  try {
    const flags = await get<FeatureFlags>("features");
    return flags?.[feature] ?? false;
  } catch (error) {
    console.error("Failed to get feature flag:", error);
    return false;
  }
}

// すべてのフラグを取得
export async function getAllFeatureFlags(): Promise<FeatureFlags> {
  try {
    const flags = await get<FeatureFlags>("features");
    return (
      flags ?? {
        newUI: false,
        betaFeatures: false,
        aiChat: true,
        darkMode: true,
      }
    );
  } catch (error) {
    console.error("Failed to get feature flags:", error);
    return {
      newUI: false,
      betaFeatures: false,
      aiChat: true,
      darkMode: true,
    };
  }
}

// ユーザーごとのフラグ（段階的ロールアウト）
export async function isFeatureEnabledForUser(
  feature: keyof FeatureFlags,
  userId: string
): Promise<boolean> {
  const baseEnabled = await isFeatureEnabled(feature);
  if (!baseEnabled) return false;

  // ユーザー ID のハッシュで 10% のユーザーに限定
  const hash = simpleHash(userId);
  return hash % 100 < 10; // 10% rollout
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

### Feature Flags デモページ

**ファイル**: `app/feature-flags/page.tsx`

```typescript
import { getAllFeatureFlags } from "@/lib/feature-flags";

export default async function FeatureFlagsPage() {
  const flags = await getAllFeatureFlags();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">⚙️ Feature Flags</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Current Flags</h2>

        <div className="space-y-3">
          {Object.entries(flags).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <span className="font-medium text-gray-900">{key}</span>
                <p className="text-sm text-gray-500">
                  {getFlagDescription(key)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  value
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {value ? "Enabled" : "Disabled"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">💡 How to Update</h3>
        <ol className="space-y-2 text-gray-700">
          <li>1. Go to Vercel Dashboard</li>
          <li>2. Navigate to Storage → Edge Config</li>
          <li>3. Edit the values in the JSON editor</li>
          <li>4. Click "Save"</li>
          <li>5. Changes take effect immediately (no deploy needed!)</li>
        </ol>
      </div>
    </div>
  );
}

function getFlagDescription(key: string): string {
  const descriptions: Record<string, string> = {
    newUI: "Enable the new user interface",
    betaFeatures: "Access to beta features",
    aiChat: "AI-powered chat assistance",
    darkMode: "Dark mode theme support",
  };
  return descriptions[key] || "";
}
```

### 条件付きレンダリング

```typescript
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function DashboardPage() {
  const showBetaFeatures = await isFeatureEnabled("betaFeatures");

  return (
    <div>
      <h1>Dashboard</h1>

      {/* 通常の機能 */}
      <RegularFeatures />

      {/* Beta 機能（フラグで制御） */}
      {showBetaFeatures && (
        <div className="border-2 border-yellow-400 p-4 rounded-lg">
          <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-sm font-semibold">
            BETA
          </span>
          <BetaFeatures />
        </div>
      )}
    </div>
  );
}
```

---

## A/B テストの実装

### A/B テストヘルパー

**ファイル**: `lib/ab-test.ts`

```typescript
import { get } from "@vercel/edge-config";
import { cookies } from "next/headers";

type Variant = "A" | "B";

// ユーザーにバリアントを割り当て
export async function getVariant(testName: string): Promise<Variant> {
  const cookieStore = await cookies();
  const existingVariant = cookieStore.get(`ab-test-${testName}`)
    ?.value as Variant;

  if (existingVariant) {
    return existingVariant;
  }

  // 50/50 で分割
  const variant: Variant = Math.random() < 0.5 ? "A" : "B";

  // Cookie に保存
  cookieStore.set(`ab-test-${testName}`, variant, {
    maxAge: 60 * 60 * 24 * 30, // 30日間
  });

  return variant;
}

// Edge Config から有効なテストを取得
export async function getActiveTests(): Promise<string[]> {
  try {
    const tests = await get<string[]>("abTests.active");
    return tests ?? [];
  } catch (error) {
    console.error("Failed to get active tests:", error);
    return [];
  }
}
```

### A/B テストの使用例

```typescript
import { getVariant } from "@/lib/ab-test";

export default async function HomePage() {
  const variant = await getVariant("homepage-hero");

  return <div>{variant === "A" ? <HeroVariantA /> : <HeroVariantB />}</div>;
}

function HeroVariantA() {
  return (
    <div className="bg-blue-600 text-white p-12">
      <h1 className="text-5xl font-bold">Welcome to Our Platform</h1>
      <p className="text-xl mt-4">Start building amazing things today</p>
      <button className="mt-6 px-8 py-3 bg-white text-blue-600 rounded-lg">
        Get Started
      </button>
    </div>
  );
}

function HeroVariantB() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-12">
      <h1 className="text-5xl font-bold">Build the Future</h1>
      <p className="text-xl mt-4">
        Join thousands of developers creating incredible apps
      </p>
      <button className="mt-6 px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold">
        Start Free Trial
      </button>
    </div>
  );
}
```

### A/B テスト結果の追跡

```typescript
"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

export function ABTestTracker({
  testName,
  variant,
}: {
  testName: string;
  variant: string;
}) {
  useEffect(() => {
    // ページビューを追跡
    track("ab_test_view", {
      test: testName,
      variant,
    });
  }, [testName, variant]);

  return null;
}

// コンバージョンの追跡
export function trackConversion(testName: string, variant: string) {
  track("ab_test_conversion", {
    test: testName,
    variant,
  });
}
```

---

## 高度な使用例

### 1. メンテナンスモード

```typescript
import { get } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const maintenance = await get<{
    enabled: boolean;
    message: string;
    allowedIPs?: string[];
  }>("maintenance");

  if (maintenance?.enabled) {
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";

    // 許可されたIPは除外
    if (maintenance.allowedIPs?.includes(clientIP)) {
      return NextResponse.next();
    }

    // メンテナンスページへリダイレクト
    if (!request.nextUrl.pathname.startsWith("/maintenance")) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  return NextResponse.next();
}
```

### 2. 動的リダイレクト

```typescript
import { get } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const redirects = await get<Record<string, string>>("redirects");

  if (redirects) {
    const targetPath = request.nextUrl.pathname;
    const redirectTo = redirects[targetPath];

    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.next();
}
```

### 3. 地域別コンテンツ

```typescript
import { get } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const country = request.geo?.country || "US";

  const regionalContent = await get<Record<string, any>>(`content.${country}`);

  if (regionalContent) {
    const response = NextResponse.next();
    response.headers.set("x-regional-content", JSON.stringify(regionalContent));
    return response;
  }

  return NextResponse.next();
}
```

### 4. レートリミット設定

```typescript
import { get } from "@vercel/edge-config";

export async function getRateLimitConfig() {
  const config = await get<{
    default: { limit: number; window: number };
    premium: { limit: number; window: number };
  }>("rateLimit");

  return (
    config ?? {
      default: { limit: 10, window: 60 },
      premium: { limit: 100, window: 60 },
    }
  );
}
```

### 5. キャッシュ制御

```typescript
import { get } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const cacheConfig = await get<Record<string, number>>("cacheControl");

  if (cacheConfig) {
    const path = request.nextUrl.pathname;
    const cacheTime = cacheConfig[path];

    if (cacheTime) {
      const response = NextResponse.next();
      response.headers.set(
        "Cache-Control",
        `public, s-maxage=${cacheTime}, stale-while-revalidate`
      );
      return response;
    }
  }

  return NextResponse.next();
}
```

---

## トラブルシューティング

### エラー: "Edge Config not found"

```bash
# 環境変数を確認
echo $EDGE_CONFIG

# .env.local に追加
EDGE_CONFIG="https://edge-config.vercel.com/xxxx?token=xxxx"

# Vercel にデプロイする場合は自動設定
vercel env pull
```

### 変更が反映されない

```typescript
// キャッシュをクリア
import { get } from "@vercel/edge-config";

// Vercel ダッシュボードで変更を保存後、数秒待つ
// Edge Config は最大 30 秒のキャッシュがあります

// 強制的に最新の値を取得
const value = await get("key", { cache: "no-store" });
```

### 型安全性の向上

```typescript
// lib/edge-config-types.ts
export interface EdgeConfigSchema {
  features: {
    newUI: boolean;
    betaFeatures: boolean;
    aiChat: boolean;
    darkMode: boolean;
  };
  maintenance: {
    enabled: boolean;
    message: string;
    allowedIPs?: string[];
  };
  abTests: {
    active: string[];
  };
}

// lib/edge-config.ts
import { get } from "@vercel/edge-config";
import { EdgeConfigSchema } from "./edge-config-types";

export async function getTypedConfig<K extends keyof EdgeConfigSchema>(
  key: K
): Promise<EdgeConfigSchema[K] | null> {
  try {
    return await get<EdgeConfigSchema[K]>(key);
  } catch (error) {
    console.error(`Failed to get config for ${key}:`, error);
    return null;
  }
}
```

---

## まとめ

### チェックリスト

- [ ] Edge Config を作成
- [ ] @vercel/edge-config をインストール
- [ ] 環境変数を設定
- [ ] 初期値を設定
- [ ] Feature Flags を実装
- [ ] A/B テストを実装
- [ ] Vercel にデプロイ
- [ ] ダッシュボードで設定を変更して確認

### ベストプラクティス

- ✅ デフォルト値を常に用意
- ✅ 型定義を使用して型安全性を確保
- ✅ エラーハンドリングを適切に実装
- ✅ キャッシュの仕組みを理解
- ✅ Middleware で活用（高速アクセス）
- ✅ Analytics で A/B テスト結果を追跡

### 次のステップ

- Vercel Postgres でデータを永続化
- Analytics で A/B テスト結果を分析
- 複雑な Feature Flags 戦略を実装

---

**最終更新**: 2025 年 11 月
**難易度**: ★★★★☆
**所要時間**: 2-3 時間
