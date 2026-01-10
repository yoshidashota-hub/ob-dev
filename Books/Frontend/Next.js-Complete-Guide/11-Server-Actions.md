# 11 - Server Actions

## 概要

この章では、Next.js の Server Actions について学びます。Server Actions はサーバー上で実行される非同期関数で、フォーム送信やデータ変更を簡単に実装できます。

## Server Actions とは

### 定義

Server Actions は `"use server"` ディレクティブでマークされた非同期関数です:

```typescript
// app/actions.ts
"use server";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await db.post.create({
    data: { title, content },
  });
}
```

### 特徴

- サーバーでのみ実行される
- クライアントから直接呼び出し可能
- フォームの action 属性で使用可能
- プログレッシブエンハンスメント対応
- 自動的にセキュア

## 基本的な使い方

### インラインで定義

```typescript
// app/page.tsx
export default function Page() {
  async function handleSubmit(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    await db.user.create({ data: { name } });
  }

  return (
    <form action={handleSubmit}>
      <input type="text" name="name" required />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 別ファイルで定義

```typescript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await db.post.create({
    data: { title, content },
  });

  revalidatePath("/posts");
}
```

```typescript
// app/posts/new/page.tsx
import { createPost } from "@/app/actions";

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input type="text" name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

## フォームの処理

### 基本的なフォーム

```typescript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTodo(formData: FormData) {
  const title = formData.get("title") as string;

  if (!title || title.length < 3) {
    throw new Error("Title must be at least 3 characters");
  }

  await db.todo.create({
    data: { title, completed: false },
  });

  revalidatePath("/todos");
  redirect("/todos");
}
```

```typescript
// components/TodoForm.tsx
import { createTodo } from "@/app/actions";

export function TodoForm() {
  return (
    <form action={createTodo} className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={3}
          className="w-full border p-2"
        />
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2">
        Add Todo
      </button>
    </form>
  );
}
```

### useActionState

フォームの状態とペンディング状態を管理:

```typescript
// app/actions.ts
"use server";

interface FormState {
  message: string;
  errors?: {
    title?: string[];
    content?: string[];
  };
}

export async function createPost(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // バリデーション
  const errors: FormState["errors"] = {};

  if (!title || title.length < 3) {
    errors.title = ["Title must be at least 3 characters"];
  }

  if (!content || content.length < 10) {
    errors.content = ["Content must be at least 10 characters"];
  }

  if (Object.keys(errors).length > 0) {
    return { message: "Validation failed", errors };
  }

  await db.post.create({ data: { title, content } });

  return { message: "Post created successfully" };
}
```

```typescript
// components/PostForm.tsx
"use client";

import { useActionState } from "react";
import { createPost } from "@/app/actions";

export function PostForm() {
  const [state, formAction, isPending] = useActionState(createPost, {
    message: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          className="w-full border p-2"
        />
        {state.errors?.title && (
          <p className="text-red-500 text-sm">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          className="w-full border p-2"
          rows={5}
        />
        {state.errors?.content && (
          <p className="text-red-500 text-sm">{state.errors.content[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Post"}
      </button>

      {state.message && (
        <p className={state.errors ? "text-red-500" : "text-green-500"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
```

### useFormStatus

フォームのペンディング状態を取得:

```typescript
// components/SubmitButton.tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-500 text-white px-4 py-2 disabled:opacity-50"
    >
      {pending ? "Submitting..." : children}
    </button>
  );
}
```

```typescript
// components/ContactForm.tsx
import { submitContact } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export function ContactForm() {
  return (
    <form action={submitContact}>
      <input type="text" name="name" required />
      <input type="email" name="email" required />
      <textarea name="message" required />
      <SubmitButton>Send Message</SubmitButton>
    </form>
  );
}
```

## バリデーション

### Zod を使用したバリデーション

```typescript
// lib/validations.ts
import { z } from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content must be less than 10000 characters"),
  category: z.enum(["tech", "lifestyle", "business"]),
});

export type PostInput = z.infer<typeof postSchema>;
```

```typescript
// app/actions.ts
"use server";

import { postSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

interface ActionState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export async function createPost(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    title: formData.get("title"),
    content: formData.get("content"),
    category: formData.get("category"),
  };

  const validatedFields = postSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await db.post.create({
      data: validatedFields.data,
    });

    revalidatePath("/posts");

    return {
      success: true,
      message: "Post created successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create post",
    };
  }
}
```

## 楽観的更新

### useOptimistic

```typescript
// components/TodoList.tsx
"use client";

import { useOptimistic } from "react";
import { toggleTodo } from "@/app/actions";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, updatedTodo: Todo) =>
      state.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
  );

  const handleToggle = async (todo: Todo) => {
    const updatedTodo = { ...todo, completed: !todo.completed };

    // 楽観的に更新
    addOptimisticTodo(updatedTodo);

    // サーバーで実際に更新
    await toggleTodo(todo.id);
  };

  return (
    <ul>
      {optimisticTodos.map((todo) => (
        <li key={todo.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo)}
          />
          <span className={todo.completed ? "line-through" : ""}>
            {todo.title}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

### 追加の楽観的更新

```typescript
// components/CommentSection.tsx
"use client";

