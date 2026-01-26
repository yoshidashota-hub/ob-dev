# 09 - Responsive（レスポンシブデザイン）

## この章で学ぶこと

- ブレークポイントの使い方
- モバイルファーストの考え方
- レスポンシブパターン
- コンテナクエリ

## ブレークポイント

### デフォルトのブレークポイント

```
sm   → 640px 以上   (小型タブレット)
md   → 768px 以上   (タブレット)
lg   → 1024px 以上  (ラップトップ)
xl   → 1280px 以上  (デスクトップ)
2xl  → 1536px 以上  (大型モニター)
```

### 基本的な使い方

```html
<!-- モバイル: 1列、タブレット以上: 2列、デスクトップ以上: 3列 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>カード 1</div>
  <div>カード 2</div>
  <div>カード 3</div>
</div>
```

## モバイルファースト

Tailwind はモバイルファーストを採用しています。

```html
<!--
  デフォルト（モバイル）のスタイルを先に書き、
  大きい画面で上書きする
-->
<div
  class="
    text-sm      /* モバイル */
    md:text-base /* タブレット以上 */
    lg:text-lg   /* デスクトップ以上 */
  "
>
  レスポンシブテキスト
</div>
```

### 考え方

```html
<!-- ❌ 悪い例: デスクトップファースト的な考え -->
<div class="hidden md:block">タブレット以上で表示</div>

<!-- ✅ 良い例: モバイルファースト -->
<div class="block md:hidden">モバイルのみ表示</div>
<div class="hidden md:block">タブレット以上で表示</div>
```

## レスポンシブパターン

### ナビゲーション

```html
<nav class="bg-white shadow">
  <div class="max-w-7xl mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- ロゴ -->
      <div class="text-xl font-bold">Logo</div>

      <!-- デスクトップメニュー -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#" class="text-gray-600 hover:text-gray-900">ホーム</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">サービス</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">お問い合わせ</a>
      </div>

      <!-- モバイルメニューボタン -->
      <button class="md:hidden p-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  </div>
</nav>
```

### レイアウト切り替え

```html
<!-- モバイル: 縦並び、デスクトップ: 横並び -->
<div class="flex flex-col lg:flex-row gap-8">
  <!-- メインコンテンツ -->
  <main class="flex-1">
    <h1 class="text-2xl lg:text-4xl font-bold">タイトル</h1>
    <p class="mt-4">コンテンツ</p>
  </main>

  <!-- サイドバー -->
  <aside class="w-full lg:w-80">
    <div class="bg-gray-100 p-4 rounded-lg">サイドバー</div>
  </aside>
</div>
```

### カードグリッド

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <div class="bg-white rounded-lg shadow p-4">カード 1</div>
  <div class="bg-white rounded-lg shadow p-4">カード 2</div>
  <div class="bg-white rounded-lg shadow p-4">カード 3</div>
  <div class="bg-white rounded-lg shadow p-4">カード 4</div>
</div>
```

### フォントサイズ

```html
<h1
  class="
    text-2xl       /* モバイル */
    sm:text-3xl    /* 小型タブレット */
    md:text-4xl    /* タブレット */
    lg:text-5xl    /* デスクトップ */
  "
>
  レスポンシブ見出し
</h1>
```

### スペーシング

```html
<section
  class="
    px-4 py-8        /* モバイル */
    md:px-8 md:py-12 /* タブレット */
    lg:px-16 lg:py-20 /* デスクトップ */
  "
>
  セクションコンテンツ
</section>
```

### 表示/非表示

```html
<!-- モバイルのみ表示 -->
<div class="block sm:hidden">モバイルメニュー</div>

<!-- タブレット以上で表示 -->
<div class="hidden sm:block">デスクトップメニュー</div>

<!-- 特定の範囲でのみ表示 -->
<div class="hidden md:block lg:hidden">タブレットのみ</div>
```

## 範囲指定

### max-\* プレフィックス

```html
<!-- 特定のブレークポイント以下でのみ適用 -->
<div class="max-md:hidden">768px 以下で非表示</div>
<div class="max-lg:text-sm">1024px 以下で小さいテキスト</div>
```

### 範囲

```html
<!-- 特定の範囲でのみ適用 -->
<div class="md:max-lg:bg-blue-500">768px〜1024px で青背景</div>
```

## コンテナ

```html
<!-- レスポンシブコンテナ -->
<div class="container mx-auto px-4">
  <!--
    sm: max-width: 640px
    md: max-width: 768px
    lg: max-width: 1024px
    xl: max-width: 1280px
    2xl: max-width: 1536px
  -->
</div>

<!-- 最大幅指定 -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  固定の最大幅
</div>
```

## 実践例: 完全なレスポンシブページ

```html
<!DOCTYPE html>
<html>
  <body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-white shadow sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="text-xl font-bold">Logo</div>

          <!-- デスクトップナビ -->
          <nav class="hidden md:flex items-center gap-6">
            <a href="#">ホーム</a>
            <a href="#">サービス</a>
            <a href="#">お問い合わせ</a>
          </nav>

          <!-- モバイルメニュー -->
          <button class="md:hidden">メニュー</button>
        </div>
      </div>
    </header>

    <!-- ヒーロー -->
    <section class="py-12 md:py-20 lg:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
          ヒーロータイトル
        </h1>
        <p class="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          サブタイトル
        </p>
      </div>
    </section>

    <!-- 機能セクション -->
    <section class="py-12 md:py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl md:text-3xl font-bold text-center">機能</h2>

        <div
          class="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          <div class="p-6 bg-gray-50 rounded-lg">
            <h3 class="font-semibold">機能 1</h3>
            <p class="mt-2 text-gray-600">説明文</p>
          </div>
          <div class="p-6 bg-gray-50 rounded-lg">
            <h3 class="font-semibold">機能 2</h3>
            <p class="mt-2 text-gray-600">説明文</p>
          </div>
          <div class="p-6 bg-gray-50 rounded-lg">
            <h3 class="font-semibold">機能 3</h3>
            <p class="mt-2 text-gray-600">説明文</p>
          </div>
        </div>
      </div>
    </section>

    <!-- フッター -->
    <footer class="py-8 bg-gray-900 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 class="font-semibold">会社情報</h4>
          </div>
          <div>
            <h4 class="font-semibold">リンク</h4>
          </div>
          <div>
            <h4 class="font-semibold">お問い合わせ</h4>
          </div>
        </div>
      </div>
    </footer>
  </body>
</html>
```

## まとめ

- モバイルファースト: デフォルトはモバイル、大きい画面で上書き
- `sm:`, `md:`, `lg:`, `xl:`, `2xl:` でブレークポイントを指定
- `max-*:` で特定のサイズ以下を指定
- レスポンシブな grid, flex, spacing, typography を活用

## 確認問題

1. モバイルファーストの考え方を説明してください
2. `md:hidden` と `hidden md:block` の違いを説明してください
3. レスポンシブなナビゲーションを作成してください

## 次の章へ

[10 - Dark-Mode](./10-Dark-Mode.md) では、ダークモード対応について学びます。
