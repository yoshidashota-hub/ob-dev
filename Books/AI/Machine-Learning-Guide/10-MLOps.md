# 第10章: MLOps

## MLOps 概要

```
┌─────────────────────────────────────────────────────────┐
│                    MLOps パイプライン                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │  データ      →  特徴量    →  モデル    →  デプロイ │   │
│  │  収集          エンジニア    訓練        サービング │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│              ↑                              │          │
│              │         監視・評価           │          │
│              └──────────────────────────────┘          │
│                                                         │
│  CI/CD   |   実験管理   |   モデル管理   |   監視      │
└─────────────────────────────────────────────────────────┘
```

## モデルのバージョン管理

### モデルレジストリ

```typescript
// lib/model-registry.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "crypto";

interface ModelMetadata {
  name: string;
  version: string;
  createdAt: Date;
  metrics: Record<string, number>;
  parameters: Record<string, any>;
  datasetHash: string;
  status: "training" | "staging" | "production" | "archived";
}

class ModelRegistry {
  private s3: S3Client;
  private bucket: string;
  private metadataTable: string;

  constructor(config: { bucket: string; region: string }) {
    this.s3 = new S3Client({ region: config.region });
    this.bucket = config.bucket;
  }

  // モデルを登録
  async registerModel(
    modelName: string,
    modelBuffer: Buffer,
    metadata: Omit<ModelMetadata, "name" | "createdAt">,
  ): Promise<string> {
    const version = this.generateVersion(modelBuffer);
    const key = `models/${modelName}/${version}/model.json`;

    // モデルファイルをアップロード
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: modelBuffer,
        ContentType: "application/json",
      }),
    );

    // メタデータを保存
    const fullMetadata: ModelMetadata = {
      ...metadata,
      name: modelName,
      version,
      createdAt: new Date(),
    };

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: `models/${modelName}/${version}/metadata.json`,
        Body: JSON.stringify(fullMetadata),
        ContentType: "application/json",
      }),
    );

    return version;
  }

  // モデルを取得
  async getModel(modelName: string, version?: string): Promise<Buffer> {
    const targetVersion = version || (await this.getProductionVersion(modelName));

    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: `models/${modelName}/${targetVersion}/model.json`,
      }),
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  // プロダクションバージョンを取得
  async getProductionVersion(modelName: string): Promise<string> {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: `models/${modelName}/production.txt`,
      }),
    );

    const version = await response.Body?.transformToString();
    return version?.trim() || "";
  }

  // プロダクションに昇格
  async promoteToProduction(modelName: string, version: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: `models/${modelName}/production.txt`,
        Body: version,
      }),
    );
  }

  private generateVersion(modelBuffer: Buffer): string {
    const hash = createHash("sha256").update(modelBuffer).digest("hex").slice(0, 8);
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    return `${timestamp}-${hash}`;
  }
}
```

## 実験管理

