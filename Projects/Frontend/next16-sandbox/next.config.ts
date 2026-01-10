import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 外部画像を許可するドメイン
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
    // 画像フォーマットの優先順位（AVIF > WebP > 元の形式）
    formats: ["image/avif", "image/webp"],
    // 最小キャッシュ時間（秒）
    minimumCacheTTL: 60,
    // デバイスサイズ（レスポンシブ画像用）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // 画像サイズ（layout="fill"や layout="responsive"用）
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
