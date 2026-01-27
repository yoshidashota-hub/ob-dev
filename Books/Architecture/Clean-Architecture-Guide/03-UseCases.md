# 第3章: ユースケース

## ユースケースとは

アプリケーション固有のビジネスルールをカプセル化。

```
┌─────────────────────────────────────────────────────┐
│                    Use Case                          │
│                                                     │
│  Input ──▶ ┌─────────────────────┐ ──▶ Output       │
│            │                     │                   │
│            │  1. バリデーション   │                   │
│            │  2. ビジネスルール   │                   │
│            │  3. 永続化          │                   │
│            │  4. イベント発行     │                   │
│            │                     │                   │
│            └─────────────────────┘                   │
│                      │                               │
│                      ▼                               │
│              Repository (Interface)                  │
└─────────────────────────────────────────────────────┘
```

## 基本構造

```typescript
// application/use-cases/CreateUser.ts

// 入力 DTO
export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

// 出力 DTO
export interface CreateUserOutput {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// ユースケース
export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private eventPublisher: EventPublisher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // 1. バリデーション
    const email = Email.create(input.email);

    // 2. ビジネスルール（重複チェック）
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError(input.email);
    }

    // 3. エンティティ作成
    const hashedPassword = await this.passwordHasher.hash(input.password);
    const user = User.create({
      id: UserId.generate(),
      email,
      name: input.name,
      password: hashedPassword,
    });

    // 4. 永続化
    await this.userRepository.save(user);

    // 5. イベント発行
    await this.eventPublisher.publish(user.domainEvents);
    user.clearEvents();

    // 6. 出力を返す
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}
```

## 入出力境界

### Input Port（入力ポート）

```typescript
// application/ports/input/CreateUserPort.ts
export interface CreateUserPort {
  execute(input: CreateUserInput): Promise<CreateUserOutput>;
}

// ユースケースが実装
export class CreateUserUseCase implements CreateUserPort {
  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // ...
  }
}
```

### Output Port（出力ポート）

```typescript
// application/ports/output/UserRepository.ts
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}

// application/ports/output/PasswordHasher.ts
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

// application/ports/output/EventPublisher.ts
export interface EventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
```

## CQRS パターン

### Command（コマンド）

```typescript
// application/commands/CreateUser.ts
export interface CreateUserCommand {
  email: string;
  name: string;
  password: string;
}

export class CreateUserHandler {
  constructor(private userRepository: UserRepository) {}

  async handle(command: CreateUserCommand): Promise<UserId> {
    const user = User.create({
      id: UserId.generate(),
      email: Email.create(command.email),
      name: command.name,
      password: command.password,
    });

    await this.userRepository.save(user);
    return user.id;
  }
}
```

### Query（クエリ）

```typescript
// application/queries/GetUser.ts
export interface GetUserQuery {
  userId: string;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export class GetUserHandler {
  constructor(private userReadRepository: UserReadRepository) {}

  async handle(query: GetUserQuery): Promise<UserDTO | null> {
    return await this.userReadRepository.findById(query.userId);
  }
}

// 読み取り専用リポジトリ
export interface UserReadRepository {
  findById(id: string): Promise<UserDTO | null>;
  findAll(pagination: Pagination): Promise<UserDTO[]>;
  search(query: SearchQuery): Promise<UserDTO[]>;
}
```

## 複雑なユースケース

### 注文処理

```typescript
// application/use-cases/PlaceOrder.ts
export class PlaceOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository,
    private inventoryService: InventoryService,
    private paymentService: PaymentService,
    private eventPublisher: EventPublisher,
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderOutput> {
    // 1. 商品の存在確認と在庫チェック
    const orderItems: OrderItemData[] = [];
    for (const item of input.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }

      const isAvailable = await this.inventoryService.checkAvailability(
        item.productId,
        item.quantity,
      );
      if (!isAvailable) {
        throw new InsufficientStockError(item.productId);
      }

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // 2. 注文作成
    const order = Order.create({
      id: OrderId.generate(),
      customerId: input.customerId,
      items: orderItems,
    });

    // 3. 決済処理
    const paymentResult = await this.paymentService.charge({
      amount: order.totalAmount,
      customerId: input.customerId,
      paymentMethodId: input.paymentMethodId,
    });

    if (!paymentResult.success) {
      throw new PaymentFailedError(paymentResult.error);
    }

    order.confirm(paymentResult.transactionId);

    // 4. 在庫の確保
    await this.inventoryService.reserve(order.items);

    // 5. 永続化
    await this.orderRepository.save(order);

    // 6. イベント発行
    await this.eventPublisher.publish(order.domainEvents);

    return {
      orderId: order.id.value,
      totalAmount: order.totalAmount.getAmount(),
      status: order.status,
    };
  }
}
```

## エラーハンドリング

```typescript
// application/errors/ApplicationError.ts
export abstract class ApplicationError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
}

export class UserNotFoundError extends ApplicationError {
  readonly code = "USER_NOT_FOUND";
  readonly statusCode = 404;

  constructor(userId: string) {
    super(`User not found: ${userId}`);
  }
}

export class UserAlreadyExistsError extends ApplicationError {
  readonly code = "USER_ALREADY_EXISTS";
  readonly statusCode = 409;

  constructor(email: string) {
    super(`User already exists: ${email}`);
  }
}

export class ValidationError extends ApplicationError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly errors: Record<string, string[]>,
  ) {
    super(message);
  }
}
```

## トランザクション

```typescript
// application/use-cases/TransferMoney.ts
export class TransferMoneyUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private unitOfWork: UnitOfWork,
  ) {}

  async execute(input: TransferMoneyInput): Promise<void> {
    await this.unitOfWork.execute(async () => {
      const fromAccount = await this.accountRepository.findById(input.fromAccountId);
      const toAccount = await this.accountRepository.findById(input.toAccountId);

      if (!fromAccount || !toAccount) {
        throw new AccountNotFoundError();
      }

      const amount = Money.create(input.amount, input.currency);

      fromAccount.withdraw(amount);
      toAccount.deposit(amount);

      await this.accountRepository.save(fromAccount);
      await this.accountRepository.save(toAccount);
    });
  }
}

// UnitOfWork インターフェース
export interface UnitOfWork {
  execute<T>(work: () => Promise<T>): Promise<T>;
}
```

## 次のステップ

次章では、インターフェースアダプターについて詳しく学びます。
