# 第5章: ネットワーク

## VPC（Virtual Private Cloud）

### 基本構成

```
┌─────────────────────────────────────────────────────────────┐
│                      VPC (10.0.0.0/16)                       │
│                                                             │
│  ┌─────────────────────────┐ ┌─────────────────────────┐   │
│  │    AZ-a                  │ │    AZ-c                  │   │
│  │  ┌─────────────────┐    │ │  ┌─────────────────┐    │   │
│  │  │ Public Subnet   │    │ │  │ Public Subnet   │    │   │
│  │  │ 10.0.1.0/24     │    │ │  │ 10.0.2.0/24     │    │   │
│  │  │   [NAT GW]      │    │ │  │   [ALB]         │    │   │
│  │  └─────────────────┘    │ │  └─────────────────┘    │   │
│  │  ┌─────────────────┐    │ │  ┌─────────────────┐    │   │
│  │  │ Private Subnet  │    │ │  │ Private Subnet  │    │   │
│  │  │ 10.0.11.0/24    │    │ │  │ 10.0.12.0/24    │    │   │
│  │  │   [ECS/Lambda]  │    │ │  │   [ECS/Lambda]  │    │   │
│  │  └─────────────────┘    │ │  └─────────────────┘    │   │
│  │  ┌─────────────────┐    │ │  ┌─────────────────┐    │   │
│  │  │ Isolated Subnet │    │ │  │ Isolated Subnet │    │   │
│  │  │ 10.0.21.0/24    │    │ │  │ 10.0.22.0/24    │    │   │
│  │  │   [RDS]         │    │ │  │   [RDS]         │    │   │
│  │  └─────────────────┘    │ │  └─────────────────┘    │   │
│  └─────────────────────────┘ └─────────────────────────┘   │
│                         │                                   │
│                    Internet Gateway                         │
└─────────────────────────────────────────────────────────────┘
```

### CDK で VPC 作成

```typescript
// lib/vpc-stack.ts
import * as ec2 from "aws-cdk-lib/aws-ec2";

const vpc = new ec2.Vpc(this, "MyVpc", {
  ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
  maxAzs: 2,
  subnetConfiguration: [
    {
      name: "Public",
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: "Private",
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      cidrMask: 24,
    },
    {
      name: "Isolated",
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      cidrMask: 24,
    },
  ],
  natGateways: 1, // コスト削減のため 1 つ
});
```

### セキュリティグループ

```typescript
// Web サーバー用 SG
const webSg = new ec2.SecurityGroup(this, "WebSG", {
  vpc,
  description: "Security group for web servers",
});

webSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "HTTP");
webSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "HTTPS");

// アプリケーション用 SG
const appSg = new ec2.SecurityGroup(this, "AppSG", {
  vpc,
  description: "Security group for app servers",
});

appSg.addIngressRule(webSg, ec2.Port.tcp(3000), "From ALB");

// データベース用 SG
const dbSg = new ec2.SecurityGroup(this, "DbSG", {
  vpc,
  description: "Security group for database",
});

dbSg.addIngressRule(appSg, ec2.Port.tcp(5432), "PostgreSQL from app");
```

## API Gateway

### REST API

```typescript
// CDK で API Gateway + Lambda
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

const api = new apigateway.RestApi(this, "MyApi", {
  restApiName: "My Service",
  description: "My API Gateway",
  deployOptions: {
    stageName: "prod",
    throttlingRateLimit: 1000,
    throttlingBurstLimit: 2000,
  },
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
  },
});

// Lambda 統合
const usersHandler = new lambda.Function(this, "UsersHandler", {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: "users.handler",
  code: lambda.Code.fromAsset("dist"),
});

const users = api.root.addResource("users");
users.addMethod("GET", new apigateway.LambdaIntegration(usersHandler));
users.addMethod("POST", new apigateway.LambdaIntegration(usersHandler));

const user = users.addResource("{userId}");
user.addMethod("GET", new apigateway.LambdaIntegration(usersHandler));
user.addMethod("PUT", new apigateway.LambdaIntegration(usersHandler));
user.addMethod("DELETE", new apigateway.LambdaIntegration(usersHandler));
```

### HTTP API（低レイテンシ・低コスト）

```typescript
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";

const httpApi = new apigatewayv2.HttpApi(this, "HttpApi", {
  apiName: "My HTTP API",
  corsPreflight: {
    allowOrigins: ["https://example.com"],
    allowMethods: [apigatewayv2.CorsHttpMethod.GET, apigatewayv2.CorsHttpMethod.POST],
  },
});

httpApi.addRoutes({
  path: "/users",
  methods: [apigatewayv2.HttpMethod.GET],
  integration: new integrations.HttpLambdaIntegration("GetUsers", usersHandler),
});
```

### カスタムオーソライザー

