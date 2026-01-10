---
created: 2025-11-17
tags:
  [
    learning,
    clean-architecture,
    solid,
    hexagonal,
    architecture,
    design-patterns,
  ]
status: 進行中
topic: Clean Architecture
source: https://github.com/bxcodec/go-clean-arch
---

# クリーンアーキテクチャ

## 概要

クリーンアーキテクチャは、Robert C. Martin（Uncle Bob）が提唱したソフトウェア設計手法。ビジネスロジックを外部の詳細（フレームワーク、UI、DB）から分離し、テスタブルで保守性の高いコードを実現する。

## 学んだこと

### 🎯 クリーンアーキテクチャとは

**核心的なアイデア:**

```
依存性の方向は外から内へ

┌─────────────────────────────────────┐
│        Frameworks & Drivers          │  ← 最外層（詳細）
│  ┌─────────────────────────────┐    │
│  │     Interface Adapters       │    │  ← アダプター層
│  │  ┌─────────────────────┐    │    │
│  │  │   Application       │    │    │  ← ユースケース層
│  │  │  Business Rules     │    │    │
│  │  │  ┌─────────────┐   │    │    │
│  │  │  │  Entities   │   │    │    │  ← エンティティ層（中心）
│  │  │  │  (Domain)   │   │    │    │
│  │  │  └─────────────┘   │    │    │
│  │  └─────────────────────┘    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘

依存性の規則: 内側の円は外側の円について何も知らない
```

**各層の役割:**

| 層                   | 責任                     | 例                                |
| -------------------- | ------------------------ | --------------------------------- |
| Entities             | ビジネスルール           | User, Order, Product              |
| Use Cases            | アプリケーションロジック | CreateOrder, GetUser              |
| Interface Adapters   | データ変換               | Controllers, Gateways, Presenters |
| Frameworks & Drivers | 外部詳細                 | Web Framework, DB Driver, UI      |

---

### 🏛️ SOLID 原則

クリーンアーキテクチャの基盤となる 5 つの原則。

#### S - Single Responsibility Principle (単一責任)

**一つのクラスは一つの責任のみを持つ。**

```typescript
// ❌ 悪い例: 複数の責任を持つ
class UserService {
  createUser(data: UserData): User {
    // バリデーション
    if (!data.email.includes("@")) {
      throw new Error("Invalid email");
    }

    // データベース保存
    const user = this.db.insert(data);

    // メール送信
    this.sendWelcomeEmail(user);

    // ログ記録
    this.logger.log(`User created: ${user.id}`);

    return user;
  }

  private sendWelcomeEmail(user: User) {
    // メール送信ロジック
  }
}

// ✅ 良い例: 責任を分離
class UserValidator {
  validate(data: UserData): ValidationResult {
    const errors: string[] = [];
    if (!data.email.includes("@")) {
      errors.push("Invalid email");
    }
    return { isValid: errors.length === 0, errors };
  }
}

class UserRepository {
  save(data: UserData): User {
    return this.db.insert(data);
  }
}

class WelcomeEmailSender {
  send(user: User): void {
    // メール送信ロジック
  }
}

class UserCreationService {
  constructor(
    private validator: UserValidator,
    private repository: UserRepository,
    private emailSender: WelcomeEmailSender,
    private logger: Logger
  ) {}

  create(data: UserData): User {
    const validation = this.validator.validate(data);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    const user = this.repository.save(data);
    this.emailSender.send(user);
    this.logger.info(`User created: ${user.id}`);

    return user;
  }
}
```

#### O - Open/Closed Principle (開放閉鎖)

**拡張に開いて、修正に閉じている。**

