# 02 - Form Integration（フォームとの統合）

## この章で学ぶこと

- HTML フォームと Server Actions の連携
- 複数フィールドの処理
- ファイルアップロード
- プログレッシブエンハンスメント

## 基本的なフォーム統合

### action 属性での使用

```typescript
// app/contact/page.tsx
import { submitContact } from '@/app/actions/contact';

export default function ContactPage() {
  return (
    <form action={submitContact}>
      <div>
        <label htmlFor="name">名前</label>
        <input type="text" id="name" name="name" required />
      </div>
      <div>
        <label htmlFor="email">メール</label>
        <input type="email" id="email" name="email" required />
      </div>
      <div>
        <label htmlFor="message">メッセージ</label>
        <textarea id="message" name="message" required />
      </div>
      <button type="submit">送信</button>
    </form>
  );
}

// app/actions/contact.ts
'use server'

export async function submitContact(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  await db.contact.create({
    data: { name, email, message }
  });
}
```

## FormData の処理

### 型安全な取得

```typescript
'use server'

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  newsletter: boolean;
}

export async function submitContact(formData: FormData) {
  const data: ContactFormData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    message: formData.get('message') as string,
    newsletter: formData.get('newsletter') === 'on',
  };

  // バリデーション
  if (!data.name || !data.email || !data.message) {
    throw new Error('All fields are required');
  }

  await saveContact(data);
}
```

### 複数の値を持つフィールド

```typescript
// フォーム
<form action={submitOrder}>
  <label>
    <input type="checkbox" name="toppings" value="cheese" /> チーズ
  </label>
  <label>
    <input type="checkbox" name="toppings" value="bacon" /> ベーコン
  </label>
  <label>
    <input type="checkbox" name="toppings" value="mushroom" /> マッシュルーム
  </label>
  <button type="submit">注文</button>
</form>

// Server Action
'use server'

export async function submitOrder(formData: FormData) {
  // getAll で複数の値を取得
  const toppings = formData.getAll('toppings') as string[];
  
  console.log(toppings); // ['cheese', 'bacon']
  
  await createOrder({ toppings });
}
```

### 数値の処理

```typescript
'use server'

export async function updateQuantity(formData: FormData) {
  const quantity = parseInt(formData.get('quantity') as string, 10);
  const price = parseFloat(formData.get('price') as string);

  if (isNaN(quantity) || isNaN(price)) {
    throw new Error('Invalid number');
  }

  await updateCart({ quantity, price });
}
```

## ファイルアップロード

### 基本的なアップロード

```typescript
// app/upload/page.tsx
import { uploadFile } from '@/app/actions/upload';

export default function UploadPage() {
  return (
    <form action={uploadFile}>
      <input type="file" name="file" accept="image/*" required />
      <button type="submit">アップロード</button>
    </form>
  );
}

// app/actions/upload.ts
'use server'

import { writeFile } from 'fs/promises';
import path from 'path';

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;

  if (!file || file.size === 0) {
    throw new Error('No file provided');
  }

  // ファイルサイズチェック（5MB）
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large');
  }

  // MIME タイプチェック
  if (!file.type.startsWith('image/')) {
    throw new Error('Only images are allowed');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(process.cwd(), 'public/uploads', filename);

  await writeFile(filepath, buffer);

  return { url: `/uploads/${filename}` };
}
```

### 複数ファイルのアップロード

```typescript
// フォーム
<form action={uploadFiles}>
  <input type="file" name="files" multiple accept="image/*" />
  <button type="submit">アップロード</button>
</form>

// Server Action
'use server'

export async function uploadFiles(formData: FormData) {
  const files = formData.getAll('files') as File[];

  const uploadedUrls = await Promise.all(
    files.map(async (file) => {
      if (file.size === 0) return null;
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name}`;
      const filepath = path.join(process.cwd(), 'public/uploads', filename);
      
      await writeFile(filepath, buffer);
      return `/uploads/${filename}`;
    })
  );

  return uploadedUrls.filter(Boolean);
}
```

## 隠しフィールドの活用

### ID の受け渡し

```typescript
// app/posts/[id]/edit/page.tsx
import { updatePost } from '@/app/actions/post';
import { prisma } from '@/lib/prisma';

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: params.id }
  });

  return (
    <form action={updatePost}>
      <input type="hidden" name="id" value={post.id} />
      <input name="title" defaultValue={post.title} />
      <textarea name="content" defaultValue={post.content} />
      <button type="submit">更新</button>
    </form>
  );
}

// app/actions/post.ts
'use server'

export async function updatePost(formData: FormData) {
  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await prisma.post.update({
    where: { id },
    data: { title, content }
  });

  revalidatePath(`/posts/${id}`);
}
```

## プログレッシブエンハンスメント

Server Actions は JavaScript が無効でも動作します。

```typescript
// app/newsletter/page.tsx
import { subscribe } from '@/app/actions/newsletter';

export default function NewsletterPage() {
  return (
    <form action={subscribe}>
      <input 
        type="email" 
        name="email" 
        placeholder="メールアドレス"
        required 
      />
      <button type="submit">購読</button>
    </form>
  );
}

// app/actions/newsletter.ts
'use server'

import { redirect } from 'next/navigation';

export async function subscribe(formData: FormData) {
  const email = formData.get('email') as string;

  await db.newsletter.create({
    data: { email }
  });

  // 成功後にリダイレクト（JS が無効でも動作）
  redirect('/newsletter/success');
}
```

## フォーム送信後の処理

### リダイレクト

```typescript
'use server'

import { redirect } from 'next/navigation';

export async function createPost(formData: FormData) {
  const post = await db.post.create({
    data: {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    }
  });

  // 作成したページにリダイレクト
  redirect(`/posts/${post.id}`);
}
```

### ページの再読み込み

```typescript
'use server'

import { revalidatePath } from 'next/cache';

export async function addComment(formData: FormData) {
  const postId = formData.get('postId') as string;
  const content = formData.get('content') as string;

  await db.comment.create({
    data: { postId, content }
  });

  // 現在のページを再検証
  revalidatePath(`/posts/${postId}`);
}
```

## まとめ

- form の action 属性に Server Action を渡す
- FormData から値を取得（get, getAll）
- ファイルアップロードも FormData で処理
- 隠しフィールドで追加データを渡す
- JavaScript が無効でも動作（プログレッシブエンハンスメント）

## 確認問題

1. FormData から複数選択の値を取得する方法を説明してください
2. ファイルアップロードのセキュリティ対策を3つ挙げてください
3. プログレッシブエンハンスメントとは何ですか？
4. フォーム送信後にページを更新する方法を説明してください

## 次の章へ

[03 - Client-Invocation](./03-Client-Invocation.md) では、クライアントからの呼び出しについて学びます。
