/**
 * マーケティングセクション用レイアウト
 *
 * Route Groups を使用して、URL に影響を与えずにレイアウトをグループ化
 */

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* マーケティングヘッダー */}
      <header className="bg-white border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* ロゴ */}
            <a href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span className="text-xl font-bold text-purple-900">
                Marketing Hub
              </span>
            </a>

            {/* ナビゲーション */}
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="/"
                className="text-gray-600 hover:text-purple-900 transition-colors"
              >
                ホーム
              </a>
              <a
                href="/about"
                className="text-gray-600 hover:text-purple-900 transition-colors"
              >
                About
              </a>
              <a
                href="/contact"
                className="text-gray-600 hover:text-purple-900 transition-colors"
              >
                Contact
              </a>
              <a
                href="/products"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                ショップへ
              </a>
            </nav>

            {/* モバイルメニュー（簡易版） */}
            <div className="md:hidden">
              <button className="text-purple-900">☰</button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        {children}
      </main>

      {/* マーケティングフッター */}
      <footer className="bg-purple-900 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* 会社情報 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">会社情報</h3>
              <ul className="space-y-2 text-purple-200 text-sm">
                <li>
                  <a href="/about" className="hover:text-white">
                    会社概要
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    採用情報
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    プレスリリース
                  </a>
                </li>
              </ul>
            </div>

            {/* サポート */}
            <div>
              <h3 className="text-lg font-semibold mb-3">サポート</h3>
              <ul className="space-y-2 text-purple-200 text-sm">
                <li>
                  <a href="/contact" className="hover:text-white">
                    お問い合わせ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    利用規約
                  </a>
                </li>
              </ul>
            </div>

            {/* SNS */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
              <div className="flex space-x-4 text-purple-200">
                <a href="#" className="hover:text-white text-2xl">
                  📘
                </a>
                <a href="#" className="hover:text-white text-2xl">
                  🐦
                </a>
                <a href="#" className="hover:text-white text-2xl">
                  📷
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-purple-700 pt-6 text-center text-purple-200 text-sm">
            <p>© 2025 Next.js 16 Sandbox. All rights reserved.</p>
            <p className="mt-2 text-xs">
              Route Groups デモ - マーケティングレイアウト
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
