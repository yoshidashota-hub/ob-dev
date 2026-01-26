# 11 - States（状態スタイル）

## この章で学ぶこと

- ホバー、フォーカス状態
- アクティブ、無効状態
- グループとピアの状態
- フォーム要素の状態

## 基本的な状態

### hover

```html
<button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  ホバーで色が変わる
</button>

<a href="#" class="text-blue-500 hover:text-blue-700 hover:underline">
  ホバーで下線
</a>

<div class="p-4 hover:shadow-lg transition-shadow">
  ホバーで影が付く
</div>
```

### focus

```html
<input
  type="text"
  class="
    border border-gray-300 rounded px-4 py-2
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
  "
/>

<button
  class="
    bg-blue-500 text-white px-4 py-2 rounded
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  "
>
  フォーカス時にリング
</button>
```

### focus-visible

キーボードフォーカス時のみスタイルを適用：

```html
<button
  class="
    bg-blue-500 text-white px-4 py-2 rounded
    focus:outline-none
    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
  "
>
  キーボードフォーカスのみリング
</button>
```

### focus-within

子要素にフォーカスがある場合：

```html
<div class="border border-gray-300 rounded p-4 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
  <label class="block text-sm text-gray-600">ラベル</label>
  <input type="text" class="w-full mt-1 focus:outline-none" />
</div>
```

### active

クリック中：

```html
<button
  class="
    bg-blue-500 hover:bg-blue-600 active:bg-blue-700
    text-white px-4 py-2 rounded
    active:scale-95 transition-transform
  "
>
  クリックで縮む
</button>
```

### disabled

```html
<button
  disabled
  class="
    bg-blue-500 text-white px-4 py-2 rounded
    disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50
  "
>
  無効なボタン
</button>

<input
  type="text"
  disabled
  class="
    border rounded px-4 py-2
    disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
  "
/>
```

## フォーム状態

### checked

```html
<label class="flex items-center gap-2">
  <input
    type="checkbox"
    class="
      w-5 h-5 rounded border-gray-300
      checked:bg-blue-500 checked:border-blue-500
    "
  />
  <span>チェックボックス</span>
</label>
```

### placeholder

```html
<input
  type="text"
  placeholder="プレースホルダー"
  class="
    border rounded px-4 py-2
    placeholder:text-gray-400 placeholder:italic
  "
/>
```

### required, invalid, valid

```html
<input
  type="email"
  required
  class="
    border rounded px-4 py-2
    invalid:border-red-500 invalid:ring-red-500
    valid:border-green-500
  "
/>
```

### read-only

```html
<input
  type="text"
  readonly
  value="読み取り専用"
  class="
    border rounded px-4 py-2
    read-only:bg-gray-100 read-only:cursor-default
  "
/>
```

## グループ状態（group）

親要素の状態に基づいて子要素をスタイリング：

```html
<div class="group p-4 bg-white rounded-lg hover:bg-blue-500 transition-colors">
  <h3 class="font-semibold text-gray-900 group-hover:text-white">タイトル</h3>
  <p class="text-gray-600 group-hover:text-blue-100">説明文</p>
  <span
    class="opacity-0 group-hover:opacity-100 text-white transition-opacity"
  >
    →
  </span>
</div>
```

### 名前付きグループ

```html
<div class="group/card p-4 hover:bg-blue-500">
  <div class="group/button">
    <span class="group-hover/card:text-white">カードホバーで白</span>
    <button class="group-hover/button:underline">ボタンホバーで下線</button>
  </div>
</div>
```

## ピア状態（peer）

兄弟要素の状態に基づいてスタイリング：

```html
<div>
  <input type="checkbox" id="toggle" class="peer sr-only" />
  <label
    for="toggle"
    class="
      block px-4 py-2 bg-gray-200 rounded cursor-pointer
      peer-checked:bg-blue-500 peer-checked:text-white
    "
  >
    クリックで切り替え
  </label>
</div>
```

### フォームバリデーション

```html
<div>
  <input
    type="email"
    placeholder="メールアドレス"
    class="peer border rounded px-4 py-2 w-full"
    required
  />
  <p class="mt-1 text-sm text-red-500 invisible peer-invalid:visible">
    有効なメールアドレスを入力してください
  </p>
</div>
```

## first, last, odd, even

### リスト項目

```html
<ul class="divide-y">
  <li class="py-2 first:pt-0 last:pb-0">アイテム 1</li>
  <li class="py-2 first:pt-0 last:pb-0">アイテム 2</li>
  <li class="py-2 first:pt-0 last:pb-0">アイテム 3</li>
</ul>
```

### テーブル行

```html
<tbody>
  <tr class="odd:bg-gray-50 even:bg-white">
    <td>1</td>
  </tr>
  <tr class="odd:bg-gray-50 even:bg-white">
    <td>2</td>
  </tr>
  <tr class="odd:bg-gray-50 even:bg-white">
    <td>3</td>
  </tr>
</tbody>
```

## before, after（疑似要素）

```html
<span
  class="
    relative
    after:content-[''] after:absolute after:bottom-0 after:left-0
    after:w-full after:h-0.5 after:bg-blue-500
    after:scale-x-0 hover:after:scale-x-100
    after:transition-transform after:origin-left
  "
>
  ホバーで下線アニメーション
</span>
```

### 必須マーク

```html
<label class="after:content-['*'] after:ml-0.5 after:text-red-500">
  必須項目
</label>
```

## トランジション

```html
<!-- 基本 -->
<button class="bg-blue-500 hover:bg-blue-600 transition-colors">
  色のトランジション
</button>

<!-- 複数プロパティ -->
<button class="hover:scale-105 hover:shadow-lg transition-all">
  すべてのトランジション
</button>

<!-- 個別指定 -->
<button class="transition-transform duration-300 ease-in-out hover:scale-110">
  300ms で拡大
</button>

<!-- 遅延 -->
<button class="transition-opacity delay-150 hover:opacity-75">
  150ms 遅延
</button>
```

## 実践例: インタラクティブなカード

```html
<div
  class="
    group relative overflow-hidden
    bg-white rounded-lg shadow
    hover:shadow-xl transition-shadow duration-300
  "
>
  <img
    src="/image.jpg"
    class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
  />

  <div class="p-6">
    <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
      タイトル
    </h3>
    <p class="mt-2 text-gray-600">説明文</p>
  </div>

  <div
    class="
      absolute bottom-0 left-0 right-0 p-4
      bg-gradient-to-t from-black/50 to-transparent
      opacity-0 group-hover:opacity-100
      transition-opacity duration-300
    "
  >
    <button class="text-white">詳細を見る →</button>
  </div>
</div>
```

## まとめ

- `hover:`, `focus:`, `active:` で状態スタイルを指定
- `group` で親の状態を子に伝播
- `peer` で兄弟要素の状態を参照
- `first:`, `last:`, `odd:`, `even:` でリスト項目をスタイリング
- `transition-*` でスムーズなアニメーション

## 確認問題

1. `focus` と `focus-visible` の違いを説明してください
2. `group` と `peer` の使い分けを説明してください
3. ホバーで画像が拡大するカードを作成してください

## 次の章へ

[12 - Configuration](./12-Configuration.md) では、Tailwind の設定ファイルについて学びます。
