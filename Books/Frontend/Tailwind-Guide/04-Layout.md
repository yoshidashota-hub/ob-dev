# 04 - Layout（レイアウト）

## この章で学ぶこと

- Flexbox レイアウト
- Grid レイアウト
- コンテナ
- 位置指定

## Flexbox

### 基本

```html
<!-- フレックスコンテナ -->
<div class="flex">横並び</div>
<div class="inline-flex">インライン横並び</div>

<!-- 方向 -->
<div class="flex flex-row">横方向（デフォルト）</div>
<div class="flex flex-row-reverse">横方向（逆順）</div>
<div class="flex flex-col">縦方向</div>
<div class="flex flex-col-reverse">縦方向（逆順）</div>
```

### 配置（justify-content）

```html
<!-- 主軸の配置 -->
<div class="flex justify-start">先頭寄せ</div>
<div class="flex justify-center">中央寄せ</div>
<div class="flex justify-end">末尾寄せ</div>
<div class="flex justify-between">両端寄せ</div>
<div class="flex justify-around">均等配置（外側余白半分）</div>
<div class="flex justify-evenly">均等配置（均等余白）</div>
```

### 配置（align-items）

```html
<!-- 交差軸の配置 -->
<div class="flex items-start">上揃え</div>
<div class="flex items-center">中央揃え</div>
<div class="flex items-end">下揃え</div>
<div class="flex items-baseline">ベースライン揃え</div>
<div class="flex items-stretch">伸縮（デフォルト）</div>
```

### ギャップ

```html
<div class="flex gap-4">全方向に 1rem の隙間</div>
<div class="flex gap-x-4">横方向のみ 1rem</div>
<div class="flex gap-y-2">縦方向のみ 0.5rem</div>
```

### 折り返し

```html
<div class="flex flex-wrap">折り返しあり</div>
<div class="flex flex-nowrap">折り返しなし（デフォルト）</div>
<div class="flex flex-wrap-reverse">逆方向に折り返し</div>
```

### 子要素の制御

```html
<div class="flex">
  <div class="flex-1">均等に伸びる</div>
  <div class="flex-1">均等に伸びる</div>
</div>

<div class="flex">
  <div class="flex-none">伸縮しない</div>
  <div class="flex-1">残りを埋める</div>
</div>

<div class="flex">
  <div class="flex-initial">初期サイズを維持</div>
  <div class="flex-auto">コンテンツに応じて伸縮</div>
</div>

<div class="flex">
  <div class="grow">伸びる</div>
  <div class="grow-0">伸びない</div>
</div>

<div class="flex">
  <div class="shrink">縮む</div>
  <div class="shrink-0">縮まない</div>
</div>
```

### 実践例：ヘッダー

```html
<header class="flex items-center justify-between px-6 py-4 bg-white shadow">
  <div class="text-xl font-bold">Logo</div>

  <nav class="flex items-center gap-6">
    <a href="#" class="text-gray-600 hover:text-gray-900">ホーム</a>
    <a href="#" class="text-gray-600 hover:text-gray-900">サービス</a>
    <a href="#" class="text-gray-600 hover:text-gray-900">お問い合わせ</a>
  </nav>

  <button class="px-4 py-2 bg-blue-500 text-white rounded-lg">ログイン</button>
</header>
```

## Grid

### 基本

```html
<!-- グリッドコンテナ -->
<div class="grid">グリッド</div>
<div class="inline-grid">インライングリッド</div>

<!-- カラム数 -->
<div class="grid grid-cols-1">1列</div>
<div class="grid grid-cols-2">2列</div>
<div class="grid grid-cols-3">3列</div>
<div class="grid grid-cols-4">4列</div>
<div class="grid grid-cols-12">12列</div>
```

### ギャップ

```html
<div class="grid grid-cols-3 gap-4">全方向 1rem</div>
<div class="grid grid-cols-3 gap-x-4 gap-y-2">横 1rem、縦 0.5rem</div>
```

### カラムスパン

```html
<div class="grid grid-cols-4 gap-4">
  <div class="col-span-1">1列分</div>
  <div class="col-span-2">2列分</div>
  <div class="col-span-1">1列分</div>
  <div class="col-span-4">4列分（全幅）</div>
</div>
```

### 行の定義

```html
<div class="grid grid-cols-3 grid-rows-2 gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
  <div>5</div>
  <div>6</div>
</div>
```

### 配置

```html
<!-- アイテムの配置 -->
<div class="grid place-items-center">中央配置</div>
<div class="grid place-items-start">左上配置</div>
<div class="grid place-items-end">右下配置</div>

<!-- コンテンツの配置 -->
<div class="grid place-content-center">コンテンツ中央</div>
<div class="grid place-content-between">コンテンツ両端</div>
```

### 実践例：カードグリッド

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="font-semibold">カード 1</h3>
    <p class="text-gray-600 mt-2">説明文</p>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="font-semibold">カード 2</h3>
    <p class="text-gray-600 mt-2">説明文</p>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="font-semibold">カード 3</h3>
    <p class="text-gray-600 mt-2">説明文</p>
  </div>
</div>
```

## コンテナ

```html
<!-- 中央寄せのコンテナ -->
<div class="container mx-auto px-4">コンテンツ</div>

<!-- 最大幅の指定 -->
<div class="max-w-7xl mx-auto px-4">最大1280px</div>
<div class="max-w-4xl mx-auto px-4">最大896px</div>
<div class="max-w-2xl mx-auto px-4">最大672px</div>
```

## 位置指定

### Position

```html
<div class="relative">相対位置</div>
<div class="absolute">絶対位置</div>
<div class="fixed">固定位置</div>
<div class="sticky">スティッキー</div>
```

### 位置の指定

```html
<div class="relative">
  <div class="absolute top-0 left-0">左上</div>
  <div class="absolute top-0 right-0">右上</div>
  <div class="absolute bottom-0 left-0">左下</div>
  <div class="absolute bottom-0 right-0">右下</div>
  <div class="absolute inset-0">全体</div>
</div>
```

### 実践例：オーバーレイ

```html
<div class="relative">
  <img src="/image.jpg" class="w-full h-64 object-cover" />
  <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
    <h2 class="text-white text-2xl font-bold">オーバーレイテキスト</h2>
  </div>
</div>
```

### 実践例：固定ヘッダー

```html
<header class="fixed top-0 left-0 right-0 z-50 bg-white shadow">
  <div class="max-w-7xl mx-auto px-4 py-4">ヘッダー</div>
</header>

<!-- ヘッダー分の余白 -->
<main class="pt-16">コンテンツ</main>
```

## まとめ

- Flexbox: 1 次元レイアウト（横または縦）
- Grid: 2 次元レイアウト（行と列）
- container と max-w-\* で幅を制御
- position でオーバーレイや固定要素を配置

## 確認問題

1. Flexbox と Grid の使い分けを説明してください
2. `justify-between` と `justify-around` の違いを説明してください
3. レスポンシブなカードグリッドを作成してください

## 次の章へ

[05 - Spacing](./05-Spacing.md) では、マージンとパディングについて詳しく学びます。
