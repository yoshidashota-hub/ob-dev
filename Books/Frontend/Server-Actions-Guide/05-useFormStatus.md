# 05 - useFormStatus

## この章で学ぶこと

- useFormStatus フックの概要
- 送信ボタンの状態管理
- フォーム全体の状態取得
- アクセシビリティの考慮

## useFormStatus とは

useFormStatus は、親フォームの送信状態を取得するフックです。フォームの子コンポーネントで使用し、送信中の状態を把握できます。

## 基本的な使い方

### SubmitButton コンポーネント

```typescript
// app/components/SubmitButton.tsx
'use client'

import { useFormStatus } from 'react-dom';

export function SubmitButton({ children = '送信' }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '送信中...' : children}
    </button>
  );
}

// 使用例
import { SubmitButton } from '@/app/components/SubmitButton';
import { createPost } from '@/app/actions/post';

export default function CreatePostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="タイトル" />
      <textarea name="content" placeholder="内容" />
      <SubmitButton>投稿する</SubmitButton>
    </form>
  );
}
```

## useFormStatus の戻り値

```typescript
const { pending, data, method, action } = useFormStatus();
```

- **pending**: フォームが送信中かどうか（boolean）
- **data**: 送信中の FormData（または null）
- **method**: HTTP メソッド（'get' | 'post'）
- **action**: フォームの action 関数への参照

## 詳細な状態表示

```typescript
'use client'

import { useFormStatus } from 'react-dom';

export function FormStatusDisplay() {
  const { pending, data, method, action } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div className="form-status">
      <p>送信中...</p>
      <p>メソッド: {method}</p>
      {data && (
        <ul>
          {Array.from(data.entries()).map(([key, value]) => (
            <li key={key}>
              {key}: {value.toString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## フォーム全体の無効化

```typescript
'use client'

import { useFormStatus } from 'react-dom';

function FormFields() {
  const { pending } = useFormStatus();

  return (
    <>
      <fieldset disabled={pending}>
        <div>
          <label htmlFor="name">名前</label>
          <input id="name" name="name" required />
        </div>
        <div>
          <label htmlFor="email">メール</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="message">メッセージ</label>
          <textarea id="message" name="message" required />
        </div>
      </fieldset>
      <button type="submit" disabled={pending}>
        {pending ? '送信中...' : '送信'}
      </button>
    </>
  );
}

export function ContactForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action}>
      <FormFields />
    </form>
  );
}
```

## ローディングインジケーター

### スピナー表示

```typescript
'use client'

import { useFormStatus } from 'react-dom';

function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" />
    </svg>
  );
}

export function SubmitButtonWithSpinner({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="submit-button">
      {pending && <Spinner />}
      <span className={pending ? 'opacity-50' : ''}>
        {children}
      </span>
    </button>
  );
}
```

### プログレスバー

```typescript
'use client'

import { useFormStatus } from 'react-dom';

export function FormProgress() {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <div className="progress-container">
      <div className="progress-bar" />
    </div>
  );
}

// CSS
// .progress-bar {
//   width: 100%;
//   height: 4px;
//   background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
//   animation: progress 1.5s ease-in-out infinite;
// }
```

## アクセシビリティ対応

### aria 属性の活用

```typescript
'use client'

import { useFormStatus } from 'react-dom';
import { useId } from 'react';

export function AccessibleSubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const statusId = useId();

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        aria-describedby={pending ? statusId : undefined}
      >
        {children}
      </button>
      {pending && (
        <span id={statusId} className="sr-only" role="status" aria-live="polite">
          フォームを送信しています。しばらくお待ちください。
        </span>
      )}
    </>
  );
}
```

### フォーカス管理

```typescript
'use client'

import { useFormStatus } from 'react-dom';
import { useRef, useEffect } from 'react';

export function SubmitButtonWithFocus({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    // 送信完了後にボタンにフォーカスを戻す
    if (wasPending.current && !pending) {
      buttonRef.current?.focus();
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <button ref={buttonRef} type="submit" disabled={pending}>
      {pending ? '送信中...' : children}
    </button>
  );
}
```

## 複数フォームでの使用

```typescript
'use client'

import { useFormStatus } from 'react-dom';
import { saveAsDraft, publish } from '@/app/actions/post';

function ActionButtons() {
  const { pending, action } = useFormStatus();

  return (
    <div className="action-buttons">
      <button 
        type="submit" 
        formAction={saveAsDraft}
        disabled={pending}
      >
        {pending && action === saveAsDraft ? '保存中...' : '下書き保存'}
      </button>
      <button 
        type="submit" 
        formAction={publish}
        disabled={pending}
      >
        {pending && action === publish ? '公開中...' : '公開'}
      </button>
    </div>
  );
}

export function PostForm() {
  return (
    <form>
      <textarea name="content" placeholder="内容を入力..." />
      <ActionButtons />
    </form>
  );
}
```

## 注意点

### フォームの子コンポーネントでのみ使用可能

```typescript
// ❌ これは動作しない（フォームの外で使用）
function Page() {
  const { pending } = useFormStatus(); // 常に pending: false

  return (
    <form action={someAction}>
      <button disabled={pending}>送信</button>
    </form>
  );
}

// ✅ 正しい使い方（フォームの子コンポーネント）
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>送信</button>;
}

function Page() {
  return (
    <form action={someAction}>
      <SubmitButton />
    </form>
  );
}
```

## まとめ

- useFormStatus は親フォームの送信状態を取得
- pending でローディング状態を表示
- フォームの子コンポーネントでのみ使用可能
- アクセシビリティを考慮した実装が重要
- 複数のアクションボタンにも対応可能

## 確認問題

1. useFormStatus が返す4つの値を説明してください
2. useFormStatus をフォームの外で使用するとどうなりますか？
3. フォーム送信中にフィールドを無効化する方法を説明してください
4. アクセシビリティを考慮したローディング表示の実装方法を説明してください

## 次の章へ

[06 - Optimistic-Updates](./06-Optimistic-Updates.md) では、楽観的更新について学びます。
