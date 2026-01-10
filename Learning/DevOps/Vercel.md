---
created: 2025-11-10
tags: [learning, vercel, deployment, nextjs, cloud, hosting]
status: 進行中
topic: Vercel
source: https://vercel.com/docs
---

# Vercel

## 概要

Vercel は、モダンな Web アプリケーションの構築とデプロイに特化したクラウドプラットフォーム。Next.js の開発元が提供しており、フロントエンド開発者向けに最適化された AI-First Infrastructure を提供している。

## 学んだこと

### 🌟 Vercel とは

**AI Cloud for Building and Deploying Modern Web Applications**

Vercel は、静的サイトから AI エージェントまで、あらゆる種類のアプリケーションをホスティングできるプラットフォーム。

**主要な特徴:**

- **ゼロコンフィグデプロイ**: Git と連携するだけで自動デプロイ
- **グローバル CDN**: 世界中で高速配信
- **プレビューデプロイメント**: PR ごとに自動デプロイ
- **自動 HTTPS/SSL**: 証明書管理不要
- **Edge Functions**: エッジで実行される関数
- **AI-First Infrastructure**: v0、AI SDK、AI Gateway など

**他のホスティングとの違い:**

| 項目               | Vercel     | Netlify | AWS Amplify |
| ------------------ | ---------- | ------- | ----------- |
| Next.js 統合       | ネイティブ | 良好    | 良好        |
| プレビューデプロイ | 標準       | 標準    | 制限あり    |
| Edge Functions     | あり       | あり    | Lambda@Edge |
| 無料枠             | 充実       | 充実    | 従量課金    |
| セットアップ       | 最も簡単   | 簡単    | 複雑        |

### 🌐 Edge Network とインフラストラクチャ

**Vercel Edge Network は CDN とグローバル分散プラットフォームの両方の機能を提供。**

**ネットワーク規模:**

- **119 Points of Presence (PoPs)**: 94 都市、51 カ国
- **18 のコンピュート対応リージョン**: コードを実行可能な地域
- **100+ のエッジロケーション**: コンテンツをキャッシュ

**仕組み:**

1. **ユーザーリクエスト**: 最寄りの PoP に到達
2. **エッジ処理**: Edge Functions/Middleware を実行
3. **ルーティング**: 必要に応じて最適なリージョンにルーティング
4. **レスポンス**: キャッシュされた内容または動的コンテンツを返す

**主要リージョン:**

| コード | 地域                          | 用途         |
| ------ | ----------------------------- | ------------ |
| iad1   | Washington, D.C. (デフォルト) | 北米         |
| sfo1   | San Francisco                 | 西海岸       |
| lhr1   | London                        | ヨーロッパ   |
| hnd1   | Tokyo                         | アジア太平洋 |

**メリット:**

- ユーザーに最も近いロケーションで処理
- レイテンシの最小化（グローバルで 100ms 以下）
- 自動的な負荷分散
- DDoS 攻撃からの保護

### 📦 デプロイ方法

#### 1. Git 連携（推奨）

**最も一般的な方法。** GitHub、GitLab、Bitbucket と連携可能。

**流れ:**

1. Vercel にリポジトリを接続
2. ブランチを指定（通常は `main` または `master`）
3. 自動的にビルド設定を検出
4. プッシュごとに自動デプロイ

**メリット:**

- プルリクエストごとにプレビュー環境が自動生成
- マージ時に本番環境が自動更新
- ロールバックが簡単

#### 2. Vercel CLI

**コマンドラインからデプロイ。**

```bash
# インストール
npm i -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

**使用ケース:**

- ローカルからの手動デプロイ
- CI/CD パイプラインでの使用
- スクリプトでの自動化

#### 3. Vercel API

**プログラムからデプロイを制御。**

```javascript
const response = await fetch("https://api.vercel.com/v13/deployments", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "my-project",
    gitSource: {
      type: "github",
      repo: "username/repo",
      ref: "main",
    },
  }),
});
```

### ⚙️ 設定ファイル（vercel.json）

**プロジェクトの動作をカスタマイズ。**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database-url"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "https://api.example.com"
    }
  },
  "regions": ["iad1", "sfo1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=3600, stale-while-revalidate"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://backend.example.com/:path*"
    }
  ]
}
```

**主要な設定項目:**

