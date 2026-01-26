# 08 - Zod Integration（Zod との統合）

## この章で学ぶこと

- Zod スキーマの定義
- Server Action での Zod バリデーション
- エラーメッセージのカスタマイズ
- 複雑なバリデーションパターン

## Zod とは

Zod は TypeScript ファーストのスキーマバリデーションライブラリです。型安全なバリデーションを簡潔に記述できます。

```bash
npm install zod
```

## 基本的な使い方

### スキーマの定義

```typescript
// lib/schemas/user.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "名前は2文字以上で入力してください")
    .max(50, "名前は50文字以内で入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "パスワードは大文字、小文字、数字を含む必要があります",
    ),
});

// 型の推論
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

### Server Action での使用

```typescript
// app/actions/user.ts
"use server";

import { createUserSchema } from "@/lib/schemas/user";
import { revalidatePath } from "next/cache";

type State = {
  success: boolean;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};

export async function createUser(
  prevState: State,
  formData: FormData,
): Promise<State> {
  // FormData から値を取得
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Zod でバリデーション
  const validatedFields = createUserSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // バリデーション済みのデータを使用
  const { name, email, password } = validatedFields.data;

  try {
    await db.user.create({
      data: { name, email, password: await hashPassword(password) },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: { _form: ["ユーザーの作成に失敗しました"] },
    };
  }
}
```

## 高度なスキーマ定義

### オプショナルフィールド

```typescript
const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  website: z
    .string()
    .url("有効なURLを入力してください")
    .optional()
    .or(z.literal("")),
});
```

### 条件付きバリデーション

```typescript
const registerSchema = z
  .object({
    email: z.string().email(),
    accountType: z.enum(["personal", "business"]),
    companyName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.accountType === "business") {
        return data.companyName && data.companyName.length > 0;
      }
      return true;
    },
    {
      message: "ビジネスアカウントの場合、会社名は必須です",
      path: ["companyName"],
    },
  );
```

### パスワード確認

```typescript
const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });
```

### 配列のバリデーション

```typescript
const createPostSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  content: z.string().min(10, "本文は10文字以上で入力してください"),
  tags: z
    .array(z.string())
    .min(1, "少なくとも1つのタグを選択してください")
    .max(5, "タグは5つまでです"),
});
```

## FormData の変換

### coerce を使った型変換

```typescript
const eventSchema = z.object({
  title: z.string().min(1),
  capacity: z.coerce.number().int().min(1).max(1000),
  date: z.coerce.date().min(new Date(), "過去の日付は選択できません"),
  price: z.coerce.number().min(0),
  isPublic: z.coerce.boolean(),
});
```

### カスタム変換

```typescript
const productSchema = z.object({
  name: z.string(),
  price: z.string().transform((val, ctx) => {
    const parsed = parseFloat(val.replace(/,/g, ""));
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "有効な価格を入力してください",
      });
      return z.NEVER;
    }
    return parsed;
  }),
});
```

## 再利用可能なバリデーション

### カスタムスキーマ

```typescript
// lib/schemas/common.ts
import { z } from "zod";

export const emailSchema = z
  .string()
  .email("有効なメールアドレスを入力してください")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください")
  .regex(/[A-Z]/, "大文字を含める必要があります")
  .regex(/[a-z]/, "小文字を含める必要があります")
  .regex(/[0-9]/, "数字を含める必要があります");

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, "小文字、数字、ハイフンのみ使用できます");

export const phoneSchema = z
  .string()
  .regex(/^0\d{9,10}$/, "有効な電話番号を入力してください");
```

### スキーマの組み合わせ

```typescript
// lib/schemas/user.ts
import { z } from "zod";
import { emailSchema, passwordSchema } from "./common";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "パスワードを入力してください"),
});

export const signupSchema = z.object({
  name: z.string().min(2).max(50),
  email: emailSchema,
  password: passwordSchema,
});

export const updateEmailSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: emailSchema,
});
```

## エラーメッセージのカスタマイズ

### グローバルエラーマップ

```typescript
// lib/zod-config.ts
import { z } from "zod";

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === "string") {
      return { message: "文字列を入力してください" };
    }
    if (issue.expected === "number") {
      return { message: "数値を入力してください" };
    }
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === "string") {
      return { message: `${issue.minimum}文字以上で入力してください` };
    }
    if (issue.type === "number") {
      return { message: `${issue.minimum}以上の値を入力してください` };
    }
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);
```

## バリデーションユーティリティ

```typescript
// lib/actions/utils.ts
import { z } from "zod";

type ActionState<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
};

export async function validateAction<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): Promise<
  | {
      success: true;
      data: z.infer<T>;
    }
  | {
      success: false;
      errors: Record<string, string[]>;
    }
> {
  const rawData = Object.fromEntries(formData);
  const result = schema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

// 使用例
export async function createPost(prevState: any, formData: FormData) {
  const validation = await validateAction(createPostSchema, formData);

  if (!validation.success) {
    return { success: false, errors: validation.errors };
  }

  const { title, content, tags } = validation.data;
  // 処理を続行...
}
```

## まとめ

- Zod で型安全なバリデーションを実現
- safeParse でエラーハンドリング
- coerce で FormData の型変換
- refine で条件付きバリデーション
- 共通スキーマを再利用
- エラーマップでメッセージをカスタマイズ

## 確認問題

1. safeParse と parse の違いを説明してください
2. coerce の役割を説明してください
3. refine を使用する場面を説明してください
4. flatten() メソッドが返すオブジェクトの構造を説明してください

## 次の章へ

[09 - Error-Handling](./09-Error-Handling.md) では、エラーハンドリングについて詳しく学びます。
