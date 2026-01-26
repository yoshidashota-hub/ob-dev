# 05 - 高度な Hooks

## この章で学ぶこと

- useReducer による複雑な State 管理
- useContext によるグローバルな値の共有
- useMemo と useCallback によるメモ化
- useLayoutEffect の使い所
- useId の活用

## useReducer

`useReducer` は、複雑な State ロジックを管理するための Hook です。Redux のような状態管理パターンを React 組み込みで使えます。

### 基本的な構文

```tsx
const [state, dispatch] = useReducer(reducer, initialState);
```

### useState との比較

```tsx
// useState: シンプルな State
const [count, setCount] = useState(0);
setCount(count + 1);

// useReducer: アクションベースの State 更新
const [state, dispatch] = useReducer(reducer, { count: 0 });
dispatch({ type: "INCREMENT" });
```

### 基本的な使用例

```tsx
import { useReducer } from "react";

// State の型
type State = {
  count: number;
};

// Action の型
type Action =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "RESET" }
  | { type: "SET"; payload: number };

// Reducer 関数
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INCREMENT":
      return { count: state.count + 1 };
    case "DECREMENT":
      return { count: state.count - 1 };
    case "RESET":
      return { count: 0 };
    case "SET":
      return { count: action.payload };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+1</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })}>-1</button>
      <button onClick={() => dispatch({ type: "RESET" })}>Reset</button>
      <button onClick={() => dispatch({ type: "SET", payload: 100 })}>
        Set to 100
      </button>
    </div>
  );
}
```

### 複雑な State の管理

```tsx
import { useReducer } from "react";

// 型定義
type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

type State = {
  todos: Todo[];
  filter: "all" | "active" | "completed";
  nextId: number;
};

type Action =
  | { type: "ADD_TODO"; payload: string }
  | { type: "TOGGLE_TODO"; payload: number }
  | { type: "DELETE_TODO"; payload: number }
  | { type: "SET_FILTER"; payload: State["filter"] }
  | { type: "CLEAR_COMPLETED" };

// Reducer
function todoReducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TODO":
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: state.nextId, text: action.payload, completed: false },
        ],
        nextId: state.nextId + 1,
      };

    case "TOGGLE_TODO":
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo,
        ),
      };

    case "DELETE_TODO":
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
      };

    case "SET_FILTER":
      return {
        ...state,
        filter: action.payload,
      };

    case "CLEAR_COMPLETED":
      return {
        ...state,
        todos: state.todos.filter((todo) => !todo.completed),
      };

    default:
      return state;
  }
}

// 初期状態
const initialState: State = {
  todos: [],
  filter: "all",
  nextId: 1,
};

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  // フィルタリングされた Todo（派生状態）
  const filteredTodos = state.todos.filter((todo) => {
    if (state.filter === "active") return !todo.completed;
    if (state.filter === "completed") return todo.completed;
    return true;
  });

  return (
    <div>
      <TodoInput
        onAdd={(text) => dispatch({ type: "ADD_TODO", payload: text })}
      />

      <FilterButtons
        currentFilter={state.filter}
        onFilterChange={(filter) =>
          dispatch({ type: "SET_FILTER", payload: filter })
        }
      />

      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() =>
                dispatch({ type: "TOGGLE_TODO", payload: todo.id })
              }
            />
            <span
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={() =>
                dispatch({ type: "DELETE_TODO", payload: todo.id })
              }
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => dispatch({ type: "CLEAR_COMPLETED" })}>
        Clear Completed
      </button>
    </div>
  );
}
```

## useContext

`useContext` は、コンポーネントツリー全体でデータを共有するための Hook です。

### Context の作成と使用

```tsx
import { createContext, useContext, useState, ReactNode } from "react";

// 1. Context の型を定義
type ThemeContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

// 2. Context を作成
const ThemeContext = createContext<ThemeContextType | null>(null);

// 3. Provider コンポーネント
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 4. カスタム Hook で使いやすくする
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// 5. コンポーネントで使用
function ThemedButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        backgroundColor: theme === "light" ? "#fff" : "#333",
        color: theme === "light" ? "#333" : "#fff",
      }}
    >
      Current theme: {theme}
    </button>
  );
}

// 6. アプリケーションのルート
function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}
```

### 複数の Context の組み合わせ

```tsx
import { createContext, useContext, useState, ReactNode } from "react";

// User Context
type User = { id: number; name: string } | null;
type UserContextType = {
  user: User;
  login: (name: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  const login = (name: string) => setUser({ id: 1, name });
  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}

// 複数のプロバイダーを組み合わせる
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  );
}
```

## useMemo

`useMemo` は、計算結果をメモ化（キャッシュ）するための Hook です。

### 基本的な使い方

```tsx
import { useMemo, useState } from "react";

function ExpensiveCalculation({ numbers }: { numbers: number[] }) {
  // ❌ 毎回再計算される
  const sum = numbers.reduce((acc, n) => acc + n, 0);

  // ✅ numbers が変わった時だけ再計算
  const memoizedSum = useMemo(() => {
    console.log("Calculating sum...");
    return numbers.reduce((acc, n) => acc + n, 0);
  }, [numbers]);

  return <p>Sum: {memoizedSum}</p>;
}
```

### useMemo の使用例

