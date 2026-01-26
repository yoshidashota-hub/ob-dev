# 01 - Basic Usage（基本的な使い方）

## この章で学ぶこと

- Server Actions の定義方法
- 'use server' ディレクティブの使い方
- 基本的な Server Action の作成
- Server Component と Client Component での使用

## Server Actions とは

Server Actions は、サーバー上で実行される非同期関数です。クライアントから直接呼び出すことができ、フォーム送信やデータ変更を簡潔に実装できます。

## 'use server' ディレクティブ

### ファイルレベルでの定義

```typescript
// app/actions.ts
'use server'

// このファイル内のすべての関数が Server Action になる
export async function createUser(name: string, email: string) {
  // サーバー上で実行される
  const user = await db.user.create({
    data: { name, email }
  });
  return user;
}

export async function deleteUser(id: string) {
  await db.user.delete({ where: { id } });
}
```

### 関数レベルでの定義

```typescript
// app/page.tsx
async function Page() {
  // インライン Server Action
  async function handleSubmit(formData: FormData) {
    'use server'
    
    const name = formData.get('name') as string;
    // サーバー上で実行される
    await db.user.create({ data: { name } });
  }

  return (
    <form action={handleSubmit}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## 基本的な Server Action

### データの作成

```typescript
// app/actions/user.ts
'use server'

import { prisma } from '@/lib/prisma';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const user = await prisma.user.create({
    data: { name, email }
  });

  return { success: true, user };
}
```

### データの更新

```typescript
// app/actions/user.ts
'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateUser(id: string, formData: FormData) {
  const name = formData.get('name') as string;

  await prisma.user.update({
    where: { id },
    data: { name }
  });

  // キャッシュを再検証
  revalidatePath('/users');
}
```

### データの削除

```typescript
// app/actions/user.ts
'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id }
  });

  revalidatePath('/users');
}
```

## Server Component での使用

```typescript
// app/users/page.tsx
import { createUser } from '@/app/actions/user';
import { prisma } from '@/lib/prisma';

export default async function UsersPage() {
  const users = await prisma.user.findMany();

  return (
    <div>
      <h1>Users</h1>
      
      {/* フォームで Server Action を使用 */}
      <form action={createUser}>
        <input name="name" placeholder="Name" required />
        <input name="email" type="email" placeholder="Email" required />
        <button type="submit">Add User</button>
      </form>

      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Client Component での使用

```typescript
// app/components/CreateUserForm.tsx
'use client'

import { createUser } from '@/app/actions/user';

export function CreateUserForm() {
  return (
    <form action={createUser}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit">Add User</button>
    </form>
  );
}
```

## 戻り値の型

### シンプルな戻り値

```typescript
'use server'

export async function incrementCounter() {
  const count = await db.counter.increment();
  return count; // number を返す
}
```

### オブジェクトの戻り値

```typescript
'use server'

type ActionResult = {
  success: boolean;
  message?: string;
  data?: unknown;
};

export async function createPost(formData: FormData): Promise<ActionResult> {
  try {
    const title = formData.get('title') as string;
    
    const post = await db.post.create({
      data: { title }
    });

    return {
      success: true,
      data: post
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create post'
    };
  }
}
```

## 引数の渡し方

### FormData 以外の引数

```typescript
'use server'

export async function updateUserRole(userId: string, role: 'admin' | 'user') {
  await db.user.update({
    where: { id: userId },
    data: { role }
  });
}

// 使用例（bind を使用）
// Client Component
'use client'

import { updateUserRole } from '@/app/actions/user';

export function RoleButton({ userId }: { userId: string }) {
  const updateWithId = updateUserRole.bind(null, userId);
  
  return (
    <form action={updateWithId}>
      <input type="hidden" name="role" value="admin" />
      <button type="submit">Make Admin</button>
    </form>
  );
}
```

### 複数の引数

```typescript
'use server'

export async function addToCart(
  productId: string,
  quantity: number,
  formData: FormData
) {
  const notes = formData.get('notes') as string;
  
  await db.cart.add({
    productId,
    quantity,
    notes
  });
}
```

## まとめ

- 'use server' でサーバー上で実行される関数を定義
- ファイルレベルまたは関数レベルで定義可能
- FormData や通常の引数を受け取れる
- Server Component と Client Component の両方で使用可能
- revalidatePath でキャッシュを再検証

## 確認問題

1. 'use server' ディレクティブの2つの配置方法を説明してください
2. Server Action の戻り値として使用できるものは何ですか？
3. Client Component から Server Action を呼び出す際の注意点は何ですか？
4. bind を使用する理由を説明してください

## 次の章へ

[02 - Form-Integration](./02-Form-Integration.md) では、フォームとの統合について詳しく学びます。
