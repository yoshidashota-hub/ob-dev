# 04 - 基本的な Hooks

## この章で学ぶこと

- Hooks の基本概念とルール
- useState の詳細な使い方
- useEffect の使い方と依存配列
- useRef の使い方
- クリーンアップ関数の重要性

## Hooks とは

Hooks は React 16.8 で導入された機能で、関数コンポーネントで State やライフサイクルなどの機能を使えるようにします。

### Hooks のルール

1. **トップレベルでのみ呼び出す**: ループ、条件分岐、ネストした関数の中で呼び出さない
2. **React 関数内でのみ呼び出す**: 関数コンポーネントまたはカスタムフック内で呼び出す

```tsx
function Example() {
  // ✅ 正しい: トップレベルで呼び出し
  const [count, setCount] = useState(0);

  // ❌ 間違い: 条件分岐の中
  if (count > 0) {
    const [other, setOther] = useState(0); // エラー！
  }

  // ❌ 間違い: ループの中
  for (let i = 0; i < 3; i++) {
    useEffect(() => {}); // エラー！
  }

  return <div>{count}</div>;
}
```

## useState 詳細

### 基本的な使い方

```tsx
import { useState } from "react";

function Counter() {
  // [現在の値, 更新関数] = useState(初期値)
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

### 遅延初期化

初期値の計算が重い場合、関数を渡すことで初回レンダリング時のみ実行されます。

```tsx
// ❌ 毎回 expensive な計算が実行される
const [state, setState] = useState(expensiveComputation());

// ✅ 初回レンダリング時のみ実行
const [state, setState] = useState(() => expensiveComputation());

// 実例: localStorage からの読み込み
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  return [value, setValue] as const;
}
```

### 複数の State の管理

```tsx
function UserForm() {
  // 方法 1: 個別の State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(0);

  // 方法 2: オブジェクトで管理
  const [user, setUser] = useState({
    name: "",
    email: "",
    age: 0,
  });

  // オブジェクトの更新
  const updateUser = (field: string, value: string | number) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <input
        value={user.name}
        onChange={(e) => updateUser("name", e.target.value)}
      />
    </div>
  );
}
```

### State 更新のバッチ処理

React 18 以降、複数の State 更新は自動的にバッチ処理されます。

```tsx
function BatchingExample() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleClick = () => {
    // これらは 1 回の再レンダリングにまとめられる
    setCount((c) => c + 1);
    setFlag((f) => !f);
  };

  // 非同期処理内でもバッチ処理される（React 18+）
  const handleAsyncClick = async () => {
    await someAsyncOperation();
    setCount((c) => c + 1);
    setFlag((f) => !f);
    // 1 回の再レンダリング
  };

  return <button onClick={handleClick}>Update</button>;
}
```

## useEffect 詳細

`useEffect` は副作用（データフェッチ、購読、DOM 操作など）を処理するための Hook です。

### 基本的な構文

```tsx
import { useEffect } from "react";

useEffect(() => {
  // 副作用の処理
  return () => {
    // クリーンアップ（オプション）
  };
}, [依存配列]);
```

### 依存配列のパターン

```tsx
function EffectPatterns({ userId }: { userId: number }) {
  // 1. 毎回実行（依存配列なし）
  useEffect(() => {
    console.log("Every render");
  });

  // 2. マウント時のみ（空の依存配列）
  useEffect(() => {
    console.log("Mount only");
  }, []);

  // 3. 依存値が変わった時（依存配列あり）
  useEffect(() => {
    console.log("userId changed:", userId);
  }, [userId]);

  return <div>User: {userId}</div>;
}
```

### データフェッチング

```tsx
import { useState, useEffect } from "react";

type User = {
  id: number;
  name: string;
  email: string;
};

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // フラグで古いリクエストの結果を無視
    let isSubscribed = true;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        // コンポーネントがまだマウントされているか確認
        if (isSubscribed) {
          setUser(data);
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    // クリーンアップ: コンポーネントのアンマウント時に実行
    return () => {
      isSubscribed = false;
    };
  }, [userId]); // userId が変わるたびに再フェッチ

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return <p>User not found</p>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### AbortController によるリクエストのキャンセル

```tsx
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/data/${id}`, {
        signal: controller.signal,
      });
      const data = await response.json();
      setData(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Fetch aborted");
      } else {
        setError(err);
      }
    }
  };

  fetchData();

  return () => {
    controller.abort(); // リクエストをキャンセル
  };
}, [id]);
```

### イベントリスナーの登録

```tsx
function WindowSize() {
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

    // イベントリスナーを登録
    window.addEventListener("resize", handleResize);

    // クリーンアップ: イベントリスナーを解除
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // 空の依存配列: マウント時に 1 回だけ登録

  return (
    <p>
      Window: {size.width} x {size.height}
    </p>
  );
}
```

### タイマーの設定

```tsx
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // クリーンアップ: タイマーを解除
    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]); // isRunning が変わるたびに再設定

  return (
    <div>
      <p>Seconds: {seconds}</p>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? "Stop" : "Start"}
      </button>
      <button onClick={() => setSeconds(0)}>Reset</button>
    </div>
  );
}
```

### 依存配列の注意点

```tsx
function DependencyExample({ onSubmit }: { onSubmit: (data: string) => void }) {
  const [value, setValue] = useState("");

  // ❌ 問題: onSubmit が毎回変わると無限ループの可能性
  useEffect(() => {
    onSubmit(value);
  }, [value, onSubmit]);

  // ✅ 解決策 1: useCallback で親のコールバックをメモ化
  // 親コンポーネントで: const handleSubmit = useCallback(..., []);

  // ✅ 解決策 2: useEffect 内で ref を使う
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  });

  useEffect(() => {
    onSubmitRef.current(value);
  }, [value]);

  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

