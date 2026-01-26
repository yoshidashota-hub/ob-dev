# 06 - カスタムフック

## この章で学ぶこと

- カスタムフックの基本概念
- ロジックの抽出と再利用
- よく使われるカスタムフックパターン
- カスタムフックのテスト可能性
- 設計のベストプラクティス

## カスタムフックとは

カスタムフックは、React の組み込み Hooks を組み合わせて作成する再利用可能な関数です。`use` で始まる名前を持ち、他の Hooks を呼び出すことができます。

### なぜカスタムフックを作るのか

1. **ロジックの再利用**: 同じロジックを複数のコンポーネントで使い回せる
2. **関心の分離**: UI とビジネスロジックを分離できる
3. **テスト容易性**: ロジックを独立してテストできる
4. **コードの簡潔化**: コンポーネントがすっきりする

### 基本的な作成方法

```tsx
import { useState, useEffect } from "react";

// カスタムフック: use で始める
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

// 使用例
function ResponsiveComponent() {
  const { width, height } = useWindowSize();

  return (
    <p>
      Window: {width} x {height}
    </p>
  );
}
```

## 実用的なカスタムフック集

### useToggle - 真偽値の切り替え

```tsx
import { useState, useCallback } from "react";

function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}

// 使用例
function Modal() {
  const { value: isOpen, toggle, setFalse: close } = useToggle();

  return (
    <div>
      <button onClick={toggle}>Toggle Modal</button>
      {isOpen && (
        <div className="modal">
          <p>Modal Content</p>
          <button onClick={close}>Close</button>
        </div>
      )}
    </div>
  );
}
```

### useLocalStorage - ローカルストレージとの同期

```tsx
import { useState, useEffect } from "react";

function useLocalStorage<T>(key: string, initialValue: T) {
  // 初期値の読み込み
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // ローカルストレージへの保存
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  // 他のタブとの同期
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key]);

  return [storedValue, setValue] as const;
}

// 使用例
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  return (
    <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
      Current: {theme}
    </button>
  );
}
```

### useFetch - データフェッチング

```tsx
import { useState, useEffect } from "react";

type FetchState<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
};

function useFetch<T>(url: string, options?: RequestInit) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setState({ data, isLoading: false, error: null });
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error,
          }));
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [url]);

  return state;
}

// 使用例
function UserList() {
  const { data, isLoading, error } = useFetch<User[]>("/api/users");

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### useDebounce - 値のデバウンス

```tsx
import { useState, useEffect } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 使用例
function SearchInput() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // API 呼び出し
      console.log("Searching for:", debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### useOnClickOutside - 外側クリック検知

```tsx
import { useEffect, RefObject } from "react";

function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// 使用例
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && (
        <ul className="dropdown-menu">
          <li>Option 1</li>
          <li>Option 2</li>
        </ul>
      )}
    </div>
  );
}
```

### useMediaQuery - メディアクエリ

```tsx
import { useState, useEffect } from "react";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern API
    mediaQuery.addEventListener("change", handler);

    // 初期値の設定
    setMatches(mediaQuery.matches);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// 使用例
function ResponsiveLayout() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  return (
    <div style={{ backgroundColor: isDarkMode ? "#333" : "#fff" }}>
      {isMobile ? <MobileNav /> : <DesktopNav />}
    </div>
  );
}
```

### usePrevious - 前回の値を保持

```tsx
import { useRef, useEffect } from "react";

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// 使用例
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>
        Now: {count}, Before: {prevCount ?? "N/A"}
      </p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
```

### useAsync - 非同期処理の管理

```tsx
import { useState, useCallback } from "react";

type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
};

function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const data = await asyncFunction();
      setState({ data, isLoading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, isLoading: false, error: error as Error });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// 使用例
function SubmitForm() {
  const { data, isLoading, error, execute } = useAsync<{ success: boolean }>();

  const handleSubmit = async () => {
    await execute(async () => {
      const response = await fetch("/api/submit", { method: "POST" });
      return response.json();
    });
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Submitting..." : "Submit"}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data?.success && <p>Submitted successfully!</p>}
    </div>
  );
}
```

### useForm - フォーム管理

```tsx
import { useState, useCallback, ChangeEvent } from "react";

type FormErrors<T> = Partial<Record<keyof T, string>>;
type Validator<T> = (values: T) => FormErrors<T>;

function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate?: Validator<T>,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      const newValue =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({ ...prev, [name]: newValue }));
    },
    [],
  );

  const handleBlur = useCallback(
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);
      }
    },
    [values, validate],
  );

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => Promise<void>) => async (e: React.FormEvent) => {
      e.preventDefault();

      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
  };
}

// 使用例
type LoginForm = {
  email: string;
  password: string;
};

const validateLogin: Validator<LoginForm> = (values) => {
  const errors: FormErrors<LoginForm> = {};
  if (!values.email) errors.email = "Email is required";
  if (!values.password) errors.password = "Password is required";
  if (values.password.length < 8)
    errors.password = "Password must be at least 8 characters";
  return errors;
};

function LoginFormComponent() {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm<LoginForm>({ email: "", password: "" }, validateLogin);

  const onSubmit = async (data: LoginForm) => {
    console.log("Submitting:", data);
    await new Promise((r) => setTimeout(r, 1000));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Email"
        />
        {touched.email && errors.email && (
          <span style={{ color: "red" }}>{errors.email}</span>
        )}
      </div>
      <div>
        <input
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Password"
        />
        {touched.password && errors.password && (
          <span style={{ color: "red" }}>{errors.password}</span>
        )}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

## カスタムフック設計のベストプラクティス

### 1. 単一責任の原則

```tsx
// ❌ 多くのことをしすぎ
function useEverything() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState([]);
  // ...多すぎる
}

