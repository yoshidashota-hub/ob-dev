/**
 * Open Graph 画像生成
 *
 * Next.js 16 Metadata API - 動的 OG 画像
 */

import { ImageResponse } from "next/og";

// 画像サイズ
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// OG画像生成
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 80, fontWeight: "bold", marginBottom: 20 }}>
            Next.js 16
          </div>
          <div style={{ fontSize: 48, opacity: 0.9 }}>学習サンドボックス</div>
          <div
            style={{
              fontSize: 28,
              marginTop: 40,
              opacity: 0.8,
              maxWidth: "80%",
            }}
          >
            Server Actions • Streaming • Cache • View Transitions
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
