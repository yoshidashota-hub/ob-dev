# 13 - 設計パターン

## この章で学ぶこと

- React での一般的な設計パターン
- コンポーネントの分類と責務
- 合成パターン
- レンダープロップとカスタムフック
- 状態の持ち上げとコロケーション

## コンポーネントの分類

### Presentational vs Container

```tsx
// Presentational Component（見た目に集中）
type UserCardProps = {
  name: string;
  email: string;
  avatarUrl: string;
  onEdit: () => void;
};

function UserCard({ name, email, avatarUrl, onEdit }: UserCardProps) {
  return (
    <div className="user-card">
      <img src={avatarUrl} alt={name} />
      <h2>{name}</h2>
      <p>{email}</p>
      <button onClick={onEdit}>Edit</button>
    </div>
  );
}

// Container Component（ロジックに集中）
function UserCardContainer({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  if (!user) return <UserCardSkeleton />;

  return (
    <UserCard
      name={user.name}
      email={user.email}
      avatarUrl={user.avatarUrl}
      onEdit={() => navigate(`/users/${userId}/edit`)}
    />
  );
}
```

### 現代的なアプローチ：カスタムフック

```tsx
// ロジックをフックに抽出
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading };
}

// コンポーネントはシンプルに
function UserProfile({ userId }: { userId: string }) {
  const { user, loading } = useUser(userId);

  if (loading) return <Skeleton />;
  if (!user) return <NotFound />;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## Compound Components パターン

関連するコンポーネントを組み合わせて使うパターンです。

### 基本的な実装

```tsx
import { createContext, useContext, useState, ReactNode } from "react";

// Context
type TabsContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Must be used within Tabs");
  return context;
}

// Root Component
function Tabs({
  children,
  defaultTab,
}: {
  children: ReactNode;
  defaultTab: string;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

// Tab List
function TabList({ children }: { children: ReactNode }) {
  return (
    <div className="tab-list" role="tablist">
      {children}
    </div>
  );
}

// Tab Button
function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useTabsContext();

  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
      className={activeTab === value ? "active" : ""}
    >
      {children}
    </button>
  );
}

// Tab Panel
function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <div role="tabpanel" className="tab-panel">
      {children}
    </div>
  );
}

// 名前空間としてエクスポート
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// 使用例
function App() {
  return (
    <Tabs defaultTab="profile">
      <Tabs.List>
        <Tabs.Tab value="profile">Profile</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
        <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="profile">
        <ProfileContent />
      </Tabs.Panel>
      <Tabs.Panel value="settings">
        <SettingsContent />
      </Tabs.Panel>
      <Tabs.Panel value="notifications">
        <NotificationsContent />
      </Tabs.Panel>
    </Tabs>
  );
}
```

## Render Props パターン

```tsx
// Render Props を使ったマウス位置追跡
type MousePosition = { x: number; y: number };

function MouseTracker({
  render,
}: {
  render: (position: MousePosition) => ReactNode;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return <>{render(position)}</>;
}

// 使用例
function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <div>
          Mouse position: ({x}, {y})
        </div>
      )}
    />
  );
}

// children as function パターン
function Toggle({
  children,
}: {
  children: (props: { on: boolean; toggle: () => void }) => ReactNode;
}) {
  const [on, setOn] = useState(false);
  const toggle = () => setOn((prev) => !prev);

  return <>{children({ on, toggle })}</>;
}

// 使用例
<Toggle>
  {({ on, toggle }) => <button onClick={toggle}>{on ? "ON" : "OFF"}</button>}
</Toggle>;
```

### カスタムフックへの移行

```tsx
// Render Props の代わりにカスタムフック
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return position;
}

// 使用例（よりシンプル）
function App() {
  const { x, y } = useMousePosition();
  return (
    <div>
      Mouse: ({x}, {y})
    </div>
  );
}
```

## Higher-Order Components (HOC)

```tsx
// 認証 HOC
function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" />;

    return <WrappedComponent {...props} />;
  };
}

// 使用例
const ProtectedDashboard = withAuth(Dashboard);

// ロギング HOC
function withLogging<P extends object>(
  WrappedComponent: ComponentType<P>,
  componentName: string,
) {
  return function LoggedComponent(props: P) {
    useEffect(() => {
      console.log(`${componentName} mounted`);
      return () => console.log(`${componentName} unmounted`);
    }, []);

    useEffect(() => {
      console.log(`${componentName} props:`, props);
    }, [props]);

    return <WrappedComponent {...props} />;
  };
}
```

### HOC vs Hooks

```tsx
// HOC: コンポーネントをラップ
const EnhancedComponent = withAuth(withLogging(Component, "Component"));

// Hooks: コンポーネント内でロジックを使用（推奨）
function Component() {
  const { user } = useAuth();
  useLogging("Component");

  if (!user) return <Navigate to="/login" />;
  return <div>...</div>;
}
```

## Controlled vs Uncontrolled

### Controlled Component

```tsx
// 親が状態を制御
function ControlledInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}

function Form() {
  const [name, setName] = useState("");

  return (
    <form>
      <ControlledInput value={name} onChange={setName} />
      <p>Current value: {name}</p>
    </form>
  );
}
```

### Uncontrolled Component

```tsx
// コンポーネント内部で状態を管理
function UncontrolledInput({
  defaultValue,
  onBlur,
}: {
  defaultValue?: string;
  onBlur?: (v: string) => void;
}) {
  return (
    <input
      defaultValue={defaultValue}
      onBlur={(e) => onBlur?.(e.target.value)}
    />
  );
}
```

### Hybrid: 制御可能なコンポーネント

```tsx
// 両方のモードをサポート
type InputProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

