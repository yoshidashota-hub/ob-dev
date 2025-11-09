import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Next.js 16 学習サンドボックス",
    template: "%s | Next.js 16 Sandbox",
  },
  description:
    "Next.js 16 の新機能を学ぶための実践的なサンドボックスプロジェクト。Server Actions、Streaming、Cache、View Transitions など、最新機能を網羅的に実装。",
  keywords: [
    "Next.js",
    "React",
    "TypeScript",
    "Server Actions",
    "Streaming",
    "Turbopack",
    "Next.js 16",
  ],
  authors: [{ name: "Next.js Learner" }],
  creator: "Next.js Learner",
  publisher: "Next.js Learner",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Next.js 16 学習サンドボックス",
    description:
      "Next.js 16 の新機能を学ぶための実践的なサンドボックスプロジェクト",
    url: "http://localhost:3000",
    siteName: "Next.js 16 Sandbox",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js 16 学習サンドボックス",
    description:
      "Next.js 16 の新機能を学ぶための実践的なサンドボックスプロジェクト",
    creator: "@nextjs_learner",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console の検証コード（実際のプロジェクトで設定）
    // google: 'your-verification-code',
    // Bing Webmaster Tools の検証コード
    // other: { 'msvalidate.01': 'your-bing-verification-code' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
