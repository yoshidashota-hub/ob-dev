# 13 - Patterns（実践パターン）

## この章で学ぶこと

- Server Actions の設計パターン
- ファイルアップロード
- ページネーション
- 検索機能
- 複雑なフォーム処理

## 基本的な設計パターン

### アクションファイルの構成

```
app/
├── actions/
│   ├── index.ts        # エクスポートの集約
│   ├── post.ts         # 投稿関連
│   ├── comment.ts      # コメント関連
│   ├── user.ts         # ユーザー関連
│   └── auth.ts         # 認証関連
```

```typescript
// app/actions/index.ts
export * from "./post";
export * from "./comment";
export * from "./user";
export * from "./auth";
```

### レスポンス型の統一

```typescript
// lib/types.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// app/actions/post.ts
("use server");

import type { ActionResult } from "@/lib/types";

export async function createPost(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const title = formData.get("title") as string;

    if (!title) {
      return {
        success: false,
        error: "タイトルは必須です",
        fieldErrors: { title: ["タイトルを入力してください"] },
      };
    }

    const post = await db.post.create({
      data: { title },
    });

    return { success: true, data: { id: post.id } };
  } catch (error) {
    return { success: false, error: "投稿の作成に失敗しました" };
  }
}
```

## ファイルアップロード

### 基本的なアップロード

```typescript
// app/actions/upload.ts
"use server";

import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuid } from "uuid";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File | null;

  if (!file) {
    return { error: "ファイルが選択されていません" };
  }

  // ファイルタイプの検証
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "許可されていないファイル形式です" };
  }

  // ファイルサイズの検証
  if (file.size > MAX_SIZE) {
    return { error: "ファイルサイズは5MB以下にしてください" };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // ユニークなファイル名を生成
  const ext = file.name.split(".").pop();
  const filename = `${uuid()}.${ext}`;
  const path = join(process.cwd(), "public/uploads", filename);

  await writeFile(path, buffer);

  return { success: true, url: `/uploads/${filename}` };
}
```

### S3 へのアップロード

```typescript
// app/actions/upload-s3.ts
"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Presigned URL を生成（クライアントから直接アップロード）
export async function getUploadUrl(filename: string, contentType: string) {
  const key = `uploads/${uuid()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return {
    uploadUrl: url,
    fileUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
  };
}

// サーバー経由でアップロード
export async function uploadToS3(formData: FormData) {
  const file = formData.get("file") as File;
  const bytes = await file.arrayBuffer();
  const key = `uploads/${uuid()}-${file.name}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type,
    }),
  );

  return {
    success: true,
    url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
  };
}
```

### コンポーネントとの連携

```typescript
// app/components/ImageUploader.tsx
"use client";

import { useState, useTransition } from "react";
import { uploadImage } from "@/app/actions/upload";

export function ImageUploader() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await uploadImage(formData);
      if (result.success) {
        setUploadedUrl(result.url);
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <input type="file" name="file" accept="image/*" onChange={handleChange} />
      {preview && <img src={preview} alt="Preview" width={200} />}
      <button type="submit" disabled={isPending}>
        {isPending ? "アップロード中..." : "アップロード"}
      </button>
      {uploadedUrl && <p>アップロード完了: {uploadedUrl}</p>}
    </form>
  );
}
```

## ページネーション

### Server Action でのページネーション

```typescript
// app/actions/post.ts
"use server";

import { unstable_cache } from "next/cache";

const ITEMS_PER_PAGE = 10;

export async function getPosts(page: number = 1) {
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [posts, total] = await Promise.all([
    db.post.findMany({
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: "desc" },
    }),
    db.post.count(),
  ]);

  return {
    posts,
    pagination: {
      page,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      total,
      hasMore: skip + posts.length < total,
    },
  };
}
```

### 無限スクロール

```typescript
// app/actions/post.ts
"use server";

export async function loadMorePosts(cursor?: string) {
  const posts = await db.post.findMany({
    take: 10,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
  });

  const nextCursor = posts.length === 10 ? posts[posts.length - 1].id : null;

  return { posts, nextCursor };
}

// app/components/InfinitePostList.tsx
("use client");

import { useState, useEffect, useRef, useTransition } from "react";
import { loadMorePosts } from "@/app/actions/post";

export function InfinitePostList({ initialPosts, initialCursor }) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor && !isPending) {
          startTransition(async () => {
            const result = await loadMorePosts(cursor);
            setPosts((prev) => [...prev, ...result.posts]);
            setCursor(result.nextCursor);
          });
        }
      },
      { threshold: 1.0 },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [cursor, isPending]);

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={observerRef}>{isPending && <Spinner />}</div>
    </div>
  );
}
```

## 検索機能

### デバウンス付き検索

```typescript
// app/actions/search.ts
"use server";

export async function searchPosts(query: string) {
  if (!query || query.length < 2) {
    return [];
  }

  return db.post.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
}

// app/components/SearchBox.tsx
("use client");

import { useState, useEffect, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import { searchPosts } from "@/app/actions/search";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = useDebouncedCallback((value: string) => {
    startTransition(async () => {
      const posts = await searchPosts(value);
      setResults(posts);
    });
  }, 300);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        placeholder="検索..."
      />
      {isPending && <Spinner />}
      <ul>
        {results.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### フィルタリング付き検索

```typescript
// app/actions/search.ts
"use server";

type SearchFilters = {
  query?: string;
  category?: string;
  sortBy?: "newest" | "oldest" | "popular";
  status?: "draft" | "published";
};

export async function searchWithFilters(filters: SearchFilters) {
  const { query, category, sortBy = "newest", status } = filters;

  const where: any = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  if (status) {
    where.published = status === "published";
  }

  const orderBy: any = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    popular: { viewCount: "desc" },
  }[sortBy];

  return db.post.findMany({
    where,
    orderBy,
    take: 20,
  });
}
```

## 複雑なフォーム処理

### マルチステップフォーム

```typescript
// app/actions/registration.ts
"use server";