- `buildCommand`: ビルドコマンド
- `outputDirectory`: ビルド出力先
- `env`: 環境変数
- `regions`: デプロイ先リージョン
- `headers`: HTTP ヘッダー設定
- `redirects`: リダイレクト設定
- `rewrites`: リライト設定

### 🏗️ ビルドプロセスとライフサイクル

**Vercel のデプロイメントライフサイクル。**

#### ビルドステップ

1. **ソースコード取得**: Git リポジトリからコードを取得
2. **依存関係インストール**: `npm install` または `yarn install`
3. **ビルド実行**: `npm run build` を実行
4. **出力の最適化**: 静的ファイルと Functions を分離
5. **デプロイ**: グローバル CDN にデプロイ

**ビルド環境:**

- 隔離された仮想環境で実行
- クリーンで一貫性のある環境
- 他のユーザーのビルドと干渉しない
- リソースが効率的に割り当てられる

**ビルド制限:**

| 項目               | Hobby  | Pro    | Enterprise |
| ------------------ | ------ | ------ | ---------- |
| ビルド時間         | 45 分  | 45 分  | カスタム   |
| ビルドキャッシュ   | 1GB    | 1GB    | カスタム   |
| キャッシュ保持期間 | 1 ヶ月 | 1 ヶ月 | カスタム   |
| 並行ビルド         | 1      | 12     | カスタム   |

**デプロイメントライフサイクル:**

```
コミット/プッシュ
    ↓
deployment.created webhook
    ↓
ビルド開始
    ↓
deployment.ready webhook
    ↓
Checks 実行（オプション）
    ↓
すべての Checks 完了
    ↓
エイリアス適用（本番 URL）
    ↓
デプロイ完了
```

**トリガー方法:**

1. **Git プッシュ**: 自動的にトリガー
2. **Vercel CLI**: `vercel` コマンド
3. **API**: プログラムからトリガー
4. **手動**: Dashboard からトリガー

### 🔐 環境変数と環境の種類

**3 種類の環境:**

- **Production**: 本番環境（`main` ブランチ）
- **Preview**: プレビュー環境（すべての非本番ブランチ）
- **Development**: ローカル開発環境

**Preview 環境の詳細:**

- すべての非本番ブランチに適用
- 特定のブランチにのみ適用する変数も設定可能
- プルリクエストごとに独立した環境
- 本番環境と同じインフラストラクチャを使用

**設定方法:**

1. **Vercel Dashboard**: プロジェクト設定から追加
2. **Vercel CLI**:

```bash
vercel env add DATABASE_URL
```

3. **.env.local**: ローカル開発用

```bash
# ローカルに環境変数をダウンロード
vercel env pull .env.local
```

**システム環境変数（自動設定）:**

- `VERCEL`: `"1"` (Vercel 上で実行中)
- `VERCEL_ENV`: `"production"` | `"preview"` | `"development"`
- `VERCEL_URL`: デプロイ URL
- `VERCEL_GIT_COMMIT_SHA`: コミット SHA

### 🚀 Next.js との統合

**Vercel は Next.js の開発元が提供しているため、最も最適化されたホスティング環境。**

#### Next.js 固有の機能

**1. Turbopack のネイティブサポート**

Next.js 16 の Turbopack が完全にサポートされており、高速ビルドが可能。

**2. Edge Runtime**

Next.js の Edge Runtime が Vercel Edge Network 上で実行される。

```typescript
// app/api/edge/route.ts
export const runtime = "edge";

export async function GET(request: Request) {
  return new Response("Hello from the edge!");
}
```

**3. Incremental Static Regeneration (ISR)**

ISR が完全にサポートされており、静的ページを定期的に再生成できる。

```typescript
// app/posts/[id]/page.tsx
export const revalidate = 60; // 60秒ごとに再生成

export default async function Post({ params }) {
  const post = await getPost(params.id);
  return <article>{post.content}</article>;
}
```

**4. Image Optimization**

Next.js の `next/image` が Vercel の Image Optimization で最適化される。

```typescript
import Image from "next/image";

<Image src="/photo.jpg" width={800} height={600} alt="Photo" priority />;
```

**5. Middleware**

Next.js Middleware が Vercel Edge Network 上で実行される。

```typescript
// middleware.ts
import { NextResponse } from "next/server";

export function middleware(request: Request) {
  return NextResponse.next();
}
```

