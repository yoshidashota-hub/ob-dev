# Vercel 機能実装計画書

Next.js 16 Sandbox プロジェクトに Vercel の主要機能を段階的に実装する計画書です。

## 📋 目次

1. [概要](#概要)
2. [全体スケジュール](#全体スケジュール)
3. [Phase 1: Analytics & Speed Insights](#phase-1-analytics--speed-insights)
4. [Phase 2: Vercel Blob](#phase-2-vercel-blob)
5. [Phase 3: Vercel KV](#phase-3-vercel-kv)
6. [Phase 4: AI SDK](#phase-4-ai-sdk)
7. [Phase 5: Edge Config](#phase-5-edge-config)
8. [Phase 6: Vercel Postgres](#phase-6-vercel-postgres)
9. [デプロイ戦略](#デプロイ戦略)
10. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### プロジェクト目標

Vercel.md で学んだ知識を実践に移し、next16-sandbox に以下の機能を追加する：

1. ✅ **パフォーマンス測定** - Analytics & Speed Insights
2. ✅ **ファイルストレージ** - Vercel Blob
3. ✅ **キャッシュ・セッション** - Vercel KV
4. ✅ **AI 統合** - AI SDK
5. ✅ **動的設定** - Edge Config
6. ✅ **データベース** - Vercel Postgres

### 技術スタック

```
現在:
- Next.js 16.0.1
- React 19.2.0
- TypeScript 5
- Tailwind CSS 3

追加予定:
- @vercel/analytics
- @vercel/speed-insights
- @vercel/blob
- @vercel/kv
- ai (Vercel AI SDK)
- @vercel/edge-config
- @vercel/postgres
- @prisma/client (Postgres 用)
```

---

## 全体スケジュール

### タイムライン

```
Week 1: 基礎機能の実装
┌──────────────────────────────────────────┐
│ Day 1-2  │ Phase 1: Analytics           │
│ Day 3-4  │ Phase 2: Vercel Blob         │
│ Day 5-7  │ Phase 3: Vercel KV           │
└──────────────────────────────────────────┘

Week 2: 高度な機能の実装
┌──────────────────────────────────────────┐
│ Day 1-3  │ Phase 4: AI SDK              │
│ Day 4-5  │ Phase 5: Edge Config         │
│ Day 6-7  │ Phase 6: Vercel Postgres     │
└──────────────────────────────────────────┘
```

### 実装優先度

| フェーズ | 優先度 | 難易度 | 所要時間 | 依存関係 |
| -------- | ------ | ------ | -------- | -------- |
| Phase 1  | 必須   | ★☆☆☆☆  | 30 分    | なし     |
| Phase 2  | 必須   | ★★☆☆☆  | 1-2 時間 | なし     |
| Phase 3  | 必須   | ★★★☆☆  | 2-3 時間 | なし     |
| Phase 4  | 推奨   | ★★★★☆  | 3-4 時間 | なし     |
| Phase 5  | 推奨   | ★★★★☆  | 2-3 時間 | なし     |
| Phase 6  | 推奨   | ★★★★★  | 4-5 時間 | Phase 3  |

---

## Phase 1: Analytics & Speed Insights

### 目的

サイトのパフォーマンスとユーザー行動を可視化し、改善のベースラインを確立する。

### 実装内容

#### 1.1 パッケージのインストール

```bash
cd Projects/next16-sandbox
npm install @vercel/analytics @vercel/speed-insights
```

#### 1.2 Layout の更新

**ファイル**: `app/layout.tsx`

```typescript
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

#### 1.3 デモページの作成

**ファイル**: `app/analytics-demo/page.tsx`

```typescript
import Link from "next/link";

export default function AnalyticsDemo() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">Analytics & Speed Insights</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Analytics カード */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">📊 Analytics</h2>
          <p className="text-gray-600 mb-4">
            ページビュー、ユーザー数、イベントトラッキングを確認できます。
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ リアルタイム訪問者数</li>
            <li>✅ ページ別パフォーマンス</li>
            <li>✅ デバイス・ブラウザ分析</li>
            <li>✅ 地域別アクセス</li>
          </ul>
        </div>

        {/* Speed Insights カード */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">⚡ Speed Insights</h2>
          <p className="text-gray-600 mb-4">
            Core Web Vitals を測定し、パフォーマンスを最適化。
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ FCP (First Contentful Paint)</li>
            <li>✅ LCP (Largest Contentful Paint)</li>
            <li>✅ CLS (Cumulative Layout Shift)</li>
            <li>✅ FID (First Input Delay)</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">📈 確認方法</h3>
        <ol className="space-y-2 text-gray-700">
          <li>1. Vercel にデプロイ</li>
          <li>2. ダッシュボードの "Analytics" タブを開く</li>
          <li>3. "Speed Insights" タブでパフォーマンスを確認</li>
        </ol>
      </div>
    </div>
  );
}
```

#### 1.4 Sidebar への追加

**ファイル**: `app/components/Sidebar.tsx`

```typescript
// navigation 配列に追加
{
  name: "Monitoring",
  items: [
    { name: "Analytics", href: "/analytics-demo", icon: "📊" },
  ],
}
```

### チェックリスト

- [ ] パッケージをインストール
- [ ] `layout.tsx` に Analytics と SpeedInsights を追加
- [ ] デモページを作成
- [ ] Sidebar にリンクを追加
- [ ] ローカルで動作確認
- [ ] Git コミット

### 期待される結果

- ✅ ローカル環境で Analytics が動作（開発モードでは無効）
- ✅ デプロイ後に Vercel ダッシュボードでデータ確認可能
- ✅ Speed Insights でパフォーマンススコア表示

---

## Phase 2: Vercel Blob

### 目的

画像やファイルのアップロード機能を実装し、Vercel Blob でのストレージ管理を学ぶ。

### 前提条件

```bash
# Vercel CLI のインストール
npm i -g vercel

# Vercel にログイン
vercel login

# プロジェクトを Vercel にリンク
vercel link
```

### 実装内容

#### 2.1 パッケージのインストール

```bash
npm install @vercel/blob
```

#### 2.2 環境変数の設定

**ファイル**: `.env.local`

```bash
# Vercel Blob Token
BLOB_READ_WRITE_TOKEN="vercel_blob_xxxx"
```

**取得方法**:

1. Vercel ダッシュボード
2. Storage → Blob
3. "Create Store" をクリック
4. トークンをコピー

#### 2.3 アップロード API の作成

**ファイル**: `app/api/upload/route.ts`

```typescript
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // ファイルサイズチェック（10MB まで）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Blob にアップロード
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

#### 2.4 画像一覧取得 API

**ファイル**: `app/api/upload/list/route.ts`

```typescript
import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { blobs } = await list();

    return NextResponse.json({
      success: true,
      data: blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })),
    });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
```

#### 2.5 アップロードページの作成

**ファイル**: `app/upload/page.tsx`

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";

interface UploadedFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      // プレビュー生成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedFile(result.data);
        setFile(null);
        setPreview(null);
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">📸 Vercel Blob Upload</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* アップロードフォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Upload Image</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {preview && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* アップロード結果 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Upload Result</h2>

          {uploadedFile ? (
            <div>
              <div className="mb-4">
                <Image
                  src={uploadedFile.url}
                  alt="Uploaded"
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">URL:</span>{" "}
                  <a
                    href={uploadedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {uploadedFile.url}
                  </a>
                </p>
                <p>
                  <span className="font-medium">Size:</span>{" "}
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
                <p>
                  <span className="font-medium">Uploaded:</span>{" "}
                  {new Date(uploadedFile.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No file uploaded yet</p>
          )}
        </div>
      </div>

      {/* 機能説明 */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">💡 Features</h3>
        <ul className="space-y-2 text-gray-700">
          <li>✅ 10MB までの画像ファイルをアップロード</li>
          <li>✅ JPEG, PNG, GIF, WebP に対応</li>
          <li>✅ Vercel Blob に自動保存</li>
          <li>✅ CDN 経由で高速配信</li>
          <li>✅ 自動的に一意の URL を生成</li>
        </ul>
      </div>
    </div>
  );
}
```

### チェックリスト

- [ ] @vercel/blob をインストール
- [ ] Vercel Blob ストアを作成
- [ ] 環境変数を設定
- [ ] アップロード API を実装
- [ ] 一覧取得 API を実装
- [ ] アップロードページを作成
- [ ] Sidebar にリンクを追加
- [ ] ローカルで動作確認
- [ ] Git コミット

### 期待される結果

- ✅ 画像をアップロードできる
- ✅ Vercel Blob にファイルが保存される
- ✅ CDN URL で画像にアクセスできる
- ✅ アップロード済みファイルを一覧表示できる

---

## Phase 3: Vercel KV

### 目的

Redis ベースのキャッシュとセッション管理を実装し、パフォーマンスを最適化する。

### 実装内容

#### 3.1 パッケージのインストール

```bash
npm install @vercel/kv
```

#### 3.2 環境変数の設定

**ファイル**: `.env.local`

```bash
# Vercel KV
KV_URL="redis://xxxx"
KV_REST_API_URL="https://xxxx"
KV_REST_API_TOKEN="xxxx"
KV_REST_API_READ_ONLY_TOKEN="xxxx"
```

#### 3.3 KV クライアントの作成

**ファイル**: `lib/kv.ts`

```typescript
import { kv } from "@vercel/kv";

// セッション管理
export async function setSession(userId: string, sessionData: any) {
  const sessionId = crypto.randomUUID();
  await kv.set(`session:${sessionId}`, sessionData, {
    ex: 60 * 60 * 24 * 7, // 7日間
  });
  return sessionId;
}

export async function getSession(sessionId: string) {
  return await kv.get(`session:${sessionId}`);
}

export async function deleteSession(sessionId: string) {
  await kv.del(`session:${sessionId}`);
}

// キャッシュ管理
export async function cacheData(key: string, data: any, ttl: number = 3600) {
  await kv.set(key, data, { ex: ttl });
}

export async function getCachedData(key: string) {
  return await kv.get(key);
}

// Rate Limiting
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60
) {
  const key = `ratelimit:${identifier}`;
  const current = await kv.incr(key);

  if (current === 1) {
    await kv.expire(key, window);
  }

  return {
    success: current <= limit,
    current,
    limit,
    reset: window,
  };
}
```

#### 3.4 認証システムの KV 移行

**ファイル**: `app/api/auth/route.ts`（更新）

```typescript
import { NextRequest, NextResponse } from "next/server";
import { setSession, deleteSession } from "@/lib/kv";
import { checkRateLimit } from "@/lib/kv";

const DEMO_USERS = [
  {
    id: "1",
    email: "user@example.com",
    password: "password123",
    name: "山田太郎",
  },
  { id: "2", email: "admin@example.com", password: "admin123", name: "管理者" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password } = body;
    const loginIdentifier = username || email;

    // Rate Limiting チェック
    const rateLimit = await checkRateLimit(loginIdentifier, 5, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please try again in ${rateLimit.reset} seconds.`,
        },
        { status: 429 }
      );
    }

    // バリデーション
    if (!loginIdentifier || typeof loginIdentifier !== "string") {
      return NextResponse.json(
        { success: false, error: "Username or email is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    // ユーザー検証
    const user = DEMO_USERS.find(
      (u) =>
        (u.email === loginIdentifier && u.password === password) ||
        (loginIdentifier === "admin" && password === "password")
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // セッションを KV に保存
    const sessionId = await setSession(user.id, {
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        message: "Login successful",
      },
      { status: 200 }
    );

    // Cookie にセッション ID をセット
    response.cookies.set("session-id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });

    return response;
  } catch (error) {
    console.error("Error during authentication:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session-id")?.value;

    if (sessionId) {
      await deleteSession(sessionId);
    }

    const response = NextResponse.json(
      { success: true, message: "Logout successful" },
      { status: 200 }
    );

    response.cookies.delete("session-id");

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}
```

#### 3.5 KV デモページ

**ファイル**: `app/kv-demo/page.tsx`

```typescript
"use client";

import { useState } from "react";

export default function KVDemo() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSet = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", key, value }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to set value" });
    } finally {
      setLoading(false);
    }
  };

  const handleGet = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/kv?key=${key}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to get value" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">🗄️ Vercel KV Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Set Value */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Set Value</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="mykey"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="myvalue"
              />
            </div>
            <button
              onClick={handleSet}
              disabled={loading || !key || !value}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Set Value
            </button>
          </div>
        </div>

        {/* Get Value */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Get Value</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="mykey"
              />
            </div>
            <button
              onClick={handleGet}
              disabled={loading || !key}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              Get Value
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">Result</h3>
          <pre className="bg-white p-4 rounded border overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Features */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">💡 Features</h3>
        <ul className="space-y-2 text-gray-700">
          <li>✅ Redis ベースの高速キャッシュ</li>
          <li>✅ セッション管理</li>
          <li>✅ Rate Limiting</li>
          <li>✅ TTL（有効期限）設定</li>
          <li>✅ グローバル分散</li>
        </ul>
      </div>
    </div>
  );
}
```

### チェックリスト

- [ ] @vercel/kv をインストール
- [ ] Vercel KV ストアを作成
- [ ] 環境変数を設定
- [ ] KV ヘルパー関数を実装
- [ ] 認証システムを KV に移行
- [ ] Rate Limiting を実装
- [ ] デモページを作成
- [ ] Git コミット

### 期待される結果

- ✅ セッションが KV に保存される
- ✅ Rate Limiting が機能する
- ✅ キャッシュが高速に動作する

---

## Phase 4: AI SDK

### 目的

Vercel AI SDK を使用して、ストリーミング対応のチャットボットを実装する。

### 実装内容

#### 4.1 パッケージのインストール

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

#### 4.2 環境変数の設定

**ファイル**: `.env.local`

```bash
# OpenAI API Key (オプション)
OPENAI_API_KEY="sk-xxxx"

# Anthropic API Key (推奨)
ANTHROPIC_API_KEY="sk-ant-xxxx"
```

#### 4.3 Chat API の作成

**ファイル**: `app/api/chat/route.ts`

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic("claude-3-5-sonnet-20241022"),
    system: "You are a helpful assistant for a Next.js 16 sandbox application.",
    messages,
  });

  return result.toDataStreamResponse();
}
```

#### 4.4 チャットページの作成

**ファイル**: `app/ai-chat/page.tsx`

```typescript
"use client";

import { useChat } from "ai/react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">🤖 AI Chat</h1>

      <div className="bg-white rounded-lg shadow">
        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg">Start a conversation!</p>
              <p className="text-sm mt-2">
                Ask me anything about Next.js, React, or web development.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex space-x-4">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Features */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">💡 Features</h3>
        <ul className="space-y-2 text-gray-700">
          <li>✅ Real-time streaming responses</li>
          <li>✅ Powered by Claude 3.5 Sonnet</li>
          <li>✅ Context-aware conversations</li>
          <li>✅ Optimized for Next.js 16</li>
        </ul>
      </div>
    </div>
  );
}
```

### チェックリスト

- [ ] AI SDK をインストール
- [ ] API キーを設定
- [ ] Chat API を実装
- [ ] チャットページを作成
- [ ] Sidebar にリンクを追加
- [ ] ローカルで動作確認
- [ ] Git コミット

### 期待される結果

- ✅ リアルタイムで AI の応答がストリーミングされる
- ✅ 会話の文脈が保持される
- ✅ Claude 3.5 Sonnet が応答

---

## Phase 5: Edge Config

### 目的

Feature Flags と動的設定を実装し、デプロイなしで設定を変更できるようにする。

### 実装内容

#### 5.1 パッケージのインストール

```bash
npm install @vercel/edge-config
```

#### 5.2 Edge Config の作成

Vercel ダッシュボードで:

1. Edge Config → Create
2. 名前: `next16-sandbox-config`
3. 初期値を設定

#### 5.3 環境変数の設定

**ファイル**: `.env.local`

```bash
EDGE_CONFIG="https://edge-config.vercel.com/xxxx"
```

#### 5.4 Feature Flags の実装

**ファイル**: `lib/edge-config.ts`

```typescript
import { get, getAll } from "@vercel/edge-config";

export async function getFeatureFlag(key: string): Promise<boolean> {
  try {
    return (await get(key)) ?? false;
  } catch (error) {
    console.error("Failed to get feature flag:", error);
    return false;
  }
}

export async function getAllFeatureFlags() {
  try {
    return await getAll();
  } catch (error) {
    console.error("Failed to get all feature flags:", error);
    return {};
  }
}
```

#### 5.5 Feature Flags デモページ

**ファイル**: `app/feature-flags/page.tsx`

```typescript
import { getAllFeatureFlags } from "@/lib/edge-config";

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
              <span className="font-medium">{key}</span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
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
          <li>2. Navigate to Edge Config</li>
          <li>3. Update the values</li>
          <li>4. Changes take effect immediately (no deploy needed!)</li>
        </ol>
      </div>
    </div>
  );
}
```

### チェックリスト

- [ ] @vercel/edge-config をインストール
- [ ] Edge Config を作成
- [ ] 環境変数を設定
- [ ] ヘルパー関数を実装
- [ ] デモページを作成
- [ ] Git コミット

---

## Phase 6: Vercel Postgres

### 目的

Vercel Postgres と Prisma を統合し、本格的なデータベース駆動アプリケーションを構築する。

### 実装内容

#### 6.1 パッケージのインストール

```bash
npm install @vercel/postgres @prisma/client
npm install -D prisma
```

#### 6.2 Prisma の初期化

```bash
npx prisma init
```

#### 6.3 スキーマの定義

**ファイル**: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 6.4 マイグレーションの実行

```bash
# データベーススキーマを作成
npx prisma migrate dev --name init

# Prisma Client を生成
npx prisma generate
```

#### 6.5 Prisma Client の作成

**ファイル**: `lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

#### 6.6 ユーザー登録 API

**ファイル**: `app/api/users/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    // バリデーション
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
```

### チェックリスト

- [ ] Vercel Postgres を作成
- [ ] @vercel/postgres と Prisma をインストール
- [ ] スキーマを定義
- [ ] マイグレーションを実行
- [ ] CRUD API を実装
- [ ] ユーザー管理ページを作成
- [ ] Git コミット

---

## デプロイ戦略

### 環境変数の設定

Vercel ダッシュボードで以下を設定：

```bash
# Analytics & Speed Insights
# (自動設定)

# Blob
BLOB_READ_WRITE_TOKEN

# KV
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN

# AI SDK
ANTHROPIC_API_KEY
# または
OPENAI_API_KEY

# Edge Config
EDGE_CONFIG

# Postgres
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
```

### デプロイコマンド

```bash
# 本番デプロイ
vercel --prod

# プレビューデプロイ
vercel
```

---

## トラブルシューティング

### Blob アップロードが失敗する

```bash
# トークンを確認
echo $BLOB_READ_WRITE_TOKEN

# Vercel CLI で確認
vercel env ls
```

### KV 接続エラー

```bash
# KV ストアが作成されているか確認
vercel kv ls

# 環境変数を再設定
vercel env add KV_URL
```

### Prisma マイグレーションエラー

```bash
# スキーマをリセット
npx prisma migrate reset

# 再度マイグレーション
npx prisma migrate dev
```

---

## 完成イメージ

### 機能一覧

- ✅ Analytics & Speed Insights でパフォーマンス測定
- ✅ Vercel Blob で画像アップロード
- ✅ Vercel KV でセッション管理とキャッシュ
- ✅ AI SDK でチャットボット
- ✅ Edge Config で Feature Flags
- ✅ Vercel Postgres でデータ永続化

### アプリケーション構成

```
next16-sandbox/
├── app/
│   ├── analytics-demo/      # Analytics デモ
│   ├── upload/              # Blob アップロード
│   ├── kv-demo/             # KV デモ
│   ├── ai-chat/             # AI チャット
│   ├── feature-flags/       # Edge Config デモ
│   └── users/               # Postgres CRUD
├── lib/
│   ├── kv.ts               # KV ヘルパー
│   ├── edge-config.ts      # Edge Config ヘルパー
│   └── prisma.ts           # Prisma Client
└── prisma/
    └── schema.prisma       # データベーススキーマ
```

---

**最終更新**: 2025 年 11 月
**ステータス**: 計画中
