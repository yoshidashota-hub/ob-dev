# 06 - Optimistic Updates（楽観的更新）

## この章で学ぶこと

- 楽観的更新の概念
- useOptimistic フックの使い方
- エラー時のロールバック
- 実践的なパターン

## 楽観的更新とは

楽観的更新は、サーバーの応答を待たずに UI を即座に更新する手法です。ユーザー体験を向上させ、アプリケーションをより高速に感じさせます。

## useOptimistic フック

### 基本的な使い方

```typescript
// app/components/LikeButton.tsx
'use client'

import { useOptimistic, useTransition } from 'react';
import { toggleLike } from '@/app/actions/like';

interface Props {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ postId, initialLiked, initialCount }: Props) {
  const [isPending, startTransition] = useTransition();
  
  const [optimisticState, addOptimistic] = useOptimistic(
    { liked: initialLiked, count: initialCount },
    (state, newLiked: boolean) => ({
      liked: newLiked,
      count: newLiked ? state.count + 1 : state.count - 1,
    })
  );

  const handleClick = () => {
    const newLiked = !optimisticState.liked;
    
    startTransition(async () => {
      addOptimistic(newLiked);
      await toggleLike(postId);
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {optimisticState.liked ? '❤️' : '🤍'} {optimisticState.count}
    </button>
  );
}
```

### Server Action

```typescript
// app/actions/like.ts
'use server'

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';

export async function toggleLike(postId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  const existingLike = await db.like.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  });

  if (existingLike) {
    await db.like.delete({
      where: { id: existingLike.id }
    });
  } else {
    await db.like.create({
      data: { userId, postId }
    });
  }

  revalidatePath('/posts');
}
```

## リストの楽観的更新

### Todo リストの例

```typescript
// app/components/TodoList.tsx
'use client'

import { useOptimistic } from 'react';
import { addTodo, deleteTodo, toggleTodo } from '@/app/actions/todo';

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

type OptimisticAction =
  | { type: 'add'; todo: Todo }
  | { type: 'delete'; id: string }
  | { type: 'toggle'; id: string };

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
    initialTodos,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [...state, action.todo];
        case 'delete':
          return state.filter(todo => todo.id !== action.id);
        case 'toggle':
          return state.map(todo =>
            todo.id === action.id
              ? { ...todo, completed: !todo.completed }
              : todo
          );
        default:
          return state;
      }
    }
  );

  const handleAdd = async (formData: FormData) => {
    const text = formData.get('text') as string;
    const tempId = `temp-${Date.now()}`;
    
    updateOptimisticTodos({
      type: 'add',
      todo: { id: tempId, text, completed: false }
    });
    
    await addTodo(text);
  };

  const handleDelete = async (id: string) => {
    updateOptimisticTodos({ type: 'delete', id });
    await deleteTodo(id);
  };

  const handleToggle = async (id: string) => {
    updateOptimisticTodos({ type: 'toggle', id });
    await toggleTodo(id);
  };

  return (
    <div>
      <form action={handleAdd}>
        <input name="text" placeholder="新しいタスク" required />
        <button type="submit">追加</button>
      </form>

      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)}
            />
            <span className={todo.completed ? 'completed' : ''}>
              {todo.text}
            </span>
            <button onClick={() => handleDelete(todo.id)}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## フォームでの楽観的更新

### コメント投稿の例

```typescript
// app/components/CommentForm.tsx
'use client'

import { useOptimistic, useRef } from 'react';
import { addComment } from '@/app/actions/comment';

type Comment = {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  isPending?: boolean;
};

export function CommentSection({
  postId,
  initialComments,
  currentUser
}: {
  postId: string;
  initialComments: Comment[];
  currentUser: { name: string };
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (state, newComment: Comment) => [...state, newComment]
  );

  const handleSubmit = async (formData: FormData) => {
    const content = formData.get('content') as string;

    // 楽観的にコメントを追加
    addOptimisticComment({
      id: `temp-${Date.now()}`,
      content,
      author: currentUser.name,
      createdAt: new Date(),
      isPending: true,
    });

    // フォームをリセット
    formRef.current?.reset();

    // サーバーにコメントを送信
    await addComment(postId, content);
  };

  return (
    <div>
      <form ref={formRef} action={handleSubmit}>
        <textarea name="content" placeholder="コメントを入力..." required />
        <button type="submit">投稿</button>
      </form>

      <ul className="comments">
        {optimisticComments.map(comment => (
          <li
            key={comment.id}
            className={comment.isPending ? 'pending' : ''}
          >
            <strong>{comment.author}</strong>
            <p>{comment.content}</p>
            {comment.isPending && <span className="sending">送信中...</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## エラー時のロールバック

### try-catch パターン

```typescript
'use client'

import { useOptimistic, useState, useTransition } from 'react';
import { updateStatus } from '@/app/actions/status';

type Status = 'active' | 'inactive' | 'pending';

export function StatusToggle({ 
  itemId, 
  initialStatus 
}: { 
  itemId: string;
  initialStatus: Status;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);

  const handleChange = (newStatus: Status) => {
    const previousStatus = currentStatus;
    setError(null);

    startTransition(async () => {
      setOptimisticStatus(newStatus);
      
      try {
        await updateStatus(itemId, newStatus);
        setCurrentStatus(newStatus);
      } catch (e) {
        // エラー時は元の状態に戻す
        setOptimisticStatus(previousStatus);
        setError('ステータスの更新に失敗しました');
      }
    });
  };

  return (
    <div>
      <select
        value={optimisticStatus}
        onChange={(e) => handleChange(e.target.value as Status)}
        disabled={isPending}
      >
        <option value="active">アクティブ</option>
        <option value="inactive">非アクティブ</option>
        <option value="pending">保留中</option>
      </select>
      
      {isPending && <span>更新中...</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

## 並列アクションの楽観的更新

```typescript
'use client'

import { useOptimistic, useTransition } from 'react';
import { batchUpdateTodos } from '@/app/actions/todo';

export function BatchTodoActions({ todos }: { todos: Todo[] }) {
  const [isPending, startTransition] = useTransition();
  
  const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
    todos,
    (state, updates: { id: string; completed: boolean }[]) => {
      const updateMap = new Map(updates.map(u => [u.id, u.completed]));
      return state.map(todo =>
        updateMap.has(todo.id)
          ? { ...todo, completed: updateMap.get(todo.id)! }
          : todo
      );
    }
  );

  const handleMarkAllComplete = () => {
    const updates = optimisticTodos
      .filter(t => !t.completed)
      .map(t => ({ id: t.id, completed: true }));

    startTransition(async () => {
      updateOptimisticTodos(updates);
      await batchUpdateTodos(updates);
    });
  };

  return (
    <div>
      <button onClick={handleMarkAllComplete} disabled={isPending}>
        すべて完了にする
      </button>
      {/* Todo リストの表示 */}
    </div>
  );
}
```

## まとめ

- 楽観的更新は即座に UI を更新し、UX を向上
- useOptimistic で楽観的な状態を管理
- リスト操作では action タイプで更新方法を切り替え
- エラー時は元の状態にロールバック
- isPending 状態で視覚的フィードバックを提供

## 確認問題

1. 楽観的更新のメリットとデメリットを説明してください
2. useOptimistic の第二引数（reducer）の役割を説明してください
3. エラー時のロールバック処理の実装方法を説明してください
4. 楽観的更新が適切なユースケースと適切でないユースケースを挙げてください

## 次の章へ

[07 - Input-Validation](./07-Input-Validation.md) では、入力バリデーションについて学びます。
