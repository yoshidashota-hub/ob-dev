/**
 * ダッシュボードページのローディング UI
 *
 * Next.js が自動的に使用する loading.tsx
 * /dashboard ルートの読み込み中に表示される
 */

import { DashboardSkeleton } from "@/app/components/skeletons";

export default function Loading() {
  return <DashboardSkeleton />;
}
