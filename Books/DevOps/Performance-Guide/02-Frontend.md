# 第2章: フロントエンド最適化

## バンドルサイズ削減

### 動的インポート

```typescript
// ❌ 静的インポート（常にバンドルに含まれる）
import { Chart } from "chart.js";
import { DatePicker } from "react-datepicker";

// ✅ 動的インポート（必要時のみロード）
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("chart.js").then((mod) => mod.Chart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-gray-200" />,
});

const DatePicker = dynamic(() => import("react-datepicker"), {
  ssr: false,
});
```

### Tree Shaking

```typescript
// ❌ 全体インポート
import _ from "lodash";
const result = _.debounce(fn, 300);

// ✅ 個別インポート
import debounce from "lodash/debounce";
const result = debounce(fn, 300);

// ❌ 名前付きインポートでも barrel file 経由は注意
import { Button } from "@/components";

// ✅ 直接インポート
import { Button } from "@/components/Button";
```

### バンドル分割

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ["@mui/material", "lodash", "date-fns"],
  },
};
```

## 画像最適化

### Next.js Image

```typescript
import Image from "next/image";

// ✅ 自動最適化
export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      // 優先度の高い画像は priority
      priority={false}
      // 遅延読み込み
      loading="lazy"
      // レスポンシブ対応
      sizes="(max-width: 768px) 100vw, 400px"
      // プレースホルダー
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."
    />
  );
}

// LCP 対象の画像は priority を設定
export function HeroImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority // LCP 改善
    />
  );
}
```

### 画像フォーマット

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};
```

## レンダリング最適化

### React.memo

```typescript
import { memo, useMemo, useCallback } from "react";

interface ItemProps {
  id: string;
  name: string;
  onSelect: (id: string) => void;
}

// メモ化されたコンポーネント
export const Item = memo(function Item({ id, name, onSelect }: ItemProps) {
  return (
    <div onClick={() => onSelect(id)}>
      {name}
    </div>
  );
});

// 親コンポーネント
export function ItemList({ items }: { items: Item[] }) {
  // コールバックをメモ化
  const handleSelect = useCallback((id: string) => {
    console.log("Selected:", id);
  }, []);

  // 計算結果をメモ化
  const sortedItems = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  return (
    <div>
      {sortedItems.map((item) => (
        <Item key={item.id} {...item} onSelect={handleSelect} />
      ))}
    </div>
  );
}
```

### 仮想化（大量リスト）

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

export function VirtualList({ items }: { items: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // 各アイテムの高さ
    overscan: 5, // 余分にレンダリングする数
  });

  return (
    <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## レイアウトシフト防止（CLS）

### 画像のサイズ指定

```typescript
// ❌ サイズ未指定（CLSの原因）
<img src="/photo.jpg" alt="Photo" />

// ✅ サイズを明示
<img src="/photo.jpg" alt="Photo" width={400} height={300} />

// ✅ aspect-ratio で対応
<div className="aspect-video">
  <img src="/photo.jpg" alt="Photo" className="w-full h-full object-cover" />
</div>
```

### フォント読み込み

```typescript
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // FOUT を許容
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### スケルトン UI

```typescript
// components/Skeleton.tsx
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 aspect-square rounded-lg" />
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

// 使用例
export function ProductGrid() {
  const { data, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Server Components

```typescript
// Server Component（デフォルト）
// データフェッチはサーバーで実行
export default async function ProductPage({ params }: { params: { id: string } }) {
  // サーバーで実行（クライアントにバンドルされない）
  const product = await getProduct(params.id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* Client Component は必要な部分のみ */}
      <AddToCartButton productId={product.id} />
    </div>
  );
}

// Client Component（インタラクティブな部分のみ）
"use client";

export function AddToCartButton({ productId }: { productId: string }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = async () => {
    setIsAdding(true);
    await addToCart(productId);
    setIsAdding(false);
  };

  return (
    <button onClick={handleClick} disabled={isAdding}>
      {isAdding ? "追加中..." : "カートに追加"}
    </button>
  );
}
```

## プリフェッチ

```typescript
import Link from "next/link";

// 自動プリフェッチ（ビューポート内のリンク）
<Link href="/products">商品一覧</Link>

// プリフェッチ無効
<Link href="/products" prefetch={false}>商品一覧</Link>

// 手動プリフェッチ
import { useRouter } from "next/navigation";

function ProductCard({ product }) {
  const router = useRouter();

  return (
    <div
      onMouseEnter={() => router.prefetch(`/products/${product.id}`)}
    >
      {product.name}
    </div>
  );
}
```

## 次のステップ

次章では、バックエンドの最適化手法を学びます。
