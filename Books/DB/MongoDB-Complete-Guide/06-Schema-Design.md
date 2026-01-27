# 第6章: スキーマ設計

## 埋め込み vs 参照

```
┌─────────────────────────────────────────────────────┐
│                  埋め込み (Embedding)                │
│                                                     │
│  {                                                  │
│    _id: ObjectId("..."),                           │
│    name: "田中太郎",                                │
│    addresses: [                    ← サブドキュメント│
│      { type: "home", city: "東京" },               │
│      { type: "work", city: "横浜" }                │
│    ]                                               │
│  }                                                 │
│                                                     │
│  ✓ 1回の読み取りで完結                              │
│  ✓ アトミックな更新                                 │
│  ✗ ドキュメントサイズ制限（16MB）                    │
│  ✗ データの重複                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  参照 (Referencing)                  │
│                                                     │
│  // users コレクション                              │
│  { _id: ObjectId("user1"), name: "田中太郎" }       │
│                                                     │
│  // addresses コレクション                          │
│  { _id: ..., userId: ObjectId("user1"), city: "東京" }│
│  { _id: ..., userId: ObjectId("user1"), city: "横浜" }│
│                                                     │
│  ✓ 柔軟性が高い                                     │
│  ✓ データの正規化                                   │
│  ✗ 複数回の読み取り（$lookup が必要）               │
│  ✗ アトミック更新が難しい                           │
└─────────────────────────────────────────────────────┘
```

## 設計の判断基準

### 埋め込みを選ぶ場合

```javascript
// 1. 1対1 の関係
{
  _id: ObjectId("..."),
  name: "田中太郎",
  profile: {               // 常に一緒にアクセス
    bio: "エンジニア",
    website: "https://..."
  }
}

// 2. 1対少数 の関係
{
  _id: ObjectId("..."),
  title: "MongoDB入門",
  authors: [               // 著者は数人
    { name: "田中", role: "main" },
    { name: "山田", role: "co-author" }
  ]
}

// 3. データが親と一緒にアクセスされる
{
  _id: ObjectId("..."),
  productName: "iPhone",
  reviews: [...]           // 商品と一緒に表示
}
```

### 参照を選ぶ場合

```javascript
// 1. 1対多数 の関係
// users
{ _id: ObjectId("user1"), name: "田中" }

// comments（数千件になりうる）
{ _id: ..., userId: ObjectId("user1"), text: "..." }
{ _id: ..., userId: ObjectId("user1"), text: "..." }

// 2. 多対多 の関係
// students
{ _id: ObjectId("s1"), name: "学生A", courseIds: [ObjectId("c1"), ObjectId("c2")] }

// courses
{ _id: ObjectId("c1"), name: "数学", studentIds: [ObjectId("s1"), ObjectId("s2")] }

// 3. 独立してアクセスされるデータ
// orders
{ _id: ..., userId: ObjectId("..."), items: [...] }

// users（注文なしでもアクセス）
{ _id: ..., name: "田中", email: "..." }
```

## 設計パターン

### 1. Extended Reference Pattern

```javascript
// 参照先の一部を埋め込み（よく使うデータ）
{
  _id: ObjectId("..."),
  title: "注文 #12345",
  customerId: ObjectId("customer1"),
  customerSnapshot: {        // よく使う情報をコピー
    name: "田中太郎",
    email: "tanaka@example.com"
  },
  items: [...]
}

// 用途: 頻繁にアクセスするが、完全なデータは不要な場合
```

### 2. Subset Pattern

```javascript
// 最新/重要なデータのみ埋め込み
{
  _id: ObjectId("..."),
  productName: "iPhone 15",
  recentReviews: [           // 最新5件のみ
    { rating: 5, text: "...", createdAt: ... },
    { rating: 4, text: "...", createdAt: ... }
  ],
  totalReviews: 1250         // 全件数
}

// reviews コレクションに全データ
{ productId: ObjectId("..."), rating: 5, text: "...", ... }
```

### 3. Computed Pattern

```javascript
// 集計結果を事前計算して保存
{
  _id: ObjectId("..."),
  productName: "iPhone 15",

  // 事前計算した統計
  stats: {
    totalSales: 15000,
    averageRating: 4.5,
    reviewCount: 1250,
    lastUpdated: ISODate("...")
  }
}

// 更新トリガー
async function updateProductStats(productId) {
  const stats = await db.collection('reviews').aggregate([
    { $match: { productId } },
    { $group: {
      _id: null,
      averageRating: { $avg: '$rating' },
      reviewCount: { $sum: 1 }
    }}
  ]).toArray();

  await db.collection('products').updateOne(
    { _id: productId },
    { $set: { stats: { ...stats[0], lastUpdated: new Date() } } }
  );
}
```

### 4. Bucket Pattern

```javascript
// 時系列データをバケットに格納
{
  _id: ObjectId("..."),
  sensorId: "sensor-001",
  date: ISODate("2024-01-15"),
  measurements: [
    { time: ISODate("2024-01-15T00:00:00"), value: 23.5 },
    { time: ISODate("2024-01-15T00:01:00"), value: 23.6 },
    // ... 1日分のデータ
  ],
  summary: {
    min: 22.1,
    max: 25.8,
    avg: 23.4,
    count: 1440
  }
}

// 用途: IoT、ログ、メトリクス
```