import { useOptimistic, useRef } from "react";
import { addComment } from "@/app/actions";

interface Comment {
  id: string;
  text: string;
  author: string;
}

export function CommentSection({
  comments,
  postId,
}: {
  comments: Comment[];
  postId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: Comment) => [...state, newComment]
  );

  const handleSubmit = async (formData: FormData) => {
    const text = formData.get("text") as string;

    // 楽観的に追加
    addOptimisticComment({
      id: `temp-${Date.now()}`,
      text,
      author: "You",
    });

    // フォームをリセット
    formRef.current?.reset();

    // サーバーで実際に追加
    await addComment(postId, formData);
  };

  return (
    <div>
      <ul className="space-y-2">
        {optimisticComments.map((comment) => (
          <li key={comment.id} className="p-2 bg-gray-100 rounded">
            <p>{comment.text}</p>
            <small>{comment.author}</small>
          </li>
        ))}
      </ul>

      <form ref={formRef} action={handleSubmit} className="mt-4">
        <textarea name="text" required className="w-full border p-2" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 mt-2">
          Add Comment
        </button>
      </form>
    </div>
  );
}
```

## 再検証

### revalidatePath

```typescript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  await db.post.create({
    data: {
      title: formData.get("title") as string,
    },
  });

  // 特定のパスを再検証
  revalidatePath("/posts");

  // ページタイプを指定
  revalidatePath("/posts", "page");

  // レイアウトを含めて再検証
  revalidatePath("/posts", "layout");

  // 動的ルート
  revalidatePath("/posts/[slug]", "page");
}
```

### revalidateTag

```typescript
// lib/data.ts
export async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { tags: ["posts"] },
  });
  return res.json();
}

// app/actions.ts
("use server");

import { revalidateTag } from "next/cache";

export async function createPost(formData: FormData) {
  await db.post.create({
    data: {
      title: formData.get("title") as string,
    },
  });

  // タグで再検証
  revalidateTag("posts");
}
```

## リダイレクト

### redirect

```typescript
// app/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const post = await db.post.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    },
  });

  revalidatePath("/posts");
  redirect(`/posts/${post.id}`);
}
```

### 条件付きリダイレクト

```typescript
// app/actions.ts
"use server";

import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await authenticate(email, password);

  if (!user) {
    return { error: "Invalid credentials" };
  }

  // セッションを作成
  await createSession(user.id);

  // ロールに応じてリダイレクト
  if (user.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
```

## エラーハンドリング

### try-catch

```typescript
// app/actions.ts
"use server";

interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  try {
    const post = await db.post.create({
      data: {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
      },
    });

    return {
      success: true,
      message: "Post created successfully",
      data: post,
    };
  } catch (error) {
    console.error("Failed to create post:", error);

    return {
      success: false,
      message: "Failed to create post. Please try again.",
    };
  }
}
```

### エラー境界との統合

```typescript
// app/posts/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## 認証との統合

### セッションチェック

```typescript
// app/actions.ts
"use server";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  await db.post.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      authorId: session.user.id,
    },
  });
}
```

### 権限チェック

```typescript
// app/actions.ts
"use server";

import { getSession } from "@/lib/auth";

export async function deletePost(postId: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const post = await db.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // 作者または管理者のみ削除可能
  if (post.authorId !== session.user.id && session.user.role !== "admin") {
    throw new Error("Forbidden");
  }

  await db.post.delete({
    where: { id: postId },
  });
}
```

## ファイルアップロード

### 基本的なファイルアップロード

```typescript
// app/actions.ts
"use server";

import { writeFile } from "fs/promises";
import { join } from "path";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { error: "No file provided" };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const path = join(process.cwd(), "public/uploads", file.name);
  await writeFile(path, buffer);

  return { success: true, path: `/uploads/${file.name}` };
}
```

```typescript
// components/FileUpload.tsx
"use client";

import { useActionState } from "react";
import { uploadFile } from "@/app/actions";

export function FileUpload() {
  const [state, formAction, isPending] = useActionState(uploadFile, null);

  return (
    <form action={formAction}>
      <input type="file" name="file" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Uploading..." : "Upload"}
      </button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
      {state?.success && <p className="text-green-500">Uploaded!</p>}
    </form>
  );
}
```

## まとめ

- **"use server"** で Server Action を定義
- **form action** で直接使用可能
- **useActionState** でフォーム状態を管理
- **useFormStatus** でペンディング状態を取得
- **useOptimistic** で楽観的更新
- **revalidatePath/revalidateTag** でキャッシュを再検証
- **redirect** でリダイレクト
- **Zod** でバリデーション

## 演習問題

1. Todo アプリの CRUD 操作を Server Actions で実装してください
2. useActionState を使ったバリデーション付きフォームを作成してください
3. useOptimistic を使った楽観的更新を実装してください
4. ファイルアップロード機能を実装してください

## 次のステップ

次の章では、メタデータと SEO について学びます。

⬅️ 前へ: [10-Streaming-and-Suspense.md](./10-Streaming-and-Suspense.md)
➡️ 次へ: [12-Metadata-and-SEO.md](./12-Metadata-and-SEO.md)
