# OpenAPI 完全ガイド

> 最終更新: 2025-12-02

## 📚 目次

1. [OpenAPI とは](#openapi-とは)
2. [OpenAPI 仕様の歴史](#openapi-仕様の歴史)
3. [OpenAPI 3.x の主要機能](#openapi-3x-の主要機能)
4. [基本構造](#基本構造)
5. [スキーマの書き方](#スキーマの書き方)
6. [ツールエコシステム](#ツールエコシステム)
7. [コード生成](#コード生成)
8. [ドキュメント生成](#ドキュメント生成)
9. [ベストプラクティス](#ベストプラクティス)
10. [実践例](#実践例)
11. [学習リソース](#学習リソース)

---

## OpenAPI とは

**OpenAPI Specification (OAS)** は、REST API を記述するための標準仕様です。API の構造を機械可読な形式（YAML または JSON）で定義することで、ドキュメント生成、コード生成、テスト、モックなど、様々な自動化を可能にします。

### 🎯 OpenAPI の目的

1. **標準化**: API の設計と記述を標準化
2. **自動化**: ドキュメント、コード、テストの自動生成
3. **コラボレーション**: チーム間での API 仕様の共有
4. **品質向上**: 仕様駆動開発による API 品質の向上

### 📊 OpenAPI Initiative

OpenAPI は **Linux Foundation** の下で運営される **OpenAPI Initiative (OAI)** によって管理されています。

- **設立**: 2015 年
- **メンバー**: Google, Microsoft, IBM, Oracle など
- **リポジトリ**: https://github.com/OAI/OpenAPI-Specification

---

## OpenAPI 仕様の歴史

### タイムライン

| バージョン      | リリース日   | 主な変更点                      |
| --------------- | ------------ | ------------------------------- |
| **Swagger 1.0** | 2011 年      | Wordnik 社が開発                |
| **Swagger 2.0** | 2014 年      | 広く採用される                  |
| **OpenAPI 3.0** | 2017 年 7 月 | Swagger から OpenAPI に名称変更 |
| **OpenAPI 3.1** | 2021 年 2 月 | JSON Schema 互換、Webhook 対応  |
| **OpenAPI 3.2** | 2025 年 9 月 | 最新版（現在の安定版）          |

### Swagger から OpenAPI へ

2015 年、SmartBear 社が Swagger 仕様を Linux Foundation に寄贈し、**OpenAPI Initiative** が設立されました。これにより、Swagger は以下のように分かれました：

- **OpenAPI Specification**: API の仕様標準（オープンスタンダード）
- **Swagger Tools**: OpenAPI を扱うツール群（SmartBear 社製品）

---

## OpenAPI 3.x の主要機能

### OpenAPI 3.1 の新機能（2021 年）

#### 1. JSON Schema との完全互換性

```yaml
# OpenAPI 3.1 では JSON Schema 2020-12 と100%互換
components:
  schemas:
    User:
      type: object
      properties:
        age:
          # 複数の型を指定可能
          type: [number, string]
        email:
          type: string
          format: email
```

#### 2. Webhook のサポート

非同期 API（Webhook）を定義できるようになりました。

```yaml
webhooks:
  newPet:
    post:
      summary: New pet available
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Pet"
      responses:
        "200":
          description: Webhook received
```

#### 3. paths が任意に

Webhook のみを定義する API 仕様も可能になりました。

```yaml
openapi: 3.1.0
info:
  title: Webhook API
  version: 1.0.0
# pathsは省略可能
webhooks:
  # Webhook定義
```

#### 4. 改善されたデータモデリング

```yaml
# 配列内に複数の型を含めることが可能
type: [string, number, null]

# anyOf, oneOf, allOf の使用が改善
oneOf:
  - type: string
  - type: number
```

### OpenAPI 3.2 の新機能（2025 年）

- さらなるパフォーマンス最適化
- ツールとの互換性向上
- ドキュメントの明確化

---

## 基本構造

### OpenAPI ドキュメントの構成

```yaml
openapi: 3.1.0 # OpenAPIバージョン

info: # APIメタデータ
  title: My API
  version: 1.0.0
  description: API description

servers: # APIサーバー
  - url: https://api.example.com/v1

paths: # APIエンドポイント
  /users:
    get:
      summary: ユーザー一覧取得
      responses:
        "200":
          description: 成功

components: # 再利用可能なコンポーネント
  schemas:
    User:
      type: object

security: # セキュリティ設定
  - bearerAuth: []
```

### 必須フィールド

```yaml
openapi: 3.1.0 # 必須: OpenAPIバージョン
info: # 必須: APIメタデータ
  title: API Title # 必須
  version: 1.0.0 # 必須
paths: {} # 必須（Webhookのみの場合は省略可能）
```

---

## スキーマの書き方

### 1. 基本的な API 定義

```yaml
openapi: 3.1.0
info:
  title: TODO API
  version: 1.0.0
  description: シンプルなTODO管理API
  contact:
    name: API Support
    email: support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: 本番環境
  - url: https://staging-api.example.com/v1
    description: ステージング環境
  - url: http://localhost:3000/v1
    description: 開発環境

paths:
  /todos:
    get:
      summary: TODO一覧取得
      description: すべてのTODOアイテムを取得します
      tags:
        - Todos
      parameters:
        - name: status
          in: query
          description: フィルター（completed/active）
          required: false
          schema:
            type: string
            enum: [completed, active]
        - name: page
          in: query
          description: ページ番号
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: 1ページあたりの件数
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        "200":
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  todos:
                    type: array
                    items:
                      $ref: "#/components/schemas/Todo"
                  pagination:
                    $ref: "#/components/schemas/Pagination"
              examples:
                success:
                  value:
                    todos:
                      - id: 1
                        title: "OpenAPIを学ぶ"
                        completed: false
                        createdAt: "2025-12-02T10:00:00Z"
                    pagination:
                      page: 1
                      limit: 20
                      total: 1
        "400":
          $ref: "#/components/responses/BadRequest"
        "500":
          $ref: "#/components/responses/InternalServerError"

    post:
      summary: TODO作成
      description: 新しいTODOアイテムを作成します
      tags:
        - Todos
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateTodoRequest"
            examples:
              example1:
                value:
                  title: "OpenAPIを学ぶ"
                  description: "基本から応用まで"
      responses:
        "201":
          description: 作成成功
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Todo"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "500":
          $ref: "#/components/responses/InternalServerError"

  /todos/{id}:
    parameters:
      - name: id
        in: path
        required: true
        description: TODO ID
        schema:
          type: integer

    get:
      summary: TODO詳細取得
      description: 指定されたIDのTODOアイテムを取得します
      tags:
        - Todos
      responses:
        "200":
          description: 成功
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Todo"
        "404":
          $ref: "#/components/responses/NotFound"

    put:
      summary: TODO更新
      description: 指定されたIDのTODOアイテムを更新します
      tags:
        - Todos
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateTodoRequest"
      responses:
        "200":
          description: 更新成功
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Todo"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"

    delete:
      summary: TODO削除
      description: 指定されたIDのTODOアイテムを削除します
      tags:
        - Todos
      security:
        - bearerAuth: []
      responses:
        "204":
          description: 削除成功
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"

components:
  schemas:
    Todo:
      type: object
      required:
        - id
        - title
        - completed
        - createdAt
      properties:
        id:
          type: integer
          description: TODO ID
          example: 1
        title:
          type: string
          description: TODOタイトル
          minLength: 1
          maxLength: 200
          example: "OpenAPIを学ぶ"
        description:
          type: string
          description: TODO詳細
          maxLength: 1000
          example: "基本から応用まで"
        completed:
          type: boolean
          description: 完了フラグ
          default: false
          example: false
        createdAt:
          type: string
          format: date-time
          description: 作成日時
          example: "2025-12-02T10:00:00Z"
        updatedAt:
          type: string
          format: date-time
          description: 更新日時
          example: "2025-12-02T10:00:00Z"

    CreateTodoRequest:
      type: object
      required:
        - title
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        description:
          type: string
          maxLength: 1000

    UpdateTodoRequest:
      type: object
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        description:
          type: string
          maxLength: 1000
        completed:
          type: boolean

    Pagination:
      type: object
      required:
        - page
        - limit
        - total
      properties:
        page:
          type: integer
          minimum: 1
          example: 1
        limit:
          type: integer
          minimum: 1
          maximum: 100
          example: 20
        total:
          type: integer
          minimum: 0
          example: 100

    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
          example: "INVALID_REQUEST"
        message:
          type: string
          example: "リクエストが不正です"
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string

  responses:
    BadRequest:
      description: リクエストが不正です
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
          example:
            code: "INVALID_REQUEST"
            message: "リクエストが不正です"
            details:
              - field: "title"
                message: "タイトルは必須です"

    Unauthorized:
      description: 認証が必要です
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
          example:
            code: "UNAUTHORIZED"
            message: "認証が必要です"

    NotFound:
      description: リソースが見つかりません
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
          example:
            code: "NOT_FOUND"
            message: "TODOが見つかりません"

    InternalServerError:
      description: サーバーエラー
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
          example:
            code: "INTERNAL_SERVER_ERROR"
            message: "サーバーエラーが発生しました"

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT Bearer トークン認証

tags:
  - name: Todos
    description: TODO操作
```

### 2. データ型とフォーマット

```yaml
components:
  schemas:
    DataTypes:
      type: object
      properties:
        # 文字列
        string_field:
          type: string
          example: "Hello"

        # 文字列（フォーマット指定）
        email:
          type: string
          format: email
        date:
          type: string
          format: date # YYYY-MM-DD
        datetime:
          type: string
          format: date-time # RFC3339
        uuid:
          type: string
          format: uuid
        uri:
          type: string
          format: uri
        password:
          type: string
          format: password # UIでマスク表示

        # 数値
        integer:
          type: integer
          example: 42
        number:
          type: number
          example: 3.14
        float:
          type: number
          format: float
        double:
          type: number
          format: double

        # 真偽値
        boolean:
          type: boolean
          example: true

        # 配列
        array:
          type: array
          items:
            type: string
          minItems: 1
          maxItems: 10
          uniqueItems: true

        # オブジェクト
        object:
          type: object
          properties:
            name:
              type: string

        # null許容（OpenAPI 3.1）
        nullable_field:
          type: [string, "null"]
          example: null

        # 列挙型
        enum_field:
          type: string
          enum: [active, inactive, pending]
```

### 3. バリデーション

```yaml
components:
  schemas:
    User:
      type: object
      required:
        - username
        - email
      properties:
        username:
          type: string
          minLength: 3
          maxLength: 20
          pattern: "^[a-zA-Z0-9_]+$"
          example: "john_doe"

        email:
          type: string
          format: email
          example: "john@example.com"

        age:
          type: integer
          minimum: 0
          maximum: 150
          example: 25

        rating:
          type: number
          minimum: 0
          maximum: 5
          multipleOf: 0.5
          example: 4.5

        tags:
          type: array
          items:
            type: string
          minItems: 1
          maxItems: 5
          uniqueItems: true

        bio:
          type: string
          maxLength: 500
```

### 4. 高度なスキーマテクニック

#### allOf（継承）

```yaml
components:
  schemas:
    BasicUser:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string

    AdminUser:
      allOf:
        - $ref: "#/components/schemas/BasicUser"
        - type: object
          properties:
            permissions:
              type: array
              items:
                type: string
```

#### oneOf（いずれか 1 つ）

```yaml
components:
  schemas:
    Pet:
      oneOf:
        - $ref: "#/components/schemas/Dog"
        - $ref: "#/components/schemas/Cat"
      discriminator:
        propertyName: petType
        mapping:
          dog: "#/components/schemas/Dog"
          cat: "#/components/schemas/Cat"

    Dog:
      type: object
      properties:
        petType:
          type: string
          enum: [dog]
        bark:
          type: boolean

    Cat:
      type: object
      properties:
        petType:
          type: string
          enum: [cat]
        meow:
          type: boolean
```

#### anyOf（いずれか）

```yaml
components:
  schemas:
    Response:
      anyOf:
        - $ref: "#/components/schemas/SuccessResponse"
        - $ref: "#/components/schemas/ErrorResponse"
```

---

## ツールエコシステム

### ドキュメント生成ツール

#### 1. Swagger UI

**概要**: OpenAPI 仕様から対話的な API ドキュメントを生成

**特徴**:

- 最も広く使われているツール
- 対話的な API テスト機能
- カスタマイズ可能
- リアルタイムで API を試せる

**使用例**:

```bash
# Dockerで起動
docker run -p 80:8080 -e SWAGGER_JSON=/openapi.yaml -v $(pwd):/openapi swaggerapi/swagger-ui

# Node.jsで使用
npm install swagger-ui-express
```

```javascript
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./openapi.yaml");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

**デモ**: https://petstore.swagger.io/

#### 2. Redoc

**概要**: 美しいドキュメントを生成するツール

**特徴**:

- Stripe ライクな 3 カラムレイアウト
- レスポンシブデザイン
- 高度なカスタマイズ
- 静的 HTML の生成も可能

**使用例**:

```bash
# CLIでインストール
npm install -g redoc-cli

# HTMLを生成
redoc-cli bundle openapi.yaml -o docs.html

# サーバーで表示
redoc-cli serve openapi.yaml
```

```html
<!-- CDNで使用 -->
<!DOCTYPE html>
<html>
  <head>
    <title>API Docs</title>
  </head>
  <body>
    <redoc spec-url="openapi.yaml"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>
```

**GitHub**: https://github.com/Redocly/redoc

#### 3. Stoplight Elements

**概要**: Web/React コンポーネントとして埋め込めるドキュメントツール

**特徴**:

- React コンポーネント
- 既存のドキュメントに埋め込み可能
- 美しいデザイン
- Swagger UI と同等の機能

**使用例**:

```bash
npm install @stoplight/elements
```

```jsx
import { API } from "@stoplight/elements";
import "@stoplight/elements/styles.min.css";

function ApiDocs() {
  return <API apiDescriptionUrl="openapi.yaml" router="hash" />;
}
```

**注意**: SmartBear 社による Stoplight 買収後、開発が減速

#### 4. Scalar

**概要**: 開発者フォーカスの新しいドキュメントツール

**特徴**:

- モダンな UI/UX
- 高速なパフォーマンス
- ダークモード対応
- リアルタイムプレビュー

**使用例**:

```bash
npm install @scalar/api-reference
```

```html
<script id="api-reference" data-url="./openapi.yaml"></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
```

#### 5. ツール比較表

| ツール         | デザイン   | カスタマイズ | 対話的テスト | 開発状況 | ライセンス |
| -------------- | ---------- | ------------ | ------------ | -------- | ---------- |
| **Swagger UI** | ⭐⭐⭐     | ⭐⭐⭐       | ⭐⭐⭐⭐⭐   | 🟢 活発  | Apache 2.0 |
| **Redoc**      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐     | ❌           | 🟢 活発  | MIT        |
| **Stoplight**  | ⭐⭐⭐⭐   | ⭐⭐⭐       | ⭐⭐⭐       | 🟡 減速  | Apache 2.0 |
| **Scalar**     | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐     | ⭐⭐⭐⭐     | 🟢 活発  | MIT        |

### エディターツール

#### 1. Swagger Editor

**概要**: オンライン/オフラインで使える OpenAPI エディター

**特徴**:

- リアルタイムバリデーション
- 構文エラーの表示
- プレビュー機能
- コード生成

**URL**: https://editor.swagger.io/

#### 2. Stoplight Studio

**概要**: ビジュアル API デザインツール

**特徴**:

- ビジュアルエディター
- フォームベースの編集
- Git 統合
- チームコラボレーション

**注意**: 有料プラン推奨

#### 3. VS Code 拡張

```bash
# 推奨拡張機能
- OpenAPI (Swagger) Editor
- Swagger Viewer
- REST Client
```

---

## コード生成

### 1. Swagger Codegen

**概要**: OpenAPI 仕様からクライアント SDK とサーバースタブを生成

**最新バージョン**:

- v3.0.71 (2025-07-03)
- v2.4.46 (2025-06-30)

**サポート言語**:

- **クライアント**: TypeScript, JavaScript, Java, Kotlin, Python, Ruby, Swift, C#, Go など 50+
- **サーバー**: Node.js, Go, Python, Java, PHP, Scala など

**使用例**:

```bash
# インストール
npm install -g @openapitools/openapi-generator-cli

# クライアント生成（TypeScript）
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated-client

# サーバースタブ生成（Node.js/Express）
openapi-generator-cli generate \
  -i openapi.yaml \
  -g nodejs-express-server \
  -o ./generated-server
```

**生成されるクライアントの例**:

```typescript
// 生成されたTypeScriptクライアント
import { TodoApi, Configuration } from "./generated-client";

const config = new Configuration({
  basePath: "https://api.example.com/v1",
  accessToken: "your-token",
});

const api = new TodoApi(config);

// 型安全なAPI呼び出し
const todos = await api.getTodos({ status: "active", page: 1 });
console.log(todos.data);

const newTodo = await api.createTodo({
  createTodoRequest: {
    title: "OpenAPIを学ぶ",
  },
});
```

### 2. OpenAPI Generator

**概要**: Swagger Codegen のコミュニティフォーク

**特徴**:

- Swagger Codegen より活発な開発
- 50+ のクライアント生成
- 40 名以上のトップコントリビューター
- より多くのテンプレート

**GitHub**: https://github.com/OpenAPITools/openapi-generator

**使用例**:

```bash
# インストール
npm install @openapitools/openapi-generator-cli -g

# React Query用のクライアント生成
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  --additional-properties=supportsES6=true,useSingleRequestParameter=true \
  -o ./src/api

# NestJS用のコントローラー生成
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-nestjs \
  -o ./src/generated
```

### 3. orval（推奨）

**概要**: TypeScript/JavaScript 向けの OpenAPI クライアント生成ツール

**特徴**:

- TanStack Query (React Query) 対応
- SWR 対応
- Zod バリデーション生成
- Mock データ生成

**使用例**:

```bash
npm install -D orval
```

```javascript
// orval.config.js
module.exports = {
  petstore: {
    input: "./openapi.yaml",
    output: {
      mode: "tags-split",
      target: "./src/api/endpoints",
      client: "react-query",
      mock: true,
      schemas: "./src/api/models",
      override: {
        mutator: {
          path: "./src/api/mutator.ts",
          name: "customInstance",
        },
      },
    },
  },
};
```

```bash
# 生成
npx orval
```

**生成される TanStack Query フック**:

```typescript
// 自動生成されたフック
import { useTodosQuery, useCreateTodoMutation } from "./api/endpoints/todos";

function TodoList() {
  const { data, isLoading } = useTodosQuery({ status: "active" });

  const createMutation = useCreateTodoMutation();

  const handleCreate = () => {
    createMutation.mutate({
      data: { title: "新しいTODO" },
    });
  };

  return <div>{/* ... */}</div>;
}
```

### 4. コード生成ツール比較

| ツール                 | 言語サポート  | TanStack Query | Zod | Mock | 更新頻度 |
| ---------------------- | ------------- | -------------- | --- | ---- | -------- |
| **Swagger Codegen**    | 50+           | ❌             | ❌  | ❌   | 🟢 高    |
| **OpenAPI Generator**  | 50+           | ❌             | ❌  | ❌   | 🟢 高    |
| **orval**              | TypeScript/JS | ✅             | ✅  | ✅   | 🟢 高    |
| **openapi-typescript** | TypeScript    | ❌             | ❌  | ❌   | 🟢 高    |

---

## ドキュメント生成

### 統合パターン

#### 1. Next.js との統合

```typescript
// app/api-docs/page.tsx
import "swagger-ui-react/swagger-ui.css";
import SwaggerUI from "swagger-ui-react";
import spec from "@/openapi.yaml";

export default function ApiDocs() {
  return <SwaggerUI spec={spec} />;
}
```

#### 2. Express との統合

```javascript
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const app = express();
const swaggerDocument = YAML.load("./openapi.yaml");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3000);
```

#### 3. NestJS との統合

```typescript
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("TODO API")
    .setDescription("TODO管理API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  await app.listen(3000);
}
bootstrap();
```

---

## ベストプラクティス

### 1. Design-First アプローチ

#### ❌ Code-First（非推奨）

```
コード実装 → ドキュメント生成 → API仕様確定
```

**問題点**:

- 実装の詳細が API 設計に影響
- チーム間のコミュニケーション困難
- 後からの変更が大変

#### ✅ Design-First（推奨）

```
API設計 → OpenAPI仕様作成 → レビュー → コード生成 → 実装
```

**メリット**:

- API 契約を先に確定
- ステークホルダーと早期にレビュー
- フロントエンドとバックエンドの並行開発
- コード生成による実装の効率化

### 2. API-First 開発

**2025 年のトレンド**: API-First は業界標準に

**原則**:

1. **API を第一級プロダクトとして扱う**
2. **明確な契約を最初に定義**
3. **ステークホルダーと早期にフィードバック**

**ワークフロー**:

```
1. 要件定義
   ↓
2. OpenAPI仕様作成
   ↓
3. ステークホルダーレビュー
   ↓
4. モックサーバー起動
   ↓
5. フロントエンド開発（並行）
   ↓
6. バックエンド実装（並行）
   ↓
7. 統合テスト
```

### 3. 単一の信頼できる情報源（Single Source of Truth）

#### ✅ 良い例

```yaml
# components で定義
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string

# 参照で使用
paths:
  /users:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/User"

  /users/{id}:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
```

#### ❌ 悪い例

```yaml
# 同じ定義を繰り返す（DRY違反）
paths:
  /users:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: integer
                    name:
                      type: string

  /users/{id}:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: integer
                  name:
                    type: string # 重複
```

### 4. バージョニング戦略

#### パスベースバージョニング（推奨）

```yaml
servers:
  - url: https://api.example.com/v1
  - url: https://api.example.com/v2

paths:
  /users: # v1とv2で異なる実装
    get:
      summary: ユーザー一覧
```

#### ヘッダーベースバージョニング

```yaml
paths:
  /users:
    get:
      parameters:
        - name: API-Version
          in: header
          schema:
            type: string
            enum: [v1, v2]
```

### 5. エラーハンドリング

#### RFC 7807（Problem Details）の使用

```yaml
components:
  schemas:
    ProblemDetails:
      type: object
      required:
        - type
        - title
        - status
      properties:
        type:
          type: string
          format: uri
          description: 問題タイプのURI
          example: "https://api.example.com/errors/validation-error"
        title:
          type: string
          description: 短いタイトル
          example: "バリデーションエラー"
        status:
          type: integer
          description: HTTPステータスコード
          example: 400
        detail:
          type: string
          description: 詳細メッセージ
          example: "タイトルは必須です"
        instance:
          type: string
          format: uri
          description: 問題が発生したURI
          example: "/todos"
        errors:
          type: array
          description: フィールドごとのエラー
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string

  responses:
    ValidationError:
      description: バリデーションエラー
      content:
        application/problem+json:
          schema:
            $ref: "#/components/schemas/ProblemDetails"
```

### 6. ページネーション

#### カーソルベース（推奨・大規模データ）

```yaml
paths:
  /users:
    get:
      parameters:
        - name: cursor
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/User"
                  pagination:
                    type: object
                    properties:
                      nextCursor:
                        type: string
                      hasMore:
                        type: boolean
```

#### オフセットベース（小規模データ）

```yaml
paths:
  /users:
    get:
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                  pagination:
                    type: object
                    properties:
                      page:
                        type: integer
                      limit:
                        type: integer
                      total:
                        type: integer
                      totalPages:
                        type: integer
```

### 7. セキュリティ

#### 認証方式の定義

```yaml
components:
  securitySchemes:
    # Bearer Token (JWT)
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

    # API Key
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key

    # OAuth 2.0
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/oauth/authorize
          tokenUrl: https://auth.example.com/oauth/token
          scopes:
            read: 読み取り権限
            write: 書き込み権限

# グローバル適用
security:
  - bearerAuth: []

paths:
  /public:
    get:
      # このエンドポイントは認証不要
      security: []

  /admin:
    get:
      # OAuth必須
      security:
        - oauth2: [read, write]
```

### 8. タグとグループ化

```yaml
tags:
  - name: Users
    description: ユーザー管理
  - name: Todos
    description: TODO管理
  - name: Admin
    description: 管理者機能

paths:
  /users:
    get:
      tags:
        - Users
      summary: ユーザー一覧

  /todos:
    get:
      tags:
        - Todos
      summary: TODO一覧

  /admin/settings:
    get:
      tags:
        - Admin
      summary: 設定
```

---

## 実践例

### プロジェクト構成

```
my-api/
├── openapi/
│   ├── openapi.yaml           # メインファイル
│   ├── components/
│   │   ├── schemas/
│   │   │   ├── User.yaml
│   │   │   ├── Todo.yaml
│   │   │   └── Error.yaml
│   │   ├── responses/
│   │   │   ├── Success.yaml
│   │   │   └── Errors.yaml
│   │   └── parameters/
│   │       ├── Pagination.yaml
│   │       └── Common.yaml
│   └── paths/
│       ├── users.yaml
│       └── todos.yaml
├── generated/                 # 生成されたコード
│   ├── client/
│   └── server/
└── docs/                      # 生成されたドキュメント
    └── index.html
```

### ファイル分割の例

#### openapi.yaml（メイン）

```yaml
openapi: 3.1.0
info:
  title: My API
  version: 1.0.0

servers:
  - url: https://api.example.com/v1

paths:
  /users:
    $ref: "./paths/users.yaml"
  /todos:
    $ref: "./paths/todos.yaml"

components:
  schemas:
    User:
      $ref: "./components/schemas/User.yaml"
    Todo:
      $ref: "./components/schemas/Todo.yaml"
    Error:
      $ref: "./components/schemas/Error.yaml"
```

#### paths/users.yaml

```yaml
get:
  summary: ユーザー一覧取得
  tags:
    - Users
  responses:
    "200":
      $ref: "../components/responses/UserList.yaml"

post:
  summary: ユーザー作成
  tags:
    - Users
  requestBody:
    $ref: "../components/requestBodies/CreateUser.yaml"
  responses:
    "201":
      $ref: "../components/responses/User.yaml"
```

### CI/CD 統合

#### GitHub Actions

```yaml
# .github/workflows/openapi.yml
name: OpenAPI Validation

on:
  pull_request:
    paths:
      - "openapi/**"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate OpenAPI Spec
        uses: char0n/swagger-editor-validate@v1
        with:
          definition-file: openapi/openapi.yaml

      - name: Generate Documentation
        run: |
          npm install -g redoc-cli
          redoc-cli bundle openapi/openapi.yaml -o docs/index.html

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

---

## 学習リソース

### 公式ドキュメント

- **OpenAPI 公式サイト**: https://www.openapis.org/
- **OpenAPI 3.2 仕様**: https://spec.openapis.org/oas/v3.2.0.html
- **OpenAPI 3.1 仕様**: https://spec.openapis.org/oas/v3.1.0.html
- **Swagger 公式サイト**: https://swagger.io/

### GitHub リポジトリ

- **OpenAPI Specification**: https://github.com/OAI/OpenAPI-Specification
- **Swagger Codegen**: https://github.com/swagger-api/swagger-codegen
- **OpenAPI Generator**: https://github.com/OpenAPITools/openapi-generator
- **Redoc**: https://github.com/Redocly/redoc

### 学習ガイド

- **Learn OpenAPI**: https://learn.openapis.org/
- **Swagger Documentation**: https://swagger.io/docs/
- **OpenAPI Best Practices**: https://learn.openapis.org/best-practices.html

### ツール

#### オンラインエディター

- **Swagger Editor**: https://editor.swagger.io/
- **Stoplight Studio**: https://stoplight.io/studio

#### バリデーター

- **OpenAPI Validator**: https://apitools.dev/swagger-parser/online/
- **Spectral Linter**: https://stoplight.io/open-source/spectral

### 推奨学習パス

#### 初級（基礎を学ぶ）

1. **OpenAPI の基本概念を理解**

   - OpenAPI とは何か
   - YAML/JSON の基本構文
   - API 設計の基礎

2. **シンプルな API 仕様を書く**

   - info, paths, components
   - GET/POST エンドポイント
   - スキーマ定義

3. **ドキュメント生成を試す**
   - Swagger UI で表示
   - Redoc で表示

#### 中級（実践的な使い方）

4. **高度なスキーマ定義**

   - allOf, oneOf, anyOf
   - $ref による再利用
   - バリデーション

5. **コード生成を試す**

   - クライアント SDK 生成
   - サーバースタブ生成
   - TanStack Query との統合

6. **ベストプラクティスの適用**
   - Design-First アプローチ
   - エラーハンドリング
   - セキュリティ

#### 上級（プロダクション対応）

7. **大規模プロジェクトでの運用**

   - ファイル分割
   - バージョニング戦略
   - CI/CD 統合

8. **チーム開発**
   - レビュープロセス
   - ドキュメント自動デプロイ
   - API テスト自動化

---

## 実践プロジェクト案

### 1. シンプルな TODO API

**目的**: OpenAPI の基本を習得

**機能**:

- CRUD 操作（Create, Read, Update, Delete）
- ページネーション
- フィルタリング
- バリデーション

**成果物**:

- openapi.yaml
- Swagger UI ドキュメント
- 生成されたクライアント SDK

### 2. ブログ API

**目的**: 関連エンティティの設計を学ぶ

**機能**:

- 記事 CRUD
- コメント機能
- タグ機能
- ユーザー管理
- 認証（JWT）

**成果物**:

- 分割された OpenAPI 仕様
- Redoc ドキュメント
- TanStack Query 統合

### 3. E コマース API

**目的**: 複雑な API 設計を学ぶ

**機能**:

- 商品管理
- カート機能
- 注文処理
- 決済統合
- Webhook

**成果物**:

- 完全な OpenAPI 仕様
- 自動生成されたクライアント
- モックサーバー
- CI/CD パイプライン

---

## まとめ

### OpenAPI の強み

1. **標準化**: 業界標準の API 記述形式
2. **自動化**: ドキュメント、コード、テストの自動生成
3. **コラボレーション**: チーム間でのスムーズな連携
4. **ツールエコシステム**: 豊富なツール群
5. **Design-First**: 契約駆動開発の実現
6. **型安全性**: 生成されたコードによる型安全な開発

### いつ OpenAPI を使うべきか

| ユースケース     | 推奨度     | 理由                           |
| ---------------- | ---------- | ------------------------------ |
| REST API 開発    | ⭐⭐⭐⭐⭐ | 最適なユースケース             |
| GraphQL          | ⭐         | GraphQL スキーマを使うべき     |
| gRPC             | ⭐         | Protocol Buffers を使うべき    |
| チーム開発       | ⭐⭐⭐⭐⭐ | 契約駆動開発に最適             |
| 個人プロジェクト | ⭐⭐⭐     | 小規模でもドキュメント化の価値 |
| マイクロサービス | ⭐⭐⭐⭐⭐ | サービス間契約の明確化         |
| 外部公開 API     | ⭐⭐⭐⭐⭐ | ドキュメント自動生成が重要     |

### 今後のトレンド

- **API-First 開発の標準化**: 2025 年以降、API-First は業界標準に
- **AI 支援**: AI による OpenAPI 仕様の自動生成
- **AsyncAPI との統合**: 非同期 API の標準化
- **GraphQL との融合**: REST と GraphQL のハイブリッド
- **より良いツール**: Scalar などの新しいドキュメントツール

---

## クイックリファレンス

### 基本テンプレート

```yaml
openapi: 3.1.0
info:
  title: API Name
  version: 1.0.0

servers:
  - url: https://api.example.com/v1

paths:
  /resource:
    get:
      summary: Get resource
      responses:
        "200":
          description: Success

components:
  schemas:
    Resource:
      type: object
```

### よく使うコマンド

```bash
# ドキュメント生成
redoc-cli bundle openapi.yaml -o docs.html

# バリデーション
npx @apidevtools/swagger-cli validate openapi.yaml

# クライアント生成
openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o ./client

# モックサーバー起動
npx @stoplight/prism-cli mock openapi.yaml
```

---

**次のステップ**: 実際に OpenAPI 仕様を書いて、ドキュメントとコードを生成してみましょう！

プロジェクトディレクトリ例:

```
Projects/
├── openapi-todo/           # シンプルなTODO API
├── openapi-blog/           # ブログAPI
└── openapi-ecommerce/      # Eコマース API
```
