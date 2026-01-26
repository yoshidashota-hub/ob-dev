# 03 - イベント処理

## この章で学ぶこと

- React でのイベント処理の基本
- イベントハンドラーの書き方
- 合成イベント（Synthetic Events）
- イベントの型定義
- フォームイベントの処理
- イベント伝播の制御

## イベント処理の基本

React では、DOM イベントに対応するプロパティを使ってイベントを処理します。

```tsx
function Button() {
  // イベントハンドラー関数
  const handleClick = () => {
    console.log("Button clicked!");
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### イベントハンドラーの書き方

```tsx
function EventExamples() {
  // 方法 1: 別関数として定義
  const handleClick = () => {
    console.log("Clicked");
  };

  // 方法 2: インラインで定義（シンプルな処理向け）
  return (
    <div>
      <button onClick={handleClick}>方法 1</button>
      <button onClick={() => console.log("Clicked")}>方法 2</button>
    </div>
  );
}
```

### よくある間違い

```tsx
function WrongExample() {
  const handleClick = () => {
    console.log("Clicked");
  };

  return (
    <div>
      {/* ❌ 関数を呼び出している（レンダリング時に即実行される） */}
      <button onClick={handleClick()}>Wrong</button>

      {/* ✅ 関数への参照を渡す */}
      <button onClick={handleClick}>Correct</button>

      {/* ✅ 引数を渡したい場合はアロー関数でラップ */}
      <button onClick={() => handleClick()}>Also Correct</button>
    </div>
  );
}
```

## 合成イベント（Synthetic Events）

React は、ブラウザ間の差異を吸収するために合成イベントを使用します。

```tsx
import { MouseEvent, KeyboardEvent, ChangeEvent, FormEvent } from "react";

function SyntheticEventExamples() {
  // マウスイベント
  const handleMouseClick = (e: MouseEvent<HTMLButtonElement>) => {
    console.log("Clicked at:", e.clientX, e.clientY);
    console.log("Button:", e.button); // 0: left, 1: middle, 2: right
  };

  // キーボードイベント
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    console.log("Key:", e.key);
    console.log("Code:", e.code);
    if (e.key === "Enter") {
      console.log("Enter pressed!");
    }
  };

  // 変更イベント
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log("New value:", e.target.value);
  };

  return (
    <div>
      <button onClick={handleMouseClick}>Click me</button>
      <input onKeyDown={handleKeyDown} onChange={handleChange} />
    </div>
  );
}
```

### 主要なイベントタイプ

| イベント        | トリガー          | 型            |
| --------------- | ----------------- | ------------- |
| onClick         | クリック時        | MouseEvent    |
| onDoubleClick   | ダブルクリック時  | MouseEvent    |
| onChange        | 値変更時          | ChangeEvent   |
| onInput         | 入力時            | FormEvent     |
| onSubmit        | フォーム送信時    | FormEvent     |
| onFocus         | フォーカス時      | FocusEvent    |
| onBlur          | フォーカス解除時  | FocusEvent    |
| onKeyDown       | キー押下時        | KeyboardEvent |
| onKeyUp         | キー離上時        | KeyboardEvent |
| onMouseEnter    | マウス進入時      | MouseEvent    |
| onMouseLeave    | マウス離脱時      | MouseEvent    |
| onScroll        | スクロール時      | UIEvent       |
| onDrag / onDrop | ドラッグ&ドロップ | DragEvent     |

## イベントハンドラーに引数を渡す

```tsx
type Item = {
  id: number;
  name: string;
};

function ItemList() {
  const items: Item[] = [
    { id: 1, name: "Apple" },
    { id: 2, name: "Banana" },
    { id: 3, name: "Cherry" },
  ];

  // 方法 1: アロー関数でラップ
  const handleDelete = (id: number) => {
    console.log("Deleting item:", id);
  };

  // 方法 2: カリー化
  const handleEdit = (id: number) => () => {
    console.log("Editing item:", id);
  };

  // 方法 3: イベントと引数の両方を渡す
  const handleClick = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Clicked item:", id);
  };

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => handleDelete(item.id)}>Delete</button>
          <button onClick={handleEdit(item.id)}>Edit</button>
          <button onClick={(e) => handleClick(item.id, e)}>Click</button>
        </li>
      ))}
    </ul>
  );
}
```

## フォームイベント

### テキスト入力

```tsx
import { useState, ChangeEvent } from "react";