```typescript
// ❌ 悪い例: 新しい支払い方法追加時に修正が必要
class PaymentProcessor {
  process(payment: Payment): void {
    if (payment.type === "credit_card") {
      this.processCreditCard(payment);
    } else if (payment.type === "paypal") {
      this.processPayPal(payment);
    } else if (payment.type === "bank_transfer") {
      this.processBankTransfer(payment);
    }
    // 新しい支払い方法を追加するたびにここを修正
  }
}

// ✅ 良い例: 新しい支払い方法は新しいクラスを追加するだけ
interface PaymentMethod {
  process(payment: Payment): Promise<PaymentResult>;
}

class CreditCardPayment implements PaymentMethod {
  async process(payment: Payment): Promise<PaymentResult> {
    // クレジットカード処理
    return { success: true, transactionId: "cc_123" };
  }
}

class PayPalPayment implements PaymentMethod {
  async process(payment: Payment): Promise<PaymentResult> {
    // PayPal処理
    return { success: true, transactionId: "pp_456" };
  }
}

// 新しい支払い方法を追加（修正不要）
class CryptoPayment implements PaymentMethod {
  async process(payment: Payment): Promise<PaymentResult> {
    // 暗号通貨処理
    return { success: true, transactionId: "crypto_789" };
  }
}

class PaymentProcessor {
  private methods: Map<string, PaymentMethod> = new Map();

  register(type: string, method: PaymentMethod): void {
    this.methods.set(type, method);
  }

  async process(payment: Payment): Promise<PaymentResult> {
    const method = this.methods.get(payment.type);
    if (!method) {
      throw new Error(`Unknown payment type: ${payment.type}`);
    }
    return method.process(payment);
  }
}
```

#### L - Liskov Substitution Principle (リスコフの置換)

**派生クラスは基底クラスと置換可能であるべき。**

```typescript
// ❌ 悪い例: 派生クラスが基底クラスの契約を破る
class Rectangle {
  constructor(protected width: number, protected height: number) {}

  setWidth(width: number): void {
    this.width = width;
  }

  setHeight(height: number): void {
    this.height = height;
  }

  getArea(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  setWidth(width: number): void {
    this.width = width;
    this.height = width; // 契約違反: 幅を変えたら高さも変わる
  }

  setHeight(height: number): void {
    this.width = height;
    this.height = height;
  }
}

// 問題が発生
function testRectangle(rect: Rectangle) {
  rect.setWidth(5);
  rect.setHeight(10);
  console.assert(rect.getArea() === 50); // Squareだと失敗!
}

// ✅ 良い例: インターフェースで共通性を表現
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}

  getArea(): number {
    return this.width * this.height;
  }
}

class Square implements Shape {
  constructor(private side: number) {}

  getArea(): number {
    return this.side * this.side;
  }
}
```

#### I - Interface Segregation Principle (インターフェース分離)

**クライアントが使用しないメソッドに依存させない。**

```typescript
// ❌ 悪い例: 太ったインターフェース
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}

class Human implements Worker {
  work(): void {
    /* ... */
  }
  eat(): void {
    /* ... */
  }
  sleep(): void {
    /* ... */
  }
}

class Robot implements Worker {
  work(): void {
    /* ... */
  }
  eat(): void {
    throw new Error("Robots do not eat");
  } // 不要
  sleep(): void {
    throw new Error("Robots do not sleep");
  } // 不要
}

// ✅ 良い例: 細分化されたインターフェース
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Human implements Workable, Eatable, Sleepable {
  work(): void {
    /* ... */
  }
  eat(): void {
    /* ... */
  }
  sleep(): void {
    /* ... */
  }
}

class Robot implements Workable {
  work(): void {
    /* ... */
  }
  // eat()やsleep()は不要
}
```

#### D - Dependency Inversion Principle (依存性逆転)

**具体に依存せず、抽象に依存する。**

```typescript
// ❌ 悪い例: 高レベルモジュールが低レベルモジュールに直接依存
class MySQLDatabase {
  query(sql: string): any[] {
    // MySQLに依存
    return [];
  }
}

class UserRepository {
  private db: MySQLDatabase; // 具体的な実装に依存

  constructor() {
    this.db = new MySQLDatabase();
  }

  getUser(id: string): User {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`)[0];
  }
}

