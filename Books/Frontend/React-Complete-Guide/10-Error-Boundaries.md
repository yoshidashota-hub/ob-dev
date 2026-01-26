# 10 - エラーバウンダリ

## この章で学ぶこと

- React のエラーハンドリング機構
- Error Boundary の実装
- エラー発生時のフォールバック UI
- エラーのログとレポート
- リカバリー戦略

## React のエラーハンドリング

### JavaScript エラーと React

通常の JavaScript エラーは try-catch で捕捉できますが、React コンポーネントのレンダリング中のエラーは異なる扱いが必要です。

```tsx
// ❌ try-catch はレンダリングエラーを捕捉できない
function App() {
  try {
    return <BuggyComponent />;
  } catch (error) {
    return <p>Error!</p>; // これは動作しない
  }
}
```

### Error Boundary とは

Error Boundary は、子コンポーネントツリーで発生したエラーを捕捉し、フォールバック UI を表示するコンポーネントです。

## Error Boundary の実装

### クラスコンポーネントでの実装

Error Boundary は現在クラスコンポーネントでのみ実装可能です。

```tsx
import { Component, ReactNode, ErrorInfo } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // エラーが発生した時に呼ばれる静的メソッド
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // エラー情報をログに記録
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // エラーレポートサービスに送信
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 使用例

```tsx
function App() {
  return (
    <ErrorBoundary fallback={<p>An error occurred in this section.</p>}>
      <Header />
      <ErrorBoundary fallback={<p>Failed to load main content.</p>}>
        <MainContent />
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
}
```

## react-error-boundary ライブラリ

より機能的な Error Boundary を簡単に実装できます。

### インストール

```bash
npm install react-error-boundary
```

### 基本的な使い方

```tsx
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error("Error:", error);
        console.error("Info:", info);
      }}
      onReset={() => {
        // リセット時の処理（state のクリアなど）
      }}
    >
      <MainContent />
    </ErrorBoundary>
  );
}
```

### resetKeys によるリセット

```tsx
function App() {
  const [userId, setUserId] = useState(1);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      resetKeys={[userId]} // userId が変わるとリセット
      onResetKeysChange={() => {
        // リセットキーが変わった時の処理
      }}
    >
      <UserProfile userId={userId} />
    </ErrorBoundary>
  );
}
```

### useErrorBoundary フック

```tsx
import { useErrorBoundary } from "react-error-boundary";

