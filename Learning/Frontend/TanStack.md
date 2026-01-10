# TanStack 完全ガイド

> 最終更新: 2025-12-01

## 📚 目次

1. [TanStack とは](#tanstack-とは)
2. [エコシステムの概要](#エコシステムの概要)
3. [主要ライブラリ](#主要ライブラリ)
   - [TanStack Query](#tanstack-query)
   - [TanStack Router](#tanstack-router)
   - [TanStack Table](#tanstack-table)
   - [TanStack Form](#tanstack-form)
   - [TanStack Start](#tanstack-start)
   - [その他のライブラリ](#その他のライブラリ)
4. [コア哲学](#コア哲学)
5. [実践ガイド](#実践ガイド)
6. [学習リソース](#学習リソース)

---

## TanStack とは

**TanStack** は、モダンな Web 開発のための高品質なオープンソースライブラリのコレクションです。Tanner Linsley 氏によって創設され、現在は 36 名のコアコントリビューターと 6,300 名以上の Discord コミュニティメンバーによって支えられています。

### 📊 統計情報（2025 年時点）

- **ダウンロード数**: 40 億回以上
- **GitHub スター数**: 112,660+
- **コントリビューター数**: 2,790 名
- **依存リポジトリ数**: 130 万以上
- **アクティブプロジェクト数**: 13 個

### 🎯 ミッション

TanStack の目標は、開発者に**ヘッドレス**で**型安全**、かつ**フレームワーク非依存**なツールを提供することです。これにより、開発者は UI とロジックを完全に分離し、どんなフレームワークでも同じパターンで開発できます。

---

## エコシステムの概要

TanStack エコシステムは、Web 開発の様々な側面をカバーする 13 のライブラリで構成されています：

| ライブラリ           | 目的                             | 主な使用ケース                     |
| -------------------- | -------------------------------- | ---------------------------------- |
| **Query**            | 非同期状態管理・データフェッチ   | API 呼び出し、キャッシング         |
| **Router**           | ルーティング                     | SPA/SSR のナビゲーション           |
| **Table**            | テーブル/データグリッド          | 大量データの表示、ソート、フィルタ |
| **Form**             | フォーム状態管理                 | バリデーション、送信処理           |
| **Start**            | フルスタックフレームワーク       | SSR、サーバー関数、ストリーミング  |
| **Store**            | イミュータブルリアクティブストア | TanStack ライブラリのコア          |
| **Virtual**          | 仮想化                           | 無限スクロール、大量リストの最適化 |
| **Pacer**            | パフォーマンス最適化             | デバウンス、スロットル、レート制限 |
| **DB**               | リアクティブクライアントストア   | リアルタイム同期、オフライン対応   |
| **Ranger**           | レンジスライダー                 | スライダー UI コンポーネント       |
| **Charts** (計画中)  | チャート                         | データビジュアライゼーション       |
| **Loaders** (計画中) | ローディング状態                 | スケルトン、スピナー               |
| **Actions** (計画中) | アクション管理                   | ユーザーインタラクション           |

### 🚀 最近の進展

- **2025 年**: TanStack Start v1 リリース - フルスタックフレームワーク
- **2025 年**: TanStack Form v1 リリース - ヘッドレスフォーム管理
- **パフォーマンス向上**: TanStack Router でルートマッチングが 20,000 倍高速化
- **新プロジェクト**: エコシステム全体に影響を与える大規模な新ライブラリを開発中

---

## 主要ライブラリ

### TanStack Query

**旧称**: React Query

#### 📝 概要

非同期状態管理とサーバーステートの管理に特化したライブラリ。「サーバーの状態」をキャッシュ、同期、更新するための強力なツールを提供します。

#### ✨ 主な機能

```typescript
// Transport/protocol/backend 非依存のデータフェッチ
- REST、GraphQL、Promise など何でも対応

// 自動キャッシング + リフェッチング
- stale-while-revalidate パターン
- ウィンドウフォーカス時の自動更新
- ポーリング/リアルタイム更新

// クエリの最適化
- パラレルクエリ
- 依存クエリ（Dependent Queries）
- 無限スクロール（Infinite Queries）

// 高度な機能
- Mutations + リアクティブなクエリの再フェッチ
- マルチレイヤーキャッシュ + 自動ガベージコレクション
- ページネーション + カーソルベースクエリ
- リクエストキャンセル
- React Suspense サポート
- 専用 DevTools
```

#### 🎯 使用例

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// データフェッチ
function TodoList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    staleTime: 5000, // 5秒間はフレッシュとみなす
  });

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}

// ミューテーション（データ更新）
function AddTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      // 成功時にクエリを無効化して再フェッチ
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return (
    <button onClick={() => mutation.mutate({ title: "新しいTODO" })}>
      TODO を追加
    </button>
  );
}

// 楽観的更新（Optimistic Updates）
function UpdateTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateTodo,
    onMutate: async (newTodo) => {
      // 進行中のリフェッチをキャンセル
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      // 前の値を保存
      const previousTodos = queryClient.getQueryData(["todos"]);

      // 楽観的に更新
      queryClient.setQueryData(["todos"], (old) => [...old, newTodo]);

      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      // エラー時はロールバック
      queryClient.setQueryData(["todos"], context.previousTodos);
    },
  });
}
```

#### 🌐 フレームワーク対応

- React
- Vue
- Solid
- Svelte
- Angular

各フレームワークに対応した専用アダプターが提供されています。

#### 💡 ベストプラクティス

1. **クエリキーの設計**

   ```typescript
   // ❌ 悪い例
   queryKey: ["todos"];

   // ✅ 良い例 - 階層的に設計
   queryKey: ["todos", { status: "active", page: 1 }];
   ```

2. **staleTime と cacheTime の理解**

   ```typescript
   {
     staleTime: 5000,    // データが「古い」とみなされるまでの時間
     cacheTime: 300000,  // 未使用のデータがキャッシュに保持される時間
   }
   ```

3. **トラッキングの最適化**
   - v4 以降、デフォルトで使用されているプロパティのみを追跡
   - 不要な再レンダリングを防止

---

### TanStack Router

#### 📝 概要

完全に型安全なルーティングライブラリ。ファイルベースルーティング、検索パラメータの型安全性、ローダー、SSR サポートなどを提供します。

#### ✨ 主な機能

```typescript
// 型安全なルーティング
- 100% 推論された TypeScript サポート
- ファイルベースルーティング
- ネストされたルート

// 検索パラメータの型安全性
- バリデーション付き search params
- URL での状態管理

// データローディング
- ルートレベルのデータフェッチ
- Suspense サポート
- 並列データロード

// 高度な機能
- コードスプリッティング
- プリフェッチング
- SSR/SSG サポート
- TanStack Query との統合
```

#### 🎯 使用例

```typescript
import { createRouter, createRoute, Link } from "@tanstack/react-router";

// ルート定義
const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const todoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos/$todoId",
  // 型安全なローダー
  loader: async ({ params }) => {
    return fetchTodo(params.todoId); // params.todoId は型安全
  },
  component: Todo,
});

// 型安全なナビゲーション
function Navigation() {
  return (
    <div>
      <Link to="/">ホーム</Link>
      <Link
        to="/todos/$todoId"
        params={{ todoId: "123" }} // 型チェックされる
      >
        TODO 詳細
      </Link>
    </div>
  );
}

// 検索パラメータの型安全性
const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search.page) || 1,
      query: String(search.query || ""),
    };
  },
});