import { cookies } from "next/headers";

type StepData = {
  step1?: { email: string; password: string };
  step2?: { name: string; bio: string };
  step3?: { preferences: string[] };
};

export async function saveStep(step: number, data: Record<string, any>) {
  const cookieStore = await cookies();
  const existing = cookieStore.get("registration-data")?.value;
  const stepData: StepData = existing ? JSON.parse(existing) : {};

  stepData[`step${step}` as keyof StepData] = data;

  cookieStore.set("registration-data", JSON.stringify(stepData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600, // 1時間
  });

  return { success: true };
}

export async function completeRegistration() {
  const cookieStore = await cookies();
  const data = cookieStore.get("registration-data")?.value;

  if (!data) {
    return { error: "登録データがありません" };
  }

  const stepData: StepData = JSON.parse(data);

  // すべてのステップが完了しているか確認
  if (!stepData.step1 || !stepData.step2 || !stepData.step3) {
    return { error: "すべてのステップを完了してください" };
  }

  // ユーザーを作成
  const user = await db.user.create({
    data: {
      email: stepData.step1.email,
      password: await hashPassword(stepData.step1.password),
      name: stepData.step2.name,
      bio: stepData.step2.bio,
      preferences: stepData.step3.preferences,
    },
  });

  // 一時データを削除
  cookieStore.delete("registration-data");

  return { success: true, userId: user.id };
}
```

### 動的フィールド

```typescript
// app/components/DynamicFieldsForm.tsx
"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createSurvey } from "@/app/actions/survey";

export function SurveyForm() {
  const [questions, setQuestions] = useState([{ id: 1, text: "" }]);

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now(), text: "" }]);
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: number, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  return (
    <form action={createSurvey}>
      <input type="text" name="title" placeholder="アンケートタイトル" />

      {questions.map((question, index) => (
        <div key={question.id}>
          <input
            type="text"
            name={`questions[${index}]`}
            value={question.text}
            onChange={(e) => updateQuestion(question.id, e.target.value)}
            placeholder={`質問 ${index + 1}`}
          />
          {questions.length > 1 && (
            <button type="button" onClick={() => removeQuestion(question.id)}>
              削除
            </button>
          )}
        </div>
      ))}

      <button type="button" onClick={addQuestion}>
        質問を追加
      </button>
      <button type="submit">作成</button>
    </form>
  );
}

// app/actions/survey.ts
("use server");

export async function createSurvey(formData: FormData) {
  const title = formData.get("title") as string;

  // 動的フィールドを配列として取得
  const questions: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("questions[") && typeof value === "string") {
      questions.push(value);
    }
  }

  const survey = await db.survey.create({
    data: {
      title,
      questions: {
        create: questions.map((text, order) => ({
          text,
          order,
        })),
      },
    },
  });

  return { success: true, id: survey.id };
}
```

## エラーハンドリングパターン

### 統一的なエラーハンドリング

```typescript
// lib/action-utils.ts
import { ActionResult } from "@/lib/types";

export function createAction<TInput, TOutput>(
  handler: (input: TInput) => Promise<TOutput>,
) {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    try {
      const data = await handler(input);
      return { success: true, data };
    } catch (error) {
      console.error("Action error:", error);

      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
          fieldErrors: error.fieldErrors,
        };
      }

      if (error instanceof AuthError) {
        return { success: false, error: "認証エラーが発生しました" };
      }

      return { success: false, error: "予期せぬエラーが発生しました" };
    }
  };
}

// app/actions/post.ts
("use server");

import { createAction } from "@/lib/action-utils";

export const createPost = createAction(async (formData: FormData) => {
  const title = formData.get("title") as string;

  if (!title) {
    throw new ValidationError("タイトルは必須です", {
      title: ["タイトルを入力してください"],
    });
  }

  return db.post.create({ data: { title } });
});
```

## まとめ

- アクションファイルは機能ごとに分割
- レスポンス型を統一して一貫性を保つ
- ファイルアップロードは適切な検証を行う
- ページネーションと無限スクロールを使い分け
- 検索はデバウンスで最適化
- 複雑なフォームはステップ分割や動的フィールドで対応

## 確認問題

1. Server Actions のファイル構成について説明してください
2. ファイルアップロードの際に行うべき検証を挙げてください
3. 無限スクロールの実装方法を説明してください
4. マルチステップフォームの状態管理方法を説明してください

## 次の章へ

[14 - Best-Practices](./14-Best-Practices.md) では、Server Actions のベストプラクティスを総括します。
