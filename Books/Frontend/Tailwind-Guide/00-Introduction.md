# 00 - Introduction（Tailwind CSS とは）

## この章で学ぶこと

- Tailwind CSS の概要
- ユーティリティファーストの考え方
- 従来の CSS との違い
- Tailwind CSS を選ぶ理由

## Tailwind CSS とは

Tailwind CSS は「ユーティリティファースト」の CSS フレームワークです。Bootstrap のような既成のコンポーネントを提供するのではなく、低レベルのユーティリティクラスを提供します。

### 従来の CSS

```html
<!-- 従来のアプローチ -->
<style>
  .card {
    background-color: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
</style>

<div class="card">
  <h2 class="card-title">タイトル</h2>
</div>
```

### Tailwind CSS

```html
<!-- Tailwind のアプローチ -->
<div class="bg-white rounded-lg p-6 shadow-md">
  <h2 class="text-xl font-semibold text-gray-800">タイトル</h2>
</div>
```

## ユーティリティファーストの利点

### 1. 命名の悩みがなくなる

```html
<!-- クラス名を考える必要がない -->
<div class="flex items-center justify-between p-4">
  <span class="text-lg font-medium">ユーザー名</span>
  <button class="px-4 py-2 bg-blue-500 text-white rounded">フォロー</button>
</div>
```

### 2. CSS ファイルが肥大化しない

Tailwind は使用されているクラスのみをビルドに含めます。

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  // 使用されているクラスのみが出力される
};
```

### 3. 変更が安全

```html
<!-- このコンポーネントのスタイルを変更しても -->
<!-- 他のコンポーネントに影響しない -->
<div class="p-4 bg-blue-100">
  <!-- p-6 に変更しても他に影響なし -->
</div>
```

### 4. デザインシステムとの親和性

```javascript
// 統一されたスペーシング、カラー、タイポグラフィ
// tailwind.config.js で一元管理
module.exports = {
  theme: {
    colors: {
      primary: "#3B82F6",
      secondary: "#10B981",
    },
    spacing: {
      sm: "8px",
      md: "16px",
      lg: "24px",
    },
  },
};
```

## よくある誤解

### 「HTML が汚くなる」

```html
<!-- 確かにクラスは増えるが... -->
<button
  class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
>
  ボタン
</button>
```

しかし：

- コンポーネント化すれば HTML は隠蔽される
- CSS ファイルを往復する必要がない
- スタイルが一目でわかる

### 「インラインスタイルと同じ」

違います：

```html
<!-- インラインスタイル：レスポンシブ不可、ホバー不可 -->
<div style="padding: 16px; background: blue;"></div>

<!-- Tailwind：レスポンシブ、状態管理が可能 -->
<div class="p-4 bg-blue-500 hover:bg-blue-600 md:p-6"></div>
```

## Tailwind CSS を選ぶ理由

| 特徴                 | Tailwind CSS | 従来の CSS | CSS-in-JS |
| -------------------- | ------------ | ---------- | --------- |
| 学習コスト           | 中           | 低         | 高        |
| 開発速度             | 高           | 中         | 中        |
| バンドルサイズ       | 小           | 大         | 中        |
| デザインの一貫性     | 高           | 低         | 中        |
| ランタイムコスト     | なし         | なし       | あり      |
| IDE サポート         | 良好         | 良好       | 良好      |
| レスポンシブ対応     | 容易         | 手動       | 手動      |
| ダークモード対応     | 容易         | 手動       | 手動      |
| コンポーネント再利用 | 容易         | 困難       | 容易      |

## まとめ

- Tailwind CSS はユーティリティファーストの CSS フレームワーク
- 低レベルのクラスを組み合わせてスタイリング
- CSS ファイルの肥大化を防ぎ、保守性が高い
- レスポンシブ、ダークモード対応が容易

## 次の章へ

[01 - Setup](./01-Setup.md) では、Tailwind CSS のセットアップ方法を学びます。
