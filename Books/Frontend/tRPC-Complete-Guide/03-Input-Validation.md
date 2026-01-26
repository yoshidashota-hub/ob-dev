# 03 - 入力バリデーション

## この章で学ぶこと

- Zod を使った入力バリデーション
- スキーマの定義パターン
- カスタムバリデーション
- エラーメッセージのカスタマイズ

## Zod の基本

Zod は TypeScript ファーストのスキーマバリデーションライブラリです。

### 基本的な型

```typescript
import { z } from "zod";

// プリミティブ型
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const dateSchema = z.date();

// リテラル
const literalSchema = z.literal("hello");
const enumSchema = z.enum(["pending", "active", "completed"]);

// オプショナルとnull
const optionalSchema = z.string().optional(); // string | undefined
const nullableSchema = z.string().nullable();  // string | null
const nullishSchema = z.string().nullish();    // string | null | undefined
```

### オブジェクトスキーマ

```typescript
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(["user", "admin"]).default("user"),
});

type User = z.infer<typeof UserSchema>;
// { id: string; name: string; email: string; age?: number; role: "user" | "admin" }
```

### 配列スキーマ

```typescript
const TagsSchema = z.array(z.string());
const UsersSchema = z.array(UserSchema);

// 制約付き配列
const LimitedArray = z.array(z.string()).min(1).max(10);
const NonEmptyArray = z.array(z.string()).nonempty();
```

## tRPC での使用

### 基本的な入力バリデーション

```typescript
import { router, publicProcedure } from "./trpc";
import { z } from "zod";

const appRouter = router({
  // シンプルな入力
  greet: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return `Hello, ${input.name}!`;
    }),

  // 複雑な入力
  createPost: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        content: z.string().min(10),
        tags: z.array(z.string()).optional(),
        published: z.boolean().default(false),
      })
    )
    .mutation(({ input }) => {
      return db.post.create({ data: input });
    }),
});
```

### 再利用可能なスキーマ

```typescript
// schemas/user.ts
import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase")
    .regex(/[0-9]/, "Password must contain number"),
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: z.string(),
});

export const UserIdSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
});

// routers/user.ts
import { CreateUserSchema, UpdateUserSchema, UserIdSchema } from "../schemas/user";

export const userRouter = router({
  create: publicProcedure.input(CreateUserSchema).mutation(({ input }) => {
    // input は完全に型付けされている
    return db.user.create({ data: input });
  }),

  update: protectedProcedure.input(UpdateUserSchema).mutation(({ input }) => {
    const { id, ...data } = input;
    return db.user.update({ where: { id }, data });
  }),

  delete: protectedProcedure.input(UserIdSchema).mutation(({ input }) => {
    return db.user.delete({ where: { id: input.id } });
  }),
});
```

## 高度なバリデーション

### 条件付きバリデーション

```typescript
// refine でカスタムバリデーション
const PasswordSchema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// superRefine でより詳細な制御
const FormSchema = z
  .object({
    type: z.enum(["personal", "business"]),
    companyName: z.string().optional(),
    taxId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "business") {
      if (!data.companyName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company name is required for business accounts",
          path: ["companyName"],
        });
      }
      if (!data.taxId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tax ID is required for business accounts",
          path: ["taxId"],
        });
      }
    }
  });
```

### Transform

```typescript
// データの変換
const TrimmedString = z.string().trim();
const LowercaseEmail = z.string().email().toLowerCase();

const DateFromString = z.string().transform((str) => new Date(str));

const UserInputSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string().trim(),
  birthDate: z.string().transform((str) => new Date(str)),
});

// coerce で型強制
const NumberFromString = z.coerce.number(); // "123" -> 123
const BooleanFromString = z.coerce.boolean(); // "true" -> true
```

### Union と Discriminated Union

```typescript
// Union
const StringOrNumber = z.union([z.string(), z.number()]);

// Discriminated Union（推奨）
const EventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("click"),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    type: z.literal("keypress"),
    key: z.string(),
  }),
  z.object({
    type: z.literal("scroll"),
    direction: z.enum(["up", "down"]),
    amount: z.number(),
  }),
]);

// 使用例
const trackEvent = publicProcedure
  .input(EventSchema)
  .mutation(({ input }) => {
    switch (input.type) {
      case "click":
        // input.x, input.y が利用可能
        break;
      case "keypress":
        // input.key が利用可能
        break;
      case "scroll":
        // input.direction, input.amount が利用可能
        break;
    }
  });
```

## エラーメッセージのカスタマイズ

### 個別のメッセージ

```typescript
const UserSchema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string",
  }).min(1, "Name cannot be empty"),
  
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  
  age: z.number({
    required_error: "Age is required",
  }).min(0, "Age must be positive").max(150, "Age seems too high"),
});
```

### カスタムエラーマップ

```typescript
import { z } from "zod";

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === "string") {
      return { message: "This field must be text" };
    }
    if (issue.expected === "number") {
      return { message: "This field must be a number" };
    }
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === "string") {
      return { message: `Must be at least ${issue.minimum} characters` };
    }
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);
```

## tRPC でのエラーハンドリング

### バリデーションエラーの取得

```tsx
function CreateUserForm() {
  const createUser = trpc.user.create.useMutation();

  const handleSubmit = async (data: FormData) => {
    try {
      await createUser.mutateAsync(data);
    } catch (error) {
      if (error instanceof TRPCClientError) {
        // Zod のバリデーションエラー
        const zodError = error.data?.zodError;
        if (zodError) {
          // フィールドごとのエラー
          const fieldErrors = zodError.fieldErrors;
          // fieldErrors = { email: ["Invalid email"], name: ["Too short"] }
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {createUser.error?.data?.zodError?.fieldErrors?.email && (
        <span className="error">
          {createUser.error.data.zodError.fieldErrors.email[0]}
        </span>
      )}
      {/* ... */}
    </form>
  );
}
```

### フォーマットされたエラー

```typescript
// server/trpc.ts
import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";

const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});
```

## 実践: フォームバリデーション

```typescript
// schemas/registration.ts
import { z } from "zod";

export const RegistrationSchema = z
  .object({
    // 基本情報
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    
    email: z.string().email("Please enter a valid email"),
    
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    
    confirmPassword: z.string(),
    
    // プロフィール
    displayName: z.string().min(1).max(50).optional(),
    bio: z.string().max(500).optional(),
    
    // 設定
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms" }),
    }),
    
    newsletter: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegistrationInput = z.infer<typeof RegistrationSchema>;

// routers/auth.ts
export const authRouter = router({
  register: publicProcedure
    .input(RegistrationSchema)
    .mutation(async ({ input }) => {
      // パスワードをハッシュ化
      const hashedPassword = await hashPassword(input.password);
      
      // ユーザーを作成
      const user = await db.user.create({
        data: {
          username: input.username,
          email: input.email,
          password: hashedPassword,
          displayName: input.displayName,
          bio: input.bio,
          newsletter: input.newsletter,
        },
      });
      
      return { success: true, userId: user.id };
    }),
});
```

## まとめ

- **Zod** は tRPC と完璧に統合
- **スキーマ** を再利用可能に定義
- **transform** でデータを変換
- **refine/superRefine** でカスタムバリデーション
- **エラーマップ** でメッセージをカスタマイズ
- **errorFormatter** でクライアントにエラーを伝える

## 確認問題

1. z.infer の役割は何ですか？
2. refine と superRefine の違いは？
3. coerce と transform の違いは？
4. tRPC でバリデーションエラーを取得する方法は？

## 次の章

[04 - コンテキスト](./04-Context.md) では、リクエストコンテキストの管理について学びます。
