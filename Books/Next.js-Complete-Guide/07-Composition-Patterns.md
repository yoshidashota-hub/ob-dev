# 07 - Composition Patterns

## 概要

この章では、Server Components と Client Components を効果的に組み合わせるパターンを学びます。適切な構成パターンを使うことで、パフォーマンスとユーザー体験を最大化できます。

## 基本原則

### コンポーネントの境界

```plaintext
Server Component（デフォルト）
├── データフェッチ
├── バックエンドアクセス
├── 機密情報の処理
└── 静的な UI

Client Component（"use client"）
├── インタラクティブな UI
├── 状態管理
├── イベントハンドリング
└── ブラウザ API
```

### 黄金ルール

1. **可能な限り Server Component を使う**
2. **Client Component は必要な部分だけに限定**
3. **Client Component は葉に近い位置に配置**

## パターン 1: Server Component から Client Component への Props 渡し

### 基本パターン

```typescript
// app/page.tsx (Server Component)
import { LikeButton } from "@/components/LikeButton";

async function getPost(id: string) {
  const res = await fetch(`https://api.example.com/posts/${id}`);
  return res.json();
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      {/* Server から Client へデータを渡す */}
      <LikeButton postId={post.id} initialLikes={post.likes} />
    </article>
  );
}
```

```typescript
// components/LikeButton.tsx (Client Component)
"use client";

import { useState } from "react";

interface Props {
  postId: string;
  initialLikes: number;
}

export function LikeButton({ postId, initialLikes }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);

    await fetch(`/api/posts/${postId}/like`, {
      method: isLiked ? "DELETE" : "POST",
    });
  };

  return (
    <button onClick={handleLike} className="flex items-center gap-2">
      <span>{isLiked ? "❤️" : "🤍"}</span>
      <span>{likes}</span>
    </button>
  );
}
```

### シリアライズ可能なデータのみ

Server から Client への Props は**シリアライズ可能**である必要があります:

```typescript
// ✅ OK - プリミティブ値
<ClientComponent
  text="Hello"
  count={42}
  isActive={true}
  items={["a", "b", "c"]}
  user={{ id: 1, name: "John" }}
/>

// ❌ NG - 関数は渡せない
<ClientComponent onClick={() => console.log("click")} />

// ❌ NG - Date オブジェクトはそのまま渡せない
<ClientComponent date={new Date()} />

// ✅ OK - 文字列に変換
<ClientComponent date={new Date().toISOString()} />
```

## パターン 2: children を使った構成

### Server Component を Client Component 内に配置

```typescript
// app/page.tsx (Server Component)
import { Modal } from "@/components/Modal";
import { UserProfile } from "@/components/UserProfile";

export default async function Page() {
  return (
    <Modal>
      {/* Server Component を children として渡す */}
      <UserProfile />
    </Modal>
  );
}
```

```typescript
// components/Modal.tsx (Client Component)
"use client";

import { useState } from "react";

export function Modal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            {/* children は Server Component のままレンダリング */}
            {children}
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

```typescript
// components/UserProfile.tsx (Server Component)
async function getUser() {
  const res = await fetch("https://api.example.com/user");
  return res.json();
}

export async function UserProfile() {
  const user = await getUser();

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### なぜこれが動くのか

```typescript
// Client Component は children を「スロット」として扱う
// children の中身はサーバーでレンダリング済み

// 概念的には以下のようになる:
<ClientComponent>
  <PreRenderedServerContent />
</ClientComponent>
```

## パターン 3: Render Props パターン

### Server Component を動的に配置

```typescript
// components/Tabs.tsx (Client Component)
"use client";

