# 06 - Client Components

## 概要

この章では、Client Components について詳しく学びます。インタラクティブな UI、状態管理、ブラウザ API の使用など、クライアントサイドで必要な機能を実装する方法を解説します。

## Client Components とは

### 定義

Client Components はクライアント（ブラウザ）でレンダリングされるコンポーネントです。`"use client"` ディレクティブを使って宣言します。

```typescript
"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### いつ Client Components を使うか

| 機能                   | Server Component | Client Component |
| ---------------------- | ---------------- | ---------------- |
| データフェッチ         | ✅               | ⚠️（useEffect）  |
| バックエンドリソース   | ✅               | ❌               |
| 機密情報               | ✅               | ❌               |
| useState / useReducer  | ❌               | ✅               |
| useEffect              | ❌               | ✅               |
| イベントハンドラ       | ❌               | ✅               |
| ブラウザ API           | ❌               | ✅               |
| カスタムフック（状態） | ❌               | ✅               |
| React Class Components | ❌               | ✅               |

### "use client" ディレクティブ

ファイルの先頭に配置します:

```typescript
"use client";

// このファイル内のすべてのコンポーネントが Client Component になる
import { useState, useEffect } from "react";

export function Component1() {
  // Client Component
}

export function Component2() {
  // Client Component
}
```

## 状態管理

### useState

```typescript
"use client";

import { useState } from "react";

export function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput("");
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border px-2 py-1"
          placeholder="Add todo..."
        />
        <button onClick={addTodo} className="bg-blue-500 text-white px-4 py-1">
          Add
        </button>
      </div>
      <ul className="mt-4">
        {todos.map((todo, index) => (
          <li key={index}>{todo}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useReducer

複雑な状態管理に:

```typescript
"use client";

import { useReducer } from "react";

interface State {
  count: number;
  step: number;
}

type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "setStep"; payload: number }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + state.step };
    case "decrement":
      return { ...state, count: state.count - state.step };
    case "setStep":
      return { ...state, step: action.payload };
    case "reset":
      return { count: 0, step: 1 };
    default:
      return state;
  }
}

export function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });

  return (
    <div className="space-y-4">
      <p className="text-2xl">Count: {state.count}</p>
      <div className="flex gap-2">
        <button onClick={() => dispatch({ type: "decrement" })}>-</button>
        <button onClick={() => dispatch({ type: "increment" })}>+</button>
        <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      </div>
      <div>
        <label>
          Step:
          <input
            type="number"
            value={state.step}
            onChange={(e) =>
              dispatch({ type: "setStep", payload: Number(e.target.value) })
            }
            className="border ml-2 w-16 px-2"
          />
        </label>
      </div>
    </div>
  );
}
```

## イベントハンドリング

### 基本的なイベント

```typescript
"use client";

export function EventExamples() {
  const handleClick = () => {
    console.log("Clicked!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted!");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Value:", e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      console.log("Enter pressed!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="button" onClick={handleClick}>
        Click me
      </button>
      <input
        type="text"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type something..."
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### イベントの型

```typescript
"use client";

import { MouseEvent, ChangeEvent, FormEvent, KeyboardEvent } from "react";

export function TypedEvents() {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    console.log("Button clicked:", e.currentTarget.name);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log("Input value:", e.target.value);
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log("Selected:", e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log("Form data:", Object.fromEntries(formData));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" onChange={handleChange} />
      <select name="role" onChange={handleSelectChange}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button name="submit" onClick={handleClick}>
        Submit
      </button>
    </form>
  );
}
```

## useEffect

### 基本的な使い方

```typescript
"use client";

import { useState, useEffect } from "react";

export function DataFetcher({ userId }: { userId: string }) {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return <div>Hello, {user.name}</div>;
}
```

### クリーンアップ

```typescript
"use client";

import { useState, useEffect } from "react";

export function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // クリーンアップ関数
    return () => clearInterval(intervalId);
  }, [isRunning]);

  return (
    <div>
      <p>Time: {seconds}s</p>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? "Stop" : "Start"}
      </button>
      <button onClick={() => setSeconds(0)}>Reset</button>
    </div>
  );
}
```

### イベントリスナー

```typescript
"use client";

import { useState, useEffect } from "react";

export function WindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // 初期値を設定
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      Window: {size.width} x {size.height}
    </div>
  );
}
```

## ブラウザ API

### LocalStorage

```typescript
"use client";

import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      setValue(JSON.parse(stored));
    }
  }, [key]);

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue] as const;
}

// 使用例
export function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage("theme", "light");

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Current: {theme}
    </button>
  );
}
```

### Geolocation

```typescript
"use client";

import { useState, useEffect } from "react";

interface Location {
  latitude: number;
  longitude: number;
}

export function LocationTracker() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!location) return <div>Getting location...</div>;

  return (
    <div>
      Latitude: {location.latitude}, Longitude: {location.longitude}
    </div>
  );
}
```

### IntersectionObserver

```typescript
"use client";

import { useState, useEffect, useRef } from "react";

export function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="min-h-[200px]">
      {isVisible ? (
        <img src={src} alt={alt} className="w-full" />
      ) : (
        <div className="bg-gray-200 animate-pulse h-48" />
      )}
    </div>
  );
}
```

## フォーム

### 制御コンポーネント

```typescript
"use client";

import { useState } from "react";

interface FormData {
  name: string;
  email: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setFormData({ name: "", email: "", message: "" });
      alert("Message sent!");
    } catch (error) {
      alert("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          className="w-full border px-3 py-2"
          rows={4}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 text-white px-4 py-2 disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

### React Hook Form

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(18, "Must be at least 18"),
});

type FormData = z.infer<typeof schema>;

export function ValidatedForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          {...register("name")}
          placeholder="Name"
          className="border p-2"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>
      <div>
        <input
          {...register("email")}
          placeholder="Email"
          className="border p-2"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>
      <div>
        <input
          {...register("age", { valueAsNumber: true })}
          type="number"
          placeholder="Age"
          className="border p-2"
        />
        {errors.age && (
          <p className="text-red-500 text-sm">{errors.age.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 text-white px-4 py-2"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

## カスタムフック

### useFetch

```typescript
"use client";

import { useState, useEffect } from "react";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}

// 使用例
export function UserList() {
  const { data, loading, error, refetch } =
    useFetch<{ id: number; name: string }[]>("/api/users");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useDebounce

```typescript
"use client";

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
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
export function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      console.log("Searching for:", debouncedQuery);
      // 検索 API を呼び出す
    }
  }, [debouncedQuery]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## Context API

### テーマコンテキスト

```typescript
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme === "dark" ? "dark" : ""}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// 使用例
export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return <button onClick={toggleTheme}>Current theme: {theme}</button>;
}
```

## まとめ

- **"use client"** で Client Component を宣言
- **useState/useReducer** で状態管理
- **useEffect** で副作用を処理
- **イベントハンドラ** でユーザーインタラクション
- **ブラウザ API** にアクセス可能
- **カスタムフック** でロジックを再利用
- **Context API** でグローバル状態を共有

## 演習問題

1. カウンターコンポーネントを作成してください
2. フォームのバリデーションを実装してください
3. LocalStorage を使った状態の永続化を実装してください
4. カスタムフック `useWindowSize` を作成してください

## 次のステップ

次の章では、Server Components と Client Components の組み合わせパターンを学びます。

⬅️ 前へ: [05-Server-Components.md](./05-Server-Components.md)
➡️ 次へ: [07-Composition-Patterns.md](./07-Composition-Patterns.md)
