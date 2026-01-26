# 01 - コンポーネントと JSX

## この章で学ぶこと

- React コンポーネントの基本概念
- JSX の文法と特徴
- 関数コンポーネントの作成方法
- コンポーネントの合成と再利用

## コンポーネントとは

React では、UI を**コンポーネント**と呼ばれる独立した再利用可能な部品に分割します。コンポーネントは JavaScript の関数のようなもので、任意の入力（Props）を受け取り、画面に表示する React 要素を返します。

### なぜコンポーネントを使うのか

1. **再利用性**: 同じ UI を複数の場所で使い回せる
2. **保守性**: 小さな単位で管理できるため変更が容易
3. **テスト容易性**: 独立した単位でテストできる
4. **関心の分離**: 各コンポーネントは特定の責務のみを持つ

## 関数コンポーネント

React では、関数コンポーネントが推奨されています。関数コンポーネントは、Props を引数として受け取り、React 要素を返す JavaScript 関数です。

```tsx
// シンプルな関数コンポーネント
function Greeting() {
  return <h1>Hello, World!</h1>;
}

// アロー関数での定義
const Greeting = () => {
  return <h1>Hello, World!</h1>;
};

// 暗黙的な return（式が 1 つの場合）
const Greeting = () => <h1>Hello, World!</h1>;
```

### TypeScript での型定義

```tsx
import { FC } from "react";

// 型を明示的に定義
type GreetingProps = {
  name: string;
};

// FC（FunctionComponent）型を使用
const Greeting: FC<GreetingProps> = ({ name }) => {
  return <h1>Hello, {name}!</h1>;
};

// または直接引数に型を付ける（推奨）
function Greeting({ name }: GreetingProps) {
  return <h1>Hello, {name}!</h1>;
}
```

## JSX とは

JSX（JavaScript XML）は、JavaScript の構文拡張で、HTML のような記法で UI を記述できます。

```tsx
// JSX
const element = <h1 className="title">Hello, World!</h1>;

// コンパイル後の JavaScript
const element = React.createElement(
  "h1",
  { className: "title" },
  "Hello, World!",
);
```

### JSX の基本ルール

#### 1. 単一のルート要素

コンポーネントは単一のルート要素を返す必要があります。

```tsx
// ❌ エラー: 複数のルート要素
function Card() {
  return (
    <h1>Title</h1>
    <p>Content</p>
  );
}

// ✅ 正しい: 単一のルート要素
function Card() {
  return (
    <div>
      <h1>Title</h1>
      <p>Content</p>
    </div>
  );
}

// ✅ Fragment を使用（余分な DOM ノードを追加しない）
function Card() {
  return (
    <>
      <h1>Title</h1>
      <p>Content</p>
    </>
  );
}
```

#### 2. すべてのタグを閉じる

HTML では省略できる閉じタグも、JSX では必須です。

```tsx
// ❌ エラー
<img src="image.jpg">
<input type="text">
<br>

// ✅ 正しい
<img src="image.jpg" />
<input type="text" />
<br />
```

#### 3. キャメルケースの属性名

HTML 属性は camelCase で記述します。

```tsx
// HTML
<div class="container" onclick="handleClick()" tabindex="0">

// JSX
<div className="container" onClick={handleClick} tabIndex={0}>
```

### よく使う属性の変換

| HTML        | JSX        |
| ----------- | ---------- |
| class       | className  |
| for         | htmlFor    |
| tabindex    | tabIndex   |
| onclick     | onClick    |
| onchange    | onChange   |
| onsubmit    | onSubmit   |
| style="..." | style={{}} |

## JSX での JavaScript 式

中括弧 `{}` を使って JavaScript 式を埋め込めます。

```tsx
function UserInfo({ user }: { user: { name: string; age: number } }) {
  const currentYear = new Date().getFullYear();

  return (
    <div>
      {/* 変数の展開 */}
      <h1>{user.name}</h1>

      {/* 式の評価 */}
      <p>Age: {user.age}</p>
      <p>Birth year: {currentYear - user.age}</p>

      {/* 関数呼び出し */}
      <p>{user.name.toUpperCase()}</p>

      {/* テンプレートリテラル */}
      <p>{`Welcome, ${user.name}!`}</p>
    </div>
  );
}
```

### 条件付きレンダリング

```tsx
function Greeting({ isLoggedIn, name }: { isLoggedIn: boolean; name: string }) {
  // if 文
  if (!isLoggedIn) {
    return <p>Please log in.</p>;
  }

  return (
    <div>
      {/* 三項演算子 */}
      <p>{isLoggedIn ? `Welcome, ${name}!` : "Please log in."}</p>

      {/* 論理 AND 演算子 */}
      {isLoggedIn && <button>Logout</button>}

      {/* 論理 OR 演算子（デフォルト値） */}
      <p>Hello, {name || "Guest"}</p>
    </div>
  );
}
```

### リストのレンダリング

配列を `map()` でレンダリングする際は、`key` 属性が必要です。