function Search() {
  const { page, query } = searchRoute.useSearch();
  // page と query は型安全！

  return <SearchResults page={page} query={query} />;
}
```

#### 🚀 TanStack Start との関係

**TanStack Start は TanStack Router に 100% 依存しています。** Start は Router の機能に加えて、以下を提供します：

- フルドキュメント SSR
- ストリーミング
- サーバー関数
- ユニバーサルデプロイメント
- Vite との統合

#### 💡 ベストプラクティス

1. **オブジェクト構文の使用（TS パフォーマンス向上）**

   ```typescript
   // ❌ 悪い例 - TSパフォーマンスが悪い
   const routes = [route1, route2, route3];

   // ✅ 良い例 - TSパフォーマンスが良い
   const routes = {
     route1: route1,
     route2: route2,
     route3: route3,
   };
   ```

2. **内部型の使用を避ける**

   ```typescript
   // ❌ 悪い例 - 巨大な型
   function MyLink(props: LinkProps) {
     // ...
   }

   // ✅ 良い例 - 具体的な型
   function MyLink(props: LinkProps<typeof todoRoute>) {
     // ...
   }
   ```

---

### TanStack Table

#### 📝 概要

ヘッドレス UI ライブラリとして、テーブルとデータグリッドを構築するための完全な制御を提供します。マークアップとスタイルは 100% 開発者が管理できます。

#### ✨ 主な機能

```typescript
// ヘッドレスアーキテクチャ
- DOM 要素を一切レンダリングしない
- マークアップとスタイルの完全な制御
- あらゆる UI フレームワークで動作

