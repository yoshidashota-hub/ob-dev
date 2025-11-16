---
created: 2025-11-17
tags: [learning, ddd, cqrs, event-sourcing, domain-driven-design, architecture]
status: 進行中
topic: DDD and CQRS
source: https://github.com/dotnet-architecture/eShopOnContainers
---

# ドメイン駆動設計（DDD）と CQRS

## 概要

ドメイン駆動設計（DDD）は、複雑なビジネスドメインを持つソフトウェアの設計手法。CQRS（Command Query Responsibility Segregation）は、読み取りと書き込みを分離するパターン。組み合わせることで、スケーラブルで保守性の高いシステムを構築できる。

## 学んだこと

### 🎯 DDD とは

**ドメイン駆動設計の核心:**

```
ビジネスドメインの複雑さ ＝ ソフトウェアの複雑さ

解決策:
1. ユビキタス言語（共通言語）
2. モデル駆動設計
3. 境界づけられたコンテキスト
4. 戦略的設計 + 戦術的設計
```

**なぜ DDD を使うのか:**

| 状況                         | DDD の必要性 |
| ---------------------------- | ------------ |
| 単純な CRUD                  | 低い         |
| 複雑なビジネスロジック       | 高い         |
| 長期的な保守                 | 高い         |
| ドメインエキスパートとの協業 | 非常に高い   |

---

### 📚 戦略的設計

#### ユビキタス言語（Ubiquitous Language）

**チーム全体で使う共通言語。**

```
悪い例:
開発者: "User テーブルの status カラムを更新"
ドメインエキスパート: "会員のアカウントを有効化"

良い例:
全員: "会員アカウントをアクティベートする"

コードでも同じ言葉を使う:
member.activate();  // ✅
user.setStatus(1);  // ❌
```

#### 境界づけられたコンテキスト（Bounded Context）

**言葉の意味が一貫している範囲。**

```
ECサイトの例:

┌─────────────────┐  ┌─────────────────┐
│   販売コンテキスト    │  │  配送コンテキスト    │
│  ┌───────────┐  │  │  ┌───────────┐  │
│  │  Customer │  │  │  │  Customer │  │
│  │  - 購入履歴  │  │  │  │  - 配送先   │  │
│  │  - 支払方法  │  │  │  │  - 受取可能時間│  │
│  └───────────┘  │  │  └───────────┘  │
└─────────────────┘  └─────────────────┘
                    ↑
          同じ Customer でも意味が違う
```

**コンテキストマップ:**

```typescript
// 販売コンテキスト
namespace Sales {
  interface Customer {
    id: string;
    name: string;
    creditLimit: number;
    purchaseHistory: Order[];
  }
}

// 配送コンテキスト
namespace Shipping {
  interface Customer {
    id: string;
    name: string;
    addresses: Address[];
    preferredDeliveryTime: TimeSlot;
  }
}

// アンチコラプションレイヤー（変換層）
class CustomerTranslator {
  toShippingCustomer(salesCustomer: Sales.Customer): Shipping.Customer {
    return {
      id: salesCustomer.id,
      name: salesCustomer.name,
      addresses: [], // 別途取得
      preferredDeliveryTime: this.getDefaultTimeSlot(),
    };
  }
}
```

---

### 🔧 戦術的設計

#### エンティティ（Entity）

**同一性（ID）を持つオブジェクト。**

