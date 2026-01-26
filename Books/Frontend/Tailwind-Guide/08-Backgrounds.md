# 08 - Backgrounds（背景とボーダー）

## この章で学ぶこと

- 背景画像
- ボーダーのスタイリング
- 角丸
- シャドウ

## 背景画像

### 基本設定

```html
<div
  class="bg-cover bg-center h-64"
  style="background-image: url('/image.jpg')"
>
  背景画像
</div>
```

### サイズ

```html
<div class="bg-auto">元のサイズ</div>
<div class="bg-cover">カバー（アスペクト比維持、領域を埋める）</div>
<div class="bg-contain">コンテイン（アスペクト比維持、収める）</div>
```

### 位置

```html
<div class="bg-center">中央</div>
<div class="bg-top">上</div>
<div class="bg-bottom">下</div>
<div class="bg-left">左</div>
<div class="bg-right">右</div>
<div class="bg-left-top">左上</div>
<div class="bg-right-bottom">右下</div>
```

### 繰り返し

```html
<div class="bg-repeat">繰り返し</div>
<div class="bg-no-repeat">繰り返しなし</div>
<div class="bg-repeat-x">横方向のみ繰り返し</div>
<div class="bg-repeat-y">縦方向のみ繰り返し</div>
```

### 固定

```html
<div class="bg-fixed">スクロール時に固定</div>
<div class="bg-local">コンテンツと一緒にスクロール</div>
<div class="bg-scroll">ビューポートと一緒にスクロール</div>
```

## ボーダー

### 幅

```html
<div class="border">1px</div>
<div class="border-0">0px</div>
<div class="border-2">2px</div>
<div class="border-4">4px</div>
<div class="border-8">8px</div>

<!-- 方向別 -->
<div class="border-t-2">上 2px</div>
<div class="border-r-2">右 2px</div>
<div class="border-b-2">下 2px</div>
<div class="border-l-2">左 2px</div>
<div class="border-x-2">左右 2px</div>
<div class="border-y-2">上下 2px</div>
```

### スタイル

```html
<div class="border border-solid">実線（デフォルト）</div>
<div class="border border-dashed">破線</div>
<div class="border border-dotted">点線</div>
<div class="border border-double">二重線</div>
<div class="border-none">なし</div>
```

### 色

```html
<div class="border border-gray-300">グレー</div>
<div class="border border-blue-500">青</div>
<div class="border border-transparent">透明</div>

<!-- 方向別 -->
<div class="border-t-4 border-t-blue-500">上だけ青</div>
```

## 角丸（Border Radius）

### 基本

```html
<div class="rounded-none">0px</div>
<div class="rounded-sm">2px</div>
<div class="rounded">4px</div>
<div class="rounded-md">6px</div>
<div class="rounded-lg">8px</div>
<div class="rounded-xl">12px</div>
<div class="rounded-2xl">16px</div>
<div class="rounded-3xl">24px</div>
<div class="rounded-full">9999px（完全な円）</div>
```

### 方向別

```html
<!-- 上だけ -->
<div class="rounded-t-lg">上の角</div>

<!-- 下だけ -->
<div class="rounded-b-lg">下の角</div>

<!-- 左だけ -->
<div class="rounded-l-lg">左の角</div>

<!-- 右だけ -->
<div class="rounded-r-lg">右の角</div>

<!-- 個別の角 -->
<div class="rounded-tl-lg">左上</div>
<div class="rounded-tr-lg">右上</div>
<div class="rounded-bl-lg">左下</div>
<div class="rounded-br-lg">右下</div>
```

## シャドウ

### 外側のシャドウ

```html
<div class="shadow-sm">小さい影</div>
<div class="shadow">標準</div>
<div class="shadow-md">中</div>
<div class="shadow-lg">大</div>
<div class="shadow-xl">より大</div>
<div class="shadow-2xl">最大</div>
<div class="shadow-none">なし</div>
```

### 内側のシャドウ

```html
<div class="shadow-inner">内側の影</div>
```

### 色付きシャドウ

