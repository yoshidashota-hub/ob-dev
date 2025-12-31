# 15 - Real World Examples

## 概要

TypeScript を実際のプロジェクトで活用する方法を学びます。Web アプリケーション、API サーバー、ライブラリ開発など、様々なユースケースでの実践的な例を通じて理解を深めます。

## 学習目標

- [ ] React アプリケーションでの TypeScript 活用を理解できる
- [ ] Node.js API での型安全な実装ができる
- [ ] ライブラリ開発での型定義を作成できる
- [ ] 実践的な型パターンを適用できる

## React アプリケーション

### コンポーネントの型定義

```typescript
import { ReactNode, FC } from "react";

// Props の型定義
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

// 関数コンポーネント
export const Button: FC<ButtonProps> = ({
  variant = "primary",
  size = "medium",
  disabled = false,
  onClick,
  children,
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// または明示的な戻り値
export function Button(props: ButtonProps): JSX.Element {
  const { variant = "primary", size = "medium", disabled, onClick, children } =
    props;
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### ジェネリックコンポーネント

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
}

export function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = "No items",
}: ListProps<T>): JSX.Element {
  if (items.length === 0) {
    return <div className="empty">{emptyMessage}</div>;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// 使用例
interface User {
  id: number;
  name: string;
}

function UserList({ users }: { users: User[] }) {
  return (
    <List
      items={users}
      keyExtractor={(user) => user.id}
      renderItem={(user) => <span>{user.name}</span>}
    />
  );
}
```

### カスタムフック

```typescript
import { useState, useEffect, useCallback } from "react";

// 汎用的なフェッチフック
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// 使用例
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useFetch<User>(`/api/users/${userId}`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>User not found</div>;

  return <div>{user.name}</div>;
}
```

### フォーム管理

```typescript
import { useState, ChangeEvent, FormEvent } from "react";

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
}

interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (onSubmit: (values: T) => void) => (e: FormEvent) => void;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string) => void;
  reset: () => void;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate?: (values: T) => Partial<Record<keyof T, string>>
): UseFormResult<T> {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [name]: true },
    }));
  };

  const handleSubmit =
    (onSubmit: (values: T) => void) => (e: FormEvent) => {
      e.preventDefault();
      const errors = validate?.(state.values) ?? {};
      if (Object.keys(errors).length === 0) {
        onSubmit(state.values);
      } else {
        setState((prev) => ({ ...prev, errors }));
      }
    };

  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [field]: value },
    }));
  };

  const setFieldError = <K extends keyof T>(field: K, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  };

  const reset = () => {
    setState({ values: initialValues, errors: {}, touched: {} });
  };

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    reset,
  };
}

// 使用例
interface LoginForm {
  email: string;
  password: string;
}

function LoginPage() {
  const { values, errors, handleChange, handleSubmit } = useForm<LoginForm>(
    { email: "", password: "" },
    (values) => {
      const errors: Partial<Record<keyof LoginForm, string>> = {};
      if (!values.email) errors.email = "Email is required";
      if (!values.password) errors.password = "Password is required";
      return errors;
    }
  );

  return (
    <form onSubmit={handleSubmit((values) => console.log(values))}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
      />
      {errors.email && <span>{errors.email}</span>}

      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
      />
      {errors.password && <span>{errors.password}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

## Node.js API サーバー

### Express + TypeScript

```typescript
import express, { Request, Response, NextFunction } from "express";

// リクエスト/レスポンスの型
interface CreateUserRequest {
  name: string;
  email: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 型付きリクエストハンドラ
type TypedRequest<T = any> = Request<any, any, T>;
type TypedResponse<T = any> = Response<ApiResponse<T>>;

// ミドルウェア
function asyncHandler<T>(
  fn: (req: Request, res: Response) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

// エラーハンドラ
interface AppError extends Error {
  statusCode?: number;
}

function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    success: false,
    error: err.message,
  });
}

// ルートハンドラ
const app = express();
app.use(express.json());