// データ操作
- ソート（マルチカラムソート）
- フィルタリング（カラムレベル & グローバル）
- ページネーション
- 行選択
- カラムの表示/非表示
- カラムのピン留め
- カラムのリサイズ
- カラムの並び替え

// 高度な機能
- 行の展開（Expandable Rows）
- カラムグルーピング
- ファセット（Faceting）
- アグリゲーション（集計）
- 仮想化対応
- SSR 対応
```

#### 🎯 使用例

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";

function DataTable() {
  const [data, setData] = useState([
    { id: 1, name: "太郎", age: 25 },
    { id: 2, name: "花子", age: 30 },
  ]);

  const columns = [
    {
      accessorKey: "name",
      header: "名前",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "age",
      header: "年齢",
      cell: (info) => info.getValue(),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // ソート機能
    getFilteredRowModel: getFilteredRowModel(), // フィルタ機能
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder ? null : (
                  <div
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: "pointer" }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted()] ?? null}
                  </div>
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// カスタムフィルタリング
function FilteredTable() {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <input
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="検索..."
      />
      {/* テーブルのレンダリング */}
    </>
  );
}
```

#### 📦 バンドルサイズ

- コアパッケージ: **~15KB** (minified + gzipped)
- 非常に軽量で、パフォーマンスクリティカルなアプリケーションに最適

#### 🌐 フレームワーク対応

- React
- Vue
- Solid
- Angular
- Svelte
- Qwik
- Lit
- React Native（JS-to-native プラットフォーム）

#### 💡 ヘッドレス UI の利点

1. **完全な制御**: マークアップとスタイルを 100% コントロール
2. **軽量**: 不要な UI コードが含まれない
3. **ポータブル**: あらゆる環境で動作
4. **柔軟**: CSS、CSS-in-JS、UI ライブラリなど、あらゆるスタイリングパターンに対応

---

### TanStack Form

#### 📝 概要

ヘッドレスで高パフォーマンス、型安全なフォーム状態管理ライブラリ。バリデーション、送信処理、フィールド管理を強力にサポートします。

#### ✨ 主な機能

```typescript
// 型安全なフォーム管理
- 100% TypeScript サポート
- 推論された型定義
- カスタムエラー型のサポート

// バリデーション
- 同期 & 非同期バリデーション
- デバウンシング付きバリデーション
- フィールドレベル & フォームレベルのバリデーション
- スキーマバリデーション（Zod、Valibot、ArkType、Yup）

// 高度な機能
- ネストされたフィールド
- 配列フィールド
- 動的バリデーション
- リンクされたフィールド
- フィールドグループ
- サーバーサイドバリデーション
- 包括的な送信処理
```

#### 🎯 使用例

