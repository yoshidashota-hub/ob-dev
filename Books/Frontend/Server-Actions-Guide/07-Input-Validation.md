# 07 - Input Validation（入力バリデーション）

## この章で学ぶこと

- Server Action での入力バリデーション
- バリデーションエラーの返却方法
- クライアントサイドとサーバーサイドの検証
- セキュリティの考慮点

## なぜサーバーサイドバリデーションが必要か

- クライアントサイドのバリデーションは回避可能
- 悪意のあるリクエストからの保護
- データの整合性を保証
- セキュリティの最後の砦

## 基本的なバリデーション

### 手動バリデーション

```typescript
// app/actions/user.ts
"use server";

type ValidationErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
};

type ActionResult = {
  success: boolean;
  errors?: ValidationErrors;
  message?: string;
};

export async function createUser(formData: FormData): Promise<ActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const errors: ValidationErrors = {};

  // 名前のバリデーション
  if (!name || name.trim().length === 0) {
    errors.name = ["名前は必須です"];
  } else if (name.length < 2) {
    errors.name = ["名前は2文字以上で入力してください"];
  } else if (name.length > 50) {
    errors.name = ["名前は50文字以内で入力してください"];
  }

  // メールのバリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = ["メールアドレスは必須です"];
  } else if (!emailRegex.test(email)) {
    errors.email = ["有効なメールアドレスを入力してください"];
  }

  // パスワードのバリデーション
  if (!password) {
    errors.password = ["パスワードは必須です"];
  } else if (password.length < 8) {
    errors.password = ["パスワードは8文字以上で入力してください"];
  }

  // エラーがある場合は早期リターン
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // ユーザー作成処理
  try {
    await db.user.create({
      data: { name, email, password: await hashPassword(password) },
    });
    return { success: true, message: "ユーザーを作成しました" };
  } catch (error) {
    return { success: false, message: "作成に失敗しました" };
  }
}
```

## フォームでのエラー表示

```typescript
// app/components/SignupForm.tsx
'use client'

import { useActionState } from 'react';
import { createUser } from '@/app/actions/user';

type State = {
  success: boolean;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
};

const initialState: State = { success: false };

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(createUser, initialState);

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="name">名前</label>
        <input
          id="name"
          name="name"
          type="text"
          aria-invalid={!!state.errors?.name}
          aria-describedby={state.errors?.name ? 'name-error' : undefined}
        />
        {state.errors?.name && (
          <p id="name-error" className="error">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="email">メールアドレス</label>
        <input
          id="email"
          name="email"
          type="email"
          aria-invalid={!!state.errors?.email}
          aria-describedby={state.errors?.email ? 'email-error' : undefined}
        />
        {state.errors?.email && (
          <p id="email-error" className="error">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="password">パスワード</label>
        <input
          id="password"
          name="password"
          type="password"
          aria-invalid={!!state.errors?.password}
          aria-describedby={state.errors?.password ? 'password-error' : undefined}
        />
        {state.errors?.password && (
          <p id="password-error" className="error">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      {state.message && (
        <p className={state.success ? 'success' : 'error'}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? '登録中...' : '登録'}
      </button>
    </form>
  );
}
```

## 型安全なバリデーション

### バリデーションユーティリティ

```typescript
// lib/validation.ts
export type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

export function validate<T>(value: T, rules: ValidationRule<T>[]): string[] {
  return rules
    .filter((rule) => !rule.validate(value))
    .map((rule) => rule.message);
}

export const required = (message = "必須項目です"): ValidationRule<string> => ({
  validate: (value) => value.trim().length > 0,
  message,
});

export const minLength = (
  min: number,
  message?: string,
): ValidationRule<string> => ({
  validate: (value) => value.length >= min,
  message: message || `${min}文字以上で入力してください`,
});

export const maxLength = (
  max: number,
  message?: string,
): ValidationRule<string> => ({
  validate: (value) => value.length <= max,
  message: message || `${max}文字以内で入力してください`,
});

export const email = (
  message = "有効なメールアドレスを入力してください",
): ValidationRule<string> => ({
  validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message,
});

export const pattern = (
  regex: RegExp,
  message: string,
): ValidationRule<string> => ({
  validate: (value) => regex.test(value),
  message,
});
```

