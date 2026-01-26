# 08 - 状態管理ライブラリ

## この章で学ぶこと

- 外部状態管理ライブラリの必要性
- Zustand の基本と応用
- Jotai のアトミック状態管理
- ライブラリの選択基準
- 実践的な使用パターン

## なぜ状態管理ライブラリを使うのか

### Context API の限界

1. **パフォーマンス**: Context の値が変わると、すべての消費者が再レンダリング
2. **複雑さ**: 大規模なアプリケーションでは Provider のネストが深くなる
3. **ボイラープレート**: 多くのセットアップコードが必要

### 状態管理ライブラリの利点

- **選択的な再レンダリング**: 必要なコンポーネントのみ更新
- **シンプルな API**: 少ないコードで状態管理
- **DevTools**: デバッグツールのサポート
- **ミドルウェア**: 永続化、ログなどの拡張機能

## Zustand

Zustand は軽量でシンプルな状態管理ライブラリです。

### インストール

```bash
npm install zustand
```

### 基本的な使い方

```tsx
import { create } from "zustand";

// ストアの型
type CounterStore = {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
};

// ストアの作成
const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// コンポーネントで使用
function Counter() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### 選択的なサブスクリプション

```tsx
// 全体を取得（どの値が変わっても再レンダリング）
const { count, increment } = useCounterStore();

// 値を選択的に取得（count が変わった時のみ再レンダリング）
const count = useCounterStore((state) => state.count);
const increment = useCounterStore((state) => state.increment);

// 複数の値を取得
const { count, total } = useCounterStore((state) => ({
  count: state.count,
  total: state.total,
}));
```

### 非同期アクション

```tsx
import { create } from "zustand";

type User = {
  id: number;
  name: string;
  email: string;
};

type UserStore = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: (id: number) => Promise<void>;
  clearUser: () => void;
};

const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  fetchUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const user = await response.json();
      set({ user, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  clearUser: () => set({ user: null, error: null }),
}));

// 使用例
function UserProfile({ userId }: { userId: number }) {
  const { user, isLoading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return null;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### ミドルウェア

```tsx
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

type SettingsStore = {
  theme: "light" | "dark";
  language: string;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (language: string) => void;
};

const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        theme: "light",
        language: "en",
        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
      }),
      {
        name: "settings-storage", // localStorage のキー
      }
    )
  )
);
```

### スライスパターン

大規模なストアを分割して管理します。

```tsx
import { create, StateCreator } from "zustand";

// User スライス
type UserSlice = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const createUserSlice: StateCreator<UserSlice & CartSlice, [], [], UserSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
});

// Cart スライス
type CartSlice = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
};

const createCartSlice: StateCreator<UserSlice & CartSlice, [], [], CartSlice> = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
});

// 統合ストア
const useStore = create<UserSlice & CartSlice>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}));
```

## Jotai

Jotai はアトミックな状態管理ライブラリです。

### インストール

```bash
npm install jotai
```

### 基本的な使い方

```tsx
import { atom, useAtom } from "jotai";

// アトムの作成
const countAtom = atom(0);

// コンポーネントで使用
function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
```

### 派生アトム（Derived Atoms）

```tsx
import { atom, useAtom, useAtomValue } from "jotai";

// プリミティブアトム
const priceAtom = atom(100);
const quantityAtom = atom(2);
const taxRateAtom = atom(0.1);

// 読み取り専用の派生アトム
const subtotalAtom = atom((get) => {
  return get(priceAtom) * get(quantityAtom);
});

const totalAtom = atom((get) => {
  const subtotal = get(subtotalAtom);
  const taxRate = get(taxRateAtom);
  return subtotal * (1 + taxRate);
});

// 使用例
function PriceDisplay() {
  const subtotal = useAtomValue(subtotalAtom);
  const total = useAtomValue(totalAtom);

  return (
    <div>
      <p>Subtotal: ${subtotal}</p>
      <p>Total: ${total}</p>
    </div>
  );
}
```

### 書き込み可能な派生アトム

```tsx
import { atom, useAtom } from "jotai";

const celsiusAtom = atom(25);

// 読み書き可能な派生アトム
const fahrenheitAtom = atom(
  (get) => get(celsiusAtom) * (9 / 5) + 32, // 読み取り
  (get, set, newValue: number) => {
    // 書き込み
    set(celsiusAtom, (newValue - 32) * (5 / 9));
  }
);

function TemperatureConverter() {
  const [celsius, setCelsius] = useAtom(celsiusAtom);
  const [fahrenheit, setFahrenheit] = useAtom(fahrenheitAtom);

  return (
    <div>
      <label>
        Celsius:
        <input type="number" value={celsius} onChange={(e) => setCelsius(Number(e.target.value))} />
      </label>
      <label>
        Fahrenheit:
        <input type="number" value={fahrenheit} onChange={(e) => setFahrenheit(Number(e.target.value))} />
      </label>
    </div>
  );
}
```

### 非同期アトム

```tsx
import { atom, useAtomValue } from "jotai";
import { Suspense } from "react";

// 非同期アトム
const userIdAtom = atom(1);

const userAtom = atom(async (get) => {
  const id = get(userIdAtom);
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// Suspense と組み合わせて使用
function UserProfile() {
  const user = useAtomValue(userAtom);
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserProfile />
    </Suspense>
  );
}
```

### アトムファミリー

動的にアトムを作成するパターンです。

```tsx
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

// アトムファミリー：IDごとにアトムを作成
const todoAtomFamily = atomFamily((id: string) =>
  atom({
    id,
    text: "",
    completed: false,
  })
);

// 使用例
function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id));

  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => setTodo({ ...todo, completed: !todo.completed })}
      />
      {todo.text}
    </li>
  );
}
```

### atomWithStorage

```tsx
import { atomWithStorage } from "jotai/utils";

// localStorage と自動同期
const themeAtom = atomWithStorage<"light" | "dark">("theme", "light");

function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
      Current: {theme}
    </button>
  );
}
```

## Zustand vs Jotai

### Zustand が適している場合

- **大規模なストア**: 複数の関連した状態をまとめて管理
- **Redux からの移行**: 似たようなメンタルモデル
- **ミドルウェアが必要**: 永続化、ログ、DevTools など

### Jotai が適している場合

- **細粒度の状態**: 独立した小さな状態が多い
- **派生状態が多い**: 他の状態から計算される値
- **Suspense との統合**: 非同期状態の自然な扱い

### 比較表

| 特徴                 | Zustand               | Jotai                   |
| -------------------- | --------------------- | ----------------------- |
| メンタルモデル       | ストアベース          | アトムベース            |
| バンドルサイズ       | 約 1KB                | 約 2KB                  |
| TypeScript           | 良好                  | 優秀                    |
| React 外での使用     | 可能                  | 不可                    |
| DevTools             | あり                  | あり                    |
| 学習コスト           | 低                    | 低                      |
| 派生状態             | 手動で計算            | 自動的に追跡            |
| 非同期               | アクション内で処理    | 非同期アトム            |

## 実践: Todo アプリを両方で実装

### Zustand 版

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

type Filter = "all" | "active" | "completed";

type TodoStore = {
  todos: Todo[];
  filter: Filter;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  setFilter: (filter: Filter) => void;
  clearCompleted: () => void;
};

const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [],
      filter: "all",

      addTodo: (text) =>
        set((state) => ({
          todos: [...state.todos, { id: crypto.randomUUID(), text, completed: false }],
        })),

      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),

      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),

      setFilter: (filter) => set({ filter }),

      clearCompleted: () =>
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        })),
    }),
    { name: "todo-storage" }
  )
);

