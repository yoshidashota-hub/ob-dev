/**
 * 遅延データフェッチを含むコンポーネント
 *
 * Suspenseでラップされることを想定
 */

import { Suspense } from "react";
import { CardSkeleton, StatsSkeleton } from "./Skeleton";

// データフェッチをシミュレート（遅延あり）
async function fetchSlowData(delay: number = 2000) {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return {
    title: "遅延データ",
    description: `${delay}ms後に読み込まれました`,
    timestamp: new Date().toISOString(),
  };
}

async function fetchUserStats() {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    users: 1234,
    posts: 5678,
    comments: 9012,
  };
}

async function fetchRecentPosts() {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  return [
    { id: 1, title: "Next.js 16の新機能", author: "山田太郎" },
    { id: 2, title: "React 19のHooks", author: "佐藤花子" },
    { id: 3, title: "TypeScript最新情報", author: "鈴木一郎" },
  ];
}

/**
 * 遅延コンポーネント1（2秒）
 */
export async function SlowComponent({ delay = 2000 }: { delay?: number }) {
  const data = await fetchSlowData(delay);

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        {data.title}
      </h3>
      <p className="text-gray-600 mb-3">{data.description}</p>
      <div className="text-sm text-gray-500">
        読み込み時刻: {new Date(data.timestamp).toLocaleTimeString("ja-JP")}
      </div>
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <p className="text-xs text-green-800">
          ✓ このコンポーネントはSuspenseでラップされており、
          読み込み中はスケルトンが表示されます
        </p>
      </div>
    </div>
  );
}

/**
 * 統計情報コンポーネント（1.5秒）
 */
export async function UserStatsComponent() {
  const stats = await fetchUserStats();

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-lg p-6 text-center shadow-sm">
        <div className="text-4xl font-bold text-blue-600">{stats.users}</div>
        <div className="text-sm text-gray-600 mt-2">ユーザー数</div>
      </div>
      <div className="bg-white rounded-lg p-6 text-center shadow-sm">
        <div className="text-4xl font-bold text-green-600">{stats.posts}</div>
        <div className="text-sm text-gray-600 mt-2">投稿数</div>
      </div>
      <div className="bg-white rounded-lg p-6 text-center shadow-sm">
        <div className="text-4xl font-bold text-purple-600">
          {stats.comments}
        </div>
        <div className="text-sm text-gray-600 mt-2">コメント数</div>
      </div>
    </div>
  );
}

/**
 * 最近の投稿コンポーネント（2.5秒）
 */
export async function RecentPostsComponent() {
  const posts = await fetchRecentPosts();

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {post.title}
          </h3>
          <p className="text-sm text-gray-600">著者: {post.author}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * 並列フェッチングのデモコンポーネント
 */
export async function ParallelFetchDemo() {
  // 並列でデータ取得
  const [data1, data2] = await Promise.all([
    fetchSlowData(1000),
    fetchSlowData(1500),
  ]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border rounded-lg p-6 bg-white">
        <h4 className="font-semibold mb-2">{data1.title} (1秒)</h4>
        <p className="text-sm text-gray-600">{data1.description}</p>
      </div>
      <div className="border rounded-lg p-6 bg-white">
        <h4 className="font-semibold mb-2">{data2.title} (1.5秒)</h4>
        <p className="text-sm text-gray-600">{data2.description}</p>
      </div>
    </div>
  );
}

/**
 * Suspenseでラップされたコンポーネント（エクスポート用）
 */
export function WrappedSlowComponent({ delay }: { delay?: number }) {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <SlowComponent delay={delay} />
    </Suspense>
  );
}

export function WrappedUserStats() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-3 gap-4">
          <StatsSkeleton />
          <StatsSkeleton />
          <StatsSkeleton />
        </div>
      }
    >
      <UserStatsComponent />
    </Suspense>
  );
}

export function WrappedRecentPosts() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <RecentPostsComponent />
    </Suspense>
  );
}
