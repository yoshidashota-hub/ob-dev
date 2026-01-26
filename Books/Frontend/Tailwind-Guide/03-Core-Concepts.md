# 03 - Core Concepts（コアコンセプト）

## この章で学ぶこと

- デザイントークン
- スペーシングスケール
- カラーパレット
- ブレークポイント

## デザイントークン

Tailwind は一貫したデザインシステムを提供します。

### スペーシングスケール

```
0    → 0px
px   → 1px
0.5  → 2px
1    → 4px
1.5  → 6px
2    → 8px
2.5  → 10px
3    → 12px
3.5  → 14px
4    → 16px
5    → 20px
6    → 24px
7    → 28px
8    → 32px
9    → 36px
10   → 40px
11   → 44px
12   → 48px
14   → 56px
16   → 64px
20   → 80px
24   → 96px
28   → 112px
32   → 128px
36   → 144px
40   → 160px
44   → 176px
48   → 192px
52   → 208px
56   → 224px
60   → 240px
64   → 256px
72   → 288px
80   → 320px
96   → 384px
```

```html
<!-- 使用例 -->
<div class="p-4">16px padding</div>
<div class="m-8">32px margin</div>
<div class="gap-6">24px gap</div>
<div class="w-64">256px width</div>
```

### サイズユニット

```html
<!-- 固定サイズ -->
<div class="w-64">256px</div>
<div class="h-32">128px</div>

<!-- パーセンテージ -->
<div class="w-1/2">50%</div>
<div class="w-1/3">33.333%</div>
<div class="w-2/3">66.667%</div>
<div class="w-1/4">25%</div>
<div class="w-3/4">75%</div>
<div class="w-full">100%</div>

<!-- ビューポート -->
<div class="h-screen">100vh</div>
<div class="w-screen">100vw</div>
<div class="min-h-screen">min-height: 100vh</div>

<!-- コンテンツベース -->
<div class="w-fit">fit-content</div>
<div class="w-min">min-content</div>
<div class="w-max">max-content</div>
```

## カラーパレット

### グレースケール

```html
<div class="bg-gray-50">50 (最も明るい)</div>
<div class="bg-gray-100">100</div>
<div class="bg-gray-200">200</div>
<div class="bg-gray-300">300</div>
<div class="bg-gray-400">400</div>
<div class="bg-gray-500">500 (中間)</div>
<div class="bg-gray-600">600</div>
<div class="bg-gray-700">700</div>
<div class="bg-gray-800">800</div>
<div class="bg-gray-900">900</div>
<div class="bg-gray-950">950 (最も暗い)</div>
```

### カラーバリエーション

```html
<!-- 同じパターンで全色利用可能 -->
<div class="bg-red-500">Red</div>
<div class="bg-orange-500">Orange</div>
<div class="bg-amber-500">Amber</div>
<div class="bg-yellow-500">Yellow</div>
<div class="bg-lime-500">Lime</div>
<div class="bg-green-500">Green</div>
<div class="bg-emerald-500">Emerald</div>
<div class="bg-teal-500">Teal</div>
<div class="bg-cyan-500">Cyan</div>
<div class="bg-sky-500">Sky</div>
<div class="bg-blue-500">Blue</div>
<div class="bg-indigo-500">Indigo</div>
<div class="bg-violet-500">Violet</div>
<div class="bg-purple-500">Purple</div>
<div class="bg-fuchsia-500">Fuchsia</div>
<div class="bg-pink-500">Pink</div>
<div class="bg-rose-500">Rose</div>
```

### 色の適用先

```html
<!-- 背景 -->
<div class="bg-blue-500">背景色</div>

<!-- テキスト -->
<p class="text-blue-500">テキスト色</p>

<!-- ボーダー -->
<div class="border border-blue-500">ボーダー色</div>

<!-- リング（フォーカスリング） -->
<input class="ring-2 ring-blue-500" />

<!-- シャドウ -->
<div class="shadow-lg shadow-blue-500/50">影の色</div>

<!-- プレースホルダー -->
<input class="placeholder-gray-400" placeholder="入力してください" />
```

### 透明度

```html
<!-- 色/透明度 の形式 -->
<div class="bg-blue-500/50">50% 透明</div>
<div class="bg-blue-500/75">75% 透明</div>
<div class="bg-blue-500/25">25% 透明</div>
<div class="text-black/80">80% 透明の黒テキスト</div>
```

## ブレークポイント

### デフォルトのブレークポイント

```
sm   → 640px 以上
md   → 768px 以上
lg   → 1024px 以上
xl   → 1280px 以上
2xl  → 1536px 以上
```

### モバイルファーストの考え方

```html
<!-- デフォルトはモバイル、大きい画面で上書き -->
<div
  class="
    text-sm      /* モバイル: 14px */
    md:text-base /* タブレット以上: 16px */
    lg:text-lg   /* デスクトップ以上: 18px */
  "
>
  レスポンシブテキスト
</div>

<div
  class="
    flex flex-col    /* モバイル: 縦並び */
    md:flex-row      /* タブレット以上: 横並び */
  "
>
  <div>アイテム1</div>
  <div>アイテム2</div>
</div>
```

## フォントサイズスケール

```
text-xs     → 12px / 16px line-height
text-sm     → 14px / 20px
text-base   → 16px / 24px
text-lg     → 18px / 28px
text-xl     → 20px / 28px
text-2xl    → 24px / 32px
text-3xl    → 30px / 36px
text-4xl    → 36px / 40px
text-5xl    → 48px / 48px
text-6xl    → 60px / 60px
text-7xl    → 72px / 72px
text-8xl    → 96px / 96px
text-9xl    → 128px / 128px
```

## フォントウェイト

```
font-thin        → 100
font-extralight  → 200
font-light       → 300
font-normal      → 400
font-medium      → 500
font-semibold    → 600
font-bold        → 700
font-extrabold   → 800
font-black       → 900
```

## ボーダー半径

```
rounded-none    → 0
rounded-sm      → 2px
rounded         → 4px
rounded-md      → 6px
rounded-lg      → 8px
rounded-xl      → 12px
rounded-2xl     → 16px
rounded-3xl     → 24px
rounded-full    → 9999px (完全な円)
```

## シャドウ

```
shadow-sm     → 小さい影
shadow        → 標準の影
shadow-md     → 中くらいの影
shadow-lg     → 大きい影
shadow-xl     → より大きい影
shadow-2xl    → 最も大きい影
shadow-inner  → 内側の影
shadow-none   → 影なし
```

## z-index

```
z-0    → 0
z-10   → 10
z-20   → 20
z-30   → 30
z-40   → 40
z-50   → 50
z-auto → auto
```

## まとめ

- Tailwind は一貫したデザイントークンを提供
- スペーシングは 4px を基準としたスケール
- カラーは 50〜950 の明度バリエーション
- ブレークポイントはモバイルファースト

## 確認問題

1. `p-4` は何ピクセルに相当しますか？
2. `bg-blue-500/50` は何を意味しますか？
3. モバイルファーストの考え方を説明してください

## 次の章へ

[04 - Layout](./04-Layout.md) では、Flexbox と Grid を使ったレイアウトを学びます。
