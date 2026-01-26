# 04 - useActionState

## この章で学ぶこと

- useActionState フックの概要
- フォームの状態管理
- エラーメッセージの表示
- 初期値の設定

## useActionState とは

useActionState（旧 useFormState）は、フォームアクションの結果を状態として管理するフックです。Server Action の結果を受け取り、UI に反映できます。

## 基本的な使い方

### シンプルな例

```typescript
// app/components/ContactForm.tsx
'use client'

import { useActionState } from 'react';
import { submitContact } from '@/app/actions/contact';

type State = {
  message: string;
  success: boolean;
} | null;

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    submitContact,
    null
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" placeholder="メールアドレス" required />
      <textarea name="message" placeholder="メッセージ" required />
      
      <button type="submit" disabled={isPending}>
        {isPending ? '送信中...' : '送信'}
      </button>

      {state?.message && (
        <p className={state.success ? 'success' : 'error'}>
          {state.message}
        </p>
      )}
    </form>
  );
}

// app/actions/contact.ts
'use server'

type State = {
  message: string;
  success: boolean;
};

export async function submitContact(
  prevState: State | null,
  formData: FormData
): Promise<State> {
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  try {
    await db.contact.create({
      data: { email, message }
    });

    return {
      message: 'お問い合わせを受け付けました',
      success: true
    };
  } catch (error) {
    return {
      message: '送信に失敗しました',
      success: false
    };
  }
}
```

## 引数の説明

```typescript
const [state, formAction, isPending] = useActionState(action, initialState, permalink?);
```

- **state**: アクションの戻り値（最新の状態）
- **formAction**: フォームの action 属性に渡す関数
- **isPending**: アクション実行中かどうか
- **action**: Server Action（prevState と formData を受け取る）
- **initialState**: 初期状態
- **permalink**: オプションのパーマリンク（プログレッシブエンハンスメント用）

## バリデーションエラーの表示

```typescript
// app/components/SignupForm.tsx
'use client'

import { useActionState } from 'react';
import { signup } from '@/app/actions/auth';

type State = {
  errors: {
    email?: string[];
    password?: string[];
    general?: string;
  };
  success?: boolean;
};

const initialState: State = {
  errors: {}
};

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="email">メール</label>
        <input 
          id="email"
          name="email" 
          type="email" 
          required 
          aria-describedby="email-error"
        />
        {state.errors.email && (
          <p id="email-error" className="error">
            {state.errors.email.join(', ')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password">パスワード</label>
        <input 
          id="password"
          name="password" 
          type="password" 
          required
          aria-describedby="password-error"
        />
        {state.errors.password && (
          <p id="password-error" className="error">
            {state.errors.password.join(', ')}
          </p>
        )}
      </div>

      {state.errors.general && (
        <p className="error">{state.errors.general}</p>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? '登録中...' : '登録'}
      </button>
    </form>
  );
}

// app/actions/auth.ts
'use server'

import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上必要です'),
});

type State = {
  errors: {
    email?: string[];
    password?: string[];
    general?: string;
  };
  success?: boolean;
};

export async function signup(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await createUser(validatedFields.data);
    return { errors: {}, success: true };
  } catch (error) {
    return {
      errors: { general: 'アカウントの作成に失敗しました' },
    };
  }
}
```

## 成功時のリダイレクト

```typescript
// app/components/LoginForm.tsx
'use client'

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';

type State = {
  error?: string;
  success?: boolean;
};

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<State, FormData>(
    login,
    {}
  );

  // 成功時にリダイレクト
  useEffect(() => {
    if (state.success) {
      router.push('/dashboard');
    }
  }, [state.success, router]);

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      
      {state.error && <p className="error">{state.error}</p>}
      
      <button type="submit" disabled={isPending}>
        {isPending ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  );
}
```

## フォームのリセット

```typescript
'use client'

import { useActionState, useRef, useEffect } from 'react';
import { addComment } from '@/app/actions/comment';

type State = {
  message?: string;
  success?: boolean;
};

export function CommentForm({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<State, FormData>(
    addComment.bind(null, postId),
    {}
  );

  // 成功時にフォームをリセット
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction}>
      <textarea name="content" placeholder="コメントを入力..." required />
      
      <button type="submit" disabled={isPending}>
        {isPending ? '送信中...' : 'コメント'}
      </button>

      {state.message && (
        <p className={state.success ? 'success' : 'error'}>
          {state.message}
        </p>
      )}
    </form>
  );
}
```

## 複数のアクション

```typescript
'use client'

import { useActionState } from 'react';
import { savePost, publishPost } from '@/app/actions/post';

type State = {
  message?: string;
  status?: 'draft' | 'published';
};

export function PostEditor({ postId }: { postId: string }) {
  const [saveState, saveAction, isSaving] = useActionState<State, FormData>(
    savePost.bind(null, postId),
    {}
  );

  const [publishState, publishAction, isPublishing] = useActionState<State, FormData>(
    publishPost.bind(null, postId),
    {}
  );

  return (
    <div>
      <form>
        <textarea name="content" />
        
        <div className="actions">
          <button formAction={saveAction} disabled={isSaving}>
            {isSaving ? '保存中...' : '下書き保存'}
          </button>
          
          <button formAction={publishAction} disabled={isPublishing}>
            {isPublishing ? '公開中...' : '公開'}
          </button>
        </div>
      </form>

      {saveState.message && <p>{saveState.message}</p>}
      {publishState.message && <p>{publishState.message}</p>}
    </div>
  );
}
```

## まとめ

- useActionState はフォームアクションの状態を管理
- Server Action は prevState と formData を受け取る
- isPending でローディング状態を表示
- バリデーションエラーをフィールドごとに表示
- 成功時のリダイレクトやフォームリセットも実装可能

## 確認問題

1. useActionState が返す3つの値を説明してください
2. Server Action の第一引数 prevState の用途を説明してください
3. バリデーションエラーをユーザーフレンドリーに表示する方法を説明してください
4. フォーム送信成功後にフォームをリセットする方法を説明してください

## 次の章へ

[05 - useFormStatus](./05-useFormStatus.md) では、useFormStatus フックについて学びます。
