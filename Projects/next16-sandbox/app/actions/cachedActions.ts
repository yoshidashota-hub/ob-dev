"use cache";

/**
 * 関数レベルのキャッシュ実装
 *
 * `use cache`を個別の関数に適用することで、
 * その関数の戻り値をキャッシュできる
 */

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
 * この関数は`use cache`でキャッシュされるため、
 * 同じIDに対する呼び出しは1回のみAPI通信を行う
 */
export async function getCachedUser(userId: number): Promise<User> {
  console.log(`[Cache] Fetching user ${userId}...`);

  const response = await fetch(
    `https://jsonplaceholder.typicode.com/users/${userId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch user ${userId}`);
  }

  const user = await response.json();
  return user;
}

/**
 * ユーザーの投稿を取得（キャッシュ済み）
 */
export async function getCachedUserPosts(userId: number): Promise<Post[]> {
  console.log(`[Cache] Fetching posts for user ${userId}...`);

  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?userId=${userId}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch posts for user ${userId}`);
  }

  const posts = await response.json();
  return posts;
}

/**
 * 複数のユーザーを一度に取得（キャッシュ済み）
 */
export async function getCachedUsers(userIds: number[]): Promise<User[]> {
  console.log(`[Cache] Fetching ${userIds.length} users...`);

  const promises = userIds.map((id) =>
    fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((res) =>
      res.json()
    )
  );

  return Promise.all(promises);
}

/**
 * 重い計算処理をシミュレート（キャッシュ済み）
 *
 * フィボナッチ数列の計算など、計算コストの高い処理を
 * キャッシュすることでパフォーマンスを向上
 */
export async function calculateFibonacci(n: number): Promise<number> {
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
}

/**
 * 統計データの集計（キャッシュ済み）
 */
interface Statistics {
  totalUsers: number;
  totalPosts: number;
  averagePostsPerUser: number;
  calculatedAt: string;
}

export async function getStatistics(): Promise<Statistics> {
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
}

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
