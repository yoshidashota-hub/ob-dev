/**
 * Photo Gallery Layout with Parallel Routes
 *
 * Parallel Routes を使用して、メインコンテンツとモーダルを同時にレンダリング
 * @modal スロットがモーダル表示を担当
 */

export default function GalleryLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* メインコンテンツ（children） */}
      {children}

      {/* モーダルスロット（@modal フォルダから提供） */}
      {modal}
    </div>
  );
}
