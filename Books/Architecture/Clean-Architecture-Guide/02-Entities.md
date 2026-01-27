# 第2章: エンティティ

## エンティティとは

ビジネスの核となるルールをカプセル化したオブジェクト。

```
┌─────────────────────────────────────────────────────┐
│                    Entity                            │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Properties (状態)                          │   │
│  │  - id                                       │   │
│  │  - email                                    │   │
│  │  - name                                     │   │
│  │  - status                                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Business Rules (振る舞い)                   │   │
│  │  - activate()                               │   │
│  │  - deactivate()                             │   │
│  │  - canPerformAction()                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Invariants (不変条件)                       │   │
│  │  - email は常に有効な形式                    │   │
│  │  - status は valid な値のみ                  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 基本的なエンティティ

```typescript
// domain/entities/User.ts
export type UserId = string & { readonly brand: unique symbol };
export type Email = string & { readonly brand: unique symbol };

export class User {
  private constructor(
    public readonly id: UserId,
    public readonly email: Email,
    private _name: string,
    private _status: UserStatus,
    public readonly createdAt: Date,
  ) {}

  // ファクトリメソッド
  static create(props: {
    id: UserId;
    email: Email;
    name: string;
  }): User {
    return new User(
      props.id,
      props.email,
      props.name,
      UserStatus.Active,
      new Date(),
    );
  }

  // 再構築（DBからの復元用）
  static reconstruct(props: {
    id: UserId;
    email: Email;
    name: string;
    status: UserStatus;
    createdAt: Date;
  }): User {
    return new User(
      props.id,
      props.email,
      props.name,
      props.status,
      props.createdAt,
    );
  }

  // Getter
  get name(): string {
    return this._name;
  }

  get status(): UserStatus {
    return this._status;
  }

  get isActive(): boolean {
    return this._status === UserStatus.Active;
  }

  // ビジネスロジック
  changeName(newName: string): void {
    if (newName.length < 1 || newName.length > 100) {
      throw new InvalidNameError(newName);
    }
    this._name = newName;
  }

  deactivate(): void {
    if (this._status === UserStatus.Deactivated) {
      throw new UserAlreadyDeactivatedError(this.id);
    }
    this._status = UserStatus.Deactivated;
  }

  activate(): void {
    if (this._status === UserStatus.Active) {
      throw new UserAlreadyActiveError(this.id);
    }
    this._status = UserStatus.Active;
  }
}

export enum UserStatus {
  Active = "active",
  Deactivated = "deactivated",
}
```

## 値オブジェクト（Value Object）

エンティティとは異なり、IDを持たず、値の等価性で比較される。

```typescript
// domain/value-objects/Email.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    if (!this.isValid(value)) {
      throw new InvalidEmailError(value);
    }
    return new Email(value.toLowerCase());
  }

  private static isValid(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

```typescript
// domain/value-objects/Money.ts
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: Currency,
  ) {}

  static create(amount: number, currency: Currency): Money {
    if (amount < 0) {
      throw new NegativeAmountError(amount);
    }
    return new Money(amount, currency);
  }

  static zero(currency: Currency): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError();
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError();
    }
    if (this.amount < other.amount) {
      throw new InsufficientFundsError();
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

## 集約（Aggregate）

関連するエンティティのグループ。集約ルートを通じてのみアクセス。

```typescript
// domain/aggregates/Order.ts
export class Order {
  private _items: OrderItem[] = [];

  private constructor(
    public readonly id: OrderId,
    public readonly customerId: CustomerId,
    private _status: OrderStatus,
    public readonly createdAt: Date,
  ) {}

  static create(id: OrderId, customerId: CustomerId): Order {
    return new Order(id, customerId, OrderStatus.Draft, new Date());
  }

  // 集約ルートを通じてのみアイテムを追加
  addItem(productId: ProductId, quantity: number, price: Money): void {
    if (this._status !== OrderStatus.Draft) {
      throw new OrderNotEditableError(this.id);
    }

    const existingItem = this._items.find((i) => i.productId === productId);
    if (existingItem) {
      existingItem.increaseQuantity(quantity);
    } else {
      this._items.push(new OrderItem(productId, quantity, price));
    }
  }

  removeItem(productId: ProductId): void {
    if (this._status !== OrderStatus.Draft) {
      throw new OrderNotEditableError(this.id);
    }

    this._items = this._items.filter((i) => i.productId !== productId);
  }

  get items(): ReadonlyArray<OrderItem> {
    return [...this._items];
  }

  get totalAmount(): Money {
    return this._items.reduce(
      (total, item) => total.add(item.subtotal),
      Money.zero(Currency.JPY),
    );
  }

  confirm(): void {
    if (this._items.length === 0) {
      throw new EmptyOrderError(this.id);
    }
    if (this._status !== OrderStatus.Draft) {
      throw new InvalidOrderStatusTransitionError(this._status, OrderStatus.Confirmed);
    }
    this._status = OrderStatus.Confirmed;
  }

  cancel(): void {
    if (this._status === OrderStatus.Shipped) {
      throw new CannotCancelShippedOrderError(this.id);
    }
    this._status = OrderStatus.Cancelled;
  }
}

// 集約内のエンティティ
class OrderItem {
  constructor(
    public readonly productId: ProductId,
    private _quantity: number,
    public readonly price: Money,
  ) {}

  get quantity(): number {
    return this._quantity;
  }

  get subtotal(): Money {
    return this.price.multiply(this._quantity);
  }

  increaseQuantity(amount: number): void {
    this._quantity += amount;
  }
}
```

## ドメインイベント

```typescript
// domain/events/DomainEvent.ts
export interface DomainEvent {
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

export class UserCreatedEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly name: string,
  ) {}
}

export class OrderConfirmedEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    public readonly aggregateId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
  ) {}
}
```

```typescript
// エンティティでイベントを発行
export class User {
  private _domainEvents: DomainEvent[] = [];

  static create(props: CreateUserProps): User {
    const user = new User(/* ... */);
    user._domainEvents.push(
      new UserCreatedEvent(props.id, props.email, props.name),
    );
    return user;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
```

## 不変条件の保護

```typescript
export class Account {
  private constructor(
    public readonly id: AccountId,
    private _balance: Money,
  ) {
    // 不変条件: 残高は負にならない
    this.assertInvariants();
  }

  private assertInvariants(): void {
    if (this._balance.getAmount() < 0) {
      throw new InvariantViolationError("Balance cannot be negative");
    }
  }

  withdraw(amount: Money): void {
    const newBalance = this._balance.subtract(amount);
    this._balance = newBalance;
    this.assertInvariants();
  }

  deposit(amount: Money): void {
    this._balance = this._balance.add(amount);
    this.assertInvariants();
  }
}
```

## 次のステップ

次章では、ユースケースについて詳しく学びます。
