# 14 - API Routes

## 概要

この章では、Next.js の Route Handlers（API ルート）について学びます。RESTful API の作成、リクエスト/レスポンスの処理、認証との統合などを解説します。

## Route Handlers の基本

### 基本的な構文

```typescript
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: "Hello, World!" });
}
```

### HTTP メソッド

```typescript
// app/api/posts/route.ts

// GET - データ取得
export async function GET() {
  const posts = await db.post.findMany();
  return Response.json(posts);
}

// POST - データ作成
export async function POST(request: Request) {
  const body = await request.json();
  const post = await db.post.create({ data: body });
  return Response.json(post, { status: 201 });
}

// PUT - データ更新（全体）
export async function PUT(request: Request) {
  const body = await request.json();
  const post = await db.post.update({
    where: { id: body.id },
    data: body,
  });
  return Response.json(post);
}

// PATCH - データ更新（部分）
export async function PATCH(request: Request) {
  const body = await request.json();
  const post = await db.post.update({
    where: { id: body.id },
    data: body,
  });
  return Response.json(post);
}

// DELETE - データ削除
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  await db.post.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
```

## 動的ルート

### パラメータの取得

```typescript
// app/api/posts/[id]/route.ts
interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;

  const post = await db.post.findUnique({
    where: { id },
  });

  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(post);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const post = await db.post.update({
    where: { id },
    data: body,
  });

  return Response.json(post);
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;

  await db.post.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
```

### ネストされたパラメータ

```typescript
// app/api/users/[userId]/posts/[postId]/route.ts
interface Params {
  params: Promise<{ userId: string; postId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const { userId, postId } = await params;

  const post = await db.post.findFirst({
    where: {
      id: postId,
      authorId: userId,
    },
  });

  return Response.json(post);
}
```

## リクエストの処理

### クエリパラメータ

```typescript
// app/api/posts/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";

  const posts = await db.post.findMany({
    where: {
      title: { contains: search },
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return Response.json({
    data: posts,
    page,
    limit,
  });
}
```

### リクエストボディ

```typescript
// JSON
export async function POST(request: Request) {
  const body = await request.json();
  return Response.json(body);
}

// FormData
export async function POST(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name");
  const file = formData.get("file") as File;

  return Response.json({ name, fileName: file?.name });
}

// テキスト
export async function POST(request: Request) {
  const text = await request.text();
  return new Response(text);
}

// Blob
export async function POST(request: Request) {
  const blob = await request.blob();
  return new Response(blob);
}
```

### ヘッダー

```typescript
import { headers } from "next/headers";

export async function GET() {
  const headersList = await headers();

  const authorization = headersList.get("authorization");
  const contentType = headersList.get("content-type");
  const userAgent = headersList.get("user-agent");

  return Response.json({
    authorization,
    contentType,
    userAgent,
  });
}
```

### Cookie

```typescript
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  // Cookie を読む
  const token = cookieStore.get("token");

  return Response.json({ token: token?.value });
}

export async function POST() {
  const cookieStore = await cookies();

  // Cookie を設定
  cookieStore.set("token", "abc123", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 1週間
  });

  return Response.json({ success: true });
}
```

## レスポンスの処理

### Response.json()

```typescript
export async function GET() {
  // 基本
  return Response.json({ message: "Hello" });

  // ステータスコード付き
  return Response.json({ error: "Not found" }, { status: 404 });

  // ヘッダー付き
  return Response.json(
    { data: "value" },
    {
      status: 200,
      headers: {
        "X-Custom-Header": "value",
      },
    }
  );
}
```

### NextResponse

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  // リダイレクト
  return NextResponse.redirect(new URL("/login", request.url));

  // リライト
  return NextResponse.rewrite(new URL("/api/v2/posts", request.url));

  // Cookie 設定
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", "value", { httpOnly: true });
  return response;
}
```

### ストリーミングレスポンス

```typescript
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`data: ${i}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

## エラーハンドリング

### try-catch

```typescript
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const post = await db.post.findUnique({ where: { id } });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    return Response.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### カスタムエラークラス

```typescript
// lib/errors.ts
export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}
```

```typescript
// app/api/posts/[id]/route.ts
import { NotFoundError } from "@/lib/errors";

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const post = await db.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundError("Post not found");
    }

    return Response.json(post);
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## バリデーション

### Zod を使用

```typescript
// lib/validations.ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  published: z.boolean().default(false),
});

export const updatePostSchema = createPostSchema.partial();
```

```typescript
// app/api/posts/route.ts
import { createPostSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    const post = await db.post.create({
      data: validatedData,
    });

    return Response.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## 認証

### セッションチェック

```typescript
// lib/auth.ts
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const payload = verify(token, process.env.JWT_SECRET!);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}
```

```typescript
// app/api/protected/route.ts
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ user: session });
}
```

### 認証ミドルウェア

```typescript
// lib/withAuth.ts
type Handler = (request: Request, context: any) => Promise<Response>;

export function withAuth(handler: Handler): Handler {
  return async (request, context) => {
    const session = await getSession();

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // セッションをコンテキストに追加
    context.session = session;

    return handler(request, context);
  };
}
```

```typescript
// app/api/protected/route.ts
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (request, context) => {
  const { session } = context;
  return Response.json({ user: session });
});
```

## CORS

### CORS ヘッダー

```typescript
export async function GET() {
  return Response.json(
    { data: "value" },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
```

## ファイルアップロード

```typescript
// app/api/upload/route.ts
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name}`;
  const path = join(process.cwd(), "public/uploads", filename);

  await writeFile(path, buffer);

  return Response.json({
    success: true,
    url: `/uploads/${filename}`,
  });
}
```

## キャッシュ設定

```typescript
// 動的（デフォルト）
export const dynamic = "force-dynamic";

// 静的
export const dynamic = "force-static";

// 再検証
export const revalidate = 3600; // 1時間

export async function GET() {
  const data = await fetchData();
  return Response.json(data);
}
```

## まとめ

- **route.ts** で API エンドポイントを定義
- **HTTP メソッド** 関数をエクスポート
- **動的ルート** で `[param]` を使用
- **リクエスト** から body, headers, cookies を取得
- **Response.json()** でレスポンスを返す
- **Zod** でバリデーション
- **セッション** で認証

## 演習問題

1. CRUD API を実装してください
2. Zod を使ったバリデーションを追加してください
3. 認証付きエンドポイントを作成してください
4. ファイルアップロード API を実装してください

## 次のステップ

次の章では、ミドルウェアについて学びます。

⬅️ 前へ: [13-Image-and-Font-Optimization.md](./13-Image-and-Font-Optimization.md)
➡️ 次へ: [15-Middleware.md](./15-Middleware.md)
