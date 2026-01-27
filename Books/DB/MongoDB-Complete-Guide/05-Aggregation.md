# 第5章: 集計（Aggregation Pipeline）

## 概要

```
┌─────────────────────────────────────────────────────┐
│              Aggregation Pipeline                    │
│                                                     │
│  ドキュメント → [Stage1] → [Stage2] → ... → 結果    │
│                                                     │
│  $match   → フィルタリング                          │
│  $group   → グループ化・集計                        │
│  $project → フィールド選択・変換                    │
│  $sort    → ソート                                  │
│  $limit   → 件数制限                                │
└─────────────────────────────────────────────────────┘
```

## 基本構文

```javascript
db.collection.aggregate([
  { $match: { ... } },    // Stage 1
  { $group: { ... } },    // Stage 2
  { $project: { ... } },  // Stage 3
  // ...
]);
```

## 主要なステージ

### $match（フィルタリング）

```javascript
// find() と同じ構文
db.orders.aggregate([
  { $match: { status: "completed", amount: { $gte: 1000 } } },
]);

// パイプラインの最初に置くとインデックスを活用できる
```

### $group（グループ化）

```javascript
// 基本構文
{
  $group: {
    _id: <グループキー>,
    <フィールド名>: { <アキュムレータ>: <式> }
  }
}

// ステータスごとの件数
db.orders.aggregate([
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 },
    },
  },
]);

// ユーザーごとの合計金額
db.orders.aggregate([
  {
    $group: {
      _id: '$userId',
      totalAmount: { $sum: '$amount' },
      orderCount: { $sum: 1 },
      avgAmount: { $avg: '$amount' },
    },
  },
]);

// 複数フィールドでグループ化
db.orders.aggregate([
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      },
      total: { $sum: '$amount' },
    },
  },
]);

// 全体を1グループに（_id: null）
db.orders.aggregate([
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: '$amount' },
      avgOrderValue: { $avg: '$amount' },
      maxOrder: { $max: '$amount' },
    },
  },
]);
```

### アキュムレータ

```javascript
$sum; // 合計
$avg; // 平均
$min; // 最小値
$max; // 最大値
$first; // グループの最初
$last; // グループの最後
$push; // 配列に追加
$addToSet; // 重複なく配列に追加
$count; // カウント
$stdDevPop; // 標準偏差（母集団）
$stdDevSamp; // 標準偏差（サンプル）
```

### $project（射影・変換）

```javascript
// フィールド選択
db.users.aggregate([
  {
    $project: {
      name: 1,
      email: 1,
      _id: 0,
    },
  },
]);

// フィールド名変更
db.users.aggregate([
  {
    $project: {
      userName: "$name",
      userEmail: "$email",
    },
  },
]);

// 計算フィールド
db.orders.aggregate([
  {
    $project: {
      orderId: "$_id",
      subtotal: "$amount",
      tax: { $multiply: ["$amount", 0.1] },
      total: { $multiply: ["$amount", 1.1] },
    },
  },
]);

// 条件分岐
db.users.aggregate([
  {
    $project: {
      name: 1,
      ageGroup: {
        $switch: {
          branches: [
            { case: { $lt: ["$age", 20] }, then: "10代" },
            { case: { $lt: ["$age", 30] }, then: "20代" },
            { case: { $lt: ["$age", 40] }, then: "30代" },
          ],
          default: "40代以上",
        },
      },
    },
  },
]);
```

### $sort（ソート）

```javascript
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $sort: { createdAt: -1 } }, // -1: 降順, 1: 昇順
]);

// 複数フィールド
db.orders.aggregate([{ $sort: { status: 1, createdAt: -1 } }]);
```

### $limit / $skip

```javascript
// ページネーション
const page = 2;
const limit = 10;

db.orders.aggregate([
  { $match: { status: "completed" } },
  { $sort: { createdAt: -1 } },
  { $skip: (page - 1) * limit },
  { $limit: limit },
]);
```

### $unwind（配列展開）

```javascript
// 注文の items 配列を展開
db.orders.aggregate([
  { $unwind: "$items" },
  // { _id: 1, items: { product: "A", qty: 2 } }
  // { _id: 1, items: { product: "B", qty: 1 } }
]);

// preserveNullAndEmptyArrays: 空配列も保持
db.orders.aggregate([
  {
    $unwind: {
      path: "$items",
      preserveNullAndEmptyArrays: true,
    },
  },
]);
```

### $lookup（JOIN）

```javascript
// 他コレクションと結合
db.orders.aggregate([
  {
    $lookup: {
      from: "users", // 結合先コレクション
      localField: "userId", // orders のフィールド
      foreignField: "_id", // users のフィールド
      as: "user", // 結果を格納するフィールド
    },
  },
  { $unwind: "$user" }, // 配列を展開
]);

// パイプライン付き（より柔軟）
db.orders.aggregate([
  {
    $lookup: {
      from: "users",
      let: { userId: "$userId" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
        { $project: { name: 1, email: 1 } },
      ],
      as: "user",
    },
  },
]);
```