import { useState, ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 ${
              activeTab === tab.id ? "border-b-2 border-blue-500" : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
```

```typescript
// app/page.tsx (Server Component)
import { Tabs } from "@/components/Tabs";
import { Overview } from "@/components/Overview";
import { Analytics } from "@/components/Analytics";
import { Settings } from "@/components/Settings";

export default function DashboardPage() {
  return (
    <Tabs
      tabs={[
        {
          id: "overview",
          label: "Overview",
          content: <Overview />, // Server Component
        },
        {
          id: "analytics",
          label: "Analytics",
          content: <Analytics />, // Server Component
        },
        {
          id: "settings",
          label: "Settings",
          content: <Settings />, // Server Component
        },
      ]}
    />
  );
}
```

## パターン 4: Context Provider パターン

### Provider は Client Component

```typescript
// providers/ThemeProvider.tsx (Client Component)
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

```typescript
// app/layout.tsx (Server Component)
import { ThemeProvider } from "@/providers/ThemeProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ThemeProvider>
          {/* children は Server Component のまま */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 複数の Provider

```typescript
// providers/index.tsx (Client Component)
"use client";

import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

## パターン 5: インタラクティブなラッパー

### Server Component を包む小さな Client Component

```typescript
// components/ProductCard.tsx (Server Component)
import { AddToCartButton } from "./AddToCartButton";

async function getProduct(id: string) {
  const res = await fetch(`https://api.example.com/products/${id}`);
  return res.json();
}

export async function ProductCard({ productId }: { productId: string }) {
  const product = await getProduct(productId);

  return (
    <div className="border rounded-lg p-4">
      <img src={product.image} alt={product.name} className="w-full" />
      <h3 className="text-lg font-bold">{product.name}</h3>
      <p className="text-gray-600">${product.price}</p>
      {/* 小さな Client Component */}
      <AddToCartButton productId={product.id} />
    </div>
  );
}
```

```typescript
// components/AddToCartButton.tsx (Client Component)
"use client";

import { useState } from "react";

export function AddToCartButton({ productId }: { productId: string }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await fetch("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
    setIsAdding(false);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className="w-full bg-blue-500 text-white py-2 rounded mt-4"
    >
      {isAdding ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

## パターン 6: 条件付きレンダリング

### Server で条件分岐

```typescript
// app/dashboard/page.tsx (Server Component)
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { UserDashboard } from "@/components/UserDashboard";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Server で条件分岐
  if (session.user.role === "admin") {
    return <AdminDashboard user={session.user} />;
  }

  return <UserDashboard user={session.user} />;
}
```

### Client で条件分岐（インタラクティブ）

```typescript
// components/ToggleContent.tsx (Client Component)
"use client";

import { useState, ReactNode } from "react";

interface Props {
  showContent: ReactNode;
  hideContent: ReactNode;
}

export function ToggleContent({ showContent, hideContent }: Props) {
  const [isShown, setIsShown] = useState(false);

  return (
    <div>
      <button onClick={() => setIsShown(!isShown)}>
        {isShown ? "Hide" : "Show"}
      </button>
      {isShown ? showContent : hideContent}
    </div>
  );
}
```

## パターン 7: データの受け渡し最適化

### 必要なデータのみを渡す

```typescript
// ❌ 悪い例 - 全てのデータを渡す
// app/page.tsx
export default async function Page() {
  const user = await getFullUserData(); // 大量のデータ

  return <UserCard user={user} />; // 全部渡す
}

// ✅ 良い例 - 必要なデータのみを渡す
// app/page.tsx
export default async function Page() {
  const user = await getFullUserData();

  return (
    <UserCard
      name={user.name}
      avatar={user.avatar}
      // 必要なフィールドのみ
    />
  );
}
```

### Server Component で加工

```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  const rawData = await fetchLargeDataset();

  // サーバーでデータを加工
  const processedData = rawData.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.content.substring(0, 100),
  }));

  return <DataList data={processedData} />;
}
```

## パターン 8: フォームの構成

### Server Actions との組み合わせ

```typescript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await db.post.create({
    data: { title, content },
  });

  revalidatePath("/posts");
}
```

```typescript
// components/PostForm.tsx (Client Component)
"use client";

import { useActionState } from "react";
import { createPost } from "@/app/actions";

export function PostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <input
          name="title"
          placeholder="Title"
          required
          className="w-full border p-2"
        />
      </div>
      <div>
        <textarea
          name="content"
          placeholder="Content"
          required
          className="w-full border p-2"
          rows={5}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2"
      >
        {isPending ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
```

## パターン 9: Suspense との組み合わせ

### 段階的なローディング

```typescript
// app/page.tsx (Server Component)
import { Suspense } from "react";
import { ProductList } from "@/components/ProductList";
import { RecommendedProducts } from "@/components/RecommendedProducts";
import { Reviews } from "@/components/Reviews";

export default function ProductPage() {
  return (
    <div>
      {/* メインコンテンツを先に表示 */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductList />
      </Suspense>

      {/* 推奨商品は後から */}
      <Suspense fallback={<div>Loading recommendations...</div>}>
        <RecommendedProducts />
      </Suspense>

      {/* レビューは最後 */}
      <Suspense fallback={<div>Loading reviews...</div>}>
        <Reviews />
      </Suspense>
    </div>
  );
}
```

## アンチパターン

### ❌ 不必要な Client Component

```typescript
// ❌ 悪い例 - インタラクションがないのに Client Component
"use client";

export function StaticContent() {
  return (
    <div>
      <h1>About Us</h1>
      <p>We are a company...</p>
    </div>
  );
}

// ✅ 良い例 - Server Component で十分
export function StaticContent() {
  return (
    <div>
      <h1>About Us</h1>
      <p>We are a company...</p>
    </div>
  );
}
```

### ❌ Client Component でのデータフェッチ

```typescript
// ❌ 悪い例 - Client でフェッチ
"use client";

import { useEffect, useState } from "react";

export function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers);
  }, []);

  return <ul>{/* ... */}</ul>;
}

// ✅ 良い例 - Server でフェッチ
async function getUsers() {
  const res = await fetch("https://api.example.com/users");
  return res.json();
}

export async function UserList() {
  const users = await getUsers();

  return <ul>{/* ... */}</ul>;
}
```

### ❌ 大きな Client Component

```typescript
// ❌ 悪い例 - 全体が Client Component
"use client";

export function ProductPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetchProduct(productId).then(setProduct);
  }, [productId]);

  return (
    <div>
      <Header />
      <ProductDetails product={product} />
      <AddToCartButton productId={productId} />
      <Reviews productId={productId} />
      <Footer />
    </div>
  );
}

// ✅ 良い例 - 必要な部分だけ Client Component
// Server Component
export async function ProductPage({ productId }: { productId: string }) {
  const product = await fetchProduct(productId);

  return (
    <div>
      <Header />
      <ProductDetails product={product} />
      <AddToCartButton productId={productId} /> {/* Client */}
      <Reviews productId={productId} />
      <Footer />
    </div>
  );
}
```

## まとめ

- **children パターン**: Server Component を Client Component の子として渡す
- **Props パターン**: シリアライズ可能なデータのみを渡す
- **Provider パターン**: Context Provider は Client Component
- **葉のパターン**: Client Component はツリーの葉に近い位置に配置
- **Suspense パターン**: 段階的なローディングで UX 向上

## ベストプラクティス

1. **デフォルトは Server Component**
2. **"use client" は必要な場所だけ**
3. **Client Component は小さく保つ**
4. **データフェッチは Server で**
5. **children を活用して構成**

## 演習問題

1. Modal コンポーネントで Server Component を表示してください
2. Tabs コンポーネントで複数の Server Component を切り替えてください
3. Context Provider を使ったテーマ切り替えを実装してください
4. 製品一覧ページで適切なコンポーネント分割をしてください

## 次のステップ

次の章では、データフェッチングの詳細について学びます。

⬅️ 前へ: [06-Client-Components.md](./06-Client-Components.md)
➡️ 次へ: [08-Data-Fetching.md](./08-Data-Fetching.md)