```typescript
// lib/experiment-tracker.ts
import { prisma } from "@/lib/prisma";

interface ExperimentRun {
  id: string;
  experimentName: string;
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  artifacts: string[];
  startTime: Date;
  endTime?: Date;
  status: "running" | "completed" | "failed";
}

class ExperimentTracker {
  private currentRun: ExperimentRun | null = null;

  // 実験を開始
  async startRun(
    experimentName: string,
    parameters: Record<string, any>,
  ): Promise<string> {
    const run = await prisma.experimentRun.create({
      data: {
        experimentName,
        parameters: JSON.stringify(parameters),
        metrics: JSON.stringify({}),
        artifacts: JSON.stringify([]),
        startTime: new Date(),
        status: "running",
      },
    });

    this.currentRun = {
      id: run.id,
      experimentName,
      parameters,
      metrics: {},
      artifacts: [],
      startTime: run.startTime,
      status: "running",
    };

    return run.id;
  }

  // メトリクスをログ
  async logMetric(key: string, value: number): Promise<void> {
    if (!this.currentRun) throw new Error("No active run");

    this.currentRun.metrics[key] = value;

    await prisma.experimentRun.update({
      where: { id: this.currentRun.id },
      data: { metrics: JSON.stringify(this.currentRun.metrics) },
    });
  }

  // 複数のメトリクスをログ
  async logMetrics(metrics: Record<string, number>): Promise<void> {
    if (!this.currentRun) throw new Error("No active run");

    this.currentRun.metrics = { ...this.currentRun.metrics, ...metrics };

    await prisma.experimentRun.update({
      where: { id: this.currentRun.id },
      data: { metrics: JSON.stringify(this.currentRun.metrics) },
    });
  }

  // パラメータをログ
  async logParams(params: Record<string, any>): Promise<void> {
    if (!this.currentRun) throw new Error("No active run");

    this.currentRun.parameters = { ...this.currentRun.parameters, ...params };

    await prisma.experimentRun.update({
      where: { id: this.currentRun.id },
      data: { parameters: JSON.stringify(this.currentRun.parameters) },
    });
  }

  // アーティファクトを保存
  async logArtifact(artifactPath: string): Promise<void> {
    if (!this.currentRun) throw new Error("No active run");

    this.currentRun.artifacts.push(artifactPath);

    await prisma.experimentRun.update({
      where: { id: this.currentRun.id },
      data: { artifacts: JSON.stringify(this.currentRun.artifacts) },
    });
  }

  // 実験を終了
  async endRun(status: "completed" | "failed" = "completed"): Promise<void> {
    if (!this.currentRun) throw new Error("No active run");

    await prisma.experimentRun.update({
      where: { id: this.currentRun.id },
      data: {
        endTime: new Date(),
        status,
      },
    });

    this.currentRun = null;
  }

  // 実験結果を比較
  async compareRuns(runIds: string[]): Promise<{
    parameters: Record<string, any[]>;
    metrics: Record<string, number[]>;
  }> {
    const runs = await prisma.experimentRun.findMany({
      where: { id: { in: runIds } },
    });

    const parameters: Record<string, any[]> = {};
    const metrics: Record<string, number[]> = {};

    runs.forEach((run) => {
      const runParams = JSON.parse(run.parameters);
      const runMetrics = JSON.parse(run.metrics);

      Object.entries(runParams).forEach(([key, value]) => {
        if (!parameters[key]) parameters[key] = [];
        parameters[key].push(value);
      });

      Object.entries(runMetrics).forEach(([key, value]) => {
        if (!metrics[key]) metrics[key] = [];
        metrics[key].push(value as number);
      });
    });

    return { parameters, metrics };
  }
}

// 使用例
const tracker = new ExperimentTracker();

async function trainWithTracking() {
  await tracker.startRun("sentiment-classifier", {
    learningRate: 0.001,
    epochs: 50,
    batchSize: 32,
  });

  try {
    // 訓練ループ
    for (let epoch = 0; epoch < 50; epoch++) {
      const loss = Math.random(); // 実際の訓練
      const accuracy = Math.random();

      await tracker.logMetrics({
        [`epoch_${epoch}_loss`]: loss,
        [`epoch_${epoch}_accuracy`]: accuracy,
      });
    }

    // 最終メトリクス
    await tracker.logMetrics({
      final_accuracy: 0.95,
      final_loss: 0.05,
    });

    await tracker.endRun("completed");
  } catch (error) {
    await tracker.endRun("failed");
    throw error;
  }
}
```

## モデルサービング

### HTTP API

```typescript
// app/api/predict/route.ts
import * as tf from "@tensorflow/tfjs-node";

let model: tf.LayersModel | null = null;
let modelVersion: string | null = null;

async function loadModel(): Promise<tf.LayersModel> {
  if (!model) {
    const registry = new ModelRegistry({ bucket: "my-models", region: "ap-northeast-1" });
    const modelBuffer = await registry.getModel("sentiment-classifier");
    modelVersion = await registry.getProductionVersion("sentiment-classifier");

    model = await tf.loadLayersModel(
      tf.io.fromMemory(JSON.parse(modelBuffer.toString())),
    );
  }
  return model;
}

export async function POST(request: Request) {
  const { text } = await request.json();

  const loadedModel = await loadModel();

  // 前処理
  const input = preprocessText(text);

  // 予測
  const prediction = loadedModel.predict(input) as tf.Tensor;
  const result = await prediction.data();

  // クリーンアップ
  input.dispose();
  prediction.dispose();

  return Response.json({
    prediction: result[0] > 0.5 ? "positive" : "negative",
    confidence: result[0],
    modelVersion,
  });
}
```

### バッチ予測