```html
<div class="shadow-lg shadow-blue-500/50">青い影</div>
<div class="shadow-lg shadow-red-500/30">赤い影</div>
<div class="shadow-lg shadow-gray-500/20">グレーの影</div>
```

## リング

フォーカスリングなどに使用：

```html
<div class="ring">1px のリング</div>
<div class="ring-2">2px</div>
<div class="ring-4">4px</div>
<div class="ring-8">8px</div>

<!-- 色 -->
<div class="ring-2 ring-blue-500">青いリング</div>

<!-- オフセット -->
<div class="ring-2 ring-blue-500 ring-offset-2">オフセット付き</div>
<div class="ring-2 ring-blue-500 ring-offset-4 ring-offset-white">
  白い背景のオフセット
</div>
```

## アウトライン

```html
<button class="outline outline-2 outline-blue-500">アウトライン</button>

<button class="outline outline-2 outline-offset-2 outline-blue-500">
  オフセット付き
</button>
```

## 分割線

```html
<!-- 縦の分割線 -->
<div class="divide-y divide-gray-200">
  <div class="py-4">アイテム 1</div>
  <div class="py-4">アイテム 2</div>
  <div class="py-4">アイテム 3</div>
</div>

<!-- 横の分割線 -->
<div class="flex divide-x divide-gray-200">
  <div class="px-4">アイテム 1</div>
  <div class="px-4">アイテム 2</div>
  <div class="px-4">アイテム 3</div>
</div>

<!-- スタイル -->
<div class="divide-y divide-dashed">破線の分割線</div>
```

## 実践例

### カード

```html
<div class="bg-white rounded-lg shadow-md border border-gray-100 p-6">
  <h3 class="text-lg font-semibold">カードタイトル</h3>
  <p class="mt-2 text-gray-600">カードの内容</p>
</div>
```

### ヒーローセクション

```html
<div
  class="relative h-96 bg-cover bg-center"
  style="background-image: url('/hero.jpg')"
>
  <div class="absolute inset-0 bg-black/50"></div>
  <div class="relative h-full flex items-center justify-center">
    <h1 class="text-4xl font-bold text-white">ヒーローテキスト</h1>
  </div>
</div>
```

### 入力フィールド

```html
<input
  type="text"
  class="w-full px-4 py-2 border border-gray-300 rounded-lg
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="入力してください"
/>
```

### アバター

```html
<!-- 丸いアバター -->
<img src="/avatar.jpg" class="w-12 h-12 rounded-full object-cover" />

<!-- ボーダー付き -->
<img
  src="/avatar.jpg"
  class="w-12 h-12 rounded-full object-cover ring-2 ring-white"
/>

<!-- グループアバター -->
<div class="flex -space-x-2">
  <img src="/avatar1.jpg" class="w-10 h-10 rounded-full ring-2 ring-white" />
  <img src="/avatar2.jpg" class="w-10 h-10 rounded-full ring-2 ring-white" />
  <img src="/avatar3.jpg" class="w-10 h-10 rounded-full ring-2 ring-white" />
</div>
```

### タブ

```html
<div class="border-b border-gray-200">
  <nav class="flex -mb-px">
    <button class="px-4 py-2 border-b-2 border-blue-500 text-blue-600">
      アクティブ
    </button>
    <button
      class="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700"
    >
      タブ 2
    </button>
    <button
      class="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700"
    >
      タブ 3
    </button>
  </nav>
</div>
```

## まとめ

- `bg-cover`, `bg-center` で背景画像を制御
- `border-*` でボーダーの幅、色、スタイルを指定
- `rounded-*` で角丸を指定
- `shadow-*` でシャドウを追加
- `ring-*` でフォーカスリングを追加

## 確認問題

1. ヒーロー画像とオーバーレイを作成してください
2. フォーカス時にリングが表示される入力フィールドを作成してください
3. 分割線付きのリストを作成してください

## 次の章へ

[09 - Responsive](./09-Responsive.md) では、レスポンシブデザインについて学びます。