```csharp
public class Order : Entity
{
    public OrderId Id { get; private set; }
    public CustomerId CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money TotalAmount { get; private set; }
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    // ファクトリメソッド
    public static Order Create(CustomerId customerId)
    {
        var order = new Order
        {
            Id = OrderId.New(),
            CustomerId = customerId,
            Status = OrderStatus.Draft,
            TotalAmount = Money.Zero
        };

        order.AddDomainEvent(new OrderCreatedEvent(order.Id));
        return order;
    }

    // ビジネスロジック
    public void AddItem(Product product, int quantity)
    {
        if (Status != OrderStatus.Draft)
        {
            throw new OrderModificationException("Cannot modify confirmed order");
        }

        var item = new OrderItem(product.Id, product.Price, quantity);
        _items.Add(item);
        RecalculateTotal();

        AddDomainEvent(new OrderItemAddedEvent(Id, item));
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Draft)
        {
            throw new InvalidOrderStateException("Order already confirmed");
        }

        if (!_items.Any())
        {
            throw new EmptyOrderException("Cannot confirm empty order");
        }

        Status = OrderStatus.Confirmed;
        AddDomainEvent(new OrderConfirmedEvent(Id, TotalAmount));
    }

    private void RecalculateTotal()
    {
        TotalAmount = _items.Aggregate(
            Money.Zero,
            (sum, item) => sum.Add(item.Subtotal)
        );
    }
}
```

#### 値オブジェクト（Value Object）

**同一性を持たない、属性の集合。**

```csharp
public class Money : ValueObject
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative");
        if (string.IsNullOrEmpty(currency))
            throw new ArgumentException("Currency is required");

        Amount = amount;
        Currency = currency;
    }

    public static Money Zero => new Money(0, "USD");

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new CurrencyMismatchException();

        return new Money(Amount + other.Amount, Currency);
    }

    public Money Multiply(int factor)
    {
        return new Money(Amount * factor, Currency);
    }

    // 値の等価性
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}

public class Address : ValueObject
{
    public string Street { get; }
    public string City { get; }
    public string PostalCode { get; }
    public string Country { get; }

    public Address(string street, string city, string postalCode, string country)
    {
        Street = street ?? throw new ArgumentNullException(nameof(street));
        City = city ?? throw new ArgumentNullException(nameof(city));
        PostalCode = postalCode ?? throw new ArgumentNullException(nameof(postalCode));
        Country = country ?? throw new ArgumentNullException(nameof(country));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Street;
        yield return City;
        yield return PostalCode;
        yield return Country;
    }
}

// 使用例
var address1 = new Address("123 Main St", "Tokyo", "100-0001", "Japan");
var address2 = new Address("123 Main St", "Tokyo", "100-0001", "Japan");
Console.WriteLine(address1.Equals(address2)); // true（同じ値）

var money1 = new Money(100, "USD");
var money2 = new Money(50, "USD");
var total = money1.Add(money2); // new Money(150, "USD")
```

#### 集約（Aggregate）

**整合性を保つための境界。**

```csharp
// Order が集約ルート
public class Order : Entity, IAggregateRoot
{
    // 内部のエンティティは直接アクセスさせない
    private readonly List<OrderItem> _items = new();

    public void AddItem(ProductId productId, Money price, int quantity)
    {
        // 集約内の整合性ルールを強制
        if (_items.Count >= 100)
        {
            throw new TooManyItemsException("Max 100 items per order");
        }

        var existingItem = _items.FirstOrDefault(i => i.ProductId == productId);
        if (existingItem != null)
        {
            existingItem.IncreaseQuantity(quantity);
        }
        else
        {
            _items.Add(new OrderItem(productId, price, quantity));
        }

        RecalculateTotal();
    }

    public void RemoveItem(ProductId productId)
    {
        var item = _items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null)
        {
            throw new ItemNotFoundException(productId);
        }

        _items.Remove(item);
        RecalculateTotal();
    }
}

// OrderItem は Order 集約の一部
public class OrderItem : Entity
{
    public ProductId ProductId { get; private set; }
    public Money UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public Money Subtotal => UnitPrice.Multiply(Quantity);

    internal OrderItem(ProductId productId, Money unitPrice, int quantity)
    {
        ProductId = productId;
        UnitPrice = unitPrice;
        Quantity = quantity;
    }

    internal void IncreaseQuantity(int amount)
    {
        Quantity += amount;
    }
}

// リポジトリは集約ルートのみ
public interface IOrderRepository
{
    Task<Order> GetByIdAsync(OrderId id);
    Task SaveAsync(Order order);
    // OrderItem 単体の取得/保存メソッドは提供しない
}
```

