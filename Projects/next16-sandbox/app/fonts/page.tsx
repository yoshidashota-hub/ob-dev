/**
 * フォント最適化デモページ
 *
 * Next.js Font Optimization の実装例
 */

import {
  Geist,
  Geist_Mono,
  Inter,
  Roboto,
  Roboto_Mono,
  Playfair_Display,
  Noto_Sans_JP,
} from "next/font/google";

// Geist フォント（プロジェクトデフォルト）
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Inter フォント（Variable Font）
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Roboto フォント（特定のウェイト）
const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

// Playfair Display（装飾的なフォント）
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// Noto Sans JP（日本語フォント）
const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export default function FontsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← ホームに戻る
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Font Optimization
          </h1>
          <p className="text-gray-600">
            Next.js の自動フォント最適化デモ
          </p>
        </div>

        {/* セクション1: Geist フォント */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            1. Geist フォント（デフォルト）
          </h2>
          <div className="space-y-4">
            <div className={geistSans.className}>
              <p className="text-lg mb-2">Geist Sans</p>
              <p className="text-gray-700">
                The quick brown fox jumps over the lazy dog.
              </p>
              <p className="text-gray-700">
                すばやい茶色のキツネが怠け者の犬を飛び越えた。
              </p>
            </div>
            <div className={geistMono.className}>
              <p className="text-lg mb-2">Geist Mono</p>
              <p className="text-gray-700 font-mono">
                const greeting = "Hello, World!";
              </p>
              <p className="text-gray-700 font-mono">
                console.log(greeting);
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-900 font-mono">
              {`import { Geist, Geist_Mono } from "next/font/google";`}
            </p>
            <ul className="mt-2 text-sm text-blue-800 list-disc list-inside">
              <li>Vercel によって設計された最新フォント</li>
              <li>Variable Font で柔軟なウェイト調整</li>
              <li>自動最適化とプリロード</li>
            </ul>
          </div>
        </section>

        {/* セクション2: Inter（Variable Font） */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            2. Inter（Variable Font）
          </h2>
          <div className={inter.className}>
            <div className="space-y-3">
              <p style={{ fontWeight: 100 }}>Weight 100: Thin</p>
              <p style={{ fontWeight: 300 }}>Weight 300: Light</p>
              <p style={{ fontWeight: 400 }}>Weight 400: Regular</p>
              <p style={{ fontWeight: 600 }}>Weight 600: Semi-Bold</p>
              <p style={{ fontWeight: 800 }}>Weight 800: Extra-Bold</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-green-50 rounded">
            <p className="text-sm text-green-900 font-mono">
              {`const inter = Inter({ subsets: ["latin"] });`}
            </p>
            <ul className="mt-2 text-sm text-green-800 list-disc list-inside">
              <li>Variable Font - 1つのファイルで全ウェイト</li>
              <li>ファイルサイズの最適化</li>
              <li>滑らかなウェイト変化</li>
            </ul>
          </div>
        </section>

        {/* セクション3: Roboto（固定ウェイト） */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            3. Roboto（固定ウェイト）
          </h2>
          <div className={roboto.className}>
            <div className="space-y-3">
              <p style={{ fontWeight: 400 }}>
                Weight 400: Regular - The standard weight for body text
              </p>
              <p style={{ fontWeight: 700 }}>
                Weight 700: Bold - Used for emphasis and headings
              </p>
            </div>
          </div>
          <div className={robotoMono.className}>
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <code className="text-sm">
                {`function example() {\n  return "Roboto Mono";\n}`}
              </code>
            </div>
          </div>
          <div className="mt-4 p-4 bg-purple-50 rounded">
            <p className="text-sm text-purple-900 font-mono">
              {`const roboto = Roboto({ weight: ["400", "700"] });`}
            </p>
            <ul className="mt-2 text-sm text-purple-800 list-disc list-inside">
              <li>必要なウェイトのみダウンロード</li>
              <li>パフォーマンス最適化</li>
              <li>モノスペースバリアントあり</li>
            </ul>
          </div>
        </section>

        {/* セクション4: Playfair Display（装飾的） */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            4. Playfair Display（装飾的）
          </h2>
          <div className={playfair.className}>
            <h3 className="text-4xl mb-4">Elegant Typography</h3>
            <p className="text-xl text-gray-700 leading-relaxed">
              The quick brown fox jumps over the lazy dog. This is a sample of
              Playfair Display, a serif font perfect for headings and elegant
              designs.
            </p>
          </div>
          <div className="mt-4 p-4 bg-pink-50 rounded">
            <p className="text-sm text-pink-900 font-mono">
              {`const playfair = Playfair_Display({ subsets: ["latin"] });`}
            </p>
            <ul className="mt-2 text-sm text-pink-800 list-disc list-inside">
              <li>装飾的なセリフフォント</li>
              <li>見出しやタイトルに最適</li>
              <li>エレガントなデザイン</li>
            </ul>
          </div>
        </section>

        {/* セクション5: Noto Sans JP（日本語） */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            5. Noto Sans JP（日本語フォント）
          </h2>
          <div className={notoSansJP.className}>
            <div className="space-y-4">
              <p className="text-2xl" style={{ fontWeight: 400 }}>
                美しい日本語タイポグラフィ
              </p>
              <p className="text-lg text-gray-700">
                Noto Sans
                JPは、日本語を美しく表示するために設計されたフォントです。
                明瞭で読みやすく、ウェブサイトに最適です。
              </p>
              <p className="text-lg" style={{ fontWeight: 700 }}>
                ゴシック体の美しさと機能性を兼ね備えています。
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-orange-50 rounded">
            <p className="text-sm text-orange-900 font-mono">
              {`const notoSansJP = Noto_Sans_JP({ weight: ["400", "700"] });`}
            </p>
            <ul className="mt-2 text-sm text-orange-800 list-disc list-inside">
              <li>日本語に最適化</li>
              <li>サブセット最適化で高速読み込み</li>
              <li>豊富な文字セット</li>
            </ul>
          </div>
        </section>

        {/* セクション6: フォント最適化のメリット */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📊 Next.js フォント最適化の主な機能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                自動最適化
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 自動サブセット化</li>
                <li>• プリロード</li>
                <li>• セルフホスティング</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                パフォーマンス
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• レイアウトシフト防止</li>
                <li>• CSS変数による管理</li>
                <li>• 最小限のファイルサイズ</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">
                Variable Fonts
              </h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• 1ファイルで全ウェイト</li>
                <li>• 柔軟なタイポグラフィ</li>
                <li>• ファイルサイズ削減</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">
                開発体験
              </h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• TypeScript サポート</li>
                <li>• 簡単な設定</li>
                <li>• Google Fonts 統合</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
