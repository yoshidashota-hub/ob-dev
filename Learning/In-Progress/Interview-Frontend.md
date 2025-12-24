# フロントエンド - 技術面接対策

## 概要

フロントエンド開発の基礎知識。React、レンダリング、パフォーマンス最適化、アクセシビリティなど。

---

## 1. SSR（Server-Side Rendering）

### メリット

- **初期表示の高速化**: FCP（First Contentful Paint）が早い
- **SEO 対策**: クローラーが JS 実行を待たずにインデックス可能
- **OGP 対応**: SNS シェア時のプレビューを動的に設定

### デメリット

- サーバー負荷増加
- TTFB（Time To First Byte）が遅くなりがち

### 解決策

- **ISR (Incremental Static Regeneration)**: バランスを取る
- **Streaming SSR**: 部分的にレンダリングを送信

---

## 2. 仮想 DOM

### なぜ速い？

実際には DOM 操作より遅い場合もある。

**ポイント**: 差分検出による最小限の更新

- 全体を再描画せず、変更箇所だけをバッチで更新
- Reconciliation アルゴリズムで効率的に差分を計算

### Reconciliation のルール

1. 異なる型の要素は別のツリーとして扱う
2. `key` 属性で同一要素を識別（リスト最適化）
3. O(n) のヒューリスティックで差分計算
4. Fiber アーキテクチャで中断可能なレンダリング

---

## 3. React Hooks

### useEffect vs useLayoutEffect

| Hook            | 実行タイミング | ブロック | 用途                             |
| --------------- | -------------- | -------- | -------------------------------- |
| useEffect       | paint 後       | しない   | 一般的な副作用                   |
| useLayoutEffect | paint 前       | する     | DOM 計測、スクロール位置調整など |

### メモ化の落とし穴（useMemo/useCallback）

- 参照の安定性を保つために使うが、過剰な最適化は逆効果
- 依存配列の管理ミスでバグの原因に
- **プロファイリングで実際のボトルネックを確認してから最適化**

```tsx
// 不要なメモ化
const name = useMemo(() => user.name, [user.name]); // 単純な参照は不要

// 必要なメモ化
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

## 4. Core Web Vitals

### LCP（Largest Contentful Paint）

**改善策**:

- [ ] 画像最適化（next/image）
- [ ] プリロード（`<link rel="preload">`）
- [ ] サーバー応答時間短縮

### FID / INP（入力遅延）

**改善策**:

- [ ] JS 分割（Code Splitting）
- [ ] メインスレッド負荷軽減
- [ ] 長時間タスクの分割

### CLS（レイアウトシフト）

**改善策**:

- [ ] 画像・広告のサイズ指定
- [ ] フォント最適化（`font-display: swap`）
- [ ] 動的コンテンツの予約領域

---

## 5. ブラウザのレンダリングパイプライン

```
DOM構築 → CSSOM構築 → Render Tree生成 → Layout → Paint → Composite
```

### 各段階の最適化

| 段階      | 最適化                       |
| --------- | ---------------------------- |
| DOM/CSSOM | 不要な要素削減、CSS の最適化 |
| Layout    | Reflow を最小化              |
| Paint     | Repaint を最小化             |
| Composite | GPU アクセラレーションを活用 |

---

## 6. クリティカルレンダリングパスの最適化

- [ ] CSS/JS のブロッキングを避ける（`async`/`defer` 属性）
- [ ] クリティカル CSS のインライン化
- [ ] リソースのプリロード
- [ ] 不要なリソースの遅延読み込み

```html
<!-- async: ダウンロード後即実行、順序保証なし -->
<script async src="analytics.js"></script>

<!-- defer: DOMContentLoaded後に順序通り実行 -->
<script defer src="main.js"></script>
```

---

## 7. Hydration

### 定義

SSR で生成された HTML をクライアントで React が引き継ぐ処理

### 問題点

- **Hydration Mismatch**: サーバーとクライアントの出力不一致
- 大きな JS バンドルの読み込み待ち

### 解決策

- **Selective Hydration**: 必要な部分だけ Hydrate
- **Islands Architecture**: インタラクティブな部分だけ Hydrate
- **React Server Components**: サーバー側でレンダリング

---

## 8. バンドルサイズ削減

| 手法           | 説明                             |
| -------------- | -------------------------------- |
| Tree Shaking   | 未使用コードの除去               |
| Code Splitting | ルートごとに分割                 |
| Dynamic Import | 必要時に読み込み                 |
| バンドル分析   | webpack-bundle-analyzer で可視化 |

```tsx
// Dynamic Import
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Skeleton />,
});
```

---

## 9. Service Worker

### できること

- **オフライン対応**: キャッシュからコンテンツ配信
- **プッシュ通知**: バックグラウンドで通知受信
- **バックグラウンド同期**: オフライン時のリクエストを後で送信

### キャッシュ戦略

| 戦略                   | 説明                                 |
| ---------------------- | ------------------------------------ |
| Cache First            | キャッシュ優先、なければネットワーク |
| Network First          | ネットワーク優先、失敗時キャッシュ   |
| Stale While Revalidate | キャッシュ返却しつつ裏で更新         |

---

## 10. 状態管理

### クロスブラウザの状態共有

| 方法             | 説明                             |
| ---------------- | -------------------------------- |
| localStorage     | 同一オリジン内で永続化、5MB 制限 |
| BroadcastChannel | 同一オリジンのタブ間通信         |
| SharedWorker     | 複数タブで共有されるワーカー     |

---

## 11. アクセシビリティ（a11y）

### WAI-ARIA

支援技術（スクリーンリーダー）への情報提供

- `role` 属性
- `aria-*` 属性
- `tabindex`

```tsx
<button aria-label="メニューを開く" aria-expanded={isOpen} aria-controls="menu">
  <MenuIcon />
</button>
```

### キーボードナビゲーション

- [ ] フォーカス管理
- [ ] Tab 順序
- [ ] モーダルでのフォーカストラップ

### コントラスト比

| レベル | 基準          |
| ------ | ------------- |
| AA     | 4.5:1（通常） |
| AAA    | 7:1           |

---

## 12. 国際化（i18n）

### 設計ポイント

- [ ] キー管理（namespace で分類）
- [ ] 複数形対応（言語ごとのルール）
- [ ] 日付/数値フォーマッター（Intl API）
- [ ] 翻訳ワークフロー

```tsx
// Intl API の使用
const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const numberFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});
```

### RTL（右から左）言語対応

- CSS 論理プロパティ（`margin-inline-start`）
- レイアウト反転
- アイコンの向き

---

## 学習チェックリスト

### 基本

- [ ] SSR のメリット・デメリットを説明できる
- [ ] 仮想 DOM の仕組みを説明できる
- [ ] useEffect と useLayoutEffect の違いを説明できる

### パフォーマンス

- [ ] Core Web Vitals の各指標を説明できる
- [ ] レンダリングパイプラインを説明できる
- [ ] バンドルサイズ削減の手法を説明できる

### 応用

- [ ] Hydration の問題点と解決策を説明できる
- [ ] Service Worker の機能を説明できる
- [ ] アクセシビリティの基本を説明できる

---

## 関連ノート

- [[Interview-Network]]
- [[Interview-Backend-API]]
- [[Interview-CS-Fundamentals]]
