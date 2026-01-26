# 15 - Components（コンポーネントパターン）

## この章で学ぶこと

- 実践的な UI コンポーネント
- アクセシビリティ対応
- 再利用可能なパターン

## ボタン

### 基本的なボタン

```html
<!-- Primary -->
<button class="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Primary
</button>

<!-- Secondary -->
<button class="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
  Secondary
</button>

<!-- Outline -->
<button class="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
  Outline
</button>

<!-- Ghost -->
<button class="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
  Ghost
</button>

<!-- Danger -->
<button class="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
  Danger
</button>
```

### サイズバリエーション

```html
<button class="px-2.5 py-1.5 text-xs ...">XS</button>
<button class="px-3 py-2 text-sm ...">SM</button>
<button class="px-4 py-2 text-base ...">MD</button>
<button class="px-5 py-2.5 text-lg ...">LG</button>
<button class="px-6 py-3 text-xl ...">XL</button>
```

### アイコン付きボタン

```html
<button class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-width="2" d="M12 4v16m8-8H4" />
  </svg>
  追加
</button>
```

### ローディングボタン

```html
<button disabled class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50">
  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
  </svg>
  処理中...
</button>
```

## 入力フィールド

### 基本的な入力

```html
<div>
  <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
    メールアドレス
  </label>
  <input
    type="email"
    id="email"
    class="w-full px-4 py-2 border border-gray-300 rounded-lg
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
           placeholder-gray-400"
    placeholder="example@email.com"
  />
</div>
```

### エラー状態

```html
<div>
  <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
    メールアドレス
  </label>
  <input
    type="email"
    id="email"
    class="w-full px-4 py-2 border border-red-500 rounded-lg
           focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
           text-red-900 placeholder-red-300"
    placeholder="example@email.com"
  />
  <p class="mt-1 text-sm text-red-500">有効なメールアドレスを入力してください</p>
</div>
```

### アイコン付き入力

```html
<div class="relative">
  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>
  <input
    type="search"
    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="検索..."
  />
</div>
```

## カード

### 基本的なカード

```html
<div class="bg-white rounded-lg shadow-md overflow-hidden max-w-sm">
  <img src="/image.jpg" alt="Card image" class="w-full h-48 object-cover" />
  <div class="p-6">
    <span class="text-xs font-semibold uppercase tracking-wider text-blue-600">
      カテゴリ
    </span>
    <h3 class="mt-2 text-xl font-semibold text-gray-900">カードタイトル</h3>
    <p class="mt-2 text-gray-600">カードの説明文がここに入ります。</p>
    <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
      詳細を見る
    </button>
  </div>
</div>
```

### ホバーエフェクト付きカード

```html
<div class="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
  <div class="relative overflow-hidden">
    <img
      src="/image.jpg"
      alt="Card image"
      class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
    />
    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
  </div>
  <div class="p-6">
    <h3 class="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
      カードタイトル
    </h3>
    <p class="mt-2 text-gray-600">説明文</p>
  </div>
</div>
```

## モーダル

```html
<!-- オーバーレイ -->
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <!-- モーダル本体 -->
  <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
    <!-- ヘッダー -->
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">モーダルタイトル</h3>
      <button class="text-gray-400 hover:text-gray-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- コンテンツ -->
    <div class="px-6 py-4">
      <p class="text-gray-600">モーダルのコンテンツがここに入ります。</p>
    </div>

    <!-- フッター -->
    <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
      <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        キャンセル
      </button>
      <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        確認
      </button>
    </div>
  </div>
</div>
```

## ドロップダウン

```html
<div class="relative inline-block">
  <button class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
    オプション
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- ドロップダウンメニュー -->
  <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
    <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">編集</a>
    <a href="#" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">複製</a>
    <hr class="my-1 border-gray-200" />
    <a href="#" class="block px-4 py-2 text-red-600 hover:bg-red-50">削除</a>
  </div>
</div>
```

## アラート

```html
<!-- 成功 -->
<div class="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
  <div class="flex items-start gap-3">
    <svg class="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
    </svg>
    <div>
      <h4 class="font-medium text-green-800">成功しました</h4>
      <p class="mt-1 text-sm text-green-700">操作が正常に完了しました。</p>
    </div>
  </div>
</div>

<!-- エラー -->
<div class="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
  <div class="flex items-start gap-3">
    <svg class="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
    </svg>
    <div>
      <h4 class="font-medium text-red-800">エラーが発生しました</h4>
      <p class="mt-1 text-sm text-red-700">問題が発生しました。もう一度お試しください。</p>
    </div>
  </div>
</div>
```

## バッジ

```html
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
  Default
</span>
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
  Primary
</span>
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
  Success
</span>
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
  Danger
</span>
<span class="px-2.5 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
  Warning
</span>
```

## タブ

```html
<div>
  <!-- タブナビゲーション -->
  <div class="border-b border-gray-200">
    <nav class="flex -mb-px">
      <button class="px-4 py-2 border-b-2 border-blue-500 text-blue-600 font-medium">
        タブ 1
      </button>
      <button class="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
        タブ 2
      </button>
      <button class="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
        タブ 3
      </button>
    </nav>
  </div>

  <!-- タブコンテンツ -->
  <div class="py-4">
    <p>タブ 1 のコンテンツ</p>
  </div>
</div>
```

## ナビゲーション

```html
<nav class="bg-white shadow">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- ロゴ -->
      <div class="flex-shrink-0">
        <span class="text-xl font-bold text-blue-600">Logo</span>
      </div>

      <!-- デスクトップメニュー -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#" class="text-gray-900 font-medium">ホーム</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">サービス</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">料金</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">お問い合わせ</a>
      </div>

      <!-- CTA ボタン -->
      <div class="hidden md:flex items-center gap-4">
        <a href="#" class="text-gray-600 hover:text-gray-900">ログイン</a>
        <a href="#" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          登録
        </a>
      </div>

      <!-- モバイルメニューボタン -->
      <button class="md:hidden p-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </div>
</nav>
```

## まとめ

- ボタン、入力、カードなどの基本コンポーネント
- ホバー、フォーカス、disabled などの状態スタイル
- group を使った親子連動のエフェクト
- アクセシビリティを考慮した実装

## 確認問題

1. ローディング状態のボタンを作成してください
2. バリデーションエラー表示付きのフォームを作成してください
3. ホバーエフェクト付きのカードを作成してください

## 次の章へ

[16 - Best-Practices](./16-Best-Practices.md) では、Tailwind CSS のベストプラクティスを総括します。