**集約の設計原則:**

```
1. 小さく保つ
   - 大きな集約 = パフォーマンス問題
   - 1つの集約 = 1つのトランザクション

2. ID で参照
   - 他の集約は ID で参照
   - 直接オブジェクト参照しない

3. 結果整合性
   - 集約間は結果整合性で OK
   - ドメインイベントで連携
```

```csharp
// 悪い例: 集約間の直接参照
public class Order
{
    public Customer Customer { get; set; } // ❌ 直接参照
}

// 良い例: ID で参照
public class Order
{
    public CustomerId CustomerId { get; private set; } // ✅ ID 参照
}
```

#### ドメインサービス（Domain Service）

**エンティティに属さないビジネスロジック。**

```csharp
public interface IOrderPricingService
{
    Money CalculateDiscount(Order order, Customer customer);
}

public class OrderPricingService : IOrderPricingService
{
    public Money CalculateDiscount(Order order, Customer customer)
    {
        var discount = Money.Zero;

        // VIP 顧客は 10% 割引
        if (customer.IsVIP)
        {
            discount = discount.Add(order.TotalAmount.Multiply(0.1m));
        }

        // 大量注文は 5% 追加割引
        if (order.Items.Count > 10)
        {
            discount = discount.Add(order.TotalAmount.Multiply(0.05m));
        }

        return discount;
    }
}

// アプリケーションサービスで使用
public class PlaceOrderHandler
{
    private readonly IOrderRepository _orderRepo;
    private readonly ICustomerRepository _customerRepo;
    private readonly IOrderPricingService _pricingService;

    public async Task<OrderId> Handle(PlaceOrderCommand command)
    {
        var order = await _orderRepo.GetByIdAsync(command.OrderId);
        var customer = await _customerRepo.GetByIdAsync(order.CustomerId);

        var discount = _pricingService.CalculateDiscount(order, customer);
        order.ApplyDiscount(discount);

        await _orderRepo.SaveAsync(order);
        return order.Id;
    }
}
```

#### ドメインイベント（Domain Event）

**ドメインで起きた重要な出来事。**

```csharp
// イベント定義
public class OrderConfirmedEvent : DomainEvent
{
    public OrderId OrderId { get; }
    public Money TotalAmount { get; }
    public DateTime ConfirmedAt { get; }

    public OrderConfirmedEvent(OrderId orderId, Money totalAmount)
    {
        OrderId = orderId;
        TotalAmount = totalAmount;
        ConfirmedAt = DateTime.UtcNow;
    }
}

// エンティティでイベントを発行
public class Order : Entity, IAggregateRoot
{
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void AddDomainEvent(IDomainEvent eventItem)
    {
        _domainEvents.Add(eventItem);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }

    public void Confirm()
    {
        Status = OrderStatus.Confirmed;
        AddDomainEvent(new OrderConfirmedEvent(Id, TotalAmount));
    }
}

// イベントハンドラー
public class OrderConfirmedEventHandler : INotificationHandler<OrderConfirmedEvent>
{
    private readonly IEmailService _emailService;
    private readonly IInventoryService _inventoryService;

    public OrderConfirmedEventHandler(
        IEmailService emailService,
        IInventoryService inventoryService)
    {
        _emailService = emailService;
        _inventoryService = inventoryService;
    }

    public async Task Handle(OrderConfirmedEvent notification, CancellationToken cancellationToken)
    {
        // メール送信
        await _emailService.SendOrderConfirmationAsync(notification.OrderId);

        // 在庫予約
        await _inventoryService.ReserveItemsAsync(notification.OrderId);
    }
}
```

---

### ⚡ CQRS（Command Query Responsibility Segregation）

**読み取りと書き込みの責務を分離。**