#### ビルド設定

**自動検出:**

Vercel は `package.json` を読み取り、自動的に最適なビルド設定を適用。

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**カスタムビルド:**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

#### Functions

**Vercel Functions は Next.js API Routes と統合。**

**Serverless Functions と Edge Functions の比較:**

| 項目                 | Serverless Functions               | Edge Functions               |
| -------------------- | ---------------------------------- | ---------------------------- |
| **実行場所**         | 単一リージョン（デフォルト: iad1） | ユーザーに最も近いエッジ     |
| **レイテンシ**       | リージョンに依存                   | 常に低レイテンシ（<100ms）   |
| **コールドスタート** | あり（数秒）                       | 最小限（数十 ms）            |
| **サイズ制限**       | 50MB（Hobby）、250MB（Pro）        | 1MB（コードと依存関係）      |
| **実行時間**         | 10 秒（Hobby）、60 秒（Pro）       | 30 秒                        |
| **ストリーミング**   | フレームワーク依存                 | 常にサポート                 |
| **使用ケース**       | データベース近接処理               | グローバルな低レイテンシ処理 |
| **Node.js API**      | 完全サポート                       | 制限あり（Edge Runtime）     |

**Serverless Functions の特徴:**

- データベースに近いリージョンで実行可能
- 完全な Node.js 環境
- 大きな依存関係も使用可能
- より長い実行時間

**Edge Functions の特徴:**

- グローバルに分散
- ユーザーに最も近い場所で実行
- 軽量で高速
- Middleware は常に Edge で実行

**自動スケーリング:**

- トラフィックに応じて自動的にスケール
- スパイクトラフィックにも対応
- ピーク時の障害を防止
- 低トラフィック時のコスト削減

### 🌐 Edge Functions 3.0

**2025 年の最新リリース。グローバルレイテンシ 100ms 以下を実現。**

**主要な改善:**

- **コールドスタート時間 50% 短縮**: 頻繁に呼ばれる関数で高速化
- **大容量メモリ**: 関数あたり最大 4GB まで割り当て可能
- **Vercel Blob Storage**: Edge での永続的なファイルストレージ
- **データベース統合**: PostgreSQL、Redis などの統合サポート

**使用例:**

```typescript
// app/api/hello/route.ts
export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "World";

  return new Response(`Hello, ${name}!`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
```

**Edge Middleware:**

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 地理情報に基づいてリダイレクト
  const country = request.geo?.country;

  if (country === "JP") {
    return NextResponse.redirect(new URL("/ja", request.url));
  }

  return NextResponse.next();
}
```

### 📊 Web Analytics

**プライバシー重視の分析ツール。** Cookie 不要で GDPR 準拠。

**2025 年の価格改定（79% 値下げ）:**

- **従来**: $14 per 100K events
- **現在**: $3 per 100K events ($0.00003 per event)

**プラン別の無料枠:**

| プラン | 無料枠         | 以前 | 増加率 |
| ------ | -------------- | ---- | ------ |
| Hobby  | 50K events/月  | 2.5K | 20 倍  |
| Pro    | 100K events/月 | 25K  | 4 倍   |

**機能:**

- リアルタイム分析
- ページビュー、訪問者数
- トラフィックソース
- デバイス、ブラウザ情報
- Core Web Vitals（LCP、FID、CLS）

**Web Analytics Plus（Pro プラン限定）:**

- $10/月（以前は $50/月）
- 拡張レポート期間
- より詳細なデータ

**有効化:**

```typescript
// next.config.js
module.exports = {
  analytics: {
    id: "your-analytics-id",
  },
};
```

### 🔄 プレビューデプロイメント

**プルリクエストごとに自動生成される一時的な環境。**

**特徴:**

- PR を作成すると自動的にデプロイ
- 独自の URL が発行される（例: `project-pr-123.vercel.app`）
- 本番環境と同じ設定で動作
- PR にデプロイ URL がコメントされる

**使用例:**

1. ブランチを作成してコードを変更
2. プルリクエストを作成
3. Vercel が自動的にビルド＆デプロイ
4. PR にプレビュー URL が表示される
5. レビュアーが実際の動作を確認できる
6. 変更をプッシュするたびに更新される

**メリット:**

- 本番環境に影響せずテストできる
- チーム全体で動作確認が容易
- クライアントにプレビューを共有できる
- 複数のブランチを並行してテスト可能

### 🌍 カスタムドメイン

**独自ドメインの追加と管理。**

**設定手順:**

1. Vercel Dashboard でドメインを追加
2. DNS レコードを設定（A レコードまたは CNAME）
3. 自動的に SSL 証明書が発行される

**DNS 設定例:**

```
# A レコード
Type: A
Name: @
Value: 76.76.21.21