function TextInput() {
  const [value, setValue] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="Enter text..."
    />
  );
}
```

### セレクトボックス

```tsx
import { useState, ChangeEvent } from "react";

function SelectInput() {
  const [selected, setSelected] = useState("apple");

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelected(e.target.value);
  };

  return (
    <select value={selected} onChange={handleChange}>
      <option value="apple">Apple</option>
      <option value="banana">Banana</option>
      <option value="cherry">Cherry</option>
    </select>
  );
}
```

### チェックボックス

```tsx
import { useState, ChangeEvent } from "react";

function CheckboxInput() {
  const [checked, setChecked] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
  };

  return (
    <label>
      <input type="checkbox" checked={checked} onChange={handleChange} />I agree
      to the terms
    </label>
  );
}
```

### 複数チェックボックス

```tsx
import { useState, ChangeEvent } from "react";

function MultipleCheckboxes() {
  const [selected, setSelected] = useState<string[]>([]);

  const options = ["React", "Vue", "Angular", "Svelte"];

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelected([...selected, value]);
    } else {
      setSelected(selected.filter((item) => item !== value));
    }
  };

  return (
    <div>
      <p>Select frameworks:</p>
      {options.map((option) => (
        <label key={option} style={{ display: "block" }}>
          <input
            type="checkbox"
            value={option}
            checked={selected.includes(option)}
            onChange={handleChange}
          />
          {option}
        </label>
      ))}
      <p>Selected: {selected.join(", ") || "None"}</p>
    </div>
  );
}
```

### ラジオボタン

```tsx
import { useState, ChangeEvent } from "react";

function RadioInput() {
  const [selected, setSelected] = useState("medium");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelected(e.target.value);
  };

  const sizes = ["small", "medium", "large"];

  return (
    <div>
      {sizes.map((size) => (
        <label key={size} style={{ display: "block" }}>
          <input
            type="radio"
            name="size"
            value={size}
            checked={selected === size}
            onChange={handleChange}
          />
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </label>
      ))}
    </div>
  );
}
```

### フォーム送信

```tsx
import { useState, FormEvent, ChangeEvent } from "react";

type FormData = {
  name: string;
  email: string;
  message: string;
};

