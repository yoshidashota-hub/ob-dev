# 第4章: バリデーション

## Zod バリデーター

### セットアップ

```bash
npm install @hono/zod-validator zod
```

### 基本的な使い方

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

// JSON ボディのバリデーション
const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(0).max(120).optional(),
});

app.post(
  "/users",
  zValidator("json", createUserSchema),
  (c) => {
    const data = c.req.valid("json");  // 型安全
    return c.json({ user: data }, 201);
  },
);
```

### バリデーションターゲット

```typescript
// クエリパラメータ
const searchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

app.get(
  "/search",
  zValidator("query", searchSchema),
  (c) => {
    const { q, page, limit } = c.req.valid("query");
    return c.json({ q, page, limit });
  },
);

// パスパラメータ
const idSchema = z.object({
  id: z.string().uuid(),
});

app.get(
  "/users/:id",
  zValidator("param", idSchema),
  (c) => {
    const { id } = c.req.valid("param");
    return c.json({ id });
  },
);

// ヘッダー
const headerSchema = z.object({
  authorization: z.string().startsWith("Bearer "),
});

app.get(
  "/protected",
  zValidator("header", headerSchema),
  (c) => {
    const { authorization } = c.req.valid("header");
    return c.text("OK");
  },
);

// フォーム
const formSchema = z.object({
  username: z.string(),
  password: z.string().min(8),
});

app.post(
  "/login",
  zValidator("form", formSchema),
  (c) => {
    const { username, password } = c.req.valid("form");
    return c.json({ username });
  },
);
```

### カスタムエラーハンドリング

```typescript
app.post(
  "/users",
  zValidator("json", createUserSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          errors: result.error.flatten().fieldErrors,
        },
        400,
      );
    }
  }),
  (c) => {
    const data = c.req.valid("json");
    return c.json({ success: true, data });
  },
);
```

### 複数バリデーション

```typescript
app.put(
  "/users/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", updateUserSchema),
  (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    return c.json({ id, ...data });
  },
);
```

## Valibot バリデーター

```bash
npm install @hono/valibot-validator valibot
```

```typescript
import { vValidator } from "@hono/valibot-validator";
import * as v from "valibot";

const userSchema = v.object({
  name: v.pipe(v.string(), v.minLength(2)),
  email: v.pipe(v.string(), v.email()),
});

app.post(
  "/users",
  vValidator("json", userSchema),
  (c) => {
    const data = c.req.valid("json");
    return c.json(data);
  },
);
```

## TypeBox バリデーター

```bash
npm install @hono/typebox-validator @sinclair/typebox
```

```typescript
import { tbValidator } from "@hono/typebox-validator";
import { Type } from "@sinclair/typebox";

const userSchema = Type.Object({
  name: Type.String({ minLength: 2 }),
  email: Type.String({ format: "email" }),
});

app.post(
  "/users",
  tbValidator("json", userSchema),
  (c) => {
    const data = c.req.valid("json");
    return c.json(data);
  },
);
```

## 実践的なスキーマ例

### ユーザー登録

```typescript
const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上必要です")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "パスワードには大文字、小文字、数字を含めてください",
    ),
  confirmPassword: z.string(),
  name: z.string().min(2).max(50),
  terms: z.literal(true, {
    errorMap: () => ({ message: "利用規約に同意してください" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

app.post("/register", zValidator("json", registerSchema), async (c) => {
  const data = c.req.valid("json");
  // 登録処理
  return c.json({ success: true });
});
```

### ページネーション

```typescript
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  orderBy: z.string().optional(),
});

app.get("/items", zValidator("query", paginationSchema), (c) => {
  const { page, limit, sort, orderBy } = c.req.valid("query");
  return c.json({ page, limit, sort, orderBy });
});
```

### 検索フィルター

```typescript
const filterSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  tags: z.string().transform((s) => s.split(",")).optional(),
  createdAfter: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  { message: "minPrice must be less than maxPrice" },
);
```

### ファイルアップロード

```typescript
const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    "ファイルサイズは5MB以下にしてください",
  ).refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "JPEG、PNG、WebP のみ対応しています",
  ),
  description: z.string().max(500).optional(),
});

app.post("/upload", zValidator("form", uploadSchema), async (c) => {
  const { file, description } = c.req.valid("form");
  // アップロード処理
  return c.json({ success: true });
});
```

## 型推論

```typescript
// スキーマから型を推論
type CreateUserInput = z.infer<typeof createUserSchema>;
// { name: string; email: string; age?: number }

// ルートで使用
app.post(
  "/users",
  zValidator("json", createUserSchema),
  async (c) => {
    const data: CreateUserInput = c.req.valid("json");
    const user = await createUser(data);
    return c.json(user, 201);
  },
);
```

## バリデーションユーティリティ

```typescript
// 共通スキーマ
const idParamSchema = z.object({
  id: z.string().uuid(),
});

const timestampSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// 再利用
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
}).merge(timestampSchema);

// バリデーションヘルパー
const withIdParam = zValidator("param", idParamSchema);
const withPagination = zValidator("query", paginationSchema);

app.get("/users/:id", withIdParam, (c) => {
  const { id } = c.req.valid("param");
  return c.json({ id });
});
```

## 次のステップ

次章では、エラーハンドリングについて詳しく学びます。