```typescript
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

// Zodスキーマを使ったバリデーション
const userSchema = z.object({
  name: z.string().min(3, "名前は3文字以上必要です"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  age: z.number().min(18, "18歳以上である必要があります"),
});

function UserForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      age: 0,
    },
    onSubmit: async ({ value }) => {
      // フォーム送信処理
      await createUser(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => {
            if (value.length < 3) {
              return "名前は3文字以上必要です";
            }
            return undefined;
          },
        }}
      >
        {(field) => (
          <div>
            <label>名前:</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors && (
              <span style={{ color: "red" }}>{field.state.meta.errors}</span>
            )}
          </div>
        )}
      </form.Field>

      <button type="submit">送信</button>
    </form>
  );
}

// 非同期バリデーション（例：ユーザー名の重複チェック）
function UsernameField() {
  return (
    <form.Field
      name="username"
      validators={{
        onChangeAsync: async ({ value }) => {
          await new Promise((resolve) => setTimeout(resolve, 300)); // デバウンス
          const exists = await checkUsernameExists(value);
          if (exists) {
            return "このユーザー名は既に使用されています";
          }
          return undefined;
        },
      }}
    >
      {(field) => (
        <div>
          <input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
          {field.state.meta.isValidating && <span>確認中...</span>}
          {field.state.meta.errors && (
            <span style={{ color: "red" }}>{field.state.meta.errors}</span>
          )}
        </div>
      )}
    </form.Field>
  );
}

// 動的バリデーション（送信状態に応じて変化）
function DynamicValidation() {
  const form = useForm({
    defaultValues: { email: "" },
  });

  return (
    <form.Field
      name="email"
      validators={{
        onDynamic: ({ value, fieldApi }) => {
          // フォームが送信された後は、より厳密なバリデーション
          if (fieldApi.form.state.submitCount > 0) {
            if (!value.includes("@")) {
              return "有効なメールアドレスを入力してください";
            }
          }
          return undefined;
        },
      }}
    >
      {(field) => <input value={field.state.value} />}
    </form.Field>
  );
}
```

#### 📝 スキーマライブラリとの統合

TanStack Form は**Standard Schema 仕様**をサポートしており、以下のライブラリと統合できます：

- **Zod** (v3.24.0+)
- **Valibot** (v1.0.0+)
- **ArkType** (v2.1.20+)
- **Yup** (v1.7.0+)

```typescript
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

const form = useForm({
  validators: {
    onChange: formSchema,
  },
});
```

#### 🌐 フレームワーク対応

- React
- Vue
- Angular
- Solid
- Lit
- Svelte

#### 💡 型安全なエラーハンドリング

```typescript
// カスタムエラー型
const customValidator = ({ value }) => {
  if (value < 18) {
    return { isOldEnough: false, message: "18歳以上が必要です" };
  }
  return undefined;
};

// errorMapで型安全にアクセス
field.state.meta.errorMap.onChange?.isOldEnough; // boolean型として推論される
```

---

### TanStack Start

#### 📝 概要

TanStack Router と Vite を基盤とした、オープンソースのフルスタックフレームワーク。React と Solid アプリケーション向けに設計されています。

#### ✨ 主な機能

```typescript
// SSR & ストリーミング
- フルドキュメント SSR
- React Suspense によるストリーミング
- プログレッシブハイドレーション

// ルーティング
- TanStack Router ベース
- 型安全なルーティング
- ファイルベースルーティング

// サーバー機能
- サーバー関数
- サーバールート
- API エンドポイント

// デプロイメント
- ユニバーサルデプロイメント
- Vite によるバンドリング
- 高速なビルド
```

#### 🎯 使用例

```typescript
// app/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";

// サーバー関数の定義
const getTodos = createServerFn("GET", async () => {
  // サーバーサイドでのみ実行される
  const todos = await db.todos.findMany();
  return todos;
});

export const Route = createFileRoute("/")({
  loader: async () => {
    const todos = await getTodos();
    return { todos };
  },
  component: Home,
});

function Home() {
  const { todos } = Route.useLoaderData();

  return (
    <div>
      <h1>TODO リスト</h1>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
}

// サーバー関数（Mutations）
const createTodo = createServerFn("POST", async (data: { title: string }) => {
  const todo = await db.todos.create({ data });
  return todo;
});

function AddTodo() {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        await createTodo({ title });
      }}
    >
      <input name="title" />
      <button type="submit">追加</button>
    </form>
  );
}
```

#### 🆚 Next.js、Remix との比較

| 機能                     | TanStack Start | Next.js | Remix |
| ------------------------ | -------------- | ------- | ----- |
| **型安全なルーティング** | ✅             | ❌      | ❌    |
| **SSR**                  | ✅             | ✅      | ✅    |
| **ストリーミング**       | ✅             | ✅      | ✅    |
| **サーバー関数**         | ✅             | ✅      | ✅    |
| **ファイルベース**       | ✅             | ✅      | ✅    |
| **Vite ベース**          | ✅             | ❌      | ✅    |

