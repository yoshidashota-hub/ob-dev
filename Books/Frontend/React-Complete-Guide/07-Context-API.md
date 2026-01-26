# 07 - Context API

## この章で学ぶこと

- Context API の基本概念
- Provider パターンの実装
- Context の分割とパフォーマンス最適化
- よくある使用パターン
- Context vs Props のトレードオフ

## Context API とは

Context API は、コンポーネントツリー全体でデータを共有するための仕組みです。Props のバケツリレー（Prop Drilling）を避けることができます。

### Prop Drilling の問題

```tsx
// ❌ Props を何層も受け渡す必要がある
function App() {
  const [user, setUser] = useState({ name: "Alice" });
  return <Header user={user} />;
}

function Header({ user }: { user: User }) {
  return <Navigation user={user} />;
}

function Navigation({ user }: { user: User }) {
  return <UserMenu user={user} />;
}

function UserMenu({ user }: { user: User }) {
  return <span>{user.name}</span>;
}
```

### Context による解決

```tsx
// ✅ Context で直接アクセス
const UserContext = createContext<User | null>(null);

function App() {
  const [user, setUser] = useState({ name: "Alice" });
  return (
    <UserContext.Provider value={user}>
      <Header />
    </UserContext.Provider>
  );
}

function Header() {
  return <Navigation />;
}

function Navigation() {
  return <UserMenu />;
}

function UserMenu() {
  const user = useContext(UserContext);
  return <span>{user?.name}</span>;
}
```

## Context の基本的な使い方

### 1. Context の作成

```tsx
import { createContext } from "react";

// 型定義
type ThemeContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

// Context の作成（初期値は null または undefined）
const ThemeContext = createContext<ThemeContextType | null>(null);
```

### 2. Provider の実装

```tsx
import { createContext, useState, ReactNode } from "react";

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
```

### 3. カスタムフックでの使用

```tsx
function useTheme() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

// 使用例
function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### 4. アプリケーションへの適用

```tsx
function App() {
  return (
    <ThemeProvider>
      <Layout>
        <ThemeToggleButton />
      </Layout>
    </ThemeProvider>
  );
}
```

## Context の設計パターン

### パターン 1: 状態と更新関数を分離

```tsx
import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";

// State の型
type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};

// Action の型
type AuthAction = { type: "LOGIN"; payload: User } | { type: "LOGOUT" };

// 2つの Context を作成
const AuthStateContext = createContext<AuthState | null>(null);
const AuthDispatchContext = createContext<Dispatch<AuthAction> | null>(null);

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return { user: action.payload, isAuthenticated: true };
    case "LOGOUT":
      return { user: null, isAuthenticated: false };
    default:
      return state;
  }
}

// Provider
function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
  });

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>{children}</AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}

// カスタムフック
function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === null) {
    throw new Error("useAuthState must be used within AuthProvider");
  }
  return context;
}

function useAuthDispatch() {
  const context = useContext(AuthDispatchContext);
  if (context === null) {
    throw new Error("useAuthDispatch must be used within AuthProvider");
  }
  return context;
}

// 使用例: State のみ必要な場合
function UserAvatar() {
  const { user } = useAuthState(); // dispatch の変更で再レンダリングされない
  return user ? <img src={user.avatarUrl} alt={user.name} /> : null;
}

// 使用例: Dispatch のみ必要な場合
function LogoutButton() {
  const dispatch = useAuthDispatch(); // state の変更で再レンダリングされない
  return <button onClick={() => dispatch({ type: "LOGOUT" })}>Logout</button>;
}
```

### パターン 2: アクションヘルパー付き Context

```tsx
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // 派生状態
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, total, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
```

### パターン 3: Compound Components

```tsx
import { createContext, useContext, useState, ReactNode } from "react";

// Accordion Context
type AccordionContextType = {
  openItems: string[];
  toggleItem: (id: string) => void;
};

const AccordionContext = createContext<AccordionContextType | null>(null);

// Accordion Item Context
type AccordionItemContextType = {
  isOpen: boolean;
  toggle: () => void;
};

const AccordionItemContext = createContext<AccordionItemContextType | null>(null);

// Accordion Root
function Accordion({ children }: { children: ReactNode }) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return <AccordionContext.Provider value={{ openItems, toggleItem }}>{children}</AccordionContext.Provider>;
}

// Accordion Item
function AccordionItem({ id, children }: { id: string; children: ReactNode }) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("AccordionItem must be within Accordion");

  const isOpen = context.openItems.includes(id);
  const toggle = () => context.toggleItem(id);

  return (
    <AccordionItemContext.Provider value={{ isOpen, toggle }}>
      <div className="accordion-item">{children}</div>
    </AccordionItemContext.Provider>
  );
}

// Accordion Header
function AccordionHeader({ children }: { children: ReactNode }) {
  const context = useContext(AccordionItemContext);
  if (!context) throw new Error("AccordionHeader must be within AccordionItem");

  return (
    <button onClick={context.toggle} className="accordion-header">
      {children}
      <span>{context.isOpen ? "−" : "+"}</span>
    </button>
  );
}

// Accordion Content
function AccordionContent({ children }: { children: ReactNode }) {
  const context = useContext(AccordionItemContext);
  if (!context) throw new Error("AccordionContent must be within AccordionItem");

  if (!context.isOpen) return null;

  return <div className="accordion-content">{children}</div>;
}

// 名前空間でエクスポート
Accordion.Item = AccordionItem;
Accordion.Header = AccordionHeader;
Accordion.Content = AccordionContent;

