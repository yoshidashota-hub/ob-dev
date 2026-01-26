# 09 - パフォーマンス最適化

## この章で学ぶこと

- React のレンダリング仕組み
- memo, useMemo, useCallback の使い分け
- 仮想化（Virtualization）
- コード分割と遅延読み込み
- パフォーマンス計測とプロファイリング

## React のレンダリング

### レンダリングとは

React では「レンダリング」は DOM の更新ではなく、コンポーネント関数の実行を指します。

```tsx
function Counter() {
  console.log("Counter rendered"); // ← これがレンダリング
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### レンダリングが発生する条件

1. **State の更新**: setState が呼ばれた時
2. **Props の変更**: 親から受け取る Props が変わった時
3. **親のレンダリング**: 親コンポーネントがレンダリングされた時
4. **Context の変更**: 購読している Context の値が変わった時

### 不要なレンダリングの問題

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      {/* count が変わるたびに ExpensiveChild も再レンダリング */}
      <ExpensiveChild />
    </div>
  );
}

function ExpensiveChild() {
  console.log("ExpensiveChild rendered"); // 毎回実行される
  // 重い処理...
  return <div>Expensive Content</div>;
}
```

## React.memo

`React.memo` はコンポーネントをメモ化し、Props が変わらない限り再レンダリングをスキップします。

### 基本的な使い方

```tsx
import { memo } from "react";

const ExpensiveChild = memo(function ExpensiveChild() {
  console.log("ExpensiveChild rendered");
  return <div>Expensive Content</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      {/* Props がないので再レンダリングされない */}
      <ExpensiveChild />
    </div>
  );
}
```

### Props がある場合

```tsx
const UserCard = memo(function UserCard({ user }: { user: User }) {
  console.log("UserCard rendered");
  return <div>{user.name}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 毎回新しいオブジェクトが作られるため memo が効かない
  const user = { name: "Alice", age: 25 };

  // ✅ オブジェクトをメモ化
  const user = useMemo(() => ({ name: "Alice", age: 25 }), []);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <UserCard user={user} />
    </div>
  );
}
```

### カスタム比較関数

```tsx
const TodoItem = memo(
  function TodoItem({ todo, onToggle }: { todo: Todo; onToggle: (id: number) => void }) {
    return (
      <li>
        <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
        {todo.text}
      </li>
    );
  },
  // カスタム比較関数（true を返すと再レンダリングをスキップ）
  (prevProps, nextProps) => {
    return (
      prevProps.todo.id === nextProps.todo.id &&
      prevProps.todo.completed === nextProps.todo.completed &&
      prevProps.todo.text === nextProps.todo.text
    );
  }
);
```

## useMemo

`useMemo` は計算結果をメモ化します。

### 重い計算のメモ化

```tsx
function FilteredList({ items, filter }: { items: Item[]; filter: string }) {
  // ❌ 毎回フィルタリングが実行される
  const filteredItems = items.filter((item) => item.name.includes(filter));

  // ✅ items または filter が変わった時だけ再計算
  const filteredItems = useMemo(
    () => items.filter((item) => item.name.includes(filter)),
    [items, filter]
  );

  return (
    <ul>
      {filteredItems.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### オブジェクトの参照安定化

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 毎回新しい配列が作られる
  const colors = ["red", "green", "blue"];

  // ✅ メモ化して参照を安定させる
  const colors = useMemo(() => ["red", "green", "blue"], []);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ColorPicker colors={colors} />
    </div>
  );
}
```

### useMemo を使うべきでない場合

```tsx
// ❌ 単純な計算には不要（オーバーヘッドの方が大きい）
const doubled = useMemo(() => count * 2, [count]);

// ✅ 単純な計算はそのまま
const doubled = count * 2;

// ❌ 毎回変わる値に使用（意味がない）
const random = useMemo(() => Math.random(), [count]); // count が変わるたびに再計算
```

## useCallback

`useCallback` は関数をメモ化します。

### 基本的な使い方

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 毎回新しい関数が作られる
  const handleClick = () => {
    console.log("clicked");
  };

  // ✅ 関数をメモ化
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return <ChildButton onClick={handleClick} />;
}

