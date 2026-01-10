---
created: 2025-11-08
tags: [nextjs, route-handlers, api, rest, examples]
status: 完了
related:
  - "[[server-actions-examples]]"
  - "[[Next.js-16-Extended-Learning-Path]]"
---

# Route Handlers 実装例

Next.js 16 の Route Handlers (API Routes) の実装例とベストプラクティス。

## 📋 概要

Route Handlers は Next.js の App Router で RESTful API を構築するための機能。

### 主な特徴

- **Web Request/Response API を使用**
- **全 HTTP メソッド対応** (GET, POST, PUT, DELETE, OPTIONS)
- **動的ルート対応**
- **Middleware 統合可能**
- **Edge/Node.js Runtime 選択可能**

---

## 🎯 基本構造

### ファイル配置

```
app/
└── api/
    ├── posts/
    │   ├── route.ts              # /api/posts
    │   └── [id]/
    │       └── route.ts          # /api/posts/[id]
    └── auth/
        └── route.ts              # /api/auth
```

### 基本的な Route Handler

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET /api/posts
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello from API" });
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ data: body }, { status: 201 });
}
```

---

## 📖 実装例

### 1. GET - データ取得

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllPosts } from "@/app/actions/posts";

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get("published");
    const limit = searchParams.get("limit");

    let posts = getAllPosts();

    // フィルタリング
    if (published === "true") {
      posts = posts.filter((post) => post.published);
    }

    // リミット適用
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum)) {
        posts = posts.slice(0, limitNum);
      }
    }

    return NextResponse.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
```

**使用例:**

```bash
GET /api/posts
GET /api/posts?published=true
GET /api/posts?limit=5
```

---

### 2. POST - データ作成

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, author, published } = body;

    // バリデーション
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // データ作成
    const newPost = createPost({
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
      published,
    });

    return NextResponse.json(
      {
        success: true,
        data: newPost,
        message: "Post created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 }
    );
  }
}
```

---

### 3. 動的ルート - [id]

```typescript
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/posts/[id]
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const post = getPostById(id);

  if (!post) {
    return NextResponse.json(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: post,
  });
}

// PUT /api/posts/[id]
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const updatedPost = updatePost(id, body);

  if (!updatedPost) {
    return NextResponse.json(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: updatedPost,
    message: "Post updated successfully",
  });
}

// DELETE /api/posts/[id]
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const deleted = deletePost(id);

  if (!deleted) {
    return NextResponse.json(
      { success: false, error: "Post not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Post deleted successfully",
  });
}
```

---

### 4. 認証エンドポイント

```typescript
// app/api/auth/route.ts
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // ユーザー検証
  const user = verifyUser(email, password);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // トークン生成
  const token = generateToken(user);

  // Cookieにセット
  const response = NextResponse.json({
    success: true,
    data: { user, token },
  });

  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24時間
  });

  return response;
}

// ログアウト
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Logout successful",
  });

  response.cookies.delete("auth-token");
  return response;
}
```

---

## 🛠️ ヘルパー関数

### CORS & エラーハンドリング

```typescript
// app/api/lib/helpers.ts
import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: CORS_HEADERS,
  });
}

export function errorResponse(error: string, status = 400) {
  return corsResponse({ success: false, error }, status);
}

export function successResponse(data: unknown, message?: string) {
  return corsResponse({
    success: true,
    data,
    ...(message && { message }),
  });
}

export function notFoundError(resource = "Resource") {
  return errorResponse(`${resource} not found`, 404);
}

export function serverError(error?: unknown) {
  console.error("Server error:", error);
  return errorResponse("Internal server error", 500);
}
```

---

## 💻 クライアント側の実装

### fetch API での使用

```typescript
// GET リクエスト
const fetchPosts = async () => {
  const response = await fetch("/api/posts");
  const data = await response.json();

  if (data.success) {
    return data.data;
  }
  throw new Error(data.error);
};