```tsx
import { useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
};

function ProductList({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");

  // フィルタリングとソートをメモ化
  const filteredAndSortedProducts = useMemo(() => {
    console.log("Filtering and sorting...");
    return products
      .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return a.price - b.price;
      });
  }, [products, filter, sortBy]);

  // 合計金額をメモ化
  const totalPrice = useMemo(() => {
    return filteredAndSortedProducts.reduce((sum, p) => sum + p.price, 0);
  }, [filteredAndSortedProducts]);

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter..."
      />
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as "name" | "price")}
      >
        <option value="name">Sort by Name</option>
        <option value="price">Sort by Price</option>
      </select>

      <p>Total: ${totalPrice}</p>

      <ul>
        {filteredAndSortedProducts.map((product) => (
          <li key={product.id}>
            {product.name} - ${product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## useCallback

`useCallback` は、関数をメモ化するための Hook です。子コンポーネントへのコールバック関数渡しに便利です。

### 基本的な使い方

```tsx
import { useCallback, useState, memo } from "react";

// メモ化された子コンポーネント
const Button = memo(function Button({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  console.log("Button rendered");
  return <button onClick={onClick}>{children}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  // ❌ 毎回新しい関数が作られ、Button が再レンダリングされる
  const handleClick = () => setCount(count + 1);

  // ✅ count が変わった時だけ新しい関数が作られる
  const memoizedHandleClick = useCallback(() => {
    setCount((c) => c + 1);
  }, []); // 依存配列が空なので、関数は一度だけ作成される

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <p>Count: {count}</p>
      <Button onClick={memoizedHandleClick}>Increment</Button>
    </div>
  );
}
```

### useCallback と useMemo の違い

```tsx
// useCallback は関数をメモ化
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// useMemo は値をメモ化（関数の戻り値）
const memoizedValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// useCallback(fn, deps) は useMemo(() => fn, deps) と等価
```

## useLayoutEffect

`useLayoutEffect` は、DOM の変更後、ブラウザが画面を描画する前に同期的に実行されます。

### useEffect との違い

```tsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";

function LayoutEffectExample() {
  const [width, setWidth] = useState(0);
  const divRef = useRef<HTMLDivElement>(null);

  // useEffect: 描画後に実行（非同期）
  // 画面のちらつきが発生する可能性
  useEffect(() => {
    if (divRef.current) {
      setWidth(divRef.current.getBoundingClientRect().width);
    }
  }, []);

  // useLayoutEffect: 描画前に実行（同期）
  // ちらつきなし
  useLayoutEffect(() => {
    if (divRef.current) {
      setWidth(divRef.current.getBoundingClientRect().width);
    }
  }, []);

  return <div ref={divRef}>Width: {width}px</div>;
}
```

### 使用場面

- DOM のサイズや位置を測定して State を更新する
- スクロール位置の復元
- ツールチップの位置調整
- アニメーションの準備

```tsx
function Tooltip({
  targetRef,
  children,
}: {
  targetRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (targetRef.current && tooltipRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      setPosition({
        top: targetRect.bottom + 8,
        left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
      });
    }
  }, [targetRef]);

  return (
    <div
      ref={tooltipRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        backgroundColor: "#333",
        color: "#fff",
        padding: "8px",
        borderRadius: "4px",
      }}
    >
      {children}
    </div>
  );
}
```

## useId

`useId` は、アクセシビリティ属性に使用できる一意の ID を生成します。

```tsx
import { useId } from "react";

function FormField({ label }: { label: string }) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" />
    </div>
  );
}

// 複数の要素で使用
function PasswordField() {
  const id = useId();

  return (
    <div>
      <label htmlFor={`${id}-password`}>Password</label>
      <input
        id={`${id}-password`}
        type="password"
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`}>Password must be at least 8 characters</p>
    </div>
  );
}
```

## 実践: 認証コンテキストの実装

```tsx
import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

// 型定義
type User = {
  id: string;
  email: string;
  name: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" };

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true, error: null };
    case "LOGIN_SUCCESS":
      return { ...state, isLoading: false, user: action.payload };
    case "LOGIN_FAILURE":
      return { ...state, isLoading: false, error: action.payload };
    case "LOGOUT":
      return { ...state, user: null };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider
function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: false,
    error: null,
  });

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });
    try {
      // API 呼び出しをシミュレート
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email === "test@example.com" && password === "password") {
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { id: "1", email, name: "Test User" },
        });
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: error instanceof Error ? error.message : "Login failed",
      });
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, []);

  // value をメモ化
  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// カスタム Hook
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 使用例: ログインフォーム
function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        disabled={isLoading}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

// 使用例: ユーザー情報表示
function UserInfo() {
  const { user, logout } = useAuth();

  if (!user) return <p>Please log in</p>;

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export { AuthProvider, useAuth };
```

## まとめ

- **useReducer**: 複雑な State ロジックをアクションベースで管理
- **useContext**: コンポーネントツリー全体でデータを共有
- **useMemo**: 計算結果をメモ化して再計算を防ぐ
- **useCallback**: 関数をメモ化して不要な再レンダリングを防ぐ
- **useLayoutEffect**: DOM 操作後、描画前に同期的に実行
- **useId**: アクセシビリティのための一意の ID を生成

## 確認問題

1. useState と useReducer はどのように使い分けますか？
2. Context を使用する際のパフォーマンス上の注意点は？
3. useMemo と useCallback の違いは何ですか？
4. useEffect と useLayoutEffect の違いは何ですか？

## 次の章

[06 - カスタムフック](./06-Custom-Hooks.md) では、Hooks を組み合わせて再利用可能なカスタムフックを作成する方法を学びます。