// ✅ 良い例: 抽象（インターフェース）に依存
interface Database {
  query(sql: string): any[];
}

class MySQLDatabase implements Database {
  query(sql: string): any[] {
    // MySQL実装
    return [];
  }
}

class PostgreSQLDatabase implements Database {
  query(sql: string): any[] {
    // PostgreSQL実装
    return [];
  }
}

class UserRepository {
  constructor(private db: Database) {} // インターフェースに依存

  getUser(id: string): User {
    return this.db.query(`SELECT * FROM users WHERE id = $1`)[0];
  }
}

// 使用時に具体的な実装を注入
const mysqlRepo = new UserRepository(new MySQLDatabase());
const pgRepo = new UserRepository(new PostgreSQLDatabase());
```

---

### 📦 実装例: Go Clean Architecture

**[go-clean-arch](https://github.com/bxcodec/go-clean-arch)**

**プロジェクト構造:**

```
.
├── app/
│   └── main.go              # エントリーポイント
├── domain/                   # エンティティ層
│   ├── article.go
│   └── author.go
├── article/
│   ├── delivery/             # Frameworks & Drivers
│   │   └── http/
│   │       └── article_handler.go
│   ├── repository/           # Interface Adapters
│   │   ├── mysql/
│   │   │   └── mysql_article.go
│   │   └── postgres/
│   │       └── postgres_article.go
│   └── usecase/              # Application Business Rules
│       └── article_usecase.go
└── pkg/
    └── utils/
```

#### 1. Entity 層（ドメイン）

```go
// domain/article.go
package domain

import "time"

// エンティティ: ビジネスルールをカプセル化
type Article struct {
    ID        int64     `json:"id"`
    Title     string    `json:"title"`
    Content   string    `json:"content"`
    Author    Author    `json:"author"`
    UpdatedAt time.Time `json:"updated_at"`
    CreatedAt time.Time `json:"created_at"`
}

// ビジネスルール: タイトルは空であってはならない
func (a *Article) Validate() error {
    if a.Title == "" {
        return ErrBadParamInput
    }
    if a.Content == "" {
        return ErrBadParamInput
    }
    return nil
}

// domain/errors.go
var (
    ErrNotFound      = errors.New("item not found")
    ErrBadParamInput = errors.New("bad input parameter")
    ErrConflict      = errors.New("data conflict")
)
```

#### 2. UseCase 層（アプリケーションロジック）

```go
// domain/article.go (インターフェース定義)
package domain

import "context"

// Repository Interface (Port)
type ArticleRepository interface {
    Fetch(ctx context.Context, cursor string, num int64) ([]Article, string, error)
    GetByID(ctx context.Context, id int64) (*Article, error)
    GetByTitle(ctx context.Context, title string) (*Article, error)
    Store(ctx context.Context, a *Article) error
    Update(ctx context.Context, a *Article) error
    Delete(ctx context.Context, id int64) error
}

// UseCase Interface
type ArticleUsecase interface {
    Fetch(ctx context.Context, cursor string, num int64) ([]Article, string, error)
    GetByID(ctx context.Context, id int64) (*Article, error)
    Store(ctx context.Context, article *Article) error
    Update(ctx context.Context, article *Article) error
    Delete(ctx context.Context, id int64) error
}

// article/usecase/article_usecase.go (実装)
package usecase

import (
    "context"
    "time"

    "github.com/bxcodec/go-clean-arch/domain"
)

type articleUsecase struct {
    articleRepo    domain.ArticleRepository
    authorRepo     domain.AuthorRepository
    contextTimeout time.Duration
}

func NewArticleUsecase(
    articleRepo domain.ArticleRepository,
    authorRepo domain.AuthorRepository,
    timeout time.Duration,
) domain.ArticleUsecase {
    return &articleUsecase{
        articleRepo:    articleRepo,
        authorRepo:     authorRepo,
        contextTimeout: timeout,
    }
}