```tsx
type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul>
      {todos.map((todo) => (
        // key は配列内で一意の値を指定
        <li
          key={todo.id}
          style={{ textDecoration: todo.completed ? "line-through" : "none" }}
        >
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

#### key の重要性

- React が要素を効率的に更新するために必要
- 配列のインデックスは推奨されない（要素の順序が変わる場合に問題）
- 一意で安定した値（ID など）を使用する

```tsx
// ❌ 非推奨: インデックスを key に使用
{
  items.map((item, index) => <li key={index}>{item}</li>);
}

// ✅ 推奨: 一意の ID を key に使用
{
  items.map((item) => <li key={item.id}>{item.name}</li>);
}
```

## スタイリング

### インラインスタイル

```tsx
function StyledComponent() {
  const styles = {
    container: {
      backgroundColor: "#f0f0f0",
      padding: "20px",
      borderRadius: "8px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#333",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Styled Title</h1>
    </div>
  );
}
```

### CSS クラス

```tsx
// styles.css
// .container { background-color: #f0f0f0; }
// .title { font-size: 24px; }

import "./styles.css";

function StyledComponent() {
  const isActive = true;

  return (
    <div className="container">
      {/* 条件付きクラス */}
      <h1 className={`title ${isActive ? "active" : ""}`}>Title</h1>
    </div>
  );
}
```

### CSS Modules

```tsx
// Button.module.css
// .button { background-color: blue; }
// .primary { background-color: green; }

import styles from "./Button.module.css";

function Button({ variant = "default" }: { variant?: "default" | "primary" }) {
  return (
    <button
      className={`${styles.button} ${variant === "primary" ? styles.primary : ""}`}
    >
      Click me
    </button>
  );
}
```

## コンポーネントの合成

小さなコンポーネントを組み合わせて大きなコンポーネントを作成します。

```tsx
// 小さなコンポーネント
function Avatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="avatar" />;
}

function UserName({ name }: { name: string }) {
  return <span className="user-name">{name}</span>;
}

// 合成したコンポーネント
function UserProfile({ user }: { user: { avatarUrl: string; name: string } }) {
  return (
    <div className="user-profile">
      <Avatar src={user.avatarUrl} alt={user.name} />
      <UserName name={user.name} />
    </div>
  );
}

// さらに大きなコンポーネント
function UserCard({
  user,
}: {
  user: { avatarUrl: string; name: string; bio: string };
}) {
  return (
    <div className="user-card">
      <UserProfile user={user} />
      <p className="bio">{user.bio}</p>
    </div>
  );
}
```

## children プロパティ

`children` は特別なプロパティで、コンポーネントのタグ間に渡された要素を受け取ります。

```tsx
import { ReactNode } from "react";

type CardProps = {
  title: string;
  children: ReactNode;
};

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2 className="card-title">{title}</h2>
      <div className="card-content">{children}</div>
    </div>
  );
}

// 使用例
function App() {
  return (
    <Card title="Welcome">
      <p>This is the card content.</p>
      <button>Click me</button>
    </Card>
  );
}
```

## 実践: プロフィールカードの作成

学んだことを活かして、プロフィールカードコンポーネントを作成してみましょう。

```tsx
import { ReactNode } from "react";

// 型定義
type User = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  skills: string[];
};

// Avatar コンポーネント
function Avatar({
  src,
  alt,
  size = 80,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
}

// Badge コンポーネント
function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 8px",
        margin: "4px",
        backgroundColor: "#e0e0e0",
        borderRadius: "4px",
        fontSize: "12px",
      }}
    >
      {children}
    </span>
  );
}

// ProfileCard コンポーネント
function ProfileCard({ user }: { user: User }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        maxWidth: "300px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Avatar src={user.avatarUrl} alt={user.name} />
        <div>
          <h2 style={{ margin: 0 }}>{user.name}</h2>
          <p style={{ margin: 0, color: "#666" }}>{user.email}</p>
        </div>
      </div>

      <p style={{ marginTop: "16px" }}>{user.bio}</p>

      <div>
        <h3>Skills</h3>
        {user.skills.length > 0 ? (
          user.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)
        ) : (
          <p>No skills listed</p>
        )}
      </div>
    </div>
  );
}

// 使用例
function App() {
  const user: User = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    avatarUrl: "https://via.placeholder.com/150",
    bio: "Frontend developer passionate about React and TypeScript.",
    skills: ["React", "TypeScript", "Node.js"],
  };

  return (
    <div style={{ padding: "20px" }}>
      <ProfileCard user={user} />
    </div>
  );
}

export default App;
```

## まとめ

- **コンポーネント**は React の UI 構築の基本単位
- **JSX**は JavaScript 内で HTML ライクな記法で UI を記述できる
- JSX では**キャメルケース**の属性名と**中括弧**での式埋め込みを使う
- **条件付きレンダリング**には三項演算子や論理演算子を使用
- **リスト**は `map()` でレンダリングし、必ず `key` を指定
- **コンポーネントの合成**で再利用性の高い UI を構築
- **children** プロパティでコンポーネントの柔軟な合成が可能

## 確認問題

1. JSX で HTML の `class` 属性は何に変わりますか？
2. リストをレンダリングする際に `key` が必要な理由は？
3. `<></>` は何のための構文ですか？
4. 条件付きレンダリングの方法を 3 つ挙げてください。

## 次の章

[02 - Props と State](./02-Props-State.md) では、コンポーネント間のデータの受け渡しと、コンポーネント内部の状態管理について学びます。
