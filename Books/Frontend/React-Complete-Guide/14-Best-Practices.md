# 14 - ベストプラクティス

## この章で学ぶこと

- コンポーネント設計のベストプラクティス
- TypeScript との統合
- パフォーマンスの考慮点
- セキュリティ
- コードの整理と構造化

## コンポーネント設計

### 1. 単一責任の原則

```tsx
// ❌ 多くのことをしすぎ
function UserDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  // 多くの状態とロジック...

  return (
    <div>
      {/* ユーザー一覧 */}
      {/* ユーザー詳細 */}
      {/* 編集フォーム */}
      {/* 統計情報 */}
    </div>
  );
}

// ✅ 責務を分割
function UserDashboard() {
  return (
    <div>
      <UserList />
      <UserDetails />
      <UserStats />
    </div>
  );
}

function UserList() {
  const { users, selectUser } = useUsers();
  return <ul>{/* ... */}</ul>;
}
```

### 2. Props の設計

```tsx
// ❌ 多すぎる Props
<Button
  text="Submit"
  onClick={handleClick}
  disabled={false}
  loading={false}
  size="medium"
  variant="primary"
  fullWidth={false}
  icon={null}
  iconPosition="left"
  tooltip="Click to submit"
  // ...
/>;

// ✅ 論理的にグループ化
type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
};

<Button variant="primary" onClick={handleClick}>
  Submit
</Button>;
```

### 3. 合成（Composition）を優先

```tsx
// ❌ Props で分岐
function Card({
  showHeader,
  headerTitle,
  showFooter,
  footerContent,
  children,
}) {
  return (
    <div>
      {showHeader && <header>{headerTitle}</header>}
      <main>{children}</main>
      {showFooter && <footer>{footerContent}</footer>}
    </div>
  );
}

// ✅ 合成で柔軟に
function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

function CardHeader({ children }: { children: ReactNode }) {
  return <header className="card-header">{children}</header>;
}

function CardBody({ children }: { children: ReactNode }) {
  return <main className="card-body">{children}</main>;
}

function CardFooter({ children }: { children: ReactNode }) {
  return <footer className="card-footer">{children}</footer>;
}

// 使用例：必要な部品だけ使う
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>;
```

## TypeScript のベストプラクティス

### 1. 適切な型定義

```tsx
// ❌ any を使用
function Component({ data }: { data: any }) {
  return <div>{data.name}</div>;
}

// ✅ 具体的な型を定義
type User = {
  id: string;
  name: string;
  email: string;
};

function UserComponent({ user }: { user: User }) {
  return <div>{user.name}</div>;
}
```

### 2. イベントハンドラーの型

```tsx
// ✅ イベントの型を明示
function Form() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log(e.clientX, e.clientY);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}
```

### 3. ジェネリックコンポーネント

```tsx
// 汎用的なリストコンポーネント
type ListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
};

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// 使用例
<List
  items={users}
  keyExtractor={(user) => user.id}
  renderItem={(user) => <span>{user.name}</span>}
/>;
```

### 4. 型のエクスポート

```tsx
// types.ts
export type User = {
  id: string;
  name: string;
  email: string;
};

export type UserListProps = {
  users: User[];
  onSelect: (user: User) => void;
};

// UserList.tsx
import type { User, UserListProps } from "./types";

export function UserList({ users, onSelect }: UserListProps) {
  // ...
}
```

## Hooks のベストプラクティス

### 1. 早期リターン後の Hooks

```tsx
// ❌ 条件付きで Hooks を呼び出す
function Component({ shouldFetch }: { shouldFetch: boolean }) {
  if (!shouldFetch) {
    return null;
  }
  const data = useFetch("/api/data"); // 条件の後で Hooks を呼び出している
  return <div>{data}</div>;
}

// ✅ Hooks は常にトップレベルで呼び出す
function Component({ shouldFetch }: { shouldFetch: boolean }) {
  const data = useFetch(shouldFetch ? "/api/data" : null);

  if (!shouldFetch) {
    return null;
  }

  return <div>{data}</div>;
}
```

### 2. useEffect の依存配列

```tsx
// ❌ 依存配列に漏れがある
function Component({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // userId が漏れている

  return <div>{user?.name}</div>;
}

// ✅ すべての依存関係を含める
function Component({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchUser(userId).then((data) => {
      if (!cancelled) setUser(data);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]); // 正しく依存関係を指定

  return <div>{user?.name}</div>;
}
```

### 3. カスタムフックの命名

```tsx
// ✅ use で始める + 何をするか明確
function useLocalStorage<T>(key: string, initialValue: T) {
  /* ... */
}
function useDebounce<T>(value: T, delay: number): T {
  /* ... */
}
function useOnClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
  /* ... */
}
function useMediaQuery(query: string): boolean {
  /* ... */
}
```

## ファイル構造

### 機能ベースの構造

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   │
│   └── products/
│       ├── components/
│       ├── hooks/
│       └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── Input/
│   ├── hooks/
│   ├── utils/
│   └── types/
│
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx
│
└── index.tsx
```

### コンポーネントのバレルエクスポート

```tsx
// components/Button/index.ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

// components/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";
```

## パフォーマンスのベストプラクティス

### 1. 不要な再レンダリングを避ける

```tsx
// ❌ インラインオブジェクトは毎回新しい参照
<Component style={{ color: "red" }} />
<Component options={{ page: 1 }} />

// ✅ useMemo でメモ化するか、外部で定義
const style = useMemo(() => ({ color: "red" }), []);
<Component style={style} />

// または定数として定義
const OPTIONS = { page: 1 };
<Component options={OPTIONS} />
```

### 2. リストのキー

```tsx
// ❌ インデックスをキーに使用
{
  items.map((item, index) => <Item key={index} {...item} />);
}