// ✅ 単一の責任
function useUser() {
  const [user, setUser] = useState(null);
  // ユーザー関連のロジックのみ
}

function useTheme() {
  const [theme, setTheme] = useState("light");
  // テーマ関連のロジックのみ
}
```

### 2. 適切な戻り値の形式

```tsx
// 単一の値
function useToggle() {
  // return value; // 値だけ
  // return [value, toggle]; // タプル
  return { value, toggle, setTrue, setFalse }; // オブジェクト（推奨）
}

// 配列 vs オブジェクト
// 配列: 順序が重要、名前変更しやすい
const [value, setValue] = useCustomState();

// オブジェクト: 何を返しているか明確、拡張しやすい
const { data, isLoading, error, refetch } = useFetch();
```

### 3. 引数のデフォルト値

```tsx
type Options = {
  delay?: number;
  immediate?: boolean;
};

function useDebounce<T>(value: T, options: Options = {}) {
  const { delay = 300, immediate = false } = options;
  // ...
}

// または
function useDebounce<T>(value: T, delay = 300) {
  // ...
}
```

### 4. クリーンアップの確実な実装

```tsx
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // コールバックを最新に保つ
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // インターバルの設定
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);

    // ✅ クリーンアップを忘れずに
    return () => clearInterval(id);
  }, [delay]);
}
```

## 実践: カスタムフックを組み合わせる

```tsx
// 複数のカスタムフックを組み合わせた実践例
function useProductSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [history, setHistory] = useLocalStorage<string[]>("search-history", []);

  const { data, isLoading, error } = useFetch<Product[]>(
    debouncedSearch ? `/api/products?q=${debouncedSearch}` : null,
  );

  const search = useCallback(
    (term: string) => {
      setSearchTerm(term);
      if (term && !history.includes(term)) {
        setHistory((prev) => [...prev.slice(-9), term]);
      }
    },
    [history, setHistory],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return {
    searchTerm,
    setSearchTerm: search,
    products: data,
    isLoading,
    error,
    history,
    clearHistory,
  };
}

// 使用例
function ProductSearchPage() {
  const {
    searchTerm,
    setSearchTerm,
    products,
    isLoading,
    error,
    history,
    clearHistory,
  } = useProductSearch();

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />

      {history.length > 0 && (
        <div>
          <h4>Recent searches:</h4>
          {history.map((term) => (
            <button key={term} onClick={() => setSearchTerm(term)}>
              {term}
            </button>
          ))}
          <button onClick={clearHistory}>Clear</button>
        </div>
      )}

      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {products && (
        <ul>
          {products.map((product) => (
            <li key={product.id}>{product.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## まとめ

- カスタムフックは `use` で始まる関数で、他の Hooks を呼び出せる
- **単一責任**: 1 つのカスタムフックは 1 つのことに集中
- **再利用性**: 同じロジックを複数のコンポーネントで使い回せる
- **テスト容易性**: UI から分離されているためテストしやすい
- **適切な戻り値**: オブジェクト形式が拡張性が高い
- **クリーンアップ**: リソースのクリーンアップを忘れずに

## 確認問題

1. カスタムフックの命名規則は何ですか？
2. useLocalStorage フックを作成する際の注意点は？
3. カスタムフックを使うメリットを 3 つ挙げてください。
4. 複数のカスタムフックを組み合わせる際の設計の注意点は？

## 次の章

[07 - Context API](./07-Context-API.md) では、Context API を使ったグローバル状態管理の詳細とパターンを学びます。