```typescript
// JWT 認証用 Lambda
const authorizerHandler = new lambda.Function(this, "Authorizer", {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: "auth.handler",
  code: lambda.Code.fromAsset("dist"),
  environment: {
    JWT_SECRET: process.env.JWT_SECRET!,
  },
});

const authorizer = new apigateway.TokenAuthorizer(this, "JwtAuthorizer", {
  handler: authorizerHandler,
  identitySource: "method.request.header.Authorization",
});

// 認証が必要なエンドポイント
users.addMethod("POST", new apigateway.LambdaIntegration(usersHandler), {
  authorizer,
  authorizationType: apigateway.AuthorizationType.CUSTOM,
});
```

## CloudFront

### ディストリビューション設定

```typescript
// CDK で CloudFront
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

const distribution = new cloudfront.Distribution(this, "Distribution", {
  defaultBehavior: {
    origin: new origins.S3Origin(staticBucket),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  additionalBehaviors: {
    "/api/*": {
      origin: new origins.HttpOrigin(apiDomain),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    },
  },
  domainNames: ["example.com", "www.example.com"],
  certificate: certificate,
  priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
});
```

### キャッシュ戦略

```
┌────────────────────────────────────────────────────────────┐
│                    Cache Strategy                           │
│                                                            │
│  静的アセット (js, css, images):                           │
│  • Cache-Control: max-age=31536000                         │
│  • ファイル名にハッシュを含める                              │
│                                                            │
│  HTML:                                                      │
│  • Cache-Control: no-cache                                  │
│  • または max-age=60                                        │
│                                                            │
│  API レスポンス:                                            │
│  • 通常はキャッシュ無効                                     │
│  • 読み取り専用データは短時間キャッシュ可                    │
└────────────────────────────────────────────────────────────┘
```

## Route 53

### ホストゾーン設定

```typescript
// CDK で Route 53
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

// ホストゾーン（既存の場合は lookup）
const zone = route53.HostedZone.fromLookup(this, "Zone", {
  domainName: "example.com",
});

// SSL 証明書
const certificate = new acm.Certificate(this, "Certificate", {
  domainName: "example.com",
  subjectAlternativeNames: ["*.example.com"],
  validation: acm.CertificateValidation.fromDns(zone),
});

// CloudFront へのエイリアスレコード
new route53.ARecord(this, "SiteRecord", {
  zone,
  recordName: "www",
  target: route53.RecordTarget.fromAlias(
    new targets.CloudFrontTarget(distribution)
  ),
});

// API Gateway へのエイリアスレコード
new route53.ARecord(this, "ApiRecord", {
  zone,
  recordName: "api",
  target: route53.RecordTarget.fromAlias(
    new targets.ApiGateway(api)
  ),
});
```

### ヘルスチェック

```typescript
// ヘルスチェック
const healthCheck = new route53.CfnHealthCheck(this, "HealthCheck", {
  healthCheckConfig: {
    type: "HTTPS",
    fullyQualifiedDomainName: "api.example.com",
    port: 443,
    resourcePath: "/health",
    requestInterval: 30,
    failureThreshold: 3,
  },
});
```

## ALB（Application Load Balancer）

### 設定例

```typescript
// CDK で ALB
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
  vpc,
  internetFacing: true,
  securityGroup: webSg,
});

// HTTPS リスナー
const httpsListener = alb.addListener("HttpsListener", {
  port: 443,
  certificates: [certificate],
  defaultAction: elbv2.ListenerAction.fixedResponse(404, {
    contentType: "text/plain",
    messageBody: "Not Found",
  }),
});

// ターゲットグループ
httpsListener.addTargets("AppTargets", {
  port: 3000,
  targets: [ecsService],
  healthCheck: {
    path: "/health",
    interval: cdk.Duration.seconds(30),
    healthyThresholdCount: 2,
    unhealthyThresholdCount: 3,
  },
  conditions: [elbv2.ListenerCondition.pathPatterns(["/api/*"])],
  priority: 1,
});

// HTTP → HTTPS リダイレクト
alb.addListener("HttpListener", {
  port: 80,
  defaultAction: elbv2.ListenerAction.redirect({
    protocol: "HTTPS",
    port: "443",
    permanent: true,
  }),
});
```

## ネットワーク設計パターン

```
┌────────────────────────────────────────────────────────────┐
│              典型的な Web アプリ構成                         │
│                                                            │
│  Internet                                                  │
│      │                                                     │
│      ▼                                                     │
│  CloudFront (CDN)                                          │
│      │                                                     │
│      ├──→ S3 (静的ファイル)                                │
│      │                                                     │
│      └──→ ALB (API)                                        │
│              │                                             │
│              ▼                                             │
│          ECS/Lambda (Private Subnet)                       │
│              │                                             │
│              ▼                                             │
│          RDS/DynamoDB (Isolated/VPC)                       │
└────────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、QuickSight について学びます。