function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // デフォルトの送信動作を防ぐ
    setIsSubmitting(true);

    try {
      // API 呼び出しをシミュレート
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Submitted:", formData);
      // フォームをリセット
      setFormData({ name: "", email: "", message: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Name:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Message:
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
          />
        </label>
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

## イベント伝播の制御

### イベントバブリングの停止

```tsx
function NestedButtons() {
  const handleOuterClick = () => {
    console.log("Outer clicked");
  };

  const handleInnerClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 親への伝播を停止
    console.log("Inner clicked");
  };

  return (
    <div
      onClick={handleOuterClick}
      style={{ padding: "20px", backgroundColor: "#f0f0f0" }}
    >
      <button onClick={handleInnerClick}>Inner Button</button>
    </div>
  );
}
```

### デフォルト動作の防止

```tsx
function PreventDefaultExample() {
  // リンクのデフォルト動作を防ぐ
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    console.log("Link clicked, but navigation prevented");
  };

  // フォーム送信のデフォルト動作を防ぐ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted, but page reload prevented");
  };

  return (
    <div>
      <a href="https://example.com" onClick={handleLinkClick}>
        Click me (won't navigate)
      </a>
      <form onSubmit={handleSubmit}>
        <button type="submit">Submit (won't reload)</button>
      </form>
    </div>
  );
}
```

### イベントキャプチャ

```tsx
function CaptureExample() {
  const handleCapture = () => {
    console.log("Captured in parent");
  };

  const handleBubble = () => {
    console.log("Bubbled in parent");
  };

  const handleClick = () => {
    console.log("Clicked button");
  };

  return (
    <div
      onClickCapture={handleCapture} // キャプチャフェーズ
      onClick={handleBubble} // バブルフェーズ
    >
      <button onClick={handleClick}>Click me</button>
    </div>
  );
  // 出力順序:
  // 1. Captured in parent
  // 2. Clicked button
  // 3. Bubbled in parent
}
```

## カスタムイベントハンドラー

子コンポーネントから親コンポーネントにイベントを伝える。

```tsx
// 子コンポーネント
type SearchBoxProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
};

function SearchBox({ onSearch, placeholder = "Search..." }: SearchBoxProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      <button type="submit">Search</button>
    </form>
  );
}

// 親コンポーネント
function SearchPage() {
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // 検索処理を実行
    setResults([`Result 1 for "${query}"`, `Result 2 for "${query}"`]);
  };

  return (
    <div>
      <SearchBox onSearch={handleSearch} placeholder="Enter search term..." />
      <ul>
        {results.map((result, index) => (
          <li key={index}>{result}</li>
        ))}
      </ul>
    </div>
  );
}
```

## キーボードショートカット

```tsx
import { useEffect, useCallback } from "react";

function KeyboardShortcuts() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl/Cmd + S で保存
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      console.log("Save triggered");
    }

    // Escape で閉じる
    if (e.key === "Escape") {
      console.log("Close triggered");
    }

    // Ctrl/Cmd + Enter で送信
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      console.log("Submit triggered");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div>
      <p>Keyboard shortcuts:</p>
      <ul>
        <li>Ctrl/Cmd + S: Save</li>
        <li>Escape: Close</li>
        <li>Ctrl/Cmd + Enter: Submit</li>
      </ul>
    </div>
  );
}
```

## デバウンスとスロットル

頻繁に発生するイベントの処理を最適化します。

```tsx
import { useState, useMemo } from "react";

// デバウンス関数
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

function SearchWithDebounce() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);

  // デバウンスされた検索関数
  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery: string) => {
        console.log("Searching:", searchQuery);
        // API 呼び出しをシミュレート
        setResults([`Result for "${searchQuery}"`]);
      }, 300),
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      <ul>
        {results.map((result, i) => (
          <li key={i}>{result}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 実践: インタラクティブなカードコンポーネント

```tsx
import { useState, MouseEvent } from "react";

type CardProps = {
  title: string;
  description: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

function InteractiveCard({ title, description, onEdit, onDelete }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleClick = () => setIsExpanded(!isExpanded);

  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation(); // カードのクリックイベントを防ぐ
    onEdit?.();
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        cursor: "pointer",
        backgroundColor: isHovered ? "#f5f5f5" : "white",
        transition: "background-color 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {isHovered && (
          <div>
            <button onClick={handleEdit} style={{ marginRight: "8px" }}>
              Edit
            </button>
            <button onClick={handleDelete} style={{ color: "red" }}>
              Delete
            </button>
          </div>
        )}
      </div>
      <p
        style={{
          margin: "8px 0 0",
          overflow: "hidden",
          maxHeight: isExpanded ? "none" : "40px",
          transition: "max-height 0.3s",
        }}
      >
        {description}
      </p>
      {!isExpanded && description.length > 100 && (
        <span style={{ color: "#666", fontSize: "12px" }}>Click to expand</span>
      )}
    </div>
  );
}

function CardList() {
  const [cards, setCards] = useState([
    { id: 1, title: "Card 1", description: "This is a short description." },
    {
      id: 2,
      title: "Card 2",
      description:
        "This is a much longer description that will be truncated when the card is collapsed. Click to see the full content of this card.",
    },
    { id: 3, title: "Card 3", description: "Another description here." },
  ]);

  const handleEdit = (id: number) => {
    console.log("Editing card:", id);
  };

  const handleDelete = (id: number) => {
    setCards(cards.filter((card) => card.id !== id));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "20px",
      }}
    >
      {cards.map((card) => (
        <InteractiveCard
          key={card.id}
          title={card.title}
          description={card.description}
          onEdit={() => handleEdit(card.id)}
          onDelete={() => handleDelete(card.id)}
        />
      ))}
    </div>
  );
}

export default CardList;
```

## まとめ

- イベントハンドラーは関数への**参照**を渡す（呼び出さない）
- React は**合成イベント**でブラウザ差異を吸収
- 適切な**型定義**でイベントの型安全性を確保
- `e.preventDefault()` でデフォルト動作を防止
- `e.stopPropagation()` でイベント伝播を停止
- フォームは**制御コンポーネント**パターンで管理
- 頻繁なイベントは**デバウンス/スロットル**で最適化

## 確認問題

1. `onClick={handleClick}` と `onClick={handleClick()}` の違いは何ですか？
2. `e.preventDefault()` と `e.stopPropagation()` の違いを説明してください。
3. 制御コンポーネントでフォーム入力を管理する利点は何ですか？
4. デバウンスとスロットルの違いは何ですか？

## 次の章

[04 - 基本的な Hooks](./04-Basic-Hooks.md) では、React の中核機能である Hooks について学び、useState や useEffect の詳細な使い方を理解します。