function FlexibleInput({ value, defaultValue, onChange }: InputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");

  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return <input value={currentValue} onChange={handleChange} />;
}
```

## State Colocation（状態のコロケーション）

状態は、それを使用するコンポーネントにできるだけ近い場所に配置します。

```tsx
// ❌ 不必要に高い位置に状態を持つ
function App() {
  const [searchQuery, setSearchQuery] = useState(""); // 👎 App 全体で必要ない

  return (
    <div>
      <Header />
      <SearchBar query={searchQuery} setQuery={setSearchQuery} />
      <ProductList />
      <Footer />
    </div>
  );
}

// ✅ 状態を使用する場所に配置
function App() {
  return (
    <div>
      <Header />
      <SearchSection /> {/* 状態をここに含める */}
      <Footer />
    </div>
  );
}

function SearchSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);

  // 検索ロジック

  return (
    <div>
      <SearchBar query={searchQuery} setQuery={setSearchQuery} />
      <SearchResults results={results} />
    </div>
  );
}
```

## Provider パターン

```tsx
// 複数の Provider を組み合わせる
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Provider Composer（複数のプロバイダーを簡潔に）
type Provider = ComponentType<{ children: ReactNode }>;

function composeProviders(...providers: Provider[]) {
  return ({ children }: { children: ReactNode }) =>
    providers.reduceRight(
      (child, Provider) => <Provider>{child}</Provider>,
      children,
    );
}

const AppProviders = composeProviders(
  QueryClientProvider,
  ThemeProvider,
  AuthProvider,
  ToastProvider,
);
```

## Slot パターン

```tsx
// 名前付きスロット
type CardProps = {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

function Card({ header, children, footer }: CardProps) {
  return (
    <div className="card">
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// 使用例
<Card header={<h2>Title</h2>} footer={<button>Action</button>}>
  <p>Content goes here</p>
</Card>;
```

## Polymorphic Component

```tsx
// 動的なコンポーネントタイプ
type BoxProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & ComponentPropsWithoutRef<T>;

function Box<T extends ElementType = "div">({ as, children, ...props }: BoxProps<T>) {
  const Component = as || "div";
  return <Component {...props}>{children}</Component>;
}

// 使用例
<Box as="article" className="content">
  <Box as="h1">Title</Box>
  <Box as="p">Paragraph</Box>
</Box>

<Box as="button" onClick={() => {}}>
  Click me
</Box>

<Box as={Link} to="/home">
  Go Home
</Box>
```

## 実践: フレキシブルなフォームコンポーネント

```tsx
import { createContext, useContext, ReactNode, forwardRef } from "react";

// Form Context
type FormContextType = {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setFieldValue: (name: string, value: any) => void;
  setFieldTouched: (name: string) => void;
};

const FormContext = createContext<FormContextType | null>(null);

function useFormContext() {
  const context = useContext(FormContext);
  if (!context) throw new Error("Must be used within Form");
  return context;
}

// Form
type FormProps = {
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  validate?: (values: Record<string, any>) => Record<string, string>;
  children: ReactNode;
};

function Form({ initialValues, onSubmit, validate, children }: FormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (validate) {
      const newErrors = validate({ ...values, [name]: value });
      setErrors(newErrors);
    }
  };

  const setFieldTouched = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;
    }
    onSubmit(values);
  };

  return (
    <FormContext.Provider
      value={{ values, errors, touched, setFieldValue, setFieldTouched }}
    >
      <form onSubmit={handleSubmit}>{children}</form>
    </FormContext.Provider>
  );
}

// Field
type FieldProps = {
  name: string;
  label: string;
  type?: string;
};

function Field({ name, label, type = "text" }: FieldProps) {
  const { values, errors, touched, setFieldValue, setFieldTouched } =
    useFormContext();

  const showError = touched[name] && errors[name];

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={values[name] || ""}
        onChange={(e) => setFieldValue(name, e.target.value)}
        onBlur={() => setFieldTouched(name)}
        aria-invalid={showError ? "true" : "false"}
      />
      {showError && <span className="error">{errors[name]}</span>}
    </div>
  );
}

// Submit Button
function SubmitButton({ children }: { children: ReactNode }) {
  return <button type="submit">{children}</button>;
}

// Compound Component として公開
Form.Field = Field;
Form.Submit = SubmitButton;

// 使用例
function ContactForm() {
  const validate = (values: Record<string, any>) => {
    const errors: Record<string, string> = {};
    if (!values.email) errors.email = "Email is required";
    if (!values.message) errors.message = "Message is required";
    return errors;
  };

  return (
    <Form
      initialValues={{ email: "", message: "" }}
      onSubmit={(values) => console.log(values)}
      validate={validate}
    >
      <Form.Field name="email" label="Email" type="email" />
      <Form.Field name="message" label="Message" />
      <Form.Submit>Send</Form.Submit>
    </Form>
  );
}
```

## まとめ

- **Compound Components**: 関連コンポーネントを柔軟に組み合わせ
- **Render Props**: レンダリングロジックを外部から注入（現在は Hooks が主流）
- **HOC**: コンポーネントを拡張（現在は Hooks が主流）
- **Controlled/Uncontrolled**: 状態の制御方法を選択可能に
- **State Colocation**: 状態は使用する場所に近く配置
- **Polymorphic Components**: 動的なレンダリング要素

## 確認問題

1. Compound Components パターンの利点は何ですか？
2. カスタムフックが Render Props や HOC より優れている点は？
3. State Colocation とは何ですか？
4. Polymorphic Component はどのような場面で役立ちますか？

## 次の章

[14 - ベストプラクティス](./14-Best-Practices.md) では、React 開発のベストプラクティスをまとめます。