# CNAME レコード（サブドメイン）
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**複数ドメイン:**

- プロダクションドメイン: メインドメイン
- プレビュードメイン: ブランチごとのドメイン

### 🚦 Rolling Releases（2025 新機能）

**段階的なロールアウトでリスクを軽減。**

**特徴:**

- 一部のユーザーに新バージョンを配信
- 組み込みモニタリング
- カスタムルーティング不要
- 問題があれば即座にロールバック

**使用例:**

```typescript
// vercel.json
{
  "rollout": {
    "percentage": 10,
    "monitoring": true
  }
}
```

**段階的なロールアウト:**

1. 10% のユーザーに配信
2. エラー率をモニタリング
3. 問題なければ 25% に増加
4. 段階的に 50%、75%、100% に拡大

### 🛡️ セキュリティ機能

**2025 年の新機能: 高度な脅威保護**

**Bot ID（Kasada との提携）:**

- ボットの自動フィルタリング
- ユーザー操作不要（CAPTCHA なし）
- 不正アクセスの防止

**その他のセキュリティ:**

- DDoS 保護
- 自動 SSL/TLS 証明書
- WAF（Web Application Firewall）- Enterprise プラン
- 認証保護（Vercel Authentication）

### 💰 料金プラン（2025 年版）

**Hobby（無料）:**

- 個人プロジェクト向け
- 無制限のプロジェクト
- 100GB 帯域幅/月
- 6,000 ビルド分/月
- Web Analytics: 50K events/月

**Pro（$20/月）:**

- 商用プロジェクト向け
- チームコラボレーション
- 1TB 帯域幅/月
- 24,000 ビルド分/月
- Web Analytics: 100K events/月
- パスワード保護
- カスタムエラーページ

**Enterprise:**

- カスタム価格
- 専用サポート
- SLA
- SAML SSO
- WAF

### 💾 Vercel Storage

**マネージド型サーバーレスストレージサービス。**

Vercel は複数のストレージソリューションを提供しており、アプリケーションのニーズに応じて選択可能。

#### 1. Vercel Blob

**大容量ファイルストレージ。**

**用途:**

- 画像、動画、PDF などの大きなファイル
- ユーザーアップロードファイル
- 静的アセット

**特徴:**

- グローバル CDN で高速配信
- 自動的なファイル最適化
- エッジからのアクセス
- シンプルな SDK

**使用例:**

```typescript
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  const blob = await put(filename, request.body, {
    access: 'public',
  });

  return Response.json(blob);
}
```

#### 2. Vercel KV (Redis)

**高速なキー・バリューストア（Redis ベース）。**

**用途:**

- セッション管理
- キャッシュ
- リアルタイムデータ
- レート制限

**特徴:**

- Redis 互換
- グローバルレプリケーション
- 低レイテンシ（<1ms）
- 自動スケーリング

**使用例:**

```typescript
import { kv } from '@vercel/kv';

// データを保存
await kv.set('user:123', { name: 'John', email: 'john@example.com' });

// データを取得
const user = await kv.get('user:123');

// 期限付きで保存（60秒）
await kv.setex('session:abc', 60, { userId: '123' });
```

#### 3. Vercel Postgres

**マネージド PostgreSQL データベース。**

**用途:**

- リレーショナルデータ
- トランザクション処理
- 複雑なクエリ
- 構造化データ

**特徴:**

- サーバーレス
- 自動スケーリング
- 接続プーリング
- SQL サポート

**使用例:**

```typescript
import { sql } from '@vercel/postgres';

// クエリ実行
const result = await sql`
  SELECT * FROM users
  WHERE email = ${email}
`;

// 複数行取得
const users = await sql`SELECT * FROM users`;
```

**ベストプラクティス:**

