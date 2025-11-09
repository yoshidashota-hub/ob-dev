/**
 * next/image 最適化デモページ
 *
 * Next.js Image コンポーネントの様々な使い方を実演
 */

import Image from "next/image";

export default function ImagesPage() {
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
            Image Optimization
          </h1>
          <p className="text-gray-600">
            next/image コンポーネントの最適化機能デモ
          </p>
        </div>

        {/* セクション1: 基本的な使い方 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            1. 基本的な画像表示
          </h2>
          <p className="text-gray-600 mb-4">
            width と height を指定した標準的な使い方
          </p>
          <div className="border rounded-lg p-4 bg-gray-50">
            <Image
              src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba"
              alt="Sample image"
              width={600}
              height={400}
              className="rounded-lg"
            />
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-sm font-mono text-blue-900">
              {`<Image src="..." width={600} height={400} />`}
            </p>
            <ul className="mt-2 text-sm text-blue-800 list-disc list-inside">
              <li>自動的にWebP/AVIF形式に変換</li>
              <li>遅延読み込み（Lazy Loading）</li>
              <li>画像サイズの自動最適化</li>
            </ul>
          </div>
        </section>

        {/* セクション2: レスポンシブ画像 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            2. レスポンシブ画像（fill）
          </h2>
          <p className="text-gray-600 mb-4">
            親要素のサイズに合わせて自動的に調整
          </p>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="relative w-full h-96">
              <Image
                src="https://images.unsplash.com/photo-1682687221038-404cb8830901"
                alt="Responsive image"
                fill
                className="rounded-lg object-cover"
              />
            </div>
          </div>
          <div className="mt-4 p-4 bg-green-50 rounded">
            <p className="text-sm font-mono text-green-900">
              {`<Image src="..." fill className="object-cover" />`}
            </p>
            <ul className="mt-2 text-sm text-green-800 list-disc list-inside">
              <li>親要素（relative）のサイズに合わせる</li>
              <li>object-cover で aspect ratio を維持</li>
              <li>レスポンシブデザインに最適</li>
            </ul>
          </div>
        </section>

        {/* セクション3: Priority（優先読み込み） */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            3. Priority Loading（最優先読み込み）
          </h2>
          <p className="text-gray-600 mb-4">
            Above-the-fold の重要な画像は priority を指定
          </p>
          <div className="border rounded-lg p-4 bg-gray-50">
            <Image
              src="https://images.unsplash.com/photo-1682687220923-c58b9a4592ae"
              alt="Hero image"
              width={800}
              height={400}
              priority
              className="rounded-lg w-full"
            />
          </div>
          <div className="mt-4 p-4 bg-purple-50 rounded">
            <p className="text-sm font-mono text-purple-900">
              {`<Image src="..." priority />`}
            </p>
            <ul className="mt-2 text-sm text-purple-800 list-disc list-inside">
              <li>Lazy Loading を無効化</li>
              <li>LCP（Largest Contentful Paint）の改善</li>
              <li>ヒーロー画像やファーストビューに使用</li>
            </ul>
          </div>
        </section>

        {/* セクション4: グリッドレイアウト */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            4. グリッドレイアウト
          </h2>
          <p className="text-gray-600 mb-4">
            複数の画像を効率的に表示
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              "photo-1682687220063-4742bd7fd538",
              "photo-1682687220742-aba13b6e50ba",
              "photo-1682687221038-404cb8830901",
              "photo-1682687220923-c58b9a4592ae",
              "photo-1682687220199-d0124f48f95b",
              "photo-1682687220063-4742bd7fd538",
            ].map((id, index) => (
              <div
                key={index}
                className="relative h-64 border rounded-lg overflow-hidden"
              >
                <Image
                  src={`https://images.unsplash.com/${id}`}
                  alt={`Grid image ${index + 1}`}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-orange-50 rounded">
            <p className="text-sm text-orange-800">
              ✓ すべての画像が自動最適化
              <br />
              ✓ ビューポートに入るまで遅延読み込み
              <br />✓ デバイスに応じた適切なサイズ
            </p>
          </div>
        </section>

        {/* セクション5: Placeholder */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            5. Placeholder（ぼかし効果）
          </h2>
          <p className="text-gray-600 mb-4">
            読み込み中のUX改善
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                placeholder="blur"
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1682687220199-d0124f48f95b"
                  alt="Blurred placeholder"
                  width={400}
                  height={300}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wgARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGst//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//aAAwDAQACAAMAAAAQA//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Qf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Qf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8Qf//Z"
                  className="w-full"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                ぼかし効果で読み込み待ち時間を軽減
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">placeholder なし</h3>
              <div className="border rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1682687220063-4742bd7fd538"
                  alt="No placeholder"
                  width={400}
                  height={300}
                  className="w-full"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                標準的な読み込み
              </p>
            </div>
          </div>
        </section>

        {/* セクション6: Quality設定 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            6. Quality（品質）設定
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { quality: 100, label: "最高品質 (100)" },
              { quality: 75, label: "デフォルト (75)" },
              { quality: 50, label: "低品質 (50)" },
            ].map(({ quality, label }) => (
              <div key={quality}>
                <h3 className="text-lg font-semibold mb-2">{label}</h3>
                <Image
                  src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba"
                  alt={`Quality ${quality}`}
                  width={300}
                  height={200}
                  quality={quality}
                  className="rounded-lg w-full"
                />
                <p className="text-sm text-gray-600 mt-2">
                  quality={quality}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 機能まとめ */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📊 next/image の主な機能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                自動最適化
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• WebP/AVIF 自動変換</li>
                <li>• デバイスごとの適切なサイズ</li>
                <li>• ファイルサイズの圧縮</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                パフォーマンス
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Lazy Loading（遅延読み込み）</li>
                <li>• Priority Loading</li>
                <li>• LCP改善</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">UX向上</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Placeholder（ぼかし効果）</li>
                <li>• レイアウトシフト防止</li>
                <li>• スムーズな読み込み</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">
                レスポンシブ
              </h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• fill プロパティ</li>
                <li>• object-fit 制御</li>
                <li>• 画面サイズ対応</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
