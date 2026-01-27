# 第7章: 自動補完とサジェスト

## 自動補完の実装方法

```
┌─────────────────────────────────────────────────────┐
│            Autocomplete Methods                      │
│                                                     │
│  1. Prefix Query                                    │
│     └─ シンプル、リアルタイム更新                    │
│                                                     │
│  2. Edge N-gram                                     │
│     └─ 高速、事前インデックス                        │
│                                                     │
│  3. Completion Suggester                            │
│     └─ 最高速、専用データ構造                        │
│                                                     │
│  4. Search-as-you-type                             │
│     └─ 組み込み機能、簡単設定                        │
└─────────────────────────────────────────────────────┘
```

## Prefix Query（基本）

```typescript
// シンプルな前方一致
async function autocompleteBasic(prefix: string) {
  const result = await client.search({
    index: "products",
    body: {
      query: {
        prefix: {
          "name.keyword": {
            value: prefix,
            case_insensitive: true,
          },
        },
      },
      size: 10,
      _source: ["name", "category"],
    },
  });

  return result.hits.hits.map((hit) => hit._source);
}
```

## Edge N-gram（高速検索）

### インデックス設定

```typescript
await client.indices.create({
  index: "products_autocomplete",
  body: {
    settings: {
      analysis: {
        analyzer: {
          autocomplete: {
            type: "custom",
            tokenizer: "autocomplete_tokenizer",
            filter: ["lowercase"],
          },
          autocomplete_search: {
            type: "custom",
            tokenizer: "standard",
            filter: ["lowercase"],
          },
        },
        tokenizer: {
          autocomplete_tokenizer: {
            type: "edge_ngram",
            min_gram: 1,
            max_gram: 20,
            token_chars: ["letter", "digit"],
          },
        },
      },
    },
    mappings: {
      properties: {
        name: {
          type: "text",
          analyzer: "autocomplete",
          search_analyzer: "autocomplete_search",
        },
        suggest_text: {
          type: "text",
          analyzer: "autocomplete",
          search_analyzer: "autocomplete_search",
        },
      },
    },
  },
});
```

### 検索

```typescript
async function autocompleteEdgeNgram(query: string) {
  const result = await client.search({
    index: "products_autocomplete",
    body: {
      query: {
        match: {
          suggest_text: {
            query,
            operator: "and",
          },
        },
      },
      size: 10,
    },
  });

  return result.hits.hits.map((hit) => hit._source);
}
```

## Completion Suggester（最高速）

### インデックス設定

```typescript
await client.indices.create({
  index: "products_suggest",
  body: {
    mappings: {
      properties: {
        name: { type: "text" },
        suggest: {
          type: "completion",
          analyzer: "simple",
          preserve_separators: true,
          preserve_position_increments: true,
          max_input_length: 50,
        },
      },
    },
  },
});
```

### データ登録

```typescript
// サジェスト用にデータを登録
await client.index({
  index: "products_suggest",
  body: {
    name: "iPhone 15 Pro",
    suggest: {
      input: ["iPhone", "iPhone 15", "iPhone 15 Pro", "アイフォン"],
      weight: 100, // 重み付け
    },
  },
});

// カテゴリ付きサジェスト
await client.index({
  index: "products_suggest",
  body: {
    name: "MacBook Pro",
    category: "laptop",
    suggest: {
      input: ["MacBook", "MacBook Pro", "マックブック"],
      weight: 90,
      contexts: {
        category: "laptop",
      },
    },
  },
});
```

### 検索

```typescript
async function autocompleteCompletion(prefix: string, category?: string) {
  const suggest: any = {
    product_suggest: {
      prefix,
      completion: {
        field: "suggest",
        size: 10,
        skip_duplicates: true,
        fuzzy: {
          fuzziness: "AUTO",
        },
      },
    },
  };

  // カテゴリでフィルター
  if (category) {
    suggest.product_suggest.completion.contexts = {
      category: [category],
    };
  }

  const result = await client.search({
    index: "products_suggest",
    body: { suggest },
  });

  return result.suggest.product_suggest[0].options.map((option: any) => ({
    text: option.text,
    score: option._score,
    ...option._source,
  }));
}
```

