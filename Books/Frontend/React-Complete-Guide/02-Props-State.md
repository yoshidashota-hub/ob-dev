# 02 - Props と State

## この章で学ぶこと

- Props の概念と使い方
- State の概念と useState の基本
- Props と State の違い
- データの流れ（単方向データフロー）
- 不変性（Immutability）の重要性

## Props（プロパティ）

Props は、親コンポーネントから子コンポーネントへデータを渡すための仕組みです。関数の引数のように、コンポーネントに値を渡せます。

### 基本的な Props の使い方

```tsx
// 型定義
type GreetingProps = {
  name: string;
  age: number;
};

// Props を受け取るコンポーネント
function Greeting({ name, age }: GreetingProps) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>You are {age} years old.</p>
    </div>
  );
}

// Props を渡す
function App() {
  return <Greeting name="Alice" age={25} />;
}
```

### Props の特徴

1. **読み取り専用**: Props は変更できない（イミュータブル）
2. **親から子へ**: データは親から子への一方向のみ
3. **任意の値**: 文字列、数値、オブジェクト、関数、React 要素など

```tsx
// ❌ Props を直接変更することはできない
function Greeting({ name }: { name: string }) {
  name = "Bob"; // エラーにはならないが、アンチパターン
  return <h1>{name}</h1>;
}
```

### オプショナル Props とデフォルト値

```tsx
type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary"; // オプショナル
  size?: "small" | "medium" | "large";
  disabled?: boolean;
};

// デフォルト値の設定
function Button({
  label,
  variant = "primary",
  size = "medium",
  disabled = false,
}: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} disabled={disabled}>
      {label}
    </button>
  );
}

// 使用例
function App() {
  return (
    <>
      <Button label="Submit" />
      <Button label="Cancel" variant="secondary" />
      <Button label="Delete" variant="primary" size="large" disabled />
    </>
  );
}
```

### スプレッド構文での Props 渡し

```tsx
type UserProps = {
  name: string;
  email: string;
  role: string;
};

function UserCard({ name, email, role }: UserProps) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
      <span>{role}</span>
    </div>
  );
}

function App() {
  const user = {
    name: "Alice",
    email: "alice@example.com",
    role: "Admin",
  };

  // スプレッド構文で全てのプロパティを渡す
  return <UserCard {...user} />;
}
```

## State（状態）

State は、コンポーネント内部で管理されるデータです。State が変更されると、コンポーネントは再レンダリングされます。

### useState の基本

```tsx
import { useState } from "react";

function Counter() {
  // state 変数と更新関数を取得
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

### useState の型指定

```tsx
import { useState } from "react";

// 基本型は自動推論
const [count, setCount] = useState(0); // number
const [name, setName] = useState(""); // string
const [isActive, setIsActive] = useState(false); // boolean

// 複雑な型は明示的に指定
type User = {
  id: number;
  name: string;
  email: string;
};

const [user, setUser] = useState<User | null>(null);
const [users, setUsers] = useState<User[]>([]);
```

### State の更新ルール

#### 1. State は直接変更しない

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  // ❌ 直接変更してはいけない
  const handleBadClick = () => {
    count = count + 1; // これは動作しない
  };

  // ✅ 更新関数を使用する
  const handleGoodClick = () => {
    setCount(count + 1);
  };

  return <button onClick={handleGoodClick}>{count}</button>;
}
```

#### 2. オブジェクトと配列は新しい参照を作成

```tsx
type FormData = {
  name: string;
  email: string;
};

function Form() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
  });

  // ❌ オブジェクトを直接変更してはいけない
  const handleBadChange = () => {
    formData.name = "Alice"; // これは動作しない
    setFormData(formData);
  };

  // ✅ 新しいオブジェクトを作成
  const handleGoodChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => handleGoodChange("name", e.target.value)}
        placeholder="Name"
      />
      <input
        value={formData.email}
        onChange={(e) => handleGoodChange("email", e.target.value)}
        placeholder="Email"
      />
    </form>
  );
}
```

#### 3. 配列の更新パターン

