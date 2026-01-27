# 第8章: 実装パターン

## リポジトリパターン

データアクセスの抽象化。

```typescript
// application/ports/output/Repository.ts
export interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}

// application/ports/output/UserRepository.ts
export interface UserRepository extends Repository<User, UserId> {
  findByEmail(email: Email): Promise<User | null>;
  findByRole(role: UserRole): Promise<User[]>;
}
```

### 実装

```typescript
// adapters/gateways/PrismaUserRepository.ts
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id: id.value },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.value },
    });
    return record ? this.toDomain(record) : null;
  }

  async save(user: User): Promise<void> {
    const data = this.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: user.id.value },
      create: data,
      update: data,
    });
  }

  // ... マッパーメソッド
}
```

## ファクトリパターン

複雑なオブジェクト生成をカプセル化。

```typescript
// domain/factories/OrderFactory.ts
export class OrderFactory {
  static create(props: {
    customerId: CustomerId;
    items: Array<{
      productId: ProductId;
      quantity: number;
      price: Money;
    }>;
  }): Order {
    const order = Order.create({
      id: OrderId.generate(),
      customerId: props.customerId,
    });

    for (const item of props.items) {
      order.addItem(item.productId, item.quantity, item.price);
    }

    return order;
  }

  static reconstruct(props: {
    id: string;
    customerId: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
      currency: string;
    }>;
    status: string;
    createdAt: Date;
  }): Order {
    return Order.reconstruct({
      id: OrderId.from(props.id),
      customerId: CustomerId.from(props.customerId),
      items: props.items.map((i) => ({
        productId: ProductId.from(i.productId),
        quantity: i.quantity,
        price: Money.create(i.price, i.currency as Currency),
      })),
      status: props.status as OrderStatus,
      createdAt: props.createdAt,
    });
  }
}
```

## ドメインサービス

エンティティに属さないドメインロジック。

```typescript
// domain/services/TransferService.ts
export class TransferService {
  transfer(
    fromAccount: Account,
    toAccount: Account,
    amount: Money,
  ): void {
    if (!fromAccount.canWithdraw(amount)) {
      throw new InsufficientFundsError();
    }

    fromAccount.withdraw(amount);
    toAccount.deposit(amount);
  }
}
```

```typescript
// application/use-cases/TransferMoney.ts
export class TransferMoneyUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private transferService: TransferService,
    private unitOfWork: UnitOfWork,
  ) {}

  async execute(input: TransferInput): Promise<void> {
    await this.unitOfWork.execute(async () => {
      const fromAccount = await this.accountRepository.findById(
        AccountId.from(input.fromAccountId),
      );
      const toAccount = await this.accountRepository.findById(
        AccountId.from(input.toAccountId),
      );

      if (!fromAccount || !toAccount) {
        throw new AccountNotFoundError();
      }

      const amount = Money.create(input.amount, input.currency);

      this.transferService.transfer(fromAccount, toAccount, amount);

      await this.accountRepository.save(fromAccount);
      await this.accountRepository.save(toAccount);
    });
  }
}
```

## 仕様パターン

ビジネスルールをオブジェクトとしてカプセル化。

```typescript
// domain/specifications/Specification.ts
export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

export abstract class CompositeSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>,
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return (
      this.left.isSatisfiedBy(candidate) &&
      this.right.isSatisfiedBy(candidate)
    );
  }
}
```

### 使用例

```typescript
// domain/specifications/UserSpecifications.ts
export class ActiveUserSpecification extends CompositeSpecification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.isActive;
  }
}

export class PremiumUserSpecification extends CompositeSpecification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.plan === UserPlan.Premium;
  }
}

export class EmailVerifiedSpecification extends CompositeSpecification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.emailVerified;
  }
}

// 使用
const canAccessPremiumFeature = new ActiveUserSpecification()
  .and(new PremiumUserSpecification())
  .and(new EmailVerifiedSpecification());

if (canAccessPremiumFeature.isSatisfiedBy(user)) {
  // プレミアム機能へのアクセスを許可
}
```

## イベントソーシング

状態をイベントの列として保存。

```typescript
// domain/events/Event.ts
export interface DomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
}

// domain/aggregates/EventSourcedAggregate.ts
export abstract class EventSourcedAggregate {
  private _changes: DomainEvent[] = [];
  protected _version: number = 0;

  get uncommittedChanges(): ReadonlyArray<DomainEvent> {
    return [...this._changes];
  }

  get version(): number {
    return this._version;
  }

  protected applyChange(event: DomainEvent): void {
    this.apply(event);
    this._changes.push(event);
  }

  protected abstract apply(event: DomainEvent): void;

  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.apply(event);
      this._version = event.version;
    }
  }

  markChangesAsCommitted(): void {
    this._changes = [];
  }
}
```

```typescript
// domain/aggregates/BankAccount.ts
export class BankAccount extends EventSourcedAggregate {
  private _id!: AccountId;
  private _balance!: Money;

  static create(id: AccountId, initialDeposit: Money): BankAccount {
    const account = new BankAccount();
    account.applyChange(
      new AccountCreatedEvent(id.value, initialDeposit.getAmount()),
    );
    return account;
  }

  deposit(amount: Money): void {
    this.applyChange(
      new MoneyDepositedEvent(this._id.value, amount.getAmount()),
    );
  }

  withdraw(amount: Money): void {
    if (this._balance.getAmount() < amount.getAmount()) {
      throw new InsufficientFundsError();
    }
    this.applyChange(
      new MoneyWithdrawnEvent(this._id.value, amount.getAmount()),
    );
  }

  protected apply(event: DomainEvent): void {
    if (event instanceof AccountCreatedEvent) {
      this._id = AccountId.from(event.aggregateId);
      this._balance = Money.create(event.initialAmount, Currency.JPY);
    } else if (event instanceof MoneyDepositedEvent) {
      this._balance = this._balance.add(
        Money.create(event.amount, Currency.JPY),
      );
    } else if (event instanceof MoneyWithdrawnEvent) {
      this._balance = this._balance.subtract(
        Money.create(event.amount, Currency.JPY),
      );
    }
  }
}
```

## Saga パターン

分散トランザクションの管理。

```typescript
// application/sagas/OrderSaga.ts
export class OrderSaga {
  constructor(
    private orderRepository: OrderRepository,
    private inventoryService: InventoryService,
    private paymentService: PaymentService,
    private shippingService: ShippingService,
  ) {}

  async execute(orderId: OrderId): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    try {
      // Step 1: 在庫を確保
      await this.inventoryService.reserve(order.items);

      try {
        // Step 2: 決済
        await this.paymentService.charge(order.customerId, order.totalAmount);

        try {
          // Step 3: 配送を手配
          await this.shippingService.schedule(order);

          // 全て成功
          order.complete();
          await this.orderRepository.save(order);
        } catch (shippingError) {
          // 配送失敗 → 決済を返金
          await this.paymentService.refund(order.customerId, order.totalAmount);
          throw shippingError;
        }
      } catch (paymentError) {
        // 決済失敗 → 在庫を解放
        await this.inventoryService.release(order.items);
        throw paymentError;
      }
    } catch (error) {
      order.fail(error.message);
      await this.orderRepository.save(order);
      throw error;
    }
  }
}
```

## 次のステップ

次章では、ベストプラクティスについて学びます。
