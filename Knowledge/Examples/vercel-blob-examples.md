# Vercel Blob 実装例

画像やファイルのアップロード、保存、配信を行う完全ガイド。

---

## 📋 目次

1. [概要](#概要)
2. [セットアップ](#セットアップ)
3. [基本的なアップロード](#基本的なアップロード)
4. [画像一覧の取得](#画像一覧の取得)
5. [ファイル削除](#ファイル削除)
6. [高度な使用例](#高度な使用例)
7. [セキュリティとバリデーション](#セキュリティとバリデーション)
8. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### Vercel Blob とは

オブジェクトストレージサービス。AWS S3 のような機能を提供：

- 画像、動画、ドキュメントの保存
- CDN 経由での高速配信
- 自動スケーリング
- シンプルな API

### 主な機能

- **アップロード**: ファイルを簡単にアップロード
- **一覧取得**: 保存されたファイルをリスト表示
- **削除**: 不要なファイルを削除
- **公開設定**: public または private で制御
- **メタデータ**: カスタムメタデータの保存

---

## セットアップ

### 1. Vercel Blob ストアの作成

```bash
# Vercel CLI でプロジェクトをリンク
vercel link

# Vercel ダッシュボードで:
# 1. プロジェクトを選択
# 2. Storage → Blob
# 3. "Create Store" をクリック
# 4. 名前を入力 (例: "next16-sandbox-blob")
```

### 2. パッケージのインストール

```bash
npm install @vercel/blob
```

### 3. 環境変数の設定

**ファイル**: `.env.local`

```bash
# Vercel ダッシュボードから取得
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxx"
```

Vercel にデプロイする場合は自動設定されます。

---

## 基本的なアップロード

### アップロード API の実装

**ファイル**: `app/api/upload/route.ts`

```typescript
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Blob にアップロード
    const blob = await put(file.name, file, {
      access: "public", // 公開設定
      addRandomSuffix: true, // ランダムな接尾辞を追加（重複回避）
    });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

### クライアントサイドのアップロード

**ファイル**: `app/upload/page.tsx`

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";

interface UploadedFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      // プレビュー生成
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedFile(result.data);
        setFile(null);
        setPreview(null);
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">📸 Vercel Blob Upload</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* アップロードフォーム */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Upload Image</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {preview && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* アップロード結果 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Upload Result</h2>

          {uploadedFile ? (
            <div>
              <div className="mb-4">
                <Image
                  src={uploadedFile.url}
                  alt="Uploaded"
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">URL:</span>{" "}
                  <a
                    href={uploadedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {uploadedFile.url}
                  </a>
                </p>
                <p>
                  <span className="font-medium">Size:</span>{" "}
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
                <p>
                  <span className="font-medium">Uploaded:</span>{" "}
                  {new Date(uploadedFile.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No file uploaded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 画像一覧の取得

### 一覧取得 API

**ファイル**: `app/api/upload/list/route.ts`

```typescript
import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { blobs } = await list();

    return NextResponse.json({
      success: true,
      data: blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })),
    });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
```

### ページネーション付きリスト

```typescript
import { list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const cursor = searchParams.get("cursor") || undefined;

    const result = await list({
      limit,
      cursor,
    });

    return NextResponse.json({
      success: true,
      data: result.blobs,
      cursor: result.cursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
```

### プレフィックスでフィルタリング

```typescript
import { list } from "@vercel/blob";

// 'images/' で始まるファイルのみを取得
const { blobs } = await list({
  prefix: "images/",
});

// 'avatars/user-123/' 配下のファイルを取得
const { blobs: userAvatars } = await list({
  prefix: "avatars/user-123/",
});
```

---

## ファイル削除

### 削除 API

**ファイル**: `app/api/upload/delete/route.ts`

```typescript
import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // ファイルを削除
    await del(url);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
```

### 複数ファイルの一括削除

```typescript
import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: "URLs array is required" },
        { status: 400 }
      );
    }

    // 複数のファイルを一括削除
    await del(urls);

    return NextResponse.json({
      success: true,
      message: `${urls.length} files deleted successfully`,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete files" },
      { status: 500 }
    );
  }
}
```

---

## 高度な使用例

### 1. カスタムメタデータの保存

```typescript
import { put } from "@vercel/blob";

const blob = await put("avatar.jpg", file, {
  access: "public",
  addRandomSuffix: true,
  // カスタムメタデータ
  metadata: {
    userId: "user-123",
    uploadedBy: "john@example.com",
    category: "avatar",
  },
});

console.log(blob.url);
```

### 2. プライベートファイルのアップロード

```typescript
import { put } from "@vercel/blob";

const blob = await put("private-doc.pdf", file, {
  access: "public", // Vercel Blob は現在 public のみサポート
  addRandomSuffix: true,
});

// アクセス制御は API 層で実装
// app/api/files/[id]/route.ts で認証チェック
```

### 3. 画像のリサイズ（Server Actions で実装）

```typescript
"use server";

import { put } from "@vercel/blob";
import sharp from "sharp";

export async function uploadAndResizeImage(formData: FormData) {
  const file = formData.get("file") as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  // 画像をリサイズ
  const resized = await sharp(buffer)
    .resize(800, 600, { fit: "inside" })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Blob にアップロード
  const blob = await put("resized-" + file.name, resized, {
    access: "public",
    contentType: "image/jpeg",
  });

  return {
    url: blob.url,
    size: blob.size,
  };
}
```

### 4. ファイルタイプごとの処理

```typescript
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // ファイルタイプによって保存先を変更
  let folder = "";
  if (file.type.startsWith("image/")) {
    folder = "images/";
  } else if (file.type.startsWith("video/")) {
    folder = "videos/";
  } else if (file.type === "application/pdf") {
    folder = "documents/";
  } else {
    folder = "others/";
  }

  const blob = await put(folder + file.name, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
```

### 5. アップロード進捗の追跡

```typescript
"use client";

import { useState } from "react";

export default function UploadWithProgress() {
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    // 進捗を追跡
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        setProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        console.log("Upload complete:", result);
      }
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      {progress > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {progress.toFixed(0)}% アップロード中...
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## セキュリティとバリデーション

### ファイルサイズの制限

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // ファイルサイズチェック（10MB まで）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File size must be less than 10MB" },
      { status: 400 }
    );
  }

  // アップロード処理...
}
```

### ファイルタイプの検証

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // MIME タイプのチェック
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  // 拡張子のチェック（MIME タイプの偽装対策）
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (!allowedExtensions.includes(fileExtension)) {
    return NextResponse.json(
      { error: "Invalid file extension" },
      { status: 400 }
    );
  }

  // アップロード処理...
}
```

### ファイル名のサニタイズ

```typescript
function sanitizeFileName(fileName: string): string {
  // 危険な文字を削除
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_") // 英数字とドット、ハイフン以外を_に置換
    .replace(/\.{2,}/g, ".") // 連続するドットを1つに
    .substring(0, 100); // 長さを制限
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  const safeName = sanitizeFileName(file.name);

  const blob = await put(safeName, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
```

### Rate Limiting の実装

```typescript
import { checkRateLimit } from "@/lib/kv"; // Vercel KV を使用

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // レート制限: 1時間に10ファイルまで
  const rateLimit = await checkRateLimit(`upload:${ip}`, 10, 3600);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 }
    );
  }

  // アップロード処理...
}
```

---

## トラブルシューティング

### エラー: "Missing Blob token"

```bash
# 環境変数が設定されているか確認
echo $BLOB_READ_WRITE_TOKEN

# .env.local に追加
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxx"

# Vercel にデプロイする場合は自動設定される
vercel env pull
```

### エラー: "Failed to upload file"

#### 原因 1: ファイルサイズが大きすぎる

```typescript
// Next.js の body サイズ制限を増やす
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
```

#### 原因 2: ネットワークエラー

```typescript
// リトライロジックを実装
async function uploadWithRetry(file: File, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      });
      return blob;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### エラー: "CORS エラー"

```typescript
// app/api/upload/route.ts
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
```

---

## まとめ

### チェックリスト

- [ ] Vercel Blob ストアを作成
- [ ] @vercel/blob をインストール
- [ ] 環境変数を設定（BLOB_READ_WRITE_TOKEN）
- [ ] アップロード API を実装
- [ ] クライアントサイドのアップロードフォームを作成
- [ ] ファイルサイズとタイプのバリデーションを追加
- [ ] 一覧取得 API を実装
- [ ] 削除 API を実装
- [ ] ローカルで動作確認
- [ ] Vercel にデプロイ

### ベストプラクティス

- ✅ ファイルサイズは 10MB 以下に制限
- ✅ 許可されたファイルタイプのみアップロード
- ✅ ファイル名をサニタイズ
- ✅ Rate Limiting を実装
- ✅ エラーハンドリングを適切に実装
- ✅ addRandomSuffix を使用して重複を回避

### 次のステップ

- Vercel KV でキャッシュとセッション管理を実装
- AI SDK でチャットボット機能を追加

---

**最終更新**: 2025 年 11 月
**難易度**: ★★☆☆☆
**所要時間**: 1-2 時間
