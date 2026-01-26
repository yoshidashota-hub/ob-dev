# 06 - Typography（タイポグラフィ）

## この章で学ぶこと

- フォントサイズとウェイト
- 行間とレタースペーシング
- テキスト配置と装飾
- フォントファミリー

## フォントサイズ

```html
<p class="text-xs">12px - Extra Small</p>
<p class="text-sm">14px - Small</p>
<p class="text-base">16px - Base（デフォルト）</p>
<p class="text-lg">18px - Large</p>
<p class="text-xl">20px - Extra Large</p>
<p class="text-2xl">24px - 2XL</p>
<p class="text-3xl">30px - 3XL</p>
<p class="text-4xl">36px - 4XL</p>
<p class="text-5xl">48px - 5XL</p>
<p class="text-6xl">60px - 6XL</p>
```

## フォントウェイト

```html
<p class="font-thin">100 - Thin</p>
<p class="font-extralight">200 - Extra Light</p>
<p class="font-light">300 - Light</p>
<p class="font-normal">400 - Normal</p>
<p class="font-medium">500 - Medium</p>
<p class="font-semibold">600 - Semibold</p>
<p class="font-bold">700 - Bold</p>
<p class="font-extrabold">800 - Extra Bold</p>
<p class="font-black">900 - Black</p>
```

## 行間（Line Height）

```html
<p class="leading-none">line-height: 1</p>
<p class="leading-tight">line-height: 1.25</p>
<p class="leading-snug">line-height: 1.375</p>
<p class="leading-normal">line-height: 1.5</p>
<p class="leading-relaxed">line-height: 1.625</p>
<p class="leading-loose">line-height: 2</p>

<!-- 固定値 -->
<p class="leading-6">line-height: 24px</p>
<p class="leading-8">line-height: 32px</p>
```

## レタースペーシング

```html
<p class="tracking-tighter">-0.05em</p>
<p class="tracking-tight">-0.025em</p>
<p class="tracking-normal">0</p>
<p class="tracking-wide">0.025em</p>
<p class="tracking-wider">0.05em</p>
<p class="tracking-widest">0.1em</p>
```

## テキスト配置

```html
<p class="text-left">左揃え</p>
<p class="text-center">中央揃え</p>
<p class="text-right">右揃え</p>
<p class="text-justify">両端揃え</p>
```

## テキスト装飾

```html
<p class="underline">下線</p>
<p class="overline">上線</p>
<p class="line-through">打ち消し線</p>
<p class="no-underline">装飾なし</p>

<!-- 下線のスタイル -->
<p class="underline decoration-solid">実線</p>
<p class="underline decoration-double">二重線</p>
<p class="underline decoration-dotted">点線</p>
<p class="underline decoration-dashed">破線</p>
<p class="underline decoration-wavy">波線</p>

<!-- 下線の色 -->
<p class="underline decoration-blue-500">青い下線</p>

<!-- 下線の太さ -->
<p class="underline decoration-2">2px の下線</p>
<p class="underline decoration-4">4px の下線</p>
```

## テキスト変換

```html
<p class="uppercase">大文字 (UPPERCASE)</p>
<p class="lowercase">小文字 (lowercase)</p>
<p class="capitalize">先頭大文字 (Capitalize)</p>
<p class="normal-case">通常</p>
```

## テキストの切り詰め

```html
<!-- 1行で切り詰め -->
<p class="truncate">
  これは非常に長いテキストで、幅を超えると省略記号で切り詰められます...
</p>

<!-- 複数行で切り詰め -->
<p class="line-clamp-2">
  これは複数行のテキストです。2行を超えると省略記号で切り詰められます。これは複数行のテキストです。
</p>
<p class="line-clamp-3">3行で切り詰め</p>
```

## テキストの折り返し

```html
<p class="whitespace-normal">通常の折り返し</p>
<p class="whitespace-nowrap">折り返しなし</p>
<p class="whitespace-pre">スペースと改行を保持</p>
<p class="whitespace-pre-line">改行を保持</p>
<p class="whitespace-pre-wrap">スペースと改行を保持し折り返し</p>

<!-- 単語の分割 -->
<p class="break-normal">通常の分割</p>
<p class="break-words">単語を分割</p>
<p class="break-all">すべてを分割</p>
```

## フォントファミリー

```html
<p class="font-sans">Sans-serif（デフォルト）</p>
<p class="font-serif">Serif</p>
<p class="font-mono">Monospace</p>
```

## フォントスタイル

```html
<p class="italic">イタリック</p>
<p class="not-italic">通常</p>
```

## 実践例

### 見出しとテキスト

```html
<article class="max-w-2xl mx-auto px-4">
  <h1 class="text-4xl font-bold tracking-tight text-gray-900">
    記事のタイトル
  </h1>

  <p class="mt-2 text-lg text-gray-600">
    これは記事の要約です。読者の興味を引く内容を書きます。
  </p>

  <div class="mt-8 prose prose-lg">
    <p class="text-gray-700 leading-relaxed">
      本文のテキストです。適切な行間と読みやすいフォントサイズで、
      ユーザーが快適に読める文章を提供します。
    </p>
  </div>
</article>
```

### カード内のテキスト

```html
<div class="bg-white rounded-lg shadow p-6 max-w-sm">
  <span class="text-xs font-semibold uppercase tracking-wider text-blue-600">
    カテゴリ
  </span>

  <h3 class="mt-2 text-xl font-bold text-gray-900 line-clamp-2">
    カードのタイトルがここに入ります
  </h3>

  <p class="mt-2 text-gray-600 text-sm line-clamp-3">
    カードの説明文です。長いテキストは自動的に省略されます。
    これにより、カードの高さを統一できます。
  </p>

  <div class="mt-4 flex items-center gap-2 text-sm text-gray-500">
    <span>2024年1月27日</span>
    <span>•</span>
    <span>5分で読める</span>
  </div>
</div>
```

### 価格表示

```html
<div class="text-center">
  <span class="text-sm text-gray-500 line-through">¥12,000</span>
  <span class="ml-2 text-3xl font-bold text-gray-900">¥9,800</span>
  <span class="text-sm text-gray-600">/月</span>
</div>
```

### 引用

```html
<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-700">
  <p class="text-lg leading-relaxed">
    「これは引用文です。重要な言葉を強調するために使用します。」
  </p>
  <footer class="mt-2 text-sm text-gray-500 not-italic">— 著者名</footer>
</blockquote>
```

## まとめ

- `text-*` でフォントサイズを指定
- `font-*` でウェイトとファミリーを指定
- `leading-*` で行間を調整
- `tracking-*` でレタースペーシングを調整
- `truncate` と `line-clamp-*` でテキストを切り詰め

## 確認問題

1. 見出しに適したフォントサイズとウェイトを説明してください
2. `truncate` と `line-clamp-2` の違いを説明してください
3. 読みやすい本文のスタイリングを実装してください

## 次の章へ

[07 - Colors](./07-Colors.md) では、カラーシステムについて詳しく学びます。