func (u *articleUsecase) Fetch(c context.Context, cursor string, num int64) ([]domain.Article, string, error) {
    ctx, cancel := context.WithTimeout(c, u.contextTimeout)
    defer cancel()

    articles, nextCursor, err := u.articleRepo.Fetch(ctx, cursor, num)
    if err != nil {
        return nil, "", err
    }

    // ビジネスロジック: 著者情報を埋める
    for i, article := range articles {
        author, err := u.authorRepo.GetByID(ctx, article.Author.ID)
        if err == nil {
            articles[i].Author = *author
        }
    }

    return articles, nextCursor, nil
}

func (u *articleUsecase) Store(c context.Context, article *domain.Article) error {
    ctx, cancel := context.WithTimeout(c, u.contextTimeout)
    defer cancel()

    // ビジネスルールの適用
    if err := article.Validate(); err != nil {
        return err
    }

    // 重複チェック
    existing, _ := u.articleRepo.GetByTitle(ctx, article.Title)
    if existing != nil {
        return domain.ErrConflict
    }

    article.CreatedAt = time.Now()
    article.UpdatedAt = time.Now()

    return u.articleRepo.Store(ctx, article)
}
```

#### 3. Interface Adapters 層

```go
// article/repository/mysql/mysql_article.go
package mysql

import (
    "context"
    "database/sql"
    "time"

    "github.com/bxcodec/go-clean-arch/domain"
)

type mysqlArticleRepository struct {
    Conn *sql.DB
}

func NewMysqlArticleRepository(conn *sql.DB) domain.ArticleRepository {
    return &mysqlArticleRepository{Conn: conn}
}

func (m *mysqlArticleRepository) Fetch(ctx context.Context, cursor string, num int64) ([]domain.Article, string, error) {
    query := `SELECT id, title, content, author_id, updated_at, created_at
              FROM article WHERE created_at > ? ORDER BY created_at LIMIT ?`

    rows, err := m.Conn.QueryContext(ctx, query, cursor, num)
    if err != nil {
        return nil, "", err
    }
    defer rows.Close()

    var articles []domain.Article
    for rows.Next() {
        var article domain.Article
        err = rows.Scan(
            &article.ID,
            &article.Title,
            &article.Content,
            &article.Author.ID,
            &article.UpdatedAt,
            &article.CreatedAt,
        )
        if err != nil {
            return nil, "", err
        }
        articles = append(articles, article)
    }

    nextCursor := ""
    if len(articles) > 0 {
        nextCursor = articles[len(articles)-1].CreatedAt.Format(time.RFC3339)
    }

    return articles, nextCursor, nil
}

func (m *mysqlArticleRepository) GetByID(ctx context.Context, id int64) (*domain.Article, error) {
    query := `SELECT id, title, content, author_id, updated_at, created_at
              FROM article WHERE id = ?`

    var article domain.Article
    err := m.Conn.QueryRowContext(ctx, query, id).Scan(
        &article.ID,
        &article.Title,
        &article.Content,
        &article.Author.ID,
        &article.UpdatedAt,
        &article.CreatedAt,
    )

    if err != nil {
        if err == sql.ErrNoRows {
            return nil, domain.ErrNotFound
        }
        return nil, err
    }

    return &article, nil
}

func (m *mysqlArticleRepository) Store(ctx context.Context, a *domain.Article) error {
    query := `INSERT INTO article (title, content, author_id, updated_at, created_at)
              VALUES (?, ?, ?, ?, ?)`

    result, err := m.Conn.ExecContext(ctx, query,
        a.Title,
        a.Content,
        a.Author.ID,
        a.UpdatedAt,
        a.CreatedAt,
    )
    if err != nil {
        return err
    }

    lastID, err := result.LastInsertId()
    if err != nil {
        return err
    }
    a.ID = lastID

    return nil
}
```

#### 4. Frameworks & Drivers 層

```go
// article/delivery/http/article_handler.go
package http

