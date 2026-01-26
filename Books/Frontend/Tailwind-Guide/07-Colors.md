# 07 - Colors（カラーシステム）

## この章で学ぶこと

- Tailwind のカラーパレット
- 色の適用方法
- 透明度の指定
- カスタムカラーの追加

## デフォルトカラーパレット

### グレースケール

```html
<!-- Slate（青みがかったグレー） -->
<div class="bg-slate-50">50</div>
<div class="bg-slate-500">500</div>
<div class="bg-slate-900">900</div>

<!-- Gray（ニュートラルグレー） -->
<div class="bg-gray-50">50</div>
<div class="bg-gray-500">500</div>
<div class="bg-gray-900">900</div>

<!-- Zinc（クールグレー） -->
<div class="bg-zinc-500">Zinc</div>

<!-- Neutral（純粋なグレー） -->
<div class="bg-neutral-500">Neutral</div>

<!-- Stone（暖かみのあるグレー） -->
<div class="bg-stone-500">Stone</div>
```

### カラーバリエーション

各色は 50〜950 の明度バリエーションがあります：

```html
<!-- Red -->
<div class="bg-red-50">50 (最も明るい)</div>
<div class="bg-red-100">100</div>
<div class="bg-red-200">200</div>
<div class="bg-red-300">300</div>
<div class="bg-red-400">400</div>
<div class="bg-red-500">500 (標準)</div>
<div class="bg-red-600">600</div>
<div class="bg-red-700">700</div>
<div class="bg-red-800">800</div>
<div class="bg-red-900">900</div>
<div class="bg-red-950">950 (最も暗い)</div>
```

### 利用可能な色

```
red, orange, amber, yellow, lime, green, emerald, teal,
cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
```

## 色の適用先

### 背景色

```html
<div class="bg-white">白</div>
<div class="bg-black">黒</div>
<div class="bg-transparent">透明</div>
<div class="bg-blue-500">青</div>
<div class="bg-gradient-to-r from-blue-500 to-purple-500">グラデーション</div>
```

### テキスト色

```html
<p class="text-black">黒</p>
<p class="text-white">白</p>
<p class="text-gray-500">グレー</p>
<p class="text-blue-600">青</p>
```

### ボーダー色

```html
<div class="border border-gray-300">グレーボーダー</div>
<div class="border-2 border-blue-500">青ボーダー</div>
<div class="border-t-4 border-red-500">上だけ赤</div>
```

### リング色（フォーカスリング）

```html
<input class="ring-2 ring-blue-500" />
<button class="focus:ring-2 focus:ring-blue-500">ボタン</button>
```

### シャドウ色

```html
<div class="shadow-lg shadow-blue-500/50">青い影</div>
<div class="shadow-lg shadow-gray-500/30">グレーの影</div>
```

### アウトライン色

```html
<button class="outline outline-2 outline-blue-500">アウトライン</button>
```

### 分割線色

```html
<div class="divide-y divide-gray-200">
  <div class="py-4">アイテム 1</div>
  <div class="py-4">アイテム 2</div>
  <div class="py-4">アイテム 3</div>
</div>
```

## 透明度

### 色/透明度 の形式

```html
<!-- 背景の透明度 -->
<div class="bg-blue-500/100">100%（不透明）</div>
<div class="bg-blue-500/75">75%</div>
<div class="bg-blue-500/50">50%</div>
<div class="bg-blue-500/25">25%</div>
<div class="bg-blue-500/10">10%</div>
<div class="bg-blue-500/0">0%（透明）</div>

<!-- テキストの透明度 -->
<p class="text-black/80">80% の黒</p>
<p class="text-black/60">60% の黒</p>

<!-- ボーダーの透明度 -->
<div class="border border-black/20">20% の黒ボーダー</div>
```

### opacity ユーティリティ

```html
<!-- 要素全体の透明度 -->
<div class="opacity-100">100%</div>
<div class="opacity-75">75%</div>
<div class="opacity-50">50%</div>
<div class="opacity-25">25%</div>
<div class="opacity-0">0%</div>
```

## グラデーション

### 方向

```html
<div class="bg-gradient-to-r">左から右</div>
<div class="bg-gradient-to-l">右から左</div>
<div class="bg-gradient-to-t">下から上</div>
<div class="bg-gradient-to-b">上から下</div>
<div class="bg-gradient-to-tr">左下から右上</div>
<div class="bg-gradient-to-br">左上から右下</div>
```

### 色の指定

```html
<!-- 2色グラデーション -->
<div class="bg-gradient-to-r from-blue-500 to-purple-500">青→紫</div>

<!-- 3色グラデーション -->
<div class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
  青→紫→ピンク
</div>

<!-- 透明へのグラデーション -->
<div class="bg-gradient-to-t from-black/50 to-transparent">下から透明へ</div>
```

## 実践例

### ステータスバッジ

```html
<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
  成功
</span>
<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
  警告
</span>
<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
  エラー
</span>
<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
  情報
</span>
```

### アラート

```html
<!-- 成功 -->
<div class="p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
  <p class="font-medium">成功</p>
  <p class="text-sm">操作が正常に完了しました。</p>
</div>

<!-- エラー -->
<div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
  <p class="font-medium">エラー</p>
  <p class="text-sm">問題が発生しました。</p>
</div>
```

### ボタンバリエーション

```html
<!-- Primary -->
<button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Primary
</button>

<!-- Secondary -->
<button class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
  Secondary
</button>

<!-- Outline -->
<button class="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50">
  Outline
</button>

<!-- Danger -->
<button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
  Danger
</button>

<!-- Ghost -->
<button class="px-4 py-2 text-blue-500 rounded hover:bg-blue-50">
  Ghost
</button>
```

### カードの背景

```html
<div class="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-lg">
  <h3 class="text-xl font-bold">プレミアムプラン</h3>
  <p class="mt-2 text-white/80">すべての機能が利用可能</p>
</div>
```

### オーバーレイ

```html
<div class="relative">
  <img src="/image.jpg" class="w-full h-64 object-cover" />
  <div class="absolute inset-0 bg-black/50"></div>
  <div class="absolute inset-0 flex items-center justify-center">
    <h2 class="text-white text-2xl font-bold">テキスト</h2>
  </div>
</div>
```

## カスタムカラーの追加

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        // 単一の色
        accent: "#ff6b6b",
      },
    },
  },
};
```

```html
<!-- 使用 -->
<div class="bg-brand-500 text-white">ブランドカラー</div>
<div class="text-accent">アクセントカラー</div>
```

## まとめ

- 50〜950 の明度バリエーション
- `bg-*`, `text-*`, `border-*` で色を適用
- `/50` 形式で透明度を指定
- グラデーションは `from-*`, `via-*`, `to-*`

## 確認問題

1. `bg-blue-500/50` と `bg-blue-500 opacity-50` の違いを説明してください
2. 3 色グラデーションを作成してください
3. ステータスに応じた色分けのバッジを作成してください

## 次の章へ

[08 - Backgrounds](./08-Backgrounds.md) では、背景とボーダーについて詳しく学びます。