```tsx
function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);

  // 追加
  const addTodo = (text: string) => {
    setTodos([...todos, text]);
  };

  // 削除
  const removeTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  // 更新
  const updateTodo = (index: number, newText: string) => {
    setTodos(todos.map((todo, i) => (i === index ? newText : todo)));
  };

  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>
          {todo}
          <button onClick={() => removeTodo(index)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### 関数型更新

前の State の値に基づいて更新する場合は、関数型更新を使用します。

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  // ❌ 連続呼び出しで問題が発生する可能性
  const incrementThreeTimes = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    // count は 1 しか増えない（バッチ処理のため）
  };

  // ✅ 関数型更新で確実に更新
  const incrementThreeTimesCorrect = () => {
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
    // count は 3 増える
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={incrementThreeTimesCorrect}>+3</button>
    </div>
  );
}
```

## Props と State の違い

| 特徴           | Props                   | State                |
| -------------- | ----------------------- | -------------------- |
| データの所有者 | 親コンポーネント        | 自身のコンポーネント |
| 変更可能性     | 読み取り専用            | 更新関数で変更可能   |
| データの流れ   | 親から子へ              | コンポーネント内部   |
| 再レンダリング | 親が Props を変更した時 | State が更新された時 |
| 用途           | コンポーネント間の通信  | UI の状態管理        |
| 初期化         | 親が指定                | useState で指定      |

```tsx
// Props: 親から受け取る設定
// State: 内部で管理する状態

type TodoItemProps = {
  text: string; // Props: 親から受け取る
  onDelete: () => void; // Props: 親から受け取る
};

function TodoItem({ text, onDelete }: TodoItemProps) {
  // State: このコンポーネント内部で管理
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  if (isEditing) {
    return (
      <li>
        <input value={editText} onChange={(e) => setEditText(e.target.value)} />
        <button onClick={() => setIsEditing(false)}>Save</button>
      </li>
    );
  }

  return (
    <li>
      {text}
      <button onClick={() => setIsEditing(true)}>Edit</button>
      <button onClick={onDelete}>Delete</button>
    </li>
  );
}
```

## State の持ち上げ（Lifting State Up）

複数のコンポーネントで State を共有する必要がある場合、共通の親コンポーネントに State を持ち上げます。

```tsx
// 子コンポーネント: State を持たない
function TemperatureInput({
  scale,
  temperature,
  onTemperatureChange,
}: {
  scale: "c" | "f";
  temperature: string;
  onTemperatureChange: (value: string) => void;
}) {
  const scaleNames = { c: "Celsius", f: "Fahrenheit" };

  return (
    <fieldset>
      <legend>Enter temperature in {scaleNames[scale]}:</legend>
      <input
        value={temperature}
        onChange={(e) => onTemperatureChange(e.target.value)}
      />
    </fieldset>
  );
}

// 親コンポーネント: State を管理
function Calculator() {
  const [temperature, setTemperature] = useState("");
  const [scale, setScale] = useState<"c" | "f">("c");

  const handleCelsiusChange = (value: string) => {
    setScale("c");
    setTemperature(value);
  };

  const handleFahrenheitChange = (value: string) => {
    setScale("f");
    setTemperature(value);
  };

  // 温度変換
  const toCelsius = (f: number) => ((f - 32) * 5) / 9;
  const toFahrenheit = (c: number) => (c * 9) / 5 + 32;

  const tryConvert = (temp: string, convert: (n: number) => number) => {
    const input = parseFloat(temp);
    if (Number.isNaN(input)) return "";
    return Math.round(convert(input) * 1000) / 1000 + "";
  };

  const celsius =
    scale === "f" ? tryConvert(temperature, toCelsius) : temperature;
  const fahrenheit =
    scale === "c" ? tryConvert(temperature, toFahrenheit) : temperature;

  return (
    <div>
      <TemperatureInput
        scale="c"
        temperature={celsius}
        onTemperatureChange={handleCelsiusChange}
      />
      <TemperatureInput
        scale="f"
        temperature={fahrenheit}
        onTemperatureChange={handleFahrenheitChange}
      />
    </div>
  );
}
```

## 派生状態（Derived State）

State から計算できる値は、新しい State として持たずに計算します。