## Search-as-you-type（簡単設定）

### インデックス設定

```typescript
await client.indices.create({
  index: "products_search",
  body: {
    mappings: {
      properties: {
        name: {
          type: "search_as_you_type",
          max_shingle_size: 3,
        },
      },
    },
  },
});
```

### 検索

```typescript
async function searchAsYouType(query: string) {
  const result = await client.search({
    index: "products_search",
    body: {
      query: {
        multi_match: {
          query,
          type: "bool_prefix",
          fields: ["name", "name._2gram", "name._3gram"],
        },
      },
      size: 10,
    },
  });

  return result.hits.hits.map((hit) => hit._source);
}
```

## 検索サジェスト（Did you mean?）

```typescript
async function searchWithSuggestion(query: string) {
  const result = await client.search({
    index: "products",
    body: {
      query: {
        match: {
          name: query,
        },
      },
      suggest: {
        text: query,
        spell_check: {
          phrase: {
            field: "name",
            size: 1,
            gram_size: 3,
            direct_generator: [
              {
                field: "name",
                suggest_mode: "always",
              },
            ],
            highlight: {
              pre_tag: "<em>",
              post_tag: "</em>",
            },
          },
        },
      },
    },
  });

  return {
    results: result.hits.hits.map((hit) => hit._source),
    suggestion: result.suggest?.spell_check?.[0]?.options?.[0]?.highlighted,
  };
}
```

## 人気検索ワード

### 検索ログの保存

```typescript
// 検索ログを保存
async function logSearch(query: string, userId?: string) {
  await client.index({
    index: "search_logs",
    body: {
      query,
      user_id: userId,
      timestamp: new Date().toISOString(),
    },
  });
}
```

### 人気検索の取得

```typescript
async function getPopularSearches(days: number = 7) {
  const result = await client.search({
    index: "search_logs",
    body: {
      size: 0,
      query: {
        range: {
          timestamp: {
            gte: `now-${days}d/d`,
          },
        },
      },
      aggs: {
        popular_queries: {
          terms: {
            field: "query.keyword",
            size: 10,
          },
        },
      },
    },
  });

  return result.aggregations.popular_queries.buckets.map((bucket: any) => ({
    query: bucket.key,
    count: bucket.doc_count,
  }));
}
```

## Next.js API Route 実装

```typescript
// app/api/autocomplete/route.ts
import { NextResponse } from "next/server";
import client from "@/lib/elasticsearch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");

  if (!q || q.length < 1) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Completion Suggester を使用
    const suggest: any = {
      product_suggest: {
        prefix: q,
        completion: {
          field: "suggest",
          size: 8,
          skip_duplicates: true,
          fuzzy: {
            fuzziness: 1,
          },
        },
      },
    };

    if (category) {
      suggest.product_suggest.completion.contexts = {
        category: [category],
      };
    }

    const result = await client.search({
      index: "products_suggest",
      body: { suggest },
    });

    const suggestions = result.suggest.product_suggest[0].options.map(
      (option: any) => ({
        text: option.text,
        id: option._source?.id,
        category: option._source?.category,
      }),
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Autocomplete error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
```

## React コンポーネント

```typescript
// components/SearchAutocomplete.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface Suggestion {
  text: string;
  id: string;
  category: string;
}

export function SearchAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 150);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setSuggestions([]);
      return;
    }

    fetch(`/api/autocomplete?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data.suggestions);
        setIsOpen(true);
      });
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setIsOpen(false);
    // 検索実行
    window.location.href = `/search?q=${encodeURIComponent(suggestion.text)}`;
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder="商品を検索..."
        className="w-full p-3 border rounded-lg"
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg z-50">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              className={`p-3 cursor-pointer ${
                index === selectedIndex ? "bg-gray-100" : ""
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => handleSelect(suggestion)}
            >
              <span className="font-medium">{suggestion.text}</span>
              <span className="text-sm text-gray-500 ml-2">
                {suggestion.category}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 次のステップ

次章では、データ同期とベストプラクティスについて学びます。