### $addFields（フィールド追加）

```javascript
// 既存のフィールドを保持しつつ追加
db.orders.aggregate([
  {
    $addFields: {
      totalWithTax: { $multiply: ["$amount", 1.1] },
      processed: true,
    },
  },
]);
```

### $set / $unset

```javascript
// $set は $addFields のエイリアス
db.orders.aggregate([{ $set: { status: "processed" } }]);

// $unset でフィールド削除
db.orders.aggregate([{ $unset: ["internalField", "tempData"] }]);
```

### $facet（複数パイプライン）

```javascript
// 1回のクエリで複数の集計
db.products.aggregate([
  {
    $facet: {
      // カテゴリ別カウント
      byCategory: [{ $group: { _id: "$category", count: { $sum: 1 } } }],
      // 価格帯別
      byPriceRange: [
        {
          $bucket: {
            groupBy: "$price",
            boundaries: [0, 1000, 5000, 10000, Infinity],
            output: { count: { $sum: 1 } },
          },
        },
      ],
      // 総数
      totalCount: [{ $count: "total" }],
    },
  },
]);
```

### $bucket / $bucketAuto

```javascript
// 価格帯でグループ化
db.products.aggregate([
  {
    $bucket: {
      groupBy: "$price",
      boundaries: [0, 1000, 5000, 10000],
      default: "その他",
      output: {
        count: { $sum: 1 },
        products: { $push: "$name" },
      },
    },
  },
]);

// 自動バケット
db.products.aggregate([
  {
    $bucketAuto: {
      groupBy: "$price",
      buckets: 5, // 5つのバケットに分割
    },
  },
]);
```

## 式と演算子

### 算術演算

```javascript
$add; // 加算
$subtract; // 減算
$multiply; // 乗算
$divide; // 除算
$mod; // 剰余
$abs; // 絶対値
$ceil; // 切り上げ
$floor; // 切り捨て
$round; // 四捨五入
```

### 文字列演算

```javascript
// 結合
{ $concat: ["$firstName", " ", "$lastName"] }

// 切り出し
{ $substr: ["$title", 0, 10] }

// 大文字/小文字
{ $toUpper: "$name" }
{ $toLower: "$email" }

// 置換
{ $replaceOne: { input: "$text", find: "foo", replacement: "bar" } }

// 分割
{ $split: ["$tags", ","] }
```

### 日付演算

```javascript
// 日付パーツ抽出
{ $year: "$createdAt" }
{ $month: "$createdAt" }
{ $dayOfMonth: "$createdAt" }
{ $hour: "$createdAt" }

// フォーマット
{
  $dateToString: {
    format: "%Y-%m-%d",
    date: "$createdAt",
    timezone: "Asia/Tokyo"
  }
}

// 日付計算
{
  $dateAdd: {
    startDate: "$createdAt",
    unit: "day",
    amount: 7
  }
}
```

### 条件式

```javascript
// if-then-else
{ $cond: { if: { $gte: ["$age", 18] }, then: "adult", else: "minor" } }
{ $cond: [{ $gte: ["$age", 18] }, "adult", "minor"] } // 短縮形

// null チェック
{ $ifNull: ["$nickname", "$name"] }

// switch
{
  $switch: {
    branches: [
      { case: { $eq: ["$status", "A"] }, then: "Active" },
      { case: { $eq: ["$status", "I"] }, then: "Inactive" }
    ],
    default: "Unknown"
  }
}
```

## 実践的なパターン

### 売上レポート

```typescript
async function getSalesReport(startDate: Date, endDate: Date) {
  return db
    .collection("orders")
    .aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalSales: { $sum: "$amount" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
          totalSales: 1,
          orderCount: 1,
          avgOrderValue: { $round: ["$avgOrderValue", 0] },
        },
      },
    ])
    .toArray();
}
```

### ランキング

```typescript
async function getTopProducts(limit: number) {
  return db
    .collection("orders")
    .aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          productName: "$product.name",
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ])
    .toArray();
}
```

### 統計ダッシュボード

```typescript
async function getDashboardStats() {
  const [result] = await db
    .collection("orders")
    .aggregate([
      {
        $facet: {
          // 今日の売上
          todaySales: [
            {
              $match: {
                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ],
          // ステータス別カウント
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          // 直近7日間の推移
          last7Days: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                total: { $sum: "$amount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ])
    .toArray();

  return result;
}
```

## パフォーマンス最適化

```javascript
// 1. $match を最初に（インデックス活用）
db.orders.aggregate([
  { $match: { status: 'completed' } },  // ✓ 最初
  { $group: { ... } }
]);

// 2. 必要なフィールドだけ $project
db.orders.aggregate([
  { $match: { ... } },
  { $project: { amount: 1, userId: 1 } },  // 早めに絞る
  { $group: { ... } }
]);

// 3. allowDiskUse（大量データ）
db.orders.aggregate([...], { allowDiskUse: true });

// 4. explain で確認
db.orders.aggregate([...]).explain("executionStats");
```

## 次のステップ

次章では、スキーマ設計のベストプラクティスを学びます。