- **リージョンの一致**: データベースと Functions を同じリージョンに配置
- **接続管理**: 接続プールを適切に管理
- **KV レプリケーション**: KV のレプリカを Functions と同じリージョンに配置

### 🤖 AI 機能

**Vercel の AI-First Infrastructure。**

#### 1. v0

**AI を活用した開発アシスタント。**

**機能:**

- Web 検索機能
- サイト検証
- エラー自動修正
- 外部ツール統合
- 自律的なエージェント機能

**使用ケース:**

- プロトタイプの迅速な作成
- UI コンポーネントの生成
- コード提案とレビュー

#### 2. AI SDK

**AI アプリケーション構築用の SDK。**

**特徴:**

- 複数の AI プロバイダーをサポート
- ストリーミング対応
- AI Gateway と統合
- プロバイダーパッケージ不要

**使用例:**

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const { text } = await generateText({
    model: openai('gpt-4-turbo'),
    prompt,
  });

  return Response.json({ text });
}
```

#### 3. AI Gateway

**AI モデルへの統合アクセスポイント。**

**機能:**

- 複数の AI プロバイダーを一元管理
- レート制限
- キャッシング
- コスト追跡
- OpenAI 互換 API

**プロバイダー:**

- OpenAI
- Anthropic
- Google (Gemini)
- Mistral
- その他多数

**使用例:**

```typescript
import { openai } from '@ai-sdk/openai';

// AI Gateway を使用
const model = openai('gpt-4', {
  baseURL: process.env.AI_GATEWAY_URL,
  apiKey: process.env.AI_GATEWAY_KEY,
});
```

#### 4. Agents

**タスクを自律的に実行する AI エージェント。**

**構築方法:**

1. LLM を呼び出す
2. ツール（関数）を定義
3. エージェントを作成してタスクを実行

**使用例:**

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const { text } = await generateText({
  model: openai('gpt-4-turbo'),
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  prompt: 'What is the weather in San Francisco?',
});
```

### 📊 Observability（可観測性）

**アプリケーションのパフォーマンスと動作を監視。**

#### 1. ログ

**アプリケーションログの収集と管理。**

**機能:**

- リアルタイムログストリーミング
- Functions からの自動ログ収集
- `console.log` の自動キャプチャ
- ログフィルタリングと検索

**ログの確認:**

```bash
# CLI でログを確認
vercel logs

# 特定のデプロイメントのログ
vercel logs <deployment-url>
```

#### 2. Drains

**ログとトレースを外部サービスに転送。**

**対応サービス:**

- Datadog
- New Relic
- Axiom
- Grafana
- カスタムエンドポイント

**データタイプ:**

- ログ
- トレース
- Speed Insights
- Analytics データ

**設定例:**

```bash
# Drain を作成
vercel drains add <endpoint-url>
```

#### 3. OpenTelemetry (OTel)

**分散トレーシングの実装。**

**機能:**

- Functions からのトレース送信
- APM ベンダーとの統合
- 自動的なログとトレースの相関
- パフォーマンス分析

**使用例:**

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-app');

