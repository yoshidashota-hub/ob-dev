---
created: 2025-11-17
tags:
  [learning, microservices, distributed-systems, architecture, kubernetes, grpc]
status: 進行中
topic: Microservices Architecture
source: https://github.com/GoogleCloudPlatform/microservices-demo
---

# マイクロサービスアーキテクチャ

## 概要

マイクロサービスは、アプリケーションを小さな独立したサービスに分割するアーキテクチャスタイル。各サービスは特定のビジネス機能を担い、独立してデプロイ・スケール可能。

## 学んだこと

### 🎯 マイクロサービスとは

**モノリス vs マイクロサービス:**

```
モノリス:
┌─────────────────────────────┐
│        Single Codebase      │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│  │UI │ │Biz│ │DB │ │Auth│  │
│  └───┘ └───┘ └───┘ └───┘  │
│         (全て一体)          │
└─────────────────────────────┘

マイクロサービス:
┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│ UI  │  │Order│  │User │  │Pay  │
│ Svc │  │ Svc │  │ Svc │  │ Svc │
└──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
   │        │        │        │
   │    API Gateway / Service Mesh    │
   └────────┴────────┴────────┘
        (独立したサービス群)
```

**特徴:**

| 特性               | モノリス | マイクロサービス |
| ------------------ | -------- | ---------------- |
| デプロイ           | 全体     | サービス単位     |
| スケーリング       | 全体     | サービス単位     |
| 技術スタック       | 統一     | 多様             |
| チーム構成         | 機能別   | サービス別       |
| 障害影響           | 全体     | 局所的           |
| 複雑性             | 低〜中   | 高               |
| 開発速度（初期）   | 速い     | 遅い             |
| 開発速度（成熟期） | 遅い     | 速い             |

---

### 📦 実践的なデモ: Google Microservices Demo

