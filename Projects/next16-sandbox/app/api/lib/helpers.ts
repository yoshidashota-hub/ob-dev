/**
 * API Route Handlers ヘルパー関数
 *
 * CORS設定、エラーレスポンス、成功レスポンスのユーティリティ
 */

import { NextResponse } from "next/server";

/**
 * CORS headers configuration
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // 本番環境では具体的なドメインを指定
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * CORS ヘッダーを追加したレスポンスを返す
 */
export function corsResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: CORS_HEADERS,
  });
}

/**
 * 成功レスポンス
 */
export function successResponse(
  data: any,
  message?: string,
  status: number = 200
): NextResponse {
  return corsResponse(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    status
  );
}

/**
 * エラーレスポンス
 */
export function errorResponse(
  error: string,
  status: number = 400
): NextResponse {
  return corsResponse(
    {
      success: false,
      error,
    },
    status
  );
}

/**
 * バリデーションエラー
 */
export function validationError(field: string, message: string): NextResponse {
  return errorResponse(`${field}: ${message}`, 400);
}

/**
 * 404 Not Found
 */
export function notFoundError(resource: string = "Resource"): NextResponse {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * 500 Internal Server Error
 */
export function serverError(error?: any): NextResponse {
  console.error("Server error:", error);
  return errorResponse("Internal server error", 500);
}

/**
 * 401 Unauthorized
 */
export function unauthorizedError(
  message: string = "Unauthorized"
): NextResponse {
  return errorResponse(message, 401);
}

/**
 * OPTIONS リクエストのハンドラー（CORS preflight）
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
