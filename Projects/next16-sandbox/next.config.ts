import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // dynamicIO を有効化（use cache サポート用）
    dynamicIO: true,
  },
};

export default nextConfig;