```
従来のアーキテクチャ:
┌─────────┐
│   UI    │
└────┬────┘
     │
┌────▼────┐
│ Service │  ← 読み書き両方
└────┬────┘
     │
┌────▼────┐
│   DB    │
└─────────┘

CQRS:
┌─────────┐
│   UI    │
└────┬────┘
     │
┌────┴────┐
│         │
▼         ▼
Command   Query
Handler   Handler
│         │
▼         ▼
Write DB  Read DB (最適化)
```

#### Command（コマンド）

**状態を変更する操作。**

```csharp
// コマンド定義
public class CreateOrderCommand : IRequest<OrderId>
{
    public CustomerId CustomerId { get; }
    public List<OrderItemDto> Items { get; }
    public AddressDto ShippingAddress { get; }

    public CreateOrderCommand(
        CustomerId customerId,
        List<OrderItemDto> items,
        AddressDto shippingAddress)
    {
        CustomerId = customerId;
        Items = items;
        ShippingAddress = shippingAddress;
    }
}

// コマンドハンドラー
public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderId>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        IProductRepository productRepository)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
    }

    public async Task<OrderId> Handle(
        CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        // ドメインオブジェクトを作成
        var order = Order.Create(command.CustomerId);
        var shippingAddress = new Address(
            command.ShippingAddress.Street,
            command.ShippingAddress.City,
            command.ShippingAddress.PostalCode,
            command.ShippingAddress.Country
        );
        order.SetShippingAddress(shippingAddress);

        // アイテムを追加
        foreach (var itemDto in command.Items)
        {
            var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
            order.AddItem(product, itemDto.Quantity);
        }

        // 永続化
        await _orderRepository.SaveAsync(order);

        return order.Id;
    }
}
```

#### Query（クエリ）

**データを読み取る操作（状態変更なし）。**

```csharp
// クエリ定義
public class GetOrderDetailsQuery : IRequest<OrderDetailsDto>
{
    public OrderId OrderId { get; }

    public GetOrderDetailsQuery(OrderId orderId)
    {
        OrderId = orderId;
    }
}

// クエリハンドラー（読み取り専用DB直接アクセス）
public class GetOrderDetailsQueryHandler : IRequestHandler<GetOrderDetailsQuery, OrderDetailsDto>
{
    private readonly string _connectionString;

    public GetOrderDetailsQueryHandler(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<OrderDetailsDto> Handle(
        GetOrderDetailsQuery query,
        CancellationToken cancellationToken)
    {
        using var connection = new SqlConnection(_connectionString);

        // 最適化されたクエリ（JOIN、インデックス活用）
        var orderDetails = await connection.QueryFirstOrDefaultAsync<OrderDetailsDto>(@"
            SELECT
                o.Id,
                o.Status,
                o.TotalAmount,
                o.CreatedAt,
                c.Name AS CustomerName,
                c.Email AS CustomerEmail,
                a.Street,
                a.City,
                a.PostalCode,
                a.Country
            FROM Orders o
            JOIN Customers c ON o.CustomerId = c.Id
            JOIN Addresses a ON o.ShippingAddressId = a.Id
            WHERE o.Id = @OrderId",
            new { OrderId = query.OrderId.Value });

        if (orderDetails == null)
        {
            throw new OrderNotFoundException(query.OrderId);
        }

        // アイテム一覧を取得
        var items = await connection.QueryAsync<OrderItemDto>(@"
            SELECT
                oi.ProductId,
                p.Name AS ProductName,
                oi.Quantity,
                oi.UnitPrice,
                oi.Subtotal
            FROM OrderItems oi
            JOIN Products p ON oi.ProductId = p.Id
            WHERE oi.OrderId = @OrderId",
            new { OrderId = query.OrderId.Value });

        orderDetails.Items = items.ToList();
        return orderDetails;
    }
}

// DTO（クエリ結果）
public class OrderDetailsDto
{
    public Guid Id { get; set; }
    public string Status { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CustomerName { get; set; }
    public string CustomerEmail { get; set; }
    public string Street { get; set; }
    public string City { get; set; }
    public string PostalCode { get; set; }
    public string Country { get; set; }
    public List<OrderItemDto> Items { get; set; }
}
```

