/**
 * Photos Layout with Parallel Routes
 *
 * Parallel Routes を使用して、メインコンテンツとモーダルを同時にレンダリング
 * @modal スロットがモーダル表示を担当
 */

export default function PhotosLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div>
      {/* メインコンテンツ（children） */}
      {children}

      {/* モーダルスロット（@modal フォルダから提供） */}
      {modal}
    </div>
  );
}