#### 💡 SPA モードでの使用

SSR なしでも TanStack Start を使用できます！

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    TanStackStartVite({
      ssr: false, // SPAモード
    }),
  ],
});
```

**SPA モードのメリット**:

- サーバー関数やサーバールートは引き続き使用可能
- 外部 API との統合も可能
- 初期 HTML にはレンダリング結果が含まれないだけ

---

### その他のライブラリ

#### TanStack Store

**目的**: イミュータブルでリアクティブなデータストア

- TanStack ライブラリのコアを支える
- フレームワーク非依存
- リアクティブなフレームワークアダプター付き

```typescript
import { Store } from "@tanstack/store";

const store = new Store({
  count: 0,
  user: { name: "太郎" },
});

// 更新
store.setState((state) => ({
  ...state,
  count: state.count + 1,
}));

// 購読
store.subscribe(() => {
  console.log("State changed:", store.state);
});
```

#### TanStack Virtual

**目的**: 仮想化によるパフォーマンス最適化

- 無限スクロール
- 大量リストの効率的なレンダリング
- 行と列の両方をサポート

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // 各アイテムの推定高さ
  });

  return (
    <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### TanStack Pacer

**目的**: アプリケーションパフォーマンスの最適化

- デバウンシング
- スロットリング
- レート制限
- キューイング
- バッチング

```typescript
import { debounce, throttle } from "@tanstack/pacer";

// デバウンシング：最後の呼び出しから300ms後に実行
const debouncedSearch = debounce((query: string) => {
  searchAPI(query);
}, 300);

// スロットリング：1000msに1回だけ実行
const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 1000);
```

#### TanStack DB

**目的**: リアクティブなクライアントストアとリアルタイム同期

- TanStack Query を拡張
- コレクション
- ライブクエリ
- 楽観的ミューテーション

```typescript
import { createDB } from "@tanstack/db";

const db = createDB({
  collections: {
    todos: {
      schema: todoSchema,
    },
  },
});

// ライブクエリ
const todos = db.todos.findMany({
  where: { completed: false },
});
// todosはリアクティブに更新される
```

#### TanStack Ranger

**目的**: ヘッドレスなレンジスライダー

- シングルレンジ & マルチレンジ
- カスタマイズ可能
- フレームワーク非依存

```typescript
import { useRanger } from "@tanstack/react-ranger";

function RangeSlider() {
  const [values, setValues] = useState([10, 50]);

  const rangerInstance = useRanger({
    values,
    onChange: setValues,
    min: 0,
    max: 100,
    stepSize: 1,
  });

  return (
    <div>
      {rangerInstance.handles().map((handle, i) => (
        <div
          key={i}
          {...handle.getHandleProps()}
          style={{
            left: `${handle.getPercent()}%`,
          }}
        />
      ))}
    </div>
  );
}
```

---

## コア哲学

### 1. ヘッドレス UI

#### 定義

**ヘッドレス UI** とは、UI 要素のロジック、状態、処理、API を提供するが、**マークアップ、スタイル、実装を提供しない**ライブラリやユーティリティのことです。

#### メリット

1. **ロジックと UI の分離**: ビジネスロジックと見た目を完全に分離
2. **モジュール性**: コンポーネントがより再利用可能に
3. **柔軟性**: あらゆるスタイリング手法に対応（CSS、CSS-in-JS、UI ライブラリなど）
4. **軽量**: 不要な UI コードが含まれない
5. **ポータブル**: JS が動く環境ならどこでも実行可能

#### TanStack での実装

```typescript
// TanStack Table の例
// DOM要素を一切レンダリングしない
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
});

// マークアップは完全に開発者が制御
return (
  <table>
    {/* 自由にマークアップを定義 */}
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
);
```

### 2. 型安全性

#### TypeScript ファーストの設計

TanStack のすべてのライブラリは **100% TypeScript** で書かれており、最高品質のジェネリクス、制約、インターフェースを提供します。

#### 型安全性の例

```typescript
// TanStack Router - 完全に型安全
<Link
  to="/todos/$todoId"
  params={{ todoId: "123" }} // 型チェックされる
  search={{ filter: "active" }} // 型チェックされる