#### 読み書きの分離

```csharp
// 書き込み: ドメインモデル経由
public class OrderCommandService
{
    private readonly IOrderRepository _repository;

    public async Task ConfirmOrder(OrderId orderId)
    {
        var order = await _repository.GetByIdAsync(orderId);
        order.Confirm(); // ビジネスロジック
        await _repository.SaveAsync(order);
    }
}

// 読み取り: 直接 SQL（最適化）
public class OrderQueryService
{
    private readonly string _connectionString;

    public async Task<IEnumerable<OrderSummaryDto>> GetRecentOrders(int count)
    {
        using var connection = new SqlConnection(_connectionString);

        return await connection.QueryAsync<OrderSummaryDto>(@"
            SELECT TOP(@Count)
                o.Id,
                o.TotalAmount,
                o.Status,
                o.CreatedAt,
                c.Name AS CustomerName
            FROM Orders o
            JOIN Customers c ON o.CustomerId = c.Id
            ORDER BY o.CreatedAt DESC",
            new { Count = count });
    }

    public async Task<DashboardDto> GetDashboardData()
    {
        using var connection = new SqlConnection(_connectionString);

        var result = await connection.QueryMultipleAsync(@"
            -- 今日の注文数
            SELECT COUNT(*) FROM Orders WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE);

            -- 今月の売上
            SELECT SUM(TotalAmount) FROM Orders
            WHERE YEAR(CreatedAt) = YEAR(GETDATE()) AND MONTH(CreatedAt) = MONTH(GETDATE());

            -- ステータス別注文数
            SELECT Status, COUNT(*) AS Count FROM Orders GROUP BY Status;
        ");

        return new DashboardDto
        {
            TodayOrderCount = await result.ReadFirstAsync<int>(),
            MonthlyRevenue = await result.ReadFirstAsync<decimal>(),
            OrdersByStatus = (await result.ReadAsync<StatusCountDto>()).ToList()
        };
    }
}
```

---

### 🔄 イベントソーシング

**状態ではなく、イベントの履歴を保存。**

```
従来: 現在の状態を保存
┌──────────────────────┐
│ Order                │
│ - Status: Shipped    │
│ - Total: $150        │
└──────────────────────┘

イベントソーシング: 変更履歴を保存
┌──────────────────────┐
│ OrderCreated         │ ─┐
│ - Time: 10:00        │  │
└──────────────────────┘  │
┌──────────────────────┐  │
│ ItemAdded            │  │  状態を
│ - Product: X         │  ├→ 再構築
│ - Amount: $100       │  │
└──────────────────────┘  │
┌──────────────────────┐  │
│ ItemAdded            │  │
│ - Product: Y         │  │
│ - Amount: $50        │  │
└──────────────────────┘  │
┌──────────────────────┐  │
│ OrderShipped         │  │
│ - Time: 14:00        │ ─┘
└──────────────────────┘
```

**実装例:**

