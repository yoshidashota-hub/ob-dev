# 12 - テスト

## この章で学ぶこと

- React コンポーネントのテスト戦略
- React Testing Library の基本
- ユーザー操作のテスト
- 非同期処理のテスト
- カスタムフックのテスト

## テストの種類

### テストピラミッド

```
        /\
       /  \    E2E Tests（少数）
      /----\
     /      \  Integration Tests（中程度）
    /--------\
   /          \ Unit Tests（多数）
  /------------\
```

### React でのテスト

- **Unit Tests**: 個別のコンポーネントや関数
- **Integration Tests**: 複数のコンポーネントの連携
- **E2E Tests**: アプリケーション全体のフロー

## セットアップ

### Vitest + React Testing Library

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
```

## React Testing Library の基本

### 基本的なテスト

```tsx
// Button.tsx
type ButtonProps = {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
};

function Button({ onClick, children, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("renders button with text", () => {
    render(<Button onClick={() => {}}>Click me</Button>);

    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <Button onClick={() => {}} disabled>
        Click me
      </Button>
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### クエリの種類

```tsx
import { render, screen } from "@testing-library/react";

// getBy: 要素が存在することを期待（なければエラー）
screen.getByRole("button");
screen.getByText("Hello");
screen.getByLabelText("Username");
screen.getByPlaceholderText("Enter name");
screen.getByTestId("my-element");

// queryBy: 要素が存在しないことをテスト（なければ null）
expect(screen.queryByText("Not found")).toBeNull();

// findBy: 非同期で要素を待つ（Promise を返す）
await screen.findByText("Loaded");

// *AllBy: 複数の要素を取得
screen.getAllByRole("listitem");
```

### クエリの優先順位

1. **getByRole**: アクセシビリティ（推奨）
2. **getByLabelText**: フォーム要素
3. **getByPlaceholderText**: プレースホルダー
4. **getByText**: テキストコンテンツ
5. **getByDisplayValue**: 現在の値
6. **getByAltText**: 画像
7. **getByTitle**: title 属性
8. **getByTestId**: 最終手段

## ユーザー操作のテスト

### userEvent の使用

```tsx
import userEvent from "@testing-library/user-event";

describe("Form", () => {
  it("handles user input", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    // テキスト入力
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    // チェックボックス
    await user.click(screen.getByLabelText("Remember me"));

    // セレクト
    await user.selectOptions(screen.getByLabelText("Role"), "admin");

    // フォーム送信
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      remember: true,
      role: "admin",
    });
  });

  it("clears input", async () => {
    const user = userEvent.setup();

    render(<SearchInput />);

    const input = screen.getByRole("textbox");
    await user.type(input, "hello");
    await user.clear(input);

    expect(input).toHaveValue("");
  });

  it("handles keyboard events", async () => {
    const user = userEvent.setup();

    render(<SearchInput />);

    const input = screen.getByRole("textbox");
    await user.type(input, "hello{enter}");

    // Enter キーで検索が実行される
    expect(screen.getByText("Results for: hello")).toBeInTheDocument();
  });
});
```

## 非同期処理のテスト

### データフェッチングのテスト

```tsx
// UserProfile.tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// UserProfile.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import UserProfile from "./UserProfile";

describe("UserProfile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows loading state initially", () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // 永遠に pending

    render(<UserProfile userId="1" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays user data after loading", async () => {
    const mockUser = { id: "1", name: "Alice", email: "alice@example.com" };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    render(<UserProfile userId="1" />);

    // findBy は自動的に待機する
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("displays error on fetch failure", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
    });

    render(<UserProfile userId="1" />);

    expect(await screen.findByText(/Error:/)).toBeInTheDocument();
  });
});
```

### Mock Service Worker (MSW) の使用

```tsx
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: "Alice",
      email: "alice@example.com",
    });
  }),

  http.post("/api/login", async ({ request }) => {
    const body = await request.json();
    if (body.email === "test@example.com") {
      return HttpResponse.json({ token: "fake-token" });
    }
    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),
];

// src/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// src/test/setup.ts
import { server } from "../mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## カスタムフックのテスト

### renderHook の使用

```tsx
// useCounter.ts
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  return { count, increment, decrement, reset };
}

// useCounter.test.ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import useCounter from "./useCounter";

describe("useCounter", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it("initializes with custom value", () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it("increments count", () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("decrements count", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it("resets count", () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });
});
```

### 非同期フックのテスト

```tsx
// useFetch.ts
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// useFetch.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import useFetch from "./useFetch";

describe("useFetch", () => {
  it("fetches data successfully", async () => {
    const mockData = { id: 1, name: "Test" };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useFetch("/api/data"));

    // 最初は loading
    expect(result.current.loading).toBe(true);

    // データが取得されるまで待機
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });
});
```

## Context のテスト

```tsx
// ThemeContext.tsx
const ThemeContext = createContext<{ theme: string; setTheme: (t: string) => void } | null>(null);

// テスト用ラッパー
function TestWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

// テスト
describe("ThemedComponent", () => {
  it("uses theme from context", () => {
    render(
      <TestWrapper>
        <ThemedComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });
});

// カスタム render 関数
function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: TestWrapper,
    ...options,
  });
}
```

## スナップショットテスト

```tsx
import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import Card from "./Card";

it("matches snapshot", () => {
  const { container } = render(
    <Card title="Test Card" description="This is a test" />
  );

  expect(container).toMatchSnapshot();
});

// インラインスナップショット
it("matches inline snapshot", () => {
  const { container } = render(<Button>Click me</Button>);

  expect(container.innerHTML).toMatchInlineSnapshot(`
    "<button>Click me</button>"
  `);
});
```

## 実践: Todo アプリのテスト

```tsx
// TodoApp.tsx
type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: crypto.randomUUID(), text: input.trim(), completed: false }]);
      setInput("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div>
      <h1>Todo App</h1>

      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a todo..."
          aria-label="New todo"
        />
        <button onClick={addTodo}>Add</button>
      </div>

      {todos.length === 0 ? (
        <p>No todos yet</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                aria-label={`Mark "${todo.text}" as ${todo.completed ? "incomplete" : "complete"}`}
              />
              <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)} aria-label={`Delete "${todo.text}"`}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <p>{todos.filter((t) => !t.completed).length} items left</p>
    </div>
  );
}

