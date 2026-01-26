# 10 - Dark Mode（ダークモード）

## この章で学ぶこと

- ダークモードの設定方法
- dark: プレフィックスの使い方
- システム設定との連携
- 手動切り替えの実装

## ダークモードの設定

### 設定ファイル

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class", // または 'media'
  // ...
};
```

### 2 つのモード

1. **class**: HTML に `dark` クラスを追加して切り替え（手動制御）
2. **media**: システムの設定（prefers-color-scheme）に従う

## class モード

### HTML に dark クラスを追加

```html
<!-- ライトモード -->
<html>
  <body class="bg-white text-gray-900">...</body>
</html>

<!-- ダークモード -->
<html class="dark">
  <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
    ...
  </body>
</html>
```

### 基本的な使い方

```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-6 rounded-lg">
  <h2 class="text-xl font-bold">タイトル</h2>
  <p class="mt-2 text-gray-600 dark:text-gray-300">説明文</p>
</div>
```

## media モード

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "media", // システム設定に従う
};
```

```html
<!-- システム設定に応じて自動切り替え -->
<div class="bg-white dark:bg-gray-800">
  自動でダークモードに対応
</div>
```

## 実装パターン

### 基本的なカード

```html
<div
  class="
    bg-white dark:bg-gray-800
    border border-gray-200 dark:border-gray-700
    rounded-lg shadow dark:shadow-gray-900/30
    p-6
  "
>
  <h3 class="text-gray-900 dark:text-white font-semibold">タイトル</h3>
  <p class="mt-2 text-gray-600 dark:text-gray-400">説明文</p>
</div>
```

### ボタン

```html
<!-- Primary -->
<button
  class="
    px-4 py-2 rounded-lg
    bg-blue-500 dark:bg-blue-600
    hover:bg-blue-600 dark:hover:bg-blue-700
    text-white
  "
>
  ボタン
</button>

<!-- Secondary -->
<button
  class="
    px-4 py-2 rounded-lg
    bg-gray-200 dark:bg-gray-700
    hover:bg-gray-300 dark:hover:bg-gray-600
    text-gray-800 dark:text-gray-200
  "
>
  ボタン
</button>

<!-- Outline -->
<button
  class="
    px-4 py-2 rounded-lg
    border border-gray-300 dark:border-gray-600
    hover:bg-gray-100 dark:hover:bg-gray-800
    text-gray-700 dark:text-gray-300
  "
>
  ボタン
</button>
```

### 入力フィールド

```html
<input
  type="text"
  class="
    w-full px-4 py-2 rounded-lg
    bg-white dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2
    focus:ring-blue-500 dark:focus:ring-blue-400
  "
  placeholder="入力してください"
/>
```

### テーブル

```html
<table class="w-full">
  <thead class="bg-gray-50 dark:bg-gray-800">
    <tr>
      <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">名前</th>
      <th class="px-4 py-3 text-left text-gray-700 dark:text-gray-300">
        メール
      </th>
    </tr>
  </thead>
  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
    <tr class="bg-white dark:bg-gray-900">
      <td class="px-4 py-3 text-gray-900 dark:text-white">田中太郎</td>
      <td class="px-4 py-3 text-gray-600 dark:text-gray-400">
        tanaka@example.com
      </td>
    </tr>
  </tbody>
</table>
```

## JavaScript での切り替え

### React での実装

```tsx
// hooks/useDarkMode.ts
import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // ローカルストレージから設定を読み込み
    const stored = localStorage.getItem("darkMode");
    if (stored) {
      setIsDark(stored === "true");
    } else {
      // システム設定をデフォルトとして使用
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(isDark));
  }, [isDark]);

  return { isDark, setIsDark, toggle: () => setIsDark(!isDark) };
}
```

### トグルボタン

```tsx
// components/DarkModeToggle.tsx
import { useDarkMode } from "@/hooks/useDarkMode";

export function DarkModeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
```

### 3 状態の切り替え（ライト/ダーク/システム）

```tsx
type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // system
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
```

## カラーパレットの設計

### ダークモード用のカスタムカラー

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // セマンティックカラー
        surface: {
          DEFAULT: "#ffffff",
          dark: "#1f2937",
        },
        "on-surface": {
          DEFAULT: "#1f2937",
          dark: "#f9fafb",
        },
      },
    },
  },
};
```

### CSS 変数を使った方法

```css
/* globals.css */
:root {
  --color-bg: 255 255 255;
  --color-text: 17 24 39;
}

.dark {
  --color-bg: 17 24 39;
  --color-text: 249 250 251;
}
```

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-bg) / <alpha-value>)",
        foreground: "rgb(var(--color-text) / <alpha-value>)",
      },
    },
  },
};
```

```html
<div class="bg-background text-foreground">自動的にダークモード対応</div>
```

## FOUC（Flash of Unstyled Content）の防止

```html
<!-- ページ読み込み時のちらつきを防ぐ -->
<html>
  <head>
    <script>
      // 同期的に実行してちらつきを防ぐ
      if (
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        document.documentElement.classList.add("dark");
      }
    </script>
  </head>
</html>
```

## まとめ

- `darkMode: 'class'` で手動制御、`'media'` でシステム連動
- `dark:` プレフィックスでダークモード時のスタイルを指定
- JavaScript で `<html class="dark">` を切り替え
- ローカルストレージで設定を保存
- FOUC を防ぐため、head 内で同期的に初期化

## 確認問題

1. class モードと media モードの違いを説明してください
2. ダークモードトグルボタンを実装してください
3. FOUC を防ぐ方法を説明してください

## 次の章へ

[11 - States](./11-States.md) では、ホバーやフォーカスなどの状態スタイルを学びます。
