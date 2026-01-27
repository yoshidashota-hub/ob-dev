# Kubernetes 学習ノート

## 概要

Kubernetes (K8s) は、コンテナ化されたアプリケーションのデプロイ、スケーリング、管理を自動化するオーケストレーションプラットフォーム。

## 基本概念

### アーキテクチャ

```
┌─────────────────────────────────────────┐
│           Control Plane                  │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │ API     │ │ etcd    │ │ Scheduler │  │
│  │ Server  │ │         │ │           │  │
│  └─────────┘ └─────────┘ └───────────┘  │
│  ┌─────────────────────────────────────┐│
│  │        Controller Manager           ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
            │
┌───────────┼───────────────────────────────┐
│           ▼         Worker Nodes          │
│  ┌─────────────┐  ┌─────────────┐        │
│  │   Node 1    │  │   Node 2    │        │
│  │ ┌─────────┐ │  │ ┌─────────┐ │        │
│  │ │ kubelet │ │  │ │ kubelet │ │        │
│  │ └─────────┘ │  │ └─────────┘ │        │
│  │ ┌─────────┐ │  │ ┌─────────┐ │        │
│  │ │  Pods   │ │  │ │  Pods   │ │        │
│  │ └─────────┘ │  │ └─────────┘ │        │
│  └─────────────┘  └─────────────┘        │
└───────────────────────────────────────────┘
```

### 主要リソース

| リソース   | 説明                                                |
| ---------- | --------------------------------------------------- |
| Pod        | 最小のデプロイ単位。1つ以上のコンテナを含む         |
| Deployment | Podのデプロイ・スケーリング・ローリングアップデート |
| Service    | Podへのネットワークアクセス                         |
| ConfigMap  | 設定データ                                          |
| Secret     | 機密データ                                          |
| Ingress    | 外部からのHTTPアクセス                              |

## マニフェストファイル

### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
  labels:
    app: nextjs
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nextjs
  template:
    metadata:
      labels:
        app: nextjs
    spec:
      containers:
        - name: nextjs
          image: myregistry/nextjs-app:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nextjs-service
spec:
  selector:
    app: nextjs
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nextjs-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nextjs-service
                port:
                  number: 80
```

## kubectl コマンド

```bash
# リソース確認
kubectl get pods
kubectl get deployments
kubectl get services

# 詳細表示
kubectl describe pod <pod-name>

# ログ確認
kubectl logs -f <pod-name>

# Pod に入る
kubectl exec -it <pod-name> -- sh

# 適用
kubectl apply -f deployment.yaml

# スケーリング
kubectl scale deployment nextjs-app --replicas=5

# ローリングアップデート
kubectl set image deployment/nextjs-app nextjs=myregistry/nextjs-app:v2

# ロールバック
kubectl rollout undo deployment/nextjs-app
```

## Helm

```bash
# Chart インストール
helm install my-release bitnami/postgresql

# カスタム values
helm install my-app ./my-chart -f values.yaml

# アップグレード
helm upgrade my-app ./my-chart
```

## ベストプラクティス

1. **リソース制限を設定**
2. **ヘルスチェックを実装**
3. **シークレットは Secret で管理**
4. **HPA でオートスケーリング**
5. **PDB で可用性確保**

## 参考リソース

- [Kubernetes 公式ドキュメント](https://kubernetes.io/docs/home/)
- [Helm Charts](https://artifacthub.io/)
