# DDD (Domain-Driven Design) サンプル集

## 値オブジェクト (Value Object)

```typescript
// domain/value-objects/Email.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    if (!value || !Email.isValid(value)) {
      throw new Error("Invalid email format");
    }
    return new Email(value.toLowerCase());
  }

  static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

// domain/value-objects/Money.ts
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string,
  ) {}

  static create(amount: number, currency: string = "JPY"): Money {
    if (amount < 0) throw new Error("Amount cannot be negative");
    return new Money(Math.round(amount), currency);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) throw new Error("Insufficient funds");
    return Money.create(result, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error("Currency mismatch");
    }
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

## 集約ルート (Aggregate Root)

```typescript
// domain/aggregates/Order.ts
import { Money } from "../value-objects/Money";

export class OrderItem {
  constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly quantity: number,
    public readonly unitPrice: Money,
  ) {
    if (quantity < 1) throw new Error("Quantity must be at least 1");
  }

  getSubtotal(): Money {
    return this.unitPrice.multiply(this.quantity);
  }
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export class Order {
  private items: OrderItem[] = [];
  private _status: OrderStatus = "pending";

  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly createdAt: Date,
  ) {}

  get status(): OrderStatus {
    return this._status;
  }

  addItem(item: OrderItem): void {
    if (this._status !== "pending") {
      throw new Error("Cannot modify confirmed order");
    }

    const existingIndex = this.items.findIndex(
      (i) => i.productId === item.productId,
    );

    if (existingIndex >= 0) {
      // 既存アイテムを更新
      const existing = this.items[existingIndex];
      this.items[existingIndex] = new OrderItem(
        item.productId,
        item.productName,
        existing.quantity + item.quantity,
        item.unitPrice,
      );
    } else {
      this.items.push(item);
    }
  }

  removeItem(productId: string): void {
    if (this._status !== "pending") {
      throw new Error("Cannot modify confirmed order");
    }
    this.items = this.items.filter((i) => i.productId !== productId);
  }

  confirm(): void {
    if (this._status !== "pending") {
      throw new Error("Order is not pending");
    }
    if (this.items.length === 0) {
      throw new Error("Cannot confirm empty order");
    }
    this._status = "confirmed";
  }

  ship(): void {
    if (this._status !== "confirmed") {
      throw new Error("Order must be confirmed before shipping");
    }
    this._status = "shipped";
  }

  cancel(): void {
    if (this._status === "shipped" || this._status === "delivered") {
      throw new Error("Cannot cancel shipped order");
    }
    this._status = "cancelled";
  }

  getTotal(): Money {
    return this.items.reduce(
      (total, item) => total.add(item.getSubtotal()),
      Money.create(0),
    );
  }

  getItems(): OrderItem[] {
    return [...this.items];
  }
}
```

## ドメインサービス

```typescript
// domain/services/PricingService.ts
import { Money } from "../value-objects/Money";
import { Order } from "../aggregates/Order";

export interface DiscountPolicy {
  calculate(order: Order): Money;
}

export class PercentageDiscount implements DiscountPolicy {
  constructor(private readonly percentage: number) {}

  calculate(order: Order): Money {
    const total = order.getTotal();
    return total.multiply(this.percentage / 100);
  }
}

export class FixedDiscount implements DiscountPolicy {
  constructor(private readonly amount: Money) {}

  calculate(order: Order): Money {
    const total = order.getTotal();
    if (total.getAmount() < this.amount.getAmount()) {
      return total;
    }
    return this.amount;
  }
}

export class PricingService {
  calculateFinalPrice(order: Order, discounts: DiscountPolicy[]): Money {
    let total = order.getTotal();

    for (const discount of discounts) {
      const discountAmount = discount.calculate(order);
      total = total.subtract(discountAmount);
    }

    return total;
  }
}
```

## ドメインイベント

```typescript
// domain/events/DomainEvent.ts
export interface DomainEvent {
  eventName: string;
  occurredAt: Date;
  aggregateId: string;
}

export class OrderConfirmedEvent implements DomainEvent {
  readonly eventName = "OrderConfirmed";
  readonly occurredAt = new Date();

  constructor(
    public readonly aggregateId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
  ) {}
}

export class OrderShippedEvent implements DomainEvent {
  readonly eventName = "OrderShipped";
  readonly occurredAt = new Date();

  constructor(
    public readonly aggregateId: string,
    public readonly shippingAddress: string,
  ) {}
}

// イベントディスパッチャー
export class DomainEventDispatcher {
  private handlers: Map<string, ((event: DomainEvent) => Promise<void>)[]> =
    new Map();

  register(eventName: string, handler: (event: DomainEvent) => Promise<void>) {
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) || [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }
}
```

## リポジトリ

```typescript
// domain/repositories/OrderRepository.ts
import { Order } from "../aggregates/Order";

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(id: string): Promise<void>;
}

// infrastructure/repositories/PrismaOrderRepository.ts
import { PrismaClient } from "@prisma/client";
import { Order, OrderItem } from "@/domain/aggregates/Order";
import { Money } from "@/domain/value-objects/Money";
import { OrderRepository } from "@/domain/repositories/OrderRepository";

export class PrismaOrderRepository implements OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Order | null> {
    const data = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!data) return null;

    return this.toDomain(data);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const data = await this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return data.map(this.toDomain);
  }

  async save(order: Order): Promise<void> {
    await this.prisma.order.upsert({
      where: { id: order.id },
      update: {
        status: order.status,
        items: {
          deleteMany: {},
          create: order.getItems().map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.getAmount(),
          })),
        },
      },
      create: {
        id: order.id,
        customerId: order.customerId,
        status: order.status,
        createdAt: order.createdAt,
        items: {
          create: order.getItems().map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.getAmount(),
          })),
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({ where: { id } });
  }

  private toDomain(data: any): Order {
    const order = new Order(data.id, data.customerId, data.createdAt);

    for (const item of data.items) {
      (order as any).items.push(
        new OrderItem(
          item.productId,
          item.productName,
          item.quantity,
          Money.create(item.unitPrice),
        ),
      );
    }

    (order as any)._status = data.status;

    return order;
  }
}
```

## アプリケーションサービス

```typescript
// application/services/OrderService.ts
import { Order, OrderItem } from "@/domain/aggregates/Order";
import { OrderRepository } from "@/domain/repositories/OrderRepository";
import { DomainEventDispatcher, OrderConfirmedEvent } from "@/domain/events";
import { Money } from "@/domain/value-objects/Money";

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private eventDispatcher: DomainEventDispatcher,
  ) {}

  async createOrder(customerId: string): Promise<Order> {
    const order = new Order(generateId(), customerId, new Date());
    await this.orderRepository.save(order);
    return order;
  }

  async addItemToOrder(
    orderId: string,
    productId: string,
    productName: string,
    quantity: number,
    unitPrice: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    order.addItem(
      new OrderItem(productId, productName, quantity, Money.create(unitPrice)),
    );

    await this.orderRepository.save(order);
    return order;
  }

  async confirmOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error("Order not found");

    order.confirm();
    await this.orderRepository.save(order);

    // ドメインイベント発行
    await this.eventDispatcher.dispatch(
      new OrderConfirmedEvent(
        order.id,
        order.customerId,
        order.getTotal().getAmount(),
      ),
    );

    return order;
  }
}
```
