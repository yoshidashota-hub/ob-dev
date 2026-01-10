/**
 * Sitemap 生成
 *
 * Next.js 16 Metadata API - 動的 Sitemap 生成
 */

import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // ベースURL（本番環境では環境変数から取得）
  const baseUrl = "http://localhost:3000";

  // 静的ページのURL
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/forms`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/streaming`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cache-demo`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/turbopack`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/error-demo`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/api-demo`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/images`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fonts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // 動的ページのURL（例: ブログ記事）
  // 実際のプロジェクトでは、データベースやCMSから取得
  const blogPosts: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog/nextjs-16-introduction`,
      lastModified: new Date("2025-11-08"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/server-actions-guide`,
      lastModified: new Date("2025-11-08"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/streaming-suspense`,
      lastModified: new Date("2025-11-08"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // すべてのページを結合
  return [...staticPages, ...blogPosts];
}
