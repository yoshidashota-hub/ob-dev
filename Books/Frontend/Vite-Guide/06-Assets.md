# 06 - Assets（静的アセット）

## この章で学ぶこと

- 静的アセットのインポート
- public ディレクトリの使い方
- 画像の最適化
- 特殊なインポート方法

## 静的アセットのインポート

### 基本的なインポート

```typescript
// 画像
import logo from "./assets/logo.png";
// → /assets/logo.abc123.png（ハッシュ付きURL）

// CSS
import "./styles/global.css";

// JSON
import data from "./data.json";

function App() {
  return <img src={logo} alt="Logo" />;
}
```

### ビルド時の処理

```
src/assets/logo.png
    ↓
dist/assets/logo.abc123.png（ハッシュ付き）
```

- 4KB 未満のファイルは base64 インライン化
- ファイル名にハッシュが付与（キャッシュ最適化）

## URL としてのインポート

### ?url サフィックス

```typescript
// URL文字列として取得
import logoUrl from "./assets/logo.png?url";
console.log(logoUrl); // "/assets/logo.abc123.png"
```

### ?raw サフィックス

```typescript
// ファイル内容を文字列として取得
import shaderCode from "./shaders/fragment.glsl?raw";
console.log(shaderCode); // シェーダーコードの文字列
```

### ?inline サフィックス

```typescript
// 強制的にインライン化
import inlineImage from "./assets/small.png?inline";
// → "data:image/png;base64,..."
```

## public ディレクトリ

### 使い方

```
public/
├── favicon.ico
├── robots.txt
└── images/
    └── og-image.png
```

```html
<!-- 絶対パスでアクセス -->
<link rel="icon" href="/favicon.ico" />
<img src="/images/og-image.png" />
```

### 特徴

- ビルド時にそのまま dist にコピー
- ファイル名にハッシュが付かない
- 動的に参照が必要な場合に使用

### import.meta.url との組み合わせ

```typescript
// public ディレクトリのファイルを参照
const imageUrl = new URL("/images/photo.jpg", import.meta.url).href;
```

## 動的インポート

### Glob インポート

```typescript
// 複数ファイルを一括インポート
const modules = import.meta.glob("./modules/*.ts");
// {
//   './modules/a.ts': () => import('./modules/a.ts'),
//   './modules/b.ts': () => import('./modules/b.ts'),
// }

// 使用
for (const path in modules) {
  const module = await modules[path]();
  console.log(module);
}
```

### Eager インポート

```typescript
// 即座に読み込み
const modules = import.meta.glob("./modules/*.ts", { eager: true });
// {
//   './modules/a.ts': Module { default: ... },
//   './modules/b.ts': Module { default: ... },
// }
```

### 画像の Glob インポート

```typescript
// 画像を一括インポート
const images = import.meta.glob<{ default: string }>("./assets/images/*.png", {
  eager: true,
  import: "default",
});

// 使用
Object.entries(images).map(([path, url]) => <img key={path} src={url} />);
```

## CSS 内でのアセット参照

### url() の使用

```css
.hero {
  /* src/assets からの相対パス */
  background-image: url("./assets/hero.jpg");
}

/* public ディレクトリ */
.logo {
  background-image: url("/images/logo.png");
}
```

### CSS Modules

```css
/* styles.module.css */
.container {
  composes: base from "./base.module.css";
}
```

## 画像の最適化

### 設定

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // インライン化の閾値（バイト）
    assetsInlineLimit: 4096, // 4KB

    // アセット出力ディレクトリ
    assetsDir: "assets",
  },
});
```

### 画像最適化プラグイン

```bash
npm install -D vite-plugin-image-optimizer
```

```typescript
// vite.config.ts
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
  plugins: [
    ViteImageOptimizer({
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      webp: {
        quality: 80,
      },
    }),
  ],
});
```

## Web Workers

### 基本的な使い方

```typescript
// worker.ts
self.onmessage = (e) => {
  const result = heavyCalculation(e.data);
  self.postMessage(result);
};

// main.ts
import Worker from "./worker?worker";

const worker = new Worker();
worker.postMessage(data);
worker.onmessage = (e) => {
  console.log(e.data);
};
```

### SharedWorker

```typescript
import SharedWorker from "./shared-worker?sharedworker";

const sharedWorker = new SharedWorker();
```

## WASM

```typescript
// WebAssembly
import init from "./pkg/my_wasm.wasm?init";

const instance = await init();
instance.exports.myFunction();
```

## SVG の取り扱い

### コンポーネントとしてインポート

```bash
npm install -D vite-plugin-svgr
```

```typescript
// vite.config.ts
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [svgr()],
});
```

```typescript
// SVG をコンポーネントとして使用
import { ReactComponent as Logo } from "./logo.svg";

function App() {
  return <Logo className="logo" />;
}
```

## まとめ

- `import` で自動的に URL が解決される
- `public/` はそのままコピー、`src/assets/` は処理される
- `?url`, `?raw`, `?inline` で読み込み方法を指定
- `import.meta.glob` で複数ファイルを一括インポート
- Web Workers, WASM も対応

## 確認問題

1. public と src/assets の違いを説明してください
2. Glob インポートの使い方を説明してください
3. 画像を最適化する方法を説明してください

## 次の章へ

[07 - Build](./07-Build.md) では、プロダクションビルドについて学びます。
