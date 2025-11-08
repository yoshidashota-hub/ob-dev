/**
 * データストア: 投稿管理
 *
 * 本番環境ではデータベース（Prisma, Drizzle等）を使用
 * このサンプルではメモリ内配列で管理
 */

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// メモリ内データストア
let posts: Post[] = [
  {
    id: "1",
    title: "Next.js 16の新機能",
    content: "Turbopack、use cache、Async Paramsなど、多くの新機能が追加されました。",
    author: "山田太郎",
    published: true,
    createdAt: new Date("2025-11-08T10:00:00"),
    updatedAt: new Date("2025-11-08T10:00:00"),
  },
  {
    id: "2",
    title: "Server Actionsの使い方",
    content: "フォーム処理が簡単になり、クライアント側のコードが不要になります。",
    author: "佐藤花子",
    published: true,
    createdAt: new Date("2025-11-08T11:00:00"),
    updatedAt: new Date("2025-11-08T11:00:00"),
  },
  {
    id: "3",
    title: "React 19の新機能",
    content: "React Compilerにより自動メモ化が実現されました。",
    author: "鈴木一郎",
    published: false,
    createdAt: new Date("2025-11-08T12:00:00"),
    updatedAt: new Date("2025-11-08T12:00:00"),
  },
];

// データアクセス関数

export function getAllPosts(): Post[] {
  return [...posts].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export function getPostById(id: string): Post | undefined {
  return posts.find((post) => post.id === id);
}

export function createPost(data: Omit<Post, "id" | "createdAt" | "updatedAt">): Post {
  const newPost: Post = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  posts.push(newPost);
  return newPost;
}

export function updatePost(id: string, data: Partial<Omit<Post, "id" | "createdAt" | "updatedAt">>): Post | null {
  const index = posts.findIndex((post) => post.id === id);

  if (index === -1) {
    return null;
  }

  posts[index] = {
    ...posts[index],
    ...data,
    updatedAt: new Date(),
  };

  return posts[index];
}

export function deletePost(id: string): boolean {
  const index = posts.findIndex((post) => post.id === id);

  if (index === -1) {
    return false;
  }

  posts.splice(index, 1);
  return true;
}

export function getPublishedPosts(): Post[] {
  return posts
    .filter((post) => post.published)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