// セレクター
const useFilteredTodos = () =>
  useTodoStore((state) => {
    switch (state.filter) {
      case "active":
        return state.todos.filter((t) => !t.completed);
      case "completed":
        return state.todos.filter((t) => t.completed);
      default:
        return state.todos;
    }
  });

// コンポーネント
function TodoApp() {
  const filteredTodos = useFilteredTodos();
  const { addTodo, toggleTodo, deleteTodo, setFilter, clearCompleted, filter } = useTodoStore();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      addTodo(input.trim());
      setInput("");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add todo..." />
        <button type="submit">Add</button>
      </form>

      <div>
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ fontWeight: filter === f ? "bold" : "normal" }}
          >
            {f}
          </button>
        ))}
      </div>

      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <button onClick={clearCompleted}>Clear Completed</button>
    </div>
  );
}
```

### Jotai 版

```tsx
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

type Filter = "all" | "active" | "completed";

// アトム
const todosAtom = atomWithStorage<Todo[]>("todos", []);
const filterAtom = atom<Filter>("all");

// 派生アトム
const filteredTodosAtom = atom((get) => {
  const todos = get(todosAtom);
  const filter = get(filterAtom);

  switch (filter) {
    case "active":
      return todos.filter((t) => !t.completed);
    case "completed":
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
});

const statsAtom = atom((get) => {
  const todos = get(todosAtom);
  return {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    active: todos.filter((t) => !t.completed).length,
  };
});

// アクションアトム
const addTodoAtom = atom(null, (get, set, text: string) => {
  set(todosAtom, [...get(todosAtom), { id: crypto.randomUUID(), text, completed: false }]);
});

const toggleTodoAtom = atom(null, (get, set, id: string) => {
  set(
    todosAtom,
    get(todosAtom).map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
});

const deleteTodoAtom = atom(null, (get, set, id: string) => {
  set(
    todosAtom,
    get(todosAtom).filter((todo) => todo.id !== id)
  );
});

const clearCompletedAtom = atom(null, (get, set) => {
  set(
    todosAtom,
    get(todosAtom).filter((todo) => !todo.completed)
  );
});

// コンポーネント
function TodoApp() {
  const filteredTodos = useAtomValue(filteredTodosAtom);
  const stats = useAtomValue(statsAtom);
  const [filter, setFilter] = useAtom(filterAtom);
  const addTodo = useSetAtom(addTodoAtom);
  const toggleTodo = useSetAtom(toggleTodoAtom);
  const deleteTodo = useSetAtom(deleteTodoAtom);
  const clearCompleted = useSetAtom(clearCompletedAtom);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      addTodo(input.trim());
      setInput("");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add todo..." />
        <button type="submit">Add</button>
      </form>

      <div>
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ fontWeight: filter === f ? "bold" : "normal" }}
          >
            {f} ({f === "all" ? stats.total : f === "active" ? stats.active : stats.completed})
          </button>
        ))}
      </div>

      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <button onClick={clearCompleted}>Clear Completed</button>
    </div>
  );
}
```

## まとめ

- **Zustand**: シンプルで Redux ライクなストアベースの状態管理
- **Jotai**: アトミックで細粒度な状態管理、派生状態が得意
- **選択的サブスクリプション**: 両方とも不要な再レンダリングを防止
- **ミドルウェア**: 永続化、DevTools などで拡張可能
- **適材適所**: アプリケーションの特性に応じて選択

## 確認問題

1. Context API と比較した状態管理ライブラリの利点は？
2. Zustand のスライスパターンとは何ですか？
3. Jotai の派生アトムはどのように動作しますか？
4. Zustand と Jotai の使い分けの基準は？

## 次の章

[09 - パフォーマンス](./09-Performance.md) では、React アプリケーションのパフォーマンス最適化について学びます。
