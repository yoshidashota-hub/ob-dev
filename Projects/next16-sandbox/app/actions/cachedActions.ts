/**
 * 関数レベルのキャッシュ実装
 *
 * unstable_cache を使用してキャッシュを実装
 * ("use cache" は Next.js 16.0.1 では未サポート)
 */

import { unstable_cache } from "next/cache";

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    city: string;
    zipcode: string;
  };
  company: {
    name: string;
  };
}

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

/**
 * ユーザー情報を取得（キャッシュ済み）
 *
 * unstable_cache でキャッシュされるため、
 * 同じIDに対する呼び出しは1回のみAPI通信を行う
 */
export const getCachedUser = unstable_cache(
  async (userId: number): Promise<User> => {
    console.log(`[Cache] Fetching user ${userId}...`);

    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${userId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user ${userId}`);
    }

    const user = await response.json();
    return user;
  },
  ["user"],
  { tags: ["users"] }
);

/**
 * ユーザーの投稿を取得（キャッシュ済み）
 */
export const getCachedUserPosts = unstable_cache(
  async (userId: number): Promise<Post[]> => {
    console.log(`[Cache] Fetching posts for user ${userId}...`);

    const response = await fetch(
      `https://jsonplaceholder.typicode.com/posts?userId=${userId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch posts for user ${userId}`);
    }

    const posts = await response.json();
    return posts;
  },
  ["user-posts"],
  { tags: ["posts"] }
);

/**
 * 複数のユーザーを一度に取得（キャッシュ済み）
 */
export const getCachedUsers = unstable_cache(
  async (userIds: number[]): Promise<User[]> => {
    console.log(`[Cache] Fetching ${userIds.length} users...`);

    const promises = userIds.map((id) =>
      fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((res) =>
        res.json()
      )
    );

    return Promise.all(promises);
  },
  ["users-batch"],
  { tags: ["users"] }
);

/**
 * 重い計算処理をシミュレート（キャッシュ済み）
 *
 * フィボナッチ数列の計算など、計算コストの高い処理を
 * キャッシュすることでパフォーマンスを向上
 */
export const calculateFibonacci = unstable_cache(
  async (n: number): Promise<number> => {
    console.log(`[Cache] Calculating fibonacci(${n})...`);

    if (n <= 1) return n;

    let a = 0;
    let b = 1;

    for (let i = 2; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }

    return b;
  },
  ["fibonacci"],
  { tags: ["calculations"] }
);

/**
 * 統計データの集計（キャッシュ済み）
 */
interface Statistics {
  totalUsers: number;
  totalPosts: number;
  averagePostsPerUser: number;
  calculatedAt: string;
}

export const getStatistics = unstable_cache(
  async (): Promise<Statistics> => {
    console.log("[Cache] Calculating statistics...");

    const [usersRes, postsRes] = await Promise.all([
      fetch("https://jsonplaceholder.typicode.com/users"),
      fetch("https://jsonplaceholder.typicode.com/posts"),
    ]);

    const users: User[] = await usersRes.json();
    const posts: Post[] = await postsRes.json();

    return {
      totalUsers: users.length,
      totalPosts: posts.length,
      averagePostsPerUser: Math.round(posts.length / users.length),
      calculatedAt: new Date().toISOString(),
    };
  },
  ["statistics"],
  { tags: ["stats"], revalidate: 3600 }
);

/**
 * キャッシュを使わない関数（比較用）
 */
export async function getUncachedUser(userId: number): Promise<User> {
  console.log(`[No Cache] Fetching user ${userId}...`);

  const response = await fetch(
    `https://jsonplaceholder.typicode.com/users/${userId}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch user ${userId}`);
  }

  return response.json();
}