```typescript
// lib/batch-prediction.ts
interface BatchJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  inputPath: string;
  outputPath: string;
  progress: number;
  error?: string;
}

class BatchPredictor {
  private registry: ModelRegistry;
  private model: tf.LayersModel | null = null;

  constructor(registry: ModelRegistry) {
    this.registry = registry;
  }

  async processBatch(job: BatchJob): Promise<void> {
    try {
      // モデルをロード
      const modelBuffer = await this.registry.getModel("sentiment-classifier");
      this.model = await tf.loadLayersModel(
        tf.io.fromMemory(JSON.parse(modelBuffer.toString())),
      );

      // 入力データを読み込み
      const inputData = await this.loadInputData(job.inputPath);
      const results: any[] = [];

      // バッチ処理
      const batchSize = 100;
      for (let i = 0; i < inputData.length; i += batchSize) {
        const batch = inputData.slice(i, i + batchSize);
        const predictions = await this.predictBatch(batch);
        results.push(...predictions);

        // 進捗を更新
        job.progress = ((i + batchSize) / inputData.length) * 100;
        await this.updateJobStatus(job);
      }

      // 結果を保存
      await this.saveResults(job.outputPath, results);

      job.status = "completed";
      job.progress = 100;
      await this.updateJobStatus(job);
    } catch (error: any) {
      job.status = "failed";
      job.error = error.message;
      await this.updateJobStatus(job);
    }
  }

  private async predictBatch(batch: string[]): Promise<any[]> {
    return tf.tidy(() => {
      const inputs = batch.map((text) => preprocessText(text));
      const inputTensor = tf.stack(inputs.map((i) => i.squeeze()));

      const predictions = this.model!.predict(inputTensor) as tf.Tensor;
      const results = predictions.arraySync() as number[][];

      return results.map((r, i) => ({
        text: batch[i],
        prediction: r[0] > 0.5 ? "positive" : "negative",
        confidence: r[0],
      }));
    });
  }

  private async loadInputData(path: string): Promise<string[]> {
    // S3 またはファイルシステムから読み込み
    return [];
  }

  private async saveResults(path: string, results: any[]): Promise<void> {
    // S3 またはファイルシステムに保存
  }

  private async updateJobStatus(job: BatchJob): Promise<void> {
    // ステータスを DB に保存
  }
}
```

## モデル監視

### パフォーマンス監視

```typescript
// lib/model-monitoring.ts
interface PredictionLog {
  timestamp: Date;
  modelVersion: string;
  input: any;
  prediction: any;
  latency: number;
  actualLabel?: any; // フィードバック用
}

interface ModelMetrics {
  totalPredictions: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
  accuracy?: number;
}

class ModelMonitor {
  private logs: PredictionLog[] = [];
  private alertThresholds = {
    latency: 500, // ms
    errorRate: 0.05,
    accuracyDrop: 0.1,
  };

  // 予測をログ
  logPrediction(log: PredictionLog): void {
    this.logs.push(log);

    // アラートチェック
    this.checkAlerts(log);
  }

  // メトリクスを計算
  getMetrics(windowMinutes: number = 60): ModelMetrics {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    const recentLogs = this.logs.filter((l) => l.timestamp >= cutoff);

    if (recentLogs.length === 0) {
      return {
        totalPredictions: 0,
        avgLatency: 0,
        p95Latency: 0,
        errorRate: 0,
      };
    }

    const latencies = recentLogs.map((l) => l.latency).sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);

    // 精度（ラベルがある場合）
    const labeled = recentLogs.filter((l) => l.actualLabel !== undefined);
    const accuracy =
      labeled.length > 0
        ? labeled.filter((l) => l.prediction === l.actualLabel).length / labeled.length
        : undefined;

    return {
      totalPredictions: recentLogs.length,
      avgLatency: latencies.reduce((a, b) => a + b) / latencies.length,
      p95Latency: latencies[p95Index],
      errorRate: 0, // エラーログから計算
      accuracy,
    };
  }

  // データドリフト検出
  detectDataDrift(
    referenceSample: any[],
    currentSample: any[],
  ): { hasDrift: boolean; driftScore: number } {
    // 簡易的なドリフト検出（実際は KL ダイバージェンス等を使用）
    const refMean = this.calculateMean(referenceSample);
    const curMean = this.calculateMean(currentSample);
    const refStd = this.calculateStd(referenceSample);

    const zScore = Math.abs(curMean - refMean) / (refStd || 1);
    const hasDrift = zScore > 3;

    return { hasDrift, driftScore: zScore };
  }

  // アラートチェック
  private checkAlerts(log: PredictionLog): void {
    // レイテンシアラート
    if (log.latency > this.alertThresholds.latency) {
      this.sendAlert("HIGH_LATENCY", `Latency: ${log.latency}ms`);
    }

    // エラー率アラート（直近100件をチェック）
    const recentLogs = this.logs.slice(-100);
    const metrics = this.getMetrics(5);

    if (metrics.errorRate > this.alertThresholds.errorRate) {
      this.sendAlert("HIGH_ERROR_RATE", `Error rate: ${metrics.errorRate}`);
    }
  }

  private sendAlert(type: string, message: string): void {
    console.error(`[ALERT] ${type}: ${message}`);
    // Slack, PagerDuty などに通知
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateStd(values: number[]): number {
    const mean = this.calculateMean(values);
    return Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length,
    );
  }
}
```

## CI/CD パイプライン