export async function GET() {
  return tracer.startActiveSpan('process-request', async (span) => {
    // 処理
    const result = await someOperation();
    span.end();
    return Response.json(result);
  });
}
```

#### 4. Monitoring

**使用状況とトラフィックの可視化。**

**監視項目:**

- デプロイメント数
- ビルド時間
- 帯域幅使用量
- Functions の実行回数
- エラー率

**Observability Plus（Pro プラン追加オプション）:**

- 拡張されたログ保持期間
- 詳細なメトリクス
- カスタムダッシュボード
- アラート機能

### 👥 Access & Collaboration

**チームでの共同作業とアクセス制御。**

#### Role-Based Access Control (RBAC)

**役割ベースのアクセス制御でセキュリティと柔軟性を両立。**

**チームレベルのロール:**

| ロール | 権限 | 使用ケース |
|--------|------|-----------|
| Owner | 完全な管理権限 | チームオーナー |
| Member | プロジェクトへのアクセス | 開発者 |
| Viewer | 読み取り専用 | ステークホルダー |
| Contributor (Enterprise) | プロジェクト単位のアクセス | 外部協力者 |

**プロジェクトレベルのロール:**

- プロジェクトごとに異なる権限を設定可能
- より細かいアクセス制御
- Enterprise プランで利用可能

**設定方法:**

1. チームダッシュボードから「Members」に移動
2. メンバーを招待
3. ロールを選択
4. 必要に応じてプロジェクトロールを設定

#### チーム管理

**効率的なコラボレーション。**

**機能:**

- メンバーの招待と削除
- ロールの変更
- プロジェクトへのアクセス管理
- アクティビティログ（Audit Logs）

**Vercel Authentication:**

- プレビューと本番デプロイメントを保護
- チームメンバーのログイン認証
- 外部公開前のテスト環境保護

#### Access Groups (Enterprise)

**大規模チーム向けのアクセス管理。**

**メリット:**

- グループ単位でのアクセス制御
- SAML SSO との統合
- 一括での権限管理
- 簡略化されたオンボーディング

### ✅ Production Checklist

**本番環境リリース前の確認項目。**

#### パフォーマンス

- [ ] Image Optimization を有効化
- [ ] 適切なキャッシュ戦略を設定（ISR、Cache-Control）
- [ ] Edge Functions を必要な箇所に適用
- [ ] Core Web Vitals を確認（LCP、FID、CLS）
- [ ] バンドルサイズを最適化

#### セキュリティ

- [ ] 環境変数に機密情報を格納
- [ ] HTTPS が有効（自動）
- [ ] CORS 設定を確認
- [ ] CSP ヘッダーを設定
- [ ] 認証が必要な箇所を保護

#### 監視

- [ ] Web Analytics を有効化
- [ ] エラー追跡を設定
- [ ] ログ収集を確認
- [ ] Drains を設定（オプション）
- [ ] アラートを設定

#### ドメインとネットワーク

- [ ] カスタムドメインを設定
- [ ] DNS レコードを確認
- [ ] SSL 証明書が発行されているか確認
- [ ] リダイレクトルールを設定
- [ ] リライトルールを確認

#### チームとアクセス

- [ ] チームメンバーのロールを確認
- [ ] プロジェクトアクセス権を設定
- [ ] 本番環境の保護を有効化（必要な場合）
- [ ] Audit Logs を有効化（Enterprise）

#### バックアップと復旧

- [ ] ロールバック手順を確認
- [ ] データベースのバックアップ設定
- [ ] 重要な環境変数をバックアップ
- [ ] ドキュメントを最新化

## 実例・サンプルコード

### 基本的な Next.js プロジェクトのデプロイ

```bash
# 1. Next.js プロジェクトを作成
npx create-next-app@latest my-app
cd my-app

# 2. Git リポジトリを初期化
git init
git add .
git commit -m "Initial commit"

# 3. GitHub にプッシュ
gh repo create my-app --public --source=. --remote=origin
git push -u origin main

