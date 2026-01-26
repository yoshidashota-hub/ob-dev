# 05 - Spacing（スペーシング）

## この章で学ぶこと

- マージンの使い方
- パディングの使い方
- スペースユーティリティ
- 実践的なスペーシングパターン

## パディング（Padding）

### 全方向

```html
<div class="p-0">0px</div>
<div class="p-1">4px</div>
<div class="p-2">8px</div>
<div class="p-4">16px</div>
<div class="p-6">24px</div>
<div class="p-8">32px</div>
```

### 方向別

```html
<!-- 水平・垂直 -->
<div class="px-4">左右 16px</div>
<div class="py-4">上下 16px</div>

<!-- 個別方向 -->
<div class="pt-4">上 16px</div>
<div class="pr-4">右 16px</div>
<div class="pb-4">下 16px</div>
<div class="pl-4">左 16px</div>

<!-- 論理的プロパティ -->
<div class="ps-4">start側 16px</div>
<div class="pe-4">end側 16px</div>
```

## マージン（Margin）

### 全方向

```html
<div class="m-0">0px</div>
<div class="m-4">16px</div>
<div class="m-8">32px</div>
<div class="m-auto">auto</div>
```

### 方向別

```html
<!-- 水平・垂直 -->
<div class="mx-4">左右 16px</div>
<div class="my-4">上下 16px</div>
<div class="mx-auto">水平中央</div>

<!-- 個別方向 -->
<div class="mt-4">上 16px</div>
<div class="mr-4">右 16px</div>
<div class="mb-4">下 16px</div>
<div class="ml-4">左 16px</div>
```

### 負のマージン

```html
<div class="-mt-4">上 -16px</div>
<div class="-mx-4">左右 -16px</div>
```

## Space Between（子要素間のスペース）

```html
<!-- 子要素の間に縦方向のスペース -->
<div class="space-y-4">
  <div>アイテム 1</div>
  <div>アイテム 2</div>
  <div>アイテム 3</div>
</div>

<!-- 子要素の間に横方向のスペース -->
<div class="flex space-x-4">
  <div>アイテム 1</div>
  <div>アイテム 2</div>
  <div>アイテム 3</div>
</div>

<!-- 逆順の場合 -->
<div class="flex flex-row-reverse space-x-4 space-x-reverse">
  <div>アイテム 1</div>
  <div>アイテム 2</div>
</div>
```

## Gap（Flexbox/Grid のギャップ）

```html
<!-- 全方向 -->
<div class="flex gap-4">16px のギャップ</div>
<div class="grid gap-4">16px のギャップ</div>

<!-- 方向別 -->
<div class="flex gap-x-4 gap-y-2">横 16px、縦 8px</div>
<div class="grid gap-x-4 gap-y-2">横 16px、縦 8px</div>
```

## 実践パターン

### セクション間のスペース

```html
<main class="space-y-16">
  <section class="py-12">
    <h2 class="text-2xl font-bold mb-6">セクション 1</h2>
    <p>コンテンツ</p>
  </section>

  <section class="py-12">
    <h2 class="text-2xl font-bold mb-6">セクション 2</h2>
    <p>コンテンツ</p>
  </section>
</main>
```

### カードのスペーシング

```html
<div class="bg-white rounded-lg shadow p-6">
  <h3 class="text-xl font-semibold">タイトル</h3>
  <p class="mt-2 text-gray-600">説明文がここに入ります。</p>
  <div class="mt-4 flex gap-2">
    <button class="px-4 py-2 bg-blue-500 text-white rounded">承認</button>
    <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded">却下</button>
  </div>
</div>
```

### フォームのスペーシング

```html
<form class="space-y-6">
  <div>
    <label class="block text-sm font-medium mb-1">名前</label>
    <input type="text" class="w-full px-3 py-2 border rounded-lg" />
  </div>

  <div>
    <label class="block text-sm font-medium mb-1">メール</label>
    <input type="email" class="w-full px-3 py-2 border rounded-lg" />
  </div>

  <div class="pt-4">
    <button type="submit" class="w-full py-2 bg-blue-500 text-white rounded-lg">
      送信
    </button>
  </div>
</form>
```

### ナビゲーションのスペーシング

```html
<nav class="flex items-center justify-between px-6 py-4">
  <div class="text-xl font-bold">Logo</div>

  <ul class="flex items-center gap-8">
    <li><a href="#">ホーム</a></li>
    <li><a href="#">サービス</a></li>
    <li><a href="#">お問い合わせ</a></li>
  </ul>

  <div class="flex items-center gap-4">
    <button class="px-4 py-2 border rounded">ログイン</button>
    <button class="px-4 py-2 bg-blue-500 text-white rounded">登録</button>
  </div>
</nav>
```

### リスト項目のスペーシング

```html
<ul class="divide-y">
  <li class="py-4 flex items-center justify-between">
    <div>
      <h4 class="font-medium">アイテム 1</h4>
      <p class="text-sm text-gray-500 mt-1">説明文</p>
    </div>
    <button class="text-blue-500">編集</button>
  </li>
  <li class="py-4 flex items-center justify-between">
    <div>
      <h4 class="font-medium">アイテム 2</h4>
      <p class="text-sm text-gray-500 mt-1">説明文</p>
    </div>
    <button class="text-blue-500">編集</button>
  </li>
</ul>
```

## space-y vs gap

```html
<!-- space-y: マージンベース（最初の要素にはマージンなし） -->
<div class="space-y-4">
  <div>1</div>
  <!-- margin-top: 0 -->
  <div>2</div>
  <!-- margin-top: 1rem -->
  <div>3</div>
  <!-- margin-top: 1rem -->
</div>

<!-- gap: CSS Gap（すべての間にギャップ） -->
<div class="flex flex-col gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
```

推奨：

- **Flexbox/Grid** では `gap` を使用
- **通常のブロック要素** では `space-y` を使用

## まとめ

- `p-*` でパディング、`m-*` でマージン
- `px-*`, `py-*` で方向を限定
- `space-y-*`, `space-x-*` で子要素間のスペース
- `gap-*` は Flexbox/Grid 専用

## 確認問題

1. `space-y-4` と `gap-4` の違いを説明してください
2. 水平中央寄せのコンテナを作成してください
3. 適切なスペーシングでフォームを作成してください

## 次の章へ

[06 - Typography](./06-Typography.md) では、タイポグラフィについて学びます。
