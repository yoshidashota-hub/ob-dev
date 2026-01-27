# 第0章: はじめに

## Hono とは

Hono（炎）は、Web Standard API をベースにした超軽量・高速な Web フレームワークです。

### 主な特徴

1. **軽量**: 依存ゼロ、12KB 未満
2. **高速**: ベンチマークトップクラス
3. **マルチランタイム**: どこでも動作
4. **TypeScript ファースト**: 完全な型推論
5. **モダン API**: Web Standards 準拠

### サポートランタイム

- Cloudflare Workers
- Vercel Edge Functions
- AWS Lambda
- Deno
- Bun
- Node.js

## 環境構築

### プロジェクト作成

```bash
# npm
npm create hono@latest my-app

# 対話的に選択
# - Which template? cloudflare-workers / vercel / nodejs
# - Do you want to install dependencies? Yes
```

### ディレクトリ構成

```
my-app/
├── src/
│   └── index.ts    # エントリーポイント
├── package.json
├── tsconfig.json
└── wrangler.toml   # Cloudflare 用（選択時）
```

## Hello World

```typescript
// src/index.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!'))

app.get('/json', (c) => c.json({ message: 'Hello' }))

app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id, name: 'John' })
})

export default app
```

### 起動

```bash
# 開発サーバー
npm run dev

# Cloudflare Workers の場合
npx wrangler dev
```

## Express との比較

```typescript
// Express
app.get('/users/:id', (req, res) => {
  const id = req.params.id
  res.json({ id })
})

// Hono
app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id })
})
```

### 主な違い

| 項目 | Hono | Express |
|------|------|---------|
| サイズ | 12KB | 200KB+ |
| 型安全 | 完全 | 部分的 |
| Edge 対応 | ネイティブ | アダプタ必要 |
| Web API | 準拠 | 独自 |

## Next.js との統合

```typescript
// app/api/[[...route]]/route.ts
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const app = new Hono().basePath('/api')

app.get('/hello', (c) => c.json({ message: 'Hello' }))

export const GET = handle(app)
export const POST = handle(app)
```

## ユースケース

- **API サーバー**: REST / GraphQL エンドポイント
- **Edge Functions**: 低レイテンシ処理
- **BFF**: Backend for Frontend
- **Microservices**: 軽量なマイクロサービス

## 次のステップ

次章では、Hono のルーティングシステムについて詳しく学びます。