# 4. Vercel にデプロイ
vercel login
vercel --prod
```

### Environment Variables の使用

```typescript
// app/api/data/route.ts
export async function GET() {
  // 環境変数を使用
  const apiKey = process.env.API_KEY;
  const dbUrl = process.env.DATABASE_URL;

  const response = await fetch("https://api.example.com/data", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();
  return Response.json(data);
}
```

### Edge Functions で地理情報を使用

```typescript
// app/api/geo/route.ts
export const runtime = "edge";

export async function GET(request: Request) {
  // リクエストから地理情報を取得
  const { geo } = request as any;

  return Response.json({
    country: geo?.country,
    region: geo?.region,
    city: geo?.city,
    latitude: geo?.latitude,
    longitude: geo?.longitude,
  });
}
```

### Incremental Static Regeneration

```typescript
// app/posts/page.tsx
export const revalidate = 60; // 60秒ごとに再生成

async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { revalidate: 60 },
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      <h1>Posts</h1>
      {posts.map((post: any) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

### Middleware で認証チェック

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 認証トークンをチェック
  const token = request.cookies.get("auth-token");

  // 保護されたルート
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

### カスタムヘッダーとキャッシュ制御

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=3600, stale-while-revalidate=86400"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    },
    {
      "source": "/(.*).html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### リダイレクトとリライト

```json
{
  "redirects": [
    {
      "source": "/old-blog/:slug",
      "destination": "/blog/:slug",
      "permanent": true
    },
    {
      "source": "/docs",
      "destination": "/documentation",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://backend.example.com/api/:path*"
    },
    {
      "source": "/images/:path*",
      "destination": "https://cdn.example.com/:path*"
    }
  ]
}
```

## 疑問点・次にやること

### Storage
- [ ] Vercel Blob でのファイルアップロード機能を実装
- [ ] Vercel KV を使ったセッション管理を試す
- [ ] Vercel Postgres と Prisma の統合を調査
- [ ] Storage の料金モデルとコスト最適化

### AI 機能
- [ ] v0 を使った UI コンポーネント生成を試す
- [ ] AI SDK でストリーミングレスポンスを実装
- [ ] AI Gateway で複数プロバイダーを切り替える
- [ ] Agents を使った自律的なタスク実行を構築

### Observability
- [ ] Drains を設定して外部 APM と連携
- [ ] OpenTelemetry を使った分散トレーシングを実装
- [ ] Observability Plus の機能を詳しく調査
- [ ] カスタムダッシュボードの作成

### その他
- [ ] Rolling Releases の実践的な使い方を試す
- [ ] Web Analytics Plus の詳細機能を確認
- [ ] Monorepo での Vercel デプロイ戦略を調査
- [ ] Bot ID のセットアップと効果測定
- [ ] RBAC を使ったチーム権限管理の最適化
- [ ] Production Checklist を実プロジェクトで活用

## 関連リンク

### 基本
- [Vercel 公式ドキュメント](https://vercel.com/docs)
- [Vercel CLI リファレンス](https://vercel.com/docs/cli)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Pricing ページ](https://vercel.com/pricing)

### インフラとデプロイ
- [Vercel Functions](https://vercel.com/docs/functions)
- [Edge Network 概要](https://vercel.com/docs/edge-network/overview)
- [Vercel CDN](https://vercel.com/docs/cdn)
- [ビルドとデプロイ](https://vercel.com/docs/deployments)
- [環境変数](https://vercel.com/docs/projects/environment-variables)
- [Vercel Regions](https://vercel.com/docs/regions)

### Storage
- [Vercel Storage 概要](https://vercel.com/docs/storage)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [Vercel KV (Redis)](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

### AI
- [AI SDK](https://vercel.com/docs/ai-sdk)
- [AI Gateway](https://vercel.com/docs/ai-gateway)
- [v0 ドキュメント](https://vercel.com/docs/v0)
- [Agents ガイド](https://vercel.com/docs/agents)

### Observability
- [Observability 概要](https://vercel.com/docs/observability)
- [Drains](https://vercel.com/docs/drains)
- [OpenTelemetry](https://vercel.com/docs/otel)
- [Audit Logs](https://vercel.com/docs/audit-log)

### チームとアクセス
- [Role-Based Access Control (RBAC)](https://vercel.com/docs/rbac)
- [チームメンバー管理](https://vercel.com/docs/rbac/managing-team-members)
- [Access Control](https://vercel.com/docs/security/access-control)

### その他
- [Production Checklist](https://vercel.com/docs/production-checklist)
- [Vercel Ship 2025 Recap](https://vercel.com/blog/vercel-ship-2025-recap)

## メモ

### Vercel を選ぶ理由

**Next.js との完璧な統合:**

- Vercel は Next.js の開発元なので、最も最適化されたホスティング環境
- 新機能が最も早くサポートされる
- トラブルシューティングが容易

**開発体験の向上:**

- Git プッシュだけで自動デプロイ
- プレビュー環境で安全にテスト
- ロールバックが簡単

**パフォーマンス:**

- グローバル CDN で高速配信
- Edge Functions で低レイテンシ
- 自動的な最適化

### 注意点

**コスト:**

- 帯域幅やビルド時間の制限に注意
- 大規模アプリケーションでは Pro プラン以上が必要
- Edge Functions の実行時間制限（10 秒）

**ベンダーロックイン:**

- Vercel 固有の機能に依存しすぎると移行が困難
- 可能な限り標準的な Next.js の機能を使用すべき

### ベストプラクティス

1. **環境変数の管理**: 機密情報は必ず環境変数に格納
2. **プレビューデプロイの活用**: 本番環境に影響せずテスト
3. **Edge Functions の適切な使用**: 低レイテンシが必要な場合のみ
4. **キャッシュ戦略**: ISR や Cache-Control を適切に設定
5. **モニタリング**: Web Analytics でパフォーマンスを監視

---

_最終更新: 2025-11-10_