// POST リクエスト
const createPost = async (postData) => {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.data;
};

// PUT リクエスト
const updatePost = async (id, updates) => {
  const response = await fetch(`/api/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  return response.json();
};

// DELETE リクエスト
const deletePost = async (id) => {
  const response = await fetch(`/api/posts/${id}`, {
    method: "DELETE",
  });

  return response.json();
};
```

### エラーハンドリング

```typescript
const fetchWithErrorHandling = async () => {
  try {
    const response = await fetch("/api/posts");
    const data = await response.json();

    if (!data.success) {
      setError(data.error);
      return;
    }

    setPosts(data.data);
  } catch (err) {
    setError("Network error occurred");
  }
};
```

---

## 🔑 ベストプラクティス

### 1. レスポンス形式の統一

```typescript
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
```

### 2. バリデーション

```typescript
if (!title || typeof title !== "string" || title.trim().length === 0) {
  return NextResponse.json(
    { success: false, error: "Invalid title" },
    { status: 400 }
  );
}
```

### 3. エラーハンドリング

```typescript
try {
  // 処理
} catch (error) {
  console.error("Error:", error);
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}
```

### 4. CORS 設定

```typescript
const response = NextResponse.json(data);
response.headers.set("Access-Control-Allow-Origin", "*");
return response;
```

### 5. Cookie 操作

```typescript
// Cookie設定
response.cookies.set("name", "value", {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 3600,
});

// Cookie取得
const token = request.cookies.get("auth-token");

// Cookie削除
response.cookies.delete("auth-token");
```

---

## 📊 HTTP ステータスコード

| コード | 意味                  | 使用例                 |
| ------ | --------------------- | ---------------------- |
| 200    | OK                    | 成功レスポンス         |
| 201    | Created               | リソース作成成功       |
| 204    | No Content            | OPTIONS レスポンス     |
| 400    | Bad Request           | バリデーションエラー   |
| 401    | Unauthorized          | 認証エラー             |
| 404    | Not Found             | リソースが見つからない |
| 500    | Internal Server Error | サーバーエラー         |

---

## 🔄 Server Actions との比較

| 特徴           | Route Handlers            | Server Actions       |
| -------------- | ------------------------- | -------------------- |
| 用途           | RESTful API               | フォーム処理         |
| HTTP メソッド  | 全て対応                  | POST のみ            |
| クライアント   | 外部 API としても使用可能 | Next.js アプリ内のみ |
| レスポンス形式 | 自由                      | FormData/JSON        |
| 推奨用途       | API 構築                  | フォーム・UI 操作    |

---

## 🚀 実装済みファイル

### プロジェクト内の実装

```
next16-sandbox/
├── app/
│   ├── api/
│   │   ├── posts/
│   │   │   ├── route.ts         # GET, POST /api/posts
│   │   │   └── [id]/
│   │   │       └── route.ts     # GET, PUT, DELETE /api/posts/[id]
│   │   ├── auth/
│   │   │   └── route.ts         # POST, DELETE /api/auth
│   │   └── lib/
│   │       └── helpers.ts       # ヘルパー関数
│   └── api-demo/
│       └── page.tsx             # デモページ
```

### デモページ

- URL: `/api-demo`
- 機能: フロントエンドからの API 呼び出し実装例

---

## 📚 参考リンク

- [Next.js Route Handlers 公式ドキュメント](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Web Request API](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- [Web Response API](https://developer.mozilla.org/en-US/docs/Web/API/Response)

---

## 🎓 学習のポイント

1. **RESTful 設計** - 適切な HTTP メソッドとステータスコード
2. **エラーハンドリング** - 統一されたエラーレスポンス
3. **バリデーション** - 入力データの検証
4. **CORS 対応** - クロスオリジンリクエスト対応
5. **セキュリティ** - 認証・認可の実装

---

**作成日**: 2025-11-08
**Phase 1.5**: Route Handlers (API Routes) 実装完了