function UserActions() {
  const { showBoundary } = useErrorBoundary();

  const handleDelete = async () => {
    try {
      await deleteUser();
    } catch (error) {
      // 手動でエラーを Error Boundary に伝える
      showBoundary(error);
    }
  };

  return <button onClick={handleDelete}>Delete User</button>;
}
```

## Error Boundary の戦略

### 1. 粒度の設計

```tsx
function App() {
  return (
    <ErrorBoundary fallback={<AppError />}>
      {/* アプリ全体のエラー */}
      <Layout>
        <Header />

        <ErrorBoundary fallback={<SidebarError />}>
          {/* サイドバーのエラー */}
          <Sidebar />
        </ErrorBoundary>

        <main>
          <ErrorBoundary fallback={<ContentError />}>
            {/* メインコンテンツのエラー */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/users/:id"
                element={
                  <ErrorBoundary fallback={<UserError />}>
                    {/* 個別ページのエラー */}
                    <UserPage />
                  </ErrorBoundary>
                }
              />
            </Routes>
          </ErrorBoundary>
        </main>
      </Layout>
    </ErrorBoundary>
  );
}
```

### 2. コンポーネント単位のエラーハンドリング

```tsx
import { ErrorBoundary } from "react-error-boundary";

function CardErrorFallback() {
  return (
    <div className="card card-error">
      <p>Failed to load this card</p>
    </div>
  );
}

function Dashboard() {
  const cards = [
    { id: 1, Component: RevenueCard },
    { id: 2, Component: UsersCard },
    { id: 3, Component: OrdersCard },
  ];

  return (
    <div className="dashboard">
      {cards.map(({ id, Component }) => (
        <ErrorBoundary key={id} FallbackComponent={CardErrorFallback}>
          <Component />
        </ErrorBoundary>
      ))}
    </div>
  );
}
```

## Error Boundary が捕捉しないエラー

以下のエラーは Error Boundary では捕捉できません：

### 1. イベントハンドラー内のエラー

```tsx
function Button() {
  const handleClick = () => {
    throw new Error("Error in event handler"); // 捕捉されない
  };

  return <button onClick={handleClick}>Click me</button>;
}

// ✅ try-catch を使用
function Button() {
  const handleClick = () => {
    try {
      throw new Error("Error in event handler");
    } catch (error) {
      console.error(error);
      // エラー処理
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### 2. 非同期コード

```tsx
function AsyncComponent() {
  useEffect(() => {
    async function fetchData() {
      throw new Error("Async error"); // 捕捉されない
    }
    fetchData();
  }, []);

  return <div>Content</div>;
}

// ✅ 非同期エラーを状態に反映
function AsyncComponent() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // ...
      } catch (err) {
        setError(err as Error);
      }
    }
    fetchData();
  }, []);

  if (error) throw error; // Error Boundary で捕捉される

  return <div>Content</div>;
}
```

### 3. サーバーサイドレンダリング

SSR 中のエラーは別途ハンドリングが必要です。

### 4. Error Boundary 自身のエラー

```tsx
// ❌ Error Boundary 内でエラーが発生すると捕捉されない
function ErrorFallback({ error }: { error: Error }) {
  throw new Error("Error in fallback!"); // 問題
}
```

## エラーレポート

### エラー情報の収集と送信

```tsx
import { ErrorBoundary } from "react-error-boundary";

type ErrorReport = {
  error: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
};

async function reportError(report: ErrorReport) {
  try {
    await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
  } catch (err) {
    console.error("Failed to report error:", err);
  }
}

function App() {
  const handleError = (error: Error, info: { componentStack: string }) => {
    const report: ErrorReport = {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: getCurrentUserId(), // 認証済みの場合
    };

    reportError(report);
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <App />
    </ErrorBoundary>
  );
}
```

### Sentry との統合

```tsx
import * as Sentry from "@sentry/react";

// 初期化
Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});

// Sentry の Error Boundary を使用
function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
      <MainApp />
    </Sentry.ErrorBoundary>
  );
}
```

## リカバリー戦略

### 1. リトライボタン

```tsx
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <details>
        <summary>Error details</summary>
        <pre>{error.message}</pre>
      </details>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
```

### 2. 自動リトライ

```tsx
import { useState, useEffect } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

function AutoRetryFallback({ error, resetErrorBoundary }: FallbackProps) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 1000 * Math.pow(2, retryCount); // 指数バックオフ

  useEffect(() => {
    if (retryCount < maxRetries) {
      const timer = setTimeout(() => {
        setRetryCount((c) => c + 1);
        resetErrorBoundary();
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [retryCount, retryDelay, resetErrorBoundary]);

  if (retryCount >= maxRetries) {
    return (
      <div>
        <p>Failed after {maxRetries} retries</p>
        <button onClick={() => setRetryCount(0)}>Reset and try again</button>
      </div>
    );
  }

  return (
    <div>
      <p>Retrying... ({retryCount + 1}/{maxRetries})</p>
    </div>
  );
}
```

### 3. 代替コンテンツ

```tsx
function WidgetErrorFallback() {
  return (
    <div className="widget widget-placeholder">
      <p>This widget is temporarily unavailable</p>
      <a href="/help">Need help?</a>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="dashboard">
      <ErrorBoundary FallbackComponent={WidgetErrorFallback}>
        <AnalyticsWidget />
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={WidgetErrorFallback}>
        <RecentOrdersWidget />
      </ErrorBoundary>
    </div>
  );
}
```

## 実践: 堅牢なフォームコンポーネント

```tsx
import { Component, ReactNode, useState } from "react";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

// エラーフォールバック
function FormErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="form-error" role="alert">
      <h3>Form Error</h3>
      <p>{error.message}</p>
      <div className="form-error-actions">
        <button onClick={resetErrorBoundary}>Reset Form</button>
        <a href="/contact">Report Issue</a>
      </div>
    </div>
  );
}

// フォームフィールド
type FieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

function FormField({ name, label, value, onChange, required }: FieldProps) {
  const { showBoundary } = useErrorBoundary();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // バリデーションエラーを Error Boundary に伝える
    if (required && !newValue.trim()) {
      // 注：通常のバリデーションは state で管理。
      // ここでは重大なエラーのみ showBoundary を使用
    }

    onChange(newValue);
  };

  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        required={required}
      />
    </div>
  );
}

// メインフォーム
type FormData = {
  name: string;
  email: string;
  message: string;
};

function ContactFormContent() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showBoundary } = useErrorBoundary();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      // 成功処理
      alert("Form submitted successfully!");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      // Error Boundary にエラーを伝える
      showBoundary(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <h2>Contact Us</h2>

      <FormField
        name="name"
        label="Name"
        value={formData.name}
        onChange={updateField("name")}
        required
      />

      <FormField
        name="email"
        label="Email"
        value={formData.email}
        onChange={updateField("email")}
        required
      />

      <div className="form-field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={(e) => updateField("message")(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

// エクスポートするフォームコンポーネント
export function ContactForm() {
  const [key, setKey] = useState(0);

  return (
    <ErrorBoundary
      key={key}
      FallbackComponent={FormErrorFallback}
      onReset={() => setKey((k) => k + 1)}
      onError={(error, info) => {
        console.error("Form error:", error);
        // エラーレポート送信
      }}
    >
      <ContactFormContent />
    </ErrorBoundary>
  );
}
```

## まとめ

- **Error Boundary** は子コンポーネントのレンダリングエラーを捕捉
- **クラスコンポーネント** で実装するか、**react-error-boundary** を使用
- イベントハンドラーや非同期コードのエラーは **別途ハンドリング** が必要
- 適切な **粒度** で Error Boundary を配置
- **エラーレポート** でデバッグ情報を収集
- **リカバリー戦略** でユーザー体験を改善

## 確認問題

1. Error Boundary が捕捉できないエラーは何ですか？
2. getDerivedStateFromError と componentDidCatch の違いは？
3. react-error-boundary の useErrorBoundary フックの用途は？
4. Error Boundary の適切な粒度とは？

## 次の章

[11 - Suspense と Concurrent](./11-Suspense-Concurrent.md) では、React の Suspense と並行機能について学びます。