import (
    "net/http"
    "strconv"

    "github.com/labstack/echo/v4"
    "github.com/bxcodec/go-clean-arch/domain"
)

type ResponseError struct {
    Message string `json:"message"`
}

type ArticleHandler struct {
    AUsecase domain.ArticleUsecase
}

func NewArticleHandler(e *echo.Echo, us domain.ArticleUsecase) {
    handler := &ArticleHandler{AUsecase: us}

    e.GET("/articles", handler.FetchArticle)
    e.GET("/articles/:id", handler.GetByID)
    e.POST("/articles", handler.Store)
    e.PUT("/articles/:id", handler.Update)
    e.DELETE("/articles/:id", handler.Delete)
}

func (a *ArticleHandler) FetchArticle(c echo.Context) error {
    numS := c.QueryParam("num")
    num, _ := strconv.Atoi(numS)
    if num == 0 {
        num = 10 // デフォルト
    }
    cursor := c.QueryParam("cursor")

    ctx := c.Request().Context()
    articles, nextCursor, err := a.AUsecase.Fetch(ctx, cursor, int64(num))
    if err != nil {
        return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
    }

    c.Response().Header().Set("X-Cursor", nextCursor)
    return c.JSON(http.StatusOK, articles)
}

func (a *ArticleHandler) GetByID(c echo.Context) error {
    idP, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        return c.JSON(http.StatusBadRequest, ResponseError{Message: "invalid id"})
    }

    ctx := c.Request().Context()
    article, err := a.AUsecase.GetByID(ctx, int64(idP))
    if err != nil {
        return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
    }

    return c.JSON(http.StatusOK, article)
}

func (a *ArticleHandler) Store(c echo.Context) error {
    var article domain.Article
    if err := c.Bind(&article); err != nil {
        return c.JSON(http.StatusUnprocessableEntity, ResponseError{Message: err.Error()})
    }

    ctx := c.Request().Context()
    if err := a.AUsecase.Store(ctx, &article); err != nil {
        return c.JSON(getStatusCode(err), ResponseError{Message: err.Error()})
    }

    return c.JSON(http.StatusCreated, article)
}

func getStatusCode(err error) int {
    if err == nil {
        return http.StatusOK
    }

    switch err {
    case domain.ErrNotFound:
        return http.StatusNotFound
    case domain.ErrConflict:
        return http.StatusConflict
    case domain.ErrBadParamInput:
        return http.StatusBadRequest
    default:
        return http.StatusInternalServerError
    }
}
```

#### 5. 依存性注入（Wire Up）

```go
// app/main.go
package main

import (
    "database/sql"
    "log"
    "time"

    "github.com/labstack/echo/v4"
    _ "github.com/go-sql-driver/mysql"

    _articleHttpDeliver "github.com/bxcodec/go-clean-arch/article/delivery/http"
    _articleRepo "github.com/bxcodec/go-clean-arch/article/repository/mysql"
    _articleUsecase "github.com/bxcodec/go-clean-arch/article/usecase"
    _authorRepo "github.com/bxcodec/go-clean-arch/author/repository/mysql"
)

func main() {
    dbConn, err := sql.Open("mysql", "user:pass@tcp(localhost:3306)/dbname")
    if err != nil {
        log.Fatal(err)
    }
    defer dbConn.Close()

    e := echo.New()

    // Repository layer
    articleRepo := _articleRepo.NewMysqlArticleRepository(dbConn)
    authorRepo := _authorRepo.NewMysqlAuthorRepository(dbConn)

    // Usecase layer
    timeoutContext := time.Duration(2) * time.Second
    articleUsecase := _articleUsecase.NewArticleUsecase(articleRepo, authorRepo, timeoutContext)

    // Delivery layer
    _articleHttpDeliver.NewArticleHandler(e, articleUsecase)

    log.Fatal(e.Start(":8080"))
}
```

---

### 🔧 TypeScript/Node.js での実装

```typescript
// src/domain/entities/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// src/domain/entities/user.validation.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// src/domain/repositories/user.repository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// src/application/usecases/create-user.usecase.ts
import { User } from "../../domain/entities/user";
import { UserRepository } from "../../domain/repositories/user.repository";
import { validateEmail } from "../../domain/entities/user.validation";
import { v4 as uuidv4 } from "uuid";