```csharp
// イベント定義
public abstract class OrderEvent
{
    public Guid OrderId { get; }
    public DateTime OccurredAt { get; }
    public int Version { get; }

    protected OrderEvent(Guid orderId, int version)
    {
        OrderId = orderId;
        OccurredAt = DateTime.UtcNow;
        Version = version;
    }
}

public class OrderCreatedEvent : OrderEvent
{
    public Guid CustomerId { get; }

    public OrderCreatedEvent(Guid orderId, Guid customerId, int version)
        : base(orderId, version)
    {
        CustomerId = customerId;
    }
}

public class OrderItemAddedEvent : OrderEvent
{
    public Guid ProductId { get; }
    public int Quantity { get; }
    public decimal UnitPrice { get; }

    public OrderItemAddedEvent(
        Guid orderId,
        Guid productId,
        int quantity,
        decimal unitPrice,
        int version)
        : base(orderId, version)
    {
        ProductId = productId;
        Quantity = quantity;
        UnitPrice = unitPrice;
    }
}

// 集約（イベントソーシング対応）
public class Order : EventSourcedAggregate
{
    public Guid Id { get; private set; }
    public Guid CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public decimal TotalAmount { get; private set; }
    private readonly List<OrderItem> _items = new();

    // コンストラクタ（新規作成）
    public Order(Guid customerId)
    {
        var @event = new OrderCreatedEvent(Guid.NewGuid(), customerId, 1);
        Apply(@event);
        AddUncommittedEvent(@event);
    }

    // コンストラクタ（イベントから再構築）
    public Order(IEnumerable<OrderEvent> events)
    {
        foreach (var @event in events)
        {
            Apply(@event);
        }
    }

    // コマンドメソッド
    public void AddItem(Guid productId, int quantity, decimal unitPrice)
    {
        var @event = new OrderItemAddedEvent(Id, productId, quantity, unitPrice, Version + 1);
        Apply(@event);
        AddUncommittedEvent(@event);
    }

    // イベント適用メソッド
    private void Apply(OrderEvent @event)
    {
        switch (@event)
        {
            case OrderCreatedEvent e:
                Id = e.OrderId;
                CustomerId = e.CustomerId;
                Status = OrderStatus.Created;
                TotalAmount = 0;
                break;

            case OrderItemAddedEvent e:
                _items.Add(new OrderItem(e.ProductId, e.Quantity, e.UnitPrice));
                TotalAmount += e.Quantity * e.UnitPrice;
                break;

            case OrderConfirmedEvent e:
                Status = OrderStatus.Confirmed;
                break;
        }

        Version = @event.Version;
    }
}

// イベントストア
public interface IEventStore
{
    Task SaveEventsAsync(Guid aggregateId, IEnumerable<OrderEvent> events, int expectedVersion);
    Task<IEnumerable<OrderEvent>> GetEventsAsync(Guid aggregateId);
}

public class SqlEventStore : IEventStore
{
    private readonly string _connectionString;

    public async Task SaveEventsAsync(
        Guid aggregateId,
        IEnumerable<OrderEvent> events,
        int expectedVersion)
    {
        using var connection = new SqlConnection(_connectionString);
        using var transaction = connection.BeginTransaction();

        try
        {
            // 楽観的並行性制御
            var currentVersion = await connection.QueryFirstOrDefaultAsync<int?>(@"
                SELECT MAX(Version) FROM Events WHERE AggregateId = @AggregateId",
                new { AggregateId = aggregateId },
                transaction);

            if (currentVersion != expectedVersion)
            {
                throw new ConcurrencyException();
            }

            // イベントを保存
            foreach (var @event in events)
            {
                await connection.ExecuteAsync(@"
                    INSERT INTO Events (AggregateId, Version, EventType, EventData, OccurredAt)
                    VALUES (@AggregateId, @Version, @EventType, @EventData, @OccurredAt)",
                    new
                    {
                        AggregateId = aggregateId,
                        Version = @event.Version,
                        EventType = @event.GetType().Name,
                        EventData = JsonSerializer.Serialize(@event),
                        OccurredAt = @event.OccurredAt
                    },
                    transaction);
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<IEnumerable<OrderEvent>> GetEventsAsync(Guid aggregateId)
    {
        using var connection = new SqlConnection(_connectionString);

        var eventRecords = await connection.QueryAsync<EventRecord>(@"
            SELECT Version, EventType, EventData, OccurredAt
            FROM Events
            WHERE AggregateId = @AggregateId
            ORDER BY Version",
            new { AggregateId = aggregateId });

        return eventRecords.Select(r => DeserializeEvent(r.EventType, r.EventData));
    }
}

// リポジトリ
public class EventSourcedOrderRepository : IOrderRepository
{
    private readonly IEventStore _eventStore;

    public async Task<Order> GetByIdAsync(Guid orderId)
    {
        var events = await _eventStore.GetEventsAsync(orderId);
        if (!events.Any())
        {
            throw new OrderNotFoundException(orderId);
        }
        return new Order(events);
    }

    public async Task SaveAsync(Order order)
    {
        var uncommittedEvents = order.GetUncommittedEvents();
        await _eventStore.SaveEventsAsync(order.Id, uncommittedEvents, order.Version);
        order.MarkEventsAsCommitted();
    }
}
```