### 5. Polymorphic Pattern

```javascript
// 異なる型を同じコレクションに
// products コレクション
{
  _id: ObjectId("..."),
  type: "book",
  name: "MongoDB入門",
  author: "田中太郎",
  isbn: "978-4-xxx"
}

{
  _id: ObjectId("..."),
  type: "electronics",
  name: "iPhone 15",
  manufacturer: "Apple",
  warranty: 12
}

// クエリ
db.products.find({ type: "book" });
db.products.find({ type: "electronics", manufacturer: "Apple" });
```

### 6. Attribute Pattern

```javascript
// 可変属性を配列で管理
{
  _id: ObjectId("..."),
  name: "MacBook Pro",
  attributes: [
    { key: "cpu", value: "M3 Pro" },
    { key: "memory", value: "32GB" },
    { key: "storage", value: "1TB" },
    { key: "color", value: "Space Black" }
  ]
}

// インデックス
db.products.createIndex({ "attributes.key": 1, "attributes.value": 1 });

// クエリ
db.products.find({
  attributes: {
    $elemMatch: { key: "cpu", value: "M3 Pro" }
  }
});
```

## 実践的なスキーマ例

### E コマース

```javascript
// users
{
  _id: ObjectId("..."),
  email: "user@example.com",
  name: "田中太郎",
  addresses: [
    { type: "shipping", ... },
    { type: "billing", ... }
  ],
  defaultPaymentMethod: ObjectId("...")
}

// products
{
  _id: ObjectId("..."),
  sku: "IPHONE-15-128",
  name: "iPhone 15",
  price: 124800,
  category: "electronics",
  inventory: {
    quantity: 150,
    reserved: 12
  },
  attributes: [...],
  images: ["url1", "url2"]
}

// orders
{
  _id: ObjectId("..."),
  orderNumber: "ORD-20240115-001",
  userId: ObjectId("..."),
  status: "processing",

  // 注文時点のスナップショット
  items: [
    {
      productId: ObjectId("..."),
      sku: "IPHONE-15-128",
      name: "iPhone 15",
      price: 124800,        // 注文時の価格
      quantity: 1
    }
  ],

  shippingAddress: { ... }, // コピー
  subtotal: 124800,
  tax: 12480,
  shipping: 0,
  total: 137280,

  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### ブログ/CMS

```javascript
// posts
{
  _id: ObjectId("..."),
  slug: "mongodb-introduction",
  title: "MongoDB入門",
  content: "...",
  excerpt: "...",

  author: {
    _id: ObjectId("..."),
    name: "田中太郎",
    avatar: "url"
  },

  tags: ["mongodb", "database", "nosql"],
  categories: [ObjectId("...")],

  status: "published",
  publishedAt: ISODate("..."),

  // 統計（Computed Pattern）
  stats: {
    views: 12500,
    likes: 89,
    comments: 23
  }
}

// comments（参照）
{
  _id: ObjectId("..."),
  postId: ObjectId("..."),
  userId: ObjectId("..."),
  userSnapshot: { name: "山田", avatar: "..." },
  content: "...",
  parentId: ObjectId("..."), // 返信の場合
  createdAt: ISODate("...")
}
```

### チャット/メッセージング

```javascript
// conversations
{
  _id: ObjectId("..."),
  participants: [ObjectId("user1"), ObjectId("user2")],
  type: "direct", // "direct" | "group"

  // 最新メッセージ（Subset Pattern）
  lastMessage: {
    content: "了解です！",
    senderId: ObjectId("user1"),
    createdAt: ISODate("...")
  },

  updatedAt: ISODate("...")
}

// messages（Bucket Pattern も検討）
{
  _id: ObjectId("..."),
  conversationId: ObjectId("..."),
  senderId: ObjectId("..."),
  content: "こんにちは",
  type: "text", // "text" | "image" | "file"
  readBy: [ObjectId("user2")],
  createdAt: ISODate("...")
}
```

## アンチパターン

### 1. 無制限の配列成長

```javascript
// ❌ 悪い例
{
  _id: ObjectId("..."),
  name: "人気商品",
  views: [                    // 無制限に増える！
    { userId: "...", at: "..." },
    { userId: "...", at: "..." },
    // ... 数万件
  ]
}

// ✓ 良い例: 別コレクション or Bucket
// または統計のみ保持
{
  _id: ObjectId("..."),
  name: "人気商品",
  viewCount: 50000,
  recentViews: [...]  // 最新N件のみ
}
```

### 2. 深すぎるネスト

```javascript
// ❌ 悪い例
{
  company: {
    department: {
      team: {
        member: {
          profile: {
            address: { ... }  // 深すぎる
          }
        }
      }
    }
  }
}

// ✓ 良い例: フラットに
{
  companyId: ObjectId("..."),
  departmentId: ObjectId("..."),
  teamId: ObjectId("..."),
  profile: { ... }
}
```

### 3. 過度な正規化

```javascript
// ❌ 悪い例: RDBMSのように完全正規化
// users, profiles, addresses, phones... 全部別コレクション

// ✓ 良い例: 関連データは埋め込み
{
  _id: ObjectId("..."),
  name: "田中太郎",
  profile: { bio: "...", website: "..." },
  addresses: [...],
  phones: [...]
}
```

## 次のステップ

次章では、Mongoose ODM を使ったスキーマ定義と操作を学びます。