```yaml
# .github/workflows/ml-pipeline.yml
name: ML Pipeline

on:
  push:
    paths:
      - "ml/**"
      - "models/**"

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run data validation
        run: npm run validate-data

  train:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"

      - name: Train model
        run: |
          pip install -r requirements.txt
          python train.py

      - name: Upload model artifact
        uses: actions/upload-artifact@v4
        with:
          name: model
          path: models/

  evaluate:
    needs: train
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download model
        uses: actions/download-artifact@v4
        with:
          name: model
          path: models/

      - name: Evaluate model
        run: npm run evaluate

      - name: Check metrics threshold
        run: |
          ACCURACY=$(cat metrics.json | jq .accuracy)
          if (( $(echo "$ACCURACY < 0.9" | bc -l) )); then
            echo "Accuracy below threshold: $ACCURACY"
            exit 1
          fi

  deploy-staging:
    needs: evaluate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Download model
        uses: actions/download-artifact@v4
        with:
          name: model
          path: models/

      - name: Deploy to staging
        run: |
          aws s3 cp models/ s3://ml-models-staging/ --recursive
          npm run deploy:staging

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Promote to production
        run: |
          # A/B テストの結果を確認
          npm run check-ab-test

          # プロダクションに昇格
          npm run promote:production
```

## A/B テスト

```typescript
// lib/ab-testing.ts
interface ABTestConfig {
  name: string;
  controlModel: string;
  treatmentModel: string;
  trafficSplit: number; // 0-1, treatment への割合
  metrics: string[];
  startDate: Date;
  endDate?: Date;
}

class ABTestManager {
  private tests: Map<string, ABTestConfig> = new Map();
  private results: Map<string, { control: any[]; treatment: any[] }> = new Map();

  createTest(config: ABTestConfig): void {
    this.tests.set(config.name, config);
    this.results.set(config.name, { control: [], treatment: [] });
  }

  // ユーザーの割り当てを決定
  assignVariant(testName: string, userId: string): "control" | "treatment" {
    const test = this.tests.get(testName);
    if (!test) throw new Error(`Test not found: ${testName}`);

    // 一貫した割り当て（ユーザーID ベース）
    const hash = this.hashString(userId + testName);
    const normalized = hash / 0xffffffff;

    return normalized < test.trafficSplit ? "treatment" : "control";
  }

  // 結果を記録
  recordResult(
    testName: string,
    variant: "control" | "treatment",
    metrics: Record<string, number>,
  ): void {
    const results = this.results.get(testName);
    if (!results) return;

    results[variant].push({
      timestamp: new Date(),
      metrics,
    });
  }

  // 統計的検定
  analyzeTest(testName: string): {
    significant: boolean;
    pValue: number;
    controlMean: number;
    treatmentMean: number;
    lift: number;
  } {
    const results = this.results.get(testName);
    if (!results) throw new Error(`Test not found: ${testName}`);

    const controlValues = results.control.map((r) => r.metrics.accuracy || 0);
    const treatmentValues = results.treatment.map((r) => r.metrics.accuracy || 0);

    const controlMean = this.mean(controlValues);
    const treatmentMean = this.mean(treatmentValues);

    // t 検定（簡易版）
    const pValue = this.tTest(controlValues, treatmentValues);
    const significant = pValue < 0.05;

    const lift = (treatmentMean - controlMean) / controlMean;

    return { significant, pValue, controlMean, treatmentMean, lift };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private tTest(a: number[], b: number[]): number {
    // 簡易的な t 検定
    const meanA = this.mean(a);
    const meanB = this.mean(b);
    const varA = a.reduce((sum, v) => sum + Math.pow(v - meanA, 2), 0) / (a.length - 1);
    const varB = b.reduce((sum, v) => sum + Math.pow(v - meanB, 2), 0) / (b.length - 1);

    const pooledSE = Math.sqrt(varA / a.length + varB / b.length);
    const t = (meanA - meanB) / pooledSE;

    // p値の近似（実際はt分布表を使用）
    return Math.exp(-0.717 * t * t - 0.416 * t * t * t * t);
  }
}
```

## ベストプラクティス

```
┌─────────────────────────────────────────────────────────┐
│              MLOps のベストプラクティス                    │
│                                                         │
│  1. バージョン管理                                       │
│     • コード、データ、モデルすべてをバージョン管理        │
│     • 再現可能な実験環境                                │
│     • Git LFS でモデルファイルを管理                    │
│                                                         │
│  2. 自動化                                              │
│     • CI/CD でテストから デプロイまで自動化              │
│     • 定期的な再訓練パイプライン                        │
│     • アラートと自動ロールバック                        │
│                                                         │
│  3. 監視                                                │
│     • モデルパフォーマンスを継続的に監視                 │
│     • データドリフトを検出                              │
│     • フィードバックループで精度を追跡                   │
│                                                         │
│  4. ガバナンス                                          │
│     • モデルの説明可能性を確保                          │
│     • 公平性とバイアスをチェック                        │
│     • 監査証跡を維持                                    │
└─────────────────────────────────────────────────────────┘
```

## 次のステップ

次章では、AI SDK と ML の統合について学びます。