// 使用例
function FAQ() {
  return (
    <Accordion>
      <Accordion.Item id="1">
        <Accordion.Header>What is React?</Accordion.Header>
        <Accordion.Content>React is a JavaScript library for building UIs.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item id="2">
        <Accordion.Header>What is Context?</Accordion.Header>
        <Accordion.Content>Context provides a way to share data globally.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
```

## Context のパフォーマンス最適化

### 問題: 不要な再レンダリング

```tsx
// ❌ value が毎回新しいオブジェクトになる
function BadProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  // 毎回新しいオブジェクトが作られる
  return (
    <MyContext.Provider value={{ count, setCount }}>
      {children}
    </MyContext.Provider>
  );
}
```

### 解決策 1: useMemo で value をメモ化

```tsx
function GoodProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  // value をメモ化
  const value = useMemo(() => ({ count, setCount }), [count]);

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}
```

### 解決策 2: Context を分割

```tsx
// State と Actions を別の Context に分ける
const CountStateContext = createContext<number>(0);
const CountActionsContext = createContext<{
  increment: () => void;
  decrement: () => void;
} | null>(null);

function CountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  // Actions は変わらないのでメモ化
  const actions = useMemo(
    () => ({
      increment: () => setCount((c) => c + 1),
      decrement: () => setCount((c) => c - 1),
    }),
    []
  );

  return (
    <CountStateContext.Provider value={count}>
      <CountActionsContext.Provider value={actions}>{children}</CountActionsContext.Provider>
    </CountStateContext.Provider>
  );
}

// State のみ使用（Actions の変更で再レンダリングされない）
function CountDisplay() {
  const count = useContext(CountStateContext);
  return <p>Count: {count}</p>;
}

// Actions のみ使用（State の変更で再レンダリングされない）
function CountButtons() {
  const actions = useContext(CountActionsContext);
  return (
    <>
      <button onClick={actions?.increment}>+</button>
      <button onClick={actions?.decrement}>-</button>
    </>
  );
}
```

### 解決策 3: React.memo との組み合わせ

```tsx
// Context を使用しないコンポーネントをメモ化
const Header = memo(function Header() {
  return <header>Header (won't re-render)</header>;
});

function App() {
  const [count, setCount] = useState(0);

  return (
    <CountContext.Provider value={count}>
      <Header /> {/* count が変わっても再レンダリングされない */}
      <CountDisplay />
    </CountContext.Provider>
  );
}
```

## Context vs Props の使い分け

### Props を使うべき場合

- データが 1〜2 層のみ伝播する
- コンポーネントの再利用性を保ちたい
- データフローを明確にしたい

### Context を使うべき場合

- データが多くの層に渡って必要
- グローバルな設定（テーマ、言語、認証）
- 頻繁に更新されないデータ

```tsx
// ✅ Props が適切
function UserCard({ user }: { user: User }) {
  return (
    <div>
      <Avatar user={user} />
      <UserName user={user} />
    </div>
  );
}

// ✅ Context が適切
function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
```

## 実践: マルチテーマ対応アプリケーション

```tsx
import { createContext, useContext, useState, useMemo, ReactNode } from "react";

// 型定義
type Theme = {
  colors: {
    primary: string;
    background: string;
    text: string;
  };
  spacing: {
    sm: string;
    md: string;
    lg: string;
  };
};

type ThemeMode = "light" | "dark";

type ThemeContextType = {
  mode: ThemeMode;
  theme: Theme;
  toggleMode: () => void;
};

// テーマ定義
const themes: Record<ThemeMode, Theme> = {
  light: {
    colors: {
      primary: "#007bff",
      background: "#ffffff",
      text: "#333333",
    },
    spacing: { sm: "8px", md: "16px", lg: "24px" },
  },
  dark: {
    colors: {
      primary: "#4dabf7",
      background: "#1a1a1a",
      text: "#ffffff",
    },
    spacing: { sm: "8px", md: "16px", lg: "24px" },
  },
};

// Context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Provider
function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return (saved as ThemeMode) || "light";
  });

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme-mode", next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      mode,
      theme: themes[mode],
      toggleMode,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Hook
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

// スタイル付きコンポーネント
function ThemedCard({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        padding: theme.spacing.lg,
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ color: theme.colors.primary }}>{title}</h2>
      {children}
    </div>
  );
}

function ThemeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <button onClick={toggleMode}>
      {mode === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
    </button>
  );
}

// App
function App() {
  return (
    <ThemeProvider>
      <div style={{ padding: "20px" }}>
        <ThemeToggle />
        <ThemedCard title="Welcome">
          <p>This card responds to theme changes!</p>
        </ThemedCard>
      </div>
    </ThemeProvider>
  );
}

export { ThemeProvider, useTheme };
```

## まとめ

- **Context API** は Props のバケツリレーを解消する
- **Provider** でデータを提供し、**useContext** で消費する
- **カスタムフック** でエラーハンドリングと型安全性を確保
- **Context の分割** でパフォーマンスを最適化
- **useMemo** で value オブジェクトをメモ化
- 頻繁に更新されるデータには **専用の状態管理ライブラリ** を検討

## 確認問題

1. Context を使うメリットとデメリットは何ですか？
2. Context のパフォーマンス最適化の方法を 3 つ挙げてください。
3. Compound Components パターンとは何ですか？
4. Context と Props の使い分けの基準は何ですか？

## 次の章

[08 - 状態管理ライブラリ](./08-State-Libraries.md) では、Zustand や Jotai などの軽量な状態管理ライブラリについて学びます。