interface CreateUserInput {
  email: string;
  name: string;
}

interface CreateUserOutput {
  id: string;
  email: string;
  name: string;
}

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // バリデーション
    if (!validateEmail(input.email)) {
      throw new Error("Invalid email format");
    }

    if (!input.name || input.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    // 重複チェック
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // ユーザー作成
    const user: User = {
      id: uuidv4(),
      email: input.email.toLowerCase(),
      name: input.name.trim(),
      createdAt: new Date(),
    };

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
    };
  }
}

// src/infrastructure/repositories/prisma-user.repository.ts
import { PrismaClient } from "@prisma/client";
import { User } from "../../domain/entities/user";
import { UserRepository } from "../../domain/repositories/user.repository";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user;
  }

  async save(user: User): Promise<User> {
    const savedUser = await this.prisma.user.create({
      data: user,
    });
    return savedUser;
  }

  async update(user: User): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: user,
    });
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}

// src/interfaces/http/controllers/user.controller.ts
import { Request, Response } from "express";
import { CreateUserUseCase } from "../../../application/usecases/create-user.usecase";

export class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { email, name } = req.body;
      const user = await this.createUserUseCase.execute({ email, name });
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
}

// src/main.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaUserRepository } from "./infrastructure/repositories/prisma-user.repository";
import { CreateUserUseCase } from "./application/usecases/create-user.usecase";
import { UserController } from "./interfaces/http/controllers/user.controller";

const app = express();
app.use(express.json());

// 依存性注入
const prisma = new PrismaClient();
const userRepository = new PrismaUserRepository(prisma);
const createUserUseCase = new CreateUserUseCase(userRepository);
const userController = new UserController(createUserUseCase);

// ルーティング
app.post("/users", (req, res) => userController.create(req, res));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

---

### 🧪 テスト容易性

クリーンアーキテクチャの最大の利点の一つはテスト容易性。

```typescript
// tests/unit/create-user.usecase.test.ts
import { CreateUserUseCase } from "../../src/application/usecases/create-user.usecase";
import { UserRepository } from "../../src/domain/repositories/user.repository";
import { User } from "../../src/domain/entities/user";

// モックリポジトリ
class MockUserRepository implements UserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  async save(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async update(user: User): Promise<User> {
    const index = this.users.findIndex((u) => u.id === user.id);
    this.users[index] = user;
    return user;
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id);
  }
}

describe("CreateUserUseCase", () => {
  let useCase: CreateUserUseCase;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    useCase = new CreateUserUseCase(mockRepository);
  });

  it("should create a user successfully", async () => {
    const input = {
      email: "test@example.com",
      name: "Test User",
    };

    const result = await useCase.execute(input);

    expect(result.email).toBe("test@example.com");
    expect(result.name).toBe("Test User");
    expect(result.id).toBeDefined();
  });

  it("should throw error for invalid email", async () => {
    const input = {
      email: "invalid-email",
      name: "Test User",
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      "Invalid email format"
    );
  });

  it("should throw error for short name", async () => {
    const input = {
      email: "test@example.com",
      name: "A",
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      "Name must be at least 2 characters"
    );
  });

  it("should throw error for duplicate email", async () => {
    const input = {
      email: "test@example.com",
      name: "Test User",
    };

    await useCase.execute(input);
    await expect(useCase.execute(input)).rejects.toThrow(
      "Email already exists"
    );
  });
});
```