/>;

// TanStack Query - 型推論
const { data } = useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos, // 返り値の型が自動的に推論される
});
// dataの型は自動的にTodo[]として推論される

// TanStack Form - エラーの型安全性
const customValidator = ({ value }) => {
  return { isOldEnough: false }; // カスタムエラー型
};

field.state.meta.errorMap.onChange?.isOldEnough; // boolean型として型安全
```

#### 要件

- TypeScript v5.4 以上
- `tsconfig.json` で `strict: true` を推奨

### 3. フレームワーク非依存

#### マルチフレームワーク対応

TanStack ライブラリは、フレームワーク非依存のコアを持ち、各フレームワーク用のアダプターを提供します。

| ライブラリ  | React | Vue | Solid | Svelte | Angular | Qwik | Lit |
| ----------- | ----- | --- | ----- | ------ | ------- | ---- | --- |
| **Query**   | ✅    | ✅  | ✅    | ✅     | ✅      | ❌   | ❌  |
| **Router**  | ✅    | ✅  | ✅    | ❌     | ❌      | ❌   | ❌  |
| **Table**   | ✅    | ✅  | ✅    | ✅     | ✅      | ✅   | ✅  |
| **Form**    | ✅    | ✅  | ✅    | ✅     | ✅      | ❌   | ✅  |
| **Virtual** | ✅    | ✅  | ✅    | ✅     | ❌      | ❌   | ❌  |
| **Ranger**  | ✅    | ✅  | ✅    | ✅     | ✅      | ❌   | ❌  |

#### アーキテクチャ

```
┌─────────────────────────────────┐
│  @tanstack/react-query          │
│  @tanstack/vue-query            │
│  @tanstack/solid-query          │
└────────────┬────────────────────┘
             │
             │ Adapters
             │
┌────────────▼────────────────────┐
│  @tanstack/query-core           │
│  (Framework-agnostic)           │
└─────────────────────────────────┘
```

各フレームワークアダプターは、フレームワーク固有のパターンに統合：

- **React**: Hooks
- **Vue**: Composition API
- **Solid**: Signals
- **Svelte**: Runes
- **Angular**: Injection Tokens

---

## 実践ガイド

### いつどのライブラリを使うか

#### プロジェクトタイプ別の推奨構成

**1. シンプルな SPA**

```typescript
- TanStack Query: API通信とキャッシング
- TanStack Router: クライアントサイドルーティング
- TanStack Form: フォーム管理
```

**2. フルスタックアプリケーション**

```typescript
- TanStack Start: フルスタックフレームワーク
  ├─ TanStack Router（内包）
  ├─ TanStack Query（統合可能）
  └─ Vite（ビルドツール）
```

**3. データ重視のアプリ**

```typescript
- TanStack Table: 大量データの表示
- TanStack Virtual: パフォーマンス最適化
- TanStack Query: データフェッチとキャッシング
```

**4. フォーム重視のアプリ**

```typescript
- TanStack Form: 複雑なフォーム管理
- Zod/Valibot: スキーマバリデーション
- TanStack Query: サーバー送信とキャッシング
```

### ベストプラクティス

#### 1. TanStack Query の最適化

```typescript
// ✅ 良い例：階層的なクエリキー
queryKey: ["todos", { status: "active", userId: 123 }];

// ✅ 良い例：適切なstaleTime設定
{
  staleTime: 1000 * 60 * 5, // 5分間はフレッシュ
  cacheTime: 1000 * 60 * 30, // 30分間キャッシュ
}

// ✅ 良い例：並列クエリの実行
const queries = useQueries({
  queries: [
    { queryKey: ['todos'], queryFn: fetchTodos },
    { queryKey: ['users'], queryFn: fetchUsers },
  ]
});

// ❌ 悪い例：不必要なリフェッチ
{
  refetchOnWindowFocus: true,  // デフォルトだが、必要ない場合はfalseに
  refetchInterval: 1000,       // 高頻度のポーリングは避ける
}
```

#### 2. TanStack Router の型安全性

```typescript
// ✅ 良い例：オブジェクト構文（TSパフォーマンス向上）
const routeTree = {
  index: indexRoute,
  about: aboutRoute,
  todos: {
    index: todosIndexRoute,
    detail: todoDetailRoute,
  },
};