// TodoApp.test.tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import TodoApp from "./TodoApp";

describe("TodoApp", () => {
  it("renders empty state", () => {
    render(<TodoApp />);

    expect(screen.getByText("No todos yet")).toBeInTheDocument();
    expect(screen.getByText("0 items left")).toBeInTheDocument();
  });

  it("adds a new todo", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("1 items left")).toBeInTheDocument();
    expect(screen.queryByText("No todos yet")).not.toBeInTheDocument();
  });

  it("adds todo with Enter key", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk{enter}");

    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("does not add empty todo", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("No todos yet")).toBeInTheDocument();
  });

  it("toggles todo completion", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk{enter}");

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText("0 items left")).toBeInTheDocument();

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(screen.getByText("1 items left")).toBeInTheDocument();
  });

  it("deletes a todo", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk{enter}");
    await user.click(screen.getByRole("button", { name: 'Delete "Buy milk"' }));

    expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
    expect(screen.getByText("No todos yet")).toBeInTheDocument();
  });

  it("manages multiple todos", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    await user.type(screen.getByLabelText("New todo"), "Buy milk{enter}");
    await user.type(screen.getByLabelText("New todo"), "Clean room{enter}");
    await user.type(screen.getByLabelText("New todo"), "Do homework{enter}");

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("3 items left")).toBeInTheDocument();

    // 最初のタスクを完了
    await user.click(screen.getByLabelText('Mark "Buy milk" as complete'));

    expect(screen.getByText("2 items left")).toBeInTheDocument();
  });
});
```

## まとめ

- **React Testing Library** はユーザー視点でのテストを推奨
- **getByRole** を優先的に使用してアクセシビリティを確保
- **userEvent** でリアルなユーザー操作をシミュレート
- **findBy** / **waitFor** で非同期処理を待機
- **renderHook** でカスタムフックをテスト
- **MSW** で API をモック

## 確認問題

1. getBy と findBy の違いは何ですか？
2. userEvent と fireEvent の違いは何ですか？
3. カスタムフックをテストする際の注意点は？
4. テストで Context を使用するコンポーネントをテストする方法は？

## 次の章

[13 - パターン](./13-Patterns.md) では、React の設計パターンについて学びます。