**イベントソーシングの利点:**

1. **完全な監査ログ**: すべての変更履歴
2. **時間旅行**: 任意の時点の状態を再現
3. **デバッグ**: 問題の原因を追跡
4. **イベント駆動**: 他システムとの連携

**注意点:**

- スキーマの進化（イベントのバージョニング）
- イベント数の増加（スナップショットが必要）
- 最終的一貫性の理解が必要

---

### 📦 eShopOnContainers の実装

**[GitHub](https://github.com/dotnet-architecture/eShopOnContainers)**

**プロジェクト構造:**

```
src/
├── Services/
│   ├── Ordering/
│   │   ├── Ordering.Domain/           # ドメイン層
│   │   │   ├── AggregatesModel/       # 集約
│   │   │   │   ├── OrderAggregate/
│   │   │   │   └── BuyerAggregate/
│   │   │   ├── Events/                # ドメインイベント
│   │   │   └── SeedWork/              # ベースクラス
│   │   ├── Ordering.Application/      # アプリケーション層
│   │   │   ├── Commands/              # コマンド
│   │   │   ├── Queries/               # クエリ
│   │   │   └── DomainEventHandlers/   # イベントハンドラー
│   │   ├── Ordering.Infrastructure/   # インフラ層
│   │   │   ├── Repositories/          # リポジトリ実装
│   │   │   └── EntityConfigurations/  # EF設定
│   │   └── Ordering.API/              # API層
│   └── Catalog/
│       └── ...
└── BuildingBlocks/
    └── EventBus/                      # イベントバス
```

**MediatR によるパイプライン:**

```csharp
// Program.cs
services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// パイプラインの設定
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidatorBehavior<,>));
services.AddTransient(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));

// ロギングビヘイビア
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Handling {RequestType}", typeof(TRequest).Name);
        var response = await next();
        _logger.LogInformation("Handled {RequestType}", typeof(TRequest).Name);
        return response;
    }
}

// トランザクションビヘイビア
public class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
{
    private readonly OrderingContext _dbContext;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var response = await next();
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
            return response;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
```

---

## 🎓 学習リソース

### 主要リポジトリ

1. **[eShopOnContainers](https://github.com/dotnet-architecture/eShopOnContainers)**

   - Microsoft の参考実装
   - DDD、CQRS、イベントソーシング
   - マイクロサービス

2. **[EventFlow](https://github.com/eventflow/EventFlow)**

   - .NET 用 CQRS/ES フレームワーク
   - 軽量で学習に最適

3. **[axon-quick-start](https://github.com/AxonIQ/axon-quick-start)**
   - Java/Kotlin 用
   - イベントソーシング入門

### 推奨書籍

- **Domain-Driven Design** - Eric Evans
- **Implementing Domain-Driven Design** - Vaughn Vernon
- **Patterns, Principles, and Practices of Domain-Driven Design** - Scott Millett

### オンラインリソース

- [DDD Community](https://dddcommunity.org/)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS](https://martinfowler.com/bliki/CQRS.html)

---

## 次のステップ

1. **実践**

   - 小さなプロジェクトで DDD を試す
   - 値オブジェクトを意識的に使う
   - ユビキタス言語を定義する

2. **深い学習**

   - 境界づけられたコンテキストの設計
   - イベントストーミング
   - サガパターン

3. **チーム導入**
   - ドメインエキスパートとの協業
   - モデリングセッションの実施
   - 段階的な導入（戦術的 → 戦略的）

---

最終更新: 2025 年 11 月