**[microservices-demo](https://github.com/GoogleCloudPlatform/microservices-demo)**

11 のマイクロサービスで構成された EC サイト。

**アーキテクチャ:**

```
                    ┌─────────────┐
                    │   Client    │
                    │  (Browser)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Frontend  │
                    │    (Go)     │
                    └──────┬──────┘
                           │ gRPC
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │  Cart   │      │Checkout │      │Recommend│
    │Service  │      │ Service │      │  ation  │
    │  (C#)   │      │  (Go)   │      │(Python) │
    └────┬────┘      └────┬────┘      └─────────┘
         │                 │
    ┌────▼────┐      ┌────▼────┐
    │  Redis  │      │ Product │
    │ (Cache) │      │ Catalog │
    └─────────┘      │  (Go)   │
                     └────┬────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │ Payment │     │Shipping │     │Currency │
    │ Service │     │ Service │     │ Service │
    │ (Node)  │     │  (Go)   │     │  (C++)  │
    └─────────┘     └─────────┘     └─────────┘
```

**サービス一覧:**

| サービス              | 言語    | 役割       |
| --------------------- | ------- | ---------- |
| Frontend              | Go      | WebUI 提供 |
| CartService           | C#      | カート管理 |
| ProductCatalogService | Go      | 商品情報   |
| CurrencyService       | C++     | 通貨変換   |
| PaymentService        | Node.js | 決済処理   |
| ShippingService       | Go      | 配送計算   |
| EmailService          | Python  | メール送信 |
| CheckoutService       | Go      | 注文処理   |
| RecommendationService | Python  | 推薦       |
| AdService             | Java    | 広告配信   |
| LoadGenerator         | Python  | 負荷生成   |

---

### 🔌 サービス間通信

#### gRPC (Google Remote Procedure Call)

**Protocol Buffers の定義:**

```protobuf
// demo.proto
syntax = "proto3";

package hipstershop;

// サービス定義
service ProductCatalogService {
  rpc ListProducts(Empty) returns (ListProductsResponse) {}
  rpc GetProduct(GetProductRequest) returns (Product) {}
  rpc SearchProducts(SearchProductsRequest) returns (SearchProductsResponse) {}
}

// メッセージ定義
message Product {
  string id = 1;
  string name = 2;
  string description = 3;
  string picture = 4;
  Money price_usd = 5;
  repeated string categories = 6;
}

message Money {
  string currency_code = 1;  // ISO 4217
  int64 units = 2;           // 整数部
  int32 nanos = 3;           // 小数部 (10^-9)
}

message GetProductRequest {
  string id = 1;
}

message ListProductsResponse {
  repeated Product products = 1;
}

message SearchProductsRequest {
  string query = 1;
}

message SearchProductsResponse {
  repeated Product results = 1;
}

message Empty {}
```

**Go 実装例:**

```go
// server.go
package main

import (
    "context"
    "log"
    "net"

    pb "github.com/GoogleCloudPlatform/microservices-demo/src/productcatalogservice/genproto"
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

type productCatalog struct {
    pb.UnimplementedProductCatalogServiceServer
    products []*pb.Product
}

func (p *productCatalog) ListProducts(ctx context.Context, _ *pb.Empty) (*pb.ListProductsResponse, error) {
    return &pb.ListProductsResponse{Products: p.products}, nil
}

func (p *productCatalog) GetProduct(ctx context.Context, req *pb.GetProductRequest) (*pb.Product, error) {
    for _, product := range p.products {
        if req.Id == product.Id {
            return product, nil
        }
    }
    return nil, status.Errorf(codes.NotFound, "product with ID %s not found", req.Id)
}

func (p *productCatalog) SearchProducts(ctx context.Context, req *pb.SearchProductsRequest) (*pb.SearchProductsResponse, error) {
    var results []*pb.Product
    for _, product := range p.products {
        if containsQuery(product, req.Query) {
            results = append(results, product)
        }
    }
    return &pb.SearchProductsResponse{Results: results}, nil
}

func main() {
    port := ":3550"
    lis, err := net.Listen("tcp", port)
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }

    grpcServer := grpc.NewServer()
    pb.RegisterProductCatalogServiceServer(grpcServer, &productCatalog{
        products: loadProducts(),
    })

    log.Printf("Starting gRPC server on %s", port)
    if err := grpcServer.Serve(lis); err != nil {
        log.Fatalf("failed to serve: %v", err)
    }
}
```

**クライアント側:**

```go
// client.go
package main

import (
    "context"
    "log"
    "time"

    pb "github.com/GoogleCloudPlatform/microservices-demo/src/productcatalogservice/genproto"
    "google.golang.org/grpc"
)

func main() {
    conn, err := grpc.Dial("productcatalogservice:3550", grpc.WithInsecure())
    if err != nil {
        log.Fatalf("failed to connect: %v", err)
    }
    defer conn.Close()

    client := pb.NewProductCatalogServiceClient(conn)

    ctx, cancel := context.WithTimeout(context.Background(), time.Second)
    defer cancel()

    // 商品一覧を取得
    resp, err := client.ListProducts(ctx, &pb.Empty{})
    if err != nil {
        log.Fatalf("ListProducts failed: %v", err)
    }

    for _, product := range resp.Products {
        log.Printf("Product: %s - %s", product.Id, product.Name)
    }
}
```

#### REST vs gRPC

| 特性           | REST     | gRPC               |
| -------------- | -------- | ------------------ |
| プロトコル     | HTTP/1.1 | HTTP/2             |
| フォーマット   | JSON/XML | Protocol Buffers   |
| 型安全性       | なし     | あり               |
| パフォーマンス | 低〜中   | 高                 |
| ストリーミング | 困難     | ネイティブサポート |
| ブラウザ対応   | 完全     | 限定的             |
| 学習曲線       | 低い     | 高い               |

---

### 🚀 Kubernetes へのデプロイ

**Deployment 定義:**

```yaml
# productcatalog-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: productcatalogservice
  labels:
    app: productcatalogservice
spec:
  replicas: 3
  selector:
    matchLabels:
      app: productcatalogservice
  template:
    metadata:
      labels:
        app: productcatalogservice
    spec:
      containers:
        - name: server
          image: gcr.io/google-samples/microservices-demo/productcatalogservice:v0.3.0
          ports:
            - containerPort: 3550
          env:
            - name: PORT
              value: "3550"
            - name: DISABLE_STATS
              value: "true"
            - name: DISABLE_TRACING
              value: "true"
          resources:
            requests:
              cpu: 100m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 128Mi
          readinessProbe:
            grpc:
              port: 3550
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            grpc:
              port: 3550
            initialDelaySeconds: 15
            periodSeconds: 20

---
# Service定義
apiVersion: v1
kind: Service
metadata:
  name: productcatalogservice
spec:
  selector:
    app: productcatalogservice
  ports:
    - port: 3550
      targetPort: 3550
  type: ClusterIP
```

**ConfigMap と Secret:**

```yaml
# config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"
  FEATURE_FLAG_NEW_UI: "true"

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DB_PASSWORD: "super-secret-password"
  API_KEY: "sk-1234567890"
```

**使用:**

```yaml
spec:
  containers:
    - name: app
      image: myapp:v1
      env:
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_PASSWORD
```

---

### 🌐 サービスメッシュ (Istio)

**Istio の役割:**

```
┌─────────────────────────────────────────┐
│              Istio Control Plane         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Pilot  │ │ Citadel │ │  Galley │   │
│  └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│    Service A    │    │    Service B    │
│  ┌───────────┐  │    │  ┌───────────┐  │
│  │    App    │  │    │  │    App    │  │
│  └─────┬─────┘  │    │  └─────┬─────┘  │
│        │        │    │        │        │
│  ┌─────▼─────┐  │    │  ┌─────▼─────┐  │
│  │   Envoy   │◄─┼────┼──►│   Envoy   │  │
│  │  (Sidecar)│  │    │  │  (Sidecar)│  │
│  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘
```

**主要機能:**

1. **トラフィック管理**

```yaml
# VirtualService
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: productcatalog
spec:
  hosts:
    - productcatalogservice
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: productcatalogservice
            subset: v2
    - route:
        - destination:
            host: productcatalogservice
            subset: v1
          weight: 90
        - destination:
            host: productcatalogservice
            subset: v2
          weight: 10 # カナリアリリース

---
# DestinationRule
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: productcatalog
spec:
  host: productcatalogservice
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    outlierDetection:
      consecutiveGatewayErrors: 5
      interval: 30s
      baseEjectionTime: 30s
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

2. **サーキットブレーカー**

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: circuit-breaker
spec:
  host: payment-service
  trafficPolicy:
    outlierDetection:
      consecutiveErrors: 3
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

3. **リトライとタイムアウト**

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: payment
spec:
  hosts:
    - payment-service
  http:
    - route:
        - destination:
            host: payment-service
      timeout: 10s
      retries:
        attempts: 3
        perTryTimeout: 3s
        retryOn: gateway-error,connect-failure,refused-stream
```

---

### 📊 分散トレーシング

**OpenTelemetry:**

```go
// tracing.go
package main

import (
    "context"
    "log"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
    "go.opentelemetry.io/otel/trace"
)

func initTracer() func() {
    ctx := context.Background()

    // OTLPエクスポーターの設定
    exporter, err := otlptrace.New(ctx, otlptracegrpc.NewClient(
        otlptracegrpc.WithEndpoint("otel-collector:4317"),
        otlptracegrpc.WithInsecure(),
    ))
    if err != nil {
        log.Fatal(err)
    }

    // リソースの設定
    res := resource.NewWithAttributes(
        semconv.SchemaURL,
        semconv.ServiceNameKey.String("productcatalog-service"),
        semconv.ServiceVersionKey.String("v1.0.0"),
    )

    // トレーサープロバイダーの設定
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
    )

    otel.SetTracerProvider(tp)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))

    return func() {
        if err := tp.Shutdown(ctx); err != nil {
            log.Fatal(err)
        }
    }
}

// 使用例
func (p *productCatalog) GetProduct(ctx context.Context, req *pb.GetProductRequest) (*pb.Product, error) {
    tracer := otel.Tracer("productcatalog")

    // スパンの開始
    ctx, span := tracer.Start(ctx, "GetProduct")
    defer span.End()

    // 属性の追加
    span.SetAttributes(
        attribute.String("product.id", req.Id),
    )

    // データベース呼び出しのトレース
    ctx, dbSpan := tracer.Start(ctx, "database.query")
    product, err := p.findProduct(ctx, req.Id)
    dbSpan.End()

    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "product not found")
        return nil, err
    }

    return product, nil
}
```

**トレースの可視化:**

```
Frontend [200ms]
├─ CartService.GetCart [50ms]
│  └─ Redis.Get [5ms]
├─ ProductCatalog.ListProducts [30ms]
│  └─ Database.Query [10ms]
└─ CheckoutService.PlaceOrder [120ms]
   ├─ PaymentService.Charge [60ms]
   │  └─ ExternalAPI.Post [45ms]
   └─ ShippingService.Calculate [40ms]
```

---

### 🔐 セキュリティパターン

**mTLS (Mutual TLS):**

```yaml
# PeerAuthentication
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT # 全てのサービス間通信にmTLSを強制
```

**認可ポリシー:**

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-service-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: payment-service
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/checkout-service"]
      to:
        - operation:
            methods: ["POST"]
            paths: ["/api/v1/charge"]
```

**API Gateway 認証:**

```go
// auth_middleware.go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }

        // JWT検証
        claims, err := validateJWT(token)
        if err != nil {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }

        // コンテキストにユーザー情報を追加
        ctx := context.WithValue(r.Context(), "user", claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

---

### 🧪 テスト戦略

**単体テスト:**

```go
// productcatalog_test.go
func TestGetProduct(t *testing.T) {
    // Arrange
    catalog := &productCatalog{
        products: []*pb.Product{
            {Id: "1", Name: "Test Product", PriceUsd: &pb.Money{Units: 10}},
        },
    }

    // Act
    req := &pb.GetProductRequest{Id: "1"}
    product, err := catalog.GetProduct(context.Background(), req)

    // Assert
    assert.NoError(t, err)
    assert.Equal(t, "Test Product", product.Name)
}

func TestGetProduct_NotFound(t *testing.T) {
    catalog := &productCatalog{products: []*pb.Product{}}

    req := &pb.GetProductRequest{Id: "999"}
    _, err := catalog.GetProduct(context.Background(), req)

    assert.Error(t, err)
    assert.Equal(t, codes.NotFound, status.Code(err))
}
```

**統合テスト:**

```go
func TestCheckoutIntegration(t *testing.T) {
    // コンテナを起動
    ctx := context.Background()
    network, _ := testcontainers.GenericNetwork(ctx, testcontainers.GenericNetworkRequest{})

    // Redis
    redisC, _ := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
        ContainerRequest: testcontainers.ContainerRequest{
            Image:    "redis:alpine",
            Networks: []string{network.Name},
        },
        Started: true,
    })

    // テスト実行
    checkoutService := NewCheckoutService(redisC.Host())

    order := &Order{
        UserId: "user123",
        Items:  []Item{{ProductId: "1", Quantity: 2}},
    }

    result, err := checkoutService.PlaceOrder(ctx, order)

    assert.NoError(t, err)
    assert.NotEmpty(t, result.OrderId)
}
```

**契約テスト (Consumer-Driven Contract):**

```go
// Pact を使用した契約テスト
func TestPaymentServiceContract(t *testing.T) {
    pact := &dsl.Pact{
        Consumer: "checkout-service",
        Provider: "payment-service",
    }

    pact.AddInteraction().
        Given("A valid credit card").
        UponReceiving("A charge request").
        WithRequest(dsl.Request{
            Method: "POST",
            Path:   dsl.String("/api/charge"),
            Body: map[string]interface{}{
                "amount":   100.00,
                "currency": "USD",
                "card_id":  "card_123",
            },
        }).
        WillRespondWith(dsl.Response{
            Status: 200,
            Body: map[string]interface{}{
                "transaction_id": dsl.Like("txn_abc123"),
                "status":         "success",
            },
        })

    err := pact.Verify(func() error {
        client := NewPaymentClient(pact.Server.Port)
        _, err := client.Charge(100.00, "USD", "card_123")
        return err
    })

    assert.NoError(t, err)
}
```

---

### 📈 モニタリングとアラート

**メトリクス (Prometheus):**

```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )

    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "endpoint"},
    )

    grpcRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "grpc_requests_total",
            Help: "Total number of gRPC requests",
        },
        []string{"service", "method", "status"},
    )
)

func init() {
    prometheus.MustRegister(httpRequestsTotal)
    prometheus.MustRegister(httpRequestDuration)
    prometheus.MustRegister(grpcRequestsTotal)
}

// ミドルウェア
func MetricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        wrapped := &statusWriter{ResponseWriter: w}
        next.ServeHTTP(wrapped, r)

        duration := time.Since(start).Seconds()
        status := strconv.Itoa(wrapped.status)

        httpRequestsTotal.WithLabelValues(r.Method, r.URL.Path, status).Inc()
        httpRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
    })
}
```

**Grafana ダッシュボード:**

```
主要メトリクス:
- Request Rate (req/s)
- Error Rate (%)
- Latency (p50, p95, p99)
- Saturation (CPU, Memory)

サービス別:
- ProductCatalog: 商品検索レイテンシ
- Payment: 決済成功率
- Shipping: 配送計算時間
- Cart: キャッシュヒット率
```

---

### 🚦 デプロイ戦略

**Blue-Green Deployment:**

```yaml
# Blue deployment (現在のプロダクション)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-blue
  labels:
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
        - name: app
          image: myapp:v1.0.0

---
# Green deployment (新バージョン)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-green
  labels:
    version: green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
        - name: app
          image: myapp:v2.0.0

---
# Serviceでトラフィックを切り替え
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
    version: blue # green に変更で切り替え
  ports:
    - port: 80
      targetPort: 8080
```

**Canary Release:**

```yaml
# Istio VirtualService
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
    - myapp
  http:
    - route:
        - destination:
            host: myapp
            subset: stable
          weight: 95
        - destination:
            host: myapp
            subset: canary
          weight: 5 # 5%のトラフィックを新バージョンへ
```

---

## 🎓 学習リソース

### 主要リポジトリ

1. **[microservices-demo](https://github.com/GoogleCloudPlatform/microservices-demo)**

   - Google の公式デモ
   - 11 サービスの EC サイト
   - Kubernetes、gRPC、Istio

2. **[spring-petclinic-microservices](https://github.com/spring-petclinic/spring-petclinic-microservices)**

   - Spring Boot/Cloud
   - サービスディスカバリ
   - 設定管理

3. **[sock-shop](https://github.com/microservices-demo/microservices-demo)**
   - WeaveWorks のデモ
   - 多言語実装
   - 完全な CI/CD パイプライン

### 推奨書籍

- **Building Microservices** - Sam Newman
- **Microservices Patterns** - Chris Richardson
- **Production-Ready Microservices** - Susan Fowler

### オンラインリソース

- [Microservices.io](https://microservices.io/)
- [12 Factor App](https://12factor.net/)
- [CNCF Landscape](https://landscape.cncf.io/)

---

## 次のステップ

1. **ハンズオン**

   - microservices-demo をローカルで実行
   - 新しいサービスを追加してみる
   - Istio でトラフィック管理を試す

2. **深い学習**

   - サービスメッシュの内部動作
   - 分散トランザクション（SAGA）
   - イベント駆動アーキテクチャ

3. **本番環境**
   - CI/CD パイプライン構築
   - モニタリングとアラート設定
   - 障害対応手順の策定

---

最終更新: 2025 年 11 月