## useRef

`useRef` は、再レンダリングを引き起こさない可変な値を保持するための Hook です。

### DOM 要素への参照

```tsx
import { useRef, useEffect } from "react";

function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // マウント時に自動フォーカス
    inputRef.current?.focus();
  }, []);

  const handleClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={handleClick}>Focus Input</button>
    </div>
  );
}
```

### 値の保持（再レンダリングなし）

```tsx
function StopWatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = window.setInterval(() => {
        setTime((t) => t + 10);
      }, 10);
    }
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
    }
  };

  const reset = () => {
    stop();
    setTime(0);
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <p style={{ fontSize: "48px", fontFamily: "monospace" }}>
        {formatTime(time)}
      </p>
      <button onClick={start} disabled={isRunning}>
        Start
      </button>
      <button onClick={stop} disabled={!isRunning}>
        Stop
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### 前回の値を保持

```tsx
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
        Current: {count}, Previous: {prevCount ?? "N/A"}
      </p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

### ref のコールバック形式

```tsx
function MeasureElement() {
  const [height, setHeight] = useState(0);

  // コールバック ref: 要素が DOM に追加/削除されたときに呼ばれる
  const measuredRef = (node: HTMLDivElement | null) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  };

  return (
    <div>
      <div
        ref={measuredRef}
        style={{ padding: "20px", backgroundColor: "#f0f0f0" }}
      >
        <p>Some content here</p>
        <p>More content</p>
      </div>
      <p>Height: {height}px</p>
    </div>
  );
}
```

## useEffect のベストプラクティス

### 1. Effect は「何をするか」で分割する

```tsx
// ❌ 1 つの Effect で複数の処理
useEffect(() => {
  // ユーザーデータのフェッチ
  fetchUser(userId);
  // アナリティクスの追跡
  trackPageView();
  // タイトルの更新
  document.title = `User ${userId}`;
}, [userId]);

// ✅ 処理ごとに Effect を分割
useEffect(() => {
  fetchUser(userId);
}, [userId]);

useEffect(() => {
  trackPageView();
}, []);

useEffect(() => {
  document.title = `User ${userId}`;
}, [userId]);
```

### 2. 不要な Effect を避ける

```tsx
function Form({ items }: { items: Item[] }) {
  // ❌ 派生状態を Effect で計算
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  useEffect(() => {
    setFilteredItems(items.filter((item) => item.active));
  }, [items]);

  // ✅ レンダリング中に計算
  const filteredItems = items.filter((item) => item.active);

  // ❌ イベントハンドラーで済む処理を Effect で行う
  useEffect(() => {
    if (submitted) {
      submitForm();
    }
  }, [submitted]);

  // ✅ イベントハンドラーで処理
  const handleSubmit = () => {
    submitForm();
  };

  return <div>{/* ... */}</div>;
}
```

### 3. 適切なクリーンアップ

```tsx
function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();

    // ✅ クリーンアップで接続を解除
    return () => {
      connection.disconnect();
    };
  }, [roomId]);

  return <div>Chat Room: {roomId}</div>;
}
```

## 実践: カスタム Hook の作成

学んだ Hooks を組み合わせてカスタム Hook を作成します。

```tsx
import { useState, useEffect, useRef } from "react";

// デバウンスされた値を返す Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ローカルストレージと同期する Hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

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

  return [storedValue, setValue] as const;
}

// オンラインステータスを監視する Hook
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

// 使用例
function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [theme, setTheme] = useLocalStorage("theme", "light");
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (debouncedSearch) {
      console.log("Searching for:", debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <div
      style={{
        backgroundColor: theme === "dark" ? "#333" : "#fff",
        color: theme === "dark" ? "#fff" : "#333",
      }}
    >
      <p>Status: {isOnline ? "Online" : "Offline"}</p>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>
    </div>
  );
}

export default App;
```

## まとめ

- **Hooks のルール**: トップレベルで、React 関数内でのみ呼び出す
- **useState**: State の管理、遅延初期化、関数型更新
- **useEffect**: 副作用の処理、依存配列でタイミング制御
- **useRef**: DOM 参照、再レンダリングなしの値保持
- **クリーンアップ**: メモリリーク防止のため必ず実装
- Effect は「何をするか」で分割し、不要な Effect は避ける

## 確認問題

1. Hooks の 2 つの基本ルールは何ですか？
2. useEffect の依存配列が空の場合と省略した場合の違いは？
3. useRef と useState の違いは何ですか？
4. クリーンアップ関数が必要なケースを 3 つ挙げてください。

## 次の章

[05 - 高度な Hooks](./05-Advanced-Hooks.md) では、useReducer、useContext などの高度な Hooks について学びます。