const ChildButton = memo(function ChildButton({ onClick }: { onClick: () => void }) {
  console.log("ChildButton rendered");
  return <button onClick={onClick}>Click</button>;
});
```

### 依存する値がある場合

```tsx
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // 依存する state を含める
  const handleToggle = useCallback((id: number) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  }, []); // 関数型更新を使えば依存配列を空にできる

  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
      ))}
    </ul>
  );
}
```

## 仮想化（Virtualization）

大量のリストを効率的にレンダリングするテクニックです。

### react-window の使用

```bash
npm install react-window
```

```tsx
import { FixedSizeList } from "react-window";

type Item = {
  id: number;
  name: string;
};

function VirtualizedList({ items }: { items: Item[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{items[index].name}</div>
  );

  return (
    <FixedSizeList height={400} itemCount={items.length} itemSize={35} width="100%">
      {Row}
    </FixedSizeList>
  );
}

// 10000 件でも高速に動作
function App() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  return <VirtualizedList items={items} />;
}
```

### 可変高さのリスト

```tsx
import { VariableSizeList } from "react-window";

function VariableHeightList({ items }: { items: Item[] }) {
  const getItemSize = (index: number) => {
    // 各アイテムの高さを返す
    return items[index].description ? 70 : 35;
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <h4>{items[index].name}</h4>
      {items[index].description && <p>{items[index].description}</p>}
    </div>
  );

  return (
    <VariableSizeList height={400} itemCount={items.length} itemSize={getItemSize} width="100%">
      {Row}
    </VariableSizeList>
  );
}
```

## コード分割と遅延読み込み

### React.lazy と Suspense

```tsx
import { lazy, Suspense } from "react";

// 動的インポート
const HeavyComponent = lazy(() => import("./HeavyComponent"));
const Dashboard = lazy(() => import("./Dashboard"));
const Settings = lazy(() => import("./Settings"));

