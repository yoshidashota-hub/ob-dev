# 03 - Client Invocation（クライアントからの呼び出し）

## この章で学ぶこと

- Client Component からの Server Action 呼び出し
- イベントハンドラーでの使用
- startTransition との組み合わせ
- 非同期処理のパターン

## 基本的な呼び出し

### イベントハンドラーでの使用

```typescript
// app/components/LikeButton.tsx
'use client'

import { likePost } from '@/app/actions/post';

export function LikeButton({ postId }: { postId: string }) {
  const handleClick = async () => {
    await likePost(postId);
  };

  return (
    <button onClick={handleClick}>
      いいね
    </button>
  );
}

// app/actions/post.ts
'use server'

import { revalidatePath } from 'next/cache';

export async function likePost(postId: string) {
  await db.like.create({
    data: { postId }
  });
  revalidatePath(`/posts/${postId}`);
}
```

### useTransition との組み合わせ

```typescript
'use client'

import { useTransition } from 'react';
import { deletePost } from '@/app/actions/post';

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deletePost(postId);
    });
  };

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? '削除中...' : '削除'}
    </button>
  );
}
```

## 状態管理との連携

### useState との組み合わせ

```typescript
'use client'

import { useState, useTransition } from 'react';
import { toggleFavorite } from '@/app/actions/favorite';

export function FavoriteButton({ 
  itemId, 
  initialFavorited 
}: { 
  itemId: string;
  initialFavorited: boolean;
}) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    // 楽観的更新
    setIsFavorited(!isFavorited);

    startTransition(async () => {
      try {
        await toggleFavorite(itemId);
      } catch (error) {
        // エラー時にロールバック
        setIsFavorited(isFavorited);
      }
    });
  };

  return (
    <button onClick={handleToggle} disabled={isPending}>
      {isFavorited ? '★' : '☆'}
    </button>
  );
}
```

### 結果を状態に反映

```typescript
'use client'

import { useState, useTransition } from 'react';
import { searchUsers } from '@/app/actions/user';
import type { User } from '@/types';

export function UserSearch() {
  const [users, setUsers] = useState<User[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (query: string) => {
    startTransition(async () => {
      const results = await searchUsers(query);
      setUsers(results);
    });
  };

  return (
    <div>
      <input
        type="text"
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="ユーザーを検索..."
      />
      
      {isPending ? (
        <div>検索中...</div>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## フォームなしでの呼び出し

### ボタンクリック

```typescript
'use client'

import { incrementCounter } from '@/app/actions/counter';
import { useState, useTransition } from 'react';

export function Counter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const handleIncrement = () => {
    startTransition(async () => {
      const newCount = await incrementCounter();
      setCount(newCount);
    });
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleIncrement} disabled={isPending}>
        {isPending ? '...' : '+1'}
      </button>
    </div>
  );
}
```

### セレクト変更

```typescript
'use client'

import { useTransition } from 'react';
import { updateUserRole } from '@/app/actions/user';

export function RoleSelect({ 
  userId, 
  currentRole 
}: { 
  userId: string;
  currentRole: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    
    startTransition(async () => {
      await updateUserRole(userId, newRole);
    });
  };

  return (
    <select 
      defaultValue={currentRole} 
      onChange={handleChange}
      disabled={isPending}
    >
      <option value="user">ユーザー</option>
      <option value="admin">管理者</option>
      <option value="moderator">モデレーター</option>
    </select>
  );
}
```

## エラーハンドリング

### try-catch パターン

```typescript
'use client'

import { useState, useTransition } from 'react';
import { deleteItem } from '@/app/actions/item';

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    
    startTransition(async () => {
      try {
        await deleteItem(itemId);
      } catch (e) {
        setError(e instanceof Error ? e.message : '削除に失敗しました');
      }
    });
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={isPending}>
        {isPending ? '削除中...' : '削除'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### 結果オブジェクトパターン

```typescript
// app/actions/item.ts
'use server'

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function deleteItem(id: string): Promise<ActionResult> {
  try {
    await db.item.delete({ where: { id } });
    revalidatePath('/items');
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: 'アイテムの削除に失敗しました' 
    };
  }
}

// Client Component
'use client'

import { useState, useTransition } from 'react';
import { deleteItem } from '@/app/actions/item';

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteItem(itemId);
      setResult(res);
    });
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={isPending}>
        削除
      </button>
      {result?.error && <p className="error">{result.error}</p>}
      {result?.success && <p className="success">削除しました</p>}
    </div>
  );
}
```

## bind を使ったパターン

### 引数のバインド

```typescript
// app/actions/cart.ts
'use server'

export async function removeFromCart(productId: string, formData: FormData) {
  await db.cart.delete({
    where: { productId }
  });
  revalidatePath('/cart');
}

// Client Component
'use client'

import { removeFromCart } from '@/app/actions/cart';

export function RemoveButton({ productId }: { productId: string }) {
  // productId をバインド
  const removeWithId = removeFromCart.bind(null, productId);

  return (
    <form action={removeWithId}>
      <button type="submit">削除</button>
    </form>
  );
}
```

## 並列・直列実行

### 並列実行

```typescript
'use client'

import { useTransition } from 'react';
import { updateTitle, updateContent } from '@/app/actions/post';

export function SaveAllButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleSaveAll = () => {
    startTransition(async () => {
      // 並列実行
      await Promise.all([
        updateTitle(postId, 'New Title'),
        updateContent(postId, 'New Content')
      ]);
    });
  };

  return (
    <button onClick={handleSaveAll} disabled={isPending}>
      すべて保存
    </button>
  );
}
```

## まとめ

- Client Component から Server Action を直接呼び出せる
- useTransition で pending 状態を管理
- 楽観的更新でユーザー体験を向上
- try-catch または結果オブジェクトでエラーハンドリング
- bind で引数をバインドできる

## 確認問題

1. useTransition を使う理由を説明してください
2. 楽観的更新のメリットとデメリットを説明してください
3. Server Action でエラーを返す2つの方法を説明してください
4. bind を使用するシーンを説明してください

## 次の章へ

[04 - useActionState](./04-useActionState.md) では、useActionState フックについて詳しく学びます。
