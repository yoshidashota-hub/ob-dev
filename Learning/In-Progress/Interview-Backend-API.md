# バックエンド・API - 技術面接対策

## 概要

バックエンド設計、API 設計、GraphQL などの基礎知識。

---

## 1. マイクロサービス

### デメリット

- [ ] 分散トランザクションの複雑さ
- [ ] サービス間通信のレイテンシ
- [ ] 運用複雑性（デプロイ、監視、ログ集約）
- [ ] デバッグ困難（分散トレーシング必須）
- [ ] **モノリスで十分なケースも多い**

### いつマイクロサービスを選ぶ？

- チームが大きく、独立してデプロイしたい
- スケール要件が部分ごとに異なる
- 技術スタックを分けたい

---

## 2. API バージョニング

| 方式             | 例                                      | 特徴                   |
| ---------------- | --------------------------------------- | ---------------------- |
| URL パス         | `/v1/users`                             | 最も一般的、明確       |
| ヘッダー         | `Accept: application/vnd.api+json; v=1` | URL がクリーン         |
| クエリパラメータ | `?version=1`                            | 柔軟だが見落としやすい |

### 運用のポイント

- 後方互換性を維持
- 非推奨化 → 廃止のサイクルを設計
- 移行期間を設ける

---

## 3. 非同期処理とキュー

### 使いどころ

- [ ] 重い処理の分離（画像処理、メール送信）
- [ ] リトライ戦略の実装
- [ ] 負荷の平準化（スパイク吸収）
- [ ] デッドレターキューで失敗メッセージを退避

### 配信保証

| 保証          | 説明                        |
| ------------- | --------------------------- |
| At-most-once  | メッセージは最大 1 回配信   |
| At-least-once | メッセージは最低 1 回配信   |
| Exactly-once  | メッセージは正確に 1 回配信 |

---

## 4. REST API 設計

### 良い API 設計とは？

- [ ] リソース指向の URL 設計（`/users/{id}/posts`）
- [ ] 適切な HTTP メソッド
- [ ] 適切なステータスコード
- [ ] 一貫性のあるレスポンス形式
- [ ] ドキュメント（OpenAPI/Swagger）

### HTTP メソッド

| メソッド | 用途             | 冪等性 |
| -------- | ---------------- | ------ |
| GET      | リソース取得     | ○      |
| POST     | リソース作成     | ×      |
| PUT      | リソース置換     | ○      |
| PATCH    | リソース部分更新 | ×      |
| DELETE   | リソース削除     | ○      |

### ステータスコード

| コード | 意味                  |
| ------ | --------------------- |
| 200    | OK                    |
| 201    | Created               |
| 204    | No Content            |
| 400    | Bad Request           |
| 401    | Unauthorized          |
| 403    | Forbidden             |
| 404    | Not Found             |
| 422    | Unprocessable Entity  |
| 429    | Too Many Requests     |
| 500    | Internal Server Error |

---

## 5. レートリミット

### 実装方法

| アルゴリズム   | 説明                                |
| -------------- | ----------------------------------- |
| Token Bucket   | トークンを一定レートで補充、消費    |
| Sliding Window | 直近 N 秒間のリクエスト数をカウント |
| Fixed Window   | 固定時間枠でカウント                |

### レスポンス

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000000
```

---

## 6. 冪等性

### 設計パターン

- **Idempotency Key**: クライアントが一意キーを送信
- **PUT vs POST**: PUT は冪等、POST は非冪等
- **リトライ安全性**: ネットワーク障害後のリトライで副作用が発生しない

```tsx
// サーバー側の実装例
async function processPayment(idempotencyKey: string, data: PaymentData) {
  // 既存の処理を確認
  const existing = await db.payment.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    return existing; // 同じ結果を返す
  }

  // 新規処理
  return await db.payment.create({
    data: { ...data, idempotencyKey },
  });
}
```

---

## 7. GraphQL

### REST との比較

| 項目           | REST                | GraphQL          |
| -------------- | ------------------- | ---------------- |
| データ取得     | 固定エンドポイント  | クライアント指定 |
| Over-fetching  | 発生しやすい        | 解決             |
| Under-fetching | 複数リクエスト必要  | 解決             |
| キャッシュ     | HTTP キャッシュ容易 | 難しい           |
| 学習コスト     | 低い                | やや高い         |

### N+1 問題の解決

**DataLoader** でバッチング

```tsx
const userLoader = new DataLoader(async (ids) => {
  const users = await db.user.findMany({
    where: { id: { in: ids } },
  });
  return ids.map((id) => users.find((u) => u.id === id));
});

// 使用
const user = await userLoader.load(userId);
```

### セキュリティ考慮点

- [ ] クエリの深さ制限
- [ ] 複雑度制限（Query Cost Analysis）
- [ ] イントロスペクション無効化（本番）
- [ ] レートリミット

### スキーマ設計

- **Relay 仕様**: Connection/Edge/Node パターン
- **Nullable vs Non-null**: エラー伝播の設計
- **入力型の活用**: Input type で構造化

---

## 8. システム設計例

### URL 短縮サービス

```
1. ハッシュ生成: Base62エンコード（62^7 で 3.5兆通り）
2. 衝突回避: ユニーク制約、分散IDジェネレーター（Snowflake）
3. リダイレクト高速化: Redis でキャッシュ
4. スケールアウト: DBシャーディング、読み取りレプリカ
```

### 決済システムで二重課金を防ぐ

1. **冪等性キー**: クライアントが一意のキーを送信
2. **状態管理**: pending → completed/failed
3. **Saga パターン**: 補償トランザクション
4. **タイムアウト処理**: 状態不明時の確認フロー

### 通知システム

```
配信チャネル: メール、Push、SMS、In-App
優先度: 緊急度に応じた配信ルール
バッチ処理: 同種通知のまとめ送信
ユーザー設定: チャネルごとのオン/オフ
配信保証: At-least-once、重複排除
```

---

## 学習チェックリスト

### 基本

- [ ] マイクロサービスのメリット・デメリットを説明できる
- [ ] REST API の設計原則を説明できる
- [ ] HTTP メソッドと冪等性を説明できる

### 応用

- [ ] レートリミットの実装方法を説明できる
- [ ] GraphQL と REST の使い分けを説明できる
- [ ] 冪等性を担保する設計を説明できる

### システム設計

- [ ] URL 短縮サービスを設計できる
- [ ] 二重課金防止の仕組みを説明できる

---

## 関連ノート

- [[Interview-Database]]
- [[Interview-Security]]
- [[Interview-Distributed-Systems]]
