# API 設計 学習ノート

## 概要

API 設計は、開発者体験（DX）とシステムの保守性に直結する重要な領域。REST、GraphQL、gRPC の特性を理解し、適切に選択する。

## REST API 設計原則

### リソース指向

```
✅ 良い例（名詞、複数形）
GET    /users          - ユーザー一覧
GET    /users/123      - 特定ユーザー
POST   /users          - ユーザー作成
PATCH  /users/123      - ユーザー更新
DELETE /users/123      - ユーザー削除

❌ 悪い例（動詞、アクション指向）
GET    /getUsers
POST   /createUser
POST   /deleteUser/123
```

### ネスト vs フラット

```
✅ ネスト（関係性が明確な場合）
GET /users/123/posts
GET /posts/456/comments

✅ フラット（独立したリソース）
GET /posts?userId=123
GET /comments?postId=456
```

### クエリパラメータ

```
# フィルタリング
GET /posts?status=published&authorId=123

# ソート
GET /posts?sort=-createdAt,title

# ページネーション
GET /posts?page=2&limit=20
GET /posts?cursor=abc123&limit=20

# フィールド選択
GET /users/123?fields=id,name,email
```

## HTTP ステータスコード

| コード                    | 用途                           |
| ------------------------- | ------------------------------ |
| 200 OK                    | 成功（GET, PATCH）             |
| 201 Created               | 作成成功（POST）               |
| 204 No Content            | 成功、レスポンスなし（DELETE） |
| 400 Bad Request           | リクエスト不正                 |
| 401 Unauthorized          | 認証必要                       |
| 403 Forbidden             | 認可エラー                     |
| 404 Not Found             | リソースなし                   |
| 409 Conflict              | 競合（重複など）               |
| 422 Unprocessable Entity  | バリデーションエラー           |
| 429 Too Many Requests     | レート制限                     |
| 500 Internal Server Error | サーバーエラー                 |

## エラーレスポンス

```typescript
// 一貫したエラー形式
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// 例
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["Invalid email format"],
      "password": ["Must be at least 8 characters"]
    }
  }
}
```

## Next.js Route Handlers

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const users = await prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({
    data: users,
    meta: { page, limit, total: await prisma.user.count() },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", details: result.error.flatten() } },
      { status: 422 },
    );
  }

  const user = await prisma.user.create({ data: result.data });

  return NextResponse.json({ data: user }, { status: 201 });
}
```

## API バージョニング

```typescript
// URL パス方式
// /api/v1/users
// /api/v2/users

// app/api/v1/users/route.ts
export async function GET() {
  // v1 実装
}

// app/api/v2/users/route.ts
export async function GET() {
  // v2 実装（新しいレスポンス形式）
}
```

## 認証・認可

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const token = request.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Token required" } },
        { status: 401 },
      );
    }

    try {
      const payload = await verifyToken(token);
      const headers = new Headers(request.headers);
      headers.set("x-user-id", payload.userId);
      return NextResponse.next({ headers });
    } catch {
      return NextResponse.json(
        { error: { code: "INVALID_TOKEN", message: "Invalid token" } },
        { status: 401 },
      );
    }
  }
}
```

## OpenAPI / Swagger

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0

paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/User"

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        name:
          type: string
```

## ベストプラクティス

1. **一貫性**: 命名規則、エラー形式を統一
2. **ドキュメント**: OpenAPI で仕様を明文化
3. **バージョニング**: 破壊的変更に備える
4. **レート制限**: 乱用防止
5. **CORS**: 必要なオリジンのみ許可
6. **圧縮**: gzip でレスポンスサイズ削減

## 参考リソース

- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [JSON API Specification](https://jsonapi.org/)