### ユーティリティの使用

```typescript
// app/actions/user.ts
"use server";

import {
  validate,
  required,
  minLength,
  maxLength,
  email as emailRule,
} from "@/lib/validation";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const errors: Record<string, string[]> = {};

  const nameErrors = validate(name, [
    required("名前は必須です"),
    minLength(2, "名前は2文字以上で入力してください"),
    maxLength(50, "名前は50文字以内で入力してください"),
  ]);
  if (nameErrors.length) errors.name = nameErrors;

  const emailErrors = validate(email, [
    required("メールアドレスは必須です"),
    emailRule(),
  ]);
  if (emailErrors.length) errors.email = emailErrors;

  const passwordErrors = validate(password, [
    required("パスワードは必須です"),
    minLength(8, "パスワードは8文字以上で入力してください"),
  ]);
  if (passwordErrors.length) errors.password = passwordErrors;

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // 続行...
}
```

## 数値・日付のバリデーション

```typescript
// app/actions/event.ts
"use server";

export async function createEvent(formData: FormData) {
  const title = formData.get("title") as string;
  const capacityStr = formData.get("capacity") as string;
  const dateStr = formData.get("date") as string;

  const errors: Record<string, string[]> = {};

  // 数値のバリデーション
  const capacity = parseInt(capacityStr, 10);
  if (isNaN(capacity)) {
    errors.capacity = ["有効な数値を入力してください"];
  } else if (capacity < 1) {
    errors.capacity = ["定員は1人以上で入力してください"];
  } else if (capacity > 1000) {
    errors.capacity = ["定員は1000人以下で入力してください"];
  }

  // 日付のバリデーション
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    errors.date = ["有効な日付を入力してください"];
  } else if (date < new Date()) {
    errors.date = ["過去の日付は選択できません"];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // イベント作成...
}
```

## ファイルのバリデーション

```typescript
// app/actions/upload.ts
"use server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File;

  const errors: string[] = [];

  if (!file || file.size === 0) {
    errors.push("ファイルを選択してください");
  } else {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push("JPEG、PNG、WebP形式のみアップロード可能です");
    }
    if (file.size > MAX_SIZE) {
      errors.push("ファイルサイズは5MB以下にしてください");
    }
  }

  if (errors.length > 0) {
    return { success: false, errors: { file: errors } };
  }

  // アップロード処理...
}
```

## クライアントサイドとの併用

```typescript
// app/components/ContactForm.tsx
'use client'

import { useActionState, useState } from 'react';
import { submitContact } from '@/app/actions/contact';

export function ContactForm() {
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [state, formAction] = useActionState(submitContact, { success: false });

  const validateClient = (formData: FormData): boolean => {
    const errors: Record<string, string> = {};

    const email = formData.get('email') as string;
    if (!email.includes('@')) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (formData: FormData) => {
    // クライアントサイドで事前チェック
    if (validateClient(formData)) {
      formAction(formData);
    }
  };

  return (
    <form action={handleSubmit}>
      <input name="email" type="email" />
      {/* クライアントエラーを優先表示 */}
      {(clientErrors.email || state.errors?.email) && (
        <p className="error">
          {clientErrors.email || state.errors?.email?.[0]}
        </p>
      )}
      <button type="submit">送信</button>
    </form>
  );
}
```

## まとめ

- サーバーサイドバリデーションは必須
- エラーは構造化して返却（フィールドごとの配列）
- aria 属性でアクセシビリティを確保
- 型安全なバリデーションユーティリティを活用
- クライアントサイドと併用でUX向上

## 確認問題

1. サーバーサイドバリデーションが必須な理由を説明してください
2. バリデーションエラーを返す際の推奨フォーマットを説明してください
3. 数値と日付のバリデーションで注意すべき点を挙げてください
4. クライアントサイドとサーバーサイドのバリデーションの役割の違いを説明してください

## 次の章へ

[08 - Zod-Integration](./08-Zod-Integration.md) では、Zod との統合について学びます。