// ✅ 良い例：具体的な型指定
function TodoLink(props: LinkProps<typeof todoRoute>) {
  return <Link {...props} />;
}

// ❌ 悪い例：内部型の直接使用
function GenericLink(props: LinkProps) {
  // LinkPropsは巨大な型で、TSパフォーマンスが悪い
  return <Link {...props} />;
}
```

#### 3. TanStack Table のパフォーマンス

```typescript
// ✅ 良い例：useMemoでカラム定義をメモ化
const columns = useMemo(
  () => [
    {
      accessorKey: "name",
      header: "名前",
    },
  ],
  []
);

// ✅ 良い例：必要な機能だけを有効化
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // ソートが必要な場合のみ
  getSortedRowModel: getSortedRowModel(),
});

// ❌ 悪い例：カラム定義が毎回再生成される
const table = useReactTable({
  data,
  columns: [
    {
      accessorKey: "name",
      header: "名前",
    },
  ], // 毎回新しい配列が作られる
});
```

#### 4. TanStack Form のバリデーション

```typescript
// ✅ 良い例：デバウンス付き非同期バリデーション
validators: {
  onChangeAsync: async ({ value }) => {
    await new Promise((resolve) => setTimeout(resolve, 300)); // デバウンス
    return await validateUsername(value);
  };
}

// ✅ 良い例：スキーマライブラリの使用
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

// ❌ 悪い例：デバウンスなしの非同期バリデーション
validators: {
  onChange: async ({ value }) => {
    // 入力のたびにAPIを叩く（パフォーマンス悪い）
    return await checkUsername(value);
  };
}
```

### 統合パターン

#### TanStack Start + Query

```typescript
// app/routes/todos.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/todos")({
  loader: (opts) =>
    opts.context.queryClient.ensureQueryData({
      queryKey: ["todos"],
      queryFn: fetchTodos,
    }),
  component: TodosPage,
});