// ✅ 一意の ID を使用
{
  items.map((item) => <Item key={item.id} {...item} />);
}
```

### 3. 重い計算の最適化

```tsx
// ❌ 毎回計算
function ExpensiveComponent({ data }: { data: Data[] }) {
  const processedData = heavyProcessing(data); // 毎回実行
  return <div>{/* ... */}</div>;
}

// ✅ useMemo でメモ化
function ExpensiveComponent({ data }: { data: Data[] }) {
  const processedData = useMemo(() => heavyProcessing(data), [data]);
  return <div>{/* ... */}</div>;
}
```

## セキュリティのベストプラクティス

### 1. XSS 対策

```tsx
// React は自動的にエスケープする
const userInput = '<script>alert("XSS")</script>';
<div>{userInput}</div> // 安全：テキストとして表示

// ❌ dangerouslySetInnerHTML は注意が必要
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // 危険！

// ✅ 必要な場合はサニタイズ
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 2. URL の検証

```tsx
// ❌ ユーザー入力をそのまま使用
<a href={userProvidedUrl}>Link</a>;

// ✅ プロトコルを検証
function SafeLink({ url, children }: { url: string; children: ReactNode }) {
  const isSafe = url.startsWith("https://") || url.startsWith("http://");

  if (!isSafe) {
    return <span>{children}</span>;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
```

### 3. 機密情報の取り扱い

```tsx
// ❌ クライアントサイドに機密情報を露出
const API_KEY = "sk-secret-key"; // ❌ ソースコードに露出

// ✅ 環境変数を使用（ビルド時に埋め込まれる公開可能なもののみ）
const API_URL = import.meta.env.VITE_API_URL;

// 機密情報はサーバーサイドで管理
// クライアントからはサーバー API を経由してアクセス
```

## エラーハンドリング

### 1. 適切なエラーバウンダリ

```tsx
// ✅ セクションごとにエラーを分離
function App() {
  return (
    <ErrorBoundary fallback={<AppError />}>
      <Header />
      <main>
        <ErrorBoundary fallback={<SidebarError />}>
          <Sidebar />
        </ErrorBoundary>
        <ErrorBoundary fallback={<ContentError />}>
          <Content />
        </ErrorBoundary>
      </main>
    </ErrorBoundary>
  );
}
```

### 2. エラー状態の管理

```tsx
// ✅ エラー状態を明示的に管理
type State<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function useData<T>(fetchFn: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ status: "idle" });

  const execute = async () => {
    setState({ status: "loading" });
    try {
      const data = await fetchFn();
      setState({ status: "success", data });
    } catch (error) {
      setState({ status: "error", error: error as Error });
    }
  };

  return { state, execute };
}
```

## アクセシビリティ

### 1. セマンティック HTML

```tsx
// ❌ div だらけ
<div onClick={handleClick}>
  <div>Title</div>
  <div>Content</div>
</div>

// ✅ セマンティックな要素を使用
<article>
  <h2>Title</h2>
  <p>Content</p>
  <button onClick={handleClick}>Action</button>
</article>
```

### 2. ARIA 属性

```tsx
// ✅ 適切な ARIA 属性
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose} aria-label="Close modal">
        ×
      </button>
    </div>
  );
}

// ✅ フォームのラベル
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-hint" />
<p id="email-hint">We'll never share your email</p>
```

### 3. キーボードナビゲーション

```tsx
function Menu({ items }: { items: MenuItem[] }) {
  const [focusIndex, setFocusIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        setFocusIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        setFocusIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        items[focusIndex].onClick();
        break;
    }
  };

  return (
    <ul role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item.id}
          role="menuitem"
          tabIndex={index === focusIndex ? 0 : -1}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

## チェックリスト

### コンポーネント作成時

- [ ] 単一責任の原則に従っているか
- [ ] Props は適切に設計されているか
- [ ] 型定義は正確か
- [ ] テストは書かれているか
- [ ] アクセシビリティは考慮されているか

### コードレビュー時

- [ ] 不要な再レンダリングはないか
- [ ] メモリリークの可能性はないか
- [ ] エラーハンドリングは適切か
- [ ] セキュリティ上の問題はないか
- [ ] パフォーマンスへの影響はないか

### デプロイ前

- [ ] 環境変数は正しく設定されているか
- [ ] バンドルサイズは適切か
- [ ] エラー監視は設定されているか
- [ ] アナリティクスは設定されているか

## まとめ

- **単一責任**: コンポーネントは 1 つのことに集中
- **合成を優先**: Props より合成で柔軟性を確保
- **型安全**: TypeScript で型を明確に
- **パフォーマンス**: 計測してから最適化
- **セキュリティ**: ユーザー入力は常に検証
- **アクセシビリティ**: すべてのユーザーが使えるように

## 確認問題

1. 単一責任の原則とは何ですか？
2. TypeScript でイベントハンドラーの型を定義する方法は？
3. XSS 攻撃を防ぐための React のベストプラクティスは？
4. アクセシビリティのために考慮すべきことは？

## 次のステップ

この React Complete Guide を完了したら、以下のステップを検討してください：

1. **実践プロジェクト**: 学んだことを活かしてアプリケーションを構築
2. **Next.js**: フルスタック開発に進む → [Next.js Complete Guide](../Next.js-Complete-Guide/README.md)
3. **テスト**: テストの習慣を身につける
4. **パフォーマンス**: React DevTools を使って実際のアプリを分析
5. **コミュニティ**: オープンソースへの貢献

---

**React Complete Guide 完了！** 🎉

お疲れさまでした。React の基礎から応用まで学習しました。実践を通じてさらにスキルを磨いていきましょう！