function App() {
  const [page, setPage] = useState<"dashboard" | "settings">("dashboard");

  return (
    <div>
      <nav>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("settings")}>Settings</button>
      </nav>

      <Suspense fallback={<div>Loading...</div>}>
        {page === "dashboard" ? <Dashboard /> : <Settings />}
      </Suspense>
    </div>
  );
}
```

### ルートベースのコード分割

```tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Products = lazy(() => import("./pages/Products"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### 名前付きエクスポートの遅延読み込み

```tsx
// ❌ lazy は default export のみサポート
const { MyComponent } = lazy(() => import("./components"));

// ✅ ラッパーを使用
const MyComponent = lazy(() =>
  import("./components").then((module) => ({
    default: module.MyComponent,
  }))
);
```

## パフォーマンス計測

### React DevTools Profiler

1. React DevTools をインストール
2. Profiler タブを開く
3. 記録を開始して操作
4. フレームグラフで分析

### useDebugValue

カスタムフックのデバッグに使用します。

```tsx
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // DevTools に表示される
  useDebugValue(isOnline ? "Online" : "Offline");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
```

### Performance API

```tsx
function MeasuredComponent() {
  useEffect(() => {
    performance.mark("component-start");

    return () => {
      performance.mark("component-end");
      performance.measure("component-lifetime", "component-start", "component-end");

      const measures = performance.getEntriesByName("component-lifetime");
      console.log("Component lifetime:", measures[0].duration, "ms");
    };
  }, []);

  return <div>Measured Component</div>;
}
```

## 最適化のベストプラクティス

### 1. 計測してから最適化

```tsx
// ❌ 推測で最適化
const value = useMemo(() => simpleCalculation(), []);

// ✅ 実際にパフォーマンス問題があることを確認してから最適化
// React DevTools Profiler で確認
```

### 2. State の適切な配置

```tsx
// ❌ 不必要に高い位置に State を持つ
function App() {
  const [inputValue, setInputValue] = useState(""); // 全体が再レンダリング
  return (
    <div>
      <Header />
      <SearchInput value={inputValue} onChange={setInputValue} />
      <ExpensiveList />
    </div>
  );
}

// ✅ State を必要な場所に限定
function App() {
  return (
    <div>
      <Header />
      <SearchInput /> {/* State を内部に持つ */}
      <ExpensiveList />
    </div>
  );
}
```

### 3. コンポーネントの分割

```tsx
// ❌ 大きなコンポーネント
function ProductPage() {
  const [quantity, setQuantity] = useState(1);

  return (
    <div>
      {/* quantity が変わると全て再レンダリング */}
      <ExpensiveProductGallery />
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <ExpensiveReviews />
    </div>
  );
}

// ✅ State を持つ部分を分離
function ProductPage() {
  return (
    <div>
      <ExpensiveProductGallery />
      <QuantitySection /> {/* State はここだけ */}
      <ExpensiveReviews />
    </div>
  );
}

function QuantitySection() {
  const [quantity, setQuantity] = useState(1);
  return <QuantitySelector value={quantity} onChange={setQuantity} />;
}
```

### 4. key の適切な使用

```tsx
// ❌ インデックスを key に使用（順序変更時に問題）
{items.map((item, index) => <Item key={index} {...item} />)}

// ✅ 一意の ID を使用
{items.map((item) => <Item key={item.id} {...item} />)}
```

## 実践: 最適化されたテーブルコンポーネント

```tsx
import { memo, useMemo, useCallback, useState } from "react";

type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
};

// テーブルヘッダー（メモ化）
const TableHeader = memo(function TableHeader<T>({ columns }: { columns: Column<T>[] }) {
  return (
    <thead>
      <tr>
        {columns.map((col) => (
          <th key={String(col.key)}>{col.header}</th>
        ))}
      </tr>
    </thead>
  );
});

// テーブル行（メモ化）
const TableRow = memo(function TableRow<T>({
  item,
  columns,
  onClick,
}: {
  item: T;
  columns: Column<T>[];
  onClick?: () => void;
}) {
  return (
    <tr onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      {columns.map((col) => (
        <td key={String(col.key)}>
          {col.render ? col.render(item[col.key], item) : String(item[col.key])}
        </td>
      ))}
    </tr>
  );
});

// メインテーブルコンポーネント
function OptimizedTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
}: TableProps<T>) {
  // 行クリックハンドラーをメモ化
  const handleRowClick = useCallback(
    (item: T) => () => {
      onRowClick?.(item);
    },
    [onRowClick]
  );

  return (
    <table>
      <TableHeader columns={columns} />
      <tbody>
        {data.map((item) => (
          <TableRow
            key={item.id}
            item={item}
            columns={columns}
            onClick={onRowClick ? handleRowClick(item) : undefined}
          />
        ))}
      </tbody>
    </table>
  );
}

// 使用例
type User = {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
};

function UserTable() {
  const [users] = useState<User[]>([
    { id: 1, name: "Alice", email: "alice@example.com", status: "active" },
    // ... more users
  ]);

  const columns = useMemo<Column<User>[]>(
    () => [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      {
        key: "status",
        header: "Status",
        render: (value) => (
          <span style={{ color: value === "active" ? "green" : "red" }}>
            {value}
          </span>
        ),
      },
    ],
    []
  );

  const handleRowClick = useCallback((user: User) => {
    console.log("Selected:", user);
  }, []);

  return <OptimizedTable data={users} columns={columns} onRowClick={handleRowClick} />;
}
```

## まとめ

- **計測が先**: 推測ではなく、実際のパフォーマンス問題を確認
- **memo**: Props が変わらない場合の再レンダリングをスキップ
- **useMemo**: 重い計算結果や参照をメモ化
- **useCallback**: 関数参照を安定させる
- **仮想化**: 大量のリストは表示分だけレンダリング
- **コード分割**: 必要な時に必要なコードだけ読み込む
- **State の配置**: 必要な場所に限定して影響範囲を最小化

## 確認問題

1. React.memo と useMemo の違いは何ですか？
2. useCallback はどのような場合に使用すべきですか？
3. 仮想化が効果的なのはどのような場合ですか？
4. 最適化する前に行うべきことは何ですか？

## 次の章

[10 - エラーバウンダリ](./10-Error-Boundaries.md) では、React でのエラーハンドリングについて学びます。