app.post(
  "/api/users",
  asyncHandler(
    async (
      req: TypedRequest<CreateUserRequest>,
      res: TypedResponse<User>
    ) => {
      const { name, email } = req.body;

      const user: User = {
        id: crypto.randomUUID(),
        name,
        email,
        createdAt: new Date(),
      };

      res.status(201).json({
        success: true,
        data: user,
      });
    }
  )
);

app.use(errorHandler);
```

### バリデーション with Zod

```typescript
import { z } from "zod";

// スキーマ定義
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(["admin", "user", "guest"]).default("user"),
});

// 型を自動生成
type User = z.infer<typeof UserSchema>;

// 作成用スキーマ
const CreateUserSchema = UserSchema.omit({ id: true });
type CreateUserInput = z.infer<typeof CreateUserSchema>;

// 更新用スキーマ
const UpdateUserSchema = CreateUserSchema.partial();
type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// バリデーションミドルウェア
function validate<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: result.error.errors,
      });
    }
    req.body = result.data;
    next();
  };
}

// 使用例
app.post(
  "/api/users",
  validate(CreateUserSchema),
  asyncHandler(async (req, res) => {
    const input: CreateUserInput = req.body;
    // input は検証済み
  })
);
```

### リポジトリパターン

```typescript
// エンティティ
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// リポジトリインターフェース
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

// メモリ実装
class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async create(
    data: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    const now = new Date();
    const user: User = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated: User = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
}

// サービス層
class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User", id);
    }
    return user;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email already in use");
    }
    return this.userRepository.create(input);
  }
}
```

## ライブラリ開発

### 型定義の公開

```typescript
// types/index.ts
export interface Config {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type Result<T, E = ApiError> =
  | { success: true; data: T }
  | { success: false; error: E };

// index.ts
export { Config, User, ApiError, Result } from "./types";
export { Client } from "./client";
export { createClient } from "./factory";
```

### ビルダーパターン

```typescript
interface QueryOptions {
  select?: string[];
  where?: Record<string, unknown>;
  orderBy?: { field: string; direction: "asc" | "desc" };
  limit?: number;
  offset?: number;
}

class QueryBuilder<T> {
  private options: QueryOptions = {};

  select(...fields: (keyof T)[]): this {
    this.options.select = fields as string[];
    return this;
  }

  where(conditions: Partial<T>): this {
    this.options.where = conditions as Record<string, unknown>;
    return this;
  }

  orderBy(field: keyof T, direction: "asc" | "desc" = "asc"): this {
    this.options.orderBy = { field: field as string, direction };
    return this;
  }

  limit(count: number): this {
    this.options.limit = count;
    return this;
  }

  offset(count: number): this {
    this.options.offset = count;
    return this;
  }

  build(): QueryOptions {
    return { ...this.options };
  }

  async execute(): Promise<T[]> {
    // 実際のクエリ実行
    const query = this.build();
    // ...
    return [];
  }
}

// 使用例
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const query = new QueryBuilder<Product>()
  .select("id", "name", "price")
  .where({ category: "electronics" })
  .orderBy("price", "desc")
  .limit(10);

const products = await query.execute();
```

### プラグインシステム

```typescript
// プラグインインターフェース
interface Plugin<TContext = any> {
  name: string;
  version: string;
  install(context: TContext): void;
  uninstall?(context: TContext): void;
}

// プラグインマネージャー
class PluginManager<TContext> {
  private plugins: Map<string, Plugin<TContext>> = new Map();

  constructor(private context: TContext) {}

  register(plugin: Plugin<TContext>): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    plugin.install(this.context);
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.uninstall?.(this.context);
      this.plugins.delete(name);
    }
  }

  get(name: string): Plugin<TContext> | undefined {
    return this.plugins.get(name);
  }
}

// 使用例
interface AppContext {
  router: Router;
  store: Store;
  logger: Logger;
}

const authPlugin: Plugin<AppContext> = {
  name: "auth",
  version: "1.0.0",
  install(context) {
    context.router.addMiddleware(authMiddleware);
    context.store.registerModule("auth", authModule);
  },
  uninstall(context) {
    context.router.removeMiddleware(authMiddleware);
    context.store.unregisterModule("auth");
  },
};
```

## 状態管理

### イベントエミッター

```typescript
type EventHandler<T = any> = (data: T) => void;

