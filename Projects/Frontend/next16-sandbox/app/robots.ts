/**
 * Robots.txt 生成
 *
 * Next.js 16 Metadata API - クローラー制御
 */

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // ベースURL（本番環境では環境変数から取得）
  const baseUrl = "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/", // API エンドポイントはクロール不要
          "/admin/", // 管理画面（存在する場合）
          "/*?*", // クエリパラメータ付きURL（重複コンテンツ防止）
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
        crawlDelay: 0, // Google はクロール遅延不要
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
        crawlDelay: 1, // Bing は少し遅延させる
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