---

### 🌍 React フロントエンドでの適用

**bulletproof-react パターン:**

```typescript
// src/features/auth/domain/user.entity.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

// src/features/auth/application/login.usecase.ts
import { AuthRepository } from "../domain/auth.repository";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: User;
  token: string;
}

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    if (!input.email || !input.password) {
      throw new Error("Email and password are required");
    }

    const result = await this.authRepository.login(input.email, input.password);
    return result;
  }
}

// src/features/auth/infrastructure/api-auth.repository.ts
import { AuthRepository } from "../domain/auth.repository";
import { apiClient } from "@/lib/api-client";

export class ApiAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<LoginOutput> {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  }
}

// src/features/auth/presentation/hooks/use-login.ts
import { useMutation } from "@tanstack/react-query";
import { LoginUseCase, LoginInput } from "../../application/login.usecase";
import { ApiAuthRepository } from "../../infrastructure/api-auth.repository";
import { useAuthStore } from "@/stores/auth";

const loginUseCase = new LoginUseCase(new ApiAuthRepository());

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (input: LoginInput) => loginUseCase.execute(input),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};

// src/features/auth/presentation/components/LoginForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "../hooks/use-login";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export const LoginForm = () => {
  const loginMutation = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} type="email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register("password")} type="password" />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Logging in..." : "Login"}
      </button>

      {loginMutation.isError && <span>{loginMutation.error.message}</span>}
    </form>
  );
};
```

---

### 📊 ヘキサゴナルアーキテクチャとの比較

**類似点と相違点:**

```
クリーンアーキテクチャ:
┌─────────────────┐
│   Frameworks    │
│  ┌───────────┐  │
│  │  Adapters │  │
│  │  ┌─────┐  │  │
│  │  │ Use │  │  │
│  │  │Cases│  │  │
│  │  │┌───┐│  │  │
│  │  ││Ent││  │  │
│  │  │└───┘│  │  │
│  │  └─────┘  │  │
│  └───────────┘  │
└─────────────────┘

ヘキサゴナルアーキテクチャ:
           ┌──────┐
    ┌──────┤ Port ├──────┐
    │      └──────┘      │
┌───┴───┐           ┌───┴───┐
│Adapter│  Domain   │Adapter│
└───┬───┘           └───┬───┘
    │      ┌──────┐      │
    └──────┤ Port ├──────┘
           └──────┘

共通:
- ドメイン（ビジネスロジック）を中心に
- 依存性逆転の原則
- 外部詳細からの分離

違い:
- クリーンアーキテクチャ: 円形の層構造
- ヘキサゴナル: ポートとアダプター
```

---

## 🎓 学習リソース

### 主要リポジトリ

1. **[go-clean-arch](https://github.com/bxcodec/go-clean-arch)**

   - Go 言語での実装
   - シンプルで理解しやすい
   - MySQL/PostgreSQL 対応

2. **[bulletproof-react](https://github.com/alan2207/bulletproof-react)**

   - React/TypeScript のベストプラクティス
   - Feature-based 構造
   - 完全なプロジェクトテンプレート

3. **[Android-CleanArchitecture](https://github.com/android10/Android-CleanArchitecture)**
   - Android での実装
   - MVP パターン
   - RxJava 活用

### 推奨書籍

- **Clean Architecture** - Robert C. Martin
- **Clean Code** - Robert C. Martin
- **Patterns of Enterprise Application Architecture** - Martin Fowler

### オンラインリソース

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

---

## 次のステップ

1. **実践**

   - 既存プロジェクトをリファクタリング
   - SOLID 原則を意識したコード
   - テストファーストで開発

2. **深い学習**

   - DDD との組み合わせ
   - CQRS パターンの導入
   - イベント駆動アーキテクチャ

3. **チーム導入**
   - コーディング規約の策定
   - コードレビューの観点整理
   - ドキュメント化

---

最終更新: 2025 年 11 月