class TypedEventEmitter<Events extends Record<string, any>> {
  private handlers: Map<keyof Events, Set<EventHandler>> = new Map();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }

  once<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>
  ): void {
    const onceHandler: EventHandler<Events[K]> = (data) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }
}

// 使用例
interface AppEvents {
  userLogin: { userId: string; timestamp: Date };
  userLogout: { userId: string };
  error: { code: string; message: string };
}

const events = new TypedEventEmitter<AppEvents>();

events.on("userLogin", ({ userId, timestamp }) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

events.emit("userLogin", {
  userId: "123",
  timestamp: new Date(),
});
```

### ストアパターン

```typescript
type Listener<T> = (state: T) => void;

interface Store<T> {
  getState(): T;
  setState(updater: (state: T) => T): void;
  subscribe(listener: Listener<T>): () => void;
}

function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<Listener<T>>();

  return {
    getState() {
      return state;
    },

    setState(updater) {
      state = updater(state);
      listeners.forEach((listener) => listener(state));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// 使用例
interface AppState {
  user: User | null;
  theme: "light" | "dark";
  notifications: Notification[];
}

const store = createStore<AppState>({
  user: null,
  theme: "light",
  notifications: [],
});

// 購読
const unsubscribe = store.subscribe((state) => {
  console.log("State updated:", state);
});

// 更新
store.setState((state) => ({
  ...state,
  theme: "dark",
}));

// 購読解除
unsubscribe();
```

## API クライアント

### 型安全な HTTP クライアント

```typescript
// API エンドポイントの型定義
interface ApiEndpoints {
  "GET /users": {
    response: User[];
  };
  "GET /users/:id": {
    params: { id: string };
    response: User;
  };
  "POST /users": {
    body: CreateUserInput;
    response: User;
  };
  "PUT /users/:id": {
    params: { id: string };
    body: UpdateUserInput;
    response: User;
  };
  "DELETE /users/:id": {
    params: { id: string };
    response: void;
  };
}

// 型ヘルパー
type ExtractParams<T extends string> = T extends `${infer _Method} ${infer Path}`
  ? Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractParams<`GET /${Rest}`>
    : Path extends `${infer _Start}:${infer Param}`
      ? { [K in Param]: string }
      : {}
  : {};

// クライアント
class ApiClient {
  constructor(private baseUrl: string) {}

  async request<K extends keyof ApiEndpoints>(
    endpoint: K,
    options?: {
      params?: ApiEndpoints[K] extends { params: infer P } ? P : never;
      body?: ApiEndpoints[K] extends { body: infer B } ? B : never;
    }
  ): Promise<ApiEndpoints[K]["response"]> {
    const [method, path] = (endpoint as string).split(" ");
    let url = `${this.baseUrl}${path}`;

    // パラメータを置換
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url = url.replace(`:${key}`, String(value));
      }
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }
}

// 使用例
const api = new ApiClient("https://api.example.com");

// 型安全な API 呼び出し
const users = await api.request("GET /users");
const user = await api.request("GET /users/:id", { params: { id: "123" } });
const newUser = await api.request("POST /users", {
  body: { name: "Alice", email: "alice@example.com" },
});
```

## まとめ

- **React**: コンポーネント、フック、フォームの型付け
- **Node.js**: Express ハンドラ、バリデーション、リポジトリパターン
- **ライブラリ**: 型定義の公開、ビルダー、プラグインシステム
- **状態管理**: イベントエミッター、ストアパターン
- **API クライアント**: 型安全な HTTP リクエスト

## 演習問題

1. **React**: ジェネリックな Table コンポーネントを実装してください
2. **API**: Zod を使った完全な CRUD API を実装してください
3. **ライブラリ**: 型安全なイベントバスを実装してください
4. **状態管理**: ミドルウェアをサポートするストアを実装してください

## 次のステップ

次の章では、JavaScript から TypeScript への移行について学びます。

⬅️ 前へ: [14-Best-Practices.md](./14-Best-Practices.md)
➡️ 次へ: [16-Migration-Guide.md](./16-Migration-Guide.md)