```tsx
function ShoppingCart() {
  const [items, setItems] = useState([
    { id: 1, name: "Apple", price: 100, quantity: 2 },
    { id: 2, name: "Banana", price: 80, quantity: 3 },
  ]);

  // ❌ 派生状態を別の State で管理（アンチパターン）
  // const [total, setTotal] = useState(0);

  // ✅ 既存の State から計算
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <h2>Shopping Cart</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name}: ¥{item.price} × {item.quantity}
          </li>
        ))}
      </ul>
      <p>Items: {itemCount}</p>
      <p>Total: ¥{total}</p>
    </div>
  );
}
```

## 制御コンポーネント vs 非制御コンポーネント

### 制御コンポーネント（Controlled）

React の State がフォームの値を管理します。

```tsx
function ControlledForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name} // React が値を制御
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 非制御コンポーネント（Uncontrolled）

DOM 自体がフォームの値を管理します。

```tsx
import { useRef } from "react";

function UncontrolledForm() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      name: nameRef.current?.value,
      email: emailRef.current?.value,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" ref={nameRef} defaultValue="" />
      <input type="email" ref={emailRef} defaultValue="" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### どちらを使うべきか

| 制御コンポーネント         | 非制御コンポーネント |
| -------------------------- | -------------------- |
| リアルタイムバリデーション | シンプルなフォーム   |
| 入力のフォーマット         | ファイルアップロード |
| 動的な入力の有効/無効      | パフォーマンス優先   |
| 1つの State で複数入力管理 | サードパーティ連携   |

## 実践: Todo アプリ

Props と State を組み合わせた Todo アプリを作成します。

```tsx
import { useState } from "react";

// 型定義
type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

// TodoItem コンポーネント
type TodoItemProps = {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px",
        borderBottom: "1px solid #eee",
      }}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span
        style={{
          flex: 1,
          textDecoration: todo.completed ? "line-through" : "none",
          color: todo.completed ? "#999" : "#333",
        }}
      >
        {todo.text}
      </span>
      <button onClick={() => onDelete(todo.id)} style={{ color: "red" }}>
        Delete
      </button>
    </li>
  );
}

// TodoList コンポーネント
type TodoListProps = {
  todos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return <p style={{ color: "#666" }}>No todos yet. Add one above!</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

// TodoForm コンポーネント
type TodoFormProps = {
  onAdd: (text: string) => void;
};

function TodoForm({ onAdd }: TodoFormProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
        style={{ flex: 1, padding: "8px" }}
      />
      <button type="submit" disabled={!text.trim()}>
        Add
      </button>
    </form>
  );
}

// メインの App コンポーネント
function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // 次のIDを生成
  const nextId = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;

  // Todo を追加
  const handleAdd = (text: string) => {
    const newTodo: Todo = {
      id: nextId,
      text,
      completed: false,
    };
    setTodos([...todos, newTodo]);
  };

  // 完了状態を切り替え
  const handleToggle = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  // Todo を削除
  const handleDelete = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // 派生状態
  const completedCount = todos.filter((t) => t.completed).length;
  const remainingCount = todos.length - completedCount;

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h1>Todo App</h1>

      <TodoForm onAdd={handleAdd} />

      <div style={{ margin: "16px 0", color: "#666" }}>
        {todos.length > 0 && (
          <p>
            {remainingCount} remaining, {completedCount} completed
          </p>
        )}
      </div>

      <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />
    </div>
  );
}

export default TodoApp;
```

## まとめ

- **Props** は親から子へデータを渡す仕組み（読み取り専用）
- **State** はコンポーネント内部で管理されるデータ
- State の更新は**必ず更新関数**を使用する
- オブジェクトや配列は**新しい参照**を作成して更新
- 関数型更新で前の State に基づく更新を確実に行う
- **State の持ち上げ**で複数コンポーネント間でデータを共有
- **派生状態**は State として持たず、計算する

## 確認問題

1. Props と State の主な違いは何ですか？
2. なぜオブジェクトの State を更新する際に新しいオブジェクトを作成する必要があるのですか？
3. 関数型更新（`setCount(prev => prev + 1)`）はどのような場合に使用すべきですか？
4. 「State の持ち上げ」とは何ですか？どのような場合に使用しますか？

## 次の章

[03 - イベント処理](./03-Event-Handling.md) では、ユーザーの操作（クリック、入力、フォーム送信など）に対応する方法を学びます。