function TodosPage() {
  // ローダーでプリフェッチされたデータを使用
  const { data } = useSuspenseQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
  });

  return <TodoList todos={data} />;
}
```

#### Table + Virtual

```typescript
import { useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualizedTable({ data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: "500px", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* セルをレンダリング */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### Query + Form

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";

function EditUserForm({ userId }) {
  const queryClient = useQueryClient();

  // 既存データを取得
  const { data: user } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
  });

  // 更新用のミューテーション
  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
    },
  });

  const form = useForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ userId, ...value });
    },
  });

  return <form>{/* フォームフィールド */}</form>;
}
```

---

## 学習リソース

### 公式ドキュメント

- **TanStack 公式サイト**: https://tanstack.com/
- **TanStack Query**: https://tanstack.com/query/latest
- **TanStack Router**: https://tanstack.com/router/latest
- **TanStack Table**: https://tanstack.com/table/latest
- **TanStack Form**: https://tanstack.com/form/latest
- **TanStack Start**: https://tanstack.com/start/latest

### GitHub リポジトリ

- **TanStack GitHub**: https://github.com/tanstack
- **TanStack Query**: https://github.com/tanstack/query
- **TanStack Router**: https://github.com/tanstack/router
- **TanStack Table**: https://github.com/tanstack/table
- **TanStack Form**: https://github.com/tanstack/form

### コミュニティ

- **Discord**: 6,300+ メンバー
- **Twitter/X**: [@tan_stack](https://twitter.com/tan_stack)
- **YouTube**: TanStack チャンネル

### ブログ記事

- [The State of TanStack, Two Years of Full-Time OSS](https://tanstack.com/blog/tanstack-2-years)
- [TanStack Start v1 Released](https://www.infoq.com/news/2025/11/tanstack-start-v1/)
- [TanStack Form v1 Released](https://www.infoq.com/news/2025/05/tanstack-form-v1-released/)

### ポッドキャスト

- [Exploring TanStack Ecosystem with Tanner Linsley](https://www.callstack.com/podcasts/exploring-tanstack-ecosystem-with-tanner-linsley)

### 推奨学習パス

#### 初級

1. **TanStack Query**
   - データフェッチの基本
   - キャッシングの理解
   - ミューテーションの使い方

#### 中級

2. **TanStack Router**

   - 型安全なルーティング
   - ローダーとデータフェッチ
   - Query との統合

3. **TanStack Table**
   - ヘッドレス UI の理解
   - ソートとフィルタリング
   - カスタムカラムの作成

#### 上級

4. **TanStack Form**

   - 複雑なバリデーション
   - 動的フィールド
   - スキーマライブラリとの統合

5. **TanStack Start**
   - フルスタック開発
   - SSR とストリーミング
   - サーバー関数

---

## 実践プロジェクト案

### 1. TanStack Query を使った TODO アプリ

**目的**: Query の基本を習得

**機能**:

- TODO 一覧の取得（useQuery）
- TODO の作成（useMutation）
- 楽観的更新
- キャッシュの無効化

### 2. TanStack Router でブログアプリ

**目的**: 型安全なルーティングを習得

**機能**:

- 記事一覧ページ
- 記事詳細ページ（動的ルート）
- 検索機能（search params）
- ローダーでデータプリフェッチ

### 3. TanStack Table でデータテーブル

**目的**: ヘッドレス UI の理解

**機能**:

- ソート可能なカラム
- フィルタリング（カラムごと & グローバル）
- ページネーション
- 行選択
- CSV エクスポート

### 4. TanStack Form で問い合わせフォーム

**目的**: フォーム管理とバリデーション

**機能**:

- リアルタイムバリデーション
- 非同期バリデーション（メール重複チェックなど）
- ネストされたフィールド
- Zod スキーマバリデーション

### 5. TanStack Start でフルスタックアプリ

**目的**: すべてを統合

**機能**:

- SSR によるブログ
- サーバー関数で CRUD 操作
- TanStack Query との統合
- 認証機能

---

## まとめ

### TanStack の強み

1. **ヘッドレスアーキテクチャ**: UI とロジックの完全な分離
2. **型安全性**: TypeScript による完全な型推論
3. **フレームワーク非依存**: どんなフレームワークでも使用可能
4. **高パフォーマンス**: 最適化された軽量なライブラリ
5. **統合の容易さ**: ライブラリ間でシームレスに連携
6. **活発なコミュニティ**: 大規模で活発な開発者コミュニティ

### 選択基準

| ニーズ                 | 推奨ライブラリ   |
| ---------------------- | ---------------- |
| API 通信とキャッシング | TanStack Query   |
| 型安全なルーティング   | TanStack Router  |
| データテーブル         | TanStack Table   |
| フォーム管理           | TanStack Form    |
| フルスタック開発       | TanStack Start   |
| 大量リストの最適化     | TanStack Virtual |
| パフォーマンス最適化   | TanStack Pacer   |
| リアクティブな状態管理 | TanStack Store   |

### 今後の展望

- **新しい大規模プロジェクト**: エコシステム全体に影響を与える新ライブラリを開発中
- **パフォーマンス向上**: 継続的な最適化（例：Router のルートマッチング 20,000 倍高速化）
- **コミュニティの成長**: さらなる採用拡大と貢献者の増加

---

## クイックリファレンス

### インストール

```bash
# Query
npm install @tanstack/react-query

# Router
npm install @tanstack/react-router

# Table
npm install @tanstack/react-table

# Form
npm install @tanstack/react-form

# Start
npm create @tanstack/start
```

### 基本的な使い方

```typescript
// Query
const { data } = useQuery({
  queryKey: ["key"],
  queryFn: fetchData,
});

// Router
<Link to="/path" params={{ id: "123" }} />;

// Table
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
});

// Form
const form = useForm({
  defaultValues: {},
  onSubmit: async (values) => {},
});
```

---

**次のステップ**: 実際にプロジェクトを作成して、TanStack の各ライブラリを試してみましょう！

プロジェクトディレクトリ例:

```
Projects/
├── tanstack-query-todo/     # Query の学習
├── tanstack-router-blog/    # Router の学習
├── tanstack-table-data/     # Table の学習
└── tanstack-start-fullstack/ # Start でフルスタック
```
