# 第5章: エラーハンドリング

## HTTPException

```typescript
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

app.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await findUser(id);

  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return c.json(user);
});
```

### HTTPException のオプション

```typescript
throw new HTTPException(400, {
  message: "Validation failed",
  cause: originalError,  // 元のエラー
});

// レスポンスを直接指定
throw new HTTPException(401, {
  res: new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Bearer realm="api"',
    },
  }),
});
```

## グローバルエラーハンドラー

```typescript
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  // 予期しないエラー
  return c.json(
    {
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    },
    500,
  );
});
```

### 詳細なエラーハンドラー

```typescript
app.onError((err, c) => {
  const requestId = c.get("requestId") || "unknown";

  // ログ出力
  console.error({
    requestId,
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  // HTTPException
  if (err instanceof HTTPException) {
    const response = err.getResponse();
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: response.status,
          message: err.message,
        },
        requestId,
      }),
      {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Zod バリデーションエラー
  if (err.name === "ZodError") {
    return c.json(
      {
        success: false,
        error: {
          code: 400,
          message: "Validation failed",
          details: err.errors,
        },
        requestId,
      },
      400,
    );
  }

  // その他のエラー
  return c.json(
    {
      success: false,
      error: {
        code: 500,
        message: "Internal Server Error",
      },
      requestId,
    },
    500,
  );
});
```

## カスタムエラークラス

```typescript
// errors/index.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, "NOT_FOUND", `${resource} with id ${id} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(400, "VALIDATION_ERROR", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}
```

### カスタムエラーの使用

```typescript
import { NotFoundError, ConflictError } from "./errors";

app.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = await findUser(id);

  if (!user) {
    throw new NotFoundError("User", id);
  }

  return c.json(user);
});

app.post("/users", async (c) => {
  const data = await c.req.json();
  const existing = await findUserByEmail(data.email);

  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const user = await createUser(data);
  return c.json(user, 201);
});
```

### カスタムエラーハンドラー

```typescript
import { AppError } from "./errors";

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err instanceof ValidationError && { details: err.details }),
        },
      },
      err.statusCode,
    );
  }

  // 予期しないエラー
  console.error(err);
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal Server Error",
      },
    },
    500,
  );
});
```

## Not Found ハンドラー

```typescript
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404,
  );
});
```

## エラーレスポンスの型

```typescript
// types/response.ts
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  requestId?: string;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// ヘルパー関数
const success = <T>(c: Context, data: T, status = 200) => {
  return c.json({ success: true, data }, status);
};

const error = (c: Context, code: string, message: string, status = 400) => {
  return c.json(
    {
      success: false,
      error: { code, message },
    },
    status,
  );
};
```

## try-catch パターン

```typescript
// 明示的な try-catch
app.post("/users", async (c) => {
  try {
    const data = await c.req.json();
    const user = await createUser(data);
    return c.json({ success: true, data: user }, 201);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return c.json(
        {
          success: false,
          error: { code: "DUPLICATE", message: "Email already exists" },
        },
        409,
      );
    }
    throw err;  // 他のエラーは onError へ
  }
});
```

## 非同期エラー処理ユーティリティ

```typescript
// utils/async-handler.ts
type AsyncHandler = (c: Context) => Promise<Response>;

const asyncHandler = (handler: AsyncHandler) => {
  return async (c: Context) => {
    try {
      return await handler(c);
    } catch (err) {
      throw err;  // onError へ
    }
  };
};

// 使用
app.get(
  "/users/:id",
  asyncHandler(async (c) => {
    const user = await findUser(c.req.param("id"));
    if (!user) throw new NotFoundError("User", c.req.param("id"));
    return c.json(user);
  }),
);
```

## 本番環境での考慮事項

```typescript
const isDev = process.env.NODE_ENV === "development";

app.onError((err, c) => {
  // 本番では詳細を隠す
  const errorResponse = {
    success: false,
    error: {
      code: err instanceof AppError ? err.code : "INTERNAL_ERROR",
      message: err instanceof AppError ? err.message : "Internal Server Error",
      ...(isDev && { stack: err.stack }),
    },
  };

  const status = err instanceof AppError ? err.statusCode : 500;

  return c.json(errorResponse, status);
});
```

## 次のステップ

次章では、様々なランタイムについて詳しく学びます。
