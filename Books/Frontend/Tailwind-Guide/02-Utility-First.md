# 02 - Utility-First（ユーティリティファースト）

## この章で学ぶこと

- ユーティリティファーストの基本
- クラスの組み合わせ方
- 従来の CSS との比較
- 効率的な開発フロー

## ユーティリティファーストとは

1 つのクラスが 1 つの CSS プロパティに対応するアプローチです。

```html
<!-- 各クラスが1つのスタイルを担当 -->
<div
  class="
    flex           /* display: flex */
    items-center   /* align-items: center */
    gap-4          /* gap: 1rem */
    p-4            /* padding: 1rem */
    bg-white       /* background-color: white */
    rounded-lg     /* border-radius: 0.5rem */
    shadow         /* box-shadow: ... */
  "
>
  コンテンツ
</div>
```

## 基本的なユーティリティクラス

### サイズ・スペーシング

```html
<!-- 幅・高さ -->
<div class="w-full">幅100%</div>
<div class="w-1/2">幅50%</div>
<div class="w-64">幅256px</div>
<div class="h-screen">高さ100vh</div>

<!-- パディング -->
<div class="p-4">全方向 1rem</div>
<div class="px-4 py-2">左右 1rem、上下 0.5rem</div>
<div class="pt-4">上のみ 1rem</div>

<!-- マージン -->
<div class="m-4">全方向 1rem</div>
<div class="mx-auto">左右 auto（中央寄せ）</div>
<div class="mt-8">上のみ 2rem</div>
```

### フレックスボックス

```html
<!-- 基本的なフレックス -->
<div class="flex">フレックスコンテナ</div>
<div class="flex flex-col">縦方向</div>
<div class="flex flex-row">横方向（デフォルト）</div>

<!-- 配置 -->
<div class="flex items-center">縦方向中央</div>
<div class="flex justify-between">両端寄せ</div>
<div class="flex items-center justify-center">完全中央</div>

<!-- ギャップ -->
<div class="flex gap-4">要素間 1rem</div>
<div class="flex gap-x-4 gap-y-2">横 1rem、縦 0.5rem</div>
```

### テキスト

```html
<!-- フォントサイズ -->
<p class="text-xs">12px</p>
<p class="text-sm">14px</p>
<p class="text-base">16px</p>
<p class="text-lg">18px</p>
<p class="text-xl">20px</p>
<p class="text-2xl">24px</p>

<!-- フォントウェイト -->
<p class="font-normal">400</p>
<p class="font-medium">500</p>
<p class="font-semibold">600</p>
<p class="font-bold">700</p>

<!-- テキスト配置 -->
<p class="text-left">左寄せ</p>
<p class="text-center">中央</p>
<p class="text-right">右寄せ</p>

<!-- 色 -->
<p class="text-gray-500">グレー</p>
<p class="text-blue-600">青</p>
<p class="text-red-500">赤</p>
```

### 背景・ボーダー

```html
<!-- 背景色 -->
<div class="bg-white">白</div>
<div class="bg-gray-100">薄いグレー</div>
<div class="bg-blue-500">青</div>

<!-- ボーダー -->
<div class="border">1px solid</div>
<div class="border-2">2px</div>
<div class="border-gray-300">グレーのボーダー</div>

<!-- 角丸 -->
<div class="rounded">0.25rem</div>
<div class="rounded-lg">0.5rem</div>
<div class="rounded-full">完全な円</div>

<!-- シャドウ -->
<div class="shadow">小さい影</div>
<div class="shadow-md">中くらい</div>
<div class="shadow-lg">大きい影</div>
```

## 実践的な例

### カード

```html
<div class="bg-white rounded-lg shadow-md p-6 max-w-sm">
  <img
    src="/image.jpg"
    alt="Card image"
    class="w-full h-48 object-cover rounded-t-lg"
  />
  <h3 class="text-xl font-semibold mt-4 text-gray-800">カードタイトル</h3>
  <p class="text-gray-600 mt-2">
    カードの説明文がここに入ります。Tailwind CSS
    を使うと簡単にスタイリングできます。
  </p>
  <button
    class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
  >
    詳細を見る
  </button>
</div>
```

### ナビゲーション

```html
<nav class="bg-white shadow">
  <div class="max-w-7xl mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- ロゴ -->
      <div class="flex-shrink-0">
        <span class="text-xl font-bold text-blue-600">Logo</span>
      </div>

      <!-- ナビリンク -->
      <div class="flex items-center gap-8">
        <a href="#" class="text-gray-700 hover:text-blue-600">ホーム</a>
        <a href="#" class="text-gray-700 hover:text-blue-600">サービス</a>
        <a href="#" class="text-gray-700 hover:text-blue-600">お問い合わせ</a>
      </div>

      <!-- ボタン -->
      <button class="px-4 py-2 bg-blue-500 text-white rounded-lg">
        ログイン
      </button>
    </div>
  </div>
</nav>
```

### フォーム

```html
<form class="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-1"> メール </label>
    <input
      type="email"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      placeholder="example@email.com"
    />
  </div>

  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-1">
      パスワード
    </label>
    <input
      type="password"
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>

  <button
    type="submit"
    class="w-full py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
  >
    ログイン
  </button>
</form>
```

## 従来の CSS との比較

### 従来の CSS

```css
/* styles.css */
.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  max-width: 24rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1rem;
  color: #1f2937;
}

.card-description {
  color: #4b5563;
  margin-top: 0.5rem;
}

.card-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.25rem;
}

.card-button:hover {
  background-color: #2563eb;
}
```

### Tailwind CSS

```html
<!-- CSSファイル不要 -->
<div class="bg-white rounded-lg shadow-md p-6 max-w-sm">
  <h3 class="text-xl font-semibold mt-4 text-gray-800">タイトル</h3>
  <p class="text-gray-600 mt-2">説明文</p>
  <button
    class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    ボタン
  </button>
</div>
```

## クラスの整理

### 論理的なグループ分け

```html
<!-- レイアウト → ボックス → タイポグラフィ → 色 → 効果 -->
<button
  class="
    flex items-center gap-2
    px-4 py-2
    text-sm font-medium
    bg-blue-500 text-white
    rounded-lg shadow hover:bg-blue-600 transition-colors
  "
>
  ボタン
</button>
```

## まとめ

- 1 クラス = 1 プロパティ が基本
- クラスを組み合わせてスタイリング
- CSS ファイルを書く必要がない
- 変更が他に影響しない

## 確認問題

1. `flex items-center justify-between` で実現されるレイアウトを説明してください
2. `px-4 py-2` と `p-4` の違いを説明してください
3. カードコンポーネントを Tailwind で作成してください

## 次の章へ

[03 - Core-Concepts](./03-Core-Concepts.md) では、Tailwind のコアコンセプトを学びます。
